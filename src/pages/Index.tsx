import { useState } from 'react';
import GlobeComponent from '@/components/Globe';
import ChatInput from '@/components/ChatInput';
import SpeciesInfo from '@/components/SpeciesInfo';
import { useToast } from '@/hooks/use-toast';

// Sample habitat data
const sampleHabitats = {
  'polar bear': [
    { lat: 71.2, lng: -156.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
    { lat: 78.9, lng: 11.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
    { lat: 69.6, lng: 18.9, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
    { lat: 74.4, lng: -95.8, species: 'Polar Bear', size: 0.8, color: '#F59E0B' },
  ],
  'bengal tiger': [
    { lat: 27.7, lng: 88.4, species: 'Bengal Tiger', size: 0.8, color: '#F97316' },
    { lat: 28.6, lng: 77.2, species: 'Bengal Tiger', size: 0.8, color: '#F97316' },
    { lat: 22.5, lng: 88.3, species: 'Bengal Tiger', size: 0.8, color: '#F97316' },
  ],
  'mountain gorilla': [
    { lat: -1.4, lng: 29.7, species: 'Mountain Gorilla', size: 0.8, color: '#10B981' },
    { lat: -1.1, lng: 29.5, species: 'Mountain Gorilla', size: 0.8, color: '#10B981' },
  ],
  'giant panda': [
    { lat: 31.2, lng: 103.7, species: 'Giant Panda', size: 0.8, color: '#EC4899' },
    { lat: 30.7, lng: 104.0, species: 'Giant Panda', size: 0.8, color: '#EC4899' },
  ],
};

const Index = () => {
  const { toast } = useToast();
  const [habitats, setHabitats] = useState<any[]>([]);
  const [currentSpecies, setCurrentSpecies] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const lowerQuery = query.toLowerCase();
      let foundHabitats: any[] = [];
      let species = '';

      // Simple matching logic (will be replaced with AI)
      if (lowerQuery.includes('polar bear') || lowerQuery.includes('arctic')) {
        foundHabitats = sampleHabitats['polar bear'];
        species = 'Polar Bear';
      } else if (lowerQuery.includes('tiger') || lowerQuery.includes('bengal')) {
        foundHabitats = sampleHabitats['bengal tiger'];
        species = 'Bengal Tiger';
      } else if (lowerQuery.includes('gorilla')) {
        foundHabitats = sampleHabitats['mountain gorilla'];
        species = 'Mountain Gorilla';
      } else if (lowerQuery.includes('panda')) {
        foundHabitats = sampleHabitats['giant panda'];
        species = 'Giant Panda';
      }

      if (foundHabitats.length > 0) {
        setHabitats(foundHabitats);
        setCurrentSpecies(species);
        toast({
          title: 'Habitats Found!',
          description: `Displaying ${foundHabitats.length} locations for ${species}`,
        });
      } else {
        toast({
          title: 'No Results',
          description: 'Try searching for: Polar Bear, Bengal Tiger, Mountain Gorilla, or Giant Panda',
          variant: 'destructive',
        });
      }
      
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-6">
        <div className="flex justify-between items-center">
          <div className="glass-panel px-6 py-3 rounded-2xl">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Wildlife Habitat Explorer
            </h1>
          </div>
          {currentSpecies && (
            <SpeciesInfo
              species={currentSpecies}
              status="Endangered"
              locations={habitats.length}
            />
          )}
        </div>
      </header>

      {/* Globe */}
      <div className="absolute inset-0">
        <GlobeComponent habitats={habitats} />
      </div>

      {/* Chat Input */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 w-full px-6 flex justify-center">
        <ChatInput onSubmit={handleSearch} isLoading={isLoading} />
      </div>

      {/* Info Card */}
      {habitats.length === 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20">
          <div className="glass-panel rounded-2xl px-8 py-4 max-w-lg text-center animate-float">
            <p className="text-muted-foreground">
              Search for endangered species like <span className="text-accent font-medium">Polar Bear</span>, <span className="text-accent font-medium">Bengal Tiger</span>, or enter a location
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
