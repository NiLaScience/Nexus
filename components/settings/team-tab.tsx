"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTeamMembersAction } from "@/app/actions/team.server";
import { updateUserActiveStatusAction, getProfileAction } from "@/app/actions/profile";
import { toast } from "sonner";
import type { TeamMember } from "@/types/team";

export function TeamTab() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<TeamMember | null>(null);

  async function fetchMembers() {
    try {
      const { members: teamMembers, error } = await getTeamMembersAction();
      if (error) throw error;
      
      // Convert response to TeamMember type
      const convertedMembers: TeamMember[] = teamMembers.map(member => ({
        id: member.id,
        full_name: member.full_name,
        email: member.email,
        role: member.role,
        is_active: member.is_active,
        organization_id: member.organization_id
      }));
      
      setMembers(convertedMembers);

      // Get current user's profile
      const { profile: userProfile } = await getProfileAction();
      if (userProfile && 'id' in userProfile) {
        // Convert Profile to TeamMember
        const teamMember: TeamMember = {
          id: userProfile.id,
          full_name: userProfile.full_name || '',
          email: userProfile.email || 'no-email',
          role: userProfile.role || 'customer',
          is_active: userProfile.is_active ?? true, // Default to true if not provided
          organization_id: userProfile.organization_id
        };
        setProfile(teamMember);
      } else {
        setProfile(null);
      }
    } catch (err) {
      setError((err as Error).message);
      toast.error("Failed to load team members");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(userId: string, value: string) {
    try {
      setLoading(true);
      const isActive = value === 'active';
      const result = await updateUserActiveStatusAction(userId, isActive);
      if (result.error) {
        throw new Error(result.error);
      }
      toast.success(`User status updated successfully`);
      // Update the local state to reflect the change
      setMembers(prevMembers => 
        prevMembers.map(member => 
          member.id === userId 
            ? { ...member, is_active: isActive }
            : member
        )
      );
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-medium">Organization Members</h2>
          {members.length > 0 && members[0].organization_id && (
            <p className="text-sm text-muted-foreground mt-1">
              Organization ID: {members[0].organization_id}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div className="space-y-1">
              <h3 className="font-medium">{member.full_name}</h3>
              <p className="text-sm text-muted-foreground">{member.email}</p>
              <span className="inline-block px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                {member.role}
              </span>
            </div>
            {member.is_active !== undefined && (
              <Select 
                defaultValue={member.is_active ? 'active' : 'inactive'}
                onValueChange={(value) => handleStatusChange(member.id, value)}
                disabled={loading || member.id === profile?.id}
              >
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 