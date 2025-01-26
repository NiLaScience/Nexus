import postgres from 'postgres'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Initialize the connection
const sql = postgres(process.env.DATABASE_URL, {
  ssl: {
    rejectUnauthorized: false
  },
  max: 10, // Max number of connections
  idle_timeout: 20, // Idle connection timeout in seconds
  connect_timeout: 10, // Connection timeout in seconds
})

// Export the typed client
export default sql

// Helper type for table schemas
export type Tables = {
  tickets: {
    id: string
    title: string
    description: string
    status: 'open' | 'in_progress' | 'closed'
    priority: 'low' | 'medium' | 'high'
    created_by: string
    assigned_to?: string
    created_at: Date
  }
  comments: {
    id: string
    ticket_id: string
    author_id: string
    content: string
    is_internal: boolean
    created_at: Date
  }
} 