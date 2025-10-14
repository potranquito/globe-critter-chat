import { Minus, MapPin } from 'lucide-react';

interface RegionSpeciesCardProps {
  commonName: string;
  scientificName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  regionName: string;
  regionImageUrl?: string;  // Legacy - for backward compatibility
  speciesImageUrl?: string;  // NEW - species-specific image
  onChatClick?: () => void;
}

const RegionSpeciesCard = ({
  commonName,
  scientificName,
  animalType,
  conservationStatus,
  occurrenceCount,
  regionName,
  regionImageUrl,
  speciesImageUrl,
  onChatClick
}: RegionSpeciesCardProps) => {

  // Use species image first, fallback to region image
  const displayImageUrl = speciesImageUrl || regionImageUrl;

  const getAnimalEmoji = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('mammal')) return '🦁';
    if (lowerType.includes('bird') || lowerType.includes('aves')) return '🐦';
    if (lowerType.includes('fish')) return '🐟';
    if (lowerType.includes('reptil')) return '🦎';
    if (lowerType.includes('amphibian')) return '🐸';
    if (lowerType.includes('insect')) return '🦋';
    if (lowerType.includes('plant')) return '🌿';
    return '🔍';
  };

  const formatAnimalType = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('mammal')) return 'Mammal';
    if (lowerType.includes('bird') || lowerType.includes('aves')) return 'Bird';
    if (lowerType.includes('fish')) return 'Fish';
    if (lowerType.includes('reptil')) return 'Reptile';
    if (lowerType.includes('amphibian')) return 'Amphibian';
    if (lowerType.includes('insect')) return 'Insect';
    if (lowerType.includes('plant')) return 'Plant';
    return type || 'Unknown';
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Animal Image or Placeholder */}
      <div className="w-full">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={commonName}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">{getAnimalEmoji(animalType)}</div>
              <p className="text-sm text-muted-foreground">{commonName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Fast Facts - Match Polar Bear Card exactly */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{commonName}</h3>
        <p className="text-sm text-primary mb-4">{formatAnimalType(animalType)}</p>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Conservation Status</p>
          <p className="text-base font-semibold text-accent">{conservationStatus}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Population</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-primary">
              {occurrenceCount.toLocaleString()} observations
            </p>
            <Minus className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionSpeciesCard;
