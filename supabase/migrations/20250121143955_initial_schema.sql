-- Profiles table (extends auth.users)
create table profiles (
    id uuid primary key references auth.users(id),
    role text not null check (role in ('customer', 'agent', 'admin')),
    full_name text not null,
    avatar_url text,
    organization_id uuid,  -- Will be set after organizations table is created
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Organizations table (for client companies)
create table organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    domain text unique,  -- For email domain verification
    settings jsonb default '{}',  -- For org-specific settings
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Organization members junction table
create table organization_members (
    organization_id uuid references organizations(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    role text not null check (role in ('member', 'admin')),  -- Role within the organization
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

-- Function to validate organization member
create or replace function validate_organization_member()
returns trigger as $$
begin
    if not exists (
        select 1 from profiles 
        where profiles.id = NEW.user_id 
        and (
            profiles.organization_id = NEW.organization_id 
            or profiles.role in ('agent', 'admin')
        )
    ) then
        raise exception 'Invalid organization member: User must belong to organization or be an agent/admin';
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Trigger for organization member validation
create trigger validate_organization_member_trigger
    before insert or update on organization_members
    for each row
    execute function validate_organization_member();

-- Add foreign key to profiles after organizations table is created
alter table profiles
add constraint profiles_organization_id_fkey
foreign key (organization_id) references organizations(id);

-- Teams table (for internal support teams)
create table teams (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Team members junction table (for support agents)
create table team_members (
    team_id uuid references teams(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (team_id, user_id)
);

-- Function to validate team member
create or replace function validate_team_member()
returns trigger as $$
begin
    if not exists (
        select 1 from profiles 
        where profiles.id = NEW.user_id 
        and profiles.role in ('agent', 'admin')
    ) then
        raise exception 'Invalid team member: User must be an agent or admin';
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Trigger for team member validation
create trigger validate_team_member_trigger
    before insert or update on team_members
    for each row
    execute function validate_team_member();

-- Tags table
create table tags (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- Tickets table
create table tickets (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    status text not null check (status in ('open', 'in_progress', 'resolved', 'closed')),
    priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
    source text not null check (source in ('email', 'web', 'chat', 'phone', 'api')),
    resolution text,
    resolution_note text,
    customer_id uuid not null references profiles(id),
    organization_id uuid not null references organizations(id),
    assigned_to uuid references profiles(id),
    team_id uuid references teams(id),
    created_at timestamptz not null default now()
);

-- Function to validate ticket
create or replace function validate_ticket()
returns trigger as $$
begin
    -- Validate customer belongs to organization
    if not exists (
        select 1 from profiles 
        where profiles.id = NEW.customer_id 
        and profiles.organization_id = NEW.organization_id
    ) then
        raise exception 'Invalid ticket: Customer must belong to the organization';
    end if;

    -- Validate assigned agent belongs to team
    if NEW.team_id is not null and NEW.assigned_to is not null then
        if not exists (
            select 1 from team_members 
            where team_members.team_id = NEW.team_id 
            and team_members.user_id = NEW.assigned_to
        ) then
            raise exception 'Invalid ticket: Assigned agent must belong to the assigned team';
        end if;
    end if;

    -- Validate assignee is agent/admin
    if NEW.assigned_to is not null then
        if not exists (
            select 1 from profiles 
            where profiles.id = NEW.assigned_to 
            and profiles.role in ('agent', 'admin')
        ) then
            raise exception 'Invalid ticket: Can only be assigned to agents or admins';
        end if;
    end if;

    return NEW;
end;
$$ language plpgsql;

-- Trigger for ticket validation
create trigger validate_ticket_trigger
    before insert or update on tickets
    for each row
    execute function validate_ticket();

-- Ticket messages table (for conversation history)
create table ticket_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references tickets(id) on delete cascade,
    author_id uuid not null references profiles(id),
    content text not null,
    source text not null check (source in ('email', 'web', 'chat', 'phone', 'api')),
    is_internal boolean not null default false,
    created_at timestamptz not null default now()
);

-- Message attachments table
create table message_attachments (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references ticket_messages(id) on delete cascade,
    name text not null,
    size bigint not null,
    mime_type text not null,
    storage_path text not null,
    created_at timestamptz not null default now()
);

-- Create index for message attachments
create index message_attachments_message_id_idx on message_attachments(message_id);

-- Ticket tags junction table
create table ticket_tags (
    ticket_id uuid references tickets(id) on delete cascade,
    tag_id uuid references tags(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (ticket_id, tag_id)
);

-- Ticket events table (for timeline)
create table ticket_events (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references tickets(id) on delete cascade,
    actor_id uuid not null references profiles(id),
    event_type text not null check (
        event_type in (
            'created',
            'status_changed',
            'priority_changed',
            'assigned',
            'unassigned',
            'team_changed',
            'tag_added',
            'tag_removed',
            'message_added',
            'internal_note_added',
            'attachment_added',
            'resolved',
            'reopened'
        )
    ),
    old_value text,
    new_value text,
    created_at timestamptz not null default now()
);

-- Create index for ticket events
create index ticket_events_ticket_id_idx on ticket_events(ticket_id);
create index ticket_events_created_at_idx on ticket_events(created_at);

-- Function to create ticket event
create or replace function create_ticket_event(
    p_ticket_id uuid,
    p_actor_id uuid,
    p_event_type text,
    p_old_value text default null,
    p_new_value text default null
) returns uuid as $$
declare
    v_event_id uuid;
begin
    insert into ticket_events (ticket_id, actor_id, event_type, old_value, new_value)
    values (p_ticket_id, p_actor_id, p_event_type, p_old_value, p_new_value)
    returning id into v_event_id;
    
    return v_event_id;
end;
$$ language plpgsql;

-- Trigger function for ticket changes
create or replace function ticket_changes_trigger() returns trigger as $$
begin
    -- Status change with resolution
    if TG_OP = 'UPDATE' and NEW.status <> OLD.status then
        if NEW.status = 'resolved' then
            perform create_ticket_event(
                NEW.id,
                auth.uid(),
                'resolved',
                null,
                NEW.resolution_note
            );
        elsif OLD.status = 'resolved' and NEW.status <> 'resolved' then
            perform create_ticket_event(
                NEW.id,
                auth.uid(),
                'reopened',
                null,
                null
            );
        else
            perform create_ticket_event(
                NEW.id,
                auth.uid(),
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
            auth.uid(),
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
                auth.uid(),
                'assigned',
                null,
                NEW.assigned_to::text
            );
        elsif OLD.assigned_to is not null and NEW.assigned_to is null then
            perform create_ticket_event(
                NEW.id,
                auth.uid(),
                'unassigned',
                OLD.assigned_to::text,
                null
            );
        elsif OLD.assigned_to is not null and NEW.assigned_to is not null 
            and OLD.assigned_to <> NEW.assigned_to then
            perform create_ticket_event(
                NEW.id,
                auth.uid(),
                'assigned',
                OLD.assigned_to::text,
                NEW.assigned_to::text
            );
        end if;
    end if;

    -- Team change
    if TG_OP = 'UPDATE' and coalesce(NEW.team_id, '') <> coalesce(OLD.team_id, '') then
        perform create_ticket_event(
            NEW.id,
            auth.uid(),
            'team_changed',
            OLD.team_id::text,
            NEW.team_id::text
        );
    end if;

    return NEW;
end;
$$ language plpgsql;

-- Trigger for ticket changes
create trigger ticket_changes_trigger
    after update on tickets
    for each row
    execute function ticket_changes_trigger();

-- Trigger function for ticket tags
create or replace function ticket_tags_trigger() returns trigger as $$
begin
    if TG_OP = 'INSERT' then
        perform create_ticket_event(
            NEW.ticket_id,
            auth.uid(),
            'tag_added',
            null,
            (select name from tags where id = NEW.tag_id)
        );
    elsif TG_OP = 'DELETE' then
        perform create_ticket_event(
            OLD.ticket_id,
            auth.uid(),
            'tag_removed',
            (select name from tags where id = OLD.tag_id),
            null
        );
    end if;
    return coalesce(NEW, OLD);
end;
$$ language plpgsql;

-- Triggers for ticket tags
create trigger ticket_tags_insert_trigger
    after insert on ticket_tags
    for each row
    execute function ticket_tags_trigger();

create trigger ticket_tags_delete_trigger
    after delete on ticket_tags
    for each row
    execute function ticket_tags_trigger();

-- Indexes for better query performance
create index tickets_customer_id_idx on tickets(customer_id);
create index tickets_organization_id_idx on tickets(organization_id);
create index tickets_assigned_to_idx on tickets(assigned_to);
create index tickets_team_id_idx on tickets(team_id);
create index tickets_status_idx on tickets(status);
create index tickets_priority_idx on tickets(priority);
create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id);
create index profiles_organization_id_idx on profiles(organization_id);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
    before update on profiles
    for each row
    execute function update_updated_at_column();

create trigger update_organizations_updated_at
    before update on organizations
    for each row
    execute function update_updated_at_column();

create trigger update_teams_updated_at
    before update on teams
    for each row
    execute function update_updated_at_column();

-- Additional trigger for message events
create or replace function ticket_message_trigger() returns trigger as $$
begin
    perform create_ticket_event(
        NEW.ticket_id,
        NEW.author_id,
        case when NEW.is_internal then 'internal_note_added' else 'message_added' end,
        null,
        NEW.id::text
    );
    return NEW;
end;
$$ language plpgsql;

create trigger ticket_message_insert_trigger
    after insert on ticket_messages
    for each row
    execute function ticket_message_trigger();
