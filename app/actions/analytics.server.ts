'use server';

import { createClient } from "@/utils/supabase/server";

export type AnalyticsMetrics = {
  totalTickets: { value: string; change: string };
  avgResponseTime: { value: string; change: string };
  resolutionRate: { value: string; change: string };
};

export type TicketTrend = {
  name: string;
  tickets: number;
};

export type StatusDistribution = {
  name: string;
  value: number;
  color: string;
};

const STATUS_COLORS = {
  open: "#22c55e",
  in_progress: "#3b82f6",
  resolved: "#f59e0b",
  closed: "#64748b",
};

type AnalyticsFilters = {
  organization_id?: string;
  team_id?: string;
};

export async function getAnalyticsDataAction(timePeriod: string = "7d", filters?: AnalyticsFilters) {
  const supabase = await createClient();
  
  // Calculate date range based on time period
  const now = new Date();
  const startDate = new Date();
  switch (timePeriod) {
    case "24h":
      startDate.setHours(startDate.getHours() - 24);
      break;
    case "7d":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "30d":
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "90d":
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  console.log('Fetching tickets from', startDate.toISOString(), 'to', now.toISOString());

  // Build the base query
  let query = supabase
    .from("tickets")
    .select("id, created_at, status")
    .gte("created_at", startDate.toISOString());

  // Apply filters if provided
  if (filters?.organization_id) {
    query = query.eq("organization_id", filters.organization_id);
    console.log('Filtering by organization:', filters.organization_id);
  }
  if (filters?.team_id) {
    query = query.eq("team_id", filters.team_id);
    console.log('Filtering by team:', filters.team_id);
  }

  // Get total tickets and previous period comparison
  const { data: currentTickets, error: currentError } = await query;

  if (currentError) {
    console.error('Error fetching current tickets:', currentError);
    return {
      metrics: {
        totalTickets: { value: "0", change: "+0%" },
        avgResponseTime: { value: "0.0h", change: "+0.0h" },
        resolutionRate: { value: "0%", change: "+0%" },
      },
      ticketTrend: [],
      statusDistribution: [],
    };
  }

  console.log('Current tickets:', currentTickets?.length || 0);

  const previousStartDate = new Date(startDate);
  const previousEndDate = new Date(now);
  switch (timePeriod) {
    case "24h":
      previousStartDate.setHours(previousStartDate.getHours() - 24);
      previousEndDate.setHours(previousEndDate.getHours() - 24);
      break;
    case "7d":
      previousStartDate.setDate(previousStartDate.getDate() - 7);
      previousEndDate.setDate(previousEndDate.getDate() - 7);
      break;
    case "30d":
      previousStartDate.setDate(previousStartDate.getDate() - 30);
      previousEndDate.setDate(previousEndDate.getDate() - 30);
      break;
    case "90d":
      previousStartDate.setDate(previousStartDate.getDate() - 90);
      previousEndDate.setDate(previousEndDate.getDate() - 90);
      break;
  }

  // Build previous period query with same filters
  let previousQuery = supabase
    .from("tickets")
    .select("id, status")
    .gte("created_at", previousStartDate.toISOString())
    .lte("created_at", previousEndDate.toISOString());

  if (filters?.organization_id) {
    previousQuery = previousQuery.eq("organization_id", filters.organization_id);
  }
  if (filters?.team_id) {
    previousQuery = previousQuery.eq("team_id", filters.team_id);
  }

  // Get previous period tickets for comparison
  const { data: previousTickets, error: previousError } = await previousQuery;

  if (previousError) {
    console.error('Error fetching previous tickets:', previousError);
  }

  console.log('Previous tickets:', previousTickets?.length || 0);

  const currentTotal = currentTickets?.length || 0;
  const previousTotal = previousTickets?.length || 0;
  const ticketChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    : "+100";

  // Build messages query with same filters
  let messagesQuery = supabase
    .from("ticket_messages")
    .select(`
      id,
      ticket_id,
      created_at,
      author:profiles!ticket_messages_author_id_fkey(
        role
      ),
      is_internal,
      tickets!ticket_messages_ticket_id_fkey(
        created_at,
        organization_id,
        team_id
      )
    `)
    .eq('is_internal', false)
    .order("created_at", { ascending: true });

  if (filters?.organization_id || filters?.team_id) {
    messagesQuery = messagesQuery.not('tickets', 'is', null);
    
    if (filters?.organization_id) {
      messagesQuery = messagesQuery.eq('tickets.organization_id', filters.organization_id);
    }
    if (filters?.team_id) {
      messagesQuery = messagesQuery.eq('tickets.team_id', filters.team_id);
    }
  }

  // Get average response time
  const { data: messages, error: messagesError } = await messagesQuery;

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  }

  console.log('Messages:', messages?.length || 0);

  console.log('\nMessage Analysis:');
  messages?.forEach(msg => {
    console.log(`\nMessage for ticket ${msg.ticket_id}:`);
    console.log(`  Author role: ${msg.author?.role || 'no role'}`);
    console.log(`  Is internal: ${msg.is_internal}`);
    console.log(`  Created at: ${new Date(msg.created_at).toISOString()}`);
    console.log(`  Ticket created at: ${msg.tickets?.created_at ? new Date(msg.tickets.created_at).toISOString() : 'no ticket date'}`);
  });

  // Calculate average response time for current period
  let totalResponseTime = 0;
  let responseCount = 0;
  const ticketFirstResponse: { [key: string]: Date } = {};

  console.log('\nCalculating current period response times:');
  messages?.forEach(msg => {
    // Only count agent responses
    if (msg.author?.role === 'agent' || msg.author?.role === 'admin') {
      console.log(`\nFound agent/admin message for ticket ${msg.ticket_id}`);
      if (!ticketFirstResponse[msg.ticket_id]) {
        console.log('  First response for this ticket');
        const ticketCreatedAt = msg.tickets?.created_at;
        if (ticketCreatedAt) {
          const messageDate = new Date(msg.created_at);
          const ticketDate = new Date(ticketCreatedAt);
          
          // Only count if message is in current period
          if (messageDate >= startDate && messageDate <= now) {
            console.log('  Message is in current period');
            const responseTime = messageDate.getTime() - ticketDate.getTime();
            console.log(`Ticket ${msg.ticket_id}:`);
            console.log(`  Created: ${ticketDate.toISOString()}`);
            console.log(`  First Response: ${messageDate.toISOString()}`);
            console.log(`  Response Time: ${(responseTime / (1000 * 60 * 60)).toFixed(2)}h`);
            
            ticketFirstResponse[msg.ticket_id] = messageDate;
            responseCount++;
            totalResponseTime += responseTime;
          } else {
            console.log('  Message is outside current period');
          }
        } else {
          console.log('  No ticket creation date found');
        }
      } else {
        console.log('  Not first response for this ticket');
      }
    } else {
      console.log(`\nSkipping non-agent message for ticket ${msg.ticket_id}`);
    }
  });

  console.log(`\nCurrent Period Summary:`);
  console.log(`Total Response Time: ${(totalResponseTime / (1000 * 60 * 60)).toFixed(2)}h`);
  console.log(`Response Count: ${responseCount}`);

  // Calculate previous period response time
  let previousTotalResponseTime = 0;
  let previousResponseCount = 0;
  const previousTicketFirstResponse: { [key: string]: Date } = {};

  console.log('\nCalculating previous period response times:');
  messages?.forEach(msg => {
    const messageDate = new Date(msg.created_at);
    if (
      messageDate >= previousStartDate && 
      messageDate <= previousEndDate &&
      (msg.author?.role === 'agent' || msg.author?.role === 'admin')
    ) {
      if (!previousTicketFirstResponse[msg.ticket_id]) {
        const ticketCreatedAt = msg.tickets?.created_at;
        if (ticketCreatedAt) {
          const ticketDate = new Date(ticketCreatedAt);
          const responseTime = messageDate.getTime() - ticketDate.getTime();
          console.log(`Ticket ${msg.ticket_id}:`);
          console.log(`  Created: ${ticketDate.toISOString()}`);
          console.log(`  First Response: ${messageDate.toISOString()}`);
          console.log(`  Response Time: ${(responseTime / (1000 * 60 * 60)).toFixed(2)}h`);
          
          previousTicketFirstResponse[msg.ticket_id] = messageDate;
          previousResponseCount++;
          previousTotalResponseTime += responseTime;
        }
      }
    }
  });

  console.log(`\nPrevious Period Summary:`);
  console.log(`Total Response Time: ${(previousTotalResponseTime / (1000 * 60 * 60)).toFixed(2)}h`);
  console.log(`Response Count: ${previousResponseCount}`);

  const currentAvgResponseTime = responseCount > 0 
    ? totalResponseTime / responseCount / (1000 * 60 * 60)
    : 0;

  const previousAvgResponseTime = previousResponseCount > 0
    ? previousTotalResponseTime / previousResponseCount / (1000 * 60 * 60)
    : 0;

  console.log('\nFinal Calculations:');
  console.log(`Current Average Response Time: ${currentAvgResponseTime.toFixed(2)}h`);
  console.log(`Previous Average Response Time: ${previousAvgResponseTime.toFixed(2)}h`);

  const avgResponseTimeChange = previousAvgResponseTime > 0
    ? ((currentAvgResponseTime - previousAvgResponseTime) / previousAvgResponseTime * 100).toFixed(1)
    : "+0.0";

  console.log(`Response Time Change: ${avgResponseTimeChange}%`);

  // Calculate resolution rate for current period
  const currentResolved = currentTickets?.filter(t => 
    t.status === 'resolved' || t.status === 'closed'
  ).length || 0;

  const currentResolutionRate = currentTotal > 0 
    ? (currentResolved / currentTotal * 100)
    : 0;

  // Calculate resolution rate for previous period
  const previousResolved = previousTickets?.filter(t => 
    t.status === 'resolved' || t.status === 'closed'
  ).length || 0;

  const previousResolutionRate = previousTotal > 0
    ? (previousResolved / previousTotal * 100)
    : 0;

  const resolutionRateChange = previousResolutionRate > 0
    ? ((currentResolutionRate - previousResolutionRate) / previousResolutionRate * 100).toFixed(1)
    : "+0.0";

  // Get ticket trend data
  const ticketTrend: TicketTrend[] = [];
  const days = timePeriod === "24h" ? 24 : parseInt(timePeriod);
  const interval = timePeriod === "24h" ? "hour" : "day";

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    if (interval === "hour") {
      date.setHours(date.getHours() - i);
    } else {
      date.setDate(date.getDate() - i);
    }

    const periodStart = new Date(date);
    if (interval === "hour") {
      periodStart.setHours(periodStart.getHours() - 1);
    } else {
      periodStart.setHours(0, 0, 0, 0);
    }

    const periodEnd = new Date(date);
    if (interval === "day") {
      periodEnd.setHours(23, 59, 59, 999);
    }

    // Build trend query with same filters
    let trendQuery = supabase
      .from("tickets")
      .select("id")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

    if (filters?.organization_id) {
      trendQuery = trendQuery.eq("organization_id", filters.organization_id);
    }
    if (filters?.team_id) {
      trendQuery = trendQuery.eq("team_id", filters.team_id);
    }

    const { data: periodTickets, error: periodError } = await trendQuery;

    if (periodError) {
      console.error('Error fetching period tickets:', periodError);
    }

    ticketTrend.unshift({
      name: interval === "hour" 
        ? date.getHours().toString().padStart(2, "0") + ":00"
        : date.toLocaleDateString("en-US", { weekday: "short" }),
      tickets: periodTickets?.length || 0,
    });
  }

  // Build status distribution query with same filters
  let statusQuery = supabase
    .from("tickets")
    .select("status")
    .gte("created_at", startDate.toISOString());

  if (filters?.organization_id) {
    statusQuery = statusQuery.eq("organization_id", filters.organization_id);
  }
  if (filters?.team_id) {
    statusQuery = statusQuery.eq("team_id", filters.team_id);
  }

  // Get status distribution
  const { data: statusCounts, error: statusError } = await statusQuery;

  if (statusError) {
    console.error('Error fetching status counts:', statusError);
  }

  console.log('Status counts:', statusCounts?.length || 0);

  const statusDistribution: { [key: string]: number } = {
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
  };

  statusCounts?.forEach(ticket => {
    if (ticket.status in statusDistribution) {
      statusDistribution[ticket.status]++;
    }
  });

  const formattedStatusDistribution: StatusDistribution[] = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  }));

  const result = {
    metrics: {
      totalTickets: { value: currentTotal.toString(), change: `${ticketChange}%` },
      avgResponseTime: { 
        value: `${currentAvgResponseTime.toFixed(1)}h`, 
        change: `${avgResponseTimeChange}%`
      },
      resolutionRate: { 
        value: `${currentResolutionRate.toFixed(0)}%`, 
        change: `${resolutionRateChange}%`
      },
    },
    ticketTrend,
    statusDistribution: formattedStatusDistribution,
  };

  console.log('Analytics result:', result);
  return result;
} 