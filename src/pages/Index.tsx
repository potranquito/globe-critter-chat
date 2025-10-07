import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput from '@/components/ChatInput';
import FastFactsCard from '@/components/FastFactsCard';
import ExpandedImageView from '@/components/ExpandedImageView';
import RegionalAnimalsList from '@/components/RegionalAnimalsList';
import ConservationLayers from '@/components/ConservationLayers';
import { HabitatInfoCard } from '@/components/HabitatInfoCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronLeft, ChevronRight, MapPin, Globe, Map, X } from 'lucide-react';
import earthMascot from '@/assets/earth-mascot-user.png';
import type { HabitatRegion } from '@/types/habitat';
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
  const [showHabitatCard, setShowHabitatCard] = useState(false);

  const handleSearch = async (query: string) => {
    console.log('Search query:', query);
    
    // Check if it's a species or location search
    const lowerQuery = query.toLowerCase();
    const isSpeciesSearch = Object.keys(speciesData).some(species => 
      species.toLowerCase().includes(lowerQuery)
    );

    if (isSpeciesSearch) {
      // Handle species search as before
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('nearby-wildlife', {
        body: { location: query }
      });

      if (error || !data?.success) {
        console.error('Error fetching wildlife:', error);
        toast({
          title: "Species Search",
          description: `No observations found for "${query}"`,
        });
        return;
      }

      const speciesKey = Object.keys(speciesData).find(species => 
        species.toLowerCase().includes(lowerQuery)
      );
      if (speciesKey) {
        const species = speciesData[speciesKey];
        setSpeciesInfo({
          species: speciesKey,
          scientificName: species.scientificName || speciesKey,
          ...species
        });
      }

      // Zoom to the first observation
      const firstObs = data.observations[0];
      if (firstObs) {
        setCurrentSpecies(query);
        setHabitats(data.observations.map((obs: any) => ({
          lat: obs.latitude,
          lng: obs.longitude,
          species: obs.species_guess,
          size: 0.5,
          color: '#22c55e',
          emoji: '🟢'
        })));
      }
    } else {
      // Handle location/habitat search
      console.log('Location search:', query);
      
      const { supabase } = await import('@/integrations/supabase/client');
      
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

        // Step 3: Fetch protected areas
        let protectedAreas: any[] = [];
        try {
          const { data: areasData, error: areasError } = await supabase.functions.invoke('protected-areas', {
            body: { bounds: habitat.bounds }
          });
          
          if (!areasError && areasData?.success) {
            protectedAreas = areasData.protectedAreas || [];
            console.log(`Found ${protectedAreas.length} protected areas`);
          }
        } catch (err) {
          console.error('Error fetching protected areas:', err);
        }

        // Step 4: Fetch threats
        let threats: any[] = [];
        try {
          const { data: threatsData, error: threatsError } = await supabase.functions.invoke('habitat-threats', {
            body: { bounds: habitat.bounds }
          });
          
          if (!threatsError && threatsData?.success) {
            threats = threatsData.threats || [];
            console.log(`Found ${threats.length} threats`);
          }
        } catch (err) {
          console.error('Error fetching threats:', err);
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
        
        // Get habitat emoji based on climate
        const getHabitatEmoji = (climate: string) => {
          if (climate.toLowerCase().includes('desert')) return '🏜️';
          if (climate.toLowerCase().includes('forest') || climate.toLowerCase().includes('tropical')) return '🌲';
          if (climate.toLowerCase().includes('arctic') || climate.toLowerCase().includes('tundra')) return '❄️';
          if (climate.toLowerCase().includes('ocean') || climate.toLowerCase().includes('marine')) return '🌊';
          if (climate.toLowerCase().includes('grassland') || climate.toLowerCase().includes('savanna')) return '🌾';
          if (climate.toLowerCase().includes('wetland')) return '💧';
          return '🌍';
        };

        // Create markers for globe
        const markers: any[] = [
          // Main habitat marker
          {
            lat: habitat.location.lat,
            lng: habitat.location.lng,
            name: habitat.name,
            size: 2,
            emoji: getHabitatEmoji(habitat.climate),
            type: 'habitat',
            imageUrl: habitatImageUrl
          }
        ];

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
        
        toast({
          title: `${habitat.name} Discovered`,
          description: `${protectedAreas.length} protected areas, ${threats.length} active threats`,
        });
      } catch (err) {
        console.error('Error in habitat search:', err);
        toast({
          title: "Search Error",
          description: "Failed to search for location",
          variant: "destructive"
        });
      }
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

  const handleImageMarkerClick = (marker: any) => {
    console.log('Image marker clicked:', marker);
    
    // If it's a habitat marker, show the habitat card
    if (marker.type === 'habitat' && currentHabitat) {
      setShowHabitatCard(true);
      toast({
        title: 'Habitat Details',
        description: `Viewing ${currentHabitat.name}`,
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
      
      setActiveLayers(prev => {
        const filtered = prev.filter(l => l.name !== layerName);
        return [...filtered, { name: layerName, count }];
      });
      
      setConservationLayers(prev => {
        const filtered = prev.filter(l => l.type !== layerType);
        return [...filtered, data];
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
    setShowHabitatCard(false);
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

      {/* Map/Globe Toggle - Top Right */}
      <div className="absolute top-6 right-6 z-50 pointer-events-auto">
        <Button 
          onClick={handleToggleMapView}
          variant="secondary"
          size="sm"
          className="glass-panel rounded-xl h-10 px-3 flex items-center gap-2 hover:bg-secondary/80"
          title={useGoogleMaps ? 'Switch to Globe View' : 'Switch to Map View'}
        >
          {useGoogleMaps ? <Globe className="h-4 w-4" /> : <Map className="h-4 w-4" />}
          <span className="hidden sm:inline">{useGoogleMaps ? 'Globe View' : 'Map View'}</span>
        </Button>
      </div>

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

      {/* Habitat Split View - Image Left, Info Card Right */}
      {showHabitatCard && currentHabitat && (
        <div className="absolute inset-0 z-[70] flex pointer-events-auto bg-background/80 backdrop-blur-sm">
          {/* Left: Enlarged Habitat Image */}
          <div className="w-3/5 relative">
            <img 
              src={currentHabitat.imageUrl} 
              alt={currentHabitat.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Right: Habitat Info Card */}
          <div className="w-2/5 overflow-auto p-6">
            <HabitatInfoCard 
              habitat={currentHabitat}
              onClose={() => setShowHabitatCard(false)}
              onThreatClick={(threatId) => {
                console.log('Threat clicked:', threatId);
                // TODO: Handle threat detail view
              }}
            />
          </div>
        </div>
      )}

      {/* Left Side Card */}
      {speciesInfo && !showHabitatCard && (
        <div className="absolute left-6 top-6 w-64 z-[60]">
          <FastFactsCard
            commonName={speciesInfo.commonName}
            animalType={speciesInfo.animalType}
            population={speciesInfo.population}
            populationTrend={speciesInfo.populationTrend}
            conservationStatus={speciesInfo.conservationStatus}
            imageUrl={speciesInfo.imageUrl}
            onChatClick={handleChatClick}
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

      {/* Conservation Data - Bottom Left */}
      <div className="absolute bottom-8 left-6 z-50 pointer-events-auto">
        <ConservationLayers onToggleLayer={handleLayerToggle} />
      </div>

      {/* Chat Input with Earth Mascot and Reset Button */}
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
          <img 
            src={earthMascot} 
            alt="Earth Mascot" 
            className="w-16 h-16 object-contain animate-float -mb-1"
          />
          <div className="w-full max-w-[450px]">
            <ChatInput
              onSubmit={handleSearch} 
              isLoading={isLoading}
              placeholder={currentSpecies ? `Inquire further about ${currentSpecies}` : undefined}
            />
          </div>
          <Button 
            onClick={handleFetchLocation}
            variant="secondary"
            size="icon"
            className="glass-panel rounded-xl h-12 w-12 shrink-0 mb-2 hover:bg-secondary/80"
            title="Show my location"
          >
            <MapPin className="h-5 w-5" />
          </Button>
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
