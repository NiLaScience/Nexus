import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { OpenAI } from 'https://esm.sh/openai@4.28.0'
import { SupabaseVectorStore } from 'npm:@langchain/community/vectorstores/supabase'
import { OpenAIEmbeddings } from 'npm:@langchain/openai'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY')!,
})

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
    const { query, content_filter, limit = 5 } = await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    // Initialize vector store
    const vectorStore = new SupabaseVectorStore(
      new OpenAIEmbeddings({
        openAIApiKey: Deno.env.get('OPENAI_API_KEY'),
        modelName: 'text-embedding-3-large',
        dimensions: 3072,
      }), {
        client: supabaseClient,
        tableName: 'embeddings',
        queryName: 'match_documents',
      }
    )

    // Search for similar content
    const results = await vectorStore.similaritySearch(query, limit, content_filter)

    return new Response(
      JSON.stringify({ results }), {
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