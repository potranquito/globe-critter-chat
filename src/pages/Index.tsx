import { useState, useMemo } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { UserProfile } from '@/components/UserProfile';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';
import FastFactsCard from '@/components/FastFactsCard';
import RegionSpeciesCard from '@/components/RegionSpeciesCard';
import ExpandedImageView from '@/components/ExpandedImageView';
import RegionalAnimalsList from '@/components/RegionalAnimalsList';
import MapControls from '@/components/MapControls';
import { HabitatInfoCard } from '@/components/HabitatInfoCard';
import { HabitatFactsCard } from '@/components/HabitatFactsCard';
import { HabitatSpeciesList } from '@/components/HabitatSpeciesList';
import { SearchLoader } from '@/components/SearchLoader';
import WildlifeLocationCard from '@/components/WildlifeLocationCard';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { LocationsCarousel } from '@/components/LocationsCarousel';
import { SpeciesFilterBanner } from '@/components/SpeciesFilterBanner';
import { useToast } from '@/hooks/use-toast';
import { useLocationDiscovery } from '@/hooks/useLocationDiscovery';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HabitatRegion } from '@/types/habitat';
import { performRegionAnalysis } from '@/services/regionService';
import type { RegionInfo, RegionSpecies } from '@/services/regionService';
import type { FilterCategory } from '@/types/speciesFilter';
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
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isDeepDiveMode, setIsDeepDiveMode] = useState(false);
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState<number>(0);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);
    setIsLoading(true);
    setHasInteracted(true);

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
      
      const species = speciesData[speciesKey];
      
      // Set species info to show the FastFactsCard
      setSpeciesInfo({
        ...species.info,
        species: speciesKey
      });
      
      // Clear habitat to ensure species card shows
      setCurrentHabitat(null);
      setCurrentSpecies(query);
      
      // Set habitat markers from species data with animal image
      if (species.habitats) {
        const habitatPoints = species.habitats.map((h: any) => ({
          ...h,
          emoji: '🟢',
          type: 'species',
          imageUrl: species.info.imageUrl, // Add the animal image to markers
          name: species.info.commonName
        }));
        setHabitats(habitatPoints);

        // Zoom to first habitat location
        if (species.habitats[0]) {
          setMapCenter({
            lat: species.habitats[0].lat,
            lng: species.habitats[0].lng
          });
        }

        // NEW: Analyze region and discover species
        try {
          const { region, species: discoveredSpecies } = await performRegionAnalysis(
            habitatPoints,
            species.info.commonName,
            30
          );
          setRegionInfo(region);
          setRegionSpecies(discoveredSpecies);
          console.log('Region analysis complete:', region.regionName);
        } catch (regionError) {
          console.error('Region analysis failed:', regionError);
        }
      }

      setIsLoading(false);
      return;
    }
    
    // Handle location/habitat search
    console.log('Location search:', query);
      
      // Handle location/habitat search
      console.log('Location search:', query);
      
      try {
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
    toast({
      title: 'Location Selected',
      description: `Viewing ${point.species} habitat at ${point.lat.toFixed(2)}, ${point.lng.toFixed(2)}`,
    });
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

    // If a species or habitat is currently selected, just record the pin location
    // without clearing the view
    if (speciesInfo || currentHabitat || habitats.length > 0) {
      setPinLocation({ lat, lng });
      toast({ title: 'Location Selected', description: `${lat.toFixed(2)}, ${lng.toFixed(2)}` });
      return;
    }

    // Only show regional animals list if nothing is selected
    setPinLocation({ lat, lng });

    // Determine region based on latitude
    let region;
    if (lat > 60) {
      region = 'arctic';
    } else if (lat < -60) {
      region = 'antarctic';
    } else if (lat > -23.5 && lat < 23.5) {
      region = 'tropical';
    }

    if (region && regionalSpecies[region]) {
      setRegionalAnimals(regionalSpecies[region].animals);
      setSelectedRegion(regionalSpecies[region].name);
    } else {
      toast({
        title: 'No Data Available',
        description: `No species data for this region yet.`,
      });
    }
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

  // Filter species based on active filters - works for both region and habitat species
  const getFilteredSpecies = () => {
    // Use habitat species if viewing a habitat, otherwise use region species
    const speciesList = currentHabitat?.keySpecies || regionSpecies;

    if (activeSpeciesFilters.size === 0) return speciesList;

    return speciesList.filter(sp => {
      for (const filter of activeSpeciesFilters) {
        // Handle both RegionSpecies (animalType) and Species (type) formats
        const animalType = (sp.animalType || sp.type)?.toLowerCase() || '';
        const conservationStatus = sp.conservationStatus?.toUpperCase() || '';

        const animalTypes = ['mammal', 'bird', 'fish', 'reptile', 'amphibian', 'insect'];
        if (filter === 'all-animals' && animalTypes.includes(animalType)) return true;
        if (filter === 'mammals' && animalType === 'mammal') return true;
        if (filter === 'birds' && animalType === 'bird') return true;
        if (filter === 'fish' && animalType === 'fish') return true;
        if (filter === 'reptiles' && animalType === 'reptile') return true;
        if (filter === 'amphibians' && animalType === 'amphibian') return true;
        if (filter === 'insects' && animalType === 'insect') return true;
        if (filter === 'plants' && animalType === 'plant') return true;
        if (filter === 'endangered') {
          const endangeredStatuses = ['CR', 'EN', 'VU'];
          if (endangeredStatuses.includes(conservationStatus)) return true;
        }
      }
      return false;
    });
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

          // Step 3: Add discovered markers to globe/map
          const discoveredMarkers = locationDiscovery.getHabitatPoints();
          setHabitats(prev => [...prev, ...discoveredMarkers]);

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
      <div className="absolute inset-0">
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
            locationName={locationName}
          />
        ) : (
          <GlobeComponent 
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
            targetLocation={mapCenter}
          />
        )}
      </div>

      {/* Map/Globe Toggle - Hidden (now in left controls) */}

      {/* Species Filter Banner - Far Left Edge (pinned to screen edge) */}
      {(regionInfo || currentHabitat) && (
        <div className="absolute left-0 top-6 bottom-6 w-16 z-[50] pointer-events-auto">
          <SpeciesFilterBanner
            activeFilters={activeSpeciesFilters}
            onFilterToggle={handleSpeciesFilterToggle}
          />
        </div>
      )}

      {/* Locations Carousel - Left Side Vertical (when locations filter is active) */}
      {activeSpeciesFilters.has('locations') && (wildlifePlaces.length > 0 || protectedAreas.length > 0) && regionInfo && (
        <div className="absolute left-20 top-6 bottom-6 w-72 z-[60] pointer-events-auto">
          <LocationsCarousel
            wildlifePlaces={wildlifePlaces}
            protectedAreas={protectedAreas}
            regionName={regionInfo.regionName}
            onLocationSelect={(location) => {
              console.log('Selected location:', location);
              // Pan to location
              setMapCenter({ lat: location.location.lat, lng: location.location.lng });
              toast({
                title: location.name,
                description: 'Centered on location',
              });
            }}
            currentLocation={undefined}
          />
        </div>
      )}

      {/* Region Species Carousel - Left Side Vertical (narrower, closer to filter) */}
      {!activeSpeciesFilters.has('locations') && regionInfo && regionSpecies.length > 0 && !currentHabitat && (
        <div className="absolute left-20 top-6 bottom-6 w-72 z-[60] pointer-events-auto">
          <RegionSpeciesCarousel
            species={regionSpecies}
            regionName={regionInfo.regionName}
            currentSpecies={selectedCarouselSpecies?.scientificName || speciesInfo?.scientificName}
            onSpeciesSelect={handleCarouselSpeciesSelect}
            activeFilters={activeSpeciesFilters}
          />
        </div>
      )}

      {/* Habitat Species List - Left Side Vertical (narrower, closer to filter) */}
      {currentHabitat && currentHabitat.keySpecies && currentHabitat.keySpecies.length > 0 && (
        <div className="absolute left-20 top-6 bottom-6 w-72 z-[60] pointer-events-auto">
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

      {/* Regional Animals List */}
      {regionalAnimals && selectedRegion && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 max-w-3xl w-full px-6">
          <RegionalAnimalsList
            animals={regionalAnimals}
            region={selectedRegion}
            onAnimalClick={handleAnimalSelect}
            onClose={handleCloseRegionalList}
          />
        </div>
      )}

      {/* Right Side Card - MUTUALLY EXCLUSIVE - Only ONE card shows at a time */}

      {/* Priority 1: Wildlife Park Card */}
      {selectedWildlifePark ? (
        <div className="absolute right-0 top-6 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <WildlifeLocationCard
            name={selectedWildlifePark.name}
            address={selectedWildlifePark.address}
            rating={selectedWildlifePark.rating}
            imageUrl={selectedWildlifePark.imageUrl}
            photoReference={selectedWildlifePark.photoReference}
            types={selectedWildlifePark.types}
            location={{ lat: selectedWildlifePark.lat, lng: selectedWildlifePark.lng }}
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

          {/* Generate Lesson Plan Button */}
          <Button
            onClick={() => {
              toast({
                title: 'Lesson Plan',
                description: `Generating lesson plan for ${selectedWildlifePark.name}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>
        </div>
      )

      /* Priority 2: Expanded Image View */
      : expandedImage ? (
        <div className="absolute right-0 top-6 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
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
      )

      /* Priority 3: Carousel Species */
      : selectedCarouselSpecies ? (
        <div className="absolute right-0 top-6 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
          <RegionSpeciesCard
            commonName={selectedCarouselSpecies.commonName}
            scientificName={selectedCarouselSpecies.scientificName}
            animalType={selectedCarouselSpecies.animalType}
            conservationStatus={selectedCarouselSpecies.conservationStatus}
            occurrenceCount={selectedCarouselSpecies.occurrenceCount}
            regionName={regionInfo?.regionName || 'Unknown Region'}
            regionImageUrl={regionInfo?.regionName ? undefined : undefined}
            onChatClick={() => {
              toast({
                title: 'Learn More',
                description: `Ask questions about ${selectedCarouselSpecies.commonName}...`,
              });
            }}
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
                description: `Generating lesson plan for ${selectedCarouselSpecies.commonName}...`,
              });
            }}
            className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
            variant="secondary"
          >
            Generate Lesson Plan
          </Button>
        </div>
      )

      /* Priority 4: Hardcoded Species (e.g., Polar Bear) */
      : speciesInfo ? (
        <div className="absolute right-0 top-6 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
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
      )

      /* Priority 5: Habitat */
      : currentHabitat ? (
        <div className="absolute right-0 top-6 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4">
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

      {/* Map Controls - Top Center */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-auto items-center">
        <MapControls
          useGoogleMaps={useGoogleMaps}
          onToggleMap={handleToggleMapView}
          onFetchLocation={handleFetchLocation}
          isDiscovering={locationDiscovery.isDiscovering}
          onLeaderboardClick={() => {
            toast({
              title: 'Leaderboard Coming Soon',
              description: 'Track top contributors and conservation efforts!',
            });
          }}
        />
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

        {/* Search Loader */}
        <SearchLoader 
          isLoading={isLoading} 
          message={currentSpecies ? "Fetching wildlife data..." : "Discovering habitat..."}
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
