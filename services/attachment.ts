import { SupabaseService } from "@/services/supabase";
import type { Attachment } from "@/types/ticket";

interface UploadOptions {
  messageId: string;
  file: File;
  isTicketCreation?: boolean;
}

interface UploadResult {
  success: boolean;
  error?: string;
}

interface GetUrlResult {
  url?: string;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

interface GetAttachmentsResult {
  attachments: Attachment[];
  error?: string;
}

export class AttachmentService {
  private static async getTicketId(messageId: string) {
    const serviceClient = await SupabaseService.createServiceClientWithCookies();
    const { data: message, error: messageError } = await serviceClient
      .from('ticket_messages')
      .select('ticket_id')
      .eq('id', messageId)
      .single();

    if (messageError) throw messageError;
    return message.ticket_id;
  }

  static async upload({ messageId, file, isTicketCreation = false }: UploadOptions): Promise<UploadResult> {
    try {
      const serviceClient = await SupabaseService.createServiceClientWithCookies();
      const ticketId = await this.getTicketId(messageId);

      // Generate unique filename
      const timestamp = Date.now();
      const uniqueFilename = `${timestamp}-${file.name}`;
      const storagePath = `tickets/${ticketId}/${uniqueFilename}`;

      // Check if file already exists
      const { data: existingFiles } = await serviceClient
        .storage
        .from('attachments')
        .list(`tickets/${ticketId}`);

      const fileExists = existingFiles?.some(f => f.name === uniqueFilename);
      if (fileExists) {
        return { success: false, error: 'File already exists' };
      }

      // Upload file
      const { error: uploadError } = await serviceClient
        .storage
        .from('attachments')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { error: attachmentError } = await serviceClient
        .from('attachments')
        .insert({
          message_id: messageId,
          filename: file.name,
          storage_path: storagePath,
          content_type: file.type,
          size: file.size
        });

      if (attachmentError) throw attachmentError;

      return { success: true };
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  static async getDownloadUrl(storagePath: string): Promise<GetUrlResult> {
    try {
      const serviceClient = await SupabaseService.createServiceClientWithCookies();
      const { data, error } = await serviceClient
        .storage
        .from('attachments')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) throw error;
      return { url: data.signedUrl };
    } catch (error) {
      console.error('Error getting download URL:', error);
      return { error: error instanceof Error ? error.message : 'Failed to get download URL' };
    }
  }

  static async delete(attachmentId: string): Promise<DeleteResult> {
    try {
      const serviceClient = await SupabaseService.createServiceClientWithCookies();

      // Get attachment details
      const { data: attachment, error: fetchError } = await serviceClient
        .from('attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();

      if (fetchError) throw fetchError;
      if (!attachment) throw new Error('Attachment not found');

      // Delete from storage
      const { error: storageError } = await serviceClient
        .storage
        .from('attachments')
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: deleteError } = await serviceClient
        .from('attachments')
        .delete()
        .eq('id', attachmentId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
  }

  static async getTicketAttachments(ticketId: string): Promise<GetAttachmentsResult> {
    try {
      const serviceClient = await SupabaseService.createServiceClientWithCookies();
      const { data, error } = await serviceClient
        .from('attachments')
        .select(`
          id,
          filename,
          storage_path,
          content_type,
          size,
          created_at,
          message:message_id(
            id,
            content,
            created_at,
            author:author_id(
              id,
              full_name
            )
          )
        `)
        .eq('message:message_id.ticket_id', ticketId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { attachments: data || [] };
    } catch (error) {
      console.error('Error getting ticket attachments:', error);
      return { attachments: [], error: error instanceof Error ? error.message : 'Failed to get attachments' };
    }
  }

  static async getMessageAttachments(messageId: string): Promise<GetAttachmentsResult> {
    try {
      const serviceClient = await SupabaseService.createServiceClientWithCookies();
      const { data, error } = await serviceClient
        .from('attachments')
        .select()
        .eq('message_id', messageId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { attachments: data || [] };
    } catch (error) {
      console.error('Error getting message attachments:', error);
      return { attachments: [], error: error instanceof Error ? error.message : 'Failed to get attachments' };
    }
  }
} 