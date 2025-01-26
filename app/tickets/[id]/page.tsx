import { TicketHeader } from "@/components/tickets/ticket-header";
import { MessageHistory } from "@/components/tickets/message-history";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { InternalNotes } from "@/components/tickets/internal-notes";
import { RelatedTickets } from "@/components/tickets/related-tickets";
import { AttachmentsList } from "@/components/tickets/attachments-list";
import { TicketDetails } from "@/components/tickets/ticket-details";
import { TicketRating } from "@/components/tickets/ticket-rating";
import { SupabaseService } from "@/services/supabase";
import { getTicketMessagesAction, getInternalNotesAction } from "@/app/actions/tickets/messages.server";
import { getTicketEventsAction } from "@/app/actions/tickets/events.server";
import { getRelatedTicketsAction } from "@/app/actions/tickets/related.server";
import { withAuth } from "@/components/hoc/with-auth";
import type { AuthUser } from "@/services/auth";

interface PageProps {
  params: Promise<{ id: string }>;
  user: AuthUser;
}

async function TicketPage({ params, user }: PageProps) {
  const { id } = await params;
  const isCustomer = user.profile?.role === 'customer';

  // Fetch ticket with related profiles and tags
  const supabase = SupabaseService.createServiceClient();
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      *,
      customer:customer_id(
        id,
        full_name,
        role
      ),
      assignee:assigned_to(
        id,
        full_name,
        role
      ),
      ticket_tags(
        tag:tag_id(
          name
        )
      )
    `)
    .eq('id', id)
    .single();

  // Fetch messages, internal notes, events and related tickets
  const [messagesResult, internalNotesResult, eventsResult, relatedTicketsResult] = await Promise.all([
    getTicketMessagesAction(id),
    getInternalNotesAction(id),
    getTicketEventsAction(id),
    getRelatedTicketsAction(id)
  ]);
  
  if (ticketError) {
    console.error('Ticket error:', ticketError);
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Error loading ticket: {ticketError.message}
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Ticket not found
        </div>
      </div>
    );
  }

  // Transform ticket tags into the expected format
  const tags = ticket.ticket_tags?.map((tt: { tag: { name: string } }) => tt.tag.name) || [];

  return (
    <div className="p-6">
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-card border p-4 rounded-lg">
            <TicketHeader
              ticketId={id}
              title={ticket.title}
              created={ticket.created_at}
              tags={tags}
              status={ticket.status}
              priority={ticket.priority}
              assignedTo={ticket.assignee}
            />
            <p className="text-muted-foreground mt-4">{ticket.description}</p>
          </div>

          <MessageHistory
            ticketId={id}
            initialMessages={messagesResult.messages || []}
          />

          {!isCustomer && (
            <InternalNotes
              ticketId={id}
              initialNotes={internalNotesResult.messages || []}
            />
          )}

          <RelatedTickets tickets={relatedTicketsResult.tickets || []} />
        </div>

        <div className="space-y-6">
          <TicketDetails
            ticketId={id}
            requester={ticket.customer}
            assignedTo={ticket.assignee}
            team={ticket.team}
            customFields={ticket.custom_fields}
          />
          <TicketTimeline events={eventsResult.events || []} />
          <AttachmentsList
            ticketId={id}
          />
          <TicketRating
            ticketId={id}
            status={ticket.status}
            customerId={ticket.customer?.id}
          />
        </div>
      </div>
    </div>
  );
}

export default withAuth(TicketPage) 