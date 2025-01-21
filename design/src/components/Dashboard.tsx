import React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Clock,
  Flag,
  MessageSquare,
  Star,
  ThumbsUp,
  Timer,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function Dashboard() {
  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium">Dashboard</h1>
        <Button className="bg-primary hover:bg-primary/90" asChild>
          <Link href="/tickets/new">New Ticket</Link>
        </Button>
      </div>
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-zinc-400">
              Open Tickets
            </CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">12</div>
            <p className="text-xs text-zinc-500">4 high priority</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-zinc-400">
              Avg Response Time
            </CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">1.8h</div>
            <p className="text-xs text-green-500">↓ 0.3h from last week</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-zinc-400">
              CSAT Score
            </CardTitle>
            <ThumbsUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">4.8</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-normal text-zinc-400">
              Unassigned
            </CardTitle>
            <Users className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-medium">3</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Activity</CardTitle>
              <CardDescription className="text-zinc-400">
                Latest updates from your tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "Dashboard access issue",
                    update: "New response from Agent Smith",
                    time: "5 minutes ago",
                    priority: "high",
                  },
                  {
                    title: "API Integration help",
                    update: "Status changed to In Progress",
                    time: "1 hour ago",
                    priority: "medium",
                  },
                  {
                    title: "Mobile app crash",
                    update: "New attachment added",
                    time: "2 hours ago",
                    priority: "high",
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-3 hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors duration-200"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white">
                        {activity.title}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {activity.update}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {activity.time}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        activity.priority === "high"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-primary/20 text-primary"
                      }`}
                    >
                      {activity.priority}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Trending Articles</CardTitle>
              <CardDescription className="text-zinc-400">
                Most viewed knowledge base articles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: "How to reset your password",
                    views: "1.2k views",
                    helpful: "95% found helpful",
                  },
                  {
                    title: "Getting started guide",
                    views: "956 views",
                    helpful: "89% found helpful",
                  },
                  {
                    title: "API Documentation",
                    views: "823 views",
                    helpful: "92% found helpful",
                  },
                ].map((article, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between hover:bg-zinc-800/50 p-3 rounded-lg cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-white">
                        {article.title}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-zinc-400">
                        <span>{article.views}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {article.helpful}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Side Section */}
        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Team Workload</CardTitle>
              <CardDescription className="text-zinc-400">
                Current ticket distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    agent: "Agent Smith",
                    tickets: 8,
                    available: true,
                  },
                  {
                    agent: "Agent Jones",
                    tickets: 5,
                    available: true,
                  },
                  {
                    agent: "Agent Brown",
                    tickets: 10,
                    available: false,
                  },
                ].map((agent, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${agent.available ? "bg-green-500" : "bg-zinc-600"}`}
                        />
                        {agent.agent}
                      </span>
                      <span>{agent.tickets} tickets</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${(agent.tickets / 15) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                Customer Satisfaction
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Recent ratings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    rating: 5,
                    count: 28,
                  },
                  {
                    rating: 4,
                    count: 12,
                  },
                  {
                    rating: 3,
                    count: 4,
                  },
                  {
                    rating: 2,
                    count: 2,
                  },
                  {
                    rating: 1,
                    count: 1,
                  },
                ].map((rating) => (
                  <div key={rating.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-24">
                      {Array.from({
                        length: rating.rating,
                      }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{
                          width: `${(rating.count / 47) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="w-12 text-sm text-gray-500">
                      {rating.count}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
