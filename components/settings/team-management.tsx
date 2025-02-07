'use client';

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { getTeamsAction, createTeamAction, updateTeamAction, deleteTeamAction, addTeamMemberAction, removeTeamMemberAction, addTeamOrganizationAction, removeTeamOrganizationAction, getOrganizationsAction } from "@/app/actions/teams.server";
import { getAgentsAction } from "@/app/actions/tickets.server";
import { toast } from "sonner";

export function TeamManagement() {
  const [teams, setTeams] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    try {
      const [teamsResult, agentsResult, organizationsResult] = await Promise.all([
        getTeamsAction(),
        getAgentsAction(),
        getOrganizationsAction()
      ]);

      if (teamsResult.error || agentsResult.error || organizationsResult.error) {
        throw new Error(teamsResult.error || agentsResult.error || organizationsResult.error || "Failed to fetch data");
      }

      setTeams(teamsResult.teams || []);
      setAgents(agentsResult.agents || []);
      setOrganizations(organizationsResult.organizations || []);
    } catch (err) {
      setError((err as Error).message);
      toast.error("Failed to load teams and agents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading team management...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium">Team Management</h2>
        <CreateTeamDialog onTeamCreated={fetchData} />
      </div>
      <div className="space-y-6">
        {teams?.map((team) => (
          <TeamCard 
            key={team.id} 
            team={team} 
            agents={agents} 
            organizations={organizations}
            onTeamUpdated={fetchData}
          />
        ))}
      </div>
    </div>
  );
}

function CreateTeamDialog({ onTeamCreated }: { onTeamCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { error } = await createTeamAction({ name, description });

    setLoading(false);
    if (error) {
      toast.error("Failed to create team");
    } else {
      toast.success("Team created successfully");
      setOpen(false);
      onTeamCreated();
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create New Team</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Team</DialogTitle>
          <DialogDescription>
            Create a new team to organize your support agents.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TeamCard({ team, agents, organizations, onTeamUpdated }: { team: any; agents: any[]; organizations: any[]; onTeamUpdated: () => void }) {
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { error } = await updateTeamAction(team.id, { name, description });

    setLoading(false);
    if (error) {
      toast.error("Failed to update team");
    } else {
      toast.success("Team updated successfully");
      setEditOpen(false);
      onTeamUpdated();
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this team?")) return;

    const { error } = await deleteTeamAction(team.id);
    if (error) {
      toast.error("Failed to delete team");
    } else {
      toast.success("Team deleted successfully");
      onTeamUpdated();
    }
  }

  async function handleAddMember(userId: string) {
    const { error } = await addTeamMemberAction(team.id, userId);
    if (error) {
      toast.error("Failed to add team member");
    } else {
      toast.success("Team member added successfully");
      onTeamUpdated();
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("Are you sure you want to remove this team member?")) return;

    const { error } = await removeTeamMemberAction(team.id, userId);
    if (error) {
      toast.error("Failed to remove team member");
    } else {
      toast.success("Team member removed successfully");
      onTeamUpdated();
    }
  }

  async function handleAddOrganization(organizationId: string) {
    const { error } = await addTeamOrganizationAction(team.id, organizationId);
    if (error) {
      toast.error("Failed to add organization");
    } else {
      toast.success("Organization added successfully");
      onTeamUpdated();
    }
  }

  async function handleRemoveOrganization(organizationId: string) {
    if (!confirm("Are you sure you want to remove this organization?")) return;

    const { error } = await removeTeamOrganizationAction(team.id, organizationId);
    if (error) {
      toast.error("Failed to remove organization");
    } else {
      toast.success("Organization removed successfully");
      onTeamUpdated();
    }
  }

  const teamMembers = team.members?.map((m: any) => m.user) || [];
  const teamOrganizations = team.organizations?.map((o: any) => o.organization) || [];
  const availableAgents = agents.filter(
    (agent) => !teamMembers.find((m: any) => m.id === agent.id)
  );
  const availableOrganizations = organizations.filter(
    (org) => !teamOrganizations.find((o: any) => o.id === org.id)
  );

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium">{team.name}</h3>
          <p className="text-sm text-muted-foreground">{team.description}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Edit Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Team</DialogTitle>
                <DialogDescription>
                  Update team information.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEdit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={team.name}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={team.description || ""}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
          >
            Delete Team
          </Button>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Team Members</h4>
        <div className="space-y-2">
          {teamMembers.map((member: any) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div>
                <div className="font-medium">{member.full_name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.role}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveMember(member.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Add Team Member</h4>
        <div className="flex flex-wrap gap-2">
          {availableAgents.map((agent) => (
            <Badge
              key={agent.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleAddMember(agent.id)}
            >
              {agent.full_name}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Client Organizations</h4>
        <div className="space-y-2">
          {teamOrganizations.map((org: any) => (
            <div
              key={org.id}
              className="flex items-center justify-between p-2 bg-muted rounded-lg"
            >
              <div className="font-medium">{org.name}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveOrganization(org.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">Add Client Organization</h4>
        <div className="flex flex-wrap gap-2">
          {availableOrganizations.map((org) => (
            <Badge
              key={org.id}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => handleAddOrganization(org.id)}
            >
              {org.name}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
} 