import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsageStats {
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
  warningThreshold: number;
}

interface GoogleMapsApiState {
  apiKey: string | null;
  loading: boolean;
  usage: UsageStats | null;
  error: string | null;
}

export const useGoogleMapsApi = () => {
  const [state, setState] = useState<GoogleMapsApiState>({
    apiKey: null,
    loading: true,
    usage: null,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
          body: { type: 'init' },
        });

        if (error) throw error;

        if (data.usage && data.usage.daily >= data.usage.warningThreshold) {
          toast({
            title: "⚠️ High API Usage",
            description: `You've used ${data.usage.daily}/${data.usage.dailyLimit} daily requests`,
            variant: "default",
          });
        }

        setState({
          apiKey: data.apiKey,
          loading: false,
          usage: data.usage,
          error: null,
        });

      } catch (err: any) {
        console.error('Failed to fetch Google Maps API key:', err);
        setState({
          apiKey: null,
          loading: false,
          usage: null,
          error: err.message || 'Failed to initialize Google Maps',
        });
        
        toast({
          title: "Error",
          description: err.message || 'Failed to initialize Google Maps',
          variant: "destructive",
        });
      }
    };

    fetchApiKey();
  }, [toast]);

  return state;
};
