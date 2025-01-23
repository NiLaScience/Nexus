import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ticket {
  id: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get open and in_progress tickets
    const { data: tickets, error: fetchError } = await supabaseClient
      .from('tickets')
      .select('*')
      .in('status', ['open', 'in_progress'])
      .returns<Ticket[]>()

    if (fetchError) throw fetchError

    const now = new Date()
    const updates: Promise<any>[] = []

    // Process each ticket
    for (const ticket of tickets) {
      const ticketAge = now.getTime() - new Date(ticket.created_at).getTime()
      const hoursSinceUpdate = (now.getTime() - new Date(ticket.updated_at).getTime()) / (1000 * 60 * 60)
      
      let newPriority = ticket.priority

      // Escalation rules
      if (ticket.priority === 'low' && hoursSinceUpdate > 24) {
        newPriority = 'medium'
      } else if (ticket.priority === 'medium' && hoursSinceUpdate > 12) {
        newPriority = 'high'
      }

      // If priority needs to be updated
      if (newPriority !== ticket.priority) {
        updates.push(
          supabaseClient
            .from('tickets')
            .update({ 
              priority: newPriority,
              updated_at: now.toISOString()
            })
            .eq('id', ticket.id)
        )
      }
    }

    // Wait for all updates to complete
    await Promise.all(updates)

    return new Response(
      JSON.stringify({ message: 'Priority escalation completed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 