import { Button } from "@/components/ui/button";
import { Layers, Snowflake, TreePine, Shield } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConservationLayersProps {
  onToggleLayer: (layerType: string, data?: any) => void;
}

const ConservationLayers = ({ onToggleLayer }: ConservationLayersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchLayerData = async (layerType: string) => {
    if (activeLayers.has(layerType)) {
      // Toggle off
      setActiveLayers(prev => {
        const next = new Set(prev);
        next.delete(layerType);
        return next;
      });
      onToggleLayer(layerType, null);
      return;
    }

    setLoading(layerType);
    try {
      const { data, error } = await supabase.functions.invoke('google-earth-engine', {
        body: { layerType, region: 'global' },
      });

      if (error) throw error;

      toast({
        title: "Layer loaded",
        description: `${data.description} loaded successfully`,
      });

      setActiveLayers(prev => new Set(prev).add(layerType));
      onToggleLayer(layerType, data);
    } catch (error: any) {
      console.error('Error fetching layer:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to load conservation layer',
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 pointer-events-none">
      <div className="glass-panel rounded-lg p-3 pointer-events-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm font-medium">Conservation Data</span>
          </div>
          <span className="text-xs">{expanded ? '−' : '+'}</span>
        </Button>

        {expanded && (
          <div className="mt-3 space-y-2 border-t border-border/50 pt-3">
            <Button
              variant={activeLayers.has('forest') ? "default" : "ghost"}
              size="sm"
              onClick={() => fetchLayerData('forest')}
              disabled={loading === 'forest'}
              className="w-full justify-start gap-2 text-sm"
            >
              <TreePine className="h-4 w-4" />
              {loading === 'forest' ? 'Loading...' : 'Forest Cover'}
            </Button>

            <Button
              variant={activeLayers.has('ice') ? "default" : "ghost"}
              size="sm"
              onClick={() => fetchLayerData('ice')}
              disabled={loading === 'ice'}
              className="w-full justify-start gap-2 text-sm"
            >
              <Snowflake className="h-4 w-4" />
              {loading === 'ice' ? 'Loading...' : 'Ice Coverage'}
            </Button>

            <Button
              variant={activeLayers.has('protected') ? "default" : "ghost"}
              size="sm"
              onClick={() => fetchLayerData('protected')}
              disabled={loading === 'protected'}
              className="w-full justify-start gap-2 text-sm"
            >
              <Shield className="h-4 w-4" />
              {loading === 'protected' ? 'Loading...' : 'Protected Areas'}
            </Button>
          </div>
        )}
      </div>

      {expanded && (
        <div className="glass-panel rounded-lg px-3 py-2 text-xs pointer-events-none">
          <div className="text-muted-foreground">Data Sources</div>
          <div className="font-medium mt-1">Google Earth Engine</div>
        </div>
      )}
    </div>
  );
};

export default ConservationLayers;
