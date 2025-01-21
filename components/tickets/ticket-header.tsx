'use client';

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateTicketAction, getAgentsAction } from "@/app/actions/tickets.server";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";

interface Agent {
  id: string;
  full_name: string | null;
  role: string;
}

interface TicketHeaderProps {
  ticketId: string;
  created: string;
  tags: string[];
  status: "open" | "in_progress" | "resolved" | "closed";
}

export function TicketHeader({ ticketId, created, tags, status }: TicketHeaderProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [pendingAgent, setPendingAgent] = useState<{id: string, name: string} | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to perform this action",
          variant: "destructive",
        });
      }
    };
    checkAuth();
  }, [supabase.auth, toast]);

  useEffect(() => {
    async function loadAgents() {
      const { agents, error } = await getAgentsAction();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to load agents",
          variant: "destructive",
        });
      } else if (agents) {
        setAgents(agents);
      }
    }
    loadAgents();
  }, [toast]);

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved" | "closed") => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    setIsLoading(true);
    const result = await updateTicketAction(ticketId, {
      status: pendingStatus as "open" | "in_progress" | "resolved" | "closed"
    });
    setIsLoading(false);
    setShowStatusDialog(false);
    setPendingStatus(null);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket status updated",
      });
    }
  };

  const handleAssignment = async (agentId: string) => {
    // Skip if no agent ID provided
    if (!agentId || agentId.trim() === '') return;

    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    setPendingAgent({ id: agentId, name: agent.full_name || 'Unnamed' });
    setShowAssignDialog(true);
  };

  const confirmAssignment = async () => {
    if (!pendingAgent) return;

    setIsLoading(true);
    const result = await updateTicketAction(ticketId, {
      assigned_to: pendingAgent.id // Remove the || null since we want to assign
    });
    setIsLoading(false);
    setShowAssignDialog(false);
    setPendingAgent(null);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
    }
  };

  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <span className="text-muted-foreground">Created on {created}</span>
          <div className="flex gap-2 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                <UserPlus className="w-4 h-4 mr-2" />
                Reassign
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <h4 className="font-medium">Reassign Ticket</h4>
                <Select onValueChange={handleAssignment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name || 'Unnamed'} ({agent.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
          
          <Select 
            defaultValue={status} 
            value={status}
            onValueChange={handleStatusChange} 
            disabled={isLoading}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Ticket Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the ticket status to "{pendingStatus}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reassign Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this ticket to {pendingAgent?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignment}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 