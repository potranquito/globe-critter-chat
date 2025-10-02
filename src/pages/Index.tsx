import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import ChatInput from '@/components/ChatInput';
import FastFactsCard from '@/components/FastFactsCard';
import HabitatCarousel from '@/components/HabitatCarousel';
import ChatWithMeCard from '@/components/ChatWithMeCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import earthMascot from '@/assets/earth-mascot-user.png';
import polarBearReal from '@/assets/polar-bear-real.jpg';
import polarBearAvatar from '@/assets/polar-bear-avatar.png';
import arcticHabitat1 from '@/assets/arctic-habitat-1.jpg';
import arcticHabitat2 from '@/assets/arctic-habitat-2.jpg';

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
      scientificName: 'Ursus maritimus',
      population: '22,000 - 31,000',
      threats: 'Sea ice loss from climate change, pollution, and oil spills',
      imageUrl: polarBearReal,
      avatarUrl: polarBearAvatar,
      habitatImages: [arcticHabitat1, arcticHabitat2],
      locationName: 'Arctic Regions'
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

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      
      if (lowerQuery.includes('polar bear') || lowerQuery.includes('arctic')) {
        const data = speciesData['polar bear'];
        setHabitats(data.habitats);
        setCurrentSpecies('Polar Bear');
        setSpeciesInfo(data.info);
        toast({
          title: 'Habitats Found!',
          description: `Displaying ${data.habitats.length} locations for Polar Bear`,
        });
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

  const handleLearnMore = () => {
    toast({
      title: 'Learn More',
      description: 'Opening species conservation information...',
    });
  };

  const handleChatClick = () => {
    toast({
      title: 'Chat Started',
      description: `Starting conversation with ${currentSpecies}...`,
    });
  };

  const handleDoubleGlobeClick = (lat: number, lng: number) => {
    setUserPins((prev) => [...prev, { lat, lng, species: 'Pinned', size: 0.8, color: '#22C55E' }]);
    setPinLocation({ lat, lng });
    setPinImagesVisible(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Globe */}
      <div className="absolute inset-0">
        <GlobeComponent habitats={[...habitats, ...userPins]} onPointClick={handlePointClick} onDoubleGlobeClick={handleDoubleGlobeClick} />
      </div>

      {/* Left Side Cards */}
      {speciesInfo && (
        <div className="absolute left-6 top-6 w-64 max-h-[calc(100vh-12rem)] overflow-y-auto z-20 space-y-2">
          <FastFactsCard
            commonName={speciesInfo.commonName}
            scientificName={speciesInfo.scientificName}
            population={speciesInfo.population}
            threats={speciesInfo.threats}
            imageUrl={speciesInfo.imageUrl}
            onLearnMore={handleLearnMore}
          />
          <HabitatCarousel
            images={speciesInfo.habitatImages}
            locationName={speciesInfo.locationName}
          />
        </div>
      )}

      {/* Right Side Card */}
      {speciesInfo && (
        <div className="absolute right-6 top-6 w-60 z-20">
          <ChatWithMeCard
            avatarUrl={speciesInfo.avatarUrl}
            animalName={currentSpecies || ''}
            onChatClick={handleChatClick}
          />
        </div>
      )}

      {/* Chat Input with Earth Mascot */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-6 flex justify-center items-end gap-4">
        <img 
          src={earthMascot} 
          alt="Earth Mascot" 
          className="w-20 h-20 object-contain animate-float mb-2"
        />
        <ChatInput onSubmit={handleSearch} isLoading={isLoading} />
      </div>

      {/* Info Card */}
      {habitats.length === 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
          <div className="glass-panel rounded-2xl px-8 py-4 max-w-lg text-center animate-float">
            <p className="text-muted-foreground">
              Search for endangered species like <span className="text-accent font-medium">Polar Bear</span> or enter a location
            </p>
          </div>
        </div>
      )}

      {/* Pinned Location Carousel */}
      {pinImagesVisible && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 w-[28rem] max-w-[90vw]">
          <div className="glass-panel rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">
                Endangered animals near {pinLocation?.lat.toFixed(2)}, {pinLocation?.lng.toFixed(2)}
              </p>
              <Button size="sm" variant="secondary" onClick={() => setPinImagesVisible(false)}>Close</Button>
            </div>
            <HabitatCarousel images={speciesInfo?.habitatImages || [arcticHabitat1, arcticHabitat2]} locationName={speciesInfo?.locationName || 'Nearby Region'} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
