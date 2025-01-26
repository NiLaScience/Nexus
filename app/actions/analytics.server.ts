'use server';

import { AnalyticsService } from '@/app/services/analytics.service';
export type { AnalyticsMetrics, TicketTrend, StatusDistribution } from '@/app/services/analytics.service';

export async function getAnalyticsDataAction(timePeriod = "7d") {
  const analyticsService = new AnalyticsService();
  return analyticsService.getAnalyticsData(timePeriod);
} 