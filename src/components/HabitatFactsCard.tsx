import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Thermometer, Mountain, Shield, AlertTriangle, TrendingDown, TrendingUp, Minus } from "lucide-react";
import type { HabitatRegion } from "@/types/habitat";

interface HabitatFactsCardProps {
  habitat: HabitatRegion;
  imageUrl?: string;
  onChatClick?: () => void;
}

export const HabitatFactsCard = ({ habitat, imageUrl, onChatClick }: HabitatFactsCardProps) => {
  // Determine area size category
  const getAreaSize = (area: number) => {
    if (area > 100000) return { label: 'Very Large', color: 'text-blue-600' };
    if (area > 50000) return { label: 'Large', color: 'text-green-600' };
    if (area > 10000) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Small', color: 'text-orange-600' };
  };

  const areaSize = getAreaSize(habitat.area);

  // Count threats by severity
  const criticalThreats = habitat.threats?.filter(t => t.impact === 'critical').length || 0;
  const highThreats = habitat.threats?.filter(t => t.impact === 'high').length || 0;
  const totalThreats = habitat.threats?.length || 0;

  return (
    <Card className="glass-card animate-slide-in-left shadow-2xl overflow-hidden max-h-[calc(100vh-200px)]">
      <div className="overflow-y-auto h-full">
      {/* Habitat Image */}
      {imageUrl && (
        <div className="relative h-40 overflow-hidden">
          <img 
            src={imageUrl} 
            alt={habitat.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-2xl">{habitat.name}</CardTitle>
        <CardDescription className="flex items-center gap-2 text-base">
          <Thermometer className="w-4 h-4" />
          {habitat.climate}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Area */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Mountain className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Area</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{habitat.area.toLocaleString()} km²</div>
            <div className={`text-xs ${areaSize.color}`}>{areaSize.label}</div>
          </div>
        </div>

        {/* Protected Areas */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Protected Areas</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{habitat.protectedAreas?.length || 0}</div>
            {habitat.parkCount > 0 && (
              <div className="text-xs text-muted-foreground">{habitat.parkCount} parks</div>
            )}
          </div>
        </div>

        {/* Threats */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium">Active Threats</span>
          </div>
          <div className="text-right">
            <div className="font-semibold">{totalThreats}</div>
            {(criticalThreats > 0 || highThreats > 0) && (
              <div className="text-xs text-red-600">
                {criticalThreats > 0 && `${criticalThreats} critical`}
                {criticalThreats > 0 && highThreats > 0 && ', '}
                {highThreats > 0 && `${highThreats} high`}
              </div>
            )}
          </div>
        </div>

        {/* Key Characteristics */}
        {habitat.characteristics && habitat.characteristics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Characteristics</h4>
            <div className="flex flex-wrap gap-2">
              {habitat.characteristics.slice(0, 4).map((char, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {char}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Key Species */}
        {habitat.keySpecies && habitat.keySpecies.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Key Species</h4>
            <div className="space-y-1">
              {habitat.keySpecies.slice(0, 3).map((species) => (
                <div key={species.id} className="flex items-center justify-between text-xs">
                  <span>{species.name}</span>
                  <Badge 
                    variant={
                      species.conservationStatus === 'CR' ? 'destructive' :
                      species.conservationStatus === 'EN' ? 'default' :
                      'secondary'
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {species.conservationStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Button */}
        {onChatClick && (
          <Button 
            onClick={onChatClick}
            className="w-full mt-4"
            variant="default"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Ask about this habitat
          </Button>
        )}
      </CardContent>
      </div>
    </Card>
  );
};
