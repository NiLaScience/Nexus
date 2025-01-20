"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_TEAMS = [
  {
    id: 1,
    name: "Technical Support",
    focus: "Technical Issues",
    agents: ["Sarah Wilson", "Emma Davis"],
    clients: ["Acme Corp", "TechStart Inc"],
    skills: ["JavaScript", "React", "Node.js"],
  },
  {
    id: 2,
    name: "Customer Success",
    focus: "Account Management",
    agents: ["Mike Johnson"],
    clients: ["Global Industries", "Local Business LLC"],
    skills: ["Communication", "Project Management"],
  },
];

const COMMON_SKILLS = [
  "JavaScript",
  "React",
  "Node.js",
  "Customer Service",
  "Technical Support",
  "Project Management",
];

export function AdminTab() {
  return (
    <div className="space-y-6">
      {/* Team Management Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Team Management</h2>
          <Button>Create New Team</Button>
        </div>
        <div className="space-y-6">
          {MOCK_TEAMS.map((team) => (
            <div key={team.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium">{team.name}</h3>
                  <p className="text-sm text-gray-500">{team.focus}</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit Team
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Team Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {team.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Assigned Agents</h4>
                  <div className="space-y-1">
                    {team.agents.map((agent) => (
                      <div key={agent} className="text-sm text-gray-600">
                        {agent}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Assigned Clients</h4>
                  <div className="space-y-1">
                    {team.clients.map((client) => (
                      <div key={client} className="text-sm text-gray-600">
                        {client}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                <Button variant="outline" size="sm">
                  Manage Skills
                </Button>
                <Button variant="outline" size="sm">
                  Assign Agents
                </Button>
                <Button variant="outline" size="sm">
                  Manage Clients
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Skills Management Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-6">Agent Skills Management</h2>
        <div className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sarah">Sarah Wilson</SelectItem>
                <SelectItem value="mike">Mike Johnson</SelectItem>
                <SelectItem value="emma">Emma Davis</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Add new skill" className="flex-1" />
            <Button>Add Skill</Button>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-medium mb-3">Common Skills</h3>
            <div className="flex flex-wrap gap-2">
              {COMMON_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Client Assignment Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-6">Client Assignment</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acme">Acme Corp</SelectItem>
                  <SelectItem value="techstart">TechStart Inc</SelectItem>
                  <SelectItem value="global">Global Industries</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Assign to Team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tech">Technical Support</SelectItem>
                  <SelectItem value="customer">Customer Success</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Assign</Button>
          </div>
        </div>
      </div>
    </div>
  );
} 