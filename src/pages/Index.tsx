import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import ChatInput from '@/components/ChatInput';
import FastFactsCard from '@/components/FastFactsCard';
import HabitatCarousel from '@/components/HabitatCarousel';
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

// Sample habitat data with species info
const speciesData = {
  'polar bear': {
    habitats: [
      { lat: 71.2, lng: -156.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 78.9, lng: 11.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 69.6, lng: 18.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
      { lat: 74.4, lng: -95.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
    ],
    info: {
      commonName: 'Polar Bear',
      population: '22,000 - 31,000',
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

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setHasInteracted(true);
    
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('polar bear') || lowerQuery.includes('arctic')) {
        const data = speciesData['polar bear'];
        setHabitats(data.habitats);
        setCurrentSpecies('Polar Bear');
        setSpeciesInfo(data.info);
      } else {
        toast({
          title: 'No Results',
          description: 'Try searching for: Polar Bear',
          variant: 'destructive',
        });
        setHabitats([]);
        setCurrentSpecies(null);
        setSpeciesInfo(null);
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
    setUserPins((prev) => [...prev, { lat, lng, species: 'Searched Location', size: 0.8, color: '#22C55E' }]);
    setPinLocation({ lat, lng });
    
    // Search for species in this region (Arctic for demo)
    if (lat > 60 || lat < -60) {
      // Arctic or Antarctic region
      const data = speciesData['polar bear'];
      setHabitats([{ lat, lng, species: 'Polar Bear', size: 0.8, color: '#F59E0B' }]);
      setCurrentSpecies('Polar Bear');
      setSpeciesInfo(data.info);
      toast({
        title: 'Species Found!',
        description: `Found Polar Bear in this Arctic region`,
      });
    } else {
      toast({
        title: 'Searching Region',
        description: `Searching for species at ${lat.toFixed(2)}, ${lng.toFixed(2)}...`,
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
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Globe */}
      <div className="absolute inset-0">
        <GlobeComponent habitats={[...habitats, ...userPins]} onPointClick={handlePointClick} onDoubleGlobeClick={handleDoubleGlobeClick} />
      </div>

      {/* Left Side Card */}
      {speciesInfo && (
        <div className="absolute left-6 top-6 w-64 max-h-[calc(100vh-12rem)] overflow-y-auto z-20">
          <FastFactsCard
            commonName={speciesInfo.commonName}
            population={speciesInfo.population}
            imageUrl={speciesInfo.imageUrl}
            onChatClick={handleChatClick}
          />
        </div>
      )}

      {/* Right Side Cards */}
      {speciesInfo && (
        <div className="absolute right-6 top-6 w-60 max-h-[calc(100vh-12rem)] overflow-y-auto z-20 space-y-2">
          <HabitatCarousel
            images={speciesInfo.threatImages}
            locationName="Threats to Habitat"
          />
          <HabitatCarousel
            images={speciesInfo.ecosystemImages}
            locationName="Ecosystem"
          />
        </div>
      )}

      {/* Chat Input with Earth Mascot and Reset Button */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-6 flex justify-center items-end gap-4">
        <img 
          src={earthMascot} 
          alt="Earth Mascot" 
          className="w-20 h-20 object-contain animate-float mb-2"
        />
        <ChatInput onSubmit={handleSearch} isLoading={isLoading} />
        {(habitats.length > 0 || userPins.length > 0) && (
          <Button 
            onClick={handleReset}
            variant="secondary"
            size="icon"
            className="glass-panel rounded-xl h-12 w-12 shrink-0 mb-2"
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Info Card */}
      {habitats.length === 0 && !hasInteracted && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
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
