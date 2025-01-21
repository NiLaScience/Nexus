# Simplified Ticket Details Implementation

## Priority 1: Message History (Core Communication)
- [x] Database Setup
  - [x] `ticket_messages` table exists with schema
  - [x] Basic RLS policies are in place

- [x] Actions
  - [x] Create `getTicketMessagesAction` to fetch messages
    - [x] Add proper typing
    - [x] Add error handling
    - [x] Add sorting by created_at
  - [x] Create `addMessageAction` to post new messages
    - [x] Add proper typing
    - [x] Add validation
    - [x] Set source as 'web'

- [x] Component
  - [x] Update `MessageHistory` to show real messages
  - [x] Add simple message input form
  - [x] Basic error handling
  - [x] Loading states
  - [ ] File attachments (moved to Priority 3)

## Priority 2: Internal Notes (Agent Communication)
- [x] Database Setup
  - [x] Using `ticket_messages` table with `is_internal` flag
  - [x] RLS: Only agents/admins can access internal notes

- [ ] Actions
  - [ ] Create `getInternalNotesAction` (filtered `ticket_messages`)
  - [ ] Create `addInternalNoteAction` (sets `is_internal=true`)

- [ ] Component
  - [ ] Update `InternalNotes` to show real notes
  - [ ] Add note input form
  - [ ] Only show to agents/admins

## Priority 3: Attachments (File Handling)
- [x] Database Setup
  - [x] `message_attachments` table exists
  - [x] Supabase storage configured

- [ ] Actions
  - [ ] Create `getAttachmentsAction`
  - [ ] Create `uploadAttachmentAction`

- [ ] Component
  - [ ] Update `AttachmentsList` to show real files
  - [ ] Add simple file upload
  - [ ] Add attachments to messages

## Later / Nice to Have
- Timeline can be built from existing ticket events
- Related tickets can be added later
- Optimistic updates
- Advanced error states
- Unit tests 