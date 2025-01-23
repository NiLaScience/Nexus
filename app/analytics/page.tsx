import { AnalyticsClient } from "../../components/analytics/analytics-client";
import { getAnalyticsDataAction } from "@/app/actions/analytics.server";

export default async function AnalyticsPage() {
  try {
    const initialData = await getAnalyticsDataAction("7d");
    return <AnalyticsClient initialData={initialData} />;
  } catch (error) {
    console.error('Error in analytics page:', error);
    return <div>Error loading analytics data</div>;
  }
} 