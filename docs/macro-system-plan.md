# Macro System Implementation Plan

## Phase 1: Core Functionality

### 1. Database Schema
- [ ] Create `response_templates` table
  - [ ] ID, name, content
  - [ ] Team ID (for team-specific templates)
  - [ ] Created by, timestamps
  - [ ] Usage count

### 2. Backend
- [ ] Create Supabase migration
- [ ] Set up basic RLS policies
  - [ ] Agents can view all templates
  - [ ] Agents can create/edit their own templates
  - [ ] Team leads/admins can manage all templates
- [ ] Create server actions for CRUD operations

### 3. Frontend
- [ ] Basic template list view
  - [ ] Grid/list of available templates
  - [ ] Search and filter
  - [ ] Preview template content
- [ ] Template editor
  - [ ] Create/edit form
  - [ ] Rich text editor integration
- [ ] Message composer integration
  - [ ] Template selector dropdown
  - [ ] Insert template into message

## Phase 2: Enhancements (Optional)

### 1. Smart Features
- [ ] Variable substitution
  - [ ] Customer name
  - [ ] Ticket reference
  - [ ] Agent name
- [ ] Usage tracking
- [ ] Template suggestions based on ticket content

### 2. Team Features
- [ ] Template categories
- [ ] Template sharing
- [ ] Usage analytics

### 3. Edge Functions
- [ ] Template suggestion function
  - [ ] Match templates to ticket content
  - [ ] Consider usage statistics 