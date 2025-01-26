import { Metadata } from 'next'
import { AnalyticsClient } from "@/components/analytics/analytics-client";
import { getAnalyticsDataAction } from "@/app/actions/analytics.server";
import { withAdminAuth } from '@/components/hoc/with-auth'
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Analytics | Nexus',
  description: 'View support analytics and insights'
}

async function AnalyticsContent() {
  try {
    const initialData = await getAnalyticsDataAction("7d");
    return <AnalyticsClient initialData={initialData} />;
  } catch (error) {
    console.error('Error in analytics page:', error);
    return <div>Error loading analytics data</div>;
  }
}

function AnalyticsPage() {
  return (
    <Suspense fallback={<div>Loading analytics...</div>}>
      <AnalyticsContent />
    </Suspense>
  );
}

export default withAdminAuth(AnalyticsPage) 