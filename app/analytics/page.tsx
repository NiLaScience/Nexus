import { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from "../../components/analytics/analytics-client";
import { getAnalyticsDataAction } from "@/app/actions/analytics.server";

export const metadata: Metadata = {
  title: 'Analytics | Nexus',
  description: 'View support analytics and insights'
}

export default async function AnalyticsPage() {
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

  try {
    const initialData = await getAnalyticsDataAction("7d");
    return <AnalyticsClient initialData={initialData} />;
  } catch (error) {
    console.error('Error in analytics page:', error);
    return <div>Error loading analytics data</div>;
  }
} 