import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { Ticket } from "@/types/ticket";
// import { createClient } from "@/lib/supabase/server";

// TODO: Replace with actual data fetching from Supabase
const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    title: "Cannot access dashboard",
    status: "open",
    priority: "high",
    created: "2023-10-20",
    updated: "2023-10-20",
    tags: ["bug", "dashboard"],
    description: "Unable to access the main dashboard after login.",
    requester: {
      name: "John Smith",
      email: "john@example.com"
    }
  },
  {
    id: 2,
    title: "Feature request: Dark mode",
    status: "in_progress",
    priority: "medium",
    created: "2023-10-19",
    updated: "2023-10-19",
    tags: ["feature", "ui"],
    description: "Would like to request a dark mode option for better visibility.",
    requester: {
      name: "Sarah Johnson",
      email: "sarah@example.com"
    },
    assignedTo: {
      name: "Mike Wilson",
      email: "mike@support.com"
    }
  },
  {
    id: 3,
    title: "Login issues on mobile",
    status: "closed",
    priority: "low",
    created: "2023-10-18",
    updated: "2023-10-18",
    tags: ["mobile", "auth"],
    description: "Cannot log in using the mobile app on iOS.",
    requester: {
      name: "David Lee",
      email: "david@example.com"
    }
  },
];

export default async function TicketsPage() {
  // const supabase = createClient();
  
  // TODO: Implement Supabase query
  // const { data: tickets, error } = await supabase
  //   .from('tickets')
  //   .select('*')
  //   .order('created_at', { ascending: false });
  
  // if (error) {
  //   console.error('Error fetching tickets:', error);
  //   // TODO: Add proper error handling UI
  //   return <div>Error loading tickets</div>;
  // }
  
  const tickets = MOCK_TICKETS;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-white">Tickets</h1>
        <Link href="/tickets/new">
          <Button className="bg-blue-600 hover:bg-blue-700">New Ticket</Button>
        </Link>
      </div>
      
      <TicketFilters />
      <TicketList tickets={tickets} />
    </div>
  );
} 