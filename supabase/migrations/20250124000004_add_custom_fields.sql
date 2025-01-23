-- Add ticket_fields to workspace_settings
ALTER TABLE workspace_settings
ADD COLUMN ticket_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Add custom_fields to tickets
ALTER TABLE tickets
ADD COLUMN custom_fields jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add custom_field_changed to ticket event types
ALTER TABLE ticket_events 
DROP CONSTRAINT IF EXISTS ticket_events_event_type_check;

ALTER TABLE ticket_events
ADD CONSTRAINT ticket_events_event_type_check 
CHECK (event_type in (
   'created','status_changed','priority_changed','assigned',
   'unassigned','team_changed','tag_added','tag_removed',
   'message_added','internal_note_added','attachment_added',
   'resolved','reopened','custom_field_changed'
));

-- Create validation function for custom fields
CREATE OR REPLACE FUNCTION validate_ticket_custom_fields()
RETURNS TRIGGER AS $$
DECLARE
  field_config jsonb;
  field_name text;
  field_value jsonb;
  field_type text;
  field_required boolean;
BEGIN
  -- Get field configuration from workspace settings
  SELECT ticket_fields INTO field_config
  FROM workspace_settings
  WHERE workspace_id = auth.current_workspace_id();

  -- If no custom fields configured, any value is valid
  IF field_config IS NULL OR field_config = '[]'::jsonb THEN
    RETURN NEW;
  END IF;

  -- Validate each configured field
  FOR field_name, field_value IN SELECT * FROM jsonb_each(NEW.custom_fields)
  LOOP
    -- Check if field exists in configuration
    IF NOT EXISTS (
      SELECT 1 FROM jsonb_array_elements(field_config) AS f
      WHERE f->>'name' = field_name
    ) THEN
      RAISE EXCEPTION 'Invalid custom field: %', field_name;
    END IF;

    -- Get field type and required status
    SELECT 
      f->>'type' AS type,
      COALESCE((f->>'required')::boolean, false) AS required
    INTO field_type, field_required
    FROM jsonb_array_elements(field_config) AS f
    WHERE f->>'name' = field_name;

    -- Check required fields
    IF field_required AND (field_value IS NULL OR field_value = 'null'::jsonb) THEN
      RAISE EXCEPTION 'Required field % cannot be null', field_name;
    END IF;

    -- Type validation
    CASE field_type
      WHEN 'text' THEN
        IF field_value IS NOT NULL AND jsonb_typeof(field_value) != 'string' THEN
          RAISE EXCEPTION 'Field % must be a string', field_name;
        END IF;
      WHEN 'number' THEN
        IF field_value IS NOT NULL AND jsonb_typeof(field_value) != 'number' THEN
          RAISE EXCEPTION 'Field % must be a number', field_name;
        END IF;
      WHEN 'select' THEN
        IF field_value IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM jsonb_array_elements(
            (SELECT f->'options' FROM jsonb_array_elements(field_config) AS f WHERE f->>'name' = field_name)
          ) AS opt
          WHERE opt = field_value
        ) THEN
          RAISE EXCEPTION 'Invalid option for field %', field_name;
        END IF;
      WHEN 'date' THEN
        IF field_value IS NOT NULL AND (
          jsonb_typeof(field_value) != 'string' OR
          to_timestamp(field_value#>>'{}', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') IS NULL
        ) THEN
          RAISE EXCEPTION 'Field % must be a valid ISO date string', field_name;
        END IF;
    END CASE;
  END LOOP;

  -- Check if all required fields are present
  FOR field_name IN 
    SELECT f->>'name'
    FROM jsonb_array_elements(field_config) AS f
    WHERE COALESCE((f->>'required')::boolean, false) = true
  LOOP
    IF NOT NEW.custom_fields ? field_name THEN
      RAISE EXCEPTION 'Required field % is missing', field_name;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for custom fields validation
CREATE TRIGGER validate_ticket_custom_fields_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_custom_fields();

-- Update ticket_changes_trigger to track custom field changes
CREATE OR REPLACE FUNCTION ticket_changes_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_field_name text;
  v_old_value jsonb;
  v_new_value jsonb;
BEGIN
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'No authenticated user found';
  end if;

  -- Status change with resolution
  if TG_OP = 'UPDATE' and new.status <> old.status then
    if new.status = 'resolved' then
      perform create_ticket_event(
        new.id,
        v_user_id,
        'resolved',
        null,
        new.resolution_note
      );
    elsif old.status = 'resolved' and new.status <> 'resolved' then
      perform create_ticket_event(
        new.id,
        v_user_id,
        'reopened',
        null,
        null
      );
    else
      perform create_ticket_event(
        new.id,
        v_user_id,
        'status_changed',
        old.status,
        new.status
      );
    end if;
  end if;

  -- Priority change
  if TG_OP = 'UPDATE' and new.priority <> old.priority then
    perform create_ticket_event(
      new.id,
      v_user_id,
      'priority_changed',
      old.priority,
      new.priority
    );
  end if;

  -- Assignment change
  if TG_OP = 'UPDATE' then
    if old.assigned_to is null and new.assigned_to is not null then
      perform create_ticket_event(
        new.id,
        v_user_id,
        'assigned',
        null,
        new.assigned_to::text
      );
    elsif old.assigned_to is not null and new.assigned_to is null then
      perform create_ticket_event(
        new.id,
        v_user_id,
        'unassigned',
        old.assigned_to::text,
        null
      );
    elsif old.assigned_to is not null and new.assigned_to is not null
      and old.assigned_to <> new.assigned_to
    then
      perform create_ticket_event(
        new.id,
        v_user_id,
        'assigned',
        old.assigned_to::text,
        new.assigned_to::text
      );
    end if;
  end if;

  -- Team change
  if TG_OP = 'UPDATE'
    and (
        (new.team_id is null and old.team_id is not null)
     or (new.team_id is not null and old.team_id is null)
     or (new.team_id is not null and old.team_id is not null and new.team_id != old.team_id)
    )
  then
    perform create_ticket_event(
      new.id,
      v_user_id,
      'team_changed',
      old.team_id::text,
      new.team_id::text
    );
  end if;

  -- Custom fields changes
  IF TG_OP = 'UPDATE' AND old.custom_fields IS DISTINCT FROM new.custom_fields THEN
    -- Track changes for each field
    FOR v_field_name, v_new_value IN SELECT * FROM jsonb_each(new.custom_fields)
    LOOP
      v_old_value := old.custom_fields->v_field_name;
      IF v_old_value IS DISTINCT FROM v_new_value THEN
        PERFORM create_ticket_event(
          new.id,
          v_user_id,
          'custom_field_changed',
          v_field_name || ':' || COALESCE(v_old_value#>>'{}', 'null'),
          v_field_name || ':' || COALESCE(v_new_value#>>'{}', 'null')
        );
      END IF;
    END LOOP;
  END IF;

  return new;
end;
$$ language plpgsql; 