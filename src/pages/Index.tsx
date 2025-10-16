import { useState, useMemo, useEffect } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { UserProfile } from '@/components/UserProfile';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';
import FastFactsCard from '@/components/FastFactsCard';
import RegionSpeciesCard from '@/components/RegionSpeciesCard';
import ExpandedImageView from '@/components/ExpandedImageView';
import { HabitatInfoCard } from '@/components/HabitatInfoCard';
import { HabitatFactsCard } from '@/components/HabitatFactsCard';
import { HabitatSpeciesList } from '@/components/HabitatSpeciesList';
import { SearchLoader } from '@/components/SearchLoader';
import WildlifeLocationCard from '@/components/WildlifeLocationCard';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { LocationsCarousel } from '@/components/LocationsCarousel';
import { EcoRegionCard } from '@/components/EcoRegionCard';
import { SpeciesTypeFilter, type SpeciesTypeFilter as SpeciesTypeFilterType } from '@/components/SpeciesTypeFilter';
import { FoodWebSelectionBar } from '@/components/FoodWebSelectionBar';
import { useToast } from '@/hooks/use-toast';
import { useLocationDiscovery } from '@/hooks/useLocationDiscovery';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCuratedSpecies, hasCuratedData } from '@/data/curatedSpecies';
import type { HabitatRegion } from '@/types/habitat';
import { performRegionAnalysis } from '@/services/regionService';
import type { RegionInfo, RegionSpecies } from '@/services/regionService';
import type { FilterCategory } from '@/types/speciesFilter';
import { sendEducationMessage, type EducationContext } from '@/services/educationAgent';
import polarBearReal from '@/assets/polar-bear-real.jpg';
import threatIceLoss from '@/assets/threat-ice-loss.jpg';
import threatPollution from '@/assets/threat-pollution.jpg';
import threatHumanActivity from '@/assets/threat-human-activity.jpg';
import ecosystemSeal from '@/assets/ecosystem-seal.jpg';
import ecosystemWalrus from '@/assets/ecosystem-walrus.jpg';
import ecosystemFish from '@/assets/ecosystem-fish.jpg';

// Regional species data
const regionalSpecies: any = {
  arctic: {
    name: 'Arctic Region',
    animals: [
      { id: 'polar-bear', name: 'Polar Bear', population: '22,000 - 31,000', emoji: '🐻‍❄️' },
      { id: 'arctic-fox', name: 'Arctic Fox', population: 'Several hundred thousand', emoji: '🦊' },
      { id: 'beluga', name: 'Beluga Whale', population: '~150,000', emoji: '🐋' },
      { id: 'narwhal', name: 'Narwhal', population: '~80,000', emoji: '🦄' },
      { id: 'walrus', name: 'Walrus', population: '~225,000', emoji: '🦭' },
      { id: 'snowy-owl', name: 'Snowy Owl', population: '~28,000', emoji: '🦉' },
    ]
  },
  antarctic: {
    name: 'Antarctic Region',
    animals: [
      { id: 'emperor-penguin', name: 'Emperor Penguin', population: '~595,000', emoji: '🐧' },
      { id: 'leopard-seal', name: 'Leopard Seal', population: '~35,000', emoji: '🦭' },
      { id: 'blue-whale', name: 'Blue Whale', population: '10,000 - 25,000', emoji: '🐋' },
    ]
  },
  tropical: {
    name: 'Tropical Region',
    animals: [
      { id: 'orangutan', name: 'Orangutan', population: '~100,000', emoji: '🦧' },
      { id: 'tiger', name: 'Tiger', population: '~4,500', emoji: '🐯' },
      { id: 'elephant', name: 'Asian Elephant', population: '~50,000', emoji: '🐘' },
    ]
  }
};

