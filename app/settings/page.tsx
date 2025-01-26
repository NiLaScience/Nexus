"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Shield, User, Users } from "lucide-react";
import { ProfileTab } from "@/components/settings/profile-tab";
import { NotificationsTab } from "@/components/settings/notifications-tab";
import { TeamTab } from "@/components/settings/team-tab";
import { AdminTab } from "@/components/settings/admin-tab";
import { useEffect, useState } from "react";
import { getProfileAction } from "@/app/actions/profile";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Profile } from '@/types/team';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  useEffect(() => {
    async function loadProfile() {
      const { profile: userProfile } = await getProfileAction();
      setProfile(userProfile || null);
      setLoading(false);
    }
    loadProfile();
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      {message && (
        <Alert className="mb-6">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue={message ? "profile" : "profile"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Team
          </TabsTrigger>
          {profile?.role === 'admin' && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>
        <TabsContent value="team">
          <TeamTab />
        </TabsContent>
        {profile?.role === 'admin' && (
          <TabsContent value="admin">
            <AdminTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
} 