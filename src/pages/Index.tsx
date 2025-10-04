import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput from '@/components/ChatInput';
import FastFactsCard from '@/components/FastFactsCard';
import ExpandedImageView from '@/components/ExpandedImageView';
import RegionalAnimalsList from '@/components/RegionalAnimalsList';
import ConservationLayers from '@/components/ConservationLayers';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import earthMascot from '@/assets/earth-mascot-user.png';
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

  const handleSearch = async (query: string) => {
    // If expanded image is open, send message to chat instead
    if (expandedImage) {
      setChatMessage(query);
      // Reset after a brief moment to allow useEffect to pick it up
      setTimeout(() => setChatMessage(''), 100);
      return;
    }

    setIsLoading(true);
    setHasInteracted(true);
    
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('polar bear') || lowerQuery.includes('arctic')) {
        const data = speciesData['polar-bear'];
        setHabitats(data.habitats);
        setCurrentSpecies('Polar Bear');
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
        toast({ title: 'Polar Bear found', description: 'Showing habitats and ecosystem images' });
      } else {
        toast({
          title: 'No Results',
          description: 'Try searching for: Polar Bear',
          variant: 'destructive',
        });
        setHabitats([]);
        setCurrentSpecies(null);
        setSpeciesInfo(null);
        setImageMarkers([]);
      }
      
      setIsLoading(false);
    }, 1000);
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
      {/* Globe */}
      <div className="absolute inset-0">
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
        />
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

      {/* Left Side Card */}
      {speciesInfo && (
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
              Search for endangered species like <span className="text-accent font-medium">Polar Bear</span> or enter a location
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
