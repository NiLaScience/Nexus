import Link from "next/link";
import { Button } from "@/components/ui/button";
import { QuickStats } from "./stats/quick-stats";
import { RecentActivity } from "./activity/recent-activity";
import { TrendingArticles } from "./articles/trending-articles";
import { TeamWorkload } from "./team/team-workload";
import { CustomerSatisfaction } from "./satisfaction/customer-satisfaction";
import type { DashboardStats } from "../../types/dashboard";

interface DashboardProps {
  initialStats: DashboardStats | null;
  error: string | null;
}

export function Dashboard({ initialStats, error }: DashboardProps) {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <Button className="bg-primary hover:bg-primary/90" asChild>
          <Link href="/tickets/new">New Ticket</Link>
        </Button>
      </div>

      <QuickStats initialStats={initialStats} error={error} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity and Trending Articles */}
        <div className="md:col-span-2 space-y-6">
          <RecentActivity />
          <TrendingArticles />
        </div>

        {/* Team Workload and Customer Satisfaction */}
        <div className="space-y-6">
          <TeamWorkload />
          <CustomerSatisfaction />
        </div>
      </div>
    </div>
  );
} 