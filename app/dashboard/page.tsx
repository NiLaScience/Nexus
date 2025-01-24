import { Metadata } from 'next'
import { Dashboard } from '@/components/dashboard/dashboard'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Dashboard | Nexus',
  description: 'View your support metrics and recent activity'
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single();

  if (profile?.role === 'customer') {
    redirect('/tickets');
  }

  return (
    <div className="container mx-auto py-8">
      <Dashboard />
    </div>
  )
} 