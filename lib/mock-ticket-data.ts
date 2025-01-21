import { Ticket } from "@/types/ticket";

const MOCK_TICKETS: Ticket[] = [
  {
    id: "1",
    title: "Cannot access dashboard",
    description: "I'm unable to access the dashboard after logging in. The page keeps loading indefinitely.",
    status: "open",
    priority: "high",
    created: "2024-01-15T10:30:00Z",
    tags: ["bug", "urgent"],
    organization: "Acme Corp",
    requester: {
      id: "user1",
      name: "John Smith",
      email: "john@acme.com"
    },
    assignedTo: {
      id: "agent1",
      name: "Sarah Wilson",
      email: "sarah@support.com"
    }
  },
  {
    id: "2",
    title: "Feature request: Dark mode",
    description: "Would love to have a dark mode option in the dashboard.",
    status: "in_progress",
    priority: "low",
    created: "2024-01-14T15:45:00Z",
    tags: ["feature", "ui"],
    organization: "TechCorp",
    requester: {
      id: "user2",
      name: "Alice Johnson",
      email: "alice@techcorp.com"
    },
    assignedTo: {
      id: "agent2",
      name: "Mike Brown",
      email: "mike@support.com"
    }
  }
];

export default MOCK_TICKETS; 