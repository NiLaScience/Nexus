"use client";

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
import {
  MOCK_MESSAGES,
  MOCK_TIMELINE,
  MOCK_INTERNAL_COMMENTS,
  MOCK_RELATED_TICKETS,
  MOCK_ATTACHMENTS,
} from "@/lib/mock-data";
import { getMockTicket } from "@/lib/mock-ticket-data";

interface TicketPageProps {
  params: {
    id: string;
  };
}

export default function TicketPage({ params: { id } }: TicketPageProps) {
  const ticketId = parseInt(id);
  const ticket = getMockTicket(ticketId);

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
              created={ticket.created}
              tags={ticket.tags}
              status={ticket.status}
            />
            <p className="text-muted-foreground mt-4">{ticket.description}</p>
          </div>

          <MessageHistory
            messages={MOCK_MESSAGES}
          />

          <InternalNotes
            comments={MOCK_INTERNAL_COMMENTS}
          />

          <RelatedTickets tickets={MOCK_RELATED_TICKETS} />
        </div>

        <div className="space-y-6">
          <TicketDetails
            ticketId={ticketId}
            requester={{
              name: ticket.requester.name,
              email: ticket.requester.email,
            }}
            assignedTo={ticket.assignedTo ? {
              name: ticket.assignedTo.name,
              email: ticket.assignedTo.email,
            } : undefined}
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