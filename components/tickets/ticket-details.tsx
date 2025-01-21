import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";

interface TicketDetailsProps {
  ticketId: number;
  requester: {
    name: string;
    email: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
}

export function TicketDetails({ ticketId, requester, assignedTo }: TicketDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Ticket ID</div>
          <div>#{String(ticketId).padStart(5, '0')}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">Requester</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <div>{requester.name}</div>
              <div className="text-sm text-muted-foreground">{requester.email}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
          {assignedTo ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div>{assignedTo.name}</div>
                <div className="text-sm text-muted-foreground">{assignedTo.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Not assigned</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 