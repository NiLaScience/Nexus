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
import { updateTicketAction, getAgentsAction, updateTicketTagsAction } from "@/app/actions/tickets.server";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { TicketStatus as WorkspaceTicketStatus } from "@/types/workspace-settings";
import { getProfileAction } from "@/app/actions/profile";

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

  useEffect(() => {
    async function loadWorkspaceSettings() {
      const settings = await getWorkspaceSettings();
      if (settings?.ticket_statuses) {
        setWorkspaceStatuses(settings.ticket_statuses);
      }
    }
    loadWorkspaceSettings();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      const { profile } = await getProfileAction();
      setUserRole(profile?.role || null);
    };
    loadProfile();
  }, []);

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

  const handlePriorityChange = async (newPriority: "low" | "medium" | "high" | "urgent") => {
    setPendingPriority(newPriority);
    setShowPriorityDialog(true);
  };

  const confirmPriorityChange = async () => {
    if (!pendingPriority) return;
    
    setIsLoading(true);
    const result = await updateTicketAction(ticketId, {
      priority: pendingPriority as "low" | "medium" | "high" | "urgent"
    });
    setIsLoading(false);
    setShowPriorityDialog(false);
    setPendingPriority(null);

    if (result.error) {
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
        toast({
          title: "Success",
          description: "Tag added successfully",
        });
      }
    }
  };

  const removeTag = async (tagToRemove: string) => {
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
      toast({
        title: "Success",
        description: "Tag removed successfully",
      });
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
    <>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Link href="/tickets">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">{title}</h1>
        </div>

        <div className="flex justify-between items-start">
          <div>
            <span className="text-muted-foreground">Created on {format(new Date(created), "MMMM d, yyyy 'at' h:mm a")}</span>
            <div className="space-y-2">
              <div className="flex gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {tag}
                    {!isCustomer && (
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-foreground"
                        disabled={isLoading}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
                {!isCustomer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6"
                    onClick={() => setIsEditingTags(!isEditingTags)}
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {isEditingTags && !isCustomer && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="h-8"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={isLoading}
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {isCustomer ? (
              <>
                <div className="w-[180px] h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                  <UserPlus className="w-4 h-4 mr-2 text-muted-foreground" />
                  <span className="truncate text-muted-foreground">
                    {assignedTo ? `${assignedTo.full_name} (${assignedTo.role})` : 'Unassigned'}
                  </span>
                </div>
                <div className="w-[180px] h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(priority)}`}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </span>
                </div>
                <div className="w-[180px] h-9 flex items-center px-3 bg-muted rounded-md text-sm">
                  <span 
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                    style={{ 
                      color: getStatusColor(status),
                      backgroundColor: `${getStatusColor(status)}10`
                    }}
                  >
                    {getStatusDisplay(status)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" disabled={isLoading} className="w-[180px] h-9 justify-start">
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span className="truncate">
                        {assignedTo ? `${assignedTo.full_name} (${assignedTo.role})` : 'Unassigned'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[180px]">
                    <div className="space-y-2">
                      <h4 className="font-medium px-2 py-1.5 text-sm text-muted-foreground">Assign To</h4>
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
                  defaultValue={priority} 
                  value={priority}
                  onValueChange={handlePriorityChange} 
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Priority">
                      {priority && (
                        <span 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(priority)}`}
                        >
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                      Set Priority
                    </div>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem 
                        key={p} 
                        value={p}
                      >
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityClass(p)}`}
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select 
                  defaultValue={status} 
                  value={status}
                  onValueChange={handleStatusChange} 
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Status">
                      {status && (
                        <span 
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            color: getStatusColor(status),
                            backgroundColor: `${getStatusColor(status)}10`
                          }}
                        >
                          {getStatusDisplay(status)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                      Set Status
                    </div>
                    {workspaceStatuses.map((statusOption) => (
                      <SelectItem 
                        key={statusOption.name} 
                        value={statusOption.name}
                      >
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            color: statusOption.color,
                            backgroundColor: `${statusOption.color}10`
                          }}
                        >
                          {statusOption.display}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>
      </div>

      {!isCustomer && (
        <>
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

          <AlertDialog open={showPriorityDialog} onOpenChange={setShowPriorityDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Ticket Priority</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to change the ticket priority to "{pendingPriority}"?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmPriorityChange}>Continue</AlertDialogAction>
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
      )}
    </>
  );
} 