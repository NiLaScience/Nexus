import { Database } from "@/types/supabase";

export type TicketMessage = {
  id: string;
  ticket_id: string;
  content: string;
  source: string;
  is_internal: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    role: string;
  };
};

export type AddMessageParams = {
  ticketId: string;
  content: string;
  isInternal?: boolean;
};

export async function getTicketMessagesAction(ticketId: string) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select(`
        *,
        author:profiles(
          id,
          full_name,
          role
        )
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    return { messages, error: null };
  } catch (error) {
    console.error("Error fetching ticket messages:", error);
    return {
      messages: null,
      error: "Failed to fetch ticket messages. Please try again."
    };
  }
}

export async function addMessageAction({ ticketId, content, isInternal = false }: AddMessageParams) {
  const supabase = createServerActionClient<Database>({ cookies });

  try {
    // Validate content
    if (!content?.trim()) {
      throw new Error("Message content cannot be empty");
    }

    // Get current user's ID
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Not authenticated");
    }

    const { data: message, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        author_id: user.id,
        content: content.trim(),
        source: "web",
        is_internal: isInternal
      })
      .select(`
        *,
        author:profiles(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return { message, error: null };
  } catch (error) {
    console.error("Error adding ticket message:", error);
    return {
      message: null,
      error: error instanceof Error ? error.message : "Failed to add message. Please try again."
    };
  }
}

export async function getInternalNotesAction(ticketId: string) {
  const supabase = await createServerActionClient<Database>({ cookies });

  try {
    console.log('Fetching internal notes for ticket:', ticketId);
    
    const { data: messages, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        content,
        created_at,
        author:profiles!ticket_messages_author_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq("ticket_id", ticketId)
      .eq("is_internal", true)
      .order("created_at", { ascending: true });

    if (error) {
      console.error('Error fetching internal notes:', error);
      throw error;
    }

    console.log('Internal notes found:', messages?.length || 0);
    return { messages, error: null };
  } catch (error) {
    console.error("Error fetching internal notes:", error);
    return {
      messages: null,
      error: "Failed to fetch internal notes. Please try again."
    };
  }
}

export async function addInternalNoteAction({ ticketId, content }: AddMessageParams) {
  return addMessageAction({ ticketId, content, isInternal: true });
} 