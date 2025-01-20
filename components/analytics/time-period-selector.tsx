"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePeriodSelectorProps {
  onChange?: (value: string) => void;
}

export function TimePeriodSelector({ onChange }: TimePeriodSelectorProps) {
  return (
    <Select defaultValue="7days" onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Time Period" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7days">Last 7 days</SelectItem>
        <SelectItem value="30days">Last 30 days</SelectItem>
        <SelectItem value="90days">Last 90 days</SelectItem>
      </SelectContent>
    </Select>
  );
} 