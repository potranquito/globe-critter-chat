import { Button } from "@/components/ui/button";
import { Layers, Snowflake, TreePine, Waves, Shield } from "lucide-react";
import { useState } from "react";

interface ConservationLayersProps {
  onToggleLayer: (layer: string, enabled: boolean) => void;
}

const ConservationLayers = ({ onToggleLayer }: ConservationLayersProps) => {
  const [expanded, setExpanded] = useState(false);
  const [layers, setLayers] = useState({
    arcticIce: false,
    deforestation: false,
    oceanHealth: false,
    protectedAreas: false,
  });

  const toggleLayer = (layerName: keyof typeof layers) => {
    const newState = !layers[layerName];
    setLayers(prev => ({ ...prev, [layerName]: newState }));
    onToggleLayer(layerName, newState);
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
              variant={layers.arcticIce ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleLayer('arcticIce')}
              className="w-full justify-start gap-2 text-sm"
            >
              <Snowflake className="h-4 w-4" />
              Arctic Ice Loss
            </Button>

            <Button
              variant={layers.deforestation ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleLayer('deforestation')}
              className="w-full justify-start gap-2 text-sm"
            >
              <TreePine className="h-4 w-4" />
              Deforestation
            </Button>

            <Button
              variant={layers.oceanHealth ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleLayer('oceanHealth')}
              className="w-full justify-start gap-2 text-sm"
            >
              <Waves className="h-4 w-4" />
              Ocean Health
            </Button>

            <Button
              variant={layers.protectedAreas ? "default" : "ghost"}
              size="sm"
              onClick={() => toggleLayer('protectedAreas')}
              className="w-full justify-start gap-2 text-sm"
            >
              <Shield className="h-4 w-4" />
              Protected Areas
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
