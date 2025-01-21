'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TicketFilters } from "@/components/tickets/ticket-filters";
import { TicketList } from "@/components/tickets/ticket-list";
import { getTicketsAction } from "@/app/actions/tickets";
import { useState, useEffect } from "react";
import type { Ticket } from "@/types/ticket";
import type { TicketFilters as ServerFilters } from "@/app/actions/tickets";

interface UIFilters {
  search?: string;
  timePeriod?: string;
  status?: string;
  client?: string;
  agent?: string;
}

function convertFilters(uiFilters: UIFilters): ServerFilters {
  const serverFilters: ServerFilters = {};
  
  if (uiFilters.status && uiFilters.status !== 'all') {
    serverFilters.status = [uiFilters.status];
  }
  
  if (uiFilters.agent && uiFilters.agent !== 'all') {
    serverFilters.assigned_to = uiFilters.agent;
  }

  if (uiFilters.client && uiFilters.client !== 'all') {
    serverFilters.organization_id = uiFilters.client;
  }

  if (uiFilters.search) {
    serverFilters.search = uiFilters.search;
  }
  
  return serverFilters;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async (filters: ServerFilters = {}) => {
    setIsLoading(true);
    try {
      const result = await getTicketsAction(filters);
      if (result.error) {
        setError(result.error);
      } else {
        setTickets(result.tickets || []);
      }
    } catch (err) {
      setError('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleFilterChange = async (uiFilters: UIFilters) => {
    const serverFilters = convertFilters(uiFilters);
    await loadTickets(serverFilters);
  };

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
        <TicketFilters onFilterChange={handleFilterChange} />
      </div>

      {isLoading ? (
        <div className="text-center p-4">Loading tickets...</div>
      ) : (
        <TicketList tickets={tickets} />
      )}
    </div>
  );
} 