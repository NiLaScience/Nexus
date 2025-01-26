import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecentActivityAction } from "@/app/actions/dashboard.server";
import { Suspense } from "react";
import Link from "next/link";

async function RecentActivityContent() {
  const { activity, error } = await getRecentActivityAction();

  if (error) {
    return (
      <div className="text-center text-destructive py-8">
        {error}
      </div>
    );
  }

  if (!activity || activity.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activity.map((activity, index) => (
        <Link
          key={index}
          href={`/tickets/${activity.ticketId}`}
          className="block"
        >
          <div className="flex items-start justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors duration-200">
            <div className="space-y-1">
              <div className="font-medium">{activity.title}</div>
              <div className="text-sm text-muted-foreground">
                {activity.update}
              </div>
              <div className="text-xs text-muted-foreground">
                {activity.time}
              </div>
            </div>
            <span
              className={`px-2 py-1 rounded text-xs ${
                activity.priority === "high"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-primary/20 text-primary"
              }`}
            >
              {activity.priority}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading activity...</div>}>
          <RecentActivityContent />
        </Suspense>
      </CardContent>
    </Card>
  );
} 