// Sample habitat data with species info
const speciesData: any = {
  'polar-bear': {
    habitats: [
      { lat: 71.2, lng: -156.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 78.9, lng: 11.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 69.6, lng: 18.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 74.4, lng: -95.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
    ],
    info: {
      commonName: 'Polar Bear',
      animalType: 'Mammal',
      population: '22,000 - 31,000',
      populationTrend: 'decreasing' as const,
      conservationStatus: 'Vulnerable',
      threats: 'Sea ice loss from climate change, pollution, and oil spills',
      threatImages: [threatIceLoss, threatPollution, threatHumanActivity],
      imageUrl: polarBearReal,
      ecosystemImages: [ecosystemSeal, ecosystemWalrus, ecosystemFish],
      ecosystem: [
        { name: 'Ringed Seal', role: 'Primary prey', icon: '🦭' },
        { name: 'Bearded Seal', role: 'Food source', icon: '🦭' },
        { name: 'Walrus', role: 'Occasional prey', icon: '🦣' },
        { name: 'Arctic Cod', role: 'Indirect food source', icon: '🐟' },
        { name: 'Phytoplankton', role: 'Base of food web', icon: '🦠' }
      ]
    }
  },
  'arctic-fox': {
    habitats: [
      { lat: 70.0, lng: -150.0, species: 'Arctic Fox', size: 0.6, color: '#94A3B8' }
    ],
    info: {
      commonName: 'Arctic Fox',
      animalType: 'Mammal',
      population: 'Several hundred thousand',
      populationTrend: 'stable' as const,
      conservationStatus: 'Least Concern',
      threats: 'Climate change and competition with red foxes',
      threatImages: [threatIceLoss, threatHumanActivity, threatPollution],
      imageUrl: polarBearReal,
      ecosystemImages: [ecosystemSeal, ecosystemWalrus, ecosystemFish],
      ecosystem: [
        { name: 'Lemmings', role: 'Primary prey', icon: '🐁' },
        { name: 'Arctic Birds', role: 'Food source', icon: '🦅' },
        { name: 'Seal Carcasses', role: 'Scavenged food', icon: '🦭' }
      ]
    }
  },
  'beluga': {
    habitats: [
      { lat: 75.0, lng: -100.0, species: 'Beluga Whale', size: 0.7, color: '#E0E7FF' }
    ],
    info: {
      commonName: 'Beluga Whale',
      animalType: 'Mammal',
      population: '~150,000',
      populationTrend: 'stable' as const,
      conservationStatus: 'Least Concern',
      threats: 'Pollution, shipping traffic, and habitat loss',
      threatImages: [threatPollution, threatHumanActivity, threatIceLoss],
      imageUrl: polarBearReal,
      ecosystemImages: [ecosystemFish, ecosystemSeal, ecosystemWalrus],
      ecosystem: [
        { name: 'Arctic Cod', role: 'Primary prey', icon: '🐟' },
        { name: 'Shrimp', role: 'Food source', icon: '🦐' },
        { name: 'Squid', role: 'Food source', icon: '🦑' }
      ]
    }
  }
};

const Index = () => {
  const { toast } = useToast();
  const locationDiscovery = useLocationDiscovery();
  const [habitats, setHabitats] = useState<any[]>([]);
  const [currentSpecies, setCurrentSpecies] = useState<string | null>(null);
  const [speciesInfo, setSpeciesInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPins, setUserPins] = useState<any[]>([]);
  const [pinImagesVisible, setPinImagesVisible] = useState(false);
  const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [regionalAnimals, setRegionalAnimals] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{url: string; type: 'threat' | 'ecosystem'; index: number} | null>(null);
  const [imageMarkers, setImageMarkers] = useState<any[]>([]);
  const [chatMessage, setChatMessage] = useState<string>('');
  const [conservationLayers, setConservationLayers] = useState<any[]>([]);
  const [activeLayers, setActiveLayers] = useState<Array<{ name: string; count: number }>>([]);
  const [useGoogleMaps, setUseGoogleMaps] = useState(false);
  const [resetGlobeView, setResetGlobeView] = useState(false);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(3);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [wildlifePlaces, setWildlifePlaces] = useState<any[]>([]);
  const [protectedAreas, setProtectedAreas] = useState<any[]>([]);
  const [locationName, setLocationName] = useState<string>('');
  const [currentHabitat, setCurrentHabitat] = useState<HabitatRegion | null>(null);
  const [selectedWildlifePark, setSelectedWildlifePark] = useState<any>(null);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [regionSpecies, setRegionSpecies] = useState<RegionSpecies[]>([]);
  const [activeSpeciesFilters, setActiveSpeciesFilters] = useState<Set<FilterCategory>>(new Set());
  const [speciesTypeFilter, setSpeciesTypeFilter] = useState<SpeciesTypeFilterType>('all');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isDeepDiveMode, setIsDeepDiveMode] = useState(false);
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState<number>(0);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);
  const [habitatZones, setHabitatZones] = useState<any[]>([]); // NEW: Transparent habitat overlays
  const [searchType, setSearchType] = useState<'species' | 'location' | null>(null); // Track search type
  const [isViewingEcoRegion, setIsViewingEcoRegion] = useState(false); // Track if viewing eco-region
  const [ecoRegionPins, setEcoRegionPins] = useState<any[]>([]); // NEW: WWF ecoregions from database

  // ✅ NEW: AbortController to cancel pending API calls on reset
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // ✅ NEW: Separate loading state for background fetches (wildlife, protected areas)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  // ✅ NEW: Education context tracks the current card for context-aware chat
  const [educationContext, setEducationContext] = useState<EducationContext | null>(null);

  // 🎮 NEW: Food web game - selected species for trivia
  interface SelectedFoodWebSpecies {
    carnivore: RegionSpecies | null;
    herbivoreOmnivore: RegionSpecies | null;
    producer: RegionSpecies | null;
  }
  const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState<SelectedFoodWebSpecies>({
    carnivore: null,
    herbivoreOmnivore: null,
    producer: null
  });

  // 🌍 Load WWF ecoregions from database on mount
  useEffect(() => {
    const loadEcoRegions = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: ecoregions, error } = await supabase
          .from('ecoregions')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error loading ecoregions:', error);
          return;
        }

        if (ecoregions) {
          // Convert database ecoregions to pin format (include image_url for later use)
          const pins = ecoregions.map(eco => ({
            lat: eco.center_lat,
            lng: eco.center_lng,
            species: eco.name,
            name: eco.name,
            size: 1.2,
            color: eco.realm === 'Marine' ? '#3b82f6' : '#22c55e', // Blue for marine, green for terrestrial
            type: 'habitat' as const,
            emoji: '🟢', // Green pin with pulse animation
          }));
          setEcoRegionPins(pins);
          console.log(`✅ Loaded ${pins.length} WWF ecoregions from database`);
        }
      } catch (err) {
        console.error('Failed to load ecoregions:', err);
      }
    };

    loadEcoRegions();
  }, []);

  // 📚 Update education context whenever the right-side card changes
  useEffect(() => {
    console.log('🔍 Education context update check:', {
      selectedCarouselSpecies: selectedCarouselSpecies?.commonName,
      selectedWildlifePark: selectedWildlifePark?.name,
      isViewingEcoRegion,
      regionInfo: regionInfo?.regionName,
      useGoogleMaps
    });

    // Priority 1: Carousel Species Card
    if (selectedCarouselSpecies && regionInfo) {
      console.log('✅ Setting education context: SPECIES', selectedCarouselSpecies.commonName);
      setEducationContext({
        type: 'species',
        displayName: selectedCarouselSpecies.commonName,
        data: {
          commonName: selectedCarouselSpecies.commonName,
          scientificName: selectedCarouselSpecies.scientificName,
          animalType: selectedCarouselSpecies.animalType,
          conservationStatus: selectedCarouselSpecies.conservationStatus,
          regionName: regionInfo.regionName,
          occurrenceCount: selectedCarouselSpecies.occurrenceCount,
        },
      });
      return;
    }

    // Priority 2: Wildlife Park/Protected Area Card
    if (selectedWildlifePark) {
      console.log('✅ Setting education context: PARK', selectedWildlifePark.name);
      setEducationContext({
        type: 'park',
        displayName: selectedWildlifePark.name,
        data: {
          name: selectedWildlifePark.name,
          location: selectedWildlifePark.location || selectedWildlifePark,
          designation: selectedWildlifePark.designation,
          description: selectedWildlifePark.description,
        },
      });
      return;
    }

    // Priority 3: Eco-Region Card
    if (isViewingEcoRegion && regionInfo) {
      console.log('✅ Setting education context: ECOREGION', regionInfo.regionName);
      setEducationContext({
        type: 'ecoregion',
        displayName: regionInfo.regionName,
        data: {
          regionName: regionInfo.regionName,
          description: regionInfo.description,
          speciesCount: regionSpecies.length,
        },
      });
      return;
    }

    // No card showing - clear education context
    console.log('❌ Clearing education context');
    setEducationContext(null);
  }, [selectedCarouselSpecies, selectedWildlifePark, isViewingEcoRegion, regionInfo, regionSpecies, useGoogleMaps]);

  // 🎯 HANDLE ECO-REGION CLICK: Switch to 2D map view centered on region
  const handleEcoRegionClick = async (point: any) => {
    console.log('Eco-region clicked:', point.name);
    setHasInteracted(true);

    // Add slower transition - delay switching to 2D map view
    setTimeout(() => {
      setUseGoogleMaps(true);
    }, 1200); // 1.2 second delay for smoother visual transition

    setMapCenter({ lat: point.lat, lng: point.lng });
    setLocationName(point.name);
    setCurrentZoomLevel(4); // Zoom level 4 shows ~2000km radius, better for seeing multiple parks

    // ✅ Mark that we're viewing an eco-region
    setIsViewingEcoRegion(true);

    // Clear other states to ensure only eco-region card shows
    setSpeciesInfo(null);
    setCurrentHabitat(null);
    setSelectedCarouselSpecies(null);
    setSelectedWildlifePark(null);
    setExpandedImage(null);
    setRegionalAnimals(null); // Clear hardcoded regional animals popup
    setSelectedRegion(null); // Clear hardcoded regional animals popup

    toast({
      title: `Exploring ${point.name}`,
      description: 'Loading species and protected areas...',
    });

    // ✅ Set placeholder region info immediately for instant UI
    const placeholderRegion: RegionInfo = {
      regionName: point.name,
      centerLat: point.lat,
      centerLng: point.lng,
      description: `Discovering species in ${point.name}...`
    };

    setRegionInfo(placeholderRegion);
    setRegionSpecies([]);
    setWildlifePlaces([]);
    setProtectedAreas([]);
    setActiveSpeciesFilters(new Set()); // Start with no filters active - user can toggle them
    setIsLoading(false); // Stop main loading early
    setIsBackgroundLoading(true); // Show background loading

    // ✅ Load data for this eco-region directly from IUCN database
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      // Step 1: Find the ecoregion in database by name (including image data)
      const { data: ecoregionData, error: ecoregionError } = await supabase
        .from('ecoregions')
        .select('*')
        .eq('name', point.name)
        .limit(1)
        .single();

      if (ecoregionError || !ecoregionData) {
        console.warn('Ecoregion not found in database:', point.name, 'Using geographic fallback');

        // FALLBACK: Query by geographic bounds instead of ecoregion_id
        const boundsRadius = 10; // degrees (~1100km) - larger radius to catch more parks

        // Get parks within geographic bounds (with deduplication)
        const { data: parksData, error: parksError } = await supabase
          .from('parks')
          .select('id, name, center_lat, center_lng, park_type, size_km2, wdpa_id, protection_status, image_url, image_attribution')
          .gte('center_lat', point.lat - boundsRadius)
          .lte('center_lat', point.lat + boundsRadius)
          .gte('center_lng', point.lng - boundsRadius)
          .lte('center_lng', point.lng + boundsRadius)
          .not('center_lat', 'is', null)
          .not('center_lng', 'is', null)
          .order('size_km2', { ascending: false });

        // Determine ecoregion type from name for fallback
        const isFallbackMarine = point.name.toLowerCase().includes('coral') ||
                                 point.name.toLowerCase().includes('marine') ||
                                 point.name.toLowerCase().includes('ocean');
        const isFallbackArctic = point.name.toLowerCase().includes('arctic');

        // Filter parks by marine/terrestrial before deduplication
        let filteredParksData = (parksData || []).map(park => {
          // Marine percentage - we don't have marine_area_km2 in our schema
          // Use park name keywords to determine if marine
          const marinePercentage = 0;

          // Check if park name contains marine keywords
          const parkName = (park.name || '').toLowerCase();
          const hasMarineKeyword = parkName.includes('marine') ||
                                   parkName.includes('coral') ||
                                   parkName.includes('reef') ||
                                   parkName.includes('ocean') ||
                                   parkName.includes('sea') ||
                                   parkName.includes('coastal');

          // Determine if marine based on percentage OR keywords
          const isMarinePark = marinePercentage > 50 || hasMarineKeyword;

          return {
            ...park,
            isMarinePark
          };
        });

        if (isFallbackMarine) {
          // Marine regions: only marine parks
          filteredParksData = filteredParksData.filter(p => p.isMarinePark);
        } else if (!isFallbackArctic) {
          // Non-Arctic terrestrial: only terrestrial parks
          filteredParksData = filteredParksData.filter(p => !p.isMarinePark);
        }
        // Arctic: keep both types

        console.log(`🏞️ Fallback park filtering: ${isFallbackMarine ? 'Marine' : isFallbackArctic ? 'Arctic (mixed)' : 'Terrestrial'}`);
        console.log(`  Filtered to ${filteredParksData.length} parks from ${parksData?.length || 0}`);

        // Deduplicate by WDPA ID (some parks might have duplicate entries)
        const uniqueParks = filteredParksData.filter((park, index, self) =>
          index === self.findIndex(p => p.wdpa_id === park.wdpa_id || p.name === park.name)
        ).slice(0, 3);

        const parks = uniqueParks;
        console.log(`Found ${parks.length} parks near ${point.name} using geographic bounds`);

        // Get species within geographic bounds using PostGIS spatial query
        // Create a bounding box polygon for the region
        const bbox = `POLYGON((${point.lng - boundsRadius} ${point.lat - boundsRadius}, ${point.lng + boundsRadius} ${point.lat - boundsRadius}, ${point.lng + boundsRadius} ${point.lat + boundsRadius}, ${point.lng - boundsRadius} ${point.lat + boundsRadius}, ${point.lng - boundsRadius} ${point.lat - boundsRadius}))`;

        const { data: speciesData, error: speciesError } = await supabase.rpc('get_species_in_bounds', {
          bbox_wkt: bbox,
          max_results: 30
        });

        // Get diverse species mix - 2-3 of each major taxonomic class
        console.log('Fetching diverse species mix...');

        const taxonomicClasses = [
          { class: 'MAMMALIA', label: 'Mammal', limit: 3 },
          { class: 'AVES', label: 'Bird', limit: 3 },
          { class: 'REPTILIA', label: 'Reptile', limit: 3 },
          { class: 'AMPHIBIA', label: 'Amphibian', limit: 3 },
          { kingdom: 'PLANTAE', label: 'Plant', limit: 3 }
        ];

        const speciesPromises = taxonomicClasses.map(async (taxon) => {
          // Build query with geographic filtering using PostGIS
          // ST_Intersects checks if species range overlaps with our bounding box
          const { data, error } = await supabase.rpc('get_diverse_species_in_region', {
            region_lat: point.lat,
            region_lng: point.lng,
            radius_degrees: boundsRadius,
            taxonomic_class: taxon.class || null,
            taxonomic_kingdom: taxon.kingdom || null,
            max_results: taxon.limit
          });

          if (error) {
            // Fallback: Get any species of this class/kingdom (not geographically filtered)
            console.warn(`Geographic query failed for ${taxon.label}, using fallback`);
            let query = supabase
              .from('species')
              .select('id, scientific_name, common_name, conservation_status, class, kingdom, image_url');

            if (taxon.class) {
              query = query.eq('class', taxon.class);
            } else if (taxon.kingdom) {
              query = query.eq('kingdom', taxon.kingdom);
            }

            // Prioritize species with common names in fallback too
            query = query.order('common_name', { ascending: true, nullsLast: true });

            const { data: fallbackData, error: fallbackError } = await query.limit(taxon.limit);

            if (fallbackError) {
              console.error(`Fallback also failed for ${taxon.label}:`, fallbackError);
            }

            console.log(`Fallback got ${fallbackData?.length || 0} ${taxon.label}s`);
            return fallbackData || [];
          }

          console.log(`Geographic query got ${data?.length || 0} ${taxon.label}s`);
          return data || [];
        });

        const speciesArrays = await Promise.all(speciesPromises);
        const allSpecies = speciesArrays.flat();

        const speciesList = allSpecies.map((species: any) => {
          const result = {
            scientificName: species.scientific_name,
            commonName: species.common_name || species.scientific_name, // Fallback to scientific name
            animalType: species.class || species.kingdom || 'Unknown',
            conservationStatus: species.conservation_status || 'NE',
            occurrenceCount: 0,
            imageUrl: species.image_url || null // Will handle placeholder in component
          };
          return result;
        });

        console.log(`Fetched ${speciesList.length} diverse species:`,
          speciesArrays.map((arr, i) => `${taxonomicClasses[i].label}: ${arr.length}`).join(', ')
        );

        // Debug: Log first species to see what data looks like
        if (speciesList.length > 0) {
          console.log('Sample species data:', speciesList[0]);
        }

        console.log(`Found ${speciesList.length} species near ${point.name}`);

        if (speciesList.length === 0) {
          console.warn('No species found in database. Database may be empty or species need geographic_range data.');
        }

        // Set fallback data
        setRegionInfo({
          regionName: point.name,
          centerLat: point.lat,
          centerLng: point.lng,
          description: `Exploring wildlife in ${point.name}`
        });

        setRegionSpecies(speciesList);
        console.log('🔍 Species carousel visibility check (geographic fallback):', {
          speciesCount: speciesList.length,
          shouldShow: speciesList.length > 0
        });

        // Transform parks to expected format
        const formattedParks = parks.map((park: any) => ({
          id: park.id,
          name: park.name,
          lat: park.center_lat,
          lng: park.center_lng,
          location: {
            lat: park.center_lat,
            lng: park.center_lng
          },
          designation: park.designation_eng,
          area: park.gis_area_km2 ? `${park.gis_area_km2.toFixed(0)} km²` : undefined,
          type: park.iucn_category || 'Protected Area'
        }));

        setProtectedAreas(formattedParks);
        setWildlifePlaces([]);
        setIsBackgroundLoading(false);

        toast({
          title: `${point.name} Loaded`,
          description: `Found ${speciesList.length} species and ${parks.length} protected areas`,
        });

        return;
      }

      console.log('Found ecoregion:', ecoregionData);

      // Step 2: Get parks directly linked to this ecoregion
      console.log(`🏞️  Fetching parks for ecoregion: ${ecoregionData.name} (ID: ${ecoregionData.id})`);

      const { data: parksData, error: parksError } = await supabase
        .from('parks')
        .select('id, name, center_lat, center_lng, park_type, size_km2, wdpa_id, protection_status, image_url, image_attribution')
        .eq('ecoregion_id', ecoregionData.id)
        .not('center_lat', 'is', null)
        .not('center_lng', 'is', null)
        .order('size_km2', { ascending: false });

      if (parksError) {
        console.error('Error fetching parks:', parksError);
      } else {
        console.log(`✅ Found ${parksData?.length || 0} parks linked to ${ecoregionData.name}`);
        if (parksData && parksData.length > 0) {
          console.log('Parks:', parksData.map(p => p.name));
        }
      }

      // Use all parks linked to this ecoregion (already curated to 3 per ecoregion)
      const parks = (parksData || []).slice(0, 3); // Take up to 3 parks
      console.log(`  ✅ Using ${parks.length} parks for ${ecoregionData.name}`);
      if (parks.length > 0) {
        console.log(`  Parks to display:`, parks.map((p: any) => p.name));
      }

      // Determine ecoregion habitat type for species filtering
      const isMarine = ecoregionData.realm === 'Marine' || ecoregionData.name.includes('Coral Triangle');
      const isTerrestrial = ecoregionData.realm === 'Terrestrial' || ecoregionData.realm === 'Nearctic' || ecoregionData.realm === 'Neotropical' || ecoregionData.realm === 'Afrotropic' || ecoregionData.realm === 'Indo-Malayan';

      // Step 3: Get ALL species for this ecoregion (not limited)
      const { data: balancedSpecies, error: speciesError } = await supabase
        .from('species')
        .select(`
          id,
          scientific_name,
          common_name,
          class,
          conservation_status,
          ui_group,
          image_url,
          is_marine,
          is_terrestrial,
          is_freshwater,
          species_type,
          trophic_role,
          dietary_category,
          species_ecoregions!inner(ecoregion_id, overlap_percentage)
        `)
        .eq('species_ecoregions.ecoregion_id', ecoregionData.id)
        .order('is_curated', { ascending: false })
        .order('common_name', { ascending: true, nullsLast: true });

      if (speciesError) {
        console.error('Error fetching species:', speciesError);
      }

      // Debug: Check what ui_group values we got from database
      console.log('📊 Sample species from database:', (balancedSpecies || []).slice(0, 3).map((s: any) => ({
        name: s.common_name || s.scientific_name,
        ui_group: s.ui_group,
        class: s.class
      })));

      // Filter by habitat type if needed
      let filteredSpecies = balancedSpecies || [];

      // Use already declared isMarine, isTerrestrial from park filtering section above
      console.log(`🌊 Ecoregion habitat type: ${ecoregionData.name} - Marine: ${isMarine}, Terrestrial: ${isTerrestrial}`);

      // HABITAT FILTERING: Apply selective filtering based on ecoregion type
      // Some ecoregions like Arctic have BOTH marine and terrestrial species (coast + ocean + tundra)
      const mixedHabitatEcoregions = ['Arctic', 'Madagascar']; // Ecoregions with diverse habitats
      const isMixedHabitat = mixedHabitatEcoregions.some(name => ecoregionData.name.includes(name));

      if (isMarine && !isMixedHabitat) {
        // Pure marine ecoregions (Coral Triangle): ONLY marine species
        filteredSpecies = filteredSpecies.filter((item: any) => item.is_marine);
        console.log(`  🐟 Strict marine filtering: ${filteredSpecies.length} marine species`);
      } else if (isTerrestrial && !isMixedHabitat) {
        // Pure terrestrial ecoregions (Borneo/Amazon/Congo): NO marine species (terrestrial + freshwater OK)
        filteredSpecies = filteredSpecies.filter((item: any) => !item.is_marine);
        console.log(`  🌳 Excluding marine species: ${filteredSpecies.length} non-marine species`);
      } else if (isMixedHabitat) {
        // Mixed habitat ecoregions: Keep all species (marine, terrestrial, freshwater)
        console.log(`  🌍 Mixed habitat ecoregion: ${filteredSpecies.length} species (all habitats)`);
      }

      // Log diversity breakdown
      const classCounts: { [key: string]: number } = {};
      const taxonomicCounts: { [key: string]: number } = {};
      filteredSpecies.forEach((item: any) => {
        const className = item.class || 'Unknown';
        const taxonomicGroup = item.ui_group || 'Unknown';
        classCounts[className] = (classCounts[className] || 0) + 1;
        taxonomicCounts[taxonomicGroup] = (taxonomicCounts[taxonomicGroup] || 0) + 1;
      });
      console.log(`  📊 Taxonomic diversity:`, classCounts);
      console.log(`  📊 Group diversity:`, taxonomicCounts);

      // Log habitat breakdown for debugging
      const marineCount = filteredSpecies.filter((item: any) => item.is_marine).length;
      const terrestrialCount = filteredSpecies.filter((item: any) => item.is_terrestrial).length;
      const freshwaterCount = filteredSpecies.filter((item: any) => item.is_freshwater).length;
      console.log(`  📊 Habitat breakdown: Marine: ${marineCount}, Terrestrial: ${terrestrialCount}, Freshwater: ${freshwaterCount}`);

      // Transform species data to match expected format
      const speciesList = filteredSpecies.map((item: any) => {
        // Handle nested species_ecoregions structure
        const overlap = item.species_ecoregions?.[0]?.overlap_percentage || 100;

        return {
          scientificName: item.scientific_name,
          commonName: item.common_name || item.scientific_name,
          animalType: item.class || 'Unknown',
          taxonomicGroup: item.ui_group || 'Unknown',
          conservationStatus: item.conservation_status || 'NE',
          occurrenceCount: Math.round(overlap),
          imageUrl: item.image_url,
          // Preserve habitat flags for future filtering
          is_marine: item.is_marine,
          is_terrestrial: item.is_terrestrial,
          is_freshwater: item.is_freshwater,
          // NEW: Include classification fields for filtering
          speciesType: item.species_type,
          trophicRole: item.trophic_role,
          dietaryCategory: item.dietary_category
        };
      });

      console.log(`Found ${speciesList.length} species in ${point.name}`);
      console.log('Species data sample:', speciesList.slice(0, 2));

      if (speciesList.length === 0) {
        console.warn('No species found in ecoregion. Species may not be linked to this ecoregion yet.');
      }

      // Step 4: Update state with database results
      setRegionInfo({
        regionName: ecoregionData.name,
        centerLat: ecoregionData.center_lat || point.lat,
        centerLng: ecoregionData.center_lng || point.lng,
        description: `${ecoregionData.biome || 'Ecoregion'} in ${ecoregionData.realm || 'the world'}`,
        imageUrl: ecoregionData.image_url || undefined,
        imageAttribution: ecoregionData.image_attribution || undefined
      });

      setRegionSpecies(speciesList);
      console.log('🔍 Species carousel visibility check:', {
        hasLocationFilter: activeSpeciesFilters.has('locations'),
        hasRegionInfo: !!regionInfo,
        speciesCount: speciesList.length,
        hasCurrentHabitat: !!currentHabitat,
        shouldShow: !activeSpeciesFilters.has('locations') && !!regionInfo && speciesList.length > 0 && !currentHabitat
      });

      // Transform parks to expected format
      const formattedParks = parks.map((park: any) => ({
        id: park.id,
        name: park.name,
        lat: park.center_lat,
        lng: park.center_lng,
        location: {
          lat: park.center_lat,
          lng: park.center_lng
        },
        designation: park.park_type,
        area: park.size_km2 ? `${park.size_km2.toFixed(0)} km²` : undefined,
        type: park.protection_status || 'Protected Area'
      }));

      console.log(`📍 Setting ${formattedParks.length} protected areas for map display`);
      setProtectedAreas(formattedParks);
      setWildlifePlaces([]); // Not using real-time API anymore
      setIsBackgroundLoading(false);

      toast({
        title: `${point.name} Loaded`,
        description: `Found ${speciesList.length} species and ${parks.length} protected areas`,
      });

    } catch (error) {
      console.error('Error loading eco-region data:', error);
      setIsBackgroundLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load eco-region data',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);
    setIsLoading(true);
    setHasInteracted(true);

    // Check if this is an education mode question (2D mode with a card showing)
    const isEducationMode = useGoogleMaps && educationContext !== null;
    console.log('🎓 Education mode check:', { useGoogleMaps, educationContext, isEducationMode });

    if (isEducationMode) {
      console.log('📚 Entering education mode for:', educationContext.displayName);
      // Add user message to chat history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Expand chat history for education conversations
      setIsChatHistoryExpanded(true);

      // Create a placeholder assistant message that will be updated with streaming response
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, assistantMessage]);

      // Call education agent with streaming
      let fullResponse = '';
      sendEducationMessage(
        query,
        educationContext,
        (chunk: string) => {
          // Update the assistant message with each chunk
          fullResponse += chunk;
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullResponse }
                : msg
            )
          );
        },
        () => {
          // On complete
          setIsLoading(false);
          console.log('✅ Education response complete');
        },
        (error: Error) => {
          // On error
          console.error('Education agent error:', error);
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: `Sorry, I encountered an error: ${error.message}` }
                : msg
            )
          );
          setIsLoading(false);
          toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
          });
        }
      );

      return;
    }

    // ✅ Only clear state when doing a NEW discovery search (not education chat)
    // Clear eco-region view flag when performing a search
    setIsViewingEcoRegion(false);

    // ✅ Cancel any previous ongoing requests
    if (abortController) {
      abortController.abort();
    }

    // Create new AbortController for this search
    const newController = new AbortController();
    setAbortController(newController);

    // ✅ CRITICAL: Clear ALL pin-related arrays to prevent old pins from previous searches
    setUserPins([]);
    setImageMarkers([]);
    setConservationLayers([]);

    // Check if this is a follow-up question (deep dive mode)
    // Deep dive mode activates when a species or habitat is already selected
    const isFollowUpQuestion = (speciesInfo !== null || currentHabitat !== null) && isDeepDiveMode;

    if (isFollowUpQuestion) {
      // Add user message to chat history
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Expand chat history if it's a follow-up question
      setIsChatHistoryExpanded(true);

      // TODO: Add API call here to get AI response
      // For now, add a placeholder response
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `This is information about your question regarding ${speciesInfo?.commonName || currentHabitat?.name}. [AI response will be integrated here]`,
          timestamp: new Date()
        };
        setChatHistory(prev => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1000);

      return;
    }

    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if it's a species or location search
    const lowerQuery = query.toLowerCase();
    const normalizedQuery = lowerQuery.replace(/\s+/g, '-'); // "polar bear" -> "polar-bear"
    
    // Check if query matches any species in our data (handle both "polar bear" and "polar-bear")
    const speciesKey = Object.keys(speciesData).find(species => 
      species.toLowerCase() === normalizedQuery || 
      species.toLowerCase().replace(/-/g, ' ') === lowerQuery ||
      lowerQuery.includes(species.toLowerCase().replace(/-/g, ' '))
    );
    
    const isSpeciesSearch = !!speciesKey;

    if (isSpeciesSearch && speciesKey) {
      // Handle species search - show animal card
      console.log('Species search detected:', speciesKey);
      setSearchType('species'); // ✅ Mark this as a species search

      const species = speciesData[speciesKey];

      // Set species info to show the FastFactsCard
      setSpeciesInfo({
        ...species.info,
        species: speciesKey
      });

      // Clear habitat to ensure species card shows
      setCurrentHabitat(null);
      setCurrentSpecies(query);

      // NEW: Use OpenAI to resolve species to habitat zone (instead of multiple pins)
      let centerLat = 0;
      let centerLng = 0;

      try {
        const { resolveSpeciesHabitat } = await import('@/services/habitatResolver');
        const habitatResolution = await resolveSpeciesHabitat(species.info.commonName);

        if (habitatResolution.success && habitatResolution.habitats) {
          const zones = habitatResolution.habitats;
          console.log(`✅ Resolved ${species.info.commonName} to ${zones.length} habitat zone(s)`);

          // Use first zone for center coordinates
          centerLat = zones[0].centerLat;
          centerLng = zones[0].centerLng;

          // Create pins for ALL habitat zones
          const habitatPins = zones.map(zone => ({
            lat: zone.centerLat,
            lng: zone.centerLng,
            species: species.info.commonName,
            size: 1.2,
            emoji: '🟢',
            type: 'species',
            imageUrl: species.info.imageUrl,
            name: zone.name
          }));

          setHabitats(habitatPins);

          // Create transparent green circular overlays for ALL zones
          const zoneOverlays = zones.map(zone => ({
            lat: zone.centerLat,
            lng: zone.centerLng,
            radiusKm: zone.radiusKm,
            color: 'rgba(16, 185, 129, 0.15)', // Transparent green
            name: zone.name
          }));

          setHabitatZones(zoneOverlays);

          // Zoom to first habitat zone center
          setMapCenter({
            lat: zones[0].centerLat,
            lng: zones[0].centerLng
          });
        }
      } catch (habitatError) {
        console.error('Habitat resolution failed, using fallback:', habitatError);

        // Fallback to old behavior (multiple pins)
        if (species.habitats) {
          const habitatPoints = species.habitats.map((h: any) => ({
            ...h,
            emoji: '🟢',
            type: 'species',
            imageUrl: species.info.imageUrl,
            name: species.info.commonName
          }));
          setHabitats(habitatPoints);

          // Use first habitat for center
          if (species.habitats[0]) {
            centerLat = species.habitats[0].lat;
            centerLng = species.habitats[0].lng;
            setMapCenter({
              lat: centerLat,
              lng: centerLng
            });
          }
        }
      }

      // ✅ INSTANT UI: Set everything immediately so filter/carousel appear without delay
      const placeholderRegion: RegionInfo = {
        regionName: `${species.info.commonName} Habitat`,
        centerLat: centerLat || 0,
        centerLng: centerLng || 0,
        description: `Discovering ${species.info.commonName} habitat locations...`
      };
      
      // Set these BEFORE any async calls to make UI instant
      setRegionInfo(placeholderRegion);
      setRegionSpecies([]); // Will populate later
      setWildlifePlaces([]); // Will populate later
      setProtectedAreas([]); // Will populate later
      setActiveSpeciesFilters(new Set(['locations'])); // ← Auto-select locations filter
      setIsLoading(false); // ← Stop loading indicator EARLY so UI appears
      setIsBackgroundLoading(true); // ← But show background loading for wildlife data

      try {
          // ⚡ OPTIMIZED: Run ALL API calls in parallel!
          // Previously: region → species → wildlife → protected (4 sequential steps)
          // Now: ALL at once! (4x faster)
          
          const habitatPoint = {
            lat: centerLat,
            lng: centerLng,
            species: species.info.commonName,
            size: 1.2,
            emoji: '🟢'
          };

          // Calculate bounds for API calls
          const bounds = {
            minLat: centerLat - 2,
            maxLat: centerLat + 2,
            minLng: centerLng - 2,
            maxLng: centerLng + 2
          };

          console.time('⚡ Parallel API calls');
          
          const [regionResult, speciesResult, wildlifeResult, areasResult] = await Promise.all([
            // 1. Analyze habitat region
            supabase.functions.invoke('analyze-habitat-region', {
              body: { bounds, speciesName: species.info.commonName }
            }),
            // 2. Discover region species
            supabase.functions.invoke('discover-region-species', {
              body: {
                bounds,
                regionName: 'Unknown Region',
                excludeSpecies: species.info.commonName,
                limit: 30
              }
            }),
            // 3. Fetch nearby wildlife parks
            supabase.functions.invoke('nearby-wildlife', {
              body: {
                lat: centerLat,
                lng: centerLng,
                radius: 50000
              }
            }),
            // 4. Fetch protected areas
            supabase.functions.invoke('protected-areas', {
              body: {
                bounds: {
                  sw: { lat: centerLat - 0.5, lng: centerLng - 0.5 },
                  ne: { lat: centerLat + 0.5, lng: centerLng + 0.5 }
                }
              }
            })
          ]);

          console.timeEnd('⚡ Parallel API calls');
          
          // ✅ Check if request was aborted
          if (newController.signal.aborted) return;

          // Process region data
          if (regionResult.data?.success) {
            setRegionInfo(regionResult.data.region);
            console.log('Region analysis complete:', regionResult.data.region.regionName);
          }

          // Process species data
          if (speciesResult.data?.success) {
            setRegionSpecies(speciesResult.data.species || []);
            console.log(`Found ${speciesResult.data.species?.length || 0} species in region`);
          }

          // Process wildlife parks
          let wildlifeParks: any[] = [];
          if (!wildlifeResult.error && wildlifeResult.data?.places) {
            wildlifeParks = wildlifeResult.data.places;
            console.log(`Found ${wildlifeParks.length} wildlife parks for animal search`);
          }

          // Process protected areas
          let protectedAreas: any[] = [];
          if (!areasResult.error && areasResult.data?.success) {
            protectedAreas = areasResult.data.protectedAreas || [];
            console.log(`Found ${protectedAreas.length} protected areas for animal search`);
          }

          setWildlifePlaces(wildlifeParks);
          setProtectedAreas(protectedAreas);
          
          setIsBackgroundLoading(false); // ✅ Done loading background data

      } catch (regionError) {
        console.error('Region analysis failed:', regionError);
        // Check if aborted
        if (newController.signal.aborted) return;
        // Keep the placeholder regionInfo so filter/carousel stay visible
        // User can still interact with the UI
        setIsBackgroundLoading(false); // ✅ Stop background loading even on error
      }

      // Don't set isLoading here - already set to false earlier for instant UI
      return;
    }

    // Handle location/habitat search (OR unknown species)
    console.log('Location/Species search:', query);

    try {
        // ✅ FIRST: Try to resolve as species using smart ecoregion resolver
        // This handles ANY species (not just hardcoded ones like polar bear)
        const { resolveSpeciesHabitat } = await import('@/services/habitatResolver');
        
        try {
          const habitatResolution = await resolveSpeciesHabitat(query);
          
          if (habitatResolution.success && habitatResolution.habitats && habitatResolution.habitats.length > 0) {
            // ✅ This is a SPECIES search! (e.g., "red panda", "tiger", etc.)
            console.log(`✅ Detected species search for: ${query}`);
            setSearchType('species');
            
            const zones = habitatResolution.habitats;
            const centerLat = zones[0].centerLat;
            const centerLng = zones[0].centerLng;
            
            // ✅ Create placeholder speciesInfo so the SPECIES CARD shows (not region card!)
            setSpeciesInfo({
              commonName: query.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              animalType: 'Loading...',
              population: 'Loading data...',
              populationTrend: 'stable' as const,
              conservationStatus: 'Loading...',
              threats: 'Loading threat information...',
              threatImages: [threatIceLoss, threatPollution, threatHumanActivity],
              imageUrl: polarBearReal, // Placeholder image
              ecosystemImages: [ecosystemSeal, ecosystemWalrus, ecosystemFish],
              ecosystem: []
            });
            
            // Clear habitat to ensure species card shows
            setCurrentHabitat(null);
            setCurrentSpecies(query);
            
            // Create pins for ALL habitat zones
            const habitatPins = zones.map(zone => ({
              lat: zone.centerLat,
              lng: zone.centerLng,
              species: query,
              size: 1.2,
              emoji: '🟢',
              type: 'species',
              imageUrl: polarBearReal,
              name: zone.name
            }));
            
            setHabitats(habitatPins);
            
            // Create transparent green circular overlays
            const zoneOverlays = zones.map(zone => ({
              lat: zone.centerLat,
              lng: zone.centerLng,
              radiusKm: zone.radiusKm,
              color: 'rgba(16, 185, 129, 0.15)',
              name: zone.name
            }));
            
            setHabitatZones(zoneOverlays);
            setMapCenter({ lat: centerLat, lng: centerLng });
            
            // Set placeholder region for filter/carousel
            const placeholderRegion: RegionInfo = {
              regionName: `${query} Habitat`,
              centerLat: centerLat,
              centerLng: centerLng,
              description: `Discovering habitat locations for ${query}...`
            };
            
            setRegionInfo(placeholderRegion);
            setRegionSpecies([]);
            setWildlifePlaces([]);
            setProtectedAreas([]);
            setActiveSpeciesFilters(new Set(['locations']));
            setIsLoading(false);
            setIsBackgroundLoading(true); // ✅ Show background loading for wildlife data
            
            // ⚡ OPTIMIZED: Run ALL API calls in parallel!
            try {
              // Calculate bounds for API calls
              const bounds = {
                minLat: centerLat - 2,
                maxLat: centerLat + 2,
                minLng: centerLng - 2,
                maxLng: centerLng + 2
              };

              console.time('⚡ Parallel API calls (dynamic species)');
              
              const [regionResult, speciesResult, wildlifeResult, areasResult] = await Promise.all([
                // 1. Analyze habitat region
                supabase.functions.invoke('analyze-habitat-region', {
                  body: { bounds, speciesName: query }
                }),
                // 2. Discover region species
                supabase.functions.invoke('discover-region-species', {
                  body: {
                    bounds,
                    regionName: 'Unknown Region',
                    excludeSpecies: query,
                    limit: 30
                  }
                }),
                // 3. Fetch nearby wildlife parks
                supabase.functions.invoke('nearby-wildlife', {
                  body: { lat: centerLat, lng: centerLng, radius: 50000 }
                }),
                // 4. Fetch protected areas
                supabase.functions.invoke('protected-areas', {
                  body: {
                    bounds: {
                      sw: { lat: centerLat - 0.5, lng: centerLng - 0.5 },
                      ne: { lat: centerLat + 0.5, lng: centerLng + 0.5 }
                    }
                  }
                })
              ]);

              console.timeEnd('⚡ Parallel API calls (dynamic species)');
              
              // Check if request was aborted
              if (newController.signal.aborted) return;
              
              // Process region data
              if (regionResult.data?.success) {
                setRegionInfo(regionResult.data.region);
              }

              // Process species data
              if (speciesResult.data?.success) {
                setRegionSpecies(speciesResult.data.species || []);
              }
              
              // Process wildlife parks
              if (!wildlifeResult.error && wildlifeResult.data?.places) {
                setWildlifePlaces(wildlifeResult.data.places);
              }
              
              // Process protected areas
              if (!areasResult.error && areasResult.data?.success) {
                setProtectedAreas(areasResult.data.protectedAreas || []);
              }
              
              setIsBackgroundLoading(false); // ✅ Done loading background data
            } catch (bgError) {
              console.error('Background region fetch failed:', bgError);
              if (newController.signal.aborted) return;
              setIsBackgroundLoading(false); // ✅ Stop even on error
            }
            
            return; // ✅ DONE! Species search complete
          }
        } catch (speciesError) {
          console.log('Not a species, trying location search...', speciesError);
        }
        
        // ✅ If we're here, it's a LOCATION search (not species)
        console.log('Location search confirmed:', query);
        setSearchType('location');
        
        // Step 1: Discover habitat
        const { data: habitatData, error: habitatError } = await supabase.functions.invoke('habitat-discovery', {
          body: { location: query }
        });

        if (habitatError || !habitatData?.success) {
          console.error('Error discovering habitat:', habitatError);
          toast({
            title: "Location Search",
            description: `Could not find habitat for "${query}"`,
          });
          setIsLoading(false);
          return;
        }

        const habitat = habitatData.habitat;
        console.log('Habitat discovered:', habitat);
        
        // ✅ Check if request was aborted
        if (newController.signal.aborted) {
          setIsLoading(false);
          return;
        }
        
        // Step 2: Fetch habitat image (Wikipedia)
        let habitatImageUrl = '';
        try {
          const { data: imageData, error: imageError } = await supabase.functions.invoke('habitat-image', {
            body: { habitatName: habitat.name }
          });
          
          if (!imageError && imageData?.success && imageData.imageUrl) {
            habitatImageUrl = imageData.imageUrl;
            console.log('Habitat image found:', habitatImageUrl);
          }
        } catch (err) {
          console.error('Error fetching habitat image:', err);
        }

        // ✅ Check if request was aborted
        if (newController.signal.aborted) {
          setIsLoading(false);
          return;
        }

        // Step 3: Fetch nearby wildlife parks, protected areas, threats, and species in parallel
        const [wildlifeResult, areasResult, threatsResult, speciesResult] = await Promise.all([
          supabase.functions.invoke('nearby-wildlife', {
            body: {
              lat: habitat.location.lat,
              lng: habitat.location.lng,
              radius: 50000
            }
          }),
          supabase.functions.invoke('protected-areas', {
            body: { bounds: habitat.bounds }
          }),
          supabase.functions.invoke('habitat-threats', {
            body: { bounds: habitat.bounds }
          }),
          supabase.functions.invoke('discover-region-species', {
            body: {
              bounds: {
                minLat: habitat.bounds.sw.lat,
                maxLat: habitat.bounds.ne.lat,
                minLng: habitat.bounds.sw.lng,
                maxLng: habitat.bounds.ne.lng
              },
              regionName: habitat.name,
              limit: 30
            }
          })
        ]);
        
        // ✅ Check if request was aborted
        if (newController.signal.aborted) {
          setIsLoading(false);
          return;
        }
        
        let protectedAreas: any[] = [];
        if (!areasResult.error && areasResult.data?.success) {
          protectedAreas = areasResult.data.protectedAreas || [];
          console.log(`Found ${protectedAreas.length} protected areas`);
        }
        
        let threats: any[] = [];
        if (!threatsResult.error && threatsResult.data?.success) {
          threats = threatsResult.data.threats || [];
          console.log(`Found ${threats.length} threats`);
        }

        // Process species data
        let keySpecies: any[] = [];
        if (!speciesResult.error && speciesResult.data?.success && speciesResult.data.species) {
          keySpecies = speciesResult.data.species.map((sp: any) => ({
            id: sp.scientificName.toLowerCase().replace(/\s+/g, '-'),
            name: sp.commonName || sp.scientificName,
            scientificName: sp.scientificName,
            conservationStatus: sp.conservationStatus || 'NE',
            observationCount: sp.occurrenceCount || 0,
            type: sp.animalType || 'Other',
            imageUrl: sp.imageUrl || null
          }));
          console.log(`Found ${keySpecies.length} species in habitat`);
        }
        
        // Step 4: Fetch Wikipedia images for nearby wildlife parks
        let wildlifeParks: any[] = [];
        if (!wildlifeResult.error && wildlifeResult.data?.places) {
          const places = wildlifeResult.data.places;
          console.log(`Found ${places.length} wildlife parks nearby`);
          
          // Fetch images for each park in parallel
          const parksWithImages = await Promise.all(
            places.map(async (park: any) => {
              try {
                const { data: imageData } = await supabase.functions.invoke('habitat-image', {
                  body: { habitatName: park.name }
                });
                
                return {
                  ...park,
                  imageUrl: imageData?.success ? imageData.imageUrl : undefined
                };
              } catch (error) {
                console.error(`Failed to fetch image for ${park.name}:`, error);
                return park;
              }
            })
          );
          
          wildlifeParks = parksWithImages;
        }

        // Update habitat with all data
        const enrichedHabitat = {
          ...habitat,
          imageUrl: habitatImageUrl || habitat.imageUrl,
          protectedAreas,
          threats,
          keySpecies,
          parkCount: wildlifeParks.length
        };
        
        setCurrentHabitat(enrichedHabitat);
        setSpeciesInfo(null); // Clear species info when showing habitat
        setCurrentSpecies(null); // Clear current species
        setWildlifePlaces(wildlifeParks); // Store wildlife parks for 2D map view
        setProtectedAreas(protectedAreas); // Store protected areas for locations carousel
        setLocationName(query); // Store the search query
        // DON'T clear regionInfo/regionSpecies - keep filters and carousel visible

        // Create markers for globe - ONLY the location pin
        const markers: any[] = [];

        // Add ONLY the location pin - no other markers
        markers.push({
          lat: habitat.location.lat,
          lng: habitat.location.lng,
          name: habitat.name,
          size: 1.2,
          emoji: '📍',
          type: 'location-pin',
          color: '#ef4444' // Red pin for searched location
        });

        setHabitats(markers);

        // Set target location for globe to zoom to
        setMapCenter({ lat: habitat.location.lat, lng: habitat.location.lng });

        // UNIFIED UX: Trigger region species analysis
        // This will populate the filter banner and carousel!
        if (keySpecies.length > 0) {
          try {
            // Create a simple region info for this location
            const locationRegionInfo: RegionInfo = {
              regionName: habitat.name,
              centerLat: habitat.location.lat,
              centerLng: habitat.location.lng,
              description: `Species found in and around ${habitat.name}`
            };

            setRegionInfo(locationRegionInfo);
            setRegionSpecies(keySpecies);

            // AUTO-ACTIVATE Locations filter to show locations carousel first
            setActiveSpeciesFilters(new Set(['locations']));

            console.log(`Region analysis complete: ${keySpecies.length} species discovered in ${habitat.name}`);
          } catch (regionError) {
            console.error('Region species setup failed:', regionError);
          }
        }

        toast({
          title: `${habitat.name} Discovered`,
          description: `${keySpecies.length} species found nearby`,
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error in habitat search:', err);
        toast({
          title: "Search Error",
          description: "Failed to search for location",
          variant: "destructive"
        });
        setIsLoading(false);
      }
  };

  const handlePointClick = (point: any) => {
    console.log('Point clicked:', point);

    // If it's a protected area (park), show the park card
    if (point.type === 'protected' || point.name) {
      // Extract area number if it's a string like "529 km²"
      let areaValue = point.area;
      if (typeof point.area === 'string') {
        const match = point.area.match(/(\d+)/);
        areaValue = match ? parseFloat(match[1]) : undefined;
      } else if (point.gis_area_km2) {
        areaValue = point.gis_area_km2;
      }

      const parkData = {
        name: point.name || point.species,
        location: point.location || { lat: point.lat, lng: point.lng },
        address: point.address,
        imageUrl: point.image_url || point.imageUrl,
        designation: point.designation || point.designation_eng || point.type,
        iucnCategory: point.iucn_category,
        area: areaValue,
        type: 'protected-area'
      };

      console.log('Setting park data:', parkData);
      setSelectedWildlifePark(parkData);

      // Clear other selections so the park card is visible
      setSpeciesInfo(null);
      setCurrentHabitat(null);
      setSelectedCarouselSpecies(null);
      setExpandedImage(null);
      setIsViewingEcoRegion(false);

      toast({
        title: 'Protected Area',
        description: `Viewing ${point.name || point.species}`,
      });
    } else {
      toast({
        title: 'Location Selected',
        description: `Viewing ${point.species} habitat at ${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}`,
      });
    }
  };

  const handleChatClick = () => {
    toast({
      title: 'Chat Started',
      description: `Starting conversation with ${currentSpecies}...`,
    });
  };

  const handleDoubleGlobeClick = (lat: number, lng: number) => {
    setHasInteracted(true);

    // PINS SHOULD BE PERSISTENT - Don't clear habitats/pins on globe click
    // They stay visible until user explicitly clicks Reset button

    // Just record the pin location - no longer showing hardcoded regional animals
    setPinLocation({ lat, lng });
    toast({
      title: 'Location Selected',
      description: `${lat.toFixed(2)}, ${lng.toFixed(2)}`
    });
  };

  const handleAnimalSelect = (animalId: string) => {
    const data = speciesData[animalId];
    if (data) {
      setHabitats(data.habitats);
      setCurrentSpecies(data.info.commonName);
      setSpeciesInfo(data.info);
      setRegionalAnimals(null);
      setSelectedRegion(null);
      
      // Create image markers from threats and ecosystem images
      const allImages = [
        ...data.info.threatImages.map((img: string) => ({ url: img, type: 'threat' as const })),
        ...data.info.ecosystemImages.map((img: string) => ({ url: img, type: 'ecosystem' as const }))
      ];
      
      const markers = allImages.map((img, idx) => {
        const habitat = data.habitats[idx % data.habitats.length];
        const offset = () => (Math.random() - 0.5) * 2;
        return {
          lat: habitat.lat + offset(),
          lng: habitat.lng + offset(),
          imageUrl: img.url,
          type: img.type,
          size: 0.05,
          color: '#FFFFFF',
          index: idx
        };
      });
      
      setImageMarkers(markers);
    }
  };

  const handleCloseRegionalList = () => {
    setRegionalAnimals(null);
    setSelectedRegion(null);
  };

  const handleImageMarkerClick = async (marker: any) => {
    console.log('Image marker clicked:', marker);
    
    // If it's a wildlife park marker, show the wildlife location card
    if (marker.type === 'wildlife-park') {
      setSelectedWildlifePark(marker);
      setSpeciesInfo(null);
      setCurrentHabitat(null);
      setSelectedCarouselSpecies(null);
      setExpandedImage(null);
      return;
    }
    
    // If it's a habitat marker, search for nearby habitats and parks
    if (marker.type === 'habitat' && marker.lat && marker.lng) {
      setIsLoading(true);
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Search for location name first
        const { data: geocodeData } = await supabase.functions.invoke('geocode-location', {
          body: { lat: marker.lat, lng: marker.lng }
        });
        
        const locationName = geocodeData?.location || marker.name;
        
        // Fetch habitat discovery for this location
        const { data: habitatData, error: habitatError } = await supabase.functions.invoke('habitat-discovery', {
          body: { location: locationName }
        });
        
        if (!habitatError && habitatData?.success) {
          const habitat = habitatData.habitat;
          
          // Fetch habitat image
          let habitatImageUrl = marker.imageUrl || '';
          try {
            const { data: imageData } = await supabase.functions.invoke('habitat-image', {
              body: { habitatName: habitat.name }
            });
            if (imageData?.success && imageData.imageUrl) {
              habitatImageUrl = imageData.imageUrl;
            }
          } catch (err) {
            console.error('Error fetching habitat image:', err);
          }
          
          // Fetch protected areas
          let protectedAreas: any[] = [];
          try {
            const { data: areasData } = await supabase.functions.invoke('protected-areas', {
              body: { bounds: habitat.bounds }
            });
            if (areasData?.success) {
              protectedAreas = areasData.protectedAreas || [];
            }
          } catch (err) {
            console.error('Error fetching protected areas:', err);
          }
          
          // Fetch threats
          let threats: any[] = [];
          try {
            const { data: threatsData } = await supabase.functions.invoke('habitat-threats', {
              body: { bounds: habitat.bounds }
            });
            if (threatsData?.success) {
              threats = threatsData.threats || [];
            }
          } catch (err) {
            console.error('Error fetching threats:', err);
          }
          
          // Update habitat with all data
          const enrichedHabitat = {
            ...habitat,
            imageUrl: habitatImageUrl,
            protectedAreas,
            threats,
            keySpecies: []
          };
          
          setCurrentHabitat(enrichedHabitat);
          setSpeciesInfo(null);
          setCurrentSpecies(null);
          // DON'T clear regionInfo/regionSpecies - keep filters and carousel visible
          
          // Create markers for nearby habitats and protected areas
          const getHabitatEmoji = (climate: string) => {
            if (climate.toLowerCase().includes('desert')) return '🏜️';
            if (climate.toLowerCase().includes('forest') || climate.toLowerCase().includes('tropical')) return '🌲';
            if (climate.toLowerCase().includes('arctic') || climate.toLowerCase().includes('tundra')) return '❄️';
            if (climate.toLowerCase().includes('ocean') || climate.toLowerCase().includes('marine')) return '🌊';
            if (climate.toLowerCase().includes('grassland') || climate.toLowerCase().includes('savanna')) return '🌾';
            if (climate.toLowerCase().includes('wetland')) return '💧';
            return '🌍';
          };
          
          const markers: any[] = [{
            lat: habitat.location.lat,
            lng: habitat.location.lng,
            name: habitat.name,
            size: 2,
            emoji: getHabitatEmoji(habitat.climate),
            type: 'habitat',
            imageUrl: habitatImageUrl
          }];
          
          // Add protected area markers
          protectedAreas.slice(0, 10).forEach(area => {
            markers.push({
              lat: area.location.lat,
              lng: area.location.lng,
              name: area.name,
              size: 1,
              emoji: '🛡️',
              type: 'protected'
            });
          });
          
          // Add threat markers
          threats.forEach(threat => {
            markers.push({
              lat: threat.location.lat,
              lng: threat.location.lng,
              name: threat.title,
              size: 1,
              emoji: threat.emoji,
              type: 'threat'
            });
          });
          
          setHabitats(markers);
          setMapCenter({ lat: habitat.location.lat, lng: habitat.location.lng });
          
          toast({
            title: `${habitat.name} Discovered`,
            description: `${protectedAreas.length} protected areas, ${threats.length} threats nearby`,
          });
        }
      } catch (err) {
        console.error('Error fetching habitat details:', err);
        toast({
          title: 'Habitat Details',
          description: `Viewing ${marker.name || 'habitat'}`,
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    
    // For species markers, show expanded image view
    if (marker.type === 'species' && marker.imageUrl) {
      setExpandedImage({
        url: marker.imageUrl,
        type: 'threat',
        index: 0
      });
      return;
    }
    
    // Otherwise, show expanded image view
    setExpandedImage({
      url: marker.imageUrl,
      type: marker.type,
      index: marker.index
    });
  };

  const handleNextImage = () => {
    if (!expandedImage || !speciesInfo) return;
    
    const allImages = [
      ...speciesInfo.threatImages.map((img: string) => ({ url: img, type: 'threat' as const })),
      ...speciesInfo.ecosystemImages.map((img: string) => ({ url: img, type: 'ecosystem' as const }))
    ];
    
    const nextIndex = (expandedImage.index + 1) % allImages.length;
    setExpandedImage({
      url: allImages[nextIndex].url,
      type: allImages[nextIndex].type,
      index: nextIndex
    });
  };

  const handlePreviousImage = () => {
    if (!expandedImage || !speciesInfo) return;
    
    const allImages = [
      ...speciesInfo.threatImages.map((img: string) => ({ url: img, type: 'threat' as const })),
      ...speciesInfo.ecosystemImages.map((img: string) => ({ url: img, type: 'ecosystem' as const }))
    ];
    
    const prevIndex = (expandedImage.index - 1 + allImages.length) % allImages.length;
    setExpandedImage({
      url: allImages[prevIndex].url,
      type: allImages[prevIndex].type,
      index: prevIndex
    });
  };

  const handleLayerToggle = (layerType: string, data?: any) => {
    console.log('Layer toggle:', layerType, data);
    
    if (data && !data.remove) {
      // Add layer
      const count = data.data?.length || 0;
      const layerName = layerType.charAt(0).toUpperCase() + layerType.slice(1);
      
      // Define colors for different layer types
      const layerColors: Record<string, string> = {
        fires: '#FF6B6B',
        earthquakes: '#FFA500',
        forest: '#34D399',
        ice: '#60A5FA',
        protected: '#10B981'
      };
      
      setActiveLayers(prev => {
        const filtered = prev.filter(l => l.name !== layerName);
        return [...filtered, { name: layerName, count }];
      });
      
      setConservationLayers(prev => {
        const filtered = prev.filter(l => l.type !== layerType);
        return [...filtered, { 
          type: layerType, 
          data: data.data || data,
          color: layerColors[layerType] || '#10B981'
        }];
      });
      
      toast({ 
        title: 'Layer Active', 
        description: `${layerName}: ${count} points loaded` 
      });
    } else {
      // Remove layer
      const layerName = layerType.charAt(0).toUpperCase() + layerType.slice(1);
      setActiveLayers(prev => prev.filter(l => l.name !== layerName));
      setConservationLayers(prev => prev.filter(l => l.type !== layerType));
      toast({ 
        title: 'Layer Removed', 
        description: `${layerName} layer cleared` 
      });
    }
  };

  const handleCarouselSpeciesSelect = async (species: RegionSpecies) => {
    // When a species is selected from the carousel, show the carousel species card
    const index = getFilteredSpecies().findIndex(s => s.scientificName === species.scientificName);
    if (index !== -1) {
      setCurrentSpeciesIndex(index);
    }

    // Set the selected carousel species to show RegionSpeciesCard
    setSelectedCarouselSpecies(species);

    // Clear ALL other cards to ensure mutual exclusivity
    setSpeciesInfo(null);
    setSelectedWildlifePark(null);
    setExpandedImage(null);
    setCurrentHabitat(null);

    // Optionally: You could also search for more detailed info
    // await handleSearch(species.commonName);
  };

  // 🎮 Food Web Game Helper Functions

  // Determine which slot a species belongs to based on dietary category
  const determineSpeciesSlot = (species: RegionSpecies): 'carnivore' | 'herbivoreOmnivore' | 'producer' | null => {
    const category = species.dietaryCategory?.toLowerCase();

    if (category === 'carnivore') {
      return 'carnivore';
    } else if (category === 'herbivore' || category === 'omnivore') {
      return 'herbivoreOmnivore';
    } else if (category === 'producer') {
      return 'producer';
    }

    return null; // Unknown category
  };

  // Check if all 3 slots are filled for trivia game
  const isAllSlotsFilledForTrivia = (): boolean => {
    return (
      selectedFoodWebSpecies.carnivore !== null &&
      selectedFoodWebSpecies.herbivoreOmnivore !== null &&
      selectedFoodWebSpecies.producer !== null
    );
  };

  // Check if a species is already selected in any slot
  const isSpeciesSelected = (scientificName: string): boolean => {
    return (
      selectedFoodWebSpecies.carnivore?.scientificName === scientificName ||
      selectedFoodWebSpecies.herbivoreOmnivore?.scientificName === scientificName ||
      selectedFoodWebSpecies.producer?.scientificName === scientificName
    );
  };

  // Handle selecting a species for the food web game (with swap behavior)
  const handleSelectSpeciesForGame = (species: RegionSpecies) => {
    const slot = determineSpeciesSlot(species);

    if (!slot) {
      toast({
        title: "Cannot Select Species",
        description: "This species doesn't have a valid dietary category.",
        variant: "destructive"
      });
      return;
    }

    // Get the current species in this slot (if any)
    const currentSpeciesInSlot = selectedFoodWebSpecies[slot];

    // Update the slot with the new species (swap behavior)
    setSelectedFoodWebSpecies(prev => ({
      ...prev,
      [slot]: species
    }));

    // Show feedback to user
    if (currentSpeciesInSlot) {
      toast({
        title: "Species Swapped",
        description: `Replaced ${currentSpeciesInSlot.commonName} with ${species.commonName}`,
      });
    } else {
      toast({
        title: "Species Selected",
        description: `${species.commonName} added as ${slot === 'herbivoreOmnivore' ? 'Herbivore/Omnivore' : slot.charAt(0).toUpperCase() + slot.slice(1)}`,
      });
    }
  };

  // Handle starting the trivia game
  const handlePlayTrivia = async () => {
    // Open chat panel if closed
    setIsChatHistoryExpanded(true);

    // Prepare trivia context
    const triviaPrompt = `🎮 **Food Web Trivia Game Started!**

You are now playing a trivia game about the food web in **${regionInfo?.regionName || 'this ecosystem'}**!

**Selected Species:**
- 🥩 **Carnivore**: ${selectedFoodWebSpecies.carnivore?.commonName} (${selectedFoodWebSpecies.carnivore?.scientificName})
- 🌱 **Herbivore/Omnivore**: ${selectedFoodWebSpecies.herbivoreOmnivore?.commonName} (${selectedFoodWebSpecies.herbivoreOmnivore?.scientificName})
- ☀️ **Producer**: ${selectedFoodWebSpecies.producer?.commonName} (${selectedFoodWebSpecies.producer?.scientificName})

**How the game works:**
1. I'll ask you easy multiple-choice questions about these species and their roles in the ecosystem
2. Answer by typing your choice (A, B, C, or D)
3. I'll evaluate your answer and provide educational feedback
4. We'll learn about food webs, energy flow, and how these species interact!

**Ready to start? Here's your first question:**

**Question 1:** In a food web, energy flows from producers to consumers. Which of your selected species is the **producer** (makes its own food through photosynthesis)?

A) ${selectedFoodWebSpecies.carnivore?.commonName}
B) ${selectedFoodWebSpecies.herbivoreOmnivore?.commonName}
C) ${selectedFoodWebSpecies.producer?.commonName}
D) None of the above

Type your answer (A, B, C, or D)!`;

    // Add message to chat history
    const triviaMessage: ChatMessage = {
      role: 'assistant',
      content: triviaPrompt
    };

    setChatHistory(prev => [...prev, triviaMessage]);

    // Set education context for the agent
    setEducationContext({
      mode: 'trivia',
      ecoregion: regionInfo,
      species: [
        selectedFoodWebSpecies.carnivore,
        selectedFoodWebSpecies.herbivoreOmnivore,
        selectedFoodWebSpecies.producer
      ].filter(s => s !== null) as RegionSpecies[]
    });

    toast({
      title: "🎮 Trivia Game Started!",
      description: "Answer the question in the chat below",
    });
  };

  // Filter species based on active filters - works for both region and habitat species
  const getFilteredSpecies = () => {
    // Use habitat species if viewing a habitat, otherwise use region species
    const speciesList = currentHabitat?.keySpecies || regionSpecies;

    if (activeSpeciesFilters.size === 0) return speciesList;

    const filtered = speciesList.filter(sp => {
      for (const filter of activeSpeciesFilters) {
        // Get ui_group from taxonomicGroup field (set from database)
        const uiGroup = sp.taxonomicGroup?.toLowerCase() || '';
        const conservationStatus = sp.conservationStatus?.toUpperCase() || '';

        // UI Group filters (Animals, Birds, Plants & Corals)
        if (filter === 'animals' && uiGroup === 'animals') return true;
        if (filter === 'birds' && uiGroup === 'birds') return true;
        if (filter === 'plants-corals' && uiGroup === 'plants & corals') return true;

        // Legacy animal type filters (for backward compatibility)
        const animalType = (sp.animalType || sp.type)?.toLowerCase() || '';
        const animalTypes = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];
        if (filter === 'all-animals' && animalTypes.includes(animalType)) return true;
        if (filter === 'mammals' && animalType === 'mammal') return true;
        if (filter === 'reptiles' && animalType === 'reptile') return true;
        if (filter === 'amphibians' && animalType === 'amphibian') return true;
        if (filter === 'insects' && animalType === 'insect') return true;
        if (filter === 'fish' && animalType === 'fish') return true;
        if (filter === 'plants' && animalType === 'plant') return true;

        // Conservation status filters
        if (filter === 'critically-endangered' && conservationStatus === 'CR') return true;
        if (filter === 'endangered' && conservationStatus === 'EN') return true;
        if (filter === 'vulnerable' && conservationStatus === 'VU') return true;
        if (filter === 'near-threatened' && conservationStatus === 'NT') return true;
        if (filter === 'least-concern' && conservationStatus === 'LC') return true;
      }
      return false;
    });

    console.log('🔍 Filter results:', {
      totalSpecies: speciesList.length,
      activeFilters: Array.from(activeSpeciesFilters),
      filteredCount: filtered.length,
      sampleSpecies: filtered.slice(0, 3).map(s => ({ name: s.commonName, group: s.taxonomicGroup }))
    });

    return filtered;
  };

  const handlePreviousSpecies = async () => {
    const filtered = getFilteredSpecies();
    if (filtered.length === 0) return;

    const newIndex = (currentSpeciesIndex - 1 + filtered.length) % filtered.length;
    setCurrentSpeciesIndex(newIndex);

    // If we're viewing a carousel species, show the previous carousel species
    if (selectedCarouselSpecies) {
      setSelectedCarouselSpecies(filtered[newIndex]);
    } else if (currentHabitat) {
      // If we're viewing a habitat, search for the habitat species
      await handleSearch(filtered[newIndex].name);
    } else {
      // Otherwise search for the species (hardcoded data flow)
      await handleSearch(filtered[newIndex].commonName);
    }
  };

  const handleNextSpecies = async () => {
    const filtered = getFilteredSpecies();
    if (filtered.length === 0) return;

    const newIndex = (currentSpeciesIndex + 1) % filtered.length;
    setCurrentSpeciesIndex(newIndex);

    // If we're viewing a carousel species, show the next carousel species
    if (selectedCarouselSpecies) {
      setSelectedCarouselSpecies(filtered[newIndex]);
    } else if (currentHabitat) {
      // If we're viewing a habitat, search for the habitat species
      await handleSearch(filtered[newIndex].name);
    } else {
      // Otherwise search for the species (hardcoded data flow)
      await handleSearch(filtered[newIndex].commonName);
    }
  };

  const handleSpeciesFilterToggle = (filterId: FilterCategory) => {
    setActiveSpeciesFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filterId)) {
        newFilters.delete(filterId);
      } else {
        newFilters.add(filterId);
      }
      return newFilters;
    });
  };

  const handleReset = () => {
    // ✅ Cancel ALL pending API calls immediately
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }

    // Clear ALL state
    setHabitats([]);
    setCurrentSpecies(null);
    setSpeciesInfo(null);
    setCurrentHabitat(null);
    setUserPins([]);
    setPinLocation(null);
    setWildlifePlaces([]);
    setProtectedAreas([]);
    setLocationName('');
    setRegionInfo(null);
    setRegionSpecies([]);
    setPinImagesVisible(false);
    setHasInteracted(false);
    setRegionalAnimals(null);
    setSelectedRegion(null);
    setExpandedImage(null);
    setImageMarkers([]);
    setConservationLayers([]);
    setActiveLayers([]);
    setUseGoogleMaps(false);
    setCurrentZoomLevel(3);
    setMapCenter(null);
    setSelectedWildlifePark(null);
    setActiveSpeciesFilters(new Set());
    setChatHistory([]);
    setIsChatHistoryExpanded(false);
    setIsDeepDiveMode(false);
    setSelectedCarouselSpecies(null);
    setCurrentSpeciesIndex(0);
    setHabitatZones([]); // ✅ Clear habitat zone overlays
    setSearchType(null); // ✅ Clear search type
    setIsViewingEcoRegion(false); // ✅ Clear eco-region view flag
    setIsLoading(false); // ✅ Stop loading indicator
    setIsBackgroundLoading(false); // ✅ Stop background loading

    toast({ title: 'View Reset', description: 'Showing global view' });
  };

  const handleFetchLocation = async () => {
    try {
      // Step 1: Get user's location via IP geolocation
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data.latitude && data.longitude) {
        const location = {
          lat: data.latitude,
          lng: data.longitude,
          name: data.city ? `${data.city}, ${data.country_name}` : data.country_name
        };

        // Add user location pin
        setUserPins([location]);

        // Step 2: Discover nearby locations based on view mode
        try {
          if (useGoogleMaps) {
            // 2D mode - discover specific locations (parks, refuges, hotspots)
            await locationDiscovery.discoverNearbyLocations(
              data.latitude,
              data.longitude,
              10 // 10km radius for detailed view
            );
          } else {
            // 3D mode - discover habitat regions
            await locationDiscovery.discoverNearbyHabitats(
              data.latitude,
              data.longitude,
              50 // 50km radius for broad view
            );
          }

          // Step 3: Add discovered markers to globe/map (replace, don't append!)
          const discoveredMarkers = locationDiscovery.getHabitatPoints();
          setHabitats(discoveredMarkers); // ✅ FIXED: Replace instead of append to prevent accumulation

          // Step 4: Pan to user's location
          setMapCenter({ lat: data.latitude, lng: data.longitude });

          toast({
            title: "Location Found",
            description: `Showing ${location.name} with ${discoveredMarkers.length} nearby locations`,
          });
        } catch (discoveryError) {
          console.error('Error discovering locations:', discoveryError);
          // Still show user location even if discovery fails
          toast({
            title: "Location Found",
            description: `Showing ${location.name}`,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      toast({
        title: "Location Error",
        description: "Unable to fetch your location",
        variant: "destructive",
      });
    }
  };

  // Toggle between Globe and Google Maps based on interaction or zoom
  const handleToggleMapView = () => {
    const willUseGoogleMaps = !useGoogleMaps;
    setUseGoogleMaps(willUseGoogleMaps);

    // If switching to Google Maps and we have a habitat, center on it
    if (willUseGoogleMaps && currentHabitat) {
      setMapCenter({
        lat: currentHabitat.location.lat,
        lng: currentHabitat.location.lng
      });
      setCurrentZoomLevel(8); // Closer zoom for habitat view
    }
    // If switching to Google Maps and we have species info with habitats, center on first habitat
    else if (willUseGoogleMaps && speciesInfo?.species && speciesData[speciesInfo.species]?.habitats?.[0]) {
      const firstHabitat = speciesData[speciesInfo.species].habitats[0];
      setMapCenter({
        lat: firstHabitat.lat,
        lng: firstHabitat.lng
      });
      setCurrentZoomLevel(5);
    }

    toast({
      title: useGoogleMaps ? 'Switched to Globe View' : 'Switched to Satellite View',
      description: useGoogleMaps ? 'Exploring with 3D globe' : 'Exploring with Google Maps satellite imagery'
    });
  };

  // Compute chat context based on what's showing on the right side
  const chatContext = useMemo((): ChatContext => {
    // Priority 1: Wildlife Park
    if (selectedWildlifePark) {
      return {
        type: 'wildlife-park',
        name: selectedWildlifePark.name,
        details: selectedWildlifePark.address
      };
    }

    // Priority 2: Expanded Image
    if (expandedImage) {
      return {
        type: expandedImage.type === 'threat' ? 'threat' : 'ecosystem',
        name: currentSpecies || currentHabitat?.name || 'this habitat',
        details: expandedImage.type === 'threat' ? 'Environmental Threat' : 'Ecosystem Connection'
      };
    }

    // Priority 3: Carousel Species
    if (selectedCarouselSpecies) {
      return {
        type: 'region-species',
        name: selectedCarouselSpecies.commonName,
        details: regionInfo?.regionName
      };
    }

    // Priority 4: Hardcoded Species
    if (speciesInfo) {
      return {
        type: 'species',
        name: speciesInfo.commonName,
        details: speciesInfo.animalType
      };
    }

    // Priority 5: Habitat
    if (currentHabitat) {
      return {
        type: 'habitat',
        name: currentHabitat.name,
        details: currentHabitat.climate
      };
    }

    // Default: No card showing
    return {
      type: 'default',
      name: 'Globe Critter Chat'
    };
  }, [selectedWildlifePark, expandedImage, selectedCarouselSpecies, speciesInfo, currentHabitat, currentSpecies, regionInfo]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* User Profile (Top-Right) */}
      <UserProfile />

      {/* Globe or Google Maps */}
      <div className="absolute inset-0 z-0">
        {useGoogleMaps ? (
          <GoogleEarthMap
            habitats={[
              ...habitats,
              ...userPins,
              ...imageMarkers,
              ...conservationLayers.flatMap(layer =>
                layer.data.map((point: any) => ({
                  ...point,
                  color: layer.color,
                  size: 0.3,
                  species: point.name,
                }))
              )
            ]}
            onPointClick={handlePointClick}
            onDoubleGlobeClick={handleDoubleGlobeClick}
            onImageMarkerClick={handleImageMarkerClick}
            center={mapCenter}
            zoom={currentZoomLevel}
            wildlifePlaces={wildlifePlaces}
            protectedAreas={protectedAreas}
            locationName={locationName}
          />
        ) : (
          <GlobeComponent
            habitats={[
              ...ecoRegionPins,
              ...habitats,
              ...userPins,
              ...imageMarkers,
              ...conservationLayers.flatMap(layer =>
                layer.data.map((point: any) => ({
                  ...point,
                  color: layer.color,
                  size: 0.3,
                  species: point.name,
                }))
              )
            ]}
            onPointClick={(point) => {
              // Check if this is an ecoregion pin (has emoji 🟢)
              if (point.emoji === '🟢') {
                handleEcoRegionClick(point);
              } else {
                handlePointClick(point);
              }
            }}
            onDoubleGlobeClick={handleDoubleGlobeClick}
            onImageMarkerClick={(point) => {
              // Check if this is an ecoregion pin (has emoji 🟢)
              if (point.emoji === '🟢') {
                handleEcoRegionClick(point);
              } else {
                handleImageMarkerClick(point);
              }
            }}
            targetLocation={mapCenter}
            habitatZones={habitatZones}
            resetView={resetGlobeView}
          />
        )}
      </div>

      {/* Map/Globe Toggle - Hidden (now in left controls) */}

      {/* Species Type Filter - Pinned to Left Edge */}
      {regionInfo && regionSpecies.length > 0 && !currentHabitat && (
        <div className="absolute left-4 top-24 bottom-6 w-14 z-[60] pointer-events-auto">
          <SpeciesTypeFilter
            activeFilter={speciesTypeFilter}
            onFilterChange={setSpeciesTypeFilter}
            showCorals={regionInfo.biome?.toLowerCase().includes('marine') || regionInfo.ecosystemType?.toLowerCase().includes('marine')}
          />
        </div>
      )}

      {/* Region Species Carousel - Next to Filter */}
      {regionInfo && regionSpecies.length > 0 && !currentHabitat && (
        <div className="absolute left-20 top-24 bottom-6 w-64 z-[60] pointer-events-auto">
          <RegionSpeciesCarousel
            species={regionSpecies}
            regionName={regionInfo.regionName}
            currentSpecies={selectedCarouselSpecies?.scientificName || speciesInfo?.scientificName}
            onSpeciesSelect={handleCarouselSpeciesSelect}
            activeFilters={activeSpeciesFilters}
            speciesTypeFilter={speciesTypeFilter}
            selectedForGameSpecies={Object.values(selectedFoodWebSpecies)
              .filter(s => s !== null)
              .map(s => s!.scientificName)}
          />
        </div>
      )}

      {/* Show helpful message when no species data */}
      {regionInfo && regionSpecies.length === 0 && !activeSpeciesFilters.has('locations') && (
        <div className="absolute left-20 top-24 w-72 glass-panel rounded-2xl p-6 z-[60] pointer-events-auto animate-fade-in">
          <div className="text-center">
            <div className="text-4xl mb-3">🌱</div>
            <h3 className="text-lg font-semibold mb-2">Species Data Loading</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Species information for {regionInfo.regionName} is being populated in the database.
            </p>
            <p className="text-xs text-muted-foreground">
              Try the 📍 Locations filter to explore protected areas in this region.
            </p>
          </div>
        </div>
      )}

      {/* Habitat Species List - Left Side Vertical (narrower, closer to filter) */}
      {currentHabitat && currentHabitat.keySpecies && currentHabitat.keySpecies.length > 0 && (
        <div className="absolute left-20 top-24 bottom-6 w-72 z-[60] pointer-events-auto">
          <HabitatSpeciesList
            species={currentHabitat.keySpecies}
            habitatName={currentHabitat.name}
            onSpeciesSelect={(species) => {
              console.log('Selected species from habitat:', species);
              // Could trigger species search here
              handleSearch(species.name);
            }}
            activeFilters={activeSpeciesFilters}
          />
        </div>
      )}

      {/* Regional Animals List - REMOVED: Using real database data instead of hardcoded regional animals */}

      {/* Right Side Card - MUTUALLY EXCLUSIVE - Only ONE card shows at a time */}
      {/* Priority 1: Eco-Region Card */}
      {/* Priority 2: Wildlife Park Card */}
      {/* Priority 3: Expanded Image View */}
      {/* Priority 4: Carousel Species */}
      {/* Priority 5: Hardcoded Species (e.g., Polar Bear) */}
      {/* Priority 6: Habitat */}

      {isViewingEcoRegion && regionInfo && !selectedWildlifePark && !expandedImage && !selectedCarouselSpecies && !speciesInfo && !currentHabitat ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <EcoRegionCard
            regionName={regionInfo.regionName}
            description={regionInfo.description}
            speciesCount={regionSpecies.length}
            locationCount={wildlifePlaces.length + protectedAreas.length}
            imageUrl={regionInfo.imageUrl}
          />

          {/* Navigation Arrows - Disabled for eco-regions (no carousel) */}
          <div className="flex gap-2">
            <Button
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Generate Lesson Plan Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Lesson Plan',
                description: `Generating lesson plan for ${regionInfo.regionName}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>

          {/* Back to Globe Button */}
          <Button
            onClick={() => {
              // Reset everything to go back to 3D globe
              setIsViewingEcoRegion(false);
              setUseGoogleMaps(false);
              setHasInteracted(false);
              setRegionInfo(null);
              setRegionSpecies([]);
              setCurrentSpeciesIndex(0);
              setSelectedWildlifePark(null);
              setMapCenter(null); // Clear map center to prevent re-zooming
              setSelectedFoodWebSpecies({ carnivore: null, herbivoreOmnivore: null, producer: null }); // Reset food web game

              // Trigger globe reset to default view
              setResetGlobeView(true);
              setTimeout(() => setResetGlobeView(false), 100); // Reset the trigger after a brief moment

              toast({
                title: 'Back to Globe 🌍',
                description: 'Returning to world view...',
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="outline"
          >
            Back to Globe
          </Button>
        </div>
      ) : selectedWildlifePark ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <WildlifeLocationCard
            name={selectedWildlifePark.name}
            address={selectedWildlifePark.address}
            rating={selectedWildlifePark.rating}
            imageUrl={selectedWildlifePark.imageUrl}
            photoReference={selectedWildlifePark.photoReference}
            types={selectedWildlifePark.types}
            location={selectedWildlifePark.location || { lat: selectedWildlifePark.lat, lng: selectedWildlifePark.lng }}
            onClose={() => setSelectedWildlifePark(null)}
          />

          {/* Navigation Arrows - Disabled for wildlife parks (no carousel) */}
          <div className="flex gap-2">
            <Button
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Play Game Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Starting Game 🎮',
                description: `Loading game for ${selectedWildlifePark.name}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Play Game 🎮
          </Button>

          {/* Back Button */}
          <Button
            onClick={() => {
              // Reset everything to go back to 3D globe
              setSelectedWildlifePark(null);
              setIsViewingEcoRegion(false);
              setUseGoogleMaps(false);
              setHasInteracted(false);
              setRegionSpecies([]);
              setCurrentSpeciesIndex(0);
              setMapCenter(null); // Clear map center to prevent re-zooming

              // Trigger globe reset to default view
              setResetGlobeView(true);
              setTimeout(() => setResetGlobeView(false), 100); // Reset the trigger after a brief moment

              toast({
                title: 'Back to Globe 🌍',
                description: 'Returning to world view...',
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="outline"
          >
            Back to Globe
          </Button>
        </div>
      ) : expandedImage ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <ExpandedImageView
            imageUrl={expandedImage.url}
            type={expandedImage.type}
            context={currentSpecies || 'this habitat'}
            title={expandedImage.type === 'threat' ? 'Environmental Threat' : 'Ecosystem Connection'}
            onClose={() => {
              console.log('Closing expanded image');
              setExpandedImage(null);
            }}
            onNext={handleNextImage}
            onPrevious={handlePreviousImage}
            externalMessage={chatMessage}
            severity="High"
            location={currentHabitat?.name || regionInfo?.regionName || 'Unknown Location'}
          />

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousImage}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleNextImage}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Generate Lesson Plan Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Lesson Plan',
                description: `Generating lesson plan about this ${expandedImage.type}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>
        </div>
      ) : selectedCarouselSpecies ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <RegionSpeciesCard
            commonName={selectedCarouselSpecies.commonName}
            scientificName={selectedCarouselSpecies.scientificName}
            animalType={selectedCarouselSpecies.animalType}
            conservationStatus={selectedCarouselSpecies.conservationStatus}
            occurrenceCount={selectedCarouselSpecies.occurrenceCount}
            regionName={regionInfo?.regionName || 'Unknown Region'}
            speciesImageUrl={selectedCarouselSpecies.imageUrl}
            dietaryCategory={selectedCarouselSpecies.dietaryCategory}
            onChatClick={() => {
              toast({
                title: 'Learn More',
                description: `Ask questions about ${selectedCarouselSpecies.commonName}...`,
              });
            }}
            onSelectForGame={handleSelectSpeciesForGame}
            isSelectedForGame={isSpeciesSelected(selectedCarouselSpecies.scientificName)}
          />

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || regionSpecies.length === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleNextSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || regionSpecies.length === 0}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* 🎮 Play Trivia Button - Shows when all 3 species selected */}
          {isAllSlotsFilledForTrivia() && (
            <Button
              onClick={handlePlayTrivia}
              className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
            >
              🎮 Play Trivia
            </Button>
          )}

          {/* Back to Globe Button */}
          <Button
            onClick={() => {
              // Reset everything to go back to 3D globe
              setSelectedCarouselSpecies(null);
              setRegionInfo(null);
              setRegionSpecies([]);
              setCurrentHabitat(null);
              setHabitats([]);
              setHabitatZones([]);
              setIsViewingEcoRegion(false);
              setSearchType(null);
              setMapCenter(null);
              setUseGoogleMaps(false);
              setSelectedFoodWebSpecies({ carnivore: null, herbivoreOmnivore: null, producer: null }); // Reset food web game
              setResetGlobeView(true);
              setTimeout(() => setResetGlobeView(false), 100);

              toast({
                title: 'Back to Globe 🌍',
                description: 'Returning to world view...',
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="outline"
          >
            Back to Globe
          </Button>
        </div>
      ) : speciesInfo ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <FastFactsCard
            commonName={speciesInfo.commonName}
            animalType={speciesInfo.animalType}
            population={speciesInfo.population}
            populationTrend={speciesInfo.populationTrend}
            conservationStatus={speciesInfo.conservationStatus}
            imageUrl={speciesInfo.imageUrl}
            onChatClick={handleChatClick}
          />

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || regionSpecies.length === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleNextSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || regionSpecies.length === 0}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Generate Lesson Plan Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Lesson Plan',
                description: `Generating lesson plan for ${speciesInfo.commonName}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>
        </div>
      ) : currentHabitat ? (
        <div className="absolute right-0 top-24 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <HabitatFactsCard
            habitat={currentHabitat}
            imageUrl={currentHabitat.imageUrl}
            onChatClick={() => {
              toast({
                title: 'Habitat Chat',
                description: 'Ask me anything about this habitat!',
              });
            }}
          />

          {/* Navigation Arrows */}
          <div className="flex gap-2">
            <Button
              onClick={handlePreviousSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || getFilteredSpecies().length === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              onClick={handleNextSpecies}
              className="glass-panel flex-1 h-10 hover:bg-white/10 transition-colors"
              variant="secondary"
              disabled={isLoading || getFilteredSpecies().length === 0}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Generate Lesson Plan Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Lesson Plan',
                description: `Generating lesson plan for ${currentHabitat.name}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>
        </div>
      ) : null}

      {/* Global Health Bar - Top Center */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-auto items-center">
        <GlobalHealthBar />

        {/* 🎮 Food Web Selection Bar - Under Health Bar */}
        {useGoogleMaps && (
          <FoodWebSelectionBar selectedSpecies={selectedFoodWebSpecies} />
        )}
      </div>

      {/* Chat History and Input with Reset Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-[1250px] flex flex-col items-center gap-3 pointer-events-none">
        {/* Active Layers Chip */}
        {activeLayers.length > 0 && (
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {activeLayers.map(l => `${l.name}: ${l.count}`).join(' • ')}
            </span>
          </div>
        )}

        {/* Search Loader - Shows for initial load OR background fetches */}
        <SearchLoader 
          isLoading={isLoading || isBackgroundLoading} 
          message={
            isBackgroundLoading ? "Finding nearby wildlife locations..." :
            currentSpecies ? "Fetching wildlife data..." : 
            "Discovering habitat..."
          }
        />


        <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
          <div className="w-full max-w-[450px] flex flex-col gap-1">
            {/* Chat History - shows above input when expanded */}
            <ChatHistory
              messages={chatHistory}
              isExpanded={isChatHistoryExpanded}
              onMinimize={() => setIsChatHistoryExpanded(false)}
            />

            <ChatInput
              onSubmit={handleSearch}
              isLoading={isLoading}
              context={chatContext}
              onFocus={() => {
                // Enable deep dive mode when user focuses on the input with a species/habitat selected
                if (speciesInfo || currentHabitat) {
                  setIsDeepDiveMode(true);
                  // Expand chat history if there are messages
                  if (chatHistory.length > 0) {
                    setIsChatHistoryExpanded(true);
                  }
                }
              }}
            />
          </div>
          {(habitats.length > 0 || userPins.length > 0 || speciesInfo || currentHabitat) && (
            <Button
              onClick={handleReset}
              variant="secondary"
              size="icon"
              className="glass-panel rounded-xl h-12 w-12 shrink-0 mb-2 hover:bg-secondary/80"
              title="Reset view"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Info Card */}
      {habitats.length === 0 && !hasInteracted && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="glass-panel rounded-2xl px-8 py-4 max-w-lg text-center animate-float">
            <p className="text-muted-foreground">
              Search for endangered species like <span className="text-accent font-medium">Polar Bear</span> or locations like <span className="text-accent font-medium">Las Vegas</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
