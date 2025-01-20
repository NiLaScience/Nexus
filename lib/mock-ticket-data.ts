import type { Ticket } from "@/types/ticket";

export const getMockTicket = (id: number): Ticket => ({
  id,
  title: "Cannot access dashboard",
  status: "open",
  created: "Oct 20, 2023",
  tags: ["bug", "dashboard"],
  description: "I'm unable to access the dashboard after logging in. The page keeps loading indefinitely.",
}); 