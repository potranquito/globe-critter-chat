import { useState, useEffect, useMemo } from 'react';
import type { RegionSpecies } from '@/services/regionService';

interface ScatteredSpeciesImagesProps {
  species: {
    carnivore: RegionSpecies | null;
    herbivore: RegionSpecies | null;
    omnivore: RegionSpecies | null;
    bird: RegionSpecies | null;
    plantCoral: RegionSpecies | null;
  };
  onSpeciesClick: (species: RegionSpecies) => void;
  isClickable: boolean;
  correctAnswer?: string; // scientific name of correct answer
  wrongAnswer?: string; // scientific name of wrong answer
  questionKey?: number; // Changes with each question to trigger re-randomization
}

interface PositionConfig {
  top: string;
  left: string;
  rotation: number;
}

export const ScatteredSpeciesImages = ({
  species,
  onSpeciesClick,
  isClickable,
  correctAnswer,
  wrongAnswer,
  questionKey
}: ScatteredSpeciesImagesProps) => {
  const [positions, setPositions] = useState<PositionConfig[]>([]);

  // Generate random positions within safe zones - randomized each time
  useEffect(() => {
    // Define 5 base zones that avoid:
    // - Top: Header + timer (0-100px from top)
    // - Left: Species carousel (0-300px from left)
    // - Bottom: Chat (0-140px from bottom)
    // Keep cards more centered (35-60% from left) instead of far right

    const baseZones = [
      // Top-left area
      { topBase: 15, leftBase: 38, topRange: 5, leftRange: 5 },
      // Middle-center area
      { topBase: 38, leftBase: 50, topRange: 5, leftRange: 5 },
      // Bottom-center area
      { topBase: 58, leftBase: 42, topRange: 5, leftRange: 5 },
      // Top-right area
      { topBase: 20, leftBase: 60, topRange: 5, leftRange: 5 },
      // Middle-right area
      { topBase: 48, leftBase: 58, topRange: 5, leftRange: 5 },
    ];

    // Randomize positions within each zone
    const randomizedZones = baseZones.map(zone => ({
      top: `${zone.topBase + (Math.random() * zone.topRange - zone.topRange / 2)}%`,
      left: `${zone.leftBase + (Math.random() * zone.leftRange - zone.leftRange / 2)}%`,
      rotation: Math.random() * 30 - 15,
    }));

    setPositions(randomizedZones);
  }, [questionKey]); // Re-randomize when question changes

  // Map species to array with their slot types
  const speciesArray = useMemo(() => {
    return [
      { species: species.carnivore, slotType: 'carnivore' },
      { species: species.herbivore, slotType: 'herbivore' },
      { species: species.omnivore, slotType: 'omnivore' },
      { species: species.bird, slotType: 'bird' },
      { species: species.plantCoral, slotType: 'plantCoral' },
    ].filter(item => item.species !== null);
  }, [species]);

  if (speciesArray.length === 0 || positions.length === 0) {
    return null;
  }

  return (
    <>
      {speciesArray.map((item, index) => {
        const s = item.species!;
        const position = positions[index];
        const isCorrect = correctAnswer === s.scientificName;
        const isWrong = wrongAnswer === s.scientificName;

        return (
          <div
            key={s.scientificName}
            onClick={() => isClickable && onSpeciesClick(s)}
            className={`
              absolute group
              transition-all duration-300
              ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
              ${isCorrect ? 'animate-pulse' : ''}
              ${isWrong ? 'animate-shake' : ''}
            `}
            style={{
              top: position.top,
              left: position.left,
              transform: `rotate(${position.rotation}deg)`,
              zIndex: 20,
            }}
          >
            {/* Species Card */}
            <div
              className={`
                relative
                w-32 h-32
                rounded-2xl
                overflow-hidden
                backdrop-blur-sm
                transition-all duration-300
                ${isClickable ? 'hover:shadow-2xl' : ''}
                ${isCorrect ? 'ring-4 ring-green-500 shadow-[0_0_30px_rgba(34,197,94,0.6)]' : ''}
                ${isWrong ? 'ring-4 ring-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)]' : ''}
              `}
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderWidth: '3px',
                borderColor: isCorrect
                  ? 'rgb(34, 197, 94)'
                  : isWrong
                  ? 'rgb(239, 68, 68)'
                  : 'rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Species Image */}
              <img
                src={s.imageUrl || '/placeholder-species.png'}
                alt="Species"
                className="w-full h-full object-cover"
              />

              {/* Glow effect for correct answer */}
              {isCorrect && (
                <div className="absolute inset-0 bg-green-500/20 animate-pulse pointer-events-none" />
              )}

              {/* Flash effect for wrong answer */}
              {isWrong && (
                <div className="absolute inset-0 bg-red-500/30 animate-ping pointer-events-none" />
              )}
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(var(--rotation)); }
          25% { transform: translateX(-10px) rotate(calc(var(--rotation) - 5deg)); }
          75% { transform: translateX(10px) rotate(calc(var(--rotation) + 5deg)); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
};

export default ScatteredSpeciesImages;
