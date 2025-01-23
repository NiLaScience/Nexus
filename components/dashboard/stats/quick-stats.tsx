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
import { getDashboardStatsAction } from "@/app/actions/dashboard.server";
import { Suspense } from "react";

async function QuickStatsContent() {
  const stats = await getDashboardStatsAction();
  
  if (!stats) {
    return null;
  }

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
          <div className="text-2xl font-medium">{stats.openTickets.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.openTickets.highPriority} high priority
          </p>
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
          <div className="text-2xl font-medium">{stats.avgResponseTime.value.toFixed(1)}h</div>
          <p className={`text-xs ${stats.avgResponseTime.change < 0 ? "text-success" : "text-destructive"}`}>
            {stats.avgResponseTime.change > 0 ? "↑" : "↓"} {Math.abs(stats.avgResponseTime.change)}h from last week
          </p>
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
          <div className="text-2xl font-medium">{stats.csatScore.value}</div>
          <p className="text-xs text-muted-foreground">{stats.csatScore.period}</p>
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
          <div className="text-2xl font-medium">{stats.unassigned.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.unassigned.total > 0 ? "Needs attention" : "All tickets assigned"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function QuickStats() {
  return (
    <Suspense fallback={<div>Loading stats...</div>}>
      <QuickStatsContent />
    </Suspense>
  );
} 