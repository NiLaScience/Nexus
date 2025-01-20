'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TicketFiltersProps {
  onFilterChange?: (filters: {
    search?: string;
    timePeriod?: string;
    status?: string;
    client?: string;
    agent?: string;
  }) => void;
}

export function TicketFilters({ onFilterChange }: TicketFiltersProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-400" />
            <Input 
              className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-400" 
              placeholder="Search tickets..." 
              onChange={(e) => onFilterChange?.({ search: e.target.value })}
            />
          </div>
          <Select 
            defaultValue="7days"
            onValueChange={(value) => onFilterChange?.({ timePeriod: value })}
          >
            <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4">
          <Select 
            defaultValue="all"
            onValueChange={(value) => onFilterChange?.({ status: value })}
          >
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => onFilterChange?.({ client: value })}
          >
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="acme">Acme Corp</SelectItem>
              <SelectItem value="globex">Globex Corporation</SelectItem>
              <SelectItem value="initech">Initech</SelectItem>
            </SelectContent>
          </Select>
          <Select
            onValueChange={(value) => onFilterChange?.({ agent: value })}
          >
            <SelectTrigger className="w-full bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Assigned Agent" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700">
              <SelectItem value="all">All Agents</SelectItem>
              <SelectItem value="smith">Agent Smith</SelectItem>
              <SelectItem value="jones">Agent Jones</SelectItem>
              <SelectItem value="brown">Agent Brown</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
} 