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
  // Filter out null values and create array of selected species with their slot types
  const speciesArray = [
    { species: selectedSpecies.carnivore, slot: 'carnivore' as const },
    { species: selectedSpecies.herbivoreOmnivore, slot: 'herbivoreOmnivore' as const },
    { species: selectedSpecies.producer, slot: 'producer' as const },
  ].filter(item => item.species !== null);

  // Don't render if no species selected
  if (speciesArray.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-2xl animate-fade-in">
      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="text-center">
          <h3 className="text-sm font-bold text-foreground">
            🎮 Selected Species for Trivia
          </h3>
          <p className="text-xs text-muted-foreground">
            {speciesArray.length} of 3 selected
          </p>
        </div>

        {/* Species Cards */}
        <div className="flex items-center justify-center gap-4">
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
            <p className="text-xs text-muted-foreground">
              {selectedSpecies.carnivore ? '✅' : '⬜'} Carnivore •{' '}
              {selectedSpecies.herbivoreOmnivore ? '✅' : '⬜'} Herbivore/Omnivore •{' '}
              {selectedSpecies.producer ? '✅' : '⬜'} Producer
            </p>
          </div>
        )}

        {/* Ready indicator */}
        {speciesArray.length === 3 && (
          <div className="text-center">
            <p className="text-sm font-bold text-green-500 animate-pulse">
              ✅ Ready to play! Click "Play Trivia" below
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
