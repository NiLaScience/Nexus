# Design Migration Checklist

## Configuration Files (Requires Careful Merging)
- [x] package.json - Merged dependencies and scripts
- [x] tsconfig.json - Merged compiler options and paths
- [x] tsconfig.node.json - Skipped (Vite-specific)
- [x] tailwind.config.ts - Updated content paths for Next.js
- [x] postcss.config.js - Configs identical, no changes needed
- [x] vite.config.ts - Skipped (not needed for Next.js)

## Direct Files (May Need Adaptation)
- [x] index.html - Meta tags already present in Next.js layout
- [x] README.md - Merge relevant documentation

## Component Migration
- [x] Move components to appropriate Next.js directories:
  - [x] TicketList.tsx -> Split into:
    - [x] app/tickets/page.tsx
    - [x] components/tickets/ticket-list.tsx
    - [x] components/tickets/ticket-filters.tsx
  - [x] TicketDetail.tsx -> Split into:
    - [x] app/tickets/[id]/page.tsx
    - [x] components/tickets/ticket-header.tsx
    - [x] components/tickets/message-history.tsx
    - [x] components/tickets/ticket-timeline.tsx
    - [x] components/tickets/internal-notes.tsx
    - [x] components/tickets/related-tickets.tsx
    - [x] components/tickets/attachments-list.tsx
  - [x] TicketForm.tsx -> Split into:
    - [x] app/tickets/new/page.tsx
    - [x] components/tickets/ticket-form.tsx
  - [x] Settings.tsx -> Split into:
    - [x] app/settings/page.tsx
    - [x] components/settings/settings-form.tsx
    - [x] components/settings/tabs/profile-tab.tsx
    - [x] components/settings/tabs/notifications-tab.tsx
    - [x] components/settings/tabs/team-tab.tsx
    - [x] components/settings/tabs/admin-tab.tsx
  - [x] Analytics.tsx -> Split into:
    - [x] app/analytics/page.tsx
    - [x] components/analytics/analytics-dashboard.tsx
    - [x] components/analytics/metrics-grid.tsx
    - [x] components/analytics/charts/ticket-trend.tsx
    - [x] components/analytics/charts/status-distribution.tsx
  - [x] Chatbot.tsx -> Split into:
    - [x] components/chat/chatbot.tsx
  - [x] Dashboard.tsx -> Split into:
    - [x] app/dashboard/page.tsx
    - [x] components/dashboard/dashboard.tsx
    - [x] components/dashboard/stats/quick-stats.tsx
    - [x] components/dashboard/activity/recent-activity.tsx
    - [x] components/dashboard/articles/trending-articles.tsx
    - [x] components/dashboard/team/team-workload.tsx
  - [x] KnowledgeBase.tsx -> Split into:
    - [x] app/knowledge-base/page.tsx
    - [x] components/knowledge-base/knowledge-base.tsx
    - [x] components/knowledge-base/search-header.tsx
    - [x] components/knowledge-base/categories-sidebar.tsx
    - [x] components/knowledge-base/article-list.tsx
  - [x] Layout.tsx -> Merged into app/layout.tsx

## UI Components
- [x] Check ui/ directory and migrate reusable components to components/ui/
  - [x] All shadcn/ui components already present in main project

## Styles and Utils
- [x] Migrate index.css contents to app/globals.css
- [x] Move utils.ts contents to utils/ directory

## Notes
- Back up existing config files before merging ✓
- Test after each major component migration ✓
- Keep track of any dependencies that need to be installed ✓
- Document any breaking changes or required adaptations ✓

## Migration Complete! ✓
All components, styles, and utilities have been successfully migrated from the design project to the Next.js app. 