import { Minus, MapPin } from 'lucide-react';
import { classifySpecies } from '@/utils/speciesClassification';
import { BirdCallPlayer } from './BirdCallPlayer';
import { Button } from '@/components/ui/button';

interface RegionSpeciesCardProps {
  commonName: string;
  scientificName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  regionName: string;
  regionImageUrl?: string;  // Legacy - for backward compatibility
  speciesImageUrl?: string;  // NEW - species-specific image
  description?: string; // Optional for better trophic role classification
  habitatType?: string; // Optional for better trophic role classification
  dietaryCategory?: string; // NEW - for food web game
  onChatClick?: () => void;
  // 🎮 NEW: Food web game props
  onSelectForGame?: (species: any) => void;
  isSelectedForGame?: boolean;
  // 🎮 NEW: Reveal mechanic props
  isGameMode?: boolean;
  hideFacts?: boolean; // Hide name/facts until revealed
  onRevealClick?: () => void;
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
  description,
  habitatType,
  dietaryCategory,
  onChatClick,
  onSelectForGame,
  isSelectedForGame,
  isGameMode = false,
  hideFacts = false,
  onRevealClick
}: RegionSpeciesCardProps) => {

  // Use species image first, fallback to region image
  const displayImageUrl = speciesImageUrl || regionImageUrl;

  // Use backend classification if available, otherwise classify on frontend
  const classification = classifySpecies({
    commonName,
    scientificName,
    animalType,
    class: animalType,
    description,
    habitatType
  });

  // Override with backend data if available (will be populated after migration)
  const finalClassification = {
    speciesType: classification.speciesType, // Use classified type, not raw animalType
    uiGroup: classification.uiGroup,
    trophicRole: classification.trophicRole,
    trophicRoleEmoji: classification.trophicRoleEmoji,
    trophicRoleLabel: classification.trophicRoleLabel
  };

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

  const formatConservationStatus = (status: string) => {
    const statusUpper = status?.toUpperCase() || '';
    switch (statusUpper) {
      case 'CR': return 'Critically Endangered';
      case 'EN': return 'Endangered';
      case 'VU': return 'Vulnerable';
      case 'NT': return 'Near Threatened';
      case 'LC': return 'Least Concern';
      case 'DD': return 'Data Deficient';
      case 'NE': return 'Not Evaluated';
      default: return status;
    }
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
        {/* Show facts only if not hidden (or if revealed in game mode) */}
        {!hideFacts ? (
          <>
            <h3 className="text-xl font-bold text-foreground mb-1">{commonName}</h3>
            <p className="text-sm text-primary mb-4">{finalClassification.speciesType}</p>

            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Conservation Status</p>
              <p className="text-base font-semibold text-accent">{formatConservationStatus(conservationStatus)}</p>
            </div>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground">Ecological Role</p>
              <div className="flex items-center gap-2">
                <span className="text-xl">{finalClassification.trophicRoleEmoji}</span>
                <p className="text-base font-semibold text-primary">
                  {finalClassification.trophicRoleLabel}
                </p>
                {/* Bird call player - only for birds */}
                {finalClassification.speciesType === 'Bird' && (
                  <BirdCallPlayer
                    scientificName={scientificName}
                    commonName={commonName}
                    size="sm"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          // Facts hidden - show placeholder
          <div className="text-center py-8">
            <p className="text-2xl mb-2">❓</p>
            <p className="text-sm text-muted-foreground">Click "Reveal Species" to find out!</p>
          </div>
        )}

        {/* 🎮 Reveal Species Button (Game Mode) */}
        {isGameMode && hideFacts && onRevealClick && (
          <Button
            onClick={onRevealClick}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 transition-all"
          >
            🔍 Reveal Species
          </Button>
        )}

        {/* 🎮 Select Species Button for Food Web Game (Legacy - Non-Game Mode) */}
        {!isGameMode && onSelectForGame && (
          <Button
            onClick={() => onSelectForGame({
              commonName,
              scientificName,
              animalType,
              conservationStatus,
              occurrenceCount,
              imageUrl: speciesImageUrl || regionImageUrl,
              dietaryCategory
            })}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 transition-all"
          >
            {isSelectedForGame ? '✓ Selected' : 'Select Species'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default RegionSpeciesCard;
