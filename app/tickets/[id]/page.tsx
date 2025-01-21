import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketHeader } from "@/components/tickets/ticket-header";
import { MessageHistory } from "@/components/tickets/message-history";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { InternalNotes } from "@/components/tickets/internal-notes";
import { RelatedTickets } from "@/components/tickets/related-tickets";
import { AttachmentsList } from "@/components/tickets/attachments-list";
import { TicketDetails } from "@/components/tickets/ticket-details";
import { createClient } from "@/utils/supabase/server";
import { getTicketMessagesAction, getInternalNotesAction } from "@/app/actions/tickets/messages.server";
import type { TimelineEvent, RelatedTicket, Attachment } from "@/types/ticket";

// Temporary mock data until we implement these features
const MOCK_TIMELINE: TimelineEvent[] = [];
const MOCK_RELATED_TICKETS: RelatedTicket[] = [];
const MOCK_ATTACHMENTS: Attachment[] = [];

interface TicketTag {
  tag: {
    name: string;
  };
}

export default async function TicketPage({ params }: any) {
  const { id } = params;
  const supabase = await createClient();

  // Fetch ticket with related profiles and tags
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

  // Fetch messages and internal notes
  const [messagesResult, internalNotesResult] = await Promise.all([
    getTicketMessagesAction(id),
    getInternalNotesAction(id)
  ]);
  console.log('Ticket ID being queried:', id); // Debug log
  console.log('Messages result:', messagesResult); // Debug log
  
  if (ticketError) {
    console.error('Ticket error:', ticketError); // Debug log
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
  const tags = ticket.ticket_tags?.map((tt: TicketTag) => tt.tag.name) || [];

  console.log('Ticket data:', { ...ticket, tags }); // Debug log

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tickets">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">{ticket.title}</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-card border p-4 rounded-lg">
            <TicketHeader
              ticketId={id}
              created={ticket.created_at}
              tags={tags}
              status={ticket.status}
            />
            <p className="text-muted-foreground mt-4">{ticket.description}</p>
          </div>

          <MessageHistory
            ticketId={id}
            initialMessages={messagesResult.messages || []}
          />

          <InternalNotes
            ticketId={id}
            initialNotes={internalNotesResult.messages || []}
          />

          <RelatedTickets tickets={MOCK_RELATED_TICKETS} />
        </div>

        <div className="space-y-6">
          <TicketDetails
            ticketId={id}
            requester={ticket.customer}
            assignedTo={ticket.assignee}
          />
          <TicketTimeline events={MOCK_TIMELINE} />
          <AttachmentsList
            attachments={MOCK_ATTACHMENTS}
          />
        </div>
      </div>
    </div>
  );
} 