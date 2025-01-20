"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface StatusDistributionChartProps {
  data: StatusData[];
}

export function StatusDistributionChart({ data }: StatusDistributionChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-base font-medium mb-4">Status Distribution</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        {data.map((status) => (
          <div key={status.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: status.color,
              }}
            />
            <span className="text-sm text-gray-600">{status.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 