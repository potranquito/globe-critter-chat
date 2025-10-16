import { Card } from '@/components/ui/card';

interface FoodWebMiniCardProps {
  species: {
    scientificName: string;
    commonName: string;
    imageUrl?: string;
    animalType: string;
    dietaryCategory?: string;
  };
  slotType: 'carnivore' | 'herbivoreOmnivore' | 'producer';
  onClick?: () => void;
}

export const FoodWebMiniCard = ({ species, slotType, onClick }: FoodWebMiniCardProps) => {
  // Get emoji based on dietary category
  const getDietaryEmoji = () => {
    if (slotType === 'carnivore') return '🥩';
    if (slotType === 'producer') return '☀️';
    // herbivoreOmnivore
    const category = species.dietaryCategory?.toLowerCase();
    if (category === 'herbivore') return '🌱';
    if (category === 'omnivore') return '🍽️';
    return '🌱'; // Default for herbivore/omnivore slot
  };

  // Get fallback emoji based on animal type
  const getAnimalEmoji = (type: string) => {
    const normalized = type?.toLowerCase() || '';
    if (normalized.includes('mammal')) return '🦁';
    if (normalized.includes('aves') || normalized.includes('bird')) return '🐦';
    if (normalized.includes('fish')) return '🐟';
    if (normalized.includes('reptil')) return '🦎';
    if (normalized.includes('amphib')) return '🐸';
    if (normalized.includes('insect')) return '🦋';
    if (normalized.includes('plant') || normalized.includes('coral')) return '🌿';
    return '🔍';
  };

  return (
    <Card
      className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer animate-fade-in"
      style={{ width: '200px' }}
      onClick={onClick}
    >
      {/* Dietary Category Badge */}
      <div className="absolute top-2 right-2 z-10 bg-background/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
        <span className="text-2xl">{getDietaryEmoji()}</span>
      </div>

      {/* Species Image */}
      {species.imageUrl ? (
        <img
          src={species.imageUrl}
          alt={species.commonName}
          className="w-full h-48 object-cover"
          onError={(e) => {
            // Fallback to emoji placeholder
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}

      {/* Fallback Emoji Display */}
      <div className={`w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${species.imageUrl ? 'hidden' : ''}`}>
        <span className="text-8xl">{getAnimalEmoji(species.animalType)}</span>
      </div>

      {/* Species Name */}
      <div className="p-3 bg-background/95 backdrop-blur-sm">
        <p className="text-sm font-bold text-center text-foreground truncate" title={species.commonName}>
          {species.commonName}
        </p>
        <p className="text-xs text-center text-muted-foreground truncate" title={species.scientificName}>
          {species.scientificName}
        </p>
      </div>
    </Card>
  );
};
