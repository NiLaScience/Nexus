'use server';

import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

type BaseTicketMessage = Database['public']['Tables']['ticket_messages']['Row'];

export interface TicketMessage extends BaseTicketMessage {
  author?: {
    id: string;
    full_name: string | null;
    role: string;
  };
  attachments?: {
    id: string;
    name: string;
    size: number;
    mime_type: string;
    storage_path: string;
    created_at: string;
  }[];
  is_internal: boolean;
}

export interface AddMessageParams {
  ticketId: string;
  content: string;
  isInternal?: boolean;
}

export interface GetMessagesParams {
  ticketId: string;
  isInternal?: boolean;
}

export interface GetMessagesResponse {
  messages: TicketMessage[];
  error: string | null;
}

export interface AddMessageResponse {
  message: TicketMessage | null;
  error: string | null;
}

export interface DeleteMessageParams {
  messageId: string;
}

export interface DeleteMessageResponse {
  success: boolean;
  error: string | null;
};

export async function addMessageAction({ ticketId, content, isInternal = false }: AddMessageParams) {
  const supabase = await createClient();

  const { data: message, error } = await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      content,
      is_internal: isInternal,
    })
    .select()
    .single();

  if (error) {
    return { message: null, error: error.message };
  }

  return { message, error: null };
}

export async function getMessagesAction({ ticketId, isInternal }: GetMessagesParams) {
  const supabase = await createClient();

  let query = supabase
    .from('ticket_messages')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  if (typeof isInternal === 'boolean') {
    query = query.eq('is_internal', isInternal);
  }

  const { data: messages, error } = await query;

  if (error) {
    return { messages: [], error: error.message };
  }

  return { messages, error: null };
}

export async function deleteMessageAction({ messageId }: DeleteMessageParams) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('ticket_messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

export async function getInternalNotesAction(ticketId: string) {
  const supabase = await createClient();

  try {
    console.log('Fetching internal notes for ticket:', ticketId);
    const { data: notes, error } = await supabase
      .from('ticket_messages')
      .select(`
        id,
        content,
        created_at,
        source,
        author:author_id(id, full_name, role),
        attachments:message_attachments(
          id,
          name,
          size,
          mime_type,
          storage_path,
          created_at
        )
      `)
      .eq('ticket_id', ticketId)
      .eq('is_internal', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching internal notes:', error);
      return { error: 'Failed to fetch internal notes' };
    }

    return { notes };
  } catch (error) {
    console.error('Error in getInternalNotesAction:', error);
    return { error: 'Failed to fetch internal notes' };
  }
}

export async function addInternalNoteAction({ ticketId, content }: AddMessageParams) {
  return addMessageAction({ ticketId, content, isInternal: true });
} 