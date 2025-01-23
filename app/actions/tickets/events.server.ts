import { createClient } from "@/utils/supabase/server";
import type { TimelineEvent } from "@/types/ticket";

export async function getTicketEventsAction(ticketId: string) {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from('ticket_events')
    .select(`
      id,
      event_type,
      old_value,
      new_value,
      created_at,
      actor:actor_id(
        id,
        full_name
      )
    `)
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching ticket events:', error);
    return { error: error.message };
  }

  // Transform the events into the TimelineEvent format
  const timelineEvents: TimelineEvent[] = events.map(event => ({
    id: event.id,
    type: event.event_type,
    date: new Date(event.created_at).toLocaleString(),
    user: event.actor?.full_name || 'Unknown User',
    description: formatEventDescription(event.event_type, event.old_value, event.new_value)
  }));

  return { events: timelineEvents };
}

function formatEventDescription(type: string, oldValue: string | null, newValue: string | null): string {
  switch (type) {
    case 'created':
      return 'created the ticket';
    case 'status_changed':
      return `changed status from ${oldValue} to ${newValue}`;
    case 'priority_changed':
      return `changed priority from ${oldValue} to ${newValue}`;
    case 'assigned':
      return oldValue 
        ? `reassigned ticket from ${oldValue} to ${newValue}`
        : `assigned ticket to ${newValue}`;
    case 'unassigned':
      return 'unassigned the ticket';
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