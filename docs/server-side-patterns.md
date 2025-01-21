# Server-Side Patterns in Next.js App Router

## 1. Server Actions
```ts
// app/actions/tickets/create-ticket.ts
'use server'

export async function createTicket(data: TicketData) {
  // Direct database operations
  // Form handling
  // Revalidation
}
```
- Used for form submissions and direct mutations
- Can be called from both Server and Client Components
- Support progressive enhancement (forms work without JS)
- Best for: Form submissions, direct database operations

## 2. Route Handlers (API Routes)
```ts
// app/api/tickets/route.ts
export async function GET() {
  // Handle HTTP GET requests
  return Response.json({ ... })
}
```
- Full control over HTTP requests/responses
- Support for different HTTP methods
- Can be called from any client (not just your app)
- Best for: External API endpoints, complex HTTP handling

## 3. Page Routes
```ts
// app/tickets/page.tsx
export default async function TicketsPage() {
  // Fetch data directly
  const tickets = await getTickets()
  return <TicketList tickets={tickets} />
}
```
- Server Components that handle page rendering
- Direct database access
- SEO-friendly
- Best for: Page-level data fetching and rendering

## When to Use Each

### Use Server Actions When:
- Handling form submissions
- Performing direct database mutations
- Need progressive enhancement
- Want type safety between client/server
- Operations are part of your app's internal logic

### Use Route Handlers When:
- Building a public API
- Need custom HTTP headers/responses
- Handling webhooks
- Need to accept requests from external services
- Want RESTful endpoints

### Use Page Routes When:
- Rendering pages
- Need SEO optimization
- Want automatic static/dynamic rendering
- Data fetching is tied to page display

## Our Project's Approach

For our CRM, we'll primarily use:
1. **Server Actions** for:
   - Ticket operations (create, update)
   - User management
   - Form submissions

2. **Route Handlers** for:
   - Webhook endpoints (future integrations)
   - File uploads
   - External API access

3. **Page Routes** for:
   - Ticket listings
   - Dashboard views
   - Detail pages

This gives us the best balance of:
- Type safety
- Progressive enhancement
- Performance
- Developer experience 