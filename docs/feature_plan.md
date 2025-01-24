# Implementation Checklist: Nexus Support Portal Enhancements

This checklist provides a step-by-step guide for implementing new features into the Nexus support portal application, focusing on minimal disruption and a structured approach.

## Phase 1: Core User Access and Knowledge Base Setup

### User Type Separation
- [ ] **Review Existing Authentication:** Confirm `auth.role` field and policies are in place within Supabase.
- [ ] **Implement Role-Based Conditional Rendering:**
    - [ ]  Secure layouts/pages using server components based on user's role (`auth.is_admin()`, `auth.is_agent()`, `profile.role === 'customer'`).
    - [ ]  Implement role-based checks in client components to show / hide components.
- [ ] **Secure API Endpoints & Server Actions:**
    - [ ]  Validate roles in server actions and API routes.
    - [ ]  Use Supabase RLS policies to secure backend data access.

### Knowledge Base Setup
- [ ] **Create Database Tables:**
    - [ ] Implement `articles` table: (`id`, `title`, `content`, `category_id`, `created_at`, `updated_at`)
    - [ ] Implement `categories` table: (`id`, `name`)
    - [ ] Establish a foreign key relationship between `articles` and `categories`.
- [ ] **Implement API Endpoints/Server Actions:**
    - [ ] `GET /api/articles`: Fetch articles (pagination, filtering).
    - [ ] `GET /api/articles/:id`: Fetch a specific article.
    - [ ] `POST /api/articles`: Create a new article (admin only).
    - [ ] `PUT /api/articles/:id`: Update an article (admin only).
    - [ ] `DELETE /api/articles/:id`: Delete an article (admin only).
    - [ ] Ensure all API endpoints use proper RLS.
- [ ] **Implement UI Components:**
    - [ ] Create `components/knowledge-base/KnowledgeBase.tsx` (layout).
    - [ ] Create `components/knowledge-base/SearchHeader.tsx` (search input).
    - [ ] Create `components/knowledge-base/CategoriesSidebar.tsx` (navigation).
    - [ ] Create `components/knowledge-base/ArticleList.tsx` (lists articles).
    - [ ] Create `app/knowledge-base/article/[id]/page.tsx` to display a single article.
- [ ]  **Implement Admin Panel for Articles:** Allow admins to add, edit and delete articles from settings.
- [ ] **Implement View Counts:** Update articles table and backend to track views, provide stats.

## Phase 2:  Notification and Email Integrations

### Notification System
- [ ] **Create Database Table:**
    - [ ] `notifications` table: (`id`, `user_id`, `ticket_id`, `message`, `created_at`, `read_at`).
- [ ] **Implement Database Triggers:**
    - [ ] Detect changes in `tickets` table (`status_changed`, `assigned`)
    - [ ] Detect new inserts in `ticket_messages` table.
    - [ ] Insert new rows in the `notifications` table with appropriate metadata (user, ticket, message).
- [ ] **Create API Endpoint/Server Action:** Fetch unread notifications for a user, mark as read actions.
- [ ] **Create UI Component:**
    - [ ] Create `components/ui/NotificationsDropdown.tsx` component to fetch and display unread notifications.
        - [ ] Implement logic to mark notifications as read.

### Email Integration
- [ ] **Implement Supabase Functions:**
    - [ ] Create a function to send an email (use email templates).
        - [ ] Include logic for formatting emails for different triggers (new ticket, new message, etc.).
    - [ ] Trigger emails:
        - [ ] when a new ticket is created,
        - [ ] when a ticket's status is changed,
        - [ ] when a new message is added.
- [ ] **Update Server Actions:**
    - [ ] In your existing `addMessageAction`, `updateTicketAction`, etc., trigger the appropriate function to send emails.
- [ ] **Configure SMTP:** Set up SMTP details in your Supabase project (use environment variables).
- [ ] **Be Aware:** Emails can be rate limited.

## Phase 3: AI Chatbot and Customization

### AI Chatbot
- [ ] **LangChain Setup:** Set up LangChain with your Supabase data source (using the `articles` table).
    - [ ] Create a function to retrieve relevant documents and create response.
- [ ] **Create Supabase Function:**
    - [ ] Develop a function to act as a Q&A bot (accept a user query, use LangChain, return results)
    - [ ] Return the AI's text response.
- [ ] **Create Chatbot Component:**
    - [ ] Create `components/chat/Chatbot.tsx`
        - [ ] Handle user input and display responses.
    - [ ] Create an API route that calls your Supabase Function and returns data to the component.

### Customizable Ticket Views
- [ ]  **Add Field in Workspace Settings:** In workspace settings table add a field called `ticket_detail_layout` of type jsonb.
- [ ] **Admin Panel Layout configuration:** In settings admin panel provide the means to create a ticket detail layout.
- [ ] **Update Ticket Details Component:**
    - [ ] In `components/tickets/TicketDetails.tsx`, fetch `ticket_detail_layout` and dynamically render fields.

## Post-Implementation
- [ ]  **Thorough Testing:** Test all implemented components on all user roles.
- [ ]  **Performance Check:** Review and optimize query performance, if required.

## Notes
*   Use your existing code structure and components where possible.
*   Use proper error handling and logging.
*   Use environment variables for sensitive information.
*   Be sure to check that code is well-formatted, using eslint/prettier or similar.
*   Ensure new code has appropriate RLS applied.

This checklist should help guide you through each of the implementation steps. Remember to commit your changes often and use a branching strategy for version control.