# Ticket Detail Implementation Checklist

## 1. Basic Ticket Detail
- [ ] Create `getTicketDetailAction` in actions.ts
  - [ ] Basic ticket info (title, status, priority, etc.)
  - [ ] Customer and assigned agent info
  - [ ] Team info
  - [ ] Organization context

## 2. Message Thread
- [ ] Add message fetching to action
  - [ ] Message content and metadata
  - [ ] Author info
  - [ ] Internal note handling
- [ ] Create message components
  - [ ] Message list with proper styling
  - [ ] Internal/external message distinction
  - [ ] Message composer

## 3. Timeline & Events
- [ ] Add event fetching to action
  - [ ] Event history with actor info
  - [ ] Event type categorization
- [ ] Create timeline component
  - [ ] Event list with proper styling
  - [ ] Event type icons/indicators

## 4. Tag Management
- [ ] Add tag operations
  - [ ] Tag fetching
  - [ ] Add/remove tag actions
- [ ] Create tag components
  - [ ] Tag list display
  - [ ] Tag management UI

## 5. Assignment Controls
- [ ] Add assignment operations
  - [ ] Team assignment
  - [ ] Agent assignment
- [ ] Create assignment components
  - [ ] Team selector
  - [ ] Agent selector

## 6. Real-time Updates
- [ ] Set up Supabase subscriptions
  - [ ] Message updates
  - [ ] Status changes
  - [ ] Assignment changes

## 7. Polish
- [ ] Add loading states
- [ ] Add error handling
- [ ] Implement pagination
- [ ] Add proper caching
- [ ] Test all role-based access scenarios

## Access Control
- [ ] Admins: Full access
- [ ] Agents: Team/assigned tickets only
- [ ] Customers: Organization tickets only
- [ ] Internal notes: Agents/admins only 