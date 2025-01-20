import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Bell, Building2, Shield, User, Users } from "lucide-react";
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
export function Settings() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-2">
            <Shield className="w-4 h-4" /> Admin
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-6">Personal Information</h2>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="John Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select defaultValue="agent">
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agent">Support Agent</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="manager">Team Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Save Changes</Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-6">
              Notification Preferences
            </h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Receive notifications about ticket updates
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-gray-500">
                    Show desktop notifications for new tickets
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Digest</Label>
                  <p className="text-sm text-gray-500">
                    Receive a daily summary of activities
                  </p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="team" className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Team Members</h2>
              <Button>Add Member</Button>
            </div>
            <div className="space-y-4">
              {[
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
              ].map((member) => (
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
        </TabsContent>
        <TabsContent value="admin" className="space-y-6">
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
                      <h4 className="text-sm font-medium mb-2">
                        Assigned Agents
                      </h4>
                      <div className="space-y-1">
                        {team.agents.map((agent) => (
                          <div key={agent} className="text-sm text-gray-600">
                            {agent}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Assigned Clients
                      </h4>
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-6">
              Agent Skills Management
            </h2>
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
                  {[
                    "JavaScript",
                    "React",
                    "Node.js",
                    "Customer Service",
                    "Technical Support",
                    "Project Management",
                  ].map((skill) => (
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
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-6">Client Assignment</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Select className="flex-1">
                  <SelectTrigger>
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acme">Acme Corp</SelectItem>
                    <SelectItem value="techstart">TechStart Inc</SelectItem>
                    <SelectItem value="global">Global Industries</SelectItem>
                  </SelectContent>
                </Select>
                <Select className="flex-1">
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to Team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technical Support</SelectItem>
                    <SelectItem value="customer">Customer Success</SelectItem>
                  </SelectContent>
                </Select>
                <Button>Assign</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
