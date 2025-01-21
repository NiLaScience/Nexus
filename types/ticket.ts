export type TicketStatus = 'open' | 'in_progress' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  created: string;
  tags: string[];
  organization: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TimelineEvent {
  id: number;
  type: 'created' | 'assigned' | 'status_change' | 'comment';
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
  role: string;
  date: string;
  content: string;
  attachments: {
    name: string;
    size: string;
    type: string;
  }[];
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