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
    <div className="bg-white rounded-lg shadow">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          href={`/tickets/${ticket.id}`}
          className="block border-b last:border-0 p-4 hover:bg-gray-50"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{ticket.title}</h3>
              <div className="flex gap-2 mt-2">
                {ticket.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
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
              <div className="text-sm text-gray-500 mt-1">{ticket.created}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 