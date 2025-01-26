import { Metadata } from 'next'
import { Dashboard } from '@/components/dashboard/dashboard'
import { withAgentAuth } from '@/components/hoc/with-auth'

export const metadata: Metadata = {
  title: 'Dashboard | Nexus',
  description: 'View your support metrics and recent activity'
}

async function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Dashboard />
    </div>
  )
}

export default withAgentAuth(DashboardPage) 