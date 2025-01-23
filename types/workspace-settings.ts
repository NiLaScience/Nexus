export type TicketStatus = {
  name: string;
  display: string;
  color: string;
};

export type WorkspaceSettings = {
  id: string;
  workspace_id: string;
  ticket_statuses: TicketStatus[];
  created_at: string;
  updated_at: string;
}; 