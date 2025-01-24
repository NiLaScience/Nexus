"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getWorkspaceSettings, updateTicketStatuses, updateTicketFields } from "@/app/actions/workspace-settings";
import type { TicketStatus } from "@/types/workspace-settings";
import type { CustomField } from "@/types/custom-fields";
import { ChromePicker } from "react-color";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function CustomizationTab() {
  const [statuses, setStatuses] = useState<TicketStatus[]>([]);
  const [fields, setFields] = useState<CustomField[]>([]);
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
      if (settings?.ticket_fields) {
        setFields(settings.ticket_fields);
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
      toast.success('Statuses saved successfully');
    } catch (error) {
      console.error('Failed to save statuses:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save statuses');
    } finally {
      setSaving(false);
    }
  };

  const saveFields = async () => {
    if (saving) return;
    
    try {
      setSaving(true);
      
      // Validate fields before saving
      if (!fields.every(f => f.name && f.display && f.type)) {
        throw new Error('All field properties must be filled out');
      }

      // Validate select fields have options
      const selectFieldsWithoutOptions = fields.filter(f => 
        f.type === 'select' && (!f.options || !f.options.length)
      );
      if (selectFieldsWithoutOptions.length) {
        throw new Error('Select fields must have at least one option');
      }

      await updateTicketFields(fields);
      toast.success('Custom fields saved successfully');
    } catch (error) {
      console.error('Failed to save fields:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save fields');
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

  const addField = () => {
    setFields([...fields, { name: "", display: "", type: "text", required: false }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, field: keyof CustomField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [field]: value };
    
    // Reset options when changing type from select
    if (field === 'type' && value !== 'select') {
      delete newFields[index].options;
    }
    // Initialize options array when changing type to select
    if (field === 'type' && value === 'select' && !newFields[index].options) {
      newFields[index].options = [];
    }
    
    setFields(newFields);
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.type === 'select') {
      field.options = [...(field.options || []), ''];
      setFields(newFields);
    }
  };

  const updateOption = (fieldIndex: number, optionIndex: number, value: string) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.type === 'select' && field.options) {
      field.options[optionIndex] = value;
      setFields(newFields);
    }
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    const field = newFields[fieldIndex];
    if (field.type === 'select' && field.options) {
      field.options = field.options.filter((_, i) => i !== optionIndex);
      setFields(newFields);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Ticket Statuses Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Ticket Statuses</h3>
          <p className="text-sm text-muted-foreground">
            Configure the available statuses for tickets in your workspace.
          </p>
        </div>

        <div className="space-y-4">
          {statuses.map((status, index) => (
            <div key={index} className="flex items-start gap-4">
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
                      className="w-[100px] h-10"
                      style={{ backgroundColor: status.color + "10" }}
                    >
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: status.color }}
                      />
                      <span style={{ color: status.color }}>
                        {status.color}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <ChromePicker
                      color={status.color}
                      onChange={(color) => updateStatus(index, "color", color.hex)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="mt-8"
                onClick={() => removeStatus(index)}
              >
                ✕
              </Button>
            </div>
          ))}

          <Button onClick={addStatus} variant="outline">
            Add Status
          </Button>

          <div className="flex justify-end">
            <Button onClick={saveStatuses} disabled={saving}>
              {saving ? "Saving..." : "Save Statuses"}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Custom Fields Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Configure custom fields for tickets in your workspace.
          </p>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="space-y-4 border rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="grid gap-2">
                  <Label>Internal Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(index, "name", e.target.value)}
                    placeholder="customer_id"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Display Name</Label>
                  <Input
                    value={field.display}
                    onChange={(e) => updateField(index, "display", e.target.value)}
                    placeholder="Customer ID"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(index, "type", value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="select">Select</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Required</Label>
                  <Switch
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(index, "required", checked)}
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="mt-8"
                  onClick={() => removeField(index)}
                >
                  ✕
                </Button>
              </div>

              {field.type === 'select' && (
                <div className="pl-4 border-l-2 space-y-2">
                  <Label>Options</Label>
                  {field.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                        placeholder="Option value"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index, optionIndex)}
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(index)}
                  >
                    Add Option
                  </Button>
                </div>
              )}
            </div>
          ))}

          <Button onClick={addField} variant="outline">
            Add Field
          </Button>

          <div className="flex justify-end">
            <Button onClick={saveFields} disabled={saving}>
              {saving ? "Saving..." : "Save Fields"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 