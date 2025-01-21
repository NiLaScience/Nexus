-- Create initial organization
insert into organizations (id, name, domain) values
  ('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'Acme Corp', 'acme.com'),
  ('f1e2d3c4-b5a6-4789-9012-345678901234', 'TechCorp', 'techcorp.com'),
  ('a9b8c7d6-e5f4-4321-8765-432109876543', 'StartupCo', 'startupco.io');

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

-- Create agents
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
  ('d4e5f6a7-b8c9-7654-1234-def123456789', 'john@nexus.com', crypt('agent123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('b1c2d3e4-f5a6-7890-1234-567890123456', 'sarah@nexus.com', crypt('agent123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('e5f6a7b8-c9d0-1234-5678-901234567890', 'mike@nexus.com', crypt('agent123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('a1b2c3d4-e5f6-7890-1234-567890123456', 'emma@nexus.com', crypt('agent123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');

insert into profiles (id, role, full_name) values
  ('d4e5f6a7-b8c9-7654-1234-def123456789', 'agent', 'John Smith'),
  ('b1c2d3e4-f5a6-7890-1234-567890123456', 'agent', 'Sarah Johnson'),
  ('e5f6a7b8-c9d0-1234-5678-901234567890', 'agent', 'Mike Brown'),
  ('a1b2c3d4-e5f6-7890-1234-567890123456', 'agent', 'Emma Wilson');

-- Create customers
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data) values
  ('a7b8c9d0-e1f2-0987-4567-123456789012', 'alice@acme.com', crypt('customer123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('b1c2d3e4-a5b6-7890-1234-567890123456', 'bob@techcorp.com', crypt('customer123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('c1d2e3f4-a5b6-7890-1234-567890123456', 'carol@startupco.io', crypt('customer123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}'),
  ('d1e2f3a4-b5c6-7890-1234-567890123456', 'dave@acme.com', crypt('customer123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}');

insert into profiles (id, role, full_name, organization_id) values
  ('a7b8c9d0-e1f2-0987-4567-123456789012', 'customer', 'Alice Anderson', 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3'),
  ('b1c2d3e4-a5b6-7890-1234-567890123456', 'customer', 'Bob Baker', 'f1e2d3c4-b5a6-4789-9012-345678901234'),
  ('c1d2e3f4-a5b6-7890-1234-567890123456', 'customer', 'Carol Chen', 'a9b8c7d6-e5f4-4321-8765-432109876543'),
  ('d1e2f3a4-b5c6-7890-1234-567890123456', 'customer', 'Dave Davis', 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3');

-- Create teams
insert into teams (id, name) values
  ('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'Support Team'),
  ('f9e8d7c6-b5a4-1234-5678-901234567890', 'Technical Team'),
  ('a9b8c7d6-e5f4-9876-5432-109876543210', 'Customer Success');

-- Assign agents to teams
insert into team_members (team_id, user_id) values
  ('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'd4e5f6a7-b8c9-7654-1234-def123456789'),
  ('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'b1c2d3e4-f5a6-7890-1234-567890123456'),
  ('f9e8d7c6-b5a4-1234-5678-901234567890', 'e5f6a7b8-c9d0-1234-5678-901234567890'),
  ('a9b8c7d6-e5f4-9876-5432-109876543210', 'a1b2c3d4-e5f6-7890-1234-567890123456');

-- Add customers to organizations
insert into organization_members (organization_id, user_id, role) values
  ('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'a7b8c9d0-e1f2-0987-4567-123456789012', 'member'),
  ('f1e2d3c4-b5a6-4789-9012-345678901234', 'b1c2d3e4-a5b6-7890-1234-567890123456', 'member'),
  ('a9b8c7d6-e5f4-4321-8765-432109876543', 'c1d2e3f4-a5b6-7890-1234-567890123456', 'member'),
  ('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'd1e2f3a4-b5c6-7890-1234-567890123456', 'member');

-- Create tags
insert into tags (id, name) values
  ('11111111-1111-4a11-a111-111111111111', 'bug'),
  ('22222222-2222-4a22-a222-222222222222', 'feature'),
  ('33333333-3333-4a33-a333-333333333333', 'urgent'),
  ('44444444-4444-4a44-a444-444444444444', 'question');

-- Create tickets
insert into tickets (
  id, title, description, status, priority, source,
  customer_id, organization_id, assigned_to, team_id
) values
  (
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
  ),
  (
    '66666666-6666-4a66-a666-666666666666',
    'Need help with API integration',
    'Looking for documentation on how to integrate with the REST API',
    'in_progress',
    'medium',
    'email',
    'b1c2d3e4-a5b6-7890-1234-567890123456',
    'f1e2d3c4-b5a6-4789-9012-345678901234',
    'e5f6a7b8-c9d0-1234-5678-901234567890',
    'f9e8d7c6-b5a4-1234-5678-901234567890'
  ),
  (
    '77777777-7777-4a77-a777-777777777777',
    'Feature request: Dark mode',
    'Would love to have a dark mode option in the dashboard',
    'open',
    'low',
    'web',
    'c1d2e3f4-a5b6-7890-1234-567890123456',
    'a9b8c7d6-e5f4-4321-8765-432109876543',
    'a1b2c3d4-e5f6-7890-1234-567890123456',
    'a9b8c7d6-e5f4-9876-5432-109876543210'
  ),
  (
    '88888888-8888-4a88-a888-888888888888',
    'Billing issue',
    'Last invoice seems incorrect',
    'open',
    'high',
    'email',
    'd1e2f3a4-b5c6-7890-1234-567890123456',
    'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
    'b1c2d3e4-f5a6-7890-1234-567890123456',
    'a1b2c3d4-e5f6-4321-8901-abcdef123456'
  );

-- Add tags to tickets
insert into ticket_tags (ticket_id, tag_id) values
  ('55555555-5555-4a55-a555-555555555555', '11111111-1111-4a11-a111-111111111111'),
  ('55555555-5555-4a55-a555-555555555555', '33333333-3333-4a33-a333-333333333333'),
  ('66666666-6666-4a66-a666-666666666666', '44444444-4444-4a44-a444-444444444444'),
  ('77777777-7777-4a77-a777-777777777777', '22222222-2222-4a22-a222-222222222222'),
  ('88888888-8888-4a88-a888-888888888888', '33333333-3333-4a33-a333-333333333333');
