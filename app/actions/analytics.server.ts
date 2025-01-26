'use server';

import { analyticsService } from '@/app/services/analytics.service';
export type { AnalyticsMetrics, TicketTrend, StatusDistribution } from '@/app/services/analytics.service';

export async function getAnalyticsDataAction(timePeriod: string = "7d", filters?: { organization_id?: string; team_id?: string }) {
  return analyticsService.getAnalyticsData(timePeriod, filters);
} 