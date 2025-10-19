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
  disableAutoScroll?: boolean; // 🎰 Turn off auto-scroll for spin wheel mode
  isSpinning?: boolean; // 🎰 Spin wheel animation active
  spinPhase?: 1 | 2 | 3; // 🎰 Which species to select: 1=producer, 2=herbivore, 3=carnivore
  onSpinComplete?: (selected: RegionSpecies, phase: 1 | 2 | 3) => void; // 🎰 Returns single species
  preSelectedSpecies?: { // 🤖 AI-selected species to reveal
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
  disableAutoScroll = false,
  isSpinning = false,
  spinPhase = 1,
  onSpinComplete,
  preSelectedSpecies
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

  // Auto-scroll effect (disabled during spin wheel mode)
  useEffect(() => {
    if (disableAutoScroll) return; // 🎰 Skip auto-scroll when spin wheel is active

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
  }, [filteredSpecies.length, disableAutoScroll]);

  // 🎰 Spin wheel animation effect - Slot machine style (stops on selected species)
  useEffect(() => {
    console.log('🎰 Carousel spin effect triggered:', { isSpinning, spinPhase, hasCallback: !!onSpinComplete });

    if (!isSpinning || !onSpinComplete) {
      console.log('🎰 Spin effect exiting early:', { isSpinning, hasCallback: !!onSpinComplete });
      return;
    }

    console.log('🎰 Starting slot-machine animation - Phase', spinPhase);

    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!scrollContainer) {
      console.error('🎰 ERROR: Scroll container not found!');
      return;
    }

    console.log('🎰 Scroll container dimensions:', {
      scrollHeight: scrollContainer.scrollHeight,
      clientHeight: scrollContainer.clientHeight,
      scrollTop: scrollContainer.scrollTop,
      isScrollable: scrollContainer.scrollHeight > scrollContainer.clientHeight
    });

    // 🎯 STEP 1: Select winning species BEFORE spinning
    let selectedSpecies: RegionSpecies;

    console.log('🤖 DEBUG: preSelectedSpecies =', preSelectedSpecies);
    console.log('🤖 DEBUG: spinPhase =', spinPhase);

    // 🤖 Use AI pre-selected species if available, otherwise random
    if (preSelectedSpecies) {
      console.log('🤖 DEBUG: AI pre-selection available!', {
        producer: preSelectedSpecies.producer?.commonName,
        herbivore: preSelectedSpecies.herbivore?.commonName,
        carnivore: preSelectedSpecies.carnivore?.commonName
      });

      if (spinPhase === 1 && preSelectedSpecies.producer) {
        selectedSpecies = preSelectedSpecies.producer;
        console.log('🤖 Phase 1 - Using AI-selected producer:', selectedSpecies.commonName);
      } else if (spinPhase === 2 && preSelectedSpecies.herbivore) {
        selectedSpecies = preSelectedSpecies.herbivore;
        console.log('🤖 Phase 2 - Using AI-selected herbivore:', selectedSpecies.commonName);
      } else if (spinPhase === 3 && preSelectedSpecies.carnivore) {
        selectedSpecies = preSelectedSpecies.carnivore;
        console.log('🤖 Phase 3 - Using AI-selected carnivore:', selectedSpecies.commonName);
      } else {
        console.error('🤖 ERROR: AI pre-selected species not found for phase', spinPhase, preSelectedSpecies);
        return;
      }
    } else {
      console.log('🤖 DEBUG: No AI pre-selection, using random');

      // Fallback to random selection if no AI pre-selection
      let candidateSpecies: RegionSpecies[] = [];

      if (spinPhase === 1) {
        candidateSpecies = filteredSpecies.filter(s => {
          const diet = s.dietaryCategory?.toLowerCase();
          return diet === 'producer' || diet === 'producers';
        });
        console.log('🎰 Phase 1 - Producers found:', candidateSpecies.length);
      } else if (spinPhase === 2) {
        candidateSpecies = filteredSpecies.filter(s => {
          const diet = s.dietaryCategory?.toLowerCase();
          return diet === 'herbivore' || diet === 'herbivores' || diet === 'omnivore' || diet === 'omnivores';
        });
        console.log('🎰 Phase 2 - Herbivores/Omnivores found:', candidateSpecies.length);
      } else if (spinPhase === 3) {
        candidateSpecies = filteredSpecies.filter(s => {
          const diet = s.dietaryCategory?.toLowerCase();
          return diet === 'carnivore' || diet === 'carnivores';
        });
        console.log('🎰 Phase 3 - Carnivores found:', candidateSpecies.length);
      }

      if (candidateSpecies.length === 0) {
        console.error('🎰 ERROR: No candidate species found for phase', spinPhase);
        return;
      }

      selectedSpecies = candidateSpecies[Math.floor(Math.random() * candidateSpecies.length)];
      console.log('🎰 Random selection:', selectedSpecies.commonName);
    }

    const selectedIndex = filteredSpecies.findIndex(s => s.scientificName === selectedSpecies.scientificName);

    if (selectedIndex === -1) {
      console.error('🤖 ERROR: AI-selected species not found in filtered carousel!', {
        aiSelected: selectedSpecies.scientificName,
        filteredCount: filteredSpecies.length
      });
      return;
    }

    console.log('🎰 Selected species:', selectedSpecies.commonName, 'at index', selectedIndex);
    console.log('🎰 Species in filteredSpecies at that index:', filteredSpecies[selectedIndex]?.commonName);

    // 🎯 STEP 2: Account for green border position (fixed at 50vh)
    const CARD_HEIGHT = 200;
    const CARD_GAP = 16;
    const TOTAL_CARD_HEIGHT = CARD_HEIGHT + CARD_GAP;
    const CONTAINER_PADDING_TOP = 4; // p-1 = 4px

    // Card's center position in scrollable content (including padding)
    const cardTopPosition = CONTAINER_PADDING_TOP + (selectedIndex * TOTAL_CARD_HEIGHT);
    const cardCenterInContent = cardTopPosition + (CARD_HEIGHT / 2);

    // Where is the green border relative to the carousel container?
    const scrollContainerRect = scrollContainer.getBoundingClientRect();
    const greenBorderScreenY = window.innerHeight / 2; // Fixed at 50vh
    const greenBorderRelativeToContainer = greenBorderScreenY - scrollContainerRect.top;

    // Scroll so card center aligns with green border position
    const targetScrollTop = cardCenterInContent - greenBorderRelativeToContainer;

    console.log('🎰 Alignment with green border:', {
      selectedIndex,
      cardTopPosition,
      cardCenterInContent,
      windowHeight: window.innerHeight,
      greenBorderScreenY,
      containerTop: scrollContainerRect.top,
      greenBorderRelativeToContainer,
      targetScrollTop
    });

    // 🎰 Smooth scroll animation using CSS transform approach (like working spin wheel)
    const startScrollTop = scrollContainer.scrollTop;
    const totalDistance = targetScrollTop - startScrollTop;
    const animationDuration = 2000; // 2 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);

      // Slot machine easing
      const eased = 1 - Math.pow(1 - progress, 3);

      scrollContainer.scrollTop = startScrollTop + (totalDistance * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log('🎰 Spin complete! Stopped on:', selectedSpecies.commonName);
        setTimeout(() => {
          onSpinComplete(selectedSpecies, spinPhase);
        }, 500);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      // Cleanup if component unmounts during animation
    };
  }, [isSpinning, filteredSpecies, spinPhase, onSpinComplete]);

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
      <div className="flex-1 relative" style={{ maxHeight: 'calc(100vh - 150px)' }}>
        {/* 🎰 Selection indicator - center zone with green overlay (fixed at button height) */}
        <div
          className="fixed z-10 pointer-events-none"
          style={{
            left: '27px', // Centered over carousel cards (16px carousel + 16px padding - 105px half of border = 27px)
            top: '50%',
            transform: 'translateY(-50%)'
          }}
        >
          {/* Outer glow ring */}
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
          {/* Center target indicator */}
          {!isSpinning && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500 text-2xl font-bold opacity-40">
              ⬇
            </div>
          )}
        </div>
        <ScrollArea ref={scrollAreaRef} className="h-full w-full">
        {filteredSpecies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No species match the selected filters</p>
          </div>
        ) : (
          <div className="space-y-4 p-1">
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
    </div>
  );
};
