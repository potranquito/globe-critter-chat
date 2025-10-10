import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { FilterCategory } from '@/types/speciesFilter';

interface RegionSpecies {
  scientificName: string;
  commonName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  imageKeyword?: string;
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
      // Check if any filter matches
      for (const filter of activeFilters) {
        // Animal type filters
        if (filter === 'all-animals') {
          const animalTypes = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];
          if (animalTypes.includes(sp.animalType?.toLowerCase() || '')) return true;
        }
        if (filter === 'mammals' && sp.animalType?.toLowerCase() === 'mammal') return true;
        if (filter === 'birds' && sp.animalType?.toLowerCase() === 'bird') return true;
        if (filter === 'fish' && sp.animalType?.toLowerCase() === 'fish') return true;
        if (filter === 'reptiles' && sp.animalType?.toLowerCase() === 'reptile') return true;
        if (filter === 'amphibians' && sp.animalType?.toLowerCase() === 'amphibian') return true;
        if (filter === 'insects' && sp.animalType?.toLowerCase() === 'insect') return true;

        // Plant filter
        if (filter === 'plants' && sp.animalType?.toLowerCase() === 'plant') return true;

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
    switch (type?.toLowerCase()) {
      case 'mammal': return '🦁';
      case 'bird': return '🐦';
      case 'fish': return '🐟';
      case 'reptile': return '🦎';
      case 'amphibian': return '🐸';
      case 'insect': return '🦋';
      case 'plant': return '🌿';
      default: return '🔍';
    }
  };

  if (species.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 h-full flex flex-col animate-fade-in">
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
      <ScrollArea className="flex-1">
        {filteredSpecies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No species match the selected filters</p>
          </div>
        ) : (
          <div className="space-y-2 pr-1">
            {filteredSpecies.map((sp) => (
            <Card
              key={sp.scientificName}
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                currentSpecies === sp.scientificName ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSpeciesSelect(sp)}
            >
              <div className="p-3 flex gap-3">
                {/* Icon/Image placeholder */}
                <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 text-3xl">
                  {getAnimalEmoji(sp.animalType)}
                </div>

                {/* Species Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1" title={sp.commonName}>
                    {sp.commonName}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1" title={sp.scientificName}>
                    {sp.scientificName}
                  </p>

                  {/* Badges */}
                  <div className="flex gap-1 flex-wrap mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1">
                      {sp.animalType}
                    </Badge>
                    {sp.conservationStatus !== 'NE' && sp.conservationStatus !== 'LC' && (
                      <Badge
                        className={`text-[10px] px-1 text-white ${getStatusColor(sp.conservationStatus)}`}
                        title={getStatusLabel(sp.conservationStatus)}
                      >
                        {sp.conservationStatus}
                      </Badge>
                    )}
                  </div>

                  {/* Sighting count */}
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {sp.occurrenceCount} sightings
                  </p>
                </div>
              </div>
            </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
