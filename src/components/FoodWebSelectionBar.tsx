import { useRef, useEffect } from 'react';
import { FoodWebMiniCard } from './FoodWebMiniCard';

interface SelectedFoodWebSpecies {
  carnivore: any | null;
  herbivore: any | null;
  omnivore: any | null;
  bird: any | null;
  plantCoral: any | null;
}

interface FoodWebSelectionBarProps {
  selectedSpecies: SelectedFoodWebSpecies;
  onSpeciesClick?: (species: any, slotType: string) => void;
  isClickable?: boolean; // 🎮 Enable clicking for trivia answers
  correctAnswer?: string; // 🎮 Scientific name of correct species
  wrongAnswer?: string; // 🎮 Scientific name of wrong species (temporary visual feedback)
}

export const FoodWebSelectionBar = ({ selectedSpecies, onSpeciesClick, isClickable, correctAnswer, wrongAnswer }: FoodWebSelectionBarProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);

  // Filter out null values and create array of selected species with their slot types
  const speciesArray = [
    { species: selectedSpecies.carnivore, slot: 'carnivore' as const },
    { species: selectedSpecies.herbivore, slot: 'herbivore' as const },
    { species: selectedSpecies.omnivore, slot: 'omnivore' as const },
    { species: selectedSpecies.bird, slot: 'bird' as const },
    { species: selectedSpecies.plantCoral, slot: 'plantCoral' as const },
  ].filter(item => item.species !== null);

  // Log when banner appears/disappears and its dimensions
  useEffect(() => {
    if (speciesArray.length > 0 && bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      console.log('🎮 FoodWebSelectionBar MOUNTED:', {
        speciesCount: speciesArray.length,
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      });

      // Log again after a short delay to capture post-animation dimensions
      setTimeout(() => {
        if (bannerRef.current) {
          const updatedRect = bannerRef.current.getBoundingClientRect();
          console.log('🎮 FoodWebSelectionBar DIMENSIONS (after animation):', {
            height: updatedRect.height,
            top: updatedRect.top,
            bottom: updatedRect.bottom,
          });
        }
      }, 500);

      return () => {
        console.log('🎮 FoodWebSelectionBar UNMOUNTED');
      };
    }
  }, [speciesArray.length]);

  // Don't render if no species selected
  if (speciesArray.length === 0) {
    // Component not rendering - no species selected (normal during streaming)
    return null;
  }

  return (
    <div ref={bannerRef} className="glass-panel rounded-xl p-2 shadow-2xl animate-fade-in">
      <div className="flex items-center justify-center gap-2">
        {speciesArray.map(({ species, slot }) => species && (
          <FoodWebMiniCard
            key={`${slot}-${species.scientificName}`}
            species={species}
            slotType={slot}
            onClick={() => onSpeciesClick?.(species, slot)}
            isClickable={isClickable}
            isCorrect={correctAnswer === species.scientificName}
            isWrong={wrongAnswer === species.scientificName}
          />
        ))}
      </div>
    </div>
  );
};
