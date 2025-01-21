import { Link2 } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RelatedTicket } from "@/types/ticket";

interface RelatedTicketsProps {
  tickets: RelatedTicket[];
}

export function RelatedTickets({ tickets }: RelatedTicketsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-4 h-4" /> Related Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block p-3 rounded-lg hover:bg-muted transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-medium">{ticket.title}</div>
                  <div className="flex gap-2">
                    {ticket.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{ticket.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 