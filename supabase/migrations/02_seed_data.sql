-- 1) Ensure the default "Nexus Support" org exists, capturing its ID
DO $$
DECLARE
  default_org_id uuid;
BEGIN
  INSERT INTO organizations (name, domain, description)
  VALUES ('Nexus Support', 'nexus.com', 'Default org for support staff')
  ON CONFLICT (domain) DO UPDATE 
    SET name = EXCLUDED.name,
        description = EXCLUDED.description
  RETURNING id INTO default_org_id;

  -- For any admin/agent with a null org, set them to the default:
  UPDATE profiles
  SET organization_id = default_org_id
  WHERE role in ('admin', 'agent')
    AND (organization_id IS NULL OR organization_id != default_org_id);

  RAISE NOTICE 'Default organization is %', default_org_id;
END $$;

-- 2) Insert sample organizations
insert into organizations (id, name, domain)
values
('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'Acme Corp', 'acme.com')
on conflict (id) do nothing;

insert into organizations (id, name, domain)
values
('f1e2d3c4-b5a6-4789-9012-345678901234', 'TechCorp', 'techcorp.com')
on conflict (id) do nothing;

insert into organizations (id, name, domain)
values
('a9b8c7d6-e5f4-4321-8765-432109876543', 'StartupCo', 'startupco.io')
on conflict (id) do nothing;

-- 3) Create an admin user in auth.users
insert into auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data)
values (
  'c9c90fbc-e3f7-4109-8a46-2b15e0d51c4e',
  'admin@nexus.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"role":"admin"}',
  '{}'
)
on conflict (id) do nothing;

insert into profiles (id, role, full_name)
values (
  'c9c90fbc-e3f7-4109-8a46-2b15e0d51c4e', 
  'admin',
  'System Admin'
)
on conflict (id) do nothing;

