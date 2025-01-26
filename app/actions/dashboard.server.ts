'use server';

import { createClient } from "@/utils/supabase/server";
import type { DashboardStats } from "@/types/dashboard";

interface RecentActivity {
  title: string;
  update: string;
  time: string;
  priority: string;
  ticketId: string;
}

export interface TeamMember {
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

interface MessageWithTicket {
  created_at: string;
  ticket_id: string;
  author: Array<{
    role: string;
  }>;
  tickets: Array<{
    created_at: string;
  }>;
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export async function getDashboardStatsAction() {
  try {
    const supabase = await createClient();

    // Get open tickets count
    const { count: openTicketsCount, error: openTicketsError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open');

    if (openTicketsError) throw openTicketsError;

    // Get high priority open tickets count
    const { count: highPriorityCount, error: highPriorityError } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
      .eq('priority', 'high');

    if (highPriorityError) throw highPriorityError;

    // Get messages for response time calculation
    const { data: messages, error: messagesError } = await supabase
      .from('ticket_messages')
      .select(`
        created_at,
        ticket_id,
        author:profiles!ticket_messages_author_id_fkey(role),
        tickets!inner(created_at)
      `)
      .eq('is_internal', false)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Calculate average response time
    let totalResponseTime = 0;
    let responseCount = 0;
    const ticketFirstResponse: { [key: string]: Date } = {};

    (messages as MessageWithTicket[])?.forEach(msg => {
      if (msg.author[0]?.role === 'agent' || msg.author[0]?.role === 'admin') {
        if (!ticketFirstResponse[msg.ticket_id] && msg.tickets[0]?.created_at) {
          const messageDate = new Date(msg.created_at);
          const ticketDate = new Date(msg.tickets[0].created_at);
          const responseTime = messageDate.getTime() - ticketDate.getTime();
          ticketFirstResponse[msg.ticket_id] = messageDate;
          responseCount++;
          totalResponseTime += responseTime;
        }
      }
    });

    const averageResponseTime = responseCount > 0 ? totalResponseTime / responseCount / (1000 * 60 * 60) : 0;

    // Get satisfaction score
    const { data: satisfactionData, error: satisfactionError } = await supabase
      .from('ticket_ratings')
      .select('rating');

    if (satisfactionError) throw satisfactionError;

    const totalRatings = satisfactionData?.length || 0;
    const totalScore = satisfactionData?.reduce((sum, { rating }) => sum + rating, 0) || 0;
    const satisfactionScore = totalRatings > 0 ? Math.round((totalScore / (totalRatings * 5)) * 100) : 0;

    // Get team size
    const { data: teamData, error: teamError } = await supabase
      .from('profiles')
      .select('last_seen_at')
      .in('role', ['agent', 'admin']);

    if (teamError) throw teamError;

    const totalTeamSize = teamData?.length || 0;
    const onlineCount = teamData?.filter(member => {
      if (!member.last_seen_at) return false;
      const lastSeen = new Date(member.last_seen_at);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastSeen > fiveMinutesAgo;
    }).length || 0;

    const stats: DashboardStats = {
      openTickets: {
        total: openTicketsCount || 0,
        highPriority: highPriorityCount || 0,
      },
      responseTime: {
        average: Math.round(averageResponseTime * 10) / 10, // Round to 1 decimal place
        trend: 0, // TODO: Calculate trend
      },
      satisfaction: {
        score: satisfactionScore,
        responses: totalRatings,
      },
      teamSize: {
        total: totalTeamSize,
        online: onlineCount,
      },
    };

    return { stats, error: null };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { stats: null, error: 'Failed to load dashboard stats' };
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