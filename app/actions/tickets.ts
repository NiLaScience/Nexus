'use server';

import { createClient } from "@/utils/supabase/server";
import { revalidateTag } from "next/cache";
import { Ticket } from "@/types/ticket";

export type TicketFilters = {
  status?: string[];
  priority?: string[];
  assigned_to?: string;
  team_id?: string;
  organization_id?: string;
  search?: string;
  customer_id?: string;
};

/**
 * Fetches tickets based on user role and optional filters
 * @param filters Optional filters for status, priority, assignment, and team
 * @returns Object containing tickets array or error message
 */
export async function getTicketsAction(filters?: TicketFilters) {
  const supabase = await createClient();

  // Get current user and their role
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get user's profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Profile not found' };
  }

  console.log('User role:', profile.role); // Debug log
  
  let query = supabase
    .from('tickets')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      created_at,
      customer:profiles!tickets_customer_id_fkey(
        id, 
        full_name,
        organization:organizations!profiles_organization_id_fkey(name)
      ),
      assigned_agent:profiles!tickets_assigned_to_fkey(
        id, 
        full_name
      ),
      team:team_id(id, name),
      organization_id,
      ticket_tags(tag:tag_id(name))
    `)
    .order('created_at', { ascending: false });

  // Apply role-based filters
  if (profile.role === 'customer') {
    // Customers can only see tickets in their organization
    query = query.eq('organization_id', profile.organization_id);
  } else if (profile.role === 'agent') {
    // Agents can see tickets assigned to them or their teams
    const { data: teamIds } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id);

    const teams = (teamIds || []).map(t => t.team_id);
    
    if (teams.length > 0) {
      query = query.or(`assigned_to.eq.${user.id},team_id.in.(${teams.join(',')})`);
    } else {
      query = query.eq('assigned_to', user.id);
    }
  }
  // Admins can see all tickets, so no additional filters needed

  // Apply user filters if provided
  if (filters) {
    if (filters.status?.length) {
      query = query.in('status', filters.status);
    }
    if (filters.priority?.length) {
      query = query.in('priority', filters.priority);
    }
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id);
    }
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      query = query.or(
        `title.ilike.${searchTerm},` +
        `description.ilike.${searchTerm},` +
        `ticket_tags!inner(tag!inner(name.ilike.${searchTerm}))`
      );
    }
  }

  const { data: tickets, error } = await query;

  if (error) {
    console.error('Error fetching tickets:', error);
    return { error: 'Failed to fetch tickets' };
  }

  if (!tickets || tickets.length === 0) {
    console.log('No tickets found in database'); // Debug log
    return { tickets: [] };
  }

  // Transform the data to match our frontend Ticket type
  const transformedTickets = tickets.map((ticket: any) => ({
    id: ticket.id,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    created: new Date(ticket.created_at).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    tags: ticket.ticket_tags?.map((t: any) => t.tag?.name) || [],
    description: ticket.description,
    organization: ticket.customer?.organization?.name || 'No Organization',
    requester: {
      id: ticket.customer?.id,
      name: ticket.customer?.full_name || 'Unknown Customer',
      email: '' // We'll need to handle emails differently
    },
    assignedTo: ticket.assigned_agent ? {
      id: ticket.assigned_agent.id,
      name: ticket.assigned_agent.full_name,
      email: '' // We'll need to handle emails differently
    } : undefined
  }));

  return { tickets: transformedTickets };
}
