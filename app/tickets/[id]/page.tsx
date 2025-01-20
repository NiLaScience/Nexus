import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TicketHeader } from "@/components/tickets/ticket-header";
import { MessageHistory } from "@/components/tickets/message-history";
import { TicketTimeline } from "@/components/tickets/ticket-timeline";
import { InternalNotes } from "@/components/tickets/internal-notes";
import { RelatedTickets } from "@/components/tickets/related-tickets";
import { AttachmentsList } from "@/components/tickets/attachments-list";
import {
  MOCK_MESSAGES,
  MOCK_TIMELINE,
  MOCK_INTERNAL_COMMENTS,
  MOCK_RELATED_TICKETS,
  MOCK_ATTACHMENTS,
} from "@/lib/mock-data";
import { getMockTicket } from "@/lib/mock-ticket-data";

interface Props {
  params: {
    id: string;
  };
}

export default async function TicketDetailPage({ params }: Props) {
  const ticketId = parseInt(params.id);
  const ticket = getMockTicket(ticketId);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/tickets">
          <Button variant="ghost" size="icon" className="text-white hover:bg-zinc-800">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold text-white">{ticket.title}</h1>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <TicketHeader
              created={ticket.created}
              tags={ticket.tags}
              status={ticket.status}
              ticketId={ticketId}
            />
            <p className="text-zinc-400 mt-4">{ticket.description}</p>
          </div>

          <MessageHistory
            messages={MOCK_MESSAGES}
            ticketId={ticketId}
          />
        </div>

        <div className="space-y-6">
          <TicketTimeline events={MOCK_TIMELINE} />
          <InternalNotes
            comments={MOCK_INTERNAL_COMMENTS}
            ticketId={ticketId}
          />
          <RelatedTickets tickets={MOCK_RELATED_TICKETS} />
          <AttachmentsList
            attachments={MOCK_ATTACHMENTS}
            ticketId={ticketId}
          />
        </div>
      </div>
    </div>
  );
} 