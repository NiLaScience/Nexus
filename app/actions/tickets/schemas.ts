import { z } from 'zod';

export const ticketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Invalid priority level' })
  }).default('medium'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'], {
    errorMap: () => ({ message: 'Invalid status' })
  }).default('open'),
  tags: z.array(z.string()).default([]),
  custom_fields: z.record(z.union([
    z.string(),
    z.number(),
    z.date()
  ])).default({}),
  files: z.array(z.instanceof(File)).default([])
});

export type TicketInput = z.infer<typeof ticketSchema>;

export const assignTicketSchema = z.object({
  ticketId: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  teamId: z.string().uuid().nullable(),
});

export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'], {
    errorMap: () => ({ message: 'Invalid status' })
  })
});

export const updateTicketPrioritySchema = z.object({
  ticketId: z.string().uuid(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Invalid priority level' })
  })
});

export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;
export type UpdateTicketPriorityInput = z.infer<typeof updateTicketPrioritySchema>;

export const addMessageSchema = z.object({
  ticketId: z.string().uuid(),
  content: z.string().min(1, 'Message content cannot be empty').max(5000, 'Message content is too long'),
  isInternal: z.boolean().default(false)
});

export type AddMessageInput = z.infer<typeof addMessageSchema>;

export const addInternalNoteSchema = addMessageSchema.extend({
  isInternal: z.literal(true)
});

export type AddInternalNoteInput = z.infer<typeof addInternalNoteSchema>; 