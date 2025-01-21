# User Actions Checklist by Role

Below is a consolidated list of actions for the **three main user types**—Customers, Agents, and Admins—covering roughly 80% of the necessary features for the CRM. These actions can be extended or refined as needed. 

---

## 1. Customer Actions

- [ ] **Sign Up / Log In**  
  - Create an account (via Supabase Auth)  
  - Log in to access customer portal

- [ ] **View Own Tickets**  
  - See a list of tickets the customer has submitted  
  - Filter by status (e.g., “open,” “closed”)

- [ ] **Create a New Ticket**  
  - Enter title, description, priority  
  - Optionally attach files (if attachment support is enabled)

- [ ] **Update a Ticket** (Limited)  
  - Add public replies/messages (via `ticket_messages`)  
  - Provide additional information or clarifications

- [ ] **Close or Cancel a Ticket** (Optional)  
  - Mark a ticket as “resolved” if the customer finds their own solution  
  - Alternatively, request an agent to close it

- [ ] **View Knowledge Base / FAQs** (If implemented)  
  - Search or browse help articles before creating a ticket  
  - Possibly interact with an AI chatbot (Week 2 feature)

---

## 2. Agent Actions

- [ ] **View Assigned Tickets**  
  - See tickets that are explicitly assigned to them  
  - Filter by priority, status, or date

- [ ] **Take Ownership of Unassigned Tickets**  
  - See a queue of unassigned or new tickets  
  - Assign ticket to themselves (or escalate to another team)

- [ ] **Update Ticket Status & Priority**  
  - Move tickets through statuses (e.g., “open” → “in_progress” → “closed”)  
  - Adjust priority based on urgency or severity

- [ ] **Add Internal Notes**  
  - Provide internal updates or commentary that customers cannot see  
  - Collaborate with other agents/team members

- [ ] **Public Replies to Customers**  
  - Respond to customer inquiries or request more info  
  - Use rich-text formatting or macros (if implemented)

- [ ] **Bulk Operations** (Optional)  
  - Select multiple tickets to change status (e.g., from “open” to “in_progress”)  
  - Tag multiple tickets with a label (e.g., “billing issue”)

- [ ] **Team Collaboration** (If teams are used)  
  - Share tickets or hand them off to another team  
  - Chat internally about complex issues

---

## 3. Admin Actions

- [ ] **Manage Users**  
  - View all registered users  
  - Assign or revoke roles (customer, agent, admin)  
  - Add users to teams (`teams` / `user_teams`)

- [ ] **Manage Teams**  
  - Create new teams (e.g., Billing, Sales, Support L1)  
  - Assign agents to teams  
  - Archive or deactivate teams if no longer needed

- [ ] **Global Ticket Management**  
  - View all tickets in the system  
  - Reassign tickets to specific agents or teams  
  - Adjust priorities or statuses across multiple tickets

- [ ] **Set Up Automated Workflows** (Optional / Future)  
  - Define rules for auto-routing (e.g., high priority goes to a specific team)  
  - Configure triggers for escalation (e.g., “if ticket is high priority for 24 hours, escalate to manager”)

- [ ] **Reporting / Analytics**  
  - View metrics like average response time, resolution rate, or ticket distribution by team  
  - Export data for further analysis

- [ ] **Manage System Settings** (Optional)  
  - Configure RLS security rules or IP restrictions  
  - Manage AI integration settings (Week 2)  
  - Set up email templates, macros, or system notifications

---

## Additional Notes

1. **Roles Can Overlap**  
   - Some organizations might allow an Agent to have partial Admin privileges, or a Customer may also be an internal user. Adjust roles as needed.

2. **Permission Boundaries**  
   - Ensure row-level security and role-based access in Supabase to prevent unauthorized actions (e.g., a customer accessing another customer’s tickets).

3. **Future Enhancements**  
   - AI-driven features (auto ticket assignment, auto replies, summary dashboards) primarily extend Admin/Agent actions.  
   - In-app chat or real-time updates can enhance collaboration.  

