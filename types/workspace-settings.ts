import type { CustomField } from "./custom-fields";

export type TicketStatus = {
  name: string;
  display: string;
  color: string;
};

export type WorkspaceSettings = {
  id: string;
  workspace_id: string;
  ticket_statuses: TicketStatus[];
  ticket_fields: CustomField[];
  created_at: string;
  updated_at: string;
}; 