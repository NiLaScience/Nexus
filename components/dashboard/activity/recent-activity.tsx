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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Recent Activity</CardTitle>
        <CardDescription className="text-zinc-400">
          Latest updates from your tickets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_ACTIVITIES.map((activity, index) => (
            <div
              key={index}
              className="flex items-start justify-between p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors duration-200"
            >
              <div className="space-y-1">
                <div className="font-medium text-white">
                  {activity.title}
                </div>
                <div className="text-sm text-zinc-400">
                  {activity.update}
                </div>
                <div className="text-xs text-zinc-500">
                  {activity.time}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${activity.priority === "high" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}
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