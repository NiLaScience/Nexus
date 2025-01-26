'use server';

import { AnalyticsService } from '@/app/services/analytics.service';
export type { AnalyticsMetrics, TicketTrend, StatusDistribution } from '@/app/services/analytics.service';

interface AnalyticsFilters {
  organization_id?: string;
  team_id?: string;
}

export async function getAnalyticsDataAction(timePeriod = "7d", filters: AnalyticsFilters = {}) {
  const analyticsService = new AnalyticsService();
  return analyticsService.getAnalyticsData(timePeriod, filters);
} 