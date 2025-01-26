import { Metadata } from 'next'
import { AnalyticsClient } from "../../components/analytics/analytics-client";
import { getAnalyticsDataAction } from "@/app/actions/analytics.server";
import { withAdminAuth } from '@/components/hoc/with-auth'

export const metadata: Metadata = {
  title: 'Analytics | Nexus',
  description: 'View support analytics and insights'
}

async function AnalyticsPage() {
  try {
    const initialData = await getAnalyticsDataAction("7d");
    return <AnalyticsClient initialData={initialData} />;
  } catch (error) {
    console.error('Error in analytics page:', error);
    return <div>Error loading analytics data</div>;
  }
}

export default withAdminAuth(AnalyticsPage) 