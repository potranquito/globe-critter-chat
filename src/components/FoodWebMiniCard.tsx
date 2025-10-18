import { Card } from '@/components/ui/card';

interface FoodWebMiniCardProps {
  species: {
    scientificName: string;
    commonName: string;
    imageUrl?: string;
    animalType: string;
    dietaryCategory?: string;
  };
  slotType: 'carnivore' | 'herbivore' | 'omnivore' | 'bird' | 'plantCoral';
  onClick?: () => void;
  isCorrect?: boolean; // 🎮 Show green glow for correct answer
  isWrong?: boolean; // 🎮 Show red shake for wrong answer
  isClickable?: boolean; // 🎮 Enable click interaction for trivia
}

export const FoodWebMiniCard = ({ species, slotType, onClick, isCorrect, isWrong, isClickable }: FoodWebMiniCardProps) => {
  // Get emoji based on slot type
  const getDietaryEmoji = () => {
    if (slotType === 'carnivore') return '🥩';
    if (slotType === 'herbivore') return '🌱';
    if (slotType === 'omnivore') return '🍽️';
    if (slotType === 'bird') return '🦅';
    if (slotType === 'plantCoral') return '☀️';
    return '🌱'; // Default
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

  // Build dynamic className based on state
  const cardClassName = `relative overflow-hidden transition-all duration-300 animate-fade-in ${
    isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-xl' : ''
  } ${
    isCorrect ? 'ring-4 ring-green-500 shadow-green-500/50 scale-105' : ''
  } ${
    isWrong ? 'ring-4 ring-red-500 shadow-red-500/50 animate-shake' : ''
  }`;

  return (
    <Card
      className={cardClassName}
      style={{ width: '140px' }}
      onClick={isClickable ? onClick : undefined}
    >
      {/* Species Image */}
      {species.imageUrl ? (
        <img
          src={species.imageUrl}
          alt={species.commonName}
          className="w-full h-24 object-cover"
          onError={(e) => {
            // Fallback to emoji placeholder
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}

      {/* Fallback Emoji Display */}
      <div className={`w-full h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ${species.imageUrl ? 'hidden' : ''}`}>
        <span className="text-5xl">{getAnimalEmoji(species.animalType)}</span>
      </div>
    </Card>
  );
};
