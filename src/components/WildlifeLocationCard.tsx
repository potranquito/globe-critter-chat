import { useState, useEffect } from 'react';
import { MapPin, Star, TreePine, Fish, Bird, Bug, PawPrint } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface WildlifeLocationCardProps {
  name: string;
  address?: string;
  rating?: number;
  imageUrl?: string;
  photoReference?: string;
  types?: string[];
  location: { lat: number; lng: number };
  onClose: () => void;
  designation?: string;
  iucnCategory?: string;
  area?: number;
  type?: string;
}

interface LocationSpecies {
  id: string;
  common_name: string;
  scientific_name: string;
  conservation_status: string | null;
  taxonomic_group: string;
  image_url: string | null;
}

// 🦁 FALLBACK DATA: Hardcoded species for demo regions if DB is empty
const DEMO_SPECIES_BY_ZONE: Record<string, LocationSpecies[]> = {
  'arctic': [
    { id: 'polar-bear', scientific_name: 'Ursus maritimus', common_name: 'Polar Bear', conservation_status: 'VU', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg' },
    { id: 'arctic-fox', scientific_name: 'Vulpes lagopus', common_name: 'Arctic Fox', conservation_status: 'LC', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Arctic_Fox_in_Winter.jpg' },
    { id: 'beluga', scientific_name: 'Delphinapterus leucas', common_name: 'Beluga Whale', conservation_status: 'LC', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Beluga_pretty.jpg' },
    { id: 'narwhal', scientific_name: 'Monodon monoceros', common_name: 'Narwhal', conservation_status: 'LC', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Pod_Monodon_monoceros.jpg' },
    { id: 'snowy-owl', scientific_name: 'Bubo scandiacus', common_name: 'Snowy Owl', conservation_status: 'VU', taxonomic_group: 'Birds', image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c1/Snowy_Owl_-_Schnee-Eule.jpg' }
  ],
  'antarctic': [
    { id: 'emperor-penguin', scientific_name: 'Aptenodytes forsteri', common_name: 'Emperor Penguin', conservation_status: 'NT', taxonomic_group: 'Birds', image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Emperor_Penguin_Manchot_empereur.jpg' },
    { id: 'leopard-seal', scientific_name: 'Hydrurga leptonyx', common_name: 'Leopard Seal', conservation_status: 'LC', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Leopard_seal.jpg' },
    { id: 'blue-whale', scientific_name: 'Balaenoptera musculus', common_name: 'Blue Whale', conservation_status: 'EN', taxonomic_group: 'Mammals', image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Blue_Whale_001_body_bw.jpg' }
  ]
};

const WildlifeLocationCard = ({
  name,
  address,
  rating,
  imageUrl,
  photoReference,
  types,
  location,
  onClose,
  designation,
  iucnCategory,
  area,
  type
}: WildlifeLocationCardProps) => {
  const [species, setSpecies] = useState<LocationSpecies[]>([]);
  const [loading, setLoading] = useState(false);

  const displayImageUrl = imageUrl || (photoReference
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`
    : null);

  // Format location type for display
  const getLocationType = () => {
    if (type === 'protected-area') {
      if (designation) return designation;
      if (iucnCategory) return `IUCN Category ${iucnCategory}`;
      return 'Protected Area';
    }
    if (!types || types.length === 0) return 'Wildlife Location';

    const typeStr = types[0].replace(/_/g, ' ');
    return typeStr.charAt(0).toUpperCase() + typeStr.slice(1);
  };

  // Fetch species nearby
  useEffect(() => {
    async function fetchSpecies() {
      if (!location?.lat || !location?.lng) return;
      
      setLoading(true);
      try {
        // Use the spatial RPC to find balanced species near this location
        // Radius: 0.5 degrees (approx 50km) to capture regional biodiversity
        const { data, error } = await supabase.rpc('get_balanced_spatial_species', {
          p_region_lat: location.lat,
          p_region_lng: location.lng,
          p_radius_degrees: 0.5,
          p_species_per_class: 2 // Get 2 of each type for a nice variety
        });

        if (error) {
          console.error('RPC error:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          setSpecies(data);
        } else {
          // 🦁 Use fallback if DB returns nothing
          console.log('No DB species found, checking fallback zones...');
          if (location.lat > 60) {
            setSpecies(DEMO_SPECIES_BY_ZONE['arctic']);
          } else if (location.lat < -60) {
            setSpecies(DEMO_SPECIES_BY_ZONE['antarctic']);
          }
        }
      } catch (err) {
        console.error('Error fetching park species, using fallback:', err);
        // Fallback on error too
        if (location.lat > 60) {
          setSpecies(DEMO_SPECIES_BY_ZONE['arctic']);
        } else if (location.lat < -60) {
          setSpecies(DEMO_SPECIES_BY_ZONE['antarctic']);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchSpecies();
  }, [location.lat, location.lng]);

  const getIconForGroup = (group: string) => {
    const g = group.toLowerCase();
    if (g.includes('plant')) return <TreePine className="h-4 w-4 text-green-500" />;
    if (g.includes('fish') || g.includes('marine')) return <Fish className="h-4 w-4 text-blue-500" />;
    if (g.includes('bird')) return <Bird className="h-4 w-4 text-sky-500" />;
    if (g.includes('insect')) return <Bug className="h-4 w-4 text-amber-500" />;
    return <PawPrint className="h-4 w-4 text-orange-500" />;
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in flex flex-col max-h-[calc(100vh-120px)]">
      {/* Location Image or Placeholder */}
      <div className="w-full shrink-0">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🌳</div>
              <p className="text-sm text-muted-foreground">Wildlife Park</p>
            </div>
          </div>
        )}
      </div>

      {/* Content Scroll Area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
          <p className="text-sm text-primary mb-4">{getLocationType()}</p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2 mb-6">
            {rating && (
              <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Rating</p>
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-primary">{rating.toFixed(1)}</p>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
            )}

            {area && area > 0 && (
              <div className="bg-white/5 p-2 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Area</p>
                <p className="text-sm font-semibold text-primary">
                  {area >= 1000 ? `${(area / 1000).toFixed(1)}k km²` : `${area.toFixed(0)} km²`}
                </p>
              </div>
            )}
            
            <div className="bg-white/5 p-2 rounded-lg col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Coordinates</p>
              <p className="text-xs font-mono text-primary">
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            </div>
          </div>

          {/* 🦁 Wildlife Section (New!) */}
          <div className="mb-4">
            <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <PawPrint className="h-4 w-4 text-primary" />
              Local Wildlife
            </h4>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : species.length > 0 ? (
              <div className="space-y-2">
                {species.map((sp) => (
                  <div key={sp.id} className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                    <Avatar className="h-10 w-10 rounded-md border border-white/10">
                      <AvatarImage src={sp.image_url || undefined} className="object-cover" />
                      <AvatarFallback className="rounded-md bg-black/20">
                        {getIconForGroup(sp.taxonomic_group)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {sp.common_name || sp.scientific_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {sp.taxonomic_group}
                        </span>
                        {sp.conservation_status && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            ['CR', 'EN', 'VU'].includes(sp.conservation_status) 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {sp.conservation_status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed border-white/10 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  No specific species records found for this location area.
                </p>
              </div>
            )}
          </div>

          {address && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
              <MapPin className="h-3 w-3" />
              <span>{address}</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default WildlifeLocationCard;
