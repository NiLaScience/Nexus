'use client';

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus as WorkspaceTicketStatus } from "@/types/workspace-settings";
import { AuthService } from "@/services/auth";
import { useToast } from "@/components/ui/use-toast";
import { SupabaseService } from "@/services/supabase";

interface Agent {
  id: string;
  full_name: string;
}

interface Organization {
  id: string;
  name: string;
}

interface CustomerResponse {
  id: string;
  full_name: string;
  organization: {
    name: string;
  };
}

interface Customer {
  id: string;
  full_name: string;
  organization: {
    name: string;
  } | null;
}

interface TicketFiltersProps {
  onFilterChange?: (filters: {
    search?: string;
    timePeriod?: string;
    status?: string;
    client?: string;
    agent?: string;
    priority?: string;
    customer_id?: string;
  }) => void;
}

export function TicketFilters({ onFilterChange }: TicketFiltersProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [workspaceStatuses, setWorkspaceStatuses] = useState<WorkspaceTicketStatus[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    timePeriod: '7days',
    status: 'all',
    client: 'all',
    agent: 'all',
    priority: 'all',
    customer_id: 'all'
  });
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        // Get current user and check role
        const { user, error: authError } = await AuthService.getCurrentUser();
        if (authError || !user?.profile) {
          toast({
            title: "Error",
            description: "Failed to authenticate user",
            variant: "destructive",
          });
          return;
        }

        setUserRole(user.profile.role);

        // Load workspace settings
        const settings = await getWorkspaceSettings();
        if (settings?.ticket_statuses) {
          setWorkspaceStatuses(settings.ticket_statuses);
        }

        const supabase = SupabaseService.createAnonymousClient();

        // Load agents
        const { data: agentsData, error: agentsError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'agent');
        
        if (agentsError) {
          toast({
            title: "Error",
            description: "Failed to load agents",
            variant: "destructive",
          });
        } else if (agentsData) {
          setAgents(agentsData);
        }

        // Only load organizations and customers if user is an agent or admin
        if (user.profile.role !== 'customer') {
          // Load organizations
          const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('id, name')
            .order('name');
          
          if (orgsError) {
            toast({
              title: "Error",
              description: "Failed to load organizations",
              variant: "destructive",
            });
          } else if (orgsData) {
            setOrganizations(orgsData);
          }

          // Load customers
          const { data: customersData, error: customersError } = await supabase
            .from('profiles')
            .select('id, full_name, organization:organizations!profiles_organization_id_fkey!inner(name)')
            .eq('role', 'customer')
            .order('full_name')
            .returns<CustomerResponse[]>();
          
          if (customersError) {
            toast({
              title: "Error",
              description: "Failed to load customers",
              variant: "destructive",
            });
          } else if (customersData) {
            const formattedCustomers: Customer[] = customersData.map((customer: CustomerResponse) => ({
              id: customer.id,
              full_name: customer.full_name,
              organization: customer.organization
            }));
            setCustomers(formattedCustomers);
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load filter data",
          variant: "destructive",
        });
      }
    }

    loadData();
  }, [toast]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // If user is a customer, show limited filters
  if (userRole === 'customer') {
    return (
      <div className="grid grid-cols-[1fr,100px,100px] gap-4">
        {/* Title/Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input 
            className="pl-9" 
            placeholder="Search tickets..." 
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        {/* Status */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange('status', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {workspaceStatuses.map((status) => (
              <SelectItem 
                key={status.name} 
                value={status.name}
                style={{ color: status.color }}
              >
                {status.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select
          value={filters.priority}
          onValueChange={(value) => handleFilterChange('priority', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1fr,200px,200px,200px,100px,100px] gap-4">
      {/* Title/Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
        <Input 
          className="pl-9" 
          placeholder="Search tickets..." 
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
      </div>

      {/* Organization */}
      <Select
        value={filters.client}
        onValueChange={(value) => handleFilterChange('client', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Client */}
      <Select
        value={filters.customer_id}
        onValueChange={(value) => handleFilterChange('customer_id', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          {customers.map((customer) => (
            <SelectItem key={customer.id} value={customer.id}>
              {customer.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Assigned Agent */}
      <Select
        value={filters.agent}
        onValueChange={(value) => handleFilterChange('agent', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Assigned Agent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Agents</SelectItem>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              {agent.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status}
        onValueChange={(value) => handleFilterChange('status', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {workspaceStatuses.map((status) => (
            <SelectItem 
              key={status.name} 
              value={status.name}
              style={{ color: status.color }}
            >
              {status.display}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority */}
      <Select
        value={filters.priority}
        onValueChange={(value) => handleFilterChange('priority', value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Priority</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
} 