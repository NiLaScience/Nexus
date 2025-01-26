import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload, REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js';

type SubscriptionConfig = {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
};

type SubscriptionHandler<T extends { [key: string]: any }> = (
  payload: RealtimePostgresChangesPayload<T>
) => void | Promise<void>;

export function useRealtimeSubscription<T extends { [key: string]: any }>(
  channelName: string,
  configs: SubscriptionConfig[],
  onSubscriptionChange?: SubscriptionHandler<T>,
  enabled: boolean = true
) {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [status, setStatus] = useState<REALTIME_SUBSCRIBE_STATES | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!enabled) return;

    let reloadTimeout: NodeJS.Timeout;
    let newChannel = supabase.channel(channelName);

    // Add all subscription configs
    configs.forEach(config => {
      newChannel = newChannel.on(
        'postgres_changes' as any, // Type assertion needed due to Supabase types
        {
          event: config.event || '*',
          schema: config.schema || 'public',
          table: config.table,
          filter: config.filter,
        },
        async (payload: RealtimePostgresChangesPayload<T>) => {
          // Clear any existing timeout if we're debouncing
          if (reloadTimeout) clearTimeout(reloadTimeout);

          if (onSubscriptionChange) {
            // If the handler is async, await it
            await onSubscriptionChange(payload);
          }
        }
      );
    });

    // Add subscription handling
    newChannel.subscribe((status: REALTIME_SUBSCRIBE_STATES, err?: Error) => {
      setStatus(status);
      if (status === 'CHANNEL_ERROR') {
        console.error('Channel error:', err);
        // Attempt to resubscribe after a delay
        setTimeout(() => {
          console.log(`Attempting to resubscribe to ${channelName}...`);
          newChannel.subscribe();
        }, 5000);
      }
    });

    setChannel(newChannel);

    // Cleanup subscription
    return () => {
      if (reloadTimeout) clearTimeout(reloadTimeout);
      if (newChannel) supabase.removeChannel(newChannel);
    };
  }, [channelName, enabled, supabase, configs, onSubscriptionChange]);

  return { status };
} 