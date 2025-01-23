--
-- 1) EXTENSIONS (optional, depending on your environment)
--
create extension if not exists pgcrypto;  -- for crypt() usage, if needed

--
-- 2) TABLES & RELATIONS
--
create table profiles (
    id uuid primary key references auth.users(id),
    role text not null check (role in ('customer', 'agent', 'admin')),
    full_name text not null,
    avatar_url text,
    organization_id uuid,  -- references organizations.id after organizations table is created
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    domain text unique,  -- For email domain-based lookups
    settings jsonb default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_organization_id_fkey
    foreign key (organization_id) references organizations(id);

create table organization_members (
    organization_id uuid references organizations(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    role text not null check (role in ('member', 'admin')),  -- role within org
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

--
-- Validate membership: user must either belong to the same organization or be an agent/admin
--
create or replace function validate_organization_member()
returns trigger as $$
begin
    if not exists (
        select 1 
        from profiles 
        where profiles.id = new.user_id
          and (
               profiles.organization_id = new.organization_id
               or profiles.role in ('agent','admin')
          )
    )
    then
        raise exception 'Invalid organization member: user must belong to organization or be agent/admin';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger validate_organization_member_trigger
  before insert or update
  on organization_members
  for each row
  execute function validate_organization_member();

create table teams (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table team_members (
    team_id uuid references teams(id) on delete cascade,
    user_id uuid references profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (team_id, user_id)
);

--
-- Only agent/admin can be inserted into a team
--
create or replace function validate_team_member()
returns trigger as $$
begin
    if not exists (
       select 1 
       from profiles 
       where profiles.id = new.user_id 
         and profiles.role in ('agent', 'admin')
    )
    then
       raise exception 'Invalid team member: user must be agent or admin';
    end if;
    return new;
end;
$$ language plpgsql;

create trigger validate_team_member_trigger
  before insert or update
  on team_members
  for each row
  execute function validate_team_member();

create table tags (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

create table tickets (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text not null,
    status text not null check (status in ('open','in_progress','resolved','closed')),
    priority text not null check (priority in ('low','medium','high','urgent')),
    source text not null check (source in ('email','web','chat','phone','api')),
    resolution text,
    resolution_note text,
    customer_id uuid not null references profiles(id),
    organization_id uuid not null references organizations(id),
    assigned_to uuid references profiles(id),
    team_id uuid references teams(id),
    created_at timestamptz not null default now()
);

--
-- Final validate_ticket function:
-- (incorporates the logic that customers must belong to the org, 
--  but admin/agent may create tickets for any org)
--
create or replace function validate_ticket()
returns trigger as $$
begin
    -- If the user is a customer, they must belong to the same org.
    if exists (
        select 1 from profiles
        where profiles.id = new.customer_id
          and profiles.role = 'customer'
          and profiles.organization_id != new.organization_id
    ) then
        raise exception 'Invalid ticket: Customer must belong to the organization';
    end if;

    -- Validate assigned agent belongs to team
    if new.team_id is not null and new.assigned_to is not null then
        if not exists (
            select 1 
            from team_members
            where team_members.team_id = new.team_id
              and team_members.user_id = new.assigned_to
        ) then
            raise exception 'Invalid ticket: Assigned agent must belong to assigned team';
        end if;
    end if;

    -- Validate assignee is agent/admin
    if new.assigned_to is not null then
        if not exists (
            select 1 
            from profiles
            where profiles.id = new.assigned_to
              and profiles.role in ('agent','admin')
        ) then
            raise exception 'Invalid ticket: Can only be assigned to agents or admins';
        end if;
    end if;

    return new;
end;
$$ language plpgsql;

create trigger validate_ticket_trigger
  before insert or update
  on tickets
  for each row
  execute function validate_ticket();

create table ticket_messages (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references tickets(id) on delete cascade,
    author_id uuid not null references profiles(id),
    content text not null,
    source text not null check (source in ('email','web','chat','phone','api')),
    is_internal boolean not null default false,
    created_at timestamptz not null default now()
);

create table message_attachments (
    id uuid primary key default gen_random_uuid(),
    message_id uuid not null references ticket_messages(id) on delete cascade,
    name text not null,
    size bigint not null,
    mime_type text not null,
    storage_path text not null,
    created_at timestamptz not null default now()
);

create index message_attachments_message_id_idx
  on message_attachments(message_id);

create table ticket_tags (
    ticket_id uuid references tickets(id) on delete cascade,
    tag_id uuid references tags(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (ticket_id, tag_id)
);

create table ticket_events (
    id uuid primary key default gen_random_uuid(),
    ticket_id uuid not null references tickets(id) on delete cascade,
    actor_id uuid not null references profiles(id),
    event_type text not null check (event_type in (
       'created','status_changed','priority_changed','assigned',
       'unassigned','team_changed','tag_added','tag_removed',
       'message_added','internal_note_added','attachment_added',
       'resolved','reopened'
    )),
    old_value text,
    new_value text,
    created_at timestamptz not null default now()
);

--
-- 3) INDEXES
--
create index tickets_customer_id_idx on tickets(customer_id);
create index tickets_organization_id_idx on tickets(organization_id);
create index tickets_assigned_to_idx on tickets(assigned_to);
create index tickets_team_id_idx on tickets(team_id);
create index tickets_status_idx on tickets(status);
create index tickets_priority_idx on tickets(priority);
create index ticket_messages_ticket_id_idx on ticket_messages(ticket_id);
create index profiles_organization_id_idx on profiles(organization_id);

--
-- 4) Utility to update updated_at columns
--
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

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

--
-- 5) TICKET EVENT FUNCTIONS & TRIGGERS
--
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

--
-- We'll store the ticket updates in ticket_events. This final version references
-- an authenticated user function so that RLS doesn't break.
--
-- 5a) We need get_authenticated_user() to safely handle user-IDs in triggers.
--
create or replace function get_authenticated_user() 
returns uuid as $$
declare
  claims json;
  user_id text;
begin
  -- gracefully fallback if no claims
  begin
    claims := current_setting('request.jwt.claims', true)::json;
  exception when others then
    return null;
  end;
  
  user_id := claims ->> 'sub';
  if user_id is null then
    return null;
  end if;
  
  return user_id::uuid;
end;
$$ language plpgsql security definer;

--
-- 5b) The final ticket_changes_trigger referencing get_authenticated_user()
--
create or replace function ticket_changes_trigger()
returns trigger as $$
declare
  v_user_id uuid;
begin
  v_user_id := get_authenticated_user();
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

  return new;
end;
$$ language plpgsql;

create trigger ticket_changes_trigger
  after update
  on tickets
  for each row
  execute function ticket_changes_trigger();

--
-- 5c) Ticket messages trigger => log an event
--
create or replace function ticket_message_trigger()
returns trigger as $$
begin
  perform create_ticket_event(
    new.ticket_id,
    new.author_id,
    case when new.is_internal then 'internal_note_added' else 'message_added' end,
    null,
    new.id::text
  );
  return new;
