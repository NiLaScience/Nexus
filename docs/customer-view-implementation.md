# Ticket Details Page - Customer View Implementation

## TicketHeader Component
- [x] Make status display read-only for customers
- [x] Make priority display read-only for customers
- [x] Make assigned agent display read-only for customers
- [x] Make tags display read-only for customers
- [x] Keep title, created date, and back button visible to all

## Content Components
- [x] Keep MessageHistory visible and interactive
- [x] Keep TicketDetails visible
- [x] Keep AttachmentsList visible and interactive
- [x] Keep TicketTimeline visible
- [x] Keep RelatedTickets visible
- [x] Keep TicketRating visible and interactive
- [x] Hide InternalNotes component for customers

## Access Control
- [x] Add role check to conditionally render edit controls
- [x] Add role check to hide InternalNotes
- [x] Ensure RLS policies allow customers to view timeline events
- [x] Ensure RLS policies allow customers to view related tickets 