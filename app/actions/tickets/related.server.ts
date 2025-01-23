import { createClient } from "@/utils/supabase/server";
import type { RelatedTicket } from "@/types/ticket";

interface DBTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  organization_id: string;
  customer: {
    id: string;
    full_name: string | null;
  } | null;
  assignee: {
    id: string;
    full_name: string | null;
  } | null;
  ticket_tags: {
    tag: {
      name: string;
    };
  }[];
  organization: {
    name: string;
  } | null;
}

export async function getRelatedTicketsAction(ticketId: string) {
  const supabase = await createClient();

  // First get the current ticket's organization and tags
  const { data: currentTicket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      organization_id,
      ticket_tags(
        tag:tag_id(
          name
        )
      )
    `)
    .eq('id', ticketId)
    .single();

  if (ticketError) {
    console.error('Error fetching ticket info:', ticketError);
    return { error: ticketError.message };
  }

  // Extract tag names
  const tagNames = currentTicket.ticket_tags?.map((tt: any) => tt.tag.name) || [];
  const organizationId = currentTicket.organization_id;

  // Find tickets from the same organization and/or with shared tags
  const { data: relatedTickets, error: relatedError } = await supabase
    .from('tickets')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      created_at,
      organization_id,
      customer:profiles!tickets_customer_id_fkey(
        id,
        full_name
      ),
      assignee:profiles!tickets_assigned_to_fkey(
        id,
        full_name
      ),
      ticket_tags(
        tag:tag_id(
          name
        )
      ),
      organization:organizations!tickets_organization_id_fkey(
        name
      )
    `)
    .neq('id', ticketId)
    .in('status', ['open', 'in_progress'])
    .order('created_at', { ascending: false })
    .limit(10)
    .returns<DBTicket[]>();

  if (relatedError) {
    console.error('Error fetching related tickets:', relatedError);
    return { error: relatedError.message };
  }

  // Transform and sort tickets based on relevance
  const tickets: RelatedTicket[] = relatedTickets
    .map(ticket => {
      const ticketTags = ticket.ticket_tags?.map(tt => tt.tag.name) || [];
      const sharedTags = ticketTags.filter(tag => tagNames.includes(tag));
      
      return {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        date: new Date(ticket.created_at).toLocaleString(),
        tags: ticketTags,
        organization: ticket.organization?.name || 'Unknown Organization',
        requester: {
          name: ticket.customer?.full_name || 'Unknown'
        },
        assignedTo: ticket.assignee ? {
          name: ticket.assignee.full_name || 'Unknown'
        } : undefined,
        // Calculate relevance score
        _relevance: {
          sameOrg: ticket.organization_id === organizationId,
          sharedTagCount: sharedTags.length
        }
      };
    })
    // Filter out tickets with no organizational or tag relevance
    .filter(ticket => ticket._relevance.sameOrg || ticket._relevance.sharedTagCount > 0)
    // Sort by relevance: organization first, then by number of shared tags
    .sort((a, b) => {
      // First compare by organization
      if (a._relevance.sameOrg !== b._relevance.sameOrg) {
        return a._relevance.sameOrg ? -1 : 1;
      }
      // Then by number of shared tags
      return b._relevance.sharedTagCount - a._relevance.sharedTagCount;
    })
    // Take only the top 5 most relevant tickets
    .slice(0, 5)
    // Remove the _relevance field from the final output
    .map(({ _relevance, ...ticket }) => ticket);

  return { tickets };
} 