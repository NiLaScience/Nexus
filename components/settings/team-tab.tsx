"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_TEAM_MEMBERS = [
  {
    name: "Sarah Wilson",
    role: "Support Agent",
    email: "sarah@example.com",
  },
  {
    name: "Mike Johnson",
    role: "Team Manager",
    email: "mike@example.com",
  },
  {
    name: "Emma Davis",
    role: "Support Agent",
    email: "emma@example.com",
  },
];

export function TeamTab() {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Team Members</h2>
        <Button>Add Member</Button>
      </div>
      <div className="space-y-4">
        {MOCK_TEAM_MEMBERS.map((member) => (
          <div
            key={member.email}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1">
              <h3 className="font-medium">{member.name}</h3>
              <p className="text-sm text-gray-500">{member.email}</p>
              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                {member.role}
              </span>
            </div>
            <Select defaultValue="active">
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
} 