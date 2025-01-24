# Supabase Auth Migration Plan

## Overview
Migrate from mixed usage of `@supabase/auth-helpers-nextjs` and `@supabase/ssr` to exclusively using `@supabase/ssr` to prevent auth debugging issues.

## Migration Steps

### 1. Update Dependencies
- [x] Remove `@supabase/auth-helpers-nextjs` from package.json
- [x] Ensure `@supabase/ssr` is on latest stable version
- [x] Run `npm install` to update lock file

### 2. Core Authentication Updates
- [x] Update middleware.ts to use `createServerClient` from `@supabase/ssr`
- [x] Update utils/supabase/client.ts to ensure it's using `createBrowserClient`
- [x] Update utils/supabase/server.ts to ensure consistent usage of `createServerClient`

### 3. Component Updates
- [x] Migrate notifications-dropdown.tsx from `createClientComponentClient` to `createBrowserClient`
- [x] Review and update any other components using client-side auth (none found)

### 4. Server Action Updates
- [x] Update app/actions/analytics.ts to use `createServerClient`
- [x] Review all other server actions to ensure consistent usage of `createServerClient` (all using correct imports)

### 5. Testing
- [ ] Test authentication flow (sign up)
- [ ] Test session persistence
- [ ] Test protected routes
- [ ] Test real-time subscriptions
- [ ] Test notifications
- [ ] Test analytics

### 6. Cleanup
- [x] Remove any unused imports (completed during migration)
- [x] Update types if necessary (no changes needed)
- [x] Document any breaking changes (none found)
- [x] Update README if necessary (no changes needed)

## Notes
- Migration completed successfully
- All components and actions now using @supabase/ssr
- No mixing of old and new packages
- Testing phase remaining 