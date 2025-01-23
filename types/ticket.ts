export type TicketStatus = string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface TicketTag {
  tag: {
    name: string;
  };
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
  id: string;
  type: string;
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

export type Attachment = {
  id: string;
  message_id: string;
  name: string;
  size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    role: string;
  };
};

export interface RelatedTicket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  date: string;
  tags: string[];
  organization: string;
  requester: {
    name: string;
  };
  assignedTo?: {
    name: string;
  };
} 