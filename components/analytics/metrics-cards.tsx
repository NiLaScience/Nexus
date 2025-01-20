"use client";

interface MetricCardProps {
  title: string;
  value: string;
  change: {
    value: string;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, change }: MetricCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-baseline">
        <span className="text-3xl font-bold">{value}</span>
        <span className={`ml-2 text-sm ${change.isPositive ? "text-green-600" : "text-red-600"}`}>
          {change.value}
        </span>
      </div>
    </div>
  );
}

interface MetricsCardsProps {
  metrics: {
    totalTickets: { value: string; change: string };
    avgResponseTime: { value: string; change: string };
    resolutionRate: { value: string; change: string };
  };
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <MetricCard
        title="Total Tickets"
        value={metrics.totalTickets.value}
        change={{
          value: metrics.totalTickets.change,
          isPositive: !metrics.totalTickets.change.startsWith("-"),
        }}
      />
      <MetricCard
        title="Avg Response Time"
        value={metrics.avgResponseTime.value}
        change={{
          value: metrics.avgResponseTime.change,
          isPositive: metrics.avgResponseTime.change.startsWith("-"),
        }}
      />
      <MetricCard
        title="Resolution Rate"
        value={metrics.resolutionRate.value}
        change={{
          value: metrics.resolutionRate.change,
          isPositive: !metrics.resolutionRate.change.startsWith("-"),
        }}
      />
    </div>
  );
} 