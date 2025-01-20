"use client";

import Link from "next/link";

interface Ticket {
  id: number;
  title: string;
  status: "open" | "in_progress" | "closed";
  created: string;
  tags: string[];
}

interface TicketListProps {
  tickets: Ticket[];
}

export function TicketList({ tickets }: TicketListProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="block border-b border-zinc-800 last:border-0 p-4 hover:bg-zinc-800/50 transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-white">{ticket.title}</h3>
              <div className="flex gap-2 mt-2">
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-2 py-1 rounded text-xs ${
                  ticket.status === "open"
                    ? "bg-green-500/20 text-green-400"
                    : ticket.status === "in_progress"
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-zinc-500/20 text-zinc-400"
                }`}
              >
                {ticket.status.replace("_", " ")}
              </span>
              <div className="text-sm text-zinc-500 mt-1">{ticket.created}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 