"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { updateProfileAction, getProfileAction, getAvailableRolesAction } from "@/app/actions/profile";
import { useToast } from "@/components/ui/use-toast";
import { AgentSkills } from "./agent-skills";

export function ProfileTab() {
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      try {
        const [profileResult, rolesResult] = await Promise.all([
          getProfileAction(),
          getAvailableRolesAction()
        ]);

        if (profileResult.error) {
          toast({
            title: "Error",
            description: profileResult.error,
            variant: "destructive",
          });
          return;
        }

        if (rolesResult.error) {
          toast({
            title: "Error",
            description: rolesResult.error,
            variant: "destructive",
          });
        }

        if (profileResult.profile) {
          setProfile(profileResult.profile);
        }
        if (rolesResult.roles) {
          setRoles(rolesResult.roles);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [toast]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const result = await updateProfileAction({
        full_name: profile.full_name,
        role: profile.role,
      });

      if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        // Refresh the page to update navigation and permissions
        window.location.reload();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-6">Personal Information</h2>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={profile?.full_name || ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, full_name: e.target.value } : null
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ""}
              disabled
              className="bg-muted"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={profile?.role || ""}
              onValueChange={(value) =>
                setProfile((prev) =>
                  prev ? { ...prev, role: value } : null
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {profile && (profile.role === 'agent' || profile.role === 'admin') && (
        <div className="bg-card p-6 rounded-lg shadow">
          <AgentSkills userId={profile.id} />
        </div>
      )}
    </div>
  );
} 