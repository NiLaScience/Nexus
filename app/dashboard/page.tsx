import { Metadata } from 'next'
import { Dashboard } from '@/components/dashboard/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Nexus',
  description: 'View your support metrics and recent activity'
}

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <Dashboard />
    </div>
  )
} 