import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
const MOCK_TICKETS = [
  {
    id: 1,
    title: "Cannot access dashboard",
    status: "open",
    created: "2023-10-20",
    tags: ["bug", "dashboard"],
  },
  {
    id: 2,
    title: "Feature request: Dark mode",
    status: "in_progress",
    created: "2023-10-19",
    tags: ["feature", "ui"],
  },
  {
    id: 3,
    title: "Login issues on mobile",
    status: "closed",
    created: "2023-10-18",
    tags: ["mobile", "auth"],
  },
];
export function TicketList() {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Link to="/new">
          <Button>New Ticket</Button>
        </Link>
      </div>
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input className="pl-9" placeholder="Search tickets..." />
            </div>
            <Select defaultValue="7days">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="90days">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-4">
            <Select defaultValue="all">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="acme">Acme Corp</SelectItem>
                <SelectItem value="globex">Globex Corporation</SelectItem>
                <SelectItem value="initech">Initech</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assigned Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="smith">Agent Smith</SelectItem>
                <SelectItem value="jones">Agent Jones</SelectItem>
                <SelectItem value="brown">Agent Brown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow">
        {MOCK_TICKETS.map((ticket) => (
          <Link
            key={ticket.id}
            to={`/ticket/${ticket.id}`}
            className="block border-b last:border-0 p-4 hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{ticket.title}</h3>
                <div className="flex gap-2 mt-2">
                  {ticket.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs ${ticket.status === "open" ? "bg-green-100 text-green-800" : ticket.status === "in_progress" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
                <div className="text-sm text-gray-500 mt-1">
                  {ticket.created}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
