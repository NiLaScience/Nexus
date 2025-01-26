# Supabase Auth & Subscriptions Review Checklist

## Authentication Review
- [ ] Verify @supabase/ssr Usage
  - [ ] Check for any remaining @supabase/auth-helpers-nextjs imports
  - [ ] Ensure createClient is imported from @supabase/ssr
  - [ ] Verify cookie handling in middleware uses correct API

- [ ] Middleware Implementation
  - [ ] Check public routes configuration
  - [ ] Verify session refresh logic
  - [ ] Ensure proper error handling
  - [ ] Test auth redirects (signed in/out states)

- [ ] Server-Side Auth
  - [ ] Verify createClient usage in server components
  - [ ] Check protected API routes implementation
  - [ ] Ensure proper error handling in server actions

- [ ] Client-Side Auth
  - [ ] Check createBrowserClient usage
  - [ ] Verify auth state management
  - [ ] Test sign in/out flows

## Realtime Subscriptions Review
- [ ] Subscription Pattern Consistency
  - [ ] Check for standardized subscription setup
  - [ ] Verify proper cleanup in useEffect
  - [ ] Ensure error handling and reconnection logic

- [ ] Database Configuration
  - [ ] Verify realtime enabled for required tables
  - [ ] Check RLS policies for subscriptions
  - [ ] Review publication configuration

- [ ] Component Implementation
  - [ ] Review NotificationsDropdown subscriptions
  - [ ] Check MessageHistory realtime updates
  - [ ] Verify InternalNotes subscription logic
  - [ ] Test TicketList realtime updates

- [ ] Performance & Optimization
  - [ ] Check for unnecessary reloads
  - [ ] Verify optimistic updates
  - [ ] Review state management efficiency
  - [ ] Test subscription memory leaks

## Action Items
- [ ] Standardize subscription pattern across components
- [ ] Implement consistent error handling
- [ ] Add resubscription logic where missing
- [ ] Replace reload timeout patterns with direct state updates
- [ ] Add proper logging for subscription events
- [ ] Update RLS policies for realtime access
- [ ] Document subscription patterns for team reference

## Testing
- [ ] Auth Flows
  - [ ] Test sign in/out
  - [ ] Verify protected routes
  - [ ] Check session persistence
  - [ ] Test error scenarios

- [ ] Realtime Features
  - [ ] Test notification delivery
  - [ ] Verify message updates
  - [ ] Check ticket status changes
  - [ ] Test multi-client scenarios
  - [ ] Verify reconnection handling 