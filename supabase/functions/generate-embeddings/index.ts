import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://esm.sh/openai@4.28.0'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

// Supabase client is automatically initialized with service_role in Edge Functions
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

serve(async (req) => {
  try {
    // Get the unprocessed items from the queue
    const { data: queueItems, error: queueError } = await supabaseClient
      .from('embedding_queue')
      .select('*')
      .eq('processed', false)
      .order('created_at')
      .limit(10)

    if (queueError) throw queueError
    if (!queueItems?.length) {
      return new Response(JSON.stringify({ message: 'No items to process' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Process each queue item
    for (const item of queueItems) {
      // Handle deletion
      if (item.operation === 'delete') {
        await supabaseClient
          .from('embeddings')
          .delete()
          .eq('content_type', item.content_type)
          .eq('content_id', item.content_id)
        
        await supabaseClient
          .from('embedding_queue')
          .update({ processed: true })
          .eq('id', item.id)
        
        continue
      }

      // Get the content based on content_type
      let content = ''
      let workspace_id = ''
      
      switch (item.content_type) {
        case 'ticket':
          const { data: ticket } = await supabaseClient
            .from('tickets')
            .select('title, description, workspace_id')
            .eq('id', item.content_id)
            .single()
          
          if (ticket) {
            content = `${ticket.title}\n\n${ticket.description}`
            workspace_id = ticket.workspace_id
          }
          break

        case 'message':
          const { data: message } = await supabaseClient
            .from('ticket_messages')
            .select('content, tickets!inner(workspace_id)')
            .eq('id', item.content_id)
            .single()
          
          if (message) {
            content = message.content
            workspace_id = message.tickets.workspace_id
          }
          break

        case 'article':
          const { data: article } = await supabaseClient
            .from('articles')
            .select('title, content, workspace_id')
            .eq('id', item.content_id)
            .single()
          
          if (article) {
            content = `${article.title}\n\n${article.content}`
            workspace_id = article.workspace_id
          }
          break
      }

      if (!content || !workspace_id) {
        console.error(`No content found for ${item.content_type} ${item.content_id}`)
        continue
      }

      // Generate embedding using OpenAI
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-large',
        input: content,
        dimensions: 3072,
      })

      const [{ embedding }] = embeddingResponse.data

      // Store the embedding
      await supabaseClient.from('embeddings').upsert({
        content_type: item.content_type,
        content_id: item.content_id,
        content_text: content,
        embedding,
        workspace_id,
        metadata: {
          model: 'text-embedding-3-large',
          dimensions: 3072,
        },
      })

      // Mark queue item as processed
      await supabaseClient
        .from('embedding_queue')
        .update({ processed: true })
        .eq('id', item.id)
    }

    return new Response(
      JSON.stringify({ 
        message: `Processed ${queueItems.length} items`
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 