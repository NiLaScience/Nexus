'use client';

import { useEffect, useState } from "react";
import { UserPlus, ArrowLeft, X, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { AuthService } from "@/services/auth";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus as WorkspaceTicketStatus } from "@/types/workspace-settings";
import { updateTicketStatusAction, updateTicketPriorityAction } from "@/app/actions/tickets/update.server";

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
  const [isLoading, setIsLoading] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showPriorityDialog, setShowPriorityDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingPriority, setPendingPriority] = useState<string | null>(null);
  const [pendingAgent, setPendingAgent] = useState<{ id: string; name: string } | null>(null);
  const [workspaceStatuses, setWorkspaceStatuses] = useState<WorkspaceTicketStatus[]>([]);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Get current user and check auth
        const { user, error } = await AuthService.getCurrentUser();
        if (error || !user?.profile) {
          toast({
            title: "Error",
            description: "You must be logged in to perform this action",
            variant: "destructive",
          });
          return;
        }

        // Set user role
        setUserRole(user.profile.role);

        // Load agents if user is not a customer
        if (user.profile.role !== 'customer') {
          const { agents: agentList, error: agentsError } = await getAgentsAction();
          if (agentsError) {
            toast({
              title: "Error",
              description: "Failed to load agents",
              variant: "destructive",
            });
          } else if (agentList) {
            setAgents(agentList);
          }
        }

        // Load workspace settings
        const settings = await getWorkspaceSettings();
        if (settings?.ticket_statuses) {
          setWorkspaceStatuses(settings.ticket_statuses);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        toast({
          title: "Error",
          description: "Failed to initialize ticket header",
          variant: "destructive",
        });
      }
    };

    initializeComponent();
  }, [toast]);

  const getStatusDisplay = (statusName: string) => {
    const status = workspaceStatuses.find(s => s.name === statusName);
    return status ? status.display : statusName;
  };

  const getStatusColor = (statusName: string) => {
    const status = workspaceStatuses.find(s => s.name === statusName);
    return status ? status.color : '#808080';
  };

  const handleStatusChange = async (newStatus: string) => {
    setPendingStatus(newStatus);
    setShowStatusDialog(true);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('status', pendingStatus);

    const result = await updateTicketStatusAction(formData);
    setIsLoading(false);
    setShowStatusDialog(false);
    setPendingStatus(null);

    if ('error' in result) {
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

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high" | "urgent") => {
    setPendingPriority(newPriority);
    setShowPriorityDialog(true);
  };

  const confirmPriorityChange = async () => {
    if (!pendingPriority) return;
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('priority', pendingPriority);

    const result = await updateTicketPriorityAction(formData);
    setIsLoading(false);
    setShowPriorityDialog(false);
    setPendingPriority(null);

    if ('error' in result) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Ticket priority updated",
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
    const formData = new FormData();
    formData.append('ticketId', ticketId);
    formData.append('assignedTo', pendingAgent.id);
    formData.append('teamId', ''); // We'll add team assignment later

    const result = await assignTicketAction(formData);
    setIsLoading(false);
    setShowAssignDialog(false);
    setPendingAgent(null);

    if ('error' in result) {
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

  const handleAddTag = async () => {
    if (tagInput && !tags.includes(tagInput)) {
      const newTags = [...tags, tagInput];
      setIsLoading(true);
      const result = await updateTicketTagsAction(ticketId, newTags);
      setIsLoading(false);

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setTags(newTags);
        setTagInput("");
        setIsEditingTags(false);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setIsLoading(true);
    const result = await updateTicketTagsAction(ticketId, newTags);
    setIsLoading(false);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      setTags(newTags);
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "high":
      case "urgent":
        return 'bg-destructive/10 text-destructive';
      case "medium":
        return 'bg-warning/10 text-warning';
      case "low":
        return 'bg-muted/10 text-muted-foreground';
      default:
        return 'bg-muted/10 text-muted-foreground';
    }
  };

  const isCustomer = userRole === 'customer';

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
          {isEditingTags ? (
            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-32 h-8"
                placeholder="Add tag"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditingTags(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setIsEditingTags(true)}
            >
              <PlusCircle className="w-4 h-4" />
              Add Tag
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the status to{" "}
              {pendingStatus && getStatusDisplay(pendingStatus)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={isLoading}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Priority</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the priority to {pendingPriority}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPriorityChange}
              disabled={isLoading}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Assign Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to assign this ticket to{" "}
              {pendingAgent?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAssignment}
              disabled={isLoading}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 