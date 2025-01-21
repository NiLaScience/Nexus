import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { getTicketsAction } from "@/app/actions/tickets";
import { Ticket } from "@/types/ticket";

export default async function TicketsPage() {
  const { tickets = [], error } = await getTicketsAction();
  
  if (error) {
    // TODO: Add proper error UI component
    return (
      <div className="p-6">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Error loading tickets: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Button asChild>
          <Link href="/tickets/new">New Ticket</Link>
        </Button>
      </div>

      <div className="bg-card border rounded-lg p-4 mb-6">
        <TicketFilters />
      </div>

      <TicketList tickets={tickets} />
    </div>
  );
} 