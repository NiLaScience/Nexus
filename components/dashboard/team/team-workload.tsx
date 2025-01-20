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
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-white">Team Workload</CardTitle>
        <CardDescription className="text-zinc-400">
          Current ticket distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {MOCK_AGENTS.map((agent, index) => (
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
  );
} 