'use server';

import { createClient } from "@/utils/supabase/server";

interface DashboardStats {
  openTickets: { total: number; highPriority: number };
  avgResponseTime: { value: number; change: number };
  csatScore: { value: number; period: string };
  unassigned: { total: number };
}

interface RecentActivity {
  title: string;
  update: string;
  time: string;
  priority: string;
  ticketId: string;
}

interface TeamMember {
  id: string;
  name: string;
  ticketCount: number;
  available: boolean;
}

interface Profile {
  id: string;
  full_name: string | null;
  role: 'customer' | 'agent' | 'admin';
  last_seen_at: string | null;
}

interface Ticket {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  author: Pick<Profile, 'role' | 'full_name'> | null;
  ticket: Pick<Ticket, 'id' | 'title' | 'priority'> | null;
  tickets?: { created_at: string } | null;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export async function getDashboardStatsAction(): Promise<{ stats: DashboardStats | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get open tickets and high priority count
    const { data: openTickets, error: openError } = await supabase
      .from("tickets")
      .select("id, priority")
      .eq("status", "open")
      .returns<Pick<Ticket, 'id' | 'priority'>[]>();

    if (openError) {
      console.error("Error fetching open tickets:", openError);
      return { stats: null, error: "Failed to fetch open tickets" };
    }

    const highPriorityCount = openTickets?.filter(t => t.priority === "high").length || 0;

    // Get average response time for last 7 days
    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const { data: messages, error: msgError } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        ticket_id,
        created_at,
        author:profiles!ticket_messages_author_id_fkey(role),
        tickets!ticket_messages_ticket_id_fkey(created_at)
      `)
      .gte("created_at", lastWeek.toISOString())
      .order("created_at", { ascending: true })
      .returns<TicketMessage[]>();

    if (msgError) {
      console.error("Error fetching messages:", msgError);
      return { stats: null, error: "Failed to fetch messages" };
    }

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    const ticketFirstResponse: { [key: string]: Date } = {};

    messages?.forEach(msg => {
      if (msg.author?.role === "agent" || msg.author?.role === "admin") {
        if (!ticketFirstResponse[msg.ticket_id] && msg.tickets?.created_at) {
          const responseTime = new Date(msg.created_at).getTime() - new Date(msg.tickets.created_at).getTime();
          totalResponseTime += responseTime;
          responseCount++;
          ticketFirstResponse[msg.ticket_id] = new Date(msg.created_at);
        }
      }
    });

    const avgResponseTime = responseCount > 0 
      ? totalResponseTime / responseCount / (1000 * 60 * 60)
      : 0;

    // Get unassigned tickets
    const { data: unassigned, error: unassignedError } = await supabase
      .from("tickets")
      .select("id")
      .is("assigned_to", null)
      .eq("status", "open")
      .returns<Pick<Ticket, 'id'>[]>();

    if (unassignedError) {
      console.error("Error fetching unassigned tickets:", unassignedError);
      return { stats: null, error: "Failed to fetch unassigned tickets" };
    }

    // Get CSAT score for last 30 days
    const last30Days = new Date(now);
    last30Days.setDate(last30Days.getDate() - 30);

    const { data: ratings, error: ratingsError } = await supabase
      .from("ticket_ratings")
      .select("rating")
      .gte("created_at", last30Days.toISOString());

    if (ratingsError) {
      console.error("Error fetching ratings:", ratingsError);
      return { stats: null, error: "Failed to fetch ratings" };
    }

    // Calculate average rating
    const totalRatings = ratings?.length || 0;
    const sumRatings = ratings?.reduce((sum, r) => sum + r.rating, 0) || 0;
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    const stats: DashboardStats = {
      openTickets: { 
        total: openTickets?.length || 0,
        highPriority: highPriorityCount 
      },
      avgResponseTime: { 
        value: avgResponseTime,
        change: -0.3 // TODO: Implement previous period comparison
      },
      csatScore: {
        value: Number(averageRating.toFixed(1)),
        period: "Last 30 days"
      },
      unassigned: {
        total: unassigned?.length || 0
      }
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { stats: null, error: 'Failed to fetch dashboard stats' };
  }
}

export async function getRecentActivityAction(): Promise<{ activity: RecentActivity[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    const { data: activities, error } = await supabase
      .from("ticket_messages")
      .select(`
        id,
        content,
        created_at,
        ticket:tickets!ticket_messages_ticket_id_fkey(
          id,
          title,
          priority
        ),
        author:profiles!ticket_messages_author_id_fkey(
          full_name
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5)
      .returns<TicketMessage[]>();

    if (error) {
      console.error("Error fetching recent activity:", error);
      return { activity: null, error: "Failed to fetch recent activity" };
    }

    const activity: RecentActivity[] = activities?.map(activity => ({
      title: activity.ticket?.title || "Unknown Ticket",
      update: `New response from ${activity.author?.full_name}`,
      time: activity.created_at,
      priority: activity.ticket?.priority || 'low',
      ticketId: activity.ticket?.id || 'unknown'
    })) || [];

    return { activity, error: null };
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return { activity: null, error: 'Failed to fetch recent activity' };
  }
}

export async function getTeamWorkloadAction(): Promise<Team[]> {
  const supabase = await createClient();
  
  interface TeamResponse {
    id: string;
    name: string;
    team_members: {
      agent: {
        id: string;
        full_name: string | null;
        role: string;
        tickets: {
          id: string;
          status: string;
        }[] | null;
      };
    }[];
  }
  
  // First get all teams
  const { data: teams, error: teamError } = await supabase
    .from("teams")
    .select(`
      id,
      name,
      team_members!inner(
        agent:user_id(
          id,
          full_name,
          role,
          tickets:tickets!tickets_assigned_to_fkey(
            id,
            status
          )
        )
      )
    `)
    .returns<TeamResponse[]>();

  if (teamError) {
    console.error("Error fetching teams:", teamError);
    return [];
  }

  // Transform the data to group agents by team
  return teams.map(team => ({
    id: team.id,
    name: team.name,
    members: team.team_members
      .map(member => ({
        id: member.agent.id,
        name: member.agent.full_name || "Unknown Agent",
        // Only count open and in_progress tickets
        ticketCount: member.agent.tickets?.filter(t => 
          t.status === "open" || t.status === "in_progress"
        ).length || 0,
        // For now, assume all agents are available since we don't have last_seen_at
        available: true
      }))
      // Sort members by ticket count (descending)
      .sort((a, b) => b.ticketCount - a.ticketCount)
  }))
  // Sort teams by total ticket count (descending)
  .sort((a, b) => {
    const aTotal = a.members.reduce((sum, m) => sum + m.ticketCount, 0);
    const bTotal = b.members.reduce((sum, m) => sum + m.ticketCount, 0);
    return bTotal - aTotal;
  });
} 