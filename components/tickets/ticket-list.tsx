"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket } from "@/types/ticket";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus as WorkspaceTicketStatus } from "@/types/workspace-settings";

interface TicketListProps {
  tickets: Ticket[];
}

export default function TicketList({ tickets }: TicketListProps) {
  const [workspaceStatuses, setWorkspaceStatuses] = useState<WorkspaceTicketStatus[]>([]);

  useEffect(() => {
    async function loadWorkspaceSettings() {
      const settings = await getWorkspaceSettings();
      if (settings?.ticket_statuses) {
        setWorkspaceStatuses(settings.ticket_statuses);
      }
    }
    loadWorkspaceSettings();
  }, []);

  const getStatusInfo = (statusName: string) => {
    const status = workspaceStatuses.find(s => s.name === statusName);
    return status ? {
      display: status.display,
      color: status.color
    } : {
      display: statusName.replace("_", " "),
      color: "#808080"
    };
  };

  const getStatusClass = (statusName: string) => {
    switch (statusName) {
      case 'open':
        return 'bg-red-500/10 text-red-500';
      case 'in_progress':
        return 'bg-orange-500/10 text-orange-500';
      case 'resolved':
        return 'bg-green-500/10 text-green-500';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
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

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return 'bg-destructive/10 text-destructive rounded-full';
      case "medium":
        return 'bg-warning/10 text-warning rounded-full';
      case "low":
        return 'bg-muted/10 text-muted-foreground rounded-full';
      default:
        return 'bg-muted/10 text-muted-foreground rounded-full';
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
            <span 
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(ticket.status)}`}
            >
              {getStatusInfo(ticket.status).display}
            </span>
          </div>

          <div>
            <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getPriorityClass(ticket.priority)}`}>
              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
} 