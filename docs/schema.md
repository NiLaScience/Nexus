# Supabase Database Schema (Minimal Viable)

Below is a **minimal** schema design that covers the key Week 1 features described in the project. It provides:

1. **User Profiles** and basic role handling  
2. **Tickets** with status, priority, and assignment  
3. **Conversation** history with internal vs. public messages  
4. **Team/Agent Management** for routing and group-based assignment  
5. **Tags** for categorizing or automating workflows  

You can expand or refine these tables as the application grows.

---

## 1. `profiles` Table

Stores information about each user beyond the default `auth.users` table.  
- **Primary Key**: `id` (UUID) referencing `auth.users.id`
  
| Column         | Type        | Description                                                                |
|----------------|------------|----------------------------------------------------------------------------|
| `id`           | `uuid`     | PK, references `auth.users.id`                                             |
| `role`         | `text`     | Role or permission level (e.g. `customer`, `agent`, `admin`)               |
| `display_name` | `text`     | Public-facing name                                                          |
| `created_at`   | `timestamp`| Defaults to `now()`                                                         |

Example usage:
- A user signs up via Supabase Auth → a row is inserted here to store role and other profile info.

---

## 2. `teams` Table

Represents support or sales teams for routing and load balancing.  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column       | Type        | Description                             |
|--------------|------------|-----------------------------------------|
| `id`         | `uuid`     | PK, unique identifier                   |
| `name`       | `text`     | Name of the team (e.g., “Support L1”)   |
| `created_at` | `timestamp`| Defaults to `now()`                     |

Example usage:
- Different teams (e.g. Tier 1 Support, Billing, Sales) can be referenced in tickets.

---

## 3. `user_teams` Table

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

## 4. `tickets` Table

Central entity representing a customer request.  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column          | Type        | Description                                                                               |
|-----------------|------------|-------------------------------------------------------------------------------------------|
| `id`            | `uuid`     | PK, unique identifier                                                                     |
| `customer_id`   | `uuid`     | References `profiles.id` (the user who created the ticket)                                |
| `assigned_to`   | `uuid`     | References `profiles.id` (agent), can be `NULL` if unassigned                             |
| `team_id`       | `uuid`     | References `teams.id` (if routed to a specific team), can be `NULL`                       |
| `status`        | `text`     | e.g. `open`, `in_progress`, `closed`, `pending`, etc.                                    |
| `priority`      | `text`     | e.g. `low`, `medium`, `high`, or `urgent`                                                 |
| `title`         | `text`     | Short title or summary of the issue                                                      |
| `description`   | `text`     | Longer description or initial message from the customer                                   |
| `created_at`    | `timestamp`| Defaults to `now()`                                                                       |
| `updated_at`    | `timestamp`| Updated on each row change (can use triggers or default value approach in Postgres)       |

Example usage:
- A customer creates a ticket → `customer_id` references their profile.
- Admin or auto-assign process sets `assigned_to` or `team_id`.

---

## 5. `ticket_messages` Table (Optional but Recommended)

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

## 6. `tags` Table (Optional)

Defines reusable tags (e.g., for automation rules).  
- **Primary Key**: `id` (auto-generated, e.g. `uuid`)

| Column       | Type        | Description                    |
|--------------|------------|--------------------------------|
| `id`         | `uuid`     | PK, unique identifier          |
| `name`       | `text`     | e.g. “billing”, “login_issues” |
| `created_at` | `timestamp`| Defaults to `now()`            |

---

## 7. `ticket_tags` Table (Optional)

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
