'use server';

import { AttachmentService } from "@/services/attachment";
import type { Attachment } from "@/types/ticket";

export async function uploadAttachmentAction(messageId: string, file: File) {
  return AttachmentService.upload({ messageId, file });
}

export async function getAttachmentUrlAction(storagePath: string) {
  return AttachmentService.getDownloadUrl(storagePath);
}

export async function deleteAttachmentAction(attachmentId: string) {
  return AttachmentService.delete(attachmentId);
}

export async function getTicketAttachmentsAction(ticketId: string) {
  return AttachmentService.getTicketAttachments(ticketId);
}

export async function getMessageAttachmentsAction(messageId: string) {
  return AttachmentService.getMessageAttachments(messageId);
}

export type { Attachment }; 