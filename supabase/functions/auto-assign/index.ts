import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Ticket {
  id: string
  organization_id: string
  team_id: string | null
  assigned_to: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  ticket_tags: { tag: { name: string } }[]
}

interface Agent {
  id: string
  full_name: string
  is_active: boolean
  tickets: { status: string }[]
  agent_skills: { 
    skill: { name: string }
    proficiency_level: 'beginner' | 'intermediate' | 'expert'
  }[]
}

interface AgentWorkload {
  id: string
  name: string
  activeTickets: number
  skillMatch: number
  proficiencyScore: number
}

function findBestAgent(agentWorkloads: AgentWorkload[], requireSkillMatch = true): AgentWorkload | null {
  if (!agentWorkloads.length) return null

  // If requiring skill match, filter to only agents with matching skills
  const eligibleAgents = requireSkillMatch 
    ? agentWorkloads.filter(a => a.skillMatch > 0)
    : agentWorkloads

  // If no agents with matching skills and we require them, return null
  if (requireSkillMatch && !eligibleAgents.length) return null

  // Find best among eligible agents
  return eligibleAgents.reduce((best, current) => {
    // Prioritize skill matches first (if any skills were matched)
    if (current.skillMatch > best.skillMatch) return current
    if (current.skillMatch < best.skillMatch) return best
    
    // If same number of skill matches, consider proficiency
    if (current.proficiencyScore > best.proficiencyScore) return current
    if (current.proficiencyScore < best.proficiencyScore) return best
    
    // If same proficiency, pick the one with fewer active tickets
    return current.activeTickets < best.activeTickets ? current : best
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get unassigned tickets with their tags
    const { data: tickets, error: ticketsError } = await supabaseClient
      .from('tickets')
      .select(`
        id,
        organization_id,
        team_id,
        assigned_to,
        status,
        ticket_tags!inner(
          tag:tags(name)
        )
      `)
      .is('assigned_to', null)
      .eq('status', 'open')
      .returns<Ticket[]>()

    if (ticketsError) throw ticketsError

    const updates: Promise<any>[] = []

    for (const ticket of tickets) {
      // If ticket already has a team assigned, use that
      // Otherwise, find the team assigned to the organization
      let teamId = ticket.team_id
      if (!teamId) {
        const { data: teamOrg } = await supabaseClient
          .from('team_organizations')
          .select('team_id')
          .eq('organization_id', ticket.organization_id)
          .single()

        if (teamOrg) {
          teamId = teamOrg.team_id
        } else {
          console.log(`No team found for organization ${ticket.organization_id}`)
          continue
        }
      }

      // Get all active agents in the team with their current workload and skills
      const { data: agents } = await supabaseClient
        .from('profiles')
        .select(`
          id,
          full_name,
          is_active,
          tickets!tickets_assigned_to_fkey(status),
          agent_skills!left(
            skill:skills(name),
            proficiency_level
          )
        `)
        .eq('is_active', true)
        .in('id', (
          supabaseClient
            .from('team_members')
            .select('user_id')
            .eq('team_id', teamId)
        ))
        .returns<Agent[]>()

      if (!agents?.length) {
        console.log(`No active agents found in team ${teamId}`)
        continue
      }

      // Calculate workload and skill match for each agent
      const ticketTags = new Set(ticket.ticket_tags?.map(t => t.tag.name) || [])
      const hasSkillTags = ticketTags.size > 0
      
      const agentWorkloads = agents.map(agent => {
        const activeTickets = agent.tickets?.filter(t => 
          t.status === 'open' || t.status === 'in_progress'
        ).length || 0

        // Calculate skill match and proficiency score
        let skillMatch = 0
        let proficiencyScore = 0
        
        // Only calculate skill matches if ticket has skill tags
        if (hasSkillTags) {
          agent.agent_skills?.forEach(skill => {
            if (ticketTags.has(skill.skill.name)) {
              skillMatch++
              // Weight proficiency levels
              switch (skill.proficiency_level) {
                case 'expert':
                  proficiencyScore += 3
                  break
                case 'intermediate':
                  proficiencyScore += 2
                  break
                case 'beginner':
                  proficiencyScore += 1
                  break
              }
            }
          })
        }

        return {
          id: agent.id,
          name: agent.full_name,
          activeTickets,
          skillMatch,
          proficiencyScore
        }
      })

      // Try to find best agent with matching skills first
      let bestAgent = hasSkillTags 
        ? findBestAgent(agentWorkloads, true) // Require skill match for tickets with skill tags
        : null

      // If no skill match found (or no skill tags), fall back to least loaded agent
      if (!bestAgent) {
        bestAgent = findBestAgent(agentWorkloads, false)
      }

      if (!bestAgent) {
        console.log(`No suitable agent found for ticket ${ticket.id}`)
        continue
      }

      // Assign ticket to best matching agent
      updates.push(
        supabaseClient
          .from('tickets')
          .update({ 
            assigned_to: bestAgent.id,
            team_id: teamId,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id)
      )
    }

    await Promise.all(updates)

    return new Response(
      JSON.stringify({ message: 'Auto-assignment completed successfully' }),
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