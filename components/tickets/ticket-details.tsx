import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
}

interface TicketDetailsProps {
  ticketId: string;
  requester?: UserProfile | null;
  assignedTo?: UserProfile | null;
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
          {requester ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {requester.full_name?.[0] ?? '?'}
              </div>
              <div>
                <div>{requester.full_name || 'Anonymous'}</div>
                <div className="text-xs text-muted-foreground">{requester.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Unknown requester</div>
          )}
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
          {assignedTo ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {assignedTo.full_name?.[0] ?? '?'}
              </div>
              <div>
                <div>{assignedTo.full_name || 'Anonymous'}</div>
                <div className="text-xs text-muted-foreground">{assignedTo.role}</div>
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