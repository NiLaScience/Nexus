"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getWorkspaceSettings, updateTicketStatuses } from "@/app/actions/workspace-settings";
import type { TicketStatus } from "@/types/workspace-settings";
import { ChromePicker } from "react-color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function CustomizationTab() {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getWorkspaceSettings();
      if (settings?.ticket_statuses) {
        setStatuses(settings.ticket_statuses);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveStatuses = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      
      // Validate statuses before saving
      if (!statuses.length) {
        throw new Error('At least one status is required');
      }
      
      if (!statuses.every(s => s.name && s.display && s.color)) {
        throw new Error('All status fields must be filled out');
      }

      await updateTicketStatuses(statuses);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addStatus = () => {
    setStatuses([...statuses, { name: "", display: "", color: "#000000" }]);
  };

  const removeStatus = (index: number) => {
    if (statuses.length <= 1) {
      toast.error('At least one status is required');
      return;
    }
    setStatuses(statuses.filter((_, i) => i !== index));
  };

  const updateStatus = (index: number, field: keyof TicketStatus, value: string) => {
    const newStatuses = [...statuses];
    newStatuses[index] = { ...newStatuses[index], [field]: value };
    setStatuses(newStatuses);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Ticket Statuses</h3>
        <p className="text-sm text-muted-foreground">
          Configure the available statuses for tickets in your workspace.
        </p>
      </div>

      <div className="space-y-4">
        {statuses.map((status, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="grid gap-2">
              <Label>Internal Name</Label>
              <Input
                value={status.name}
                onChange={(e) => updateStatus(index, "name", e.target.value)}
                placeholder="open"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Display Name</Label>
              <Input
                value={status.display}
                onChange={(e) => updateStatus(index, "display", e.target.value)}
                placeholder="Open"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-[100px] h-[40px]"
                    style={{ backgroundColor: status.color }}
                  >
                    {status.color}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <ChromePicker
                    color={status.color}
                    onChange={(color) => updateStatus(index, "color", color.hex)}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Button
              variant="destructive"
              onClick={() => removeStatus(index)}
              className="mt-8"
              disabled={statuses.length <= 1}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Button onClick={addStatus}>Add Status</Button>
        <Button 
          onClick={saveStatuses} 
          variant="default"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
} 