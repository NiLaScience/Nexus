import {
  Flag,
  Timer,
  ThumbsUp,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-zinc-400">
            Open Tickets
          </CardTitle>
          <Flag className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">12</div>
          <p className="text-xs text-zinc-500">4 high priority</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-zinc-400">
            Avg Response Time
          </CardTitle>
          <Timer className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">1.8h</div>
          <p className="text-xs text-green-500">↓ 0.3h from last week</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-zinc-400">
            CSAT Score
          </CardTitle>
          <ThumbsUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">4.8</div>
          <p className="text-xs text-zinc-500">Last 30 days</p>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-zinc-400">
            Unassigned
          </CardTitle>
          <Users className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">3</div>
          <p className="text-xs text-zinc-500">Needs attention</p>
        </CardContent>
      </Card>
    </div>
  );
} 