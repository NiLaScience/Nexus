import { Metadata } from 'next'
import { Dashboard } from '@/components/dashboard/dashboard'
import { withAgentAuth } from '@/components/hoc/with-auth'
import { getDashboardStatsAction } from '@/app/actions/dashboard.server'

export const metadata: Metadata = {
  title: 'Dashboard | Nexus',
  description: 'View your support metrics and recent activity'
}

async function DashboardPage() {
  const { stats, error } = await getDashboardStatsAction();

  return (
    <div className="container mx-auto py-8">
      <Dashboard initialStats={stats} error={error} />
    </div>
  )
}

export default withAgentAuth(DashboardPage) 