-- 4) Create agents
insert into auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data)
values
('d4e5f6a7-b8c9-7654-1234-def123456789',
 'john@nexus.com',
 crypt('agent123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"agent"}',
 '{}'
),
('b1c2d3e4-f5a6-7890-1234-567890123456',
 'sarah@nexus.com',
 crypt('agent123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"agent"}',
 '{}'
),
('e5f6a7b8-c9d0-1234-5678-901234567890',
 'mike@nexus.com',
 crypt('agent123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"agent"}',
 '{}'
),
('a1b2c3d4-e5f6-7890-1234-567890123456',
 'emma@nexus.com',
 crypt('agent123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"agent"}',
 '{}'
)
on conflict (id) do nothing;

insert into profiles (id, role, full_name)
values
('d4e5f6a7-b8c9-7654-1234-def123456789', 'agent', 'John Smith'),
('b1c2d3e4-f5a6-7890-1234-567890123456', 'agent', 'Sarah Johnson'),
('e5f6a7b8-c9d0-1234-5678-901234567890', 'agent', 'Mike Brown'),
('a1b2c3d4-e5f6-7890-1234-567890123456', 'agent', 'Emma Wilson')
on conflict (id) do nothing;

-- 5) Create customers
insert into auth.users (id, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data)
values
('a7b8c9d0-e1f2-0987-4567-123456789012',
 'alice@acme.com',
 crypt('customer123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"customer"}',
 '{}'
),
('b1c2d3e4-a5b6-7890-1234-567890123456',
 'bob@techcorp.com',
 crypt('customer123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"customer"}',
 '{}'
),
('c1d2e3f4-a5b6-7890-1234-567890123456',
 'carol@startupco.io',
 crypt('customer123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"customer"}',
 '{}'
),
('d1e2f3a4-b5c6-7890-1234-567890123456',
 'dave@acme.com',
 crypt('customer123', gen_salt('bf')),
 now(),
 '{"provider":"email","providers":["email"],"role":"customer"}',
 '{}'
)
on conflict (id) do nothing;

insert into profiles (id, role, full_name, organization_id)
values
('a7b8c9d0-e1f2-0987-4567-123456789012', 'customer', 'Alice Anderson',
  'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3'),
('b1c2d3e4-a5b6-7890-1234-567890123456', 'customer', 'Bob Baker',
  'f1e2d3c4-b5a6-4789-9012-345678901234'),
('c1d2e3f4-a5b6-7890-1234-567890123456', 'customer', 'Carol Chen',
  'a9b8c7d6-e5f4-4321-8765-432109876543'),
('d1e2f3a4-b5c6-7890-1234-567890123456', 'customer', 'Dave Davis',
  'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3')
on conflict (id) do nothing;

-- 6) Create teams
insert into teams (id, name)
values
('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'Support Team'),
('f9e8d7c6-b5a4-1234-5678-901234567890', 'Technical Team'),
('a9b8c7d6-e5f4-9876-5432-109876543210', 'Customer Success')
on conflict (id) do nothing;

-- 7) Assign agents to teams
insert into team_members (team_id, user_id)
values
('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'd4e5f6a7-b8c9-7654-1234-def123456789'),
('a1b2c3d4-e5f6-4321-8901-abcdef123456', 'b1c2d3e4-f5a6-7890-1234-567890123456'),
('f9e8d7c6-b5a4-1234-5678-901234567890', 'e5f6a7b8-c9d0-1234-5678-901234567890'),
('a9b8c7d6-e5f4-9876-5432-109876543210', 'a1b2c3d4-e5f6-7890-1234-567890123456')
on conflict do nothing;

-- 8) Add customers to organizations
insert into organization_members (organization_id, user_id, role)
values
('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'a7b8c9d0-e1f2-0987-4567-123456789012','member'),
('f1e2d3c4-b5a6-4789-9012-345678901234', 'b1c2d3e4-a5b6-7890-1234-567890123456','member'),
('a9b8c7d6-e5f4-4321-8765-432109876543', 'c1d2e3f4-a5b6-7890-1234-567890123456','member'),
('d0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3', 'd1e2f3a4-b5c6-7890-1234-567890123456','member')
on conflict do nothing;

-- 9) Create tags
insert into tags (id, name) values
('11111111-1111-4a11-a111-111111111111', 'bug'),
('22222222-2222-4a22-a222-222222222222', 'feature'),
('33333333-3333-4a33-a333-333333333333', 'urgent'),
('44444444-4444-4a44-a444-444444444444', 'question')
on conflict do nothing;

-- 10) Create sample tickets
insert into tickets (
  id, title, description, status, priority, source,
  customer_id, organization_id, assigned_to, team_id
)
values
('55555555-5555-4a55-a555-555555555555',
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
('66666666-6666-4a66-a666-666666666666',
 'Need help with API integration',
 'Looking for docs on how to integrate with the REST API',
 'in_progress',
 'medium',
 'email',
 'b1c2d3e4-a5b6-7890-1234-567890123456',
 'f1e2d3c4-b5a6-4789-9012-345678901234',
 'e5f6a7b8-c9d0-1234-5678-901234567890',
 'f9e8d7c6-b5a4-1234-5678-901234567890'
),
('77777777-7777-4a77-a777-777777777777',
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
('88888888-8888-4a88-a888-888888888888',
 'Billing issue',
 'Last invoice seems incorrect',
 'open',
 'high',
 'email',
 'd1e2f3a4-b5c6-7890-1234-567890123456',
 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
 'b1c2d3e4-f5a6-7890-1234-567890123456',
 'a1b2c3d4-e5f6-4321-8901-abcdef123456'
),
('99999999-9999-4999-9999-999999999999',
 'Export feature not working',
 'When I try to export my reports to PDF, nothing happens',
 'in_progress',
 'medium',
 'web',
 'a7b8c9d0-e1f2-0987-4567-123456789012',
 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'a1b2c3d4-e5f6-4321-8901-abcdef123456'
),
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab',
 'Need help with API documentation',
 'Looking for docs on the REST API endpoints',
 'open',
 'low',
 'email',
 'a7b8c9d0-e1f2-0987-4567-123456789012',
 'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
 null,
 null
)
on conflict (id) do nothing;

-- 11) Tag the tickets
insert into ticket_tags (ticket_id, tag_id) values
('55555555-5555-4a55-a555-555555555555','11111111-1111-4a11-a111-111111111111'),
('55555555-5555-4a55-a555-555555555555','33333333-3333-4a33-a333-333333333333'),
('66666666-6666-4a66-a666-666666666666','44444444-4444-4a44-a444-444444444444'),
('77777777-7777-4a77-a777-777777777777','22222222-2222-4a22-a222-222222222222'),
('88888888-8888-4a88-a888-888888888888','33333333-3333-4a33-a333-333333333333')
on conflict do nothing;

-- 12) Ticket messages
insert into ticket_messages (id, ticket_id, author_id, content, source, is_internal)
values
('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
 '55555555-5555-4a55-a555-555555555555',
 'a7b8c9d0-e1f2-0987-4567-123456789012',
 'I keep getting a 403 error. Could you help?',
 'web',
 false
),
('bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
 '55555555-5555-4a55-a555-555555555555',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'Which browser are you using?',
 'web',
 false
),
('cccccccc-cccc-4ccc-cccc-cccccccccccc',
 '55555555-5555-4a55-a555-555555555555',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'Looks like a role permission issue. Will escalate to admin.',
 'web',
 true
),
('dddddddd-dddd-4ddd-dddd-dddddddddddd',
 '99999999-9999-4999-9999-999999999999',
 'a7b8c9d0-e1f2-0987-4567-123456789012',
 'Export button not responding on Chrome or Firefox.',
 'web',
 false
),
('eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
 '99999999-9999-4999-9999-999999999999',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'Seeing JS errors in logs.',
 'web',
 true
),
('ffffffff-ffff-4fff-ffff-ffffffffffff',
 '99999999-9999-4999-9999-999999999999',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'Deployed a fix. Try again in 10 minutes?',
 'web',
 false
),
('aaaaaaaa-1111-4111-aaaa-111111111111',
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab',
 'a7b8c9d0-e1f2-0987-4567-123456789012',
 'Need docs for the reporting endpoints specifically.',
 'email',
 false
),
('bbbbbbbb-2222-4222-bbbb-222222222222',
 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaab',
 'd4e5f6a7-b8c9-7654-1234-def123456789',
 'Customer is on enterprise plan. Let’s prioritize.',
 'web',
 true
)
on conflict (id) do nothing;

-- Additional test message
insert into ticket_messages (ticket_id, author_id, content, source, is_internal)
values
(
  '99999999-9999-4999-9999-999999999999',
  'a7b8c9d0-e1f2-0987-4567-123456789012',
  'The export button seems clickable, but no file downloads.',
  'web',
  false
);

-- Done seeding!
