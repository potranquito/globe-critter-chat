import { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { RegionSpecies } from "@/data/ecoregions";

interface SpeciesSpinWheelProps {
  species: RegionSpecies[]; // Available species to spin through
  onSpinComplete: (selectedSpecies: RegionSpecies) => void; // Called when spin finishes
  autoSpin?: boolean; // Auto-start spin on mount
  disabled?: boolean;
}

export const SpeciesSpinWheel = ({
  species,
  onSpinComplete,
  autoSpin = false,
  disabled = false
}: SpeciesSpinWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<RegionSpecies | null>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  // Triple the species for seamless loop
  const displaySpecies = [...species, ...species, ...species];

  // Card dimensions (match carousel square cards)
  const CARD_SIZE = 200; // Square cards
  const CARD_GAP = 16;
  const TOTAL_CARD_HEIGHT = CARD_SIZE + CARD_GAP;

  useEffect(() => {
    if (autoSpin && !isSpinning && !disabled) {
      // Small delay before auto-spin
      const timer = setTimeout(() => {
        spin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoSpin, disabled]);

  const spin = () => {
    if (isSpinning || disabled) return;

    setIsSpinning(true);
    setSelectedSpecies(null);

    // Random winner from available species
    const winnerIndex = Math.floor(Math.random() * species.length);
    const winner = species[winnerIndex];

    // Calculate final position
    // Target the middle set of tripled cards, align at center (250px from top in 500px container)
    const finalOffset = species.length * TOTAL_CARD_HEIGHT + (winnerIndex * TOTAL_CARD_HEIGHT);

    // Reset position instantly
    if (spinnerRef.current) {
      spinnerRef.current.style.transition = "none";
      setOffset(0);

      // Start spinning after brief reset
      setTimeout(() => {
        if (spinnerRef.current) {
          // Spin with slot machine easing (3 seconds)
          spinnerRef.current.style.transition = "transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
          setOffset(finalOffset);
        }
      }, 50);
    }

    // Complete spin
    setTimeout(() => {
      setIsSpinning(false);
      setSelectedSpecies(winner);
      onSpinComplete(winner);
    }, 3100);
  };

  const getAnimalEmoji = (type: string) => {
    const normalized = type?.toLowerCase() || '';
    if (normalized.includes('mammal')) return '🦁';
    if (normalized.includes('aves') || normalized.includes('bird')) return '🐦';
    if (normalized.includes('fish')) return '🐟';
    if (normalized.includes('reptil')) return '🦎';
    if (normalized.includes('amphib')) return '🐸';
    if (normalized.includes('plant')) return '🌿';
    return '🔍';
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Selection indicator - center zone with green ring (matching carousel) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div
          className={`w-[200px] h-[200px] rounded-lg transition-all duration-300 ${
            isSpinning ? 'border-4 border-emerald-400/50' : 'border-4 border-emerald-500'
          }`}
          style={{
            boxShadow: isSpinning
              ? '0 0 20px rgba(16, 185, 129, 0.3)'
              : '0 0 30px rgba(16, 185, 129, 0.6)',
            animation: isSpinning ? 'pulse 1s ease-in-out infinite' : 'none'
          }}
        />
      </div>

      {/* Gradient overlays for fade effect - match main app background */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

      {/* Species cards container - just images like carousel */}
      <div
        ref={spinnerRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col gap-4 py-[150px]"
        style={{
          transform: `translateX(-50%) translateY(-${offset}px)`,
          willChange: 'transform'
        }}
      >
        {displaySpecies.map((speciesItem, index) => (
          <Card
            key={`${speciesItem.scientificName}-${index}`}
            className="relative cursor-default transition-all overflow-hidden aspect-square w-[200px] h-[200px]"
            style={{
              filter: isSpinning ? 'blur(1px)' : 'blur(0px)',
              transition: 'filter 0.3s'
            }}
          >
            {/* Square Image - just like carousel */}
            {speciesItem.imageUrl ? (
              <img
                src={speciesItem.imageUrl}
                alt={speciesItem.commonName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-8xl ${speciesItem.imageUrl ? 'hidden' : ''}`}>
              {getAnimalEmoji(speciesItem.animalType)}
            </div>
          </Card>
        ))}
      </div>

      {/* Status indicator */}
      {isSpinning && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-500/90 text-white px-4 py-1.5 rounded-full font-bold text-xs animate-bounce">
          🎰 SPINNING...
        </div>
      )}
    </div>
  );
};
