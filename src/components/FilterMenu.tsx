import { Button } from "@/components/ui/button";
import { Flame, Mountain, TreePine, Snowflake, Shield, Utensils, Leaf, Newspaper, PawPrint, Bird } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface FilterMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToggleLayer: (layerType: string, data?: any) => void;
}

const FilterMenu = ({ isOpen, onClose, onToggleLayer }: FilterMenuProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const filters = [
    { id: 'fires', label: 'Fires', icon: Flame, color: 'text-orange-500' },
    { id: 'earthquakes', label: 'Earthquakes', icon: Mountain, color: 'text-red-500' },
    { id: 'forest', label: 'Forest Cover', icon: TreePine, color: 'text-green-600' },
    { id: 'ice', label: 'Ice Coverage', icon: Snowflake, color: 'text-blue-400' },
    { id: 'protected', label: 'Protected Areas', icon: Shield, color: 'text-green-500' },
    { id: 'endangered-animals', label: 'Endangered Animals', icon: PawPrint, color: 'text-amber-600', disabled: true },
    { id: 'endangered-birds', label: 'Endangered Birds', icon: Bird, color: 'text-sky-600', disabled: true },
    { id: 'food-pyramid', label: 'Food Pyramid', icon: Utensils, color: 'text-yellow-600', disabled: true },
    { id: 'ecosystems', label: 'Ecosystems', icon: Leaf, color: 'text-emerald-600', disabled: true },
    { id: 'events', label: 'News & Events', icon: Newspaper, color: 'text-purple-600', disabled: true },
  ];

  const fetchLayerData = async (layerId: string) => {
    if (activeLayers.has(layerId)) {
      // Toggle off
      setActiveLayers(prev => {
        const next = new Set(prev);
        next.delete(layerId);
        return next;
      });
      onToggleLayer(layerId, { remove: true });
      return;
    }

    setLoading(layerId);
    
    try {
      // Map filter IDs to edge function layer types
      const layerTypeMap: Record<string, string> = {
        'fires': 'threats',
        'earthquakes': 'threats',
        'forest': 'forest',
        'ice': 'ice',
        'protected': 'protected'
      };

      const layerType = layerTypeMap[layerId];
      
      const { data, error } = await supabase.functions.invoke('google-earth-engine', {
        body: { layerType, region: 'global' },
      });

      if (error) throw error;

      setActiveLayers(prev => new Set(prev).add(layerId));
      onToggleLayer(layerId, data);
      
      toast({
        title: "Layer Added",
        description: `${filters.find(f => f.id === layerId)?.label} layer is now visible`,
      });
    } catch (error: any) {
      console.error(`Error fetching ${layerId}:`, error);
      toast({
        title: "Error",
        description: error.message || 'Failed to load layer',
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 w-64 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Filters</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ✕
        </Button>
      </div>

      <div className="space-y-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeLayers.has(filter.id);
          const isLoading = loading === filter.id;

          return (
            <Button
              key={filter.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => !filter.disabled && fetchLayerData(filter.id)}
              disabled={filter.disabled || isLoading}
              className="w-full justify-start gap-3 text-sm"
            >
              <Icon className={`h-4 w-4 ${filter.color}`} />
              <span className="flex-1 text-left">{filter.label}</span>
              {filter.disabled && <Badge variant="secondary" className="text-[10px]">Soon</Badge>}
              {isLoading && <span className="text-xs">...</span>}
            </Button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
        {activeLayers.size} active filter{activeLayers.size !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default FilterMenu;
