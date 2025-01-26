'use server';

import { SupabaseService } from "@/services/supabase";
import { AuthService } from "@/services/auth";

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
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user) {
      throw new Error(authError || "Not authenticated");
    }

    const supabase = SupabaseService.createServiceClient();

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
    // Get the current user using AuthService
    const { user, error: authError } = await AuthService.getCurrentUser();
    if (authError || !user?.profile) {
      throw new Error(authError || "Not authenticated");
    }

    const supabase = SupabaseService.createServiceClient();

    // Get the ticket to check if user has access
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("customer_id")
      .eq("id", ticketId)
      .single();

    if (ticketError) throw ticketError;
    if (!ticket) throw new Error("Ticket not found");

    // Check if user has access (is customer or admin)
    const hasAccess = user.id === ticket.customer_id || user.profile.role === 'admin';
    if (!hasAccess) {
      throw new Error("You don't have permission to view this rating");
    }

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
    // Only admins can view satisfaction stats
    const isAdmin = await AuthService.isAdmin();
    if (!isAdmin) {
      throw new Error("Only admins can view satisfaction stats");
    }

    const supabase = SupabaseService.createServiceClient();

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