import Link from "next/link";
import { Star } from "lucide-react";
import type { RelatedTicket } from "@/types/ticket";

interface RelatedTicketsProps {
  tickets: RelatedTicket[];
}

export function RelatedTickets({ tickets }: RelatedTicketsProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4 flex items-center gap-2">
        <Star className="w-4 h-4" /> Related Tickets
      </h2>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Link
            key={ticket.id}
            href={`/tickets/${ticket.id}`}
            className="block p-3 rounded border hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-sm">{ticket.title}</h3>
                <div className="flex gap-2 mt-1">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs"
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
                      ? "bg-green-100 text-green-800"
                      : ticket.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
                <div className="text-xs text-gray-500 mt-1">{ticket.date}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 