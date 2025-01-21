import { TicketForm } from "@/components/tickets/ticket-form";
import { createTicketAction } from "@/app/actions/tickets/create.server";

export default function NewTicketPage() {
  return (
    <div>
      <TicketForm onSubmit={createTicketAction} />
    </div>
  );
} 