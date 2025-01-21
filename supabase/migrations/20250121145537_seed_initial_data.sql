-- Create initial organization
insert into organizations (id, name, domain) values
  ('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'Acme Corp', 'acme.com');

-- Create admin user
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values (
  'c9c90fbc-e3f7-4109-8a46-2b15e0d51c4e',
  'admin@nexus.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}'
);

insert into profiles (id, role, full_name)
values (
  'c9c90fbc-e3f7-4109-8a46-2b15e0d51c4e',
  'admin',
  'System Admin'
);

-- Create one agent
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
  ('d4e5f6a7-b8c9-7654-1234-def123456789', 'agent@nexus.com', crypt('agent123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');

insert into profiles (id, role, full_name) values
  ('d4e5f6a7-b8c9-7654-1234-def123456789', 'agent', 'John Agent');

-- Create one customer
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
  ('a7b8c9d0-e1f2-0987-4567-123456789012', 'customer@acme.com', crypt('customer123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');

insert into profiles (id, role, full_name, organization_id) values
  ('a7b8c9d0-e1f2-0987-4567-123456789012', 'customer', 'Alice Customer', 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3');

-- Create one team
insert into teams (id, name) values
  ('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'Support Team');

-- Assign agent to team
insert into team_members (team_id, user_id) values
  ('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'd4e5f6a7-b8c9-7654-1234-def123456789');

-- Add customer to organization
insert into organization_members (organization_id, user_id, role) values
  ('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'a7b8c9d0-e1f2-0987-4567-123456789012', 'member');

-- Create one tag
insert into tags (id, name) values
  ('11111111-1111-4a11-a111-111111111111', 'bug');

-- Create one ticket
insert into tickets (
  id, title, description, status, priority, source,
  customer_id, organization_id, assigned_to, team_id
) values (
  '55555555-5555-4a55-a555-555555555555',
  'Cannot access dashboard',
  'Getting 403 error when trying to access the main dashboard',
  'open',
  'high',
  'web',
  'a7b8c9d0-e1f2-0987-4567-123456789012',
  'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
  'd4e5f6a7-b8c9-7654-1234-def123456789',
  'a1b2c3d4-e5f6-4321-8901-abcdef123456'
);
