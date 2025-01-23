-- Create auth.current_workspace_id() function
CREATE OR REPLACE FUNCTION auth.current_workspace_id()
RETURNS uuid AS $$
BEGIN
  -- For now, return a default workspace ID
  -- In a real multi-workspace setup, this would get the current workspace from JWT claims
  RETURN '00000000-0000-0000-0000-000000000000'::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create workspace_settings table
CREATE TABLE workspace_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL UNIQUE,
    ticket_statuses jsonb NOT NULL DEFAULT '[
        {"name": "open", "display": "Open", "color": "#ff0000"},
        {"name": "in_progress", "display": "In Progress", "color": "#ffa500"},
        {"name": "resolved", "display": "Resolved", "color": "#00ff00"},
        {"name": "closed", "display": "Closed", "color": "#808080"}
    ]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Workspace admins can manage settings"
    ON workspace_settings
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Workspace users can view settings"
    ON workspace_settings
    FOR SELECT
    USING (workspace_id = auth.current_workspace_id());

-- Remove status check constraint from tickets
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check;

-- Add validation trigger for ticket status
CREATE OR REPLACE FUNCTION validate_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if status exists in workspace settings
  IF EXISTS (
    SELECT 1 FROM workspace_settings
    WHERE workspace_id = auth.current_workspace_id()
    AND ticket_statuses @> jsonb_build_array(jsonb_build_object('name', NEW.status))
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Invalid ticket status for workspace';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_ticket_status_trigger
  BEFORE INSERT OR UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_status();

-- Add updated_at trigger
CREATE TRIGGER update_workspace_settings_timestamp
    BEFORE UPDATE ON workspace_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default workspace settings
INSERT INTO workspace_settings (workspace_id, ticket_statuses)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '[
        {"name": "open", "display": "Open", "color": "#ff0000"},
        {"name": "in_progress", "display": "In Progress", "color": "#ffa500"},
        {"name": "resolved", "display": "Resolved", "color": "#00ff00"},
        {"name": "closed", "display": "Closed", "color": "#808080"}
    ]'::jsonb
); 