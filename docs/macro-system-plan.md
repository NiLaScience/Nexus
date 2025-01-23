cle# Macro System Implementation Plan

## Phase 1: Core Functionality

### 1. Database Schema
- [x] Create `response_templates` table
  - [x] ID, name, content
  - [x] Team ID (for team-specific templates)
  - [x] Created by, timestamps
  - [x] Usage count

### 2. Backend
- [x] Create Supabase migration
- [x] Set up basic RLS policies
  - [x] Agents can view all templates
  - [x] Agents can create/edit their own templates
  - [x] Team leads/admins can manage all templates
- [x] Create server actions for CRUD operations

### 3. Frontend
- [x] Basic template list view
  - [x] Grid/list of available templates
  - [x] Search and filter
  - [x] Preview template content
- [x] Template editor
  - [x] Create/edit form
  - [x] Rich text editor integration
- [x] Message composer integration
  - [x] Template selector dropdown
  - [x] Insert template into message

## Phase 2: Enhancements (Optional)

### 1. Smart Features
- [ ] Variable substitution
  - [ ] Customer name
  - [ ] Ticket reference
  - [ ] Agent name
- [x] Usage tracking
- [ ] Template suggestions based on ticket content

### 2. Team Features
- [ ] Template categories
- [ ] Template sharing
- [ ] Usage analytics

### 3. Edge Functions
- [ ] Template suggestion function
  - [ ] Match templates to ticket content
  - [ ] Consider usage statistics 