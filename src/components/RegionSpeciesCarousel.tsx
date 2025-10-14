import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FilterCategory } from '@/types/speciesFilter';
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
}

interface RegionSpeciesCarouselProps {
  species: RegionSpecies[];
  regionName: string;
  currentSpecies?: string;
  onSpeciesSelect: (species: RegionSpecies) => void;
  activeFilters?: Set<FilterCategory>;
}

export const RegionSpeciesCarousel = ({
  species,
  regionName,
  currentSpecies,
  onSpeciesSelect,
  activeFilters = new Set()
}: RegionSpeciesCarouselProps) => {

  // Filter species based on active filters
  const filterSpecies = (speciesList: RegionSpecies[]) => {
    if (activeFilters.size === 0) return speciesList;

    return speciesList.filter(sp => {
      // Normalize the animal type for comparison (handles both "MAMMALIA" and "mammal")
      const animalType = sp.animalType?.toLowerCase() || '';
      const taxonomicGroup = sp.taxonomicGroup?.toLowerCase() || '';

      // Check if any filter matches
      for (const filter of activeFilters) {
        // Animal type filters
        if (filter === 'all-animals') {
          const animalTypes = ['mammal', 'mammalia', 'bird', 'aves', 'fish', 'actinopterygii', 'chondrichthyes', 'elasmobranchii', 'reptile', 'reptilia', 'amphibian', 'amphibia', 'insect', 'insecta'];
          if (animalTypes.includes(animalType) || taxonomicGroup.includes('mammal') || taxonomicGroup.includes('bird') || taxonomicGroup.includes('fish') || taxonomicGroup.includes('reptile') || taxonomicGroup.includes('amphibian') || taxonomicGroup.includes('insect')) return true;
        }
        if (filter === 'mammals' && (animalType === 'mammal' || animalType === 'mammalia' || taxonomicGroup.includes('mammal'))) return true;
        if (filter === 'birds' && (animalType === 'bird' || animalType === 'aves' || taxonomicGroup.includes('bird'))) return true;
        if (filter === 'fish' && (animalType === 'fish' || animalType.includes('fish') || taxonomicGroup.includes('fish'))) return true;
        if (filter === 'reptiles' && (animalType === 'reptile' || animalType === 'reptilia' || taxonomicGroup.includes('reptile'))) return true;
        if (filter === 'amphibians' && (animalType === 'amphibian' || animalType === 'amphibia' || taxonomicGroup.includes('amphibian'))) return true;
        if (filter === 'insects' && (animalType === 'insect' || animalType === 'insecta' || taxonomicGroup.includes('insect'))) return true;

        // Plant filter
        if (filter === 'plants' && (animalType === 'plant' || animalType === 'plantae' || taxonomicGroup.includes('plant'))) return true;

        // Endangered filter
        if (filter === 'endangered') {
          const endangeredStatuses = ['CR', 'EN', 'VU'];
          if (endangeredStatuses.includes(sp.conservationStatus?.toUpperCase() || '')) return true;
        }
      }
      return false;
    });
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
          {activeFilters.size > 0 && <span className="text-primary"> • {activeFilters.size} filter{activeFilters.size > 1 ? 's' : ''} active</span>}
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
            {filteredSpecies.map((sp, index) => (
            <Card
              key={`${sp.scientificName}-${index}`}
              className={`cursor-pointer transition-all hover:scale-105 hover:shadow-2xl overflow-hidden aspect-square ${
                currentSpecies === sp.scientificName ? 'ring-4 ring-primary shadow-2xl' : ''
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
            </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
