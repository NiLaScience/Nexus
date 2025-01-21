import type { Ticket } from "@/types/ticket";

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    title: "Cannot access dashboard",
    description: "I'm unable to access the dashboard after logging in. The page keeps loading indefinitely.",
    status: "open",
    priority: "high",
    created: "Oct 20, 2023",
    updated: "Oct 20, 2023",
    tags: ["bug", "dashboard"],
    requester: {
      name: "John Doe",
      email: "john.doe@example.com"
    },
    assignedTo: {
      name: "Agent Smith",
      email: "agent.smith@support.com"
    }
  },
  {
    id: 2,
    title: "Need help with API integration",
    description: "Having trouble integrating the REST API with my application. Getting authentication errors.",
    status: "in_progress",
    priority: "medium",
    created: "Oct 19, 2023",
    updated: "Oct 20, 2023",
    tags: ["api", "integration"],
    requester: {
      name: "Jane Smith",
      email: "jane.smith@example.com"
    }
  },
  {
    id: 3,
    title: "Feature request: Dark mode",
    description: "Would love to see a dark mode option in the application. It would help reduce eye strain.",
    status: "open",
    priority: "low",
    created: "Oct 18, 2023",
    updated: "Oct 18, 2023",
    tags: ["feature", "ui"],
    requester: {
      name: "Mike Johnson",
      email: "mike.j@example.com"
    },
    assignedTo: {
      name: "Emma Davis",
      email: "emma.davis@support.com"
    }
  }
];

export function getMockTicket(id: number): Ticket {
  return MOCK_TICKETS.find(ticket => ticket.id === id) || MOCK_TICKETS[0];
}

export function getMockTickets(): Ticket[] {
  return MOCK_TICKETS;
} 