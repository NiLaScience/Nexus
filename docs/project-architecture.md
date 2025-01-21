# Project Architecture

## Server vs Client Components

Our application uses a hybrid approach of Server and Client Components, each with their specific purposes and trade-offs.

### Server Components
- Located in app directory without "use client" directive
- Used for components that:
  - Need SEO optimization
  - Perform direct database queries
  - Don't require client-side interactivity
- Examples: 
  - `header-auth.tsx` (displays user info)
  - Route pages
  - Layout components

### Client Components
- Marked with "use client" directive
- Used for components that:
  - Need interactivity
  - Manage local state
  - Handle user events
- Examples:
  - `profile-tab.tsx` (form interactions)
  - Interactive UI components
  - Components with hooks

## Data Flow and State Management

### Challenge: Server-Client Data Synchronization
When client components update data that's displayed in server components, we need a strategy to keep the UI in sync. For example:
```
ProfileTab (Client)        HeaderAuth (Server)
├─ Updates database       ├─ Fetches from database
├─ State changes locally  ├─ Renders once during SSR
└─ No auto-revalidation  └─ Stays static until reload
```

### Solutions:

1. **Server Actions + Revalidation (Preferred)**
   ```typescript
   // 1. Define server action
   'use server'
   async function updateProfile(data) {
     // Update database
     // Revalidate paths
   }

   // 2. Use in client component
   const ClientComponent = () => {
     const handleSubmit = () => {
       updateProfile(data)
     }
   }
   ```
   Benefits:
   - Maintains server component benefits (SEO, performance)
   - Atomic updates
   - Automatic revalidation
   - Type safety

2. **Client-only Updates**
   - Convert server components to client components
   - Use real-time subscriptions or polling
   - Trade-offs:
     - Loses server component benefits
     - More client-side JS
     - Potential performance impact

3. **Global State Management**
   - Use Zustand/Context for global state
   - Sync with server periodically
   - Trade-offs:
     - More complex state management
     - Potential state inconsistencies
     - Increased client bundle size

## Best Practices

1. **Component Organization**
   - Keep server components as the default
   - Move to client components only when needed
   - Split large components into server/client boundaries

2. **Data Updates**
   - Use server actions for data mutations
   - Implement proper revalidation strategies
   - Consider optimistic updates for better UX

3. **State Management**
   - Local state for UI-only concerns
   - Server actions for data mutations
   - Global state only when necessary

4. **Performance**
   - Leverage server components for initial load
   - Minimize client-side JavaScript
   - Use proper caching and revalidation strategies

## Examples

### Profile Update Flow
```typescript
// 1. Server Action (app/actions.ts)
'use server'
export async function updateProfile(data) {
  // Update database
  // Revalidate paths that show profile data
  revalidatePath('/');
}

// 2. Client Component (components/profile-form.tsx)
'use client'
export function ProfileForm() {
  const handleSubmit = async () => {
    await updateProfile(data);
    // UI can update optimistically
  }
}

// 3. Server Component (components/header.tsx)
export async function Header() {
  // Always shows fresh data after revalidation
  const profile = await getProfile();
  return <h1>Hello, {profile.name}</h1>;
}
```

## Future Considerations

1. **Real-time Updates**
   - When to use Supabase realtime subscriptions
   - Balancing real-time vs polling

2. **Caching Strategy**
   - What data to cache
   - Cache invalidation strategies
   - Using React cache() for server components

3. **Error Handling**
   - Server vs client error boundaries
   - Error recovery strategies
   - User feedback mechanisms 