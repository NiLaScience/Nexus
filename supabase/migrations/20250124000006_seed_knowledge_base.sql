-- Insert initial categories
INSERT INTO categories (name, workspace_id) VALUES
  ('Getting Started', '00000000-0000-0000-0000-000000000000'),
  ('Account & Billing', '00000000-0000-0000-0000-000000000000'),
  ('Troubleshooting', '00000000-0000-0000-0000-000000000000'),
  ('Features & Guides', '00000000-0000-0000-0000-000000000000'),
  ('API Documentation', '00000000-0000-0000-0000-000000000000');

-- Insert a sample article
INSERT INTO articles (title, content, category_id, workspace_id)
SELECT 
  'Welcome to Nexus Support',
  E'Welcome to Nexus Support! This guide will help you get started with our platform and make the most of our features.\n\n' ||
  '## Key Features\n\n' ||
  '- Create and track support tickets\n' ||
  '- Browse our knowledge base\n' ||
  '- Chat with our support team\n' ||
  '- View your account settings\n\n' ||
  '## Need Help?\n\n' ||
  'If you need assistance, you can:\n\n' ||
  '1. Search our knowledge base\n' ||
  '2. Create a support ticket\n' ||
  '3. Contact our team directly\n\n' ||
  'We''re here to help!',
  id,
  '00000000-0000-0000-0000-000000000000'
FROM categories
WHERE name = 'Getting Started'
LIMIT 1; 