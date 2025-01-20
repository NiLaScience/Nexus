import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";

type Ticket = {
  id: number;
  title: string;
  status: "open" | "in_progress" | "closed";
  created: string;
  tags: string[];
};

// TODO: Replace with actual data fetching from Supabase
const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    title: "Cannot access dashboard",
    status: "open",
    created: "2023-10-20",
    tags: ["bug", "dashboard"],
  },
  {
    id: 2,
    title: "Feature request: Dark mode",
    status: "in_progress",
    created: "2023-10-19",
    tags: ["feature", "ui"],
  },
  {
    id: 3,
    title: "Login issues on mobile",
    status: "closed",
    created: "2023-10-18",
    tags: ["mobile", "auth"],
  },
];

export default async function TicketsPage() {
  // TODO: Fetch tickets from Supabase
  const tickets = MOCK_TICKETS;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Link href="/tickets/new">
          <Button>New Ticket</Button>
        </Link>
      </div>
      
      <TicketFilters />
      <TicketList tickets={tickets} />
    </div>
  );
} 