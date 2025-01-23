'use server';

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { createServerClient, CookieOptions } from "@supabase/ssr";

export type Attachment = {
  id: string;
  message_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    role: string;
  };
};

type RawAttachment = {
  id: string;
  message_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  author: {
    author: {
      id: string;
      full_name: string | null;
      role: string;
    };
  };
};

export async function getMessageAttachmentsAction(messageId: string) {
  const supabase = await createClient();

  try {
    const { data: attachments, error } = await supabase
      .from('message_attachments')
      .select(`
        id,
        message_id,
        name,
        size,
        mime_type,
        storage_path,
        created_at,
        author:ticket_messages!message_attachments_message_id_fkey(
          author:profiles!ticket_messages_author_id_fkey(
            id,
            full_name,
            role
          )
        )
      `)
      .eq('message_id', messageId)
      .returns<RawAttachment[]>();

    if (error) throw error;

    // Transform the nested author data structure
    const transformedAttachments = attachments.map(attachment => ({
      ...attachment,
      author: attachment.author.author
    }));

    return { attachments: transformedAttachments as Attachment[] };
  } catch (error) {
    console.error('Error fetching message attachments:', error);
    return { error: 'Failed to fetch attachments' };
  }
}

export async function uploadAttachmentAction(messageId: string, file: File) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the ticket ID for the message to use in storage path
    const { data: message, error: messageError } = await serviceClient
      .from('ticket_messages')
      .select('ticket_id')
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;

    // Generate a unique filename to prevent duplicates
    const timestamp = new Date().getTime();
    const uniqueFilename = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storagePath = `${message.ticket_id}/${messageId}/${uniqueFilename}`;

    // Check if file already exists
    const { data: existingFiles } = await serviceClient.storage
      .from('ticket-attachments')
      .list(`${message.ticket_id}/${messageId}`);

    const fileExists = existingFiles?.some(f => f.name === uniqueFilename);
    if (fileExists) {
      throw new Error('File already exists');
    }

    // Upload file to Supabase Storage
    const { error: uploadError } = await serviceClient.storage
      .from('ticket-attachments')
      .upload(storagePath, file, {
        upsert: false // Prevent overwriting
      });

    if (uploadError) throw uploadError;

    // Create attachment record
    const { error: attachmentError } = await serviceClient
      .from('message_attachments')
      .insert({
        message_id: messageId,
        name: file.name, // Store original filename for display
        size: file.size,
        mime_type: file.type,
        storage_path: storagePath
      });

    if (attachmentError) throw attachmentError;

    return { success: true };
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return { error: error instanceof Error ? error.message : 'Failed to upload attachment' };
  }
}

export async function getAttachmentUrlAction(storagePath: string) {
  const supabase = await createClient();

  try {
    // Create a signed URL that expires in 1 hour
    const { data, error } = await supabase.storage
      .from('ticket-attachments')
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    if (!data?.signedUrl) throw new Error('Failed to generate download URL');

    return { url: data.signedUrl };
  } catch (error) {
    console.error('Error getting attachment URL:', error);
    return { error: 'Failed to get attachment URL' };
  }
}

export async function deleteAttachmentAction(attachmentId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const serviceClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  try {
    // Get the attachment details first
    const { data: attachment, error: fetchError } = await serviceClient
      .from('message_attachments')
      .select('storage_path')
      .eq('id', attachmentId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await serviceClient.storage
      .from('ticket-attachments')
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete the record
    const { error: deleteError } = await serviceClient
      .from('message_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) throw deleteError;

    return { success: true };
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return { error: 'Failed to delete attachment' };
  }
}

export async function getTicketAttachmentsAction(ticketId: string) {
  if (!ticketId) {
    console.error('No ticket ID provided');
    return { error: 'No ticket ID provided' };
  }

  const supabase = await createClient();

  try {
    type DBMessage = {
      id: string;
      author: {
        id: string;
        full_name: string | null;
        role: string;
      };
      attachments: {
        id: string;
        name: string;
        size: number;
        mime_type: string;
        storage_path: string;
        created_at: string;
      }[];
    };

    const { data: messages, error } = await supabase
      .from('ticket_messages')
      .select(`
        id,
        author:profiles!ticket_messages_author_id_fkey(
          id,
          full_name,
          role
        ),
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
      .returns<DBMessage[]>();

    if (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }

    if (!messages) return { attachments: [] };

    // Transform the nested data structure - flatten attachments from all messages
    const transformedAttachments = messages.flatMap(message => 
      message.attachments.map(attachment => ({
        id: attachment.id,
        message_id: message.id,
        name: attachment.name,
        size: attachment.size,
        mime_type: attachment.mime_type,
        storage_path: attachment.storage_path,
        created_at: attachment.created_at,
        author: message.author
      }))
    );

    return { attachments: transformedAttachments };
  } catch (error) {
    console.error('Error fetching ticket attachments:', error);
    return { error: 'Failed to fetch attachments' };
  }
} 