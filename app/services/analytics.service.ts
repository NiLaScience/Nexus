import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

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

export type AnalyticsFilters = {
  organization_id?: string;
  team_id?: string;
};

const STATUS_COLORS = {
  open: "#22c55e",
  in_progress: "#3b82f6",
  resolved: "#f59e0b",
  closed: "#64748b",
} as const;

type Message = {
  id: string;
  ticket_id: string;
  created_at: string;
  author: Array<{
    role: string;
  }>;
  is_internal: boolean;
  tickets: Array<{
    created_at: string;
    organization_id: string;
    team_id: string;
  }>;
};

export class AnalyticsService {
  private supabase!: SupabaseClient;

  constructor() {
    // Initialize with server client
    this.initializeClient();
  }

  private async initializeClient() {
    this.supabase = await createClient();
  }


  private calculateDateRange(timePeriod: string) {
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

    return { startDate, now };
  }

  private calculatePreviousPeriod(timePeriod: string, startDate: Date, now: Date) {
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

    return { previousStartDate, previousEndDate };
  }

  private async getTickets(startDate: Date, filters?: AnalyticsFilters) {
    let query = this.supabase
      .from("tickets")
      .select("id, created_at, status")
      .gte("created_at", startDate.toISOString());

    if (filters?.organization_id) {
      query = query.eq("organization_id", filters.organization_id);
    }
    if (filters?.team_id) {
      query = query.eq("team_id", filters.team_id);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  private async getMessages(_startDate: Date, filters?: AnalyticsFilters) {
    let query = this.supabase
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
      query = query.not('tickets', 'is', null);
      
      if (filters?.organization_id) {
        query = query.eq('tickets.organization_id', filters.organization_id);
      }
      if (filters?.team_id) {
        query = query.eq('tickets.team_id', filters.team_id);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Message[];
  }

  private calculateResponseTimes(messages: Message[], startDate: Date, endDate: Date) {
    let totalResponseTime = 0;
    let responseCount = 0;
    const ticketFirstResponse: { [key: string]: Date } = {};

    messages?.forEach(msg => {
      if (msg.author[0]?.role === 'agent' || msg.author[0]?.role === 'admin') {
        if (!ticketFirstResponse[msg.ticket_id]) {
          const ticketCreatedAt = msg.tickets[0]?.created_at;
          if (ticketCreatedAt) {
            const messageDate = new Date(msg.created_at);
            const ticketDate = new Date(ticketCreatedAt);
            
            if (messageDate >= startDate && messageDate <= endDate) {
              const responseTime = messageDate.getTime() - ticketDate.getTime();
              ticketFirstResponse[msg.ticket_id] = messageDate;
              responseCount++;
              totalResponseTime += responseTime;
            }
          }
        }
      }
    });

    return { totalResponseTime, responseCount };
  }

  private async getTicketTrend(timePeriod: string, now: Date, filters?: AnalyticsFilters) {
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

      let query = this.supabase
        .from("tickets")
        .select("id")
        .gte("created_at", periodStart.toISOString())
        .lte("created_at", periodEnd.toISOString());

      if (filters?.organization_id) {
        query = query.eq("organization_id", filters.organization_id);
      }
      if (filters?.team_id) {
        query = query.eq("team_id", filters.team_id);
      }

      const { data: periodTickets, error } = await query;
      if (error) throw error;

      ticketTrend.unshift({
        name: interval === "hour" 
          ? date.getHours().toString().padStart(2, "0") + ":00"
          : date.toLocaleDateString("en-US", { weekday: "short" }),
        tickets: periodTickets?.length || 0,
      });
    }

    return ticketTrend;
  }

  private async getStatusDistribution(startDate: Date, filters?: AnalyticsFilters) {
    let query = this.supabase
      .from("tickets")
      .select("status")
      .gte("created_at", startDate.toISOString());

    if (filters?.organization_id) {
      query = query.eq("organization_id", filters.organization_id);
    }
    if (filters?.team_id) {
      query = query.eq("team_id", filters.team_id);
    }

    const { data: statusCounts, error } = await query;
    if (error) throw error;

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

    return Object.entries(statusDistribution).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    }));
  }

  public async getAnalyticsData(timePeriod = "7d", filters?: AnalyticsFilters) {
    try {
      // Calculate date ranges
      const { startDate, now } = this.calculateDateRange(timePeriod);
      const { previousStartDate, previousEndDate } = this.calculatePreviousPeriod(timePeriod, startDate, now);

      // Get current period tickets
      const currentTickets = await this.getTickets(startDate, filters);
      const currentTotal = currentTickets?.length || 0;

      // Get previous period tickets
      let previousQuery = this.supabase
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

      const { data: previousTickets, error: previousError } = await previousQuery;
      if (previousError) throw previousError;

      const previousTotal = previousTickets?.length || 0;
      const ticketChange = previousTotal > 0 
        ? ((currentTotal - previousTotal) / previousTotal * 100).toFixed(1)
        : "+100";

      // Get messages and calculate response times
      const messages = await this.getMessages(startDate, filters);
      const currentPeriodStats = this.calculateResponseTimes(messages, startDate, now);
      const previousPeriodStats = this.calculateResponseTimes(messages, previousStartDate, previousEndDate);

      // Calculate average response times
      const currentAvgResponseTime = currentPeriodStats.responseCount > 0 
        ? currentPeriodStats.totalResponseTime / currentPeriodStats.responseCount / (1000 * 60 * 60)
        : 0;

      const previousAvgResponseTime = previousPeriodStats.responseCount > 0
        ? previousPeriodStats.totalResponseTime / previousPeriodStats.responseCount / (1000 * 60 * 60)
        : 0;

      const avgResponseTimeChange = previousAvgResponseTime > 0
        ? ((currentAvgResponseTime - previousAvgResponseTime) / previousAvgResponseTime * 100).toFixed(1)
        : "+0.0";

      // Calculate resolution rates
      const currentResolved = currentTickets?.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      ).length || 0;

      const currentResolutionRate = currentTotal > 0 
        ? (currentResolved / currentTotal * 100)
        : 0;

      const previousResolved = previousTickets?.filter(t => 
        t.status === 'resolved' || t.status === 'closed'
      ).length || 0;

      const previousResolutionRate = previousTotal > 0
        ? (previousResolved / previousTotal * 100)
        : 0;

      const resolutionRateChange = previousResolutionRate > 0
        ? ((currentResolutionRate - previousResolutionRate) / previousResolutionRate * 100).toFixed(1)
        : "+0.0";

      // Get ticket trend and status distribution
      const ticketTrend = await this.getTicketTrend(timePeriod, now, filters);
      const statusDistribution = await this.getStatusDistribution(startDate, filters);

      return {
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
        statusDistribution,
      };
    } catch (error) {
      console.error('Error in getAnalyticsData:', error);
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
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService(); 