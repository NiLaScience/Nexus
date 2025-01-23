import { Link2, Building2Icon, UserCircle2Icon } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RelatedTicket } from "@/types/ticket";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon } from "lucide-react";

interface RelatedTicketsProps {
  tickets: RelatedTicket[];
}

export function RelatedTickets({ tickets }: RelatedTicketsProps) {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'outline';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-4 h-4" /> Related Tickets
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!tickets || tickets.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No related tickets found
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-4">
            {tickets.map((ticket) => (
              <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
                <Card className="p-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Building2Icon className="h-3 w-3" />
                          <span className="truncate">{ticket.organization}</span>
                        </div>
                        <h3 className="font-medium text-sm truncate">{ticket.title}</h3>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Badge variant={getStatusVariant(ticket.status)} className="capitalize">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {ticket.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <UserCircle2Icon className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {ticket.requester.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {ticket.date}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 