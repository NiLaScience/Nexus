'use server';

import { createClient } from "@/utils/supabase/server";

export type DashboardStats = {
  openTickets: { total: number; highPriority: number };
  avgResponseTime: { value: number; change: number };
  csatScore: { value: number; period: string };
  unassigned: { total: number };
};

export type RecentActivity = {
  title: string;
  update: string;
  time: string;
  priority: string;
  ticketId: string;
};

export type TeamMember = {
  id: string;
  name: string;
  ticketCount: number;
  available: boolean;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: 'customer' | 'agent' | 'admin';
  last_seen_at: string | null;
};

type Ticket = {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
};

type TicketMessage = {
  id: string;
  ticket_id: string;
  content: string;
  created_at: string;
  author: Pick<Profile, 'role' | 'full_name'> | null;
  ticket: Pick<Ticket, 'id' | 'title' | 'priority'> | null;
  tickets?: { created_at: string } | null;
};

type AgentWithTickets = Profile & {
  tickets: Pick<Ticket, 'id' | 'status'>[] | null;
};

type Team = {
  id: string;
  name: string;
  members: TeamMember[];
};

export async function getDashboardStatsAction() {
  const supabase = await createClient();
  
  // Get open tickets and high priority count
  const { data: openTickets, error: openError } = await supabase
    .from("tickets")
    .select("id, priority")
    .eq("status", "open")
    .returns<Pick<Ticket, 'id' | 'priority'>[]>();

  if (openError) {
    console.error("Error fetching open tickets:", openError);
    return null;
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
    return null;
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
    return null;
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
    return null;
  }

  // Calculate average rating
  const totalRatings = ratings?.length || 0;
  const sumRatings = ratings?.reduce((sum, r) => sum + r.rating, 0) || 0;
  const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

  return {
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
}

function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'Just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  }
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
  });
}

export async function getRecentActivityAction() {
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
    return [];
  }

  return activities?.map(activity => ({
    title: activity.ticket?.title || "Unknown Ticket",
    update: `New response from ${activity.author?.full_name}`,
    time: getRelativeTimeString(new Date(activity.created_at)),
    priority: activity.ticket?.priority || "medium",
    ticketId: activity.ticket?.id
  })) || [];
}

export async function getTeamWorkloadAction(): Promise<Team[]> {
  const supabase = await createClient();
  
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
    .returns<any[]>();

  if (teamError) {
    console.error("Error fetching teams:", teamError);
    return [];
  }

  // Transform the data to group agents by team
  return teams.map(team => ({
    id: team.id,
    name: team.name,
    members: team.team_members
      .map((member: any) => ({
        id: member.agent.id,
        name: member.agent.full_name || "Unknown Agent",
        // Only count open and in_progress tickets
        ticketCount: member.agent.tickets?.filter((t: any) => 
          t.status === "open" || t.status === "in_progress"
        ).length || 0,
        // For now, assume all agents are available since we don't have last_seen_at
        available: true
      }))
      // Sort members by ticket count (descending)
      .sort((a: TeamMember, b: TeamMember) => b.ticketCount - a.ticketCount)
  }))
  // Sort teams by total ticket count (descending)
  .sort((a: Team, b: Team) => {
    const aTotal = a.members.reduce((sum: number, m: TeamMember) => sum + m.ticketCount, 0);
    const bTotal = b.members.reduce((sum: number, m: TeamMember) => sum + m.ticketCount, 0);
    return bTotal - aTotal;
  });
} 