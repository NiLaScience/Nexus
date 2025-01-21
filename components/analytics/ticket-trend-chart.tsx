"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface TicketTrendChartProps {
  data: Array<{
    name: string;
    tickets: number;
  }>;
}

export function TicketTrendChart({ data }: TicketTrendChartProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <h3 className="text-base font-medium mb-4">Ticket Trend</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              className="text-muted-foreground text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-muted-foreground text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Bar dataKey="tickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 