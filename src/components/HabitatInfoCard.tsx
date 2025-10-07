import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, Thermometer, Mountain, Shield, AlertTriangle } from "lucide-react";
import type { HabitatRegion } from "@/types/habitat";

interface HabitatInfoCardProps {
  habitat: HabitatRegion;
  onThreatClick?: (threatId: string) => void;
  onClose?: () => void;
}

export const HabitatInfoCard = ({ habitat, onThreatClick, onClose }: HabitatInfoCardProps) => {
  const threatColors = {
    critical: 'bg-red-500 hover:bg-red-600',
    high: 'bg-orange-500 hover:bg-orange-600',
    medium: 'bg-yellow-500 hover:bg-yellow-600',
    low: 'bg-blue-500 hover:bg-blue-600'
  };

  const threatIcons = {
    fire: '🔥',
    drought: '💧',
    development: '🏗️',
    pollution: '☠️',
    flood: '🌊',
    earthquake: '🌍'
  };

  return (
    <Card className="w-full h-full overflow-auto">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl">{habitat.name}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2">
              <Thermometer className="w-4 h-4" />
              {habitat.climate}
            </CardDescription>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Area</div>
            <div className="font-semibold">{habitat.area.toLocaleString()} km²</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Protected Areas</div>
            <div className="font-semibold flex items-center gap-1">
              <Shield className="w-4 h-4" />
              {habitat.protectedAreas.length}
            </div>
          </div>
        </div>

        {/* Characteristics */}
        <div>
          <h3 className="font-semibold mb-2">Characteristics</h3>
          <div className="flex flex-wrap gap-2">
            {habitat.characteristics.map((char, idx) => (
              <Badge key={idx} variant="secondary">
                {char}
              </Badge>
            ))}
          </div>
        </div>

        {/* Protected Areas Accordion */}
        {habitat.protectedAreas.length > 0 && (
          <Accordion type="single" collapsible>
            <AccordionItem value="protected-areas">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Protected Areas ({habitat.protectedAreas.length})
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {habitat.protectedAreas.slice(0, 5).map((area) => (
                    <div key={area.id} className="border-l-2 border-green-500 pl-3">
                      <div className="font-medium">{area.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {area.type} • {area.area.toLocaleString()} km²
                      </div>
                      {area.iucnCategory && (
                        <Badge variant="outline" className="mt-1">
                          {area.iucnCategory}
                        </Badge>
                      )}
                    </div>
                  ))}
                  {habitat.protectedAreas.length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      + {habitat.protectedAreas.length - 5} more areas
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Key Species */}
        {habitat.keySpecies.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Key Species</h3>
            <div className="space-y-2">
              {habitat.keySpecies.slice(0, 5).map((species) => (
                <div key={species.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{species.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {species.scientificName}
                    </div>
                  </div>
                  <Badge variant={
                    species.conservationStatus === 'CR' ? 'destructive' :
                    species.conservationStatus === 'EN' ? 'default' :
                    'secondary'
                  }>
                    {species.conservationStatus}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Threats Grid */}
        {habitat.threats.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Active Threats ({habitat.threats.length})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {habitat.threats.map((threat) => (
                <button
                  key={threat.id}
                  onClick={() => onThreatClick?.(threat.id)}
                  className={`relative overflow-hidden rounded-lg p-4 text-left transition-all hover:scale-105 ${threatColors[threat.impact]}`}
                >
                  <div className="absolute top-2 right-2 text-2xl">
                    {threatIcons[threat.type]}
                  </div>
                  <div className="text-white font-medium mb-1">
                    {threat.title}
                  </div>
                  <div className="text-white/80 text-sm">
                    {threat.location.name}
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {threat.status}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
