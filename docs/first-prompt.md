We’re building a CRM system called Nexus to manage customer support tickets. Our tech stack includes:

Next.js (for React-based frontend) with /app router
Tailwind CSS (for styling)
Shadcn/ui (for components)
Supabase (for auth, database, and edge functions)
AWS Amplify (for hosting and CI/CD)
Goal (Week 1 MVP)

Create a minimal frontend that enables users to:
Create a ticket with title, tags and description ( ID, creation date, and status in backend) and the ability to attach files and create custom fields. 
List all tickets that belong to them (if “customer” role) or assigned to them (if “agent” role) and filter by status and tag.
View ticket details and change status (e.g., “open,” “in_progress,” “closed”)

Ticket creation (a simple form)
Ticket list (showing either “customer” or “agent” perspective)
Ticket detail (including basic status updates and conversation history placeholder)
