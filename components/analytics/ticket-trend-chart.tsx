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

interface TicketTrendData {
  name: string;
  tickets: number;
}

interface TicketTrendChartProps {
  data: TicketTrendData[];
}

export function TicketTrendChart({ data }: TicketTrendChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-base font-medium mb-4">Ticket Trend</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
} 