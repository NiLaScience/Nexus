export type TicketStatus = "open" | "in_progress" | "closed";

export interface Ticket {
  id: number;
  title: string;
  status: TicketStatus;
  created: string;
  tags: string[];
  description?: string;
}

export interface TimelineEvent {
  type: "created" | "assigned" | "status_change" | "comment";
  date: string;
  user: string;
  description: string;
}

export interface Comment {
  id: number;
  user: string;
  role: "Customer" | "Support Agent";
  date: string;
  content: string;
  rating: number | null;
}

export interface Message {
  id: number;
  user: string;
  role: "Customer" | "Support Agent";
  date: string;
  content: string;
  attachments: Attachment[];
}

export interface InternalComment {
  id: number;
  user: string;
  date: string;
  content: string;
}

export interface Attachment {
  name: string;
  size: string;
  type: string;
  date?: string;
  user?: string;
}

export interface RelatedTicket {
  id: number;
  title: string;
  status: TicketStatus;
  date: string;
  tags: string[];
} 