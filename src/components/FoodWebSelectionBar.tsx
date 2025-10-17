import { useRef, useEffect } from 'react';
import { FoodWebMiniCard } from './FoodWebMiniCard';

interface SelectedFoodWebSpecies {
  carnivore: any | null;
  herbivoreOmnivore: any | null;
  producer: any | null;
}

interface FoodWebSelectionBarProps {
  selectedSpecies: SelectedFoodWebSpecies;
  onSpeciesClick?: (species: any, slotType: string) => void;
}

export const FoodWebSelectionBar = ({ selectedSpecies, onSpeciesClick }: FoodWebSelectionBarProps) => {
  const bannerRef = useRef<HTMLDivElement>(null);

  // Filter out null values and create array of selected species with their slot types
  const speciesArray = [
    { species: selectedSpecies.carnivore, slot: 'carnivore' as const },
    { species: selectedSpecies.herbivoreOmnivore, slot: 'herbivoreOmnivore' as const },
    { species: selectedSpecies.producer, slot: 'producer' as const },
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
      <div className="flex flex-col gap-1.5">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-xs font-bold text-foreground">
            🎮 Selected Species for Trivia
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {speciesArray.length} of 3 selected
          </p>
        </div>

        {/* Species Cards */}
        <div className="flex items-center justify-center gap-2">
          {speciesArray.map(({ species, slot }) => (
            <FoodWebMiniCard
              key={`${slot}-${species.scientificName}`}
              species={species}
              slotType={slot}
              onClick={() => onSpeciesClick?.(species, slot)}
            />
          ))}
        </div>

        {/* Progress Indicators */}
        {speciesArray.length < 3 && (
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">
              {selectedSpecies.carnivore ? '✅' : '⬜'} Carnivore •{' '}
              {selectedSpecies.herbivoreOmnivore ? '✅' : '⬜'} Herbivore/Omnivore •{' '}
              {selectedSpecies.producer ? '✅' : '⬜'} Producer
            </p>
          </div>
        )}

        {/* Ready indicator */}
        {speciesArray.length === 3 && (
          <div className="text-center">
            <p className="text-xs font-bold text-green-500 animate-pulse">
              ✅ Ready to play! Click "Play Trivia" below
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
