interface EcoRegionCardProps {
  regionName: string;
  description?: string;
  speciesCount: number;
  locationCount: number;
  imageUrl?: string;
}

export const EcoRegionCard = ({
  regionName,
  description,
  speciesCount,
  locationCount,
  imageUrl
}: EcoRegionCardProps) => {
  // Map region names to appropriate emojis
  const getRegionEmoji = (name: string) => {
    if (name.toLowerCase().includes('arctic')) return '❄️';
    if (name.toLowerCase().includes('amazon') || name.toLowerCase().includes('rainforest')) return '🌳';
    if (name.toLowerCase().includes('desert')) return '🏜️';
    if (name.toLowerCase().includes('reef') || name.toLowerCase().includes('ocean')) return '🌊';
    if (name.toLowerCase().includes('savanna') || name.toLowerCase().includes('grassland')) return '🦁';
    return '🌍';
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Region Image or Placeholder */}
      <div className="w-full">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={regionName}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-2">{getRegionEmoji(regionName)}</div>
              <p className="text-lg font-semibold text-foreground">{regionName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Region Info */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{regionName}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Species Discovered</p>
          <p className="text-base font-semibold text-primary">
            {speciesCount > 0 ? `${speciesCount} species` : 'Loading species...'}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Protected Locations</p>
          <p className="text-base font-semibold text-accent">
            {locationCount > 0 ? `${locationCount} parks & refuges` : 'Loading locations...'}
          </p>
        </div>
      </div>
    </div>
  );
};