end;
$$ language plpgsql;

create trigger ticket_message_insert_trigger
  after insert
  on ticket_messages
  for each row
  execute function ticket_message_trigger();

--
-- 5d) Ticket tags trigger (final version) 
-- that works for seeding (if auth.uid() is null) by falling back to some system user
--
create or replace function ticket_tags_trigger()
returns trigger as $$
declare
  v_actor_id uuid;
begin
  -- fallback to an admin or agent if no auth.uid() present
  select id
    into v_actor_id
    from profiles
    where role = 'admin'
    limit 1;

  if v_actor_id is null then
      select id into v_actor_id
      from profiles
      where role = 'agent'
      limit 1;
  end if;

  if v_actor_id is null then
      raise exception 'No valid actor found for ticket event';
  end if;

  if TG_OP = 'INSERT' then
    perform create_ticket_event(
      new.ticket_id,
      coalesce(get_authenticated_user(), v_actor_id),
      'tag_added',
      null,
      (select name from tags where id = new.tag_id)
    );
  elsif TG_OP = 'DELETE' then
    perform create_ticket_event(
      old.ticket_id,
      coalesce(get_authenticated_user(), v_actor_id),
      'tag_removed',
      (select name from tags where id = old.tag_id),
      null
    );
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger ticket_tags_insert_trigger
  after insert
  on ticket_tags
  for each row
  execute function ticket_tags_trigger();

create trigger ticket_tags_delete_trigger
  after delete
  on ticket_tags
  for each row
  execute function ticket_tags_trigger();

--
-- 6) HELPER FUNCTIONS (for RLS)
--
-- Pull the user role out of auth.users
--
create or replace function auth.get_user_role()
returns text as $$
declare
  user_role text;
begin
  select (raw_user_meta_data->>'role')::text
    into user_role
    from auth.users
    where id = auth.uid();

  return user_role;
end;
$$ language plpgsql security definer;

create or replace function auth.is_admin_or_agent()
returns boolean as $$
  select auth.get_user_role() in ('admin','agent');
$$ language sql security definer;

create or replace function auth.is_admin()
returns boolean as $$
  select auth.get_user_role() = 'admin';
$$ language sql security definer;

--
-- Let us query a user's organization_id while bypassing RLS
--
create or replace function auth.get_user_organization()
returns uuid as $$
begin
  set local rls.bypass = on;
  return (
    select organization_id 
    from public.profiles 
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer;

--
-- 7) ENABLE RLS on all relevant tables
--
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

--
-- 8) ROW LEVEL SECURITY POLICIES
--    (Final, consolidated versions for each table)
--

--== PROFILES ==--
-- Drop any old policies first (if needed). Then re-add final.
drop policy if exists "Users can read their own profile" on profiles;
drop policy if exists "Users can create their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Admins can read all profiles" on profiles;

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

--== ORGANIZATIONS ==--
create policy "Admins can manage all organizations"
  on organizations for all
  using (auth.is_admin());

create policy "Agents can read all organizations"
  on organizations for select
  using (auth.is_admin_or_agent());

create policy "Users can read their own organization"
  on organizations for select
  using (id = auth.get_user_organization());

--== ORGANIZATION_MEMBERS ==--
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

--== TEAMS ==--
create policy "Admins can manage all teams"
  on teams for all
  using (auth.is_admin());

create policy "Agents can read all teams"
  on teams for select
  using (auth.is_admin_or_agent());

--== TEAM_MEMBERS ==--
create policy "Admins can manage all team members"
  on team_members for all
  using (auth.is_admin());

create policy "Agents can read all team members"
  on team_members for select
  using (auth.is_admin_or_agent());

--== TICKETS ==--
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
             select 1
             from team_members
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

--== TICKET_MESSAGES ==--
create policy "Admins and agents can read all messages"
  on ticket_messages for select
  using (auth.is_admin_or_agent());

create policy "Users can read messages on their organization's tickets"
  on ticket_messages for select
  using (
    exists(
      select 1 
      from tickets
      where tickets.id = ticket_messages.ticket_id
        and tickets.organization_id = auth.get_user_organization()
    )
  );

create policy "Users can create messages on their tickets"
  on ticket_messages for insert
  with check (
    exists(
      select 1
      from tickets
      where tickets.id = ticket_messages.ticket_id
        and (
          tickets.organization_id = auth.get_user_organization()
          or auth.is_admin_or_agent()
        )
    )
  );

-- Add an extra policy for "internal" messages
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

--== MESSAGE_ATTACHMENTS ==--
create policy "Users can read attachments for messages they can access"
on message_attachments for select
using (
  exists(
    select 1 
    from ticket_messages tm
    join tickets t on t.id = tm.ticket_id
    where tm.id = message_attachments.message_id
    and (
      -- User belongs to the organization
      t.organization_id = auth.get_user_organization()
      -- Or is admin/agent
      or auth.is_admin_or_agent()
    )
  )
);

create policy "Users can create attachments for messages they own"
on message_attachments for insert
with check (
  exists(
    select 1 
    from ticket_messages tm
    join tickets t on t.id = tm.ticket_id
    where tm.id = message_attachments.message_id
    and (
      -- Message author
      tm.author_id = auth.uid()
      -- Or admin/agent
      or auth.is_admin_or_agent()
    )
  )
);

create policy "Users can delete attachments for messages they own"
on message_attachments for delete
using (
  exists(
    select 1 
    from ticket_messages tm
    join tickets t on t.id = tm.ticket_id
    where tm.id = message_attachments.message_id
    and (
      -- Message author
      tm.author_id = auth.uid()
      -- Or admin/agent
      or auth.is_admin_or_agent()
    )
  )
);

--== TAGS ==--
create policy "Admins can manage tags"
  on tags for all
  using (auth.is_admin());

create policy "Everyone can read tags"
  on tags for select
  using (true);

--== TICKET_TAGS ==--
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

--== TICKET_EVENTS ==--
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

--
-- 9) STORAGE RLS SETUP (for "ticket-attachments" bucket)
--
--   a) Create the bucket if it doesn't exist
--
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', false)
on conflict (id) do nothing;

--   b) Enable RLS on storage.objects table
alter table storage.objects enable row level security;

--   c) Policy: read attachments if in user's org or user is the owner
create policy "Users can read attachments from their organization's tickets"
on storage.objects for select
using (
  bucket_id::text = 'ticket-attachments'
  and (
    -- Admin or agent can read any
    auth.is_admin_or_agent()
    or
    -- OR normal user can read if it's in their org's ticket
    exists (
      select 1
      from public.tickets t
      join public.ticket_messages tm on tm.ticket_id = t.id
      join public.message_attachments ma on ma.message_id = tm.id
      where t.organization_id = auth.get_user_organization()
        and storage.foldername(name)::text = t.id::text
    )
    or
    -- or they are the owner of an "unlinked" upload
    auth.uid() = owner
  )
);

--   d) Policy: allow uploads if user is authenticated, either to a "temp" or to a valid ticket 
create policy "Allow authenticated uploads to ticket-attachments"
on storage.objects for insert
with check (
  bucket_id::text = 'ticket-attachments'
  and auth.role() in ('authenticated', 'service_role')
  and (
    -- Admins or agents can always upload
    auth.is_admin_or_agent()
    or
    -- OR user is uploading to a 'temp' folder
    storage.foldername(name) is null
    or
    -- OR user is uploading to a ticket in their own org
    exists (
      select 1
      from public.tickets t
      where t.organization_id = auth.get_user_organization()
        and storage.foldername(name)::text = t.id::text
    )
  )
);

--   e) Policy: allow users to delete their own attachments
create policy "Users can delete their own attachments"
on storage.objects for delete
using (
  bucket_id::text = 'ticket-attachments'
  and (
    -- Admin or agent can delete any
    auth.is_admin_or_agent()
    or
    -- or user is the original owner
    auth.uid() = owner
    or
    -- or it's associated with a ticket in user's org if they are the customer
    exists (
      select 1
      from public.tickets t
      join public.ticket_messages tm on tm.ticket_id = t.id
      join public.message_attachments ma on ma.message_id = tm.id
      where (t.customer_id = auth.uid())
        and storage.foldername(name)::text = t.id::text
    )
  )
);

-- done!
