import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const MOCK_AGENTS = [
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
] as const;

export function TeamWorkload() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Workload</CardTitle>
        <CardDescription>Current ticket distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_AGENTS.map((agent, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      agent.available ? "bg-success" : "bg-muted"
                    }`}
                  />
                  {agent.agent}
                </span>
                <span>{agent.tickets} tickets</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
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
  );
} 