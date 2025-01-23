-- Create response_templates table
create table response_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    content text not null,
    team_id uuid references teams(id) not null,
    created_by uuid references profiles(id) not null,
    usage_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add RLS policies
alter table response_templates enable row level security;

-- Everyone can view templates for their team
create policy "Users can view their team's templates"
    on response_templates
    for select
    using (
        team_id in (
            select team_id from team_members
            where user_id = auth.uid()
        )
    );

-- Admins can manage all templates
create policy "Admins can manage all templates"
    on response_templates
    for all
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Agents can create templates for their teams
create policy "Agents can create templates for their teams"
    on response_templates
    for insert
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'agent'
        )
        and team_id in (
            select team_id from team_members
            where user_id = auth.uid()
        )
    );

-- Agents can update their own templates or team templates if they're in the team
create policy "Agents can update own templates or team templates"
    on response_templates
    for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'agent'
        )
        and (
            created_by = auth.uid()
            or (
                team_id in (
                    select team_id from team_members
                    where user_id = auth.uid()
                )
            )
        )
    );

-- Agents can delete their own templates or team templates if they're in the team
create policy "Agents can delete own templates or team templates"
    on response_templates
    for delete
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'agent'
        )
        and (
            created_by = auth.uid()
            or (
                team_id in (
                    select team_id from team_members
                    where user_id = auth.uid()
                )
            )
        )
    );

-- Add trigger to update updated_at
create trigger update_response_templates_updated_at
    before update on response_templates
    for each row
    execute function update_updated_at_column(); 