# Week 2 AI Feature Checklist 🚀

Here's a checklist to track the implementation of AI features for Week 2, based on the goals outlined in `week2_goals.md`.

## Baseline AI Functionality

This section covers the core AI features to be implemented this week.

### 1. RAG-Based Knowledge Management 📚 (1st)
- [x] Set up a vector database in Supabase for RAG.
    - [x] Ensure database is set up with proper authentication.
    - [x] Define initial RLS policies for knowledge base tables.
- [x] Implement functionality to add/update knowledge sources (extensibility).
    - [x] Implement authenticated access for adding/updating knowledge.
    - [x] Define RLS policies for knowledge management operations.
    - [x] Add articles to the RAG system.
        - [x] Ensure articles are added with proper authorization.
        - [x] Verify RLS policies are applied to newly added articles.
    - [x] Add tickets with messages to the RAG system.
        - [x] Ensure tickets are added with proper authorization.
        - [x] Verify RLS policies are applied to newly added tickets.
    - [] Add attachments to the RAG system.
        - [] Ensure attachments are added with proper authorization.
        - [] Verify RLS policies are applied to newly added attachments.
- [ ] Create a chat interface for the RAG system.
    - [ ] Implement user authentication for chat interface.
    - [ ] Ensure chat interface respects RLS policies when displaying data.
    - [ ] Allow users to ask general questions to the knowledge base.
        - [ ] Verify general knowledge base queries respect RLS.
    - [ ] Allow users to ask questions about specific tickets.
        - [ ] Verify ticket-specific queries respect RLS and user permissions.

### 2. LLM-Generated Responses 💬 (2nd)
- [ ] Implement LLM integration for generating ticket responses.
    - [ ] Secure LLM API calls with authentication.
    - [ ] Ensure LLM responses are generated in accordance with user permissions.
- [ ] Ensure generated responses are courteous and user-friendly.
    - [ ] Review responses to ensure no unauthorized data is exposed.
- [ ] Verify responses are assistive and relevant to the ticket context.
    - [ ] Confirm context provided to LLM respects RLS policies.

### 3. Human-Assisted Suggestions 🧑‍💻 (3rd)
- [ ] Implement LLM suggestions for human agents.
    - [ ] Ensure suggestion feature is only accessible to authenticated agents.
    - [ ] Verify suggestions respect agent roles and permissions.
- [ ] Ensure suggestions are provided when human action is required.
    - [ ] Logic for determining "human action required" should respect RLS.
- [ ] Verify suggested responses help speed up ticket resolution.
    - [ ] Confirm suggested responses do not violate any security policies.
- [ ] Allow agents to easily use or modify LLM suggestions.
    - [ ] Implement audit logs for agent modifications to LLM suggestions.

### 4. Agentic Tool-Using AI 🤖 (4th)
- [ ] Implement AI analysis of incoming tickets.
    - [ ] Ensure AI analysis respects data access permissions.
- [ ] Implement ticket routing based on AI analysis.
    - [ ] Verify routing rules respect user roles and permissions.
    - [ ] Route tickets by type.
        - [ ] Ensure type-based routing respects RLS.
    - [ ] Route tickets by priority.
        - [ ] Ensure priority-based routing respects RLS.
    - [ ] Route tickets by other criteria.
        - [ ] Ensure criteria-based routing respects RLS.
- [ ] Design an extensible system for AI to interact with external APIs.
    - [ ] Implement secure API interaction patterns.
    - [ ] Ensure API interactions are authorized and logged.
- [ ] Ensure the system is interoperable for future integrations.
    - [ ] Design integrations with security in mind.

