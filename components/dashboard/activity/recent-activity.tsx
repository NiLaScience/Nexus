import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MOCK_ACTIVITIES = [
  {
    title: "Dashboard access issue",
    update: "New response from Agent Smith",
    time: "5 minutes ago",
    priority: "high",
  },
  {
    title: "API Integration help",
    update: "Status changed to In Progress",
    time: "1 hour ago",
    priority: "medium",
  },
  {
    title: "Mobile app crash",
    update: "New attachment added",
    time: "2 hours ago",
    priority: "high",
  },
] as const;

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ACTIVITIES.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-3 hover:bg-muted rounded-lg cursor-pointer transition-colors duration-200"
            >
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 