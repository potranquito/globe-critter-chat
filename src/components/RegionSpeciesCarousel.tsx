import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FilterCategory } from '@/types/speciesFilter';
import type { SpeciesTypeFilter } from './SpeciesTypeFilter';
import { getSpeciesType, getUIGroup } from '@/utils/speciesClassification';
import { useEffect, useRef } from 'react';

interface RegionSpecies {
  scientificName: string;
  commonName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  imageKeyword?: string;
  imageUrl?: string;
  taxonomicGroup?: string;
  dietaryCategory?: string; // New: Carnivore, Herbivore, Omnivore, Producer
  trophicRole?: string;
  speciesType?: string;
}

interface RegionSpeciesCarouselProps {
  species: RegionSpecies[];
  regionName: string;
  currentSpecies?: string;
  onSpeciesSelect: (species: RegionSpecies) => void;
  activeFilters?: Set<FilterCategory>;
  speciesTypeFilter?: SpeciesTypeFilter; // New simplified filter
  selectedForGameSpecies?: string[]; // 🎮 NEW: Array of selected species scientific names
}

export const RegionSpeciesCarousel = ({
  species,
  regionName,
  currentSpecies,
  onSpeciesSelect,
  activeFilters = new Set(),
  speciesTypeFilter = 'all',
  selectedForGameSpecies = []
}: RegionSpeciesCarouselProps) => {

  // Filter species based on active filters and species type filter
  const filterSpecies = (speciesList: RegionSpecies[]) => {
    let filtered = speciesList;

    // Apply species type filter first (new dietary category filter)
    if (speciesTypeFilter !== 'all') {
      filtered = filtered.filter(sp => {
        // Use dietary_category from database if available, otherwise calculate
        let dietaryCategory = sp.dietaryCategory?.toLowerCase();

        if (!dietaryCategory) {
          // Fallback: Calculate from available data
          const speciesType = getSpeciesType({
            class: sp.animalType,
            animalType: sp.animalType,
            commonName: sp.commonName,
            scientificName: sp.scientificName
          });
          const uiGroup = getUIGroup(speciesType);
          dietaryCategory = uiGroup;
        }

        // Match against selected dietary category
        if (speciesTypeFilter === 'carnivores') return dietaryCategory === 'carnivore' || dietaryCategory === 'carnivores';
        if (speciesTypeFilter === 'herbivores') return dietaryCategory === 'herbivore' || dietaryCategory === 'herbivores';
        if (speciesTypeFilter === 'omnivores') return dietaryCategory === 'omnivore' || dietaryCategory === 'omnivores';
        if (speciesTypeFilter === 'producers') return dietaryCategory === 'producer' || dietaryCategory === 'producers';
        return true;
      });
    }

    // Apply legacy filters if any (for backward compatibility)
    if (activeFilters.size === 0) return filtered;

    const result = filtered.filter(sp => {
      // Normalize the animal type for comparison (handles both "MAMMALIA" and "mammal")
      const animalType = sp.animalType?.toLowerCase() || '';
      const taxonomicGroup = sp.taxonomicGroup?.toLowerCase() || '';

      // Check if any filter matches
      for (const filter of activeFilters) {
        // Dietary category filters (primary - from database dietary_category field)
        const dietaryCat = sp.dietaryCategory?.toLowerCase();

        if (filter === 'carnivores' && (dietaryCat === 'carnivore' || taxonomicGroup === 'carnivores')) {
          return true;
        }
        if (filter === 'herbivores' && (dietaryCat === 'herbivore' || taxonomicGroup === 'herbivores')) {
          return true;
        }
        if (filter === 'omnivores' && (dietaryCat === 'omnivore' || taxonomicGroup === 'omnivores')) {
          return true;
        }
        if (filter === 'producers' && (dietaryCat === 'producer' || taxonomicGroup === 'producers' || taxonomicGroup === 'plants & corals')) {
          return true;
        }

        // Legacy filters (backward compatibility)
        if (filter === 'animals' && taxonomicGroup === 'animals') {
          return true;
        }
        if (filter === 'birds' && taxonomicGroup === 'birds') {
          return true;
        }
        if (filter === 'plants-corals' && taxonomicGroup === 'plants & corals') {
          return true;
        }

        // Legacy animal type filters (for backward compatibility)
        if (filter === 'all-animals') {
          const animalTypes = ['mammal', 'mammalia', 'bird', 'aves', 'fish', 'actinopterygii', 'chondrichthyes', 'elasmobranchii', 'reptile', 'reptilia', 'amphibian', 'amphibia', 'insect', 'insecta'];
          if (animalTypes.includes(animalType) || taxonomicGroup.includes('mammal') || taxonomicGroup.includes('bird') || taxonomicGroup.includes('fish') || taxonomicGroup.includes('reptile') || taxonomicGroup.includes('amphibian') || taxonomicGroup.includes('insect')) return true;
        }
        if (filter === 'mammals' && (animalType === 'mammal' || animalType === 'mammalia' || taxonomicGroup.includes('mammal'))) return true;
        if (filter === 'reptiles' && (animalType === 'reptile' || animalType === 'reptilia' || taxonomicGroup.includes('reptile'))) return true;
        if (filter === 'amphibians' && (animalType === 'amphibian' || animalType === 'amphibia' || taxonomicGroup.includes('amphibian'))) return true;
        if (filter === 'insects' && (animalType === 'insect' || animalType === 'insecta' || taxonomicGroup.includes('insect'))) return true;
        if (filter === 'fish' && (animalType === 'fish' || animalType.includes('fish') || taxonomicGroup.includes('fish'))) return true;

        // Plant filter
        if (filter === 'plants' && (animalType === 'plant' || animalType === 'plantae' || taxonomicGroup.includes('plant'))) return true;

        // Conservation status filters
        if (filter === 'critically-endangered' && sp.conservationStatus?.toUpperCase() === 'CR') return true;
        if (filter === 'endangered' && sp.conservationStatus?.toUpperCase() === 'EN') return true;
        if (filter === 'vulnerable' && sp.conservationStatus?.toUpperCase() === 'VU') return true;
        if (filter === 'near-threatened' && sp.conservationStatus?.toUpperCase() === 'NT') return true;
        if (filter === 'least-concern' && sp.conservationStatus?.toUpperCase() === 'LC') return true;
      }
      return false;
    });

    return result;
  };

  const filteredSpecies = filterSpecies(species);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) return;

    let scrollDirection = 1; // 1 = down, -1 = up
    let isPaused = false;

    const autoScroll = () => {
      if (isPaused) return;

      scrollContainer.scrollBy({
        top: scrollDirection * 0.5, // Slow smooth scroll (0.5px per frame)
        behavior: 'auto'
      });

      // Reverse direction at top/bottom
      if (scrollContainer.scrollTop <= 0) {
        scrollDirection = 1;
      } else if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 1) {
        scrollDirection = -1;
      }
    };

    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };

    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    const intervalId = setInterval(autoScroll, 16); // ~60fps

    return () => {
      clearInterval(intervalId);
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [filteredSpecies.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CR': return 'bg-red-500';
      case 'EN': return 'bg-orange-500';
      case 'VU': return 'bg-yellow-500';
      case 'NT': return 'bg-blue-500';
      case 'LC': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
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

  const getAnimalEmoji = (type: string) => {
    const normalized = type?.toLowerCase() || '';

    // Match IUCN class names
    if (normalized.includes('mammal')) return '🦁';
    if (normalized.includes('aves') || normalized.includes('bird')) return '🐦';
    if (normalized.includes('fish') || normalized.includes('actinopterygii') || normalized.includes('chondrichthyes')) return '🐟';
    if (normalized.includes('reptil')) return '🦎';
    if (normalized.includes('amphib')) return '🐸';
    if (normalized.includes('insect')) return '🦋';

    // Plants
    if (normalized.includes('magnoliopsida') || normalized.includes('liliopsida') || normalized.includes('plant')) return '🌿';

    // Invertebrates
    if (normalized.includes('arachn')) return '🕷️';
    if (normalized.includes('malacostraca') || normalized.includes('crust')) return '🦀';

    return '🔍';
  };

  const getAnimalTypeName = (classType: string) => {
    const normalized = classType?.toLowerCase() || '';

    // Match IUCN class names to friendly names
    if (normalized.includes('mammal')) return 'Mammal';
    if (normalized === 'aves') return 'Bird';
    if (normalized === 'actinopterygii') return 'Fish';
    if (normalized === 'chondrichthyes') return 'Shark/Ray';
    if (normalized === 'reptilia') return 'Reptile';
    if (normalized === 'amphibia') return 'Amphibian';
    if (normalized === 'insecta') return 'Insect';
    if (normalized === 'arachnida') return 'Arachnid';
    if (normalized === 'malacostraca') return 'Crustacean';
    if (normalized === 'magnoliopsida') return 'Plant';
    if (normalized === 'liliopsida') return 'Plant';

    return classType || 'Unknown';
  };

  if (species.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col animate-fade-in" style={{height: 'calc(100vh - 48px)'}}>
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

      {/* Scrollable Species List */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        {filteredSpecies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No species match the selected filters</p>
          </div>
        ) : (
          <div className="space-y-3 pr-1">
            {filteredSpecies.map((sp, index) => {
              const isSelected = selectedForGameSpecies.includes(sp.scientificName);
              return (
            <Card
              key={`${sp.scientificName}-${index}`}
              className={`relative cursor-pointer transition-all hover:scale-105 hover:shadow-2xl overflow-hidden aspect-square ${
                currentSpecies === sp.scientificName ? 'ring-4 ring-primary shadow-2xl' : ''
              } ${
                isSelected ? 'ring-4 ring-green-500 shadow-green-500/50' : ''
              }`}
              onClick={() => onSpeciesSelect(sp)}
            >
              {/* Square Image */}
              {sp.imageUrl ? (
                <img
                  src={sp.imageUrl}
                  alt={sp.commonName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to emoji placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-full h-full bg-gradient-to-br from-muted/50 to-muted flex items-center justify-center text-8xl ${sp.imageUrl ? 'hidden' : ''}`}>
                {getAnimalEmoji(sp.animalType)}
              </div>

              {/* 🎮 Selected Badge */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </Card>
            )}
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
