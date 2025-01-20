import { Clock } from "lucide-react";
import type { TimelineEvent } from "@/types/ticket";

interface TicketTimelineProps {
  events: TimelineEvent[];
}

export function TicketTimeline({ events }: TicketTimelineProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="font-medium mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4" /> Timeline
      </h2>
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="relative pl-4 border-l border-gray-200">
            <div className="absolute w-2 h-2 bg-gray-200 rounded-full -left-1 top-2" />
            <div>
              <span className="text-sm text-gray-500">{event.date}</span>
              <div className="mt-1">
                <span className="font-medium">{event.user}</span>
                <span className="text-gray-600 text-sm ml-2">
                  {event.description}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 