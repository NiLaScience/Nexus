'use server';

import { createClient } from "@/utils/supabase/server";

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
      organization:organizations!tickets_organization_id_fkey(
        id,
        name,
        domain
      ),
      requester:customer_id(
        id,
        full_name,
        email,
        role
      ),
      assigned_to:profiles!tickets_assigned_to_fkey(
        id,
        full_name,
        email,
        role
      ),
      ticket_tags(
        tag:tag_id(name)
      )
    `)
    .order('created_at', { ascending: false });

  // Apply role-based filters
  if (profile.role === 'customer') {
    // Customers can see tickets from their organization
    query = query.eq('organization_id', profile.organization_id);
  } else if (profile.role === 'agent') {
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
    created: ticket.created_at,
    tags: ticket.ticket_tags?.map((t: any) => t.tag?.name) || [],
    description: ticket.description,
    organization: ticket.organization?.name || 'No Organization',
    requester: ticket.requester ? {
      id: ticket.requester.id,
      name: ticket.requester.full_name,
      email: ticket.requester.email
    } : null,
    assignedTo: ticket.assigned_to ? {
      id: ticket.assigned_to.id,
      name: ticket.assigned_to.full_name,
      email: ticket.assigned_to.email
    } : null
  }));

  return { tickets: transformedTickets };
}
