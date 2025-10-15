import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Species } from '@/types/habitat';
import type { FilterCategory } from '@/types/speciesFilter';
import { getSpeciesType, getUIGroup } from '@/utils/speciesClassification';

interface HabitatSpeciesListProps {
  species: Species[];
  habitatName: string;
  onSpeciesSelect?: (species: Species) => void;
  activeFilters?: Set<FilterCategory>;
}

export const HabitatSpeciesList = ({
  species,
  habitatName,
  onSpeciesSelect,
  activeFilters = new Set()
}: HabitatSpeciesListProps) => {

  // Filter species based on active filters
  const filterSpecies = (speciesList: Species[]) => {
    if (activeFilters.size === 0) return speciesList;

    return speciesList.filter(sp => {
      // Classify the species
      const speciesType = getSpeciesType({
        class: sp.type,
        animalType: sp.type,
        commonName: sp.name,
        scientificName: sp.scientificName,
        kingdom: sp.kingdom
      });
      const uiGroup = getUIGroup(speciesType);

      // Check if any filter matches
      for (const filter of activeFilters) {
        // New UI Group filters (primary)
        if (filter === 'animals' && uiGroup === 'animals') return true;
        if (filter === 'birds' && uiGroup === 'birds') return true;
        if (filter === 'plants-corals' && uiGroup === 'plants-corals') return true;

        // Legacy animal type filters (backward compatibility)
        if (filter === 'all-animals') {
          const animalTypes = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];
          if (animalTypes.includes(sp.type?.toLowerCase() || '')) return true;
        }
        if (filter === 'mammals' && sp.type?.toLowerCase() === 'mammal') return true;
        if (filter === 'birds' && sp.type?.toLowerCase() === 'bird') return true;
        if (filter === 'fish' && sp.type?.toLowerCase() === 'fish') return true;
        if (filter === 'reptiles' && sp.type?.toLowerCase() === 'reptile') return true;
        if (filter === 'amphibians' && sp.type?.toLowerCase() === 'amphibian') return true;
        if (filter === 'insects' && sp.type?.toLowerCase() === 'insect') return true;

        // Plant filter
        if (filter === 'plants' && sp.type?.toLowerCase() === 'plant') return true;

        // Conservation status filters
        const statusUpper = sp.conservationStatus?.toUpperCase() || '';
        if (filter === 'critically-endangered' && statusUpper === 'CR') return true;
        if (filter === 'endangered' && statusUpper === 'EN') return true;
        if (filter === 'vulnerable' && statusUpper === 'VU') return true;
        if (filter === 'near-threatened' && statusUpper === 'NT') return true;
        if (filter === 'least-concern' && statusUpper === 'LC') return true;
      }
      return false;
    });
  };

  const filteredSpecies = filterSpecies(species);

  const getStatusColor = (status: string) => {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'CR':
      case 'CRITICALLY ENDANGERED':
        return 'bg-red-500';
      case 'EN':
      case 'ENDANGERED':
        return 'bg-orange-500';
      case 'VU':
      case 'VULNERABLE':
        return 'bg-yellow-500';
      case 'NT':
      case 'NEAR THREATENED':
        return 'bg-blue-500';
      case 'LC':
      case 'LEAST CONCERN':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getAnimalEmoji = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mammal':
        return '🦁';
      case 'bird':
        return '🐦';
      case 'fish':
        return '🐟';
      case 'reptile':
        return '🦎';
      case 'amphibian':
        return '🐸';
      case 'insect':
        return '🦋';
      case 'plant':
        return '🌿';
      default:
        return '🔍';
    }
  };

  if (species.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 flex flex-col animate-fade-in" style={{height: 'calc(100vh - 48px)'}}>
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold">
          🌍 {habitatName} Species
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
              key={sp.id}
              className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg"
              onClick={() => onSpeciesSelect?.(sp)}
            >
              <div className="p-3 flex gap-3">
                {/* Icon/Image placeholder */}
                <div className="w-16 h-16 bg-muted/50 rounded-lg flex items-center justify-center shrink-0 text-3xl">
                  {sp.imageUrl ? (
                    <img
                      src={sp.imageUrl}
                      alt={sp.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    getAnimalEmoji(sp.type)
                  )}
                </div>

                {/* Species Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-1" title={sp.name}>
                    {sp.name}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-1" title={sp.scientificName}>
                    {sp.scientificName}
                  </p>

                  {/* Badges */}
                  <div className="flex gap-1 flex-wrap mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1">
                      {sp.type}
                    </Badge>
                    {sp.conservationStatus && sp.conservationStatus !== 'LC' && sp.conservationStatus !== 'Least Concern' && (
                      <Badge
                        className={`text-[10px] px-1 text-white ${getStatusColor(sp.conservationStatus)}`}
                      >
                        {sp.conservationStatus}
                      </Badge>
                    )}
                  </div>

                  {/* Observation count */}
                  {sp.observationCount > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {sp.observationCount} observations
                    </p>
                  )}
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
