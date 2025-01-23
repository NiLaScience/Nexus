"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus } from "@/app/actions/workspace-settings";

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);

  useEffect(() => {
    async function loadStatuses() {
      try {
        const settings = await getWorkspaceSettings();
        if (settings?.ticket_statuses) {
          setStatuses(settings.ticket_statuses);
        }
      } catch (error) {
        console.error('Error loading statuses:', error);
      }
    }
    loadStatuses();
  }, []);

  const getStatusDisplay = (statusName: string) => {
    const status = statuses.find(s => s.name === statusName);
    return status ? {
      display: status.display,
      color: status.color
    } : {
      display: statusName.replace("_", " "),
      color: "#808080"
    };
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if formatting fails
    }
  };

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
              {ticket.tags?.map((tag) => (
                <span
                  key={tag}
                  className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {formatDate(ticket.created)}
            </div>
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.organization}
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.requester?.name || '—'}
          </div>

          <div className="text-sm text-muted-foreground truncate">
            {ticket.assignedTo?.name || '—'}
          </div>

          <div>
            {(() => {
              const status = getStatusDisplay(ticket.status);
              return (
                <span
                  className="inline-block px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: `${status.color}20`,
                    color: status.color
                  }}
                >
                  {status.display}
                </span>
              );
            })()}
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