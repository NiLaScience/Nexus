# Actions Structure

## Proposed Organization

```
app/
├── actions/
│   ├── auth/
│   │   ├── sign-up.ts
│   │   ├── sign-in.ts
│   │   ├── sign-out.ts
│   │   └── password-reset.ts
│   ├── tickets/
│   │   ├── get-tickets.ts
│   │   ├── get-ticket-detail.ts
│   │   ├── update-ticket.ts
│   │   ├── create-ticket.ts
│   │   └── messages/
│   │       ├── create-message.ts
│   │       └── get-messages.ts
│   ├── profiles/
│   │   ├── get-profile.ts
│   │   └── update-profile.ts
│   └── teams/
│       ├── get-teams.ts
│       └── update-team.ts
```

## Benefits
- Better organization by feature domain
- Easier to find and maintain related actions
- Smaller, more focused files
- Better git history and conflict resolution
- Easier to implement and test features in isolation

## Migration Plan
1. Create new directory structure
2. Move auth actions first
3. Move profile actions
4. Move ticket actions (most complex, do last)
5. Update imports in components
6. Remove old actions.ts

## Conventions
- Each action file exports a single primary action
- Related helper functions stay in the same file
- Types go in corresponding `/types` directory
- Keep actions pure and focused
- Use consistent error handling patterns
- Add JSDoc comments for all exports

Would you like me to start implementing this restructure? 