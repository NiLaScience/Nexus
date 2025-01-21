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

-- Helper function to check if user is admin or agent
create or replace function auth.is_admin_or_agent()
returns boolean as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'agent')
  );
$$ language sql security definer;

-- Helper function to get user's organization_id
create or replace function auth.get_user_organization()
returns uuid as $$
  select organization_id from public.profiles
  where id = auth.uid();
$$ language sql security definer;

-- Profiles policies
create policy "Users can create their own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Admins and agents can read all profiles"
  on profiles for select
  using (auth.is_admin_or_agent());

create policy "Users can read profiles in their organization"
  on profiles for select
  using (
    organization_id = auth.get_user_organization()
    or id = auth.uid()
  );

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- Organizations policies
create policy "Admins can manage all organizations"
  on organizations for all
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

create policy "Agents can read all organizations"
  on organizations for select
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'agent'
  ));

create policy "Users can read their own organization"
  on organizations for select
  using (id = auth.get_user_organization());

-- Teams policies (internal only)
create policy "Admins can manage all teams"
  on teams for all
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

create policy "Agents can read all teams"
  on teams for select
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'agent'
  ));

-- Team members policies
create policy "Admins can manage all team members"
  on team_members for all
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

create policy "Agents can read all team members"
  on team_members for select
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'agent'
  ));

-- Tickets policies
create policy "Admins can manage all tickets"
  on tickets for all
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

create policy "Agents can read/write assigned tickets or team tickets"
  on tickets for all
  using (
    exists(
      select 1 from profiles
      where id = auth.uid()
      and role = 'agent'
      and (
        tickets.assigned_to = auth.uid()
        or exists(
          select 1 from team_members
          where team_members.team_id = tickets.team_id
          and team_members.user_id = auth.uid()
        )
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
    organization_id = (select organization_id from tickets where id = id)
    and (assigned_to is null or assigned_to = (select assigned_to from tickets where id = id))
    and (team_id is null or team_id = (select team_id from tickets where id = id))
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
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

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

-- Organization members policies
create policy "Admins can manage all organization members"
  on organization_members for all
  using (exists(
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  ));

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
