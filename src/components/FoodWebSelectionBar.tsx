import { useRef, useEffect } from 'react';
import { FoodWebMiniCard } from './FoodWebMiniCard';

interface SelectedFoodWebSpecies {
  carnivore: any | null;
  herbivore: any | null;
  omnivore: any | null;
  bird: any | null;
  plantCoral: any | null;
}

interface ChatTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
}

interface FoodWebSelectionBarProps {
  selectedSpecies: SelectedFoodWebSpecies;
  onSpeciesClick?: (species: any, slotType: string) => void;
  isClickable?: boolean; // 🎮 Enable clicking for trivia answers
  correctAnswer?: string; // 🎮 Scientific name of correct species
  wrongAnswer?: string; // 🎮 Scientific name of wrong species (temporary visual feedback)
  theme?: ChatTheme;
}

export const FoodWebSelectionBar = ({ selectedSpecies, onSpeciesClick, isClickable, correctAnswer, wrongAnswer, theme }: FoodWebSelectionBarProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);

  // Default theme if none provided (emerald theme)
  const currentTheme = theme || {
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  };

  // Helper to add alpha to HSL color
  const withAlpha = (hslColor: string, alpha: number) => {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  };

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
    <div
      ref={bannerRef}
      className="rounded-xl p-2 shadow-2xl animate-fade-in"
      style={{
        background: withAlpha(currentTheme.background, 0.6),
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${withAlpha(currentTheme.primary, 0.3)}`,
        boxShadow: `0 8px 32px 0 ${withAlpha(currentTheme.primary, 0.2)}`,
      }}
    >
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
