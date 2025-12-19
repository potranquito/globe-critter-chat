import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RegionSpecies } from '@/services/regionService';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { SpeciesTypeFilter, type SpeciesTypeFilter as SpeciesTypeFilterType } from '@/components/SpeciesTypeFilter';
import { InfoCard } from '@/components/InfoCard';
import { ParkList } from '@/components/ParkList';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';
import { SpeciesInfoPopup } from '@/components/SpeciesInfoPopup';

const ParkSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const ecoRegionId = searchParams.get('ecoRegionId');
  const regionName = searchParams.get('regionName');
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');

  const [wildlifePlaces, setWildlifePlaces] = useState<any[]>([]);
  const [protectedAreas, setProtectedAreas] = useState<any[]>([]);
  const [selectedPark, setSelectedPark] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [regionSpecies, setRegionSpecies] = useState<RegionSpecies[]>([]);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);
  const [speciesTypeFilter, setSpeciesTypeFilter] = useState<SpeciesTypeFilterType>('all');
  const [ecoregionData, setEcoregionData] = useState<any>(null);

  // Map center state - will be updated based on park locations
  const [mapCenter, setMapCenter] = useState({ lat, lng });
  const [mapZoom, setMapZoom] = useState(4);

  // Species info popup state
  const [speciesPopupOpen, setSpeciesPopupOpen] = useState(false);
  const [selectedSpeciesForPopup, setSelectedSpeciesForPopup] = useState<RegionSpecies | null>(null);

  useEffect(() => {
    if (!ecoRegionId || !regionName) {
      toast({
        title: "⚠️ Missing Information",
        description: "Please select an eco-region from the globe",
        variant: "destructive"
      });
      navigate('/');
      return;
    }

    const loadEcoRegionData = async () => {
      try {
        setIsLoading(true);
        const { supabase } = await import('@/integrations/supabase/client');

        // 🌍 Fetch ecoregion data from database (for image_url, etc.)
        console.log('🌍 Fetching ecoregion data for:', regionName);
        try {
          const ecoregionResult = await supabase
            .from('ecoregions')
            .select('id, name, image_url, image_attribution')
            .ilike('name', `%${regionName}%`)
            .single();

          if (ecoregionResult.data) {
            console.log('✅ Ecoregion data loaded:', ecoregionResult.data);
            setEcoregionData(ecoregionResult.data);
          } else {
            console.warn('⚠️ Ecoregion not found in database:', regionName);
          }
        } catch (ecoregionError) {
          console.error('[Ecoregion] ❌ Error fetching ecoregion data:', ecoregionError);
        }

        // Load parks for this eco-region
        const isHighLatitude = Math.abs(lat) > 60;
        const boundsRadius = isHighLatitude ? 25 : 10;

        console.log('🏞️ Park search params:', {
          regionName,
          centerLat: lat,
          centerLng: lng,
          isHighLatitude,
          boundsRadius
        });

        // Query parks from database
        let parksQuery = supabase
          .from('parks')
          .select('id, name, center_lat, center_lng, park_type, size_km2, wdpa_id, protection_status, image_url, image_attribution')
          .gte('center_lat', lat - boundsRadius)
          .lte('center_lat', lat + boundsRadius)
          .not('center_lat', 'is', null)
          .not('center_lng', 'is', null);

        // Only filter by longitude for non-polar regions
        if (!isHighLatitude) {
          parksQuery = parksQuery
            .gte('center_lng', lng - boundsRadius)
            .lte('center_lng', lng + boundsRadius);
        }

        const { data: parksData, error: parksError } = await parksQuery
          .order('size_km2', { ascending: false })
          .limit(50);

        if (parksError) {
          console.error('❌ Park query error:', parksError);
        }

                  if (!parksError && parksData) {
                    console.log(`✅ Found ${parksData.length} parks`);
                    const parks = parksData.map(park => ({
                      ...park,
                      lat: park.center_lat,
                      lng: park.center_lng,
                    }));
        
                    // 🧪 DEMO: Inject a "Drone Unit" Conservancy marker for Mara region testing
                    if (regionName?.toLowerCase().includes('mara') || regionName?.toLowerCase().includes('maasai')) {
                      console.log('🧪 Injecting Demo Conservancy for Drone Lesson');
                      parks.push({
                        id: 'demo-conservancy-drone',
                        name: 'Mara North Conservancy (Drone Unit)',
                        lat: lat + 0.1, // Slight offset north
                        lng: lng + 0.1, // Slight offset east
                        park_type: 'Conservancy',
                        size_km2: 300,
                        // Placeholder tech/drone image
                        image_url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?q=80&w=2070&auto=format&fit=crop', 
                        image_attribution: 'Unsplash',
                        protection_status: 'Community Conservancy'
                      });
                    }
        
                    setWildlifePlaces(parks);
        
                    // Calculate optimal map center based on park locations
            if (parks.length > 0) {
            const validParks = parks.filter(p => p.lat && p.lng);
            if (validParks.length > 0) {
              const avgLat = validParks.reduce((sum, p) => sum + p.lat, 0) / validParks.length;
              const avgLng = validParks.reduce((sum, p) => sum + p.lng, 0) / validParks.length;

              // Check if this is the Mara region (conservation locations are clustered)
              const isMara = regionName?.toLowerCase().includes('mara') || regionName?.toLowerCase().includes('maasai');

              const isHighLatitude = Math.abs(avgLat) > 60;

              let adjustedLat, adjustedLng;

              if (isMara) {
                // For Mara, adjust center to be more north and east to frame icons properly
                adjustedLat = avgLat + 0.02; // Move north
                adjustedLng = avgLng + 0.64; // Move far east
              } else {
                // For other regions, use standard offset
                const latitudeOffset = isHighLatitude ? 8 : 3;
                adjustedLat = avgLat - latitudeOffset;
                adjustedLng = avgLng;
              }

              console.log(`🎯 Centering map on parks: lat=${adjustedLat.toFixed(2)}, lng=${adjustedLng.toFixed(2)}, isMara=${isMara}`);
              setMapCenter({ lat: adjustedLat, lng: adjustedLng });

              // Use higher zoom for Mara region but not too close
              if (isMara) {
                setMapZoom(10);
              } else {
                setMapZoom(isHighLatitude ? 3 : 5);
              }
            }
          }
        }

        // Load species using MCP server
        const { getRegionSpecies } = await import('@/services/mcpClient');

        console.log('🌿 Loading species with params:', {
          ecoregionName: regionName,
          limit: 200
        });

        if (regionName && regionName.trim() !== '') {
          try {
            const speciesResult = await getRegionSpecies({
              ecoregionName: regionName,
              limit: 200
            });

            console.log('🌿 MCP species result:', speciesResult);

            if (speciesResult.success && speciesResult.species) {
              console.log(`✅ Found ${speciesResult.species.length} species via MCP`);

              const mappedSpecies: RegionSpecies[] = speciesResult.species.map(species => ({
                scientificName: species.scientific_name,
                commonName: species.common_name || species.scientific_name,
                animalType: species.species_type || 'Unknown',
                conservationStatus: species.conservation_status || 'Unknown',
                occurrenceCount: 1,
                speciesType: species.species_type || undefined,
                dietaryCategory: species.dietary_category || undefined,
                imageKeyword: species.common_name || species.scientific_name,
                imageUrl: species.image_url || undefined,
                description: species.description || undefined,
                isInvasive: species.is_invasive || false,
                isVenomous: species.is_venomous || false,
                habitatInfo: species.habitat_info || undefined,
              }));

              // Remove duplicates and filter out species without images
              const seenImages = new Set<string>();
              const uniqueSpecies = mappedSpecies.filter(species => {
                if (!species.imageUrl) return false;
                if (seenImages.has(species.imageUrl)) return false;
                seenImages.add(species.imageUrl);
                return true;
              });

              console.log(`🔧 Removed ${mappedSpecies.length - uniqueSpecies.length} duplicate images`);
              setRegionSpecies(uniqueSpecies);
            } else {
              console.warn('❌ MCP returned unsuccessful result:', speciesResult.error);
            }
          } catch (mcpError) {
            console.warn('❌ MCP species fetch failed, continuing without species:', mcpError);
          }
        }

        setIsLoading(false);

      } catch (error) {
        console.error('Failed to load eco-region data:', error);
        toast({
          title: "⚠️ Loading Failed",
          description: "Could not load park data for this region",
          variant: "destructive"
        });
        setIsLoading(false);
      }
    };

    loadEcoRegionData();
  }, [ecoRegionId, regionName, lat, lng, navigate, toast]);

  const handleParkClick = (point: any) => {
    console.log('🏞️ Park clicked:', point);
    
    // 🐘 SPECIAL: Mara Elephant Project Education Experience
    // If we are in the Mara region, launch the interactive video lesson instead of trivia
    const isMaraRegion = regionName?.toLowerCase().includes('mara') || regionName?.toLowerCase().includes('maasai');
    if (isMaraRegion) {
      console.log('🐘 Launching Mara Elephant Project Education Experience');
      
      // Determine which lesson to show based on park name
      // Conservancies often use high-tech monitoring like drones
      const isConservancy = point.name?.toLowerCase().includes('conservancy');
      const lessonId = isConservancy ? 'mara-drone-1' : 'mara-fence-1';
      
      navigate(`/education/mara?lessonId=${lessonId}`);
      return;
    }

    console.log('📊 Passing species to trivia page:', {
      count: regionSpecies.length,
      sample: regionSpecies.slice(0, 3).map(s => s.commonName)
    });

    setSelectedPark(point);
    setSelectedCarouselSpecies(null);

    // Navigate directly to trivia/learning page for this park
    navigate('/trivia', {
      state: {
        ecoRegionId,
        regionName,
        parkId: point.id,
        parkName: point.name,
        lat: point.lat || point.center_lat,
        lng: point.lng || point.center_lng,
        regionSpecies: regionSpecies,
        parkData: point
      }
    });
  };

  const handleDoubleClick = () => {
    // Prevent any zoom changes on double click
    return;
  };

  const handleSpeciesClick = (species: RegionSpecies) => {
    console.log('Species clicked:', species);
    setSelectedCarouselSpecies(species);
    setSelectedPark(null);

    // Show info popup
    setSelectedSpeciesForPopup(species);
    setSpeciesPopupOpen(true);
  };

  const handleLearnMoreInPark = (parkNames: string[]) => {
    // Find first park and navigate to it
    const park = wildlifePlaces.find(p => parkNames.includes(p.name));
    if (park) {
      handleParkClick(park);
    }
    setSpeciesPopupOpen(false);
  };

  // Filter species based on selected type
  const filteredSpecies = regionSpecies.filter(species => {
    if (speciesTypeFilter === 'all') return true;

    const dietaryCategory = species.dietaryCategory?.toLowerCase();

    switch (speciesTypeFilter) {
      case 'carnivores':
        return dietaryCategory === 'carnivore';
      case 'herbivores':
        return dietaryCategory === 'herbivore';
      case 'omnivores':
        return dietaryCategory === 'omnivore';
      case 'producers':
        return dietaryCategory === 'producer' || species.animalType?.toLowerCase() === 'plant';
      default:
        return true;
    }
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-green-900 via-teal-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-3xl mb-4">Loading {regionName}...</div>
          <div className="text-white/60">Finding protected areas and wildlife parks</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Google Earth Map */}
      <div className="absolute inset-0 z-0">
        <GoogleEarthMap
          habitats={[]}
          onPointClick={handleParkClick}
          onDoubleGlobeClick={handleDoubleClick}
          onImageMarkerClick={handleParkClick}
          center={mapCenter}
          zoom={mapZoom}
          wildlifePlaces={wildlifePlaces}
          protectedAreas={protectedAreas}
          locationName={regionName || ''}
          disableMarkerZoom={true}
        />
      </div>

      {/* Left Sidebar - Species Type Filter */}
      {regionSpecies.length > 0 && (
        <div className="absolute left-4 top-24 z-40 pointer-events-auto">
          <SpeciesTypeFilter
            activeFilter={speciesTypeFilter}
            onFilterChange={setSpeciesTypeFilter}
          />
        </div>
      )}

      {/* Left Sidebar - Species Carousel */}
      {regionSpecies.length > 0 && (
        <div className="absolute left-20 top-24 bottom-24 z-40 pointer-events-auto" style={{ width: '280px' }}>
          <RegionSpeciesCarousel
            species={filteredSpecies}
            regionName={regionName || 'Unknown Region'}
            currentSpecies={selectedCarouselSpecies?.scientificName}
            onSpeciesSelect={handleSpeciesClick}
            disableAutoScroll={false}
          />
        </div>
      )}

      {/* Header Bar - Top */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex justify-between items-center px-4 py-2">
          {/* Back to Globe - Far Left */}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12"
          >
            ← Back to Globe
          </Button>

          {/* Global Health Bar - Center */}
          <div className="flex-1 flex justify-center">
            <GlobalHealthBar variant="compact" />
          </div>
        </div>
      </div>

      {/* Right Side - Info Panel */}
      <div className="absolute right-6 top-24 z-40 pointer-events-auto" style={{ width: '360px' }}>
        <div className="flex flex-col gap-4">
          {/* Eco-region Card */}
          <InfoCard
            type="ecoregion"
            regionName={regionName || 'Unknown Region'}
            speciesCount={regionSpecies.length}
            locationCount={wildlifePlaces.length + protectedAreas.length}
            imageUrl={ecoregionData?.image_url}
            imageAttribution={ecoregionData?.image_attribution}
          />

          {/* Glowing Call-to-Action Banner */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 p-4 border border-primary/40 animate-pulse-glow glass-panel">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
            <p className="relative text-base font-semibold text-primary text-center flex items-center justify-center gap-2">
              <span className="text-2xl">👇</span>
              <span>Select park to start learning</span>
            </p>
          </div>

          {/* Park List */}
          <ParkList
            parks={[...wildlifePlaces, ...protectedAreas]}
            selectedPark={selectedPark}
            onParkClick={handleParkClick}
          />
        </div>
      </div>

      {/* Species Info Popup */}
      <SpeciesInfoPopup
        species={selectedSpeciesForPopup}
        isOpen={speciesPopupOpen}
        onClose={() => {
          setSpeciesPopupOpen(false);
          setSelectedSpeciesForPopup(null);
        }}
        onLearnMore={handleLearnMoreInPark}
        availableParks={wildlifePlaces.slice(0, 3).map(p => p.name)}
      />
    </div>
  );
};

export default ParkSelectionPage;
