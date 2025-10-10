import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Shield, Trees } from 'lucide-react';

interface LocationPlace {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  type?: string;
  area?: string;
  designation?: string;
  description?: string;
}

interface LocationsCarouselProps {
  wildlifePlaces: LocationPlace[];
  protectedAreas: LocationPlace[];
  regionName: string;
  onLocationSelect: (location: LocationPlace) => void;
  currentLocation?: string;
}

export const LocationsCarousel = ({
  wildlifePlaces,
  protectedAreas,
  regionName,
  onLocationSelect,
  currentLocation
}: LocationsCarouselProps) => {

  // Combine both lists and deduplicate by name
  const allLocations = [...wildlifePlaces, ...protectedAreas];
  const uniqueLocations = allLocations.filter((loc, index, self) =>
    index === self.findIndex(l => l.name === loc.name)
  );

  const getLocationIcon = (location: LocationPlace) => {
    if (location.designation || protectedAreas.some(pa => pa.name === location.name)) {
      return <Shield className="h-4 w-4 text-blue-400" />;
    }
    if (location.type?.toLowerCase().includes('park') || location.type?.toLowerCase().includes('refuge')) {
      return <Trees className="h-4 w-4 text-green-400" />;
    }
    return <MapPin className="h-4 w-4 text-orange-400" />;
  };

  const getLocationType = (location: LocationPlace) => {
    if (location.designation) return location.designation;
    if (location.type) return location.type;
    if (protectedAreas.some(pa => pa.name === location.name)) return 'Protected Area';
    return 'Wildlife Location';
  };

  if (uniqueLocations.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-orange-400" />
          {regionName} Locations
        </h3>
        <p className="text-sm text-muted-foreground">
          {uniqueLocations.length} park{uniqueLocations.length !== 1 ? 's' : ''}, refuge{uniqueLocations.length !== 1 ? 's' : ''} & preserve{uniqueLocations.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable Locations List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-1">
          {uniqueLocations.map((location, index) => (
            <Card
              key={`${location.name}-${index}`}
              className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
                currentLocation === location.name ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onLocationSelect(location)}
            >
              <div className="p-3">
                {/* Location Header */}
                <div className="flex gap-2 items-start mb-2">
                  <div className="mt-1">
                    {getLocationIcon(location)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2" title={location.name}>
                      {location.name}
                    </h4>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="mb-2">
                  <Badge variant="secondary" className="text-[10px] px-2">
                    {getLocationType(location)}
                  </Badge>
                </div>

                {/* Area info if available */}
                {location.area && (
                  <p className="text-[10px] text-muted-foreground">
                    Area: {location.area}
                  </p>
                )}

                {/* Description preview */}
                {location.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {location.description}
                  </p>
                )}

                {/* Coordinates */}
                <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                  {location.location.lat.toFixed(4)}, {location.location.lng.toFixed(4)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
