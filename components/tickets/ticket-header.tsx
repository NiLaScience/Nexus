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

interface TicketHeaderProps {
  created: string;
  tags: string[];
  status: "open" | "in_progress" | "closed";
}

export function TicketHeader({ created, tags, status }: TicketHeaderProps) {
  return (
    <div className="flex justify-between items-start">
      <div>
        <span className="text-muted-foreground">Created on {created}</span>
        <div className="flex gap-2 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Reassign
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <h4 className="font-medium">Reassign Ticket</h4>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent1">Sarah Wilson</SelectItem>
                  <SelectItem value="agent2">Mike Johnson</SelectItem>
                  <SelectItem value="agent3">Emma Davis</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end">
                <Button size="sm">Reassign</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <Select defaultValue={status}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 