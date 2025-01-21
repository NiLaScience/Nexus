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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Open Tickets
          </CardTitle>
          <Flag className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">12</div>
          <p className="text-xs text-muted-foreground">4 high priority</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Avg Response Time
          </CardTitle>
          <Timer className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">1.8h</div>
          <p className="text-xs text-success">↓ 0.3h from last week</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            CSAT Score
          </CardTitle>
          <ThumbsUp className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">4.8</div>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Unassigned
          </CardTitle>
          <Users className="h-4 w-4 text-warning" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">3</div>
          <p className="text-xs text-muted-foreground">Needs attention</p>
        </CardContent>
      </Card>
    </div>
  );
} 