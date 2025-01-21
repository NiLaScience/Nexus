export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string
          display_name: string
          created_at: string
        }
        Insert: {
          id: string
          role: string
          display_name: string
          created_at?: string
        }
        Update: {
          id?: string
          role?: string
          display_name?: string
          created_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      user_teams: {
        Row: {
          id: string
          user_id: string
          team_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string
          created_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          customer_id: string
          assigned_to: string | null
          team_id: string | null
          status: string
          priority: string
          title: string
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          assigned_to?: string | null
          team_id?: string | null
          status: string
          priority: string
          title: string
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          assigned_to?: string | null
          team_id?: string | null
          status?: string
          priority?: string
          title?: string
          description?: string
          created_at?: string
        }
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          author_id: string
          content: string
          message_type: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          author_id: string
          content: string
          message_type: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          author_id?: string
          content?: string
          message_type?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      ticket_tags: {
        Row: {
          id: string
          ticket_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          tag_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 