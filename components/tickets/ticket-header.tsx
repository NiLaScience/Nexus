'use client';

import { useEffect, useState } from "react";
import { UserPlus, ArrowLeft, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
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
import { getAgentsAction, updateTicketTagsAction } from "@/app/actions/tickets.server";
import { assignTicketAction } from "@/app/actions/tickets/assign.server";
import { useToast } from "@/components/ui/use-toast";
import { AuthClientService } from "@/services/auth.client";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus as WorkspaceTicketStatus } from "@/types/workspace-settings";
import { updateTicketStatusAction, updateTicketPriorityAction } from "@/app/actions/tickets/update.server";
import type { UpdateTicketStatusInput, UpdateTicketPriorityInput } from "@/app/actions/tickets/schemas";

interface Agent {
  id: string;
  full_name: string | null;
  role: string;
}

interface TicketHeaderProps {
  ticketId: string;
  title: string;
  created: string;
  tags: string[];
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: { id: string; full_name: string | null; role: string } | null;
}

export function TicketHeader({ ticketId, title, created, tags: initialTags, status, priority, assignedTo }: TicketHeaderProps) {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isPriorityDialogOpen, setIsPriorityDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(status);
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">(priority);
  const [workspaceStatuses, setWorkspaceStatuses] = useState<WorkspaceTicketStatus[]>([]);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get current user role
        const { user, error: authError } = await AuthClientService.getCurrentUser();
        if (authError || !user?.profile) {
          console.error('Error getting user:', authError);
          return;
        }

        // Get workspace settings
        const settings = await getWorkspaceSettings();
        if (settings) {
          setWorkspaceStatuses(settings.ticket_statuses);
        }

        // Get agents if user is agent or admin
        if (user.profile.role === 'agent' || user.profile.role === 'admin') {
          const { agents: loadedAgents, error: agentsError } = await getAgentsAction();
          if (agentsError) {
            console.error('Error loading agents:', agentsError);
            return;
          }
          setAgents(loadedAgents || []);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };

    initializeComponent();
  }, []);

  const getStatusDisplay = (statusName: string) => {
    const status = workspaceStatuses.find(s => s.name === statusName);
    return status?.display || statusName;
  };

  const handleStatusChange = async (newStatus: string) => {
    setNewStatus(newStatus);
    setIsStatusDialogOpen(true);
  };

  const confirmStatusChange = async () => {
    try {
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('status', newStatus as UpdateTicketStatusInput['status']);

      const { error } = await updateTicketStatusAction(formData);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket status updated successfully",
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive",
      });
    } finally {
      setIsStatusDialogOpen(false);
    }
  };

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high" | "urgent") => {
    setNewPriority(newPriority);
    setIsPriorityDialogOpen(true);
  };

  const confirmPriorityChange = async () => {
    try {
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('priority', newPriority as UpdateTicketPriorityInput['priority']);

      const { error } = await updateTicketPriorityAction(formData);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket priority updated successfully",
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update ticket priority",
        variant: "destructive",
      });
    } finally {
      setIsPriorityDialogOpen(false);
    }
  };

  const handleAssignment = async (agentId: string) => {
    setSelectedAgent(agentId);
    setIsAssignDialogOpen(true);
  };

  const confirmAssignment = async () => {
    try {
      const formData = new FormData();
      formData.append('ticketId', ticketId);
      formData.append('assignedTo', selectedAgent || '');
      formData.append('teamId', '');

      const { error } = await assignTicketAction(formData);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Ticket assigned successfully",
      });
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: "Error",
        description: "Failed to assign ticket",
        variant: "destructive",
      });
    } finally {
      setIsAssignDialogOpen(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      const updatedTags = [...tags, newTag.trim()];
      const { error } = await updateTicketTagsAction(ticketId, updatedTags);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setTags(updatedTags);
      setNewTag("");
      toast({
        title: "Success",
        description: "Tag added successfully",
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag",
        variant: "destructive",
      });
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const updatedTags = tags.filter(tag => tag !== tagToRemove);
      const { error } = await updateTicketTagsAction(ticketId, updatedTags);

      if (error) {
        toast({
          title: "Error",
          description: error,
          variant: "destructive",
        });
        return;
      }

      setTags(updatedTags);
      toast({
        title: "Success",
        description: "Tag removed successfully",
      });
    } catch (error) {
      console.error('Error removing tag:', error);
      toast({
        title: "Error",
        description: "Failed to remove tag",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/tickets" className="hover:opacity-70">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Created {format(new Date(created), "MMM d, yyyy")}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {workspaceStatuses.map((status) => (
              <SelectItem key={status.name} value={status.name}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.display}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={handlePriorityChange}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <UserPlus className="w-4 h-4" />
              {assignedTo ? assignedTo.full_name : "Assign"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="end">
            <div className="flex flex-col">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-100"
                  onClick={() => handleAssignment(agent.id)}
                >
                  {agent.full_name}
                  <span className="text-xs text-gray-500">{agent.role}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleAddTag}
          >
            <PlusCircle className="w-4 h-4" />
            Add Tag
          </Button>
        </div>
      </div>

      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to{" "}
              {newStatus && getStatusDisplay(newStatus)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPriorityDialogOpen} onOpenChange={setIsPriorityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Priority</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the priority to {newPriority}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPriorityChange}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this ticket to{" "}
              {selectedAgent ? agents.find(a => a.id === selectedAgent)?.full_name : "Unassigned"}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAssignment}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 