import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
)

async function seedArticles() {
  try {
    // Create "Common Issues" category if it doesn't exist
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .insert({
        name: 'Common Issues',
        workspace_id: '00000000-0000-0000-0000-000000000000' // Default workspace
      })
      .select()
      .single()

    if (categoryError) throw categoryError
    console.log('Created category:', category.id)

    // Sample articles
    const articles = [
      {
        title: 'How to Reset Your Password',
        content: `If you're having trouble accessing your account, follow these steps to reset your password:

1. Click the "Forgot Password" link on the login page
2. Enter your email address
3. Check your email for a password reset link
4. Click the link and enter your new password
5. Log in with your new password

Common issues:
- Reset link not received: Check your spam folder
- Link expired: Request a new reset link
- Still can't log in: Contact support`,
        category_id: category.id
      },
      {
        title: 'Understanding Priority Levels',
        content: `Our support system uses four priority levels to ensure efficient handling of tickets:

1. Urgent: Critical system failures, security issues
2. High: Major functionality blocked, significant impact
3. Medium: Non-critical issues affecting workflow
4. Low: Minor issues, feature requests

Priority levels may be adjusted by support staff based on:
- Number of affected users
- Business impact
- Available workarounds
- SLA requirements`,
        category_id: category.id
      },
      {
        title: 'Best Practices for Submitting Tickets',
        content: `Follow these guidelines to help us resolve your issues faster:

1. Be specific with your title
2. Include steps to reproduce
3. Describe expected vs actual behavior
4. Add relevant screenshots or logs
5. Mention any recent changes

Tips for faster resolution:
- Check knowledge base first
- Include error messages
- List browser/OS version
- Tag appropriately
- Respond promptly to questions`,
        category_id: category.id
      }
    ]

    // Insert articles
    for (const article of articles) {
      const { data, error } = await supabase
        .from('articles')
        .insert({
          ...article,
          workspace_id: '00000000-0000-0000-0000-000000000000' // Default workspace
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting article:', error)
        continue
      }

      // Queue for embedding generation
      const { error: queueError } = await supabase
        .from('embedding_queue')
        .insert({
          content_type: 'article',
          content_id: data.id,
          operation: 'insert'.toLowerCase()
        })

      if (queueError) {
        console.error('Error inserting article:', queueError)
      }
    }

    console.log('Articles seeded successfully')
  } catch (error) {
    console.error('Error seeding articles:', error)
  }
}

seedArticles() 