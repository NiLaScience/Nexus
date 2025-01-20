"use client";

import { TimePeriodSelector } from "@/components/analytics/time-period-selector";
import { MetricsCards } from "@/components/analytics/metrics-cards";
import { TicketTrendChart } from "@/components/analytics/ticket-trend-chart";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";

// Mock data (will be replaced with real data from Supabase)
const MOCK_TICKET_TREND = [
  { name: "Mon", tickets: 4 },
  { name: "Tue", tickets: 7 },
  { name: "Wed", tickets: 5 },
  { name: "Thu", tickets: 8 },
  { name: "Fri", tickets: 6 },
  { name: "Sat", tickets: 3 },
  { name: "Sun", tickets: 2 },
];

const MOCK_STATUS_DISTRIBUTION = [
  { name: "Open", value: 15, color: "#22c55e" },
  { name: "In Progress", value: 8, color: "#3b82f6" },
  { name: "Closed", value: 25, color: "#64748b" },
];

const MOCK_METRICS = {
  totalTickets: { value: "48", change: "+12.5%" },
  avgResponseTime: { value: "2.4h", change: "+0.8h" },
  resolutionRate: { value: "92%", change: "+5%" },
};

export default function AnalyticsPage() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <TimePeriodSelector />
      </div>

      <MetricsCards metrics={MOCK_METRICS} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TicketTrendChart data={MOCK_TICKET_TREND} />
        <StatusDistributionChart data={MOCK_STATUS_DISTRIBUTION} />
      </div>
    </div>
  );
} 