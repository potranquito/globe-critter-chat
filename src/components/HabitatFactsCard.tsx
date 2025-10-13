import type { HabitatRegion } from "@/types/habitat";

// Updated to match FastFactsCard design pattern
interface HabitatFactsCardProps {
  habitat: HabitatRegion;
  imageUrl?: string;
  onChatClick?: () => void;
}

export const HabitatFactsCard = ({ habitat, imageUrl, onChatClick }: HabitatFactsCardProps) => {
  // Count threats by severity
  const criticalThreats = habitat.threats?.filter(t => t.impact === 'critical').length || 0;
  const highThreats = habitat.threats?.filter(t => t.impact === 'high').length || 0;
  const totalThreats = habitat.threats?.length || 0;

  const getThreatLevel = () => {
    if (criticalThreats > 0) return 'Critical Risk';
    if (highThreats > 0) return 'High Risk';
    if (totalThreats > 0) return 'Moderate Risk';
    return 'Low Risk';
  };

  // Count endangered species (CR, EN, VU)
  const endangeredCount = habitat.keySpecies?.filter(s =>
    ['CR', 'EN', 'VU'].includes(s.conservationStatus?.toUpperCase())
  ).length || 0;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Habitat Image */}
      <div className="w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={habitat.name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🌲</div>
              <p className="text-sm text-muted-foreground">{habitat.name}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fast Facts */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{habitat.name}</h3>
        <p className="text-sm text-primary mb-4">{habitat.climate}</p>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Area Size</p>
          <p className="text-base font-semibold text-primary">{habitat.area.toLocaleString()} km²</p>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Endangered Animals</p>
          <p className="text-base font-semibold text-accent">{endangeredCount}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Threat Level</p>
          <p className="text-base font-semibold text-accent">{getThreatLevel()}</p>
        </div>
      </div>
    </div>
  );
};
