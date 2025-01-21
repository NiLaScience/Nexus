"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationsTab() {
  return (
    <div className="bg-card p-6 rounded-lg shadow">
      <h2 className="text-lg font-medium mb-6">Notification Preferences</h2>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about ticket updates
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Desktop Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Show desktop notifications for new tickets
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Daily Digest</Label>
            <p className="text-sm text-muted-foreground">
              Receive a daily summary of activities
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </div>
  );
} 