"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TimePeriodSelector } from "@/components/analytics/time-period-selector";
import { TicketTrendChart } from "@/components/analytics/ticket-trend-chart";
import { StatusDistributionChart } from "@/components/analytics/status-distribution-chart";
import { getAnalyticsDataAction } from "@/app/actions/analytics.server";
import { getTeamsAction, getOrganizationsAction } from "@/app/actions/teams.server";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AnalyticsData = {
  metrics: {
    totalTickets: { value: string; change: string };
    avgResponseTime: { value: string; change: string };
    resolutionRate: { value: string; change: string };
  };
  ticketTrend: { name: string; tickets: number }[];
  statusDistribution: { name: string; value: number; color: string }[];
};

interface Organization {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
}

interface AnalyticsClientProps {
  initialData: AnalyticsData;
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const [data, setData] = useState<AnalyticsData>(initialData);
  const [timePeriod, setTimePeriod] = useState("7d");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadFilters() {
      // Load organizations
      const { organizations: orgsData, error: orgsError } = await getOrganizationsAction();
      if (orgsError) {
        console.error('Error loading organizations:', orgsError);
      } else if (orgsData) {
        setOrganizations(orgsData);
      }

      // Load teams
      const { teams: teamsData, error: teamsError } = await getTeamsAction();
      if (teamsError) {
        console.error('Error loading teams:', teamsError);
      } else if (teamsData) {
        setTeams(teamsData);
      }
    }

    loadFilters();
  }, []);

  useEffect(() => {
    async function refreshData() {
      setIsLoading(true);
      try {
        const filters: { organization_id?: string; team_id?: string } = {};
        if (selectedOrg !== "all") filters.organization_id = selectedOrg;
        if (selectedTeam !== "all") filters.team_id = selectedTeam;

        const newData = await getAnalyticsDataAction(timePeriod, filters);
        setData(newData);
      } catch (error) {
        console.error('Error refreshing analytics:', error);
      } finally {
        setIsLoading(false);
      }
    }

    refreshData();
  }, [timePeriod, selectedOrg, selectedTeam]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <div className="flex gap-4">
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Organizations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
          </div>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card p-6 rounded-lg shadow h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card p-6 rounded-lg shadow h-[300px]" />
            <div className="bg-card p-6 rounded-lg shadow h-[300px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <div className="flex gap-4">
          <Select value={selectedOrg} onValueChange={setSelectedOrg}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <TimePeriodSelector value={timePeriod} onChange={setTimePeriod} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {data.metrics.totalTickets.value}
            </h3>
            <p className="text-xs text-muted-foreground">Total Tickets</p>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {data.metrics.totalTickets.change.startsWith("-") ? (
              <span className="text-destructive">
                {data.metrics.totalTickets.change}
              </span>
            ) : (
              <span className="text-success">
                +{data.metrics.totalTickets.change}
              </span>
            )}
            {" from previous period"}
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {data.metrics.avgResponseTime.value}
            </h3>
            <p className="text-xs text-muted-foreground">Average Response Time</p>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {data.metrics.avgResponseTime.change.startsWith("-") ? (
              <span className="text-success">
                {data.metrics.avgResponseTime.change}
              </span>
            ) : (
              <span className="text-destructive">
                +{data.metrics.avgResponseTime.change}
              </span>
            )}
            {" from previous period"}
          </div>
        </Card>
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">
              {data.metrics.resolutionRate.value}
            </h3>
            <p className="text-xs text-muted-foreground">Resolution Rate</p>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {data.metrics.resolutionRate.change.startsWith("-") ? (
              <span className="text-destructive">
                {data.metrics.resolutionRate.change}
              </span>
            ) : (
              <span className="text-success">
                +{data.metrics.resolutionRate.change}
              </span>
            )}
            {" from previous period"}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="p-6">
            <h3 className="font-semibold">Ticket Trend</h3>
          </div>
          <div className="p-6 pt-0 h-[350px]">
            <TicketTrendChart data={data.ticketTrend} />
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <h3 className="font-semibold">Status Distribution</h3>
          </div>
          <div className="p-6 pt-0 h-[350px]">
            <StatusDistributionChart data={data.statusDistribution} />
          </div>
        </Card>
      </div>
    </div>
  );
} 