import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { FilterCategory } from '@/types/speciesFilter';
import type { SpeciesTypeFilter } from './SpeciesTypeFilter';
import { getSpeciesType, getUIGroup } from '@/utils/speciesClassification';
import { useEffect, useRef, useState } from 'react';

interface RegionSpecies {
  scientificName: string;
  commonName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  imageKeyword?: string;
  imageUrl?: string;
  taxonomicGroup?: string;
  dietaryCategory?: string;
  trophicRole?: string;
  speciesType?: string;
}

interface RegionSpeciesCarouselProps {
  species: RegionSpecies[];
  regionName: string;
  currentSpecies?: string;
  onSpeciesSelect: (species: RegionSpecies) => void;
  activeFilters?: Set<FilterCategory>;
  speciesTypeFilter?: SpeciesTypeFilter;
  selectedForGameSpecies?: string[];
  disableAutoScroll?: boolean;
  isSpinning?: boolean;
  spinPhase?: 1 | 2 | 3;
  onSpinComplete?: (selected: RegionSpecies, phase: 1 | 2 | 3) => void;
  preSelectedSpecies?: {
    producer: RegionSpecies | null;
    herbivore: RegionSpecies | null;
    carnivore: RegionSpecies | null;
  };
}

export const RegionSpeciesCarousel = ({
  species,
  regionName,
  currentSpecies,
  onSpeciesSelect,
  activeFilters = new Set(),
  speciesTypeFilter = 'all',
  selectedForGameSpecies = [],
  isSpinning = false,
  spinPhase = 1,
  onSpinComplete,
  preSelectedSpecies
}: RegionSpeciesCarouselProps) => {
  const cardsContainerRef = useRef<HTMLDivElement | null>(null);
  const [transformOffset, setTransformOffset] = useState(0);

  // Filter species
  const filterSpecies = (speciesList: RegionSpecies[]) => {
    let filtered = speciesList;

    if (activeFilters.size > 0) {
      filtered = speciesList.filter(sp => {
        for (const filter of activeFilters) {
          const uiGroup = sp.taxonomicGroup?.toLowerCase() || '';
          const conservationStatus = sp.conservationStatus?.toUpperCase() || '';

          if (filter === 'animals' && uiGroup === 'animals') return true;
          if (filter === 'birds' && uiGroup === 'birds') return true;
          if (filter === 'plants-corals' && uiGroup === 'plants & corals') return true;

          const animalType = (sp.animalType || '').toLowerCase();
          const animalTypes = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];
          if (filter === 'all-animals' && animalTypes.includes(animalType)) return true;
          if (filter === 'mammals' && animalType === 'mammal') return true;
          if (filter === 'reptiles' && animalType === 'reptile') return true;
          if (filter === 'amphibians' && animalType === 'amphibian') return true;
          if (filter === 'insects' && animalType === 'insect') return true;
          if (filter === 'fish' && animalType === 'fish') return true;
          if (filter === 'plants' && animalType === 'plant') return true;

          if (filter === 'critically-endangered' && conservationStatus === 'CR') return true;
          if (filter === 'endangered' && conservationStatus === 'EN') return true;
          if (filter === 'vulnerable' && conservationStatus === 'VU') return true;
          if (filter === 'near-threatened' && conservationStatus === 'NT') return true;
          if (filter === 'least-concern' && conservationStatus === 'LC') return true;
        }
        return false;
      });
    }

    if (speciesTypeFilter !== 'all') {
      filtered = filtered.filter(sp => {
        const speciesType = getSpeciesType(sp.animalType || '');
        return speciesType === speciesTypeFilter;
      });
    }

    return filtered;
  };

  const filteredSpecies = filterSpecies(species);

  // 🎰 Spin animation - CSS transform approach (like working spin wheel)
  useEffect(() => {
    if (!isSpinning || !onSpinComplete) return;

    console.log('🎰 Starting spin - Phase', spinPhase);

    // Get selected species
    let selectedSpecies: RegionSpecies | null = null;

    if (preSelectedSpecies) {
      if (spinPhase === 1) selectedSpecies = preSelectedSpecies.producer;
      else if (spinPhase === 2) selectedSpecies = preSelectedSpecies.herbivore;
      else if (spinPhase === 3) selectedSpecies = preSelectedSpecies.carnivore;
    }

    if (!selectedSpecies) {
      console.error('🎰 No species selected for phase', spinPhase);
      return;
    }

    const selectedIndex = filteredSpecies.findIndex(s => s.scientificName === selectedSpecies!.scientificName);

    if (selectedIndex === -1) {
      console.error('🎰 Species not found in carousel:', selectedSpecies.commonName);
      return;
    }

    console.log('🎰 Spinning to:', selectedSpecies.commonName, 'at index', selectedIndex);

    // Calculate offset (matching working spin wheel logic)
    const CARD_HEIGHT = 200;
    const CARD_GAP = 16;
    const TOTAL_CARD_HEIGHT = CARD_HEIGHT + CARD_GAP;

    // Simple: card index * card height = offset
    const targetOffset = selectedIndex * TOTAL_CARD_HEIGHT;

    console.log('🎰 Target offset:', targetOffset);

    // Animate with CSS transition
    if (cardsContainerRef.current) {
      cardsContainerRef.current.style.transition = 'transform 2s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
      setTransformOffset(targetOffset);
    }

    // Complete after animation
    setTimeout(() => {
      console.log('🎰 Spin complete:', selectedSpecies!.commonName);
      onSpinComplete(selectedSpecies!, spinPhase);
    }, 2100);

  }, [isSpinning, spinPhase, filteredSpecies, onSpinComplete, preSelectedSpecies]);

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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CR': return 'bg-red-500';
      case 'EN': return 'bg-orange-500';
      case 'VU': return 'bg-yellow-500';
      case 'NT': return 'bg-blue-500';
      case 'LC': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 shadow-2xl animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold">
          🌍 {regionName} Ecosystem
        </h3>
        <p className="text-sm text-muted-foreground">
          {filteredSpecies.length} of {species.length} species
          {(activeFilters.size > 0 || speciesTypeFilter !== 'all') && <span className="text-primary"> • filtered</span>}
        </p>
      </div>

      {/* Scrollable Species List with CSS Transform (like working spin wheel) */}
      <div className="flex-1 relative overflow-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* 🎰 Green selection indicator - fixed at center */}
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div
            className={`w-[210px] h-[210px] rounded-lg transition-all duration-300 ${
              isSpinning ? 'border-4 border-emerald-400' : 'border-2 border-emerald-500/60'
            }`}
            style={{
              boxShadow: isSpinning
                ? '0 0 40px rgba(16, 185, 129, 0.6), inset 0 0 20px rgba(16, 185, 129, 0.2)'
                : '0 0 25px rgba(16, 185, 129, 0.4), inset 0 0 15px rgba(16, 185, 129, 0.15)',
              animation: isSpinning ? 'pulse 1s ease-in-out infinite' : 'none',
              background: isSpinning
                ? 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%)'
            }}
          />
        </div>

        {/* Gradient overlays */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />

        {/* Cards container with CSS transform */}
        <div
          ref={cardsContainerRef}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 flex flex-col gap-4"
          style={{
            transform: `translate(-50%, calc(-50% - ${transformOffset}px))`,
            paddingTop: '150px',
            paddingBottom: '150px'
          }}
        >
          {filteredSpecies.map((sp, index) => {
            const isSelected = selectedForGameSpecies.includes(sp.scientificName);
            return (
              <Card
                key={`${sp.scientificName}-${index}`}
                className={`relative cursor-pointer transition-all hover:scale-105 hover:shadow-2xl overflow-hidden aspect-square w-[200px] h-[200px] ${
                  currentSpecies === sp.scientificName ? 'ring-4 ring-primary shadow-2xl' : ''
                } ${
                  isSelected ? 'ring-4 ring-green-500 shadow-green-500/50' : ''
                }`}
                onClick={() => onSpeciesSelect(sp)}
              >
                {sp.imageUrl ? (
                  <img
                    src={sp.imageUrl}
                    alt={sp.commonName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-8xl ${sp.imageUrl ? 'hidden' : ''}`}>
                  {getAnimalEmoji(sp.animalType)}
                </div>

                {isSelected && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
