import { TicketForm } from "@/components/tickets/ticket-form";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export default function NewTicketPage() {
  async function createTicket(formData: FormData) {
    'use server';

    const supabase = createServerActionClient({ cookies });

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Extract form data
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = JSON.parse(formData.get('tags') as string) as string[];
    const files = formData.getAll('files') as File[];

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        title,
        description,
        tags,
        status: 'open',
        created_by: user.id,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Upload files if any
    if (files.length > 0) {
      for (const file of files) {
        const { error: uploadError } = await supabase.storage
          .from('ticket-attachments')
          .upload(
            `${ticket.id}/${file.name}`,
            file,
            {
              contentType: file.type,
              upsert: true,
            }
          );

        if (uploadError) throw uploadError;
      }
    }

    revalidatePath('/tickets');
  }

  return (
    <div>
      <TicketForm onSubmit={createTicket} />
    </div>
  );
} 