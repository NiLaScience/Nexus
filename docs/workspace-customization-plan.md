# Workspace Customization Checklist

## Phase 1: Custom Statuses

### Database
- [x] Create `workspace_settings` table with `ticket_statuses` JSONB field
- [x] Remove status check constraint from tickets table
- [x] Add validation trigger for ticket status

### Backend
- [x] Add GET endpoint for workspace settings
- [x] Add PUT endpoint for updating ticket statuses
- [x] Add status validation middleware

### Frontend
- [x] Add "Customization" tab to admin settings
- [x] Create status management UI (add/edit/delete)
- [x] Update ticket form status dropdown
- [x] Update ticket list status display

### Testing & Deploy
- [x] Test status validation
- [x] Test status management UI
- [x] Deploy database changes
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for issues

## Phase 2: Custom Fields

### Database
- [ ] Add `ticket_fields` to workspace_settings
- [ ] Add `custom_fields` JSONB to tickets table
- [ ] Add validation trigger for custom fields

### Backend
- [ ] Add PUT endpoint for custom fields configuration
- [ ] Add custom field validation middleware

### Frontend
- [ ] Add custom fields management UI
- [ ] Update ticket form to render custom fields
- [ ] Update ticket list to show custom fields
- [ ] Add validation for required fields

### Testing & Deploy
- [ ] Test custom field validation
- [ ] Test field management UI
- [ ] Deploy database changes
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for issues

## Notes
- Each phase can be deployed independently
- Default statuses: Open, In Progress, Resolved, Closed
- Custom fields support: text, number, select, date
- Only workspace admins can modify settings 