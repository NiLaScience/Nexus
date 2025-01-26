import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";
import type { TimelineEvent } from "@/types/ticket";

interface TicketEvent {
  id: string;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  actor: {
    id: string;
    full_name: string | null;
  } | null;
}

// Helper function to format status for display
function formatStatus(status: string): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'In Progress';
    case 'resolved':
      return 'Resolved';
    case 'closed':
      return 'Closed';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export async function getTicketEventsAction(ticketId: string) {
  try {
    // Get the current user and verify authentication
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || 'Not authenticated');
    }

    const supabase = await SupabaseService.createClientWithCookies();

    // First get all agent IDs mentioned in the events
    const { data: events, error } = await supabase
      .from('ticket_events')
      .select(`
        id,
        event_type,
        old_value,
        new_value,
        created_at,
        actor:profiles!ticket_events_actor_id_fkey(
          id,
          full_name
        )
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false })
      .returns<TicketEvent[]>();

    if (error) {
      console.error('Error fetching ticket events:', error);
      return { error: error.message };
    }

    // Get all unique agent IDs from old_value and new_value fields in assignment events
    const agentIds = new Set<string>();
    events.forEach(event => {
      if (event.event_type === 'assigned' || event.event_type === 'unassigned') {
        if (event.old_value) agentIds.add(event.old_value);
        if (event.new_value) agentIds.add(event.new_value);
      }
    });

    // Fetch agent names if there are any agent IDs
    let agentNames: Record<string, string> = {};
    if (agentIds.size > 0) {
      const { data: agents, error: agentsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(agentIds));

      if (!agentsError && agents) {
        agentNames = agents.reduce((acc, agent) => ({
          ...acc,
          [agent.id]: agent.full_name || 'Unknown Agent'
        }), {});
      }
    }

    // Transform the events into the TimelineEvent format
    const timelineEvents: TimelineEvent[] = events.map(event => ({
      id: event.id,
      type: event.event_type,
      date: new Date(event.created_at).toLocaleString(),
      user: event.actor?.full_name || 'Unknown User',
      description: formatEventDescription(event.event_type, event.old_value, event.new_value, agentNames)
    }));

    return { events: timelineEvents };
  } catch (error) {
    console.error('Error fetching ticket events:', error);
    return { error: (error as Error).message };
  }
}

function formatEventDescription(
  type: string, 
  oldValue: string | null, 
  newValue: string | null,
  agentNames: Record<string, string>
): string {
  switch (type) {
    case 'created':
      return 'created the ticket';
    case 'status_changed':
      return `changed status from ${formatStatus(oldValue || '')} to ${formatStatus(newValue || '')}`;
    case 'priority_changed':
      return `changed priority from ${oldValue} to ${newValue}`;
    case 'assigned':
      if (oldValue) {
        return `reassigned ticket from ${agentNames[oldValue] || 'Unknown Agent'} to ${agentNames[newValue || ''] || 'Unknown Agent'}`;
      }
      return `assigned ticket to ${agentNames[newValue || ''] || 'Unknown Agent'}`;
    case 'unassigned':
      return `unassigned ticket from ${agentNames[oldValue || ''] || 'Unknown Agent'}`;
    case 'team_changed':
      return `moved ticket to a different team`;
    case 'tag_added':
      return `added tag "${newValue}"`;
    case 'tag_removed':
      return `removed tag "${oldValue}"`;
    case 'message_added':
      return 'added a message';
    case 'internal_note_added':
      return 'added an internal note';
    case 'attachment_added':
      return 'added an attachment';
    case 'resolved':
      return newValue ? `resolved the ticket: ${newValue}` : 'resolved the ticket';
    case 'reopened':
      return 'reopened the ticket';
    default:
      return type.replace(/_/g, ' ');
  }
} 