import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput from '@/components/ChatInput';
import FastFactsCard from '@/components/FastFactsCard';
import ExpandedImageView from '@/components/ExpandedImageView';
import RegionalAnimalsList from '@/components/RegionalAnimalsList';
import MapControls from '@/components/MapControls';
import FilterMenu from '@/components/FilterMenu';
import { HabitatInfoCard } from '@/components/HabitatInfoCard';
import { HabitatFactsCard } from '@/components/HabitatFactsCard';
import { SearchLoader } from '@/components/SearchLoader';
import WildlifeLocationCard from '@/components/WildlifeLocationCard';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { HabitatRegion } from '@/types/habitat';
import { performRegionAnalysis } from '@/services/regionService';
import type { RegionInfo, RegionSpecies } from '@/services/regionService';
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
  const [locationName, setLocationName] = useState<string>('');
  const [currentHabitat, setCurrentHabitat] = useState<HabitatRegion | null>(null);
  const [selectedWildlifePark, setSelectedWildlifePark] = useState<any>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [regionInfo, setRegionInfo] = useState<RegionInfo | null>(null);
  const [regionSpecies, setRegionSpecies] = useState<RegionSpecies[]>([]);

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);
    setIsLoading(true);
    setHasInteracted(true);
    
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

        // Step 3: Fetch nearby wildlife parks, protected areas, and threats in parallel
        const [wildlifeResult, areasResult, threatsResult] = await Promise.all([
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
          keySpecies: []
        };
        
        setCurrentHabitat(enrichedHabitat);
        setSpeciesInfo(null); // Clear species info when showing habitat
        setCurrentSpecies(null); // Clear current species
        
        // Create markers for globe
        const markers: any[] = [];

        // Add wildlife park markers with images as thumbnails
        wildlifeParks.forEach(park => {
          if (park.imageUrl) {
            markers.push({
              lat: park.lat,
              lng: park.lng,
              name: park.name,
              size: 1.2,
              type: 'wildlife-park',
              imageUrl: park.imageUrl,
              info: {
                name: park.name,
                address: park.address,
                rating: park.rating
              }
            });
          } else {
            // Fallback to emoji if no image found
            markers.push({
              lat: park.lat,
              lng: park.lng,
              name: park.name,
              size: 1,
              emoji: '🌳',
              type: 'wildlife-park'
            });
          }
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
        
        // Set target location for globe to zoom to
        setMapCenter({ lat: habitat.location.lat, lng: habitat.location.lng });
        
        toast({
          title: `${habitat.name} Discovered`,
          description: `${wildlifeParks.length} wildlife parks, ${threats.length} active threats`,
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

    // If a species is currently selected, don't clear the view.
    // Treat double-click as a quick inspect without resetting cards/data.
    if (speciesInfo) {
      setPinLocation({ lat, lng });
      toast({ title: 'Location Selected', description: `${lat.toFixed(2)}, ${lng.toFixed(2)}` });
      return;
    }
    
    // Reset everything first when no species is selected
    setHabitats([]);
    setCurrentSpecies(null);
    setSpeciesInfo(null);
    setUserPins([]);
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
    // When a species is selected from the carousel, search for it
    await handleSearch(species.commonName);
  };

  const handleReset = () => {
    setHabitats([]);
    setCurrentSpecies(null);
    setSpeciesInfo(null);
    setUserPins([]);
    setPinLocation(null);
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
    setWildlifePlaces([]);
    setLocationName('');
    setCurrentHabitat(null);
    setSelectedWildlifePark(null);
    setRegionInfo(null);
    setRegionSpecies([]);
    toast({ title: 'View Reset', description: 'Showing global view' });
  };

  const handleFetchLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        const location = {
          lat: data.latitude,
          lng: data.longitude,
          name: data.city ? `${data.city}, ${data.country_name}` : data.country_name
        };
        
        setUserPins([location]);
        toast({
          title: "Location Found",
          description: `Showing ${location.name}`,
        });
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
    setUseGoogleMaps(prev => !prev);
    toast({
      title: useGoogleMaps ? 'Switched to Globe View' : 'Switched to Satellite View',
      description: useGoogleMaps ? 'Exploring with 3D globe' : 'Exploring with Google Maps satellite imagery'
    });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
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

      {/* Region Species Carousel - Left Side Vertical */}
      {regionInfo && regionSpecies.length > 0 && (
        <div className="absolute left-6 top-6 bottom-6 w-80 z-[60] pointer-events-auto">
          <RegionSpeciesCarousel
            species={regionSpecies}
            regionName={regionInfo.regionName}
            currentSpecies={speciesInfo?.scientificName}
            onSpeciesSelect={handleCarouselSpeciesSelect}
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

      {/* Wildlife Park Card - Left Side */}
      {selectedWildlifePark && !regionInfo && (
        <div className="absolute left-6 top-6 w-80 z-[60] pointer-events-auto">
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
        </div>
      )}

      {/* Right Side Card - Species with Chat Below */}
      {speciesInfo && !currentHabitat && !selectedWildlifePark && (
        <div className="absolute right-6 top-6 w-96 z-[60] pointer-events-auto flex flex-col gap-4">
          <FastFactsCard
            commonName={speciesInfo.commonName}
            animalType={speciesInfo.animalType}
            population={speciesInfo.population}
            populationTrend={speciesInfo.populationTrend}
            conservationStatus={speciesInfo.conservationStatus}
            imageUrl={speciesInfo.imageUrl}
            onChatClick={handleChatClick}
          />

          {/* Chat Input Below Animal Card */}
          <div className="glass-panel rounded-2xl p-2">
            <ChatInput
              onSubmit={handleSearch}
              isLoading={isLoading}
              placeholder={`Ask about ${speciesInfo.commonName}...`}
            />
          </div>
        </div>
      )}

      {/* Left Side Card - Habitat */}
      {currentHabitat && (
        <div className="absolute left-6 top-6 w-64 z-[60] pointer-events-auto">
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
        </div>
      )}

      {/* Expanded Image View */}
      {expandedImage && (
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
        />
      )}

      {/* Map Controls - Top Center */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-auto items-center">
        <MapControls
          useGoogleMaps={useGoogleMaps}
          onToggleMap={handleToggleMapView}
          onFetchLocation={handleFetchLocation}
          onFilterClick={() => setFilterMenuOpen(!filterMenuOpen)}
        />
        {filterMenuOpen && (
          <FilterMenu
            isOpen={filterMenuOpen}
            onClose={() => setFilterMenuOpen(false)}
            onToggleLayer={handleLayerToggle}
          />
        )}
      </div>

      {/* Chat Input with Reset Button */}
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

        {/* Navigation buttons - only show when image is expanded */}
        {expandedImage && (
          <div className="flex gap-2 pointer-events-auto">
            <Button 
              onClick={handlePreviousImage}
              variant="secondary"
              size="sm"
              className="glass-panel"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <Button 
              onClick={handleNextImage}
              variant="secondary"
              size="sm"
              className="glass-panel"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
        
        <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
          <div className="w-full max-w-[450px]">
            <ChatInput
              onSubmit={handleSearch} 
              isLoading={isLoading}
              placeholder={currentSpecies ? `Inquire further about ${currentSpecies}` : undefined}
            />
          </div>
          {(habitats.length > 0 || userPins.length > 0 || speciesInfo) && (
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
