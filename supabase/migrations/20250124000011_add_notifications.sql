-- Create notifications table
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id),
  ticket_id uuid references tickets(id) on delete cascade,
  type text not null check (type in ('ticket_created', 'status_changed', 'assigned', 'unassigned', 'message_added', 'internal_note_added')),
  title text not null,
  content text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable real-time for notifications
alter publication supabase_realtime add table notifications;

-- Add indexes
create index notifications_user_id_idx on notifications(user_id);
create index notifications_ticket_id_idx on notifications(ticket_id);
create index notifications_created_at_idx on notifications(created_at);
create index notifications_is_read_idx on notifications(is_read);

-- Enable RLS
alter table notifications enable row level security;

-- Add RLS policies
create policy "Users can view their own notifications"
  on notifications for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = notifications.user_id
      and profiles.id = auth.uid()
    )
  );

create policy "System can create notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = notifications.user_id
      and profiles.id = auth.uid()
    )
  )
  with check (true);

-- Function to create a notification
create or replace function create_notification(
  p_user_id uuid,
  p_ticket_id uuid,
  p_type text,
  p_title text,
  p_content text default null
) returns void as $$
begin
  insert into notifications (user_id, ticket_id, type, title, content)
  values (p_user_id, p_ticket_id, p_type, p_title, p_content);
end;
$$ language plpgsql security definer;

-- Trigger function for ticket events
create or replace function ticket_notification_trigger()
returns trigger as $$
declare
  v_ticket record;
  v_assigned_user uuid;
  v_team_members uuid[];
begin
  -- Get ticket details
  select * into v_ticket from tickets where id = new.ticket_id;
  
  -- Handle different event types
  case new.event_type
    when 'created' then
      -- Notify team members if assigned to a team
      if v_ticket.team_id is not null then
        select array_agg(user_id) into v_team_members
        from team_members
        where team_id = v_ticket.team_id;
        
        if v_team_members is not null then
          foreach v_assigned_user in array v_team_members loop
            perform create_notification(
              v_assigned_user,
              v_ticket.id,
              'ticket_created',
              'New ticket assigned to your team',
              format('Ticket "%s" has been created and assigned to your team', v_ticket.title)
            );
          end loop;
        end if;
      end if;

    when 'assigned' then
      -- Notify the newly assigned user
      if new.new_value is not null then
        perform create_notification(
          new.new_value::uuid,
          v_ticket.id,
          'assigned',
          'Ticket assigned to you',
          format('You have been assigned ticket "%s"', v_ticket.title)
        );
      end if;

    when 'status_changed' then
      -- Notify ticket creator of status changes
      perform create_notification(
        v_ticket.customer_id,
        v_ticket.id,
        'status_changed',
        'Ticket status updated',
        format('Ticket "%s" status changed from %s to %s', v_ticket.title, new.old_value, new.new_value)
      );

    when 'message_added' then
      -- Notify relevant parties of new messages
      -- For customer messages, notify assigned agent or team
      -- For agent messages, notify customer
      declare
        v_message record;
        v_notify_user_id uuid;
      begin
        select * into v_message from ticket_messages where id = new.new_value::uuid;
        
        if v_message.is_internal then
          -- Don't notify for internal notes
          return new;
        end if;
        
        -- If message is from customer, notify assigned agent or team
        if v_message.author_id = v_ticket.customer_id then
          if v_ticket.assigned_to is not null then
            v_notify_user_id := v_ticket.assigned_to;
          elsif v_ticket.team_id is not null then
            -- Notify team members
            select array_agg(user_id) into v_team_members
            from team_members
            where team_id = v_ticket.team_id;
            
            if v_team_members is not null then
              foreach v_assigned_user in array v_team_members loop
                perform create_notification(
                  v_assigned_user,
                  v_ticket.id,
                  'message_added',
                  'New message on team ticket',
                  format('New message from customer on ticket "%s"', v_ticket.title)
                );
              end loop;
            end if;
          end if;
        else
          -- Message is from agent, notify customer
          v_notify_user_id := v_ticket.customer_id;
        end if;
        
        if v_notify_user_id is not null then
          perform create_notification(
            v_notify_user_id,
            v_ticket.id,
            'message_added',
            'New message on ticket',
            format('New message on ticket "%s"', v_ticket.title)
          );
        end if;
      end;

    when 'internal_note_added' then
      -- Notify team members about internal notes
      if v_ticket.team_id is not null then
        select array_agg(user_id) into v_team_members
        from team_members
        where team_id = v_ticket.team_id;
        
        if v_team_members is not null then
          foreach v_assigned_user in array v_team_members loop
            -- Don't notify the author of their own note
            if v_assigned_user != new.actor_id then
              perform create_notification(
                v_assigned_user,
                v_ticket.id,
                'internal_note_added',
                'New internal note',
                format('New internal note added to ticket "%s"', v_ticket.title)
              );
            end if;
          end loop;
        end if;
      end if;

    else
      -- For any other event type, just return new
      return new;
  end case;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for ticket events
create trigger ticket_notification_trigger
  after insert
  on ticket_events
  for each row
  execute function ticket_notification_trigger(); 