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
import { createClient } from "@/utils/supabase/client";

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
  const [filters, setFilters] = useState({
    search: '',
    timePeriod: '7days',
    status: 'all',
    client: 'all',
    agent: 'all',
    priority: 'all',
    customer_id: 'all'
  });
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Load agents
      const { data: agentsData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'agent');
      
      if (agentsData) {
        setAgents(agentsData);
      }

      // Load organizations
      const { data: orgsData } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name');
      
      if (orgsData) {
        setOrganizations(orgsData);
      }

      // Load customers
      const { data: customersData } = await supabase
        .from('profiles')
        .select('id, full_name, organization:organizations!profiles_organization_id_fkey!inner(name)')
        .eq('role', 'customer')
        .order('full_name')
        .returns<CustomerResponse[]>();
      
      if (customersData) {
        const formattedCustomers: Customer[] = customersData.map(customer => ({
          id: customer.id,
          full_name: customer.full_name,
          organization: customer.organization
        }));
        setCustomers(formattedCustomers);
      }
    }

    loadData();
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

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
          <SelectItem value="open">Open</SelectItem>
          <SelectItem value="in_progress">In Progress</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
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