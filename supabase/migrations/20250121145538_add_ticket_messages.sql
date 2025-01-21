-- Add more tickets
insert into tickets (
  id, title, description, status, priority, source,
  customer_id, organization_id, assigned_to, team_id
) values 
  (
    '66666666-6666-4a66-a666-666666666666',
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
  (
    '77777777-7777-4a77-a777-777777777777',
    'Need help with API documentation',
    'Looking for documentation on the REST API endpoints',
    'open',
    'low',
    'email',
    'a7b8c9d0-e1f2-0987-4567-123456789012',
    'd0db7ecc-0e1c-4c45-9daa-b9e5b69ad0c3',
    null,
    null
  );

-- Add messages to the first ticket (dashboard access)
insert into ticket_messages (
  id, ticket_id, author_id, content, source, is_internal
) values
  (
    'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
    '55555555-5555-4a55-a555-555555555555',
    'a7b8c9d0-e1f2-0987-4567-123456789012',
    'I keep getting a 403 error when trying to access the dashboard. Can someone help?',
    'web',
    false
  ),
  (
    'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb',
    '55555555-5555-4a55-a555-555555555555',
    'd4e5f6a7-b8c9-7654-1234-def123456789',
    'Checking the permissions on your account. Could you let me know which browser you''re using?',
    'web',
    false
  ),
  (
    'cccccccc-cccc-4ccc-cccc-cccccccccccc',
    '55555555-5555-4a55-a555-555555555555',
    'd4e5f6a7-b8c9-7654-1234-def123456789',
    'Looks like a role permission issue. Will need to escalate to admin.',
    'web',
    true
  );

-- Add messages to the second ticket (export feature)
insert into ticket_messages (
  id, ticket_id, author_id, content, source, is_internal
) values
  (
    'dddddddd-dddd-4ddd-dddd-dddddddddddd',
    '66666666-6666-4a66-a666-666666666666',
    'a7b8c9d0-e1f2-0987-4567-123456789012',
    'The export button is not responding at all. I''ve tried both Chrome and Firefox.',
    'web',
    false
  ),
  (
    'eeeeeeee-eeee-4eee-eeee-eeeeeeeeeeee',
    '66666666-6666-4a66-a666-666666666666',
    'd4e5f6a7-b8c9-7654-1234-def123456789',
    'I''ve checked the logs and found some JavaScript errors.',
    'web',
    true
  ),
  (
    'ffffffff-ffff-4fff-ffff-ffffffffffff',
    '66666666-6666-4a66-a666-666666666666',
    'd4e5f6a7-b8c9-7654-1234-def123456789',
    'We''re deploying a fix for the export functionality. Could you try again in about 10 minutes?',
    'web',
    false
  );

-- Add messages to the third ticket (API docs)
insert into ticket_messages (
  id, ticket_id, author_id, content, source, is_internal
) values
  (
    'aaaaaaaa-1111-4111-aaaa-111111111111',
    '77777777-7777-4a77-a777-777777777777',
    'a7b8c9d0-e1f2-0987-4567-123456789012',
    'I need documentation for integrating with your REST API. Specifically for the reporting endpoints.',
    'email',
    false
  ),
  (
    'bbbbbbbb-2222-4222-bbbb-222222222222',
    '77777777-7777-4a77-a777-777777777777',
    'd4e5f6a7-b8c9-7654-1234-def123456789',
    'Note: Customer is using our enterprise plan, should prioritize API documentation request.',
    'web',
    true
  ); 