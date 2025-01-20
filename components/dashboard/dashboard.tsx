import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuickStats } from "./stats/quick-stats";
import { RecentActivity } from "./activity/recent-activity";
import { TrendingArticles } from "./articles/trending-articles";
import { TeamWorkload } from "./team/team-workload";

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium text-white">Dashboard</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" asChild>
          <Link href="/tickets/new">New Ticket</Link>
        </Button>
      </div>

      <QuickStats />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity and Trending Articles */}
        <div className="md:col-span-2 space-y-6">
          <RecentActivity />
          <TrendingArticles />
        </div>

        {/* Team Workload */}
        <div className="space-y-6">
          <TeamWorkload />
        </div>
      </div>
    </div>
  );
} 