'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { getWorkspaceSettings } from "@/app/actions/workspace-settings";
import type { CustomField } from "@/types/custom-fields";
import { Separator } from "@/components/ui/separator";

interface UserProfile {
  id: string;
  full_name: string | null;
  role: string;
}

interface Team {
  id: string;
  name: string;
}

interface TicketDetailsProps {
  ticketId: string;
  requester?: UserProfile | null;
  assignedTo?: UserProfile | null;
  team?: Team | null;
  customFields?: Record<string, any>;
}

export function TicketDetails({ ticketId, requester, assignedTo, team, customFields = {} }: TicketDetailsProps) {
  const [fieldConfigs, setFieldConfigs] = useState<CustomField[]>([]);

  useEffect(() => {
    async function loadWorkspaceSettings() {
      const settings = await getWorkspaceSettings();
      if (settings?.ticket_fields) {
        setFieldConfigs(settings.ticket_fields);
      }
    }
    loadWorkspaceSettings();
  }, []);

  const getFieldDisplay = (fieldName: string) => {
    const field = fieldConfigs.find(f => f.name === fieldName);
    return field?.display || fieldName;
  };

  const formatFieldValue = (value: any, fieldName: string) => {
    if (value === null || value === undefined) return '—';
    
    const field = fieldConfigs.find(f => f.name === fieldName);
    if (!field) return value.toString();

    switch (field.type) {
      case 'date':
        return format(new Date(value), 'PPP');
      case 'select':
      case 'text':
      case 'number':
      default:
        return value.toString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="text-sm font-medium text-muted-foreground">Ticket ID</div>
          <div>#{String(ticketId).padStart(5, '0')}</div>
        </div>
        
        <div>
          <div className="text-sm font-medium text-muted-foreground">Requester</div>
          {requester ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {requester.full_name?.[0] ?? '?'}
              </div>
              <div>
                <div>{requester.full_name || 'Anonymous'}</div>
                <div className="text-xs text-muted-foreground">{requester.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Unknown requester</div>
          )}
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
          {assignedTo ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {assignedTo.full_name?.[0] ?? '?'}
              </div>
              <div>
                <div>{assignedTo.full_name || 'Anonymous'}</div>
                <div className="text-xs text-muted-foreground">{assignedTo.role}</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Not assigned</div>
          )}
        </div>

        <div>
          <div className="text-sm font-medium text-muted-foreground">Assigned Team</div>
          {team ? (
            <div className="mt-1">
              <div>{team.name}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">No team assigned</div>
          )}
        </div>

        {Object.keys(customFields).length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="font-semibold mb-4">Custom Fields</h3>
              <div className="space-y-3">
                {Object.entries(customFields).map(([key, value]) => (
                  <div key={key} className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-muted-foreground">{getFieldDisplay(key)}</div>
                    <div className="mt-1">{formatFieldValue(value, key)}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 