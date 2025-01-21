import { Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TimelineEvent } from "@/types/ticket";

interface TimelineProps {
  events: TimelineEvent[];
}

export function TicketTimeline({ events }: TimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4" /> Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={event.id} className="relative pl-6">
              {/* Timeline connector */}
              {index !== events.length - 1 && (
                <div className="absolute left-[9px] top-[24px] bottom-[-12px] w-[2px] bg-muted" />
              )}
              
              {/* Timeline dot */}
              <div className="absolute left-0 top-[6px] w-5 h-5 rounded-full border-2 border-muted bg-card" />
              
              <div>
                <div className="text-sm text-muted-foreground">{event.date}</div>
                <div className="text-sm mt-1">
                  <span className="font-medium">{event.user}</span>
                  <span className="text-muted-foreground ml-1">{event.description}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 