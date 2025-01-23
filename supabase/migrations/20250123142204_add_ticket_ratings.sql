-- Create ticket_ratings table
CREATE TABLE IF NOT EXISTS ticket_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(ticket_id) -- Only one rating per ticket
);

-- Add RLS policies
ALTER TABLE ticket_ratings ENABLE ROW LEVEL SECURITY;

-- Customers can only rate their own tickets
CREATE POLICY "Customers can rate their own tickets"
  ON ticket_ratings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_ratings.ticket_id
      AND tickets.customer_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Customers can view ratings on their own tickets
CREATE POLICY "Customers can view their own ticket ratings"
  ON ticket_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_ratings.ticket_id
      AND tickets.customer_id = auth.uid()
    )
  );

-- Agents and admins can view all ratings
CREATE POLICY "Staff can view all ratings"
  ON ticket_ratings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('agent', 'admin')
    )
  );

-- Create function to automatically close ticket after rating
CREATE OR REPLACE FUNCTION close_ticket_after_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Only close the ticket if it's in resolved status
  UPDATE tickets
  SET status = 'closed'
  WHERE id = NEW.ticket_id
  AND status = 'resolved';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to close ticket after rating
CREATE TRIGGER close_ticket_after_rating
  AFTER INSERT ON ticket_ratings
  FOR EACH ROW
  EXECUTE FUNCTION close_ticket_after_rating();
