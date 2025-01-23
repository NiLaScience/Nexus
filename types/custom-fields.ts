export const DEFAULT_WORKSPACE_ID = '00000000-0000-0000-0000-000000000000';

export type CustomField = {
  name: string;
  display: string;
  type: "text" | "number" | "select" | "date";
  required: boolean;
  options?: string[];
}; 