import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

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
}

export const RegionSpeciesCarousel = ({
  species,
  regionName,
  currentSpecies,
  onSpeciesSelect
}: RegionSpeciesCarouselProps) => {

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
          {species.length} species found
        </p>
      </div>

      {/* Scrollable Species List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {species.map((sp) => (
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
      </ScrollArea>
    </div>
  );
};
