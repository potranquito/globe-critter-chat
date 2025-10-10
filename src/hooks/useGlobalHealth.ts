/**
 * useGlobalHealth Hook
 * Fetches and subscribes to global health meter updates
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GlobalHealth {
  current_health: number;
  total_lessons_completed: number;
  total_users: number;
  updated_at: string;
}

export function useGlobalHealth() {
  const [health, setHealth] = useState<GlobalHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Fetch initial global health data
    const fetchGlobalHealth = async () => {
      try {
        const { data, error } = await supabase
          .from('global_health')
          .select('*')
          .eq('id', 1)
          .single();

        if (error) {
          console.error('Error fetching global health:', error);
          return;
        }

        if (mounted && data) {
          setHealth(data);
        }
      } catch (error) {
        console.error('Error in fetchGlobalHealth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGlobalHealth();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('global_health_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_health',
        },
        (payload) => {
          console.log('Global health updated:', payload);
          if (mounted && payload.new) {
            setHealth(payload.new as GlobalHealth);
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { health, loading };
}
