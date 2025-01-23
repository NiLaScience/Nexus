import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTeamWorkloadAction } from "@/app/actions/dashboard.server";
import { Suspense } from "react";
import type { TeamMember } from "@/app/actions/dashboard.server";

// Maximum tickets an agent should handle (used for progress bar)
const MAX_TICKETS = 15;

async function TeamWorkloadContent() {
  const teams = await getTeamWorkloadAction();

  return (
    <div className="space-y-8">
      {teams.map((team) => (
        <div key={team.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-muted-foreground">
              {team.name}
            </h3>
            <span className="text-xs text-muted-foreground">
              {team.members.reduce((sum: number, m: TeamMember) => sum + m.ticketCount, 0)} total tickets
            </span>
          </div>
          <div className="space-y-4">
            {team.members.map((agent: TeamMember) => (
              <div key={agent.id} className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.available ? "bg-success" : "bg-muted"
                      }`}
                    />
                    {agent.name}
                  </span>
                  <span>{agent.ticketCount} tickets</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{
                      width: `${(agent.ticketCount / MAX_TICKETS) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {teams.length === 0 && (
        <div className="text-center text-muted-foreground py-8">
          No teams found
        </div>
      )}
    </div>
  );
}

export function TeamWorkload() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>Current ticket distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<div>Loading team workload...</div>}>
          <TeamWorkloadContent />
        </Suspense>
      </CardContent>
    </Card>
  );
} 