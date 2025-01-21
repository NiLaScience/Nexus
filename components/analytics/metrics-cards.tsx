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
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Total Tickets
        </h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{metrics.totalTickets.value}</span>
          <span className={`ml-2 text-sm ${metrics.totalTickets.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {metrics.totalTickets.change}
          </span>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Avg Response Time
        </h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{metrics.avgResponseTime.value}</span>
          <span className={`ml-2 text-sm ${metrics.avgResponseTime.change.startsWith('+') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {metrics.avgResponseTime.change}
          </span>
        </div>
      </div>
      <div className="bg-card p-6 rounded-lg shadow">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Resolution Rate
        </h3>
        <div className="flex items-baseline">
          <span className="text-3xl font-bold">{metrics.resolutionRate.value}</span>
          <span className={`ml-2 text-sm ${metrics.resolutionRate.change.startsWith('+') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {metrics.resolutionRate.change}
          </span>
        </div>
      </div>
    </div>
  );
} 