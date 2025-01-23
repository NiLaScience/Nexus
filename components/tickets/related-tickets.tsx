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
        {tickets.length === 0 ? (
          <div className="text-center text-muted-foreground">No related tickets found</div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4">
            {tickets.map((ticket, index) => (
              <div
                key={ticket.id}
                className={`p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors ${
                  index >= 3 ? "" : "mb-2"
                }`}
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 