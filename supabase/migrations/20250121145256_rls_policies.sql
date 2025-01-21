-- Enable RLS on all tables
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_members enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table message_attachments enable row level security;
alter table tags enable row level security;
alter table ticket_tags enable row level security;
alter table ticket_events enable row level security;

-- Helper function to get user role from auth.users securely
create or replace function auth.get_user_role()
returns text as $$
declare
  user_role text;
begin
  select (raw_user_meta_data->>'role')::text into user_role
  from auth.users
  where id = auth.uid();
  return user_role;
end;
$$ language plpgsql security definer;

-- Helper function to check if user is admin or agent
create or replace function auth.is_admin_or_agent()
returns boolean as $$
  select auth.get_user_role() in ('admin', 'agent');
$$ language sql security definer;

-- Helper function to check if user is admin
create or replace function auth.is_admin()
returns boolean as $$
  select auth.get_user_role() = 'admin';
$$ language sql security definer;

-- Helper function to get user's organization_id
create or replace function auth.get_user_organization()
returns uuid as $$
begin
  set local rls.bypass = on;  -- Explicitly bypass RLS for this function
  return (
    select organization_id 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

-- Profiles policies - SIMPLIFIED to break circular dependency
create policy "Users can read their own profile"
  on profiles for select
  using (id = auth.uid());

create policy "Users can create their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can read all profiles"
  on profiles for select
  using (auth.is_admin());

-- Organizations policies
create policy "Admins can manage all organizations"
  on organizations for all
  using (auth.is_admin());

create policy "Agents can read all organizations"
  on organizations for select
  using (auth.is_admin_or_agent());

create policy "Users can read their own organization"
  on organizations for select
  using (id = auth.get_user_organization());

-- Teams policies (internal only)
create policy "Admins can manage all teams"
  on teams for all
  using (auth.is_admin());

create policy "Agents can read all teams"
  on teams for select
  using (auth.is_admin_or_agent());

-- Team members policies
create policy "Admins can manage all team members"
  on team_members for all
  using (auth.is_admin());

create policy "Agents can read all team members"
  on team_members for select
  using (auth.is_admin_or_agent());

-- Tickets policies
create policy "Admins can manage all tickets"
  on tickets for all
  using (auth.is_admin());

create policy "Agents can read/write assigned tickets or team tickets"
  on tickets for all
  using (
    auth.is_admin_or_agent()
    and (
      assigned_to = auth.uid()
      or exists(
        select 1 from team_members
        where team_members.team_id = tickets.team_id
        and team_members.user_id = auth.uid()
      )
    )
  );

create policy "Users can read tickets in their organization"
  on tickets for select
  using (organization_id = auth.get_user_organization());

create policy "Users can create tickets in their organization"
  on tickets for insert
  with check (
    organization_id = auth.get_user_organization()
    and customer_id = auth.uid()
  );

create policy "Users can update their own tickets"
  on tickets for update
  using (customer_id = auth.uid())
  with check (
    organization_id = auth.get_user_organization()
    and (
      assigned_to is null 
      or exists(
        select 1 from profiles
        where id = tickets.assigned_to
        and role in ('admin', 'agent')
      )
    )
    and (
      team_id is null 
      or exists(
        select 1 from teams
        where id = tickets.team_id
      )
    )
  );

-- Ticket messages policies
create policy "Admins and agents can read all messages"
  on ticket_messages for select
  using (auth.is_admin_or_agent());

create policy "Users can read messages on their organization's tickets"
  on ticket_messages for select
  using (
    exists(
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and tickets.organization_id = auth.get_user_organization()
    )
  );

create policy "Users can create messages on their tickets"
  on ticket_messages for insert
  with check (
    exists(
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
      and (
        tickets.organization_id = auth.get_user_organization()
        or auth.is_admin_or_agent()
      )
    )
  );

-- Message attachments policies
create policy "Attachments inherit message permissions"
  on message_attachments for all
  using (
    exists(
      select 1 from ticket_messages
      where ticket_messages.id = message_attachments.message_id
      and exists(
        select 1 from tickets
        where tickets.id = ticket_messages.ticket_id
        and (
          tickets.organization_id = auth.get_user_organization()
          or auth.is_admin_or_agent()
        )
      )
    )
  );

-- Tags policies
create policy "Admins can manage tags"
  on tags for all
  using (auth.is_admin());

create policy "Everyone can read tags"
  on tags for select
  using (true);

-- Ticket tags policies
create policy "Admins and agents can manage ticket tags"
  on ticket_tags for all
  using (auth.is_admin_or_agent());

create policy "Users can read ticket tags"
  on ticket_tags for select
  using (
    exists(
      select 1 from tickets
      where tickets.id = ticket_tags.ticket_id
      and tickets.organization_id = auth.get_user_organization()
    )
  );

-- Ticket events policies
create policy "Admins and agents can read all events"
  on ticket_events for select
  using (auth.is_admin_or_agent());

create policy "Users can read events for their organization's tickets"
  on ticket_events for select
  using (
    exists(
      select 1 from tickets
      where tickets.id = ticket_events.ticket_id
      and tickets.organization_id = auth.get_user_organization()
    )
  );

create policy "Users can create events for their organization's tickets"
  on ticket_events for insert
  with check (
    exists(
      select 1 from tickets
      where tickets.id = ticket_events.ticket_id
      and (
        tickets.organization_id = auth.get_user_organization()
        or auth.is_admin_or_agent()
      )
    )
  );

-- Organization members policies
create policy "Admins can manage all organization members"
  on organization_members for all
  using (auth.is_admin());

create policy "Organization admins can manage their org members"
  on organization_members for all
  using (
    exists(
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
      and om.user_id = auth.uid()
      and om.role = 'admin'
    )
  );

create policy "Users can read their organization members"
  on organization_members for select
  using (organization_id = auth.get_user_organization());

create policy "Only admins and agents can read internal messages"
  on ticket_messages for select
  using (
    (not is_internal) or auth.is_admin_or_agent()
  );

create policy "Only admins and agents can create internal messages"
  on ticket_messages for insert
  with check (
    (not is_internal) or auth.is_admin_or_agent()
  );

-- Function to get authenticated user in trigger context
create or replace function get_authenticated_user() returns uuid as $$
declare
  claims json;
  user_id text;
begin
  -- Get claims with graceful fallback
  begin
    claims := current_setting('request.jwt.claims', true)::json;
  exception when others then
    return null;
  end;
  
  -- Extract user ID with null safety
  user_id := claims ->> 'sub';
  if user_id is null then
    return null;
  end if;
  
  return user_id::uuid;
end;
$$ language plpgsql security definer;

-- Update the ticket changes trigger function to use only get_authenticated_user
create or replace function ticket_changes_trigger() returns trigger as $$
declare
  v_user_id uuid;
begin
  -- Get the authenticated user
  v_user_id := get_authenticated_user();
  if v_user_id is null then
    raise exception 'No authenticated user found';
  end if;

  -- Status change with resolution
  if TG_OP = 'UPDATE' and NEW.status <> OLD.status then
    if NEW.status = 'resolved' then
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'resolved',
        null,
        NEW.resolution_note
      );
    elsif OLD.status = 'resolved' and NEW.status <> 'resolved' then
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'reopened',
        null,
        null
      );
    else
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'status_changed',
        OLD.status,
        NEW.status
      );
    end if;
  end if;

  -- Priority change
  if TG_OP = 'UPDATE' and NEW.priority <> OLD.priority then
    perform create_ticket_event(
      NEW.id,
      v_user_id,
      'priority_changed',
      OLD.priority,
      NEW.priority
    );
  end if;

  -- Assignment change
  if TG_OP = 'UPDATE' then
    if OLD.assigned_to is null and NEW.assigned_to is not null then
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'assigned',
        null,
        NEW.assigned_to::text
      );
    elsif OLD.assigned_to is not null and NEW.assigned_to is null then
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'unassigned',
        OLD.assigned_to::text,
        null
      );
    elsif OLD.assigned_to is not null and NEW.assigned_to is not null 
      and OLD.assigned_to <> NEW.assigned_to then
      perform create_ticket_event(
        NEW.id,
        v_user_id,
        'assigned',
        OLD.assigned_to::text,
        NEW.assigned_to::text
      );
    end if;
  end if;

  -- Team change
  if TG_OP = 'UPDATE' and (
    (NEW.team_id IS NULL AND OLD.team_id IS NOT NULL) OR
    (NEW.team_id IS NOT NULL AND OLD.team_id IS NULL) OR
    (NEW.team_id IS NOT NULL AND OLD.team_id IS NOT NULL AND NEW.team_id != OLD.team_id)
  ) then
    perform create_ticket_event(
      NEW.id,
      v_user_id,
      'team_changed',
      OLD.team_id::text,
      NEW.team_id::text
    );
  end if;

  return NEW;
end;
$$ language plpgsql;

-- Update ticket validation function to allow admins/agents to create tickets for any org
CREATE OR REPLACE FUNCTION validate_ticket()
RETURNS trigger AS $$
BEGIN
    -- For customers, validate they belong to the organization
    -- For admins and agents, allow creating tickets for any organization
    IF EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = NEW.customer_id 
        AND profiles.role = 'customer'
        AND profiles.organization_id != NEW.organization_id
    ) THEN
        RAISE EXCEPTION 'Invalid ticket: Customer must belong to the organization';
    END IF;

    -- Validate assigned agent belongs to team
    IF NEW.team_id IS NOT NULL AND NEW.assigned_to IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM team_members 
            WHERE team_members.team_id = NEW.team_id 
            AND team_members.user_id = NEW.assigned_to
        ) THEN
            RAISE EXCEPTION 'Invalid ticket: Assigned agent must belong to the assigned team';
        END IF;
    END IF;

    -- Validate assignee is agent/admin
    IF NEW.assigned_to IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = NEW.assigned_to 
            AND profiles.role IN ('agent', 'admin')
        ) THEN
            RAISE EXCEPTION 'Invalid ticket: Can only be assigned to agents or admins';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
