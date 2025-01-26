import type { CustomField } from "./custom-fields";

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'agent' | 'admin';
}

export interface TicketTag {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  created: string;
  tags: string[];
  organization: string;
  requester: {
    id: string;
    name: string;
    email: string;
  } | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
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
  filename: string;
  content_type: string;
  size: number;
  storage_path: string;
  created_at: string;
  message?: {
    id: string;
    content: string;
    created_at: string;
    author?: {
      id: string;
      full_name: string | null;
    };
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

export interface TicketFormState {
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  tags: string[];
  customFields: Record<string, string | number | Date>;
  files: File[];
}

export interface TicketFormData extends FormData {
  get(key: 'title'): string;
  get(key: 'description'): string;
  get(key: 'priority'): TicketPriority;
  get(key: 'status'): TicketStatus;
  get(key: 'tags'): string;
  get(key: 'custom_fields'): string;
  get(key: 'files'): File;
}

export interface TicketFormProps {
  onSubmit: (formData: TicketFormData) => Promise<void>;
  initialValues?: Partial<TicketFormState>;
}

export interface TicketCustomFieldValue {
  fieldName: string;
  value: string | number | Date;
  required: boolean;
  type: CustomField['type'];
  options?: string[];
} 