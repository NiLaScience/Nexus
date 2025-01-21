"use client";

import Link from "next/link";
import { Ticket } from "@/types/ticket";

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  return (
    <div className="bg-card border rounded-lg">
      {/* Header */}
      <div className="grid grid-cols-[1fr,200px,200px,200px,100px,100px] gap-4 p-3 border-b bg-muted/50 font-medium text-sm">
        <div>Title</div>
        <div>Organization</div>
        <div>Requester</div>
        <div>Assigned To</div>
        <div>Status</div>
        <div>Priority</div>
      </div>

      {/* Tickets */}
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="grid grid-cols-[1fr,200px,200px,200px,100px,100px] gap-4 p-3 border-b last:border-0 hover:bg-muted/50 transition-colors duration-200 items-center"
        >
          <div>
            <div className="font-medium">{ticket.title}</div>
            <div className="flex gap-2 mt-1">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">{ticket.created}</div>
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.organization}
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.requester.name}
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.assignedTo?.name || '—'}
          </div>

          <div>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                ticket.status === "open"
                  ? "bg-success/20 text-success"
                  : ticket.status === "in_progress"
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {ticket.status.replace("_", " ")}
            </span>
          </div>

          <div>
            <span
              className={`inline-block px-2 py-1 rounded text-xs ${
                ticket.priority === "high"
                  ? "bg-destructive/20 text-destructive"
                  : ticket.priority === "medium"
                  ? "bg-warning/20 text-warning"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {ticket.priority}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
} 