'use client';

import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TicketStatus } from "@/types/ticket";
import { useState } from "react";

interface TicketHeaderProps {
  created: string;
  tags: string[];
  status: TicketStatus;
  ticketId: number;
}

export function TicketHeader({
  created,
  tags,
  status: initialStatus,
  ticketId,
}: TicketHeaderProps) {
  const [status, setStatus] = useState<TicketStatus>(initialStatus);

  const handleStatusChange = async (newStatus: TicketStatus) => {
    setStatus(newStatus);
    // TODO: Update ticket status in Supabase
    console.log('Status changed:', newStatus);
  };

  const handleReassign = async (agentId: string) => {
    // TODO: Reassign ticket in Supabase
    console.log('Reassigned to:', agentId);
  };

  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <span className="text-zinc-400">Created on {created}</span>
        <div className="flex gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-zinc-800 text-zinc-400 px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Reassign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-zinc-800 border-zinc-700">
            <div className="space-y-4">
              <h4 className="font-medium text-white">Reassign Ticket</h4>
              <Select onValueChange={handleReassign}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="agent1">Sarah Wilson</SelectItem>
                  <SelectItem value="agent2">Mike Johnson</SelectItem>
                  <SelectItem value="agent3">Emma Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
        <Select
          value={status}
          onValueChange={(value) => handleStatusChange(value as TicketStatus)}
        >
          <SelectTrigger className="w-[140px] bg-zinc-800 border-zinc-700 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 