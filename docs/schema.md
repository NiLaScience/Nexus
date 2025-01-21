# Current Database Schema

## Core Tables

### 1. `profiles`
Extends the default `auth.users` table with additional user information.

| Column       | Type         | Description                               |
|-------------|--------------|-------------------------------------------|
| `id`        | `uuid`       | PK, references auth.users.id              |
| `role`      | `user_role`  | User's role in the system                |
| `full_name` | `text`       | User's full name                         |
| `created_at`| `timestamptz`| When the profile was created             |
| `updated_at`| `timestamptz`| When the profile was last updated        |

### 2. `tickets`
Central entity for customer support tickets.

| Column         | Type           | Description                               |
|---------------|----------------|-------------------------------------------|
| `id`          | `uuid`         | PK, unique identifier                     |
| `title`       | `text`         | Ticket title                             |
| `description` | `text`         | Detailed ticket description              |
| `status`      | `ticket_status`| Current status of the ticket             |
| `created_by`  | `uuid`         | References auth.users.id (creator)        |
| `assigned_to` | `uuid`         | References auth.users.id (assignee)       |
| `tags`        | `text`         | Ticket tags/categories                   |
| `custom_fields`| `jsonb`       | Flexible custom fields storage           |
| `created_at`  | `timestamptz`  | When the ticket was created             |
| `updated_at`  | `timestamptz`  | When the ticket was last updated        |

### 3. `ticket_attachments`
Stores files attached to tickets.

| Column         | Type         | Description                               |
|---------------|--------------|-------------------------------------------|
| `id`          | `uuid`       | PK, unique identifier                     |
| `ticket_id`   | `uuid`       | References tickets.id                     |
| `file_name`   | `text`       | Original file name                       |
| `file_path`   | `text`       | Path to file in storage                  |
| `content_type`| `text`       | MIME type of the file                    |
| `created_by`  | `uuid`       | References auth.users.id (uploader)       |
| `created_at`  | `timestamptz`| When the attachment was created          |

## Custom Types

1. `user_role` - Enum for user roles
2. `ticket_status` - Enum for ticket statuses

## Relationships
- `profiles.id` → `auth.users.id` (extends auth user)
- `tickets.created_by` → `auth.users.id` (ticket creator)
- `tickets.assigned_to` → `auth.users.id` (ticket assignee)
- `ticket_attachments.ticket_id` → `tickets.id` (attachment belongs to ticket)
- `ticket_attachments.created_by` → `auth.users.id` (attachment uploader)

## Notes
1. Using `auth.users` from Supabase Auth for core user management
2. All timestamps are in timezone-aware format (`timestamptz`)
3. Using `jsonb` for flexible custom fields in tickets
4. File storage handled by Supabase Storage, with paths stored in `ticket_attachments`

---

## 1. `teams` Table

Represents support or sales teams for routing and load balancing.  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column       | Type        | Description                             |
|--------------|------------|-----------------------------------------|
| `id`         | `uuid`     | PK, unique identifier                   |
| `name`       | `text`     | Name of the team (e.g., "Support L1")   |
| `created_at` | `timestamp`| Defaults to `now()`                     |

Example usage:
- Different teams (e.g. Tier 1 Support, Billing, Sales) can be referenced in tickets.

---

## 2. `user_teams` Table

Maps users to teams.  
- **Primary Key**: `id` (auto-generated, e.g. `bigserial` or `uuid`)

| Column       | Type        | Description                                     |
|--------------|------------|-------------------------------------------------|
| `id`         | `bigint` or `uuid` | PK, unique identifier                    |
| `user_id`    | `uuid`     | References `profiles.id`                        |
| `team_id`    | `uuid`     | References `teams.id`                           |
| `created_at` | `timestamp`| Defaults to `now()`                             |

Example usage:
- An admin can assign a user to multiple teams for specialized support.

---

## 4. `ticket_messages` Table (Optional but Recommended)

Stores conversation history or internal notes for each ticket.  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column       | Type        | Description                                                                           |
|--------------|------------|---------------------------------------------------------------------------------------|
| `id`         | `uuid`     | PK, unique identifier                                                                 |
| `ticket_id`  | `uuid`     | References `tickets.id`                                                               |
| `author_id`  | `uuid`     | References `profiles.id` (could be the customer or an agent/admin)                    |
| `content`    | `text`     | The actual text content of the message                                               |
| `message_type`| `text`    | e.g. `public` (visible to customer) or `internal` (visible to agents/admin only)      |
| `created_at` | `timestamp`| Defaults to `now()`                                                                   |

Example usage:
- Agents add internal notes (`message_type = 'internal'`).  
- Customers or agents post public updates (`message_type = 'public'`).

---

## 5. `tags` Table (Optional)

Defines reusable tags (e.g., for automation rules).  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column       | Type        | Description                    |
|--------------|------------|--------------------------------|
| `id`         | `uuid`     | PK, unique identifier          |
| `name`       | `text`     | e.g. "billing", "login_issues" |
| `created_at` | `timestamp`| Defaults to `now()`            |

---

## 6. `ticket_tags` Table (Optional)

Supports many-to-many tagging of tickets.  
- **Primary Key**: `id` (auto-generated, e.g. `bigserial` or `uuid`)

| Column       | Type        | Description                          |
|--------------|------------|--------------------------------------|
| `id`         | `bigint` or `uuid` | PK, unique identifier         |
| `ticket_id`  | `uuid`     | References `tickets.id`              |
| `tag_id`     | `uuid`     | References `tags.id`                 |
| `created_at` | `timestamp`| Defaults to `now()`                  |

---

## Relationship Diagram (Conceptual)

```mermaid
erDiagram

auth.users ||--o{ profiles : "1-to-1 or 1-to-0..1"
profiles ||--o{ tickets : "customer_id"
profiles ||--o{ tickets : "assigned_to"
profiles ||--o{ user_teams : "user_id"
teams ||--o{ user_teams : "team_id"
teams ||--o{ tickets : "team_id"
tickets ||--o{ ticket_messages : "ticket_id"
profiles ||--o{ ticket_messages : "author_id"
tickets ||--o{ ticket_tags : "ticket_id"
tags ||--o{ ticket_tags : "tag_id"
