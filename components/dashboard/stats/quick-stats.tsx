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
import type { DashboardStats } from "@/types/dashboard";

interface QuickStatsProps {
  initialStats: DashboardStats | null;
  error: string | null;
}

export function QuickStats({ initialStats: stats, error }: QuickStatsProps) {
  if (error) {
    return (
      <div className="text-center text-destructive py-8">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No stats available
      </div>
    );
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
            Response Time
          </CardTitle>
          <Timer className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.responseTime.average}h</div>
          <p className="text-xs text-muted-foreground">
            {stats.responseTime.trend > 0 ? "+" : ""}{stats.responseTime.trend}% from last week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Customer Satisfaction
          </CardTitle>
          <ThumbsUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.satisfaction.score}%</div>
          <p className="text-xs text-muted-foreground">
            {stats.satisfaction.responses} responses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">
            Team Size
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{stats.teamSize.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.teamSize.online} online
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 