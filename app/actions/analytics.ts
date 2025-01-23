import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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

export async function getAnalyticsDataAction(timePeriod: string = "7d") {
  const supabase = createClientComponentClient();
  
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

  // Get total tickets and previous period comparison
  const { data: currentTickets, error: currentError } = await supabase
    .from("tickets")
    .select("id, created_at")
    .gte("created_at", startDate.toISOString());

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

  const { data: previousTickets, error: previousError } = await supabase
    .from("tickets")
    .select("id")
    .gte("created_at", previousStartDate.toISOString())
    .lte("created_at", previousEndDate.toISOString());

  if (previousError) {
    console.error('Error fetching previous tickets:', previousError);
  }

  console.log('Previous tickets:', previousTickets?.length || 0);

  const currentTotal = currentTickets?.length || 0;
  const previousTotal = previousTickets?.length || 0;
  const ticketChange = previousTotal > 0 
    ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
    : "+100";

  // Get average response time
  const { data: messages, error: messagesError } = await supabase
    .from("ticket_messages")
    .select("ticket_id, created_at")
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error('Error fetching messages:', messagesError);
  }

  console.log('Messages:', messages?.length || 0);

  let totalResponseTime = 0;
  let responseCount = 0;
  const ticketFirstResponse: { [key: string]: Date } = {};

  messages?.forEach(msg => {
    if (!ticketFirstResponse[msg.ticket_id]) {
      ticketFirstResponse[msg.ticket_id] = new Date(msg.created_at);
      responseCount++;
      // Calculate time from ticket creation to first response
      const ticket = currentTickets?.find(t => t.id === msg.ticket_id);
      if (ticket) {
        const responseTime = new Date(msg.created_at).getTime() - new Date(ticket.created_at).getTime();
        totalResponseTime += responseTime;
      }
    }
  });

  const avgResponseTime = responseCount > 0 
    ? (totalResponseTime / responseCount / (1000 * 60 * 60)).toFixed(1) 
    : "0.0";

  // Get resolution rate
  const { data: resolvedTickets, error: resolvedError } = await supabase
    .from("tickets")
    .select("id")
    .in("status", ["resolved", "closed"])
    .gte("created_at", startDate.toISOString());

  if (resolvedError) {
    console.error('Error fetching resolved tickets:', resolvedError);
  }

  console.log('Resolved tickets:', resolvedTickets?.length || 0);

  const resolutionRate = currentTotal > 0 
    ? ((resolvedTickets?.length || 0) / currentTotal * 100).toFixed(0)
    : "0";

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

    const { data: periodTickets, error: periodError } = await supabase
      .from("tickets")
      .select("id")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString());

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

  // Get status distribution
  const { data: statusCounts, error: statusError } = await supabase
    .from("tickets")
    .select("status")
    .gte("created_at", startDate.toISOString());

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
      avgResponseTime: { value: `${avgResponseTime}h`, change: "+0.0h" }, // TODO: Add previous period comparison
      resolutionRate: { value: `${resolutionRate}%`, change: "+0%" }, // TODO: Add previous period comparison
    },
    ticketTrend,
    statusDistribution: formattedStatusDistribution,
  };

  console.log('Analytics result:', result);
  return result;
} 