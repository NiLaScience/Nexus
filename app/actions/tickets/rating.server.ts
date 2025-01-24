'use server';

import { createClient } from "@/utils/supabase/server";

export type TicketRating = {
  id: string;
  ticket_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  created_by: string;
};

export async function addTicketRatingAction(
  ticketId: string,
  rating: number,
  comment?: string
) {
  try {
    const supabase = await createClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("Not authenticated");

    // Verify the ticket is in resolved status
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("status")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error("Ticket not found");
    if (ticket.status !== "resolved") {
      throw new Error("Can only rate resolved tickets");
    }

    // Add the rating
    const { error: ratingError } = await supabase
      .from("ticket_ratings")
      .insert({
        ticket_id: ticketId,
        rating,
        comment,
        created_by: user.id
      });

    if (ratingError) {
      if (ratingError.code === '23505') { // Unique violation
        throw new Error("Ticket has already been rated");
      }
      throw ratingError;
    }

    return { error: null };
  } catch (error) {
    console.error("Error adding ticket rating:", error);
    return { error: (error as Error).message };
  }
}

export async function getTicketRatingAction(ticketId: string) {
  try {
    const supabase = await createClient();

    const { data: rating, error } = await supabase
      .from("ticket_ratings")
      .select(`
        id,
        ticket_id,
        rating,
        comment,
        created_at,
        created_by
      `)
      .eq("ticket_id", ticketId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    return { rating, error: null };
  } catch (error) {
    console.error("Error getting ticket rating:", error);
    return { rating: null, error: (error as Error).message };
  }
}

export async function getCustomerSatisfactionStatsAction() {
  try {
    const supabase = await createClient();

    // Get ratings distribution
    const { data: ratings, error } = await supabase
      .from("ticket_ratings")
      .select("rating");

    if (error) throw error;

    // Calculate distribution
    const distribution = Array.from({ length: 5 }, (_, i) => ({
      rating: i + 1,
      count: ratings.filter(r => r.rating === i + 1).length
    })).reverse(); // Sort in descending order (5 to 1)

    // Calculate average rating
    const totalRatings = ratings.length;
    const sumRatings = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    return {
      distribution,
      totalRatings,
      averageRating,
      error: null
    };
  } catch (error) {
    console.error("Error getting satisfaction stats:", error);
    return {
      distribution: [],
      totalRatings: 0,
      averageRating: 0,
      error: (error as Error).message
    };
  }
} 