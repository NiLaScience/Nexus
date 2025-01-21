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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm font-medium text-zinc-400">Ticket ID</div>
          <div className="text-white">#{String(ticketId).padStart(5, '0')}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-zinc-400">Requester</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <div>
              <div className="text-white">{requester.name}</div>
              <div className="text-sm text-zinc-400">{requester.email}</div>
            </div>
          </div>
        </div>

        <div>
          <div className="text-sm font-medium text-zinc-400">Assigned To</div>
          {assignedTo ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <User className="w-4 h-4 text-zinc-400" />
              </div>
              <div>
                <div className="text-white">{assignedTo.name}</div>
                <div className="text-sm text-zinc-400">{assignedTo.email}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-500 mt-1">Not assigned</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 