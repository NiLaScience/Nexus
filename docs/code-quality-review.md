# Code Quality Review & Improvement Plan

## 1. Best Practices 🎯
- [x] Type Safety Improvements
  - [x] Replace `useState<any>` with specific types in:
    - [x] `ProfileTab` - Uses proper types for profile state
    - [x] `TeamTab` - Updated with proper TeamMember type
    - [x] `TeamManagement` - Updated with Team, TeamMember, and Organization types
    - [x] `TicketForm` - Updated with TicketFormState and related interfaces
  - [x] Add interfaces for all form state objects

- [x] Form Action Consolidation
  - [x] Create shared utilities for:
    - [x] Form data validation using Zod
    - [x] Async error handling
    - [x] Form submission patterns
  - [x] Standardize form handling across:
    - [x] Sign-up flow
    - [x] Sign-in flow
    - [x] Password reset flow
    - [x] New ticket creation
    - [x] Article creation/editing

- [x] Supabase Client Management
  - [x] Using @supabase/ssr consistently
  - [x] No remaining @supabase/auth-helpers-nextjs imports
  - [x] Create standard helper for client initialization
  - [x] Implement consistent pattern for:
    - [x] Service client access
    - [x] Anonymous client access

## 2. Code Duplication 🔄
- [x] Real-time Subscription Logic
  - [x] Create shared hook for subscription management
  - [x] Refactor components using subscriptions:
    - [x] `MessageHistory`
    - [x] `InternalNotes`
    - [x] `NotificationsDropdown`
  - [x] Implement consistent error handling and reconnection logic

- [x] Attachment Handling
  - [x] Streamline upload logic between:
    - [x] Ticket creation flow
    - [x] Message attachment flow
  - [x] Create unified attachment service
    - [x] Centralized error handling
    - [x] Type-safe operations
    - [x] Consistent file storage structure
    - [x] Proper cleanup on deletion

## 3. Redundancy Cleanup 🧹
- [x] Environment Checks
  - [x] Centralize environment validation
  - [x] Remove duplicate checks for:
    - [x] `NEXT_PUBLIC_SUPABASE_URL`
    - [x] Other environment variables

- [x] Session Management
  - [x] Evaluate repeated session checks
  - [x] Consider implementing HOC for common auth patterns
  - [x] Create centralized auth service
  - [x] Implement role-based access control
  - [ ] Implement AuthService in:
    - [ ] Server Actions:
      - [x] `app/actions/auth/sign-out.ts` - Replace direct auth calls
      - [x] `app/actions/profile.ts` - Use getCurrentUser for profile operations
      - [x] `app/actions/tickets/create.server.ts` - Use getCurrentUser and role checks
      - [x] `app/actions/tickets/messages.server.ts` - Use getCurrentUser for message auth
      - [x] `app/actions/tickets/rating.server.ts` - Use getCurrentUser for ratings
      - [x] `app/actions/response-templates.ts` - Use getCurrentUser and role checks
      - [x] `app/actions/team.server.ts` - Use getCurrentUser and isAdmin checks
      - [x] `app/actions/tickets/events.server.ts` - Use getCurrentUser for event auth
    - [ ] Components:
      - [x] `components/header-auth.tsx` - Uses getCurrentUser for profile display
      - [x] `components/tickets/ticket-header.tsx` - Consolidated getCurrentUser calls
      - [x] `components/tickets/message-history.tsx` - Use getCurrentUser for message auth
      - [x] `components/tickets/internal-notes.tsx` - Use getCurrentUser and role checks
      - [x] `components/tickets/ticket-filters.tsx` - Use getCurrentUser for role-based filter loading
      - [x] `components/ui/notifications-dropdown.tsx` - Uses getCurrentUser for notifications
    - [ ] Pages:
      - [x] `app/page.tsx`
      - [x] `app/layout.tsx`
      - [x] `app/(auth-pages)/reset-password/page.tsx`
      - [x] `app/dashboard/page.tsx`
      - [x] `app/analytics/page.tsx`
      - [x] `app/tickets/[id]/page.tsx`
      - [x] `app/knowledge-base/article/[id]/page.tsx`
    - [ ] Special Cases:
      - [x] Keep `middleware.ts` using direct session checks
      - [x] Update `auth/callback/route.ts` to use AuthService for profile checks

## 4. Code Clarity 📝
- [ ] Component Refactoring
  - [ ] Split large components:
    - [ ] `ticket-details.tsx`
    - [ ] `TicketHeader`
    - [ ] `ticket-timeline`
    - [ ] `MessageHistory`

- [ ] Supabase Client Usage Review
  - [x] Server Actions:
    - [x] `app/actions/response-templates.ts`
    - [x] `app/actions/teams.server.ts`
    - [x] `app/actions/workspace-settings.ts`
    - [x] `app/actions/skills.server.ts`
    - [x] `app/actions/analytics.server.ts`
    - [x] `app/actions/articles/articles.server.ts`
    - [x] `app/actions/tickets/related.server.ts`
    - [x] `app/actions/tickets/rating.server.ts`
    - [x] `app/actions/tickets/messages.server.ts`
    - [x] `app/actions/tickets/events.server.ts`
    - [x] `app/actions/tickets/attachments.ts`
    - [x] `app/actions/auth/sign-out.ts`
  - [x] Components:
    - [x] `components/header-auth.tsx`
    - [x] `components/tickets/ticket-header.tsx`
    - [x] `components/knowledge-base/knowledge-base.tsx`
    - [x] `components/tickets/attachments-list.tsx`
    - [x] `components/tickets/internal-notes.tsx`
    - [x] `components/tickets/message-history.tsx`
    - [x] `components/tickets/ticket-filters.tsx`
    - [x] `components/ui/notifications-dropdown.tsx`
  - [ ] Pages:
    - [ ] `app/page.tsx`
    - [ ] `app/layout.tsx`
    - [ ] `app/(auth-pages)/reset-password/page.tsx`
    - [ ] `app/dashboard/page.tsx`
    - [ ] `app/analytics/page.tsx`
    - [ ] `app/tickets/[id]/page.tsx`
    - [ ] `app/knowledge-base/article/[id]/page.tsx`
  - [x] Special Cases:
    - [x] Keep `middleware.ts` using direct `createServerClient`

## 5. Performance Optimization ⚡
- [ ] Data Fetching
  - [ ] Audit and optimize getUser/getProfile calls
  - [ ] Implement caching strategy:
    - [ ] Consider useSWR for client-side
    - [ ] Leverage Next.js 13 caching for server-side

- [ ] Revalidation Logic
  - [ ] Audit revalidatePath calls
  - [ ] Optimize revalidation triggers

## Implementation Priority
1. **High Priority**
   - ✅ Type safety improvements
   - [x] Shared subscription hook
   - [x] Form handling consolidation

2. **Medium Priority**
   - [ ] Component splitting
   - [x] Utility function creation
   - [ ] Caching implementation

3. **Low Priority**
   - [x] Environment check consolidation
   - [ ] Documentation updates
   - [ ] Performance optimizations

## Notes
- Focus on incremental improvements
- Test thoroughly after each refactor
- Maintain existing functionality while improving code quality
- Document patterns and decisions for team reference

## Implementation Plan for Service Integration

### Phase 1: Auth-Related Files ✅
1. Server Actions
   - [x] `app/actions/auth/sign-in.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for session management
   - [x] `app/actions/auth/sign-up.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for profile creation
   - [x] `app/actions/auth/sign-out.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for session cleanup
   - [x] `app/actions/profile.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for profile operations

2. Auth Pages
   - [x] `app/(auth-pages)/sign-in/page.tsx`
     - [x] Add withAuth HOC for guest-only access
   - [x] `app/(auth-pages)/sign-up/page.tsx`
     - [x] Add withAuth HOC for guest-only access
   - [x] `app/(auth-pages)/reset-password/page.tsx`
     - [x] Add withAuth HOC for guest-only access
   - [x] `app/auth/callback/route.ts`
     - [x] Update to use AuthService for profile checks

### Phase 2: Ticket-Related Files
1. Server Actions
   - [x] `app/actions/tickets/create.server.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for user validation
   - [x] `app/actions/tickets/messages.server.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for message permissions
   - [x] `app/actions/tickets/rating.server.ts`
     - [x] Replace direct client creation with SupabaseService
     - [x] Use AuthService for rating permissions

2. Protected Pages
   - [ ] `app/page.tsx`
     - Add withAuth HOC
     - Use AuthService for layout decisions
   - [ ] `app/dashboard/page.tsx`
     - Add withAgentAuth HOC
   - [ ] `app/analytics/page.tsx`
     - Add withAdminAuth HOC
   - [ ] `app/tickets/[id]/page.tsx`
     - Add withAuth HOC with role checks

### Phase 3: UI Components
1. Header and Navigation
   - [ ] `components/header-auth.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for profile display
   - [ ] `components/ui/notifications-dropdown.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for notifications

2. Ticket Components
   - [ ] `components/tickets/ticket-header.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for permissions
   - [ ] `components/tickets/message-history.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for message permissions
   - [ ] `components/tickets/internal-notes.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for role checks
   - [ ] `components/tickets/ticket-filters.tsx`
     - Replace direct client creation with SupabaseService
     - Use AuthService for filter context

### Special Cases
- [x] Keep `middleware.ts` using direct session checks
- [x] Update error handling to use consistent patterns across all files
- [x] Add logging for auth-related operations
- [x] Document any edge cases discovered during implementation 