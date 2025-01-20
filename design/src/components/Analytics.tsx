import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
const MOCK_TICKET_TREND = [
  {
    name: "Mon",
    tickets: 4,
  },
  {
    name: "Tue",
    tickets: 7,
  },
  {
    name: "Wed",
    tickets: 5,
  },
  {
    name: "Thu",
    tickets: 8,
  },
  {
    name: "Fri",
    tickets: 6,
  },
  {
    name: "Sat",
    tickets: 3,
  },
  {
    name: "Sun",
    tickets: 2,
  },
];
const MOCK_STATUS_DISTRIBUTION = [
  {
    name: "Open",
    value: 15,
    color: "#22c55e",
  },
  {
    name: "In Progress",
    value: 8,
    color: "#3b82f6",
  },
  {
    name: "Closed",
    value: 25,
    color: "#64748b",
  },
];
export function Analytics() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <Select defaultValue="7days">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Tickets
          </h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">48</span>
            <span className="ml-2 text-sm text-green-600">+12.5%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Avg Response Time
          </h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">2.4h</span>
            <span className="ml-2 text-sm text-red-600">+0.8h</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Resolution Rate
          </h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">92%</span>
            <span className="ml-2 text-sm text-green-600">+5%</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-base font-medium mb-4">Ticket Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_TICKET_TREND}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-base font-medium mb-4">Status Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MOCK_STATUS_DISTRIBUTION}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {MOCK_STATUS_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {MOCK_STATUS_DISTRIBUTION.map((status) => (
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
      </div>
    </div>
  );
}
