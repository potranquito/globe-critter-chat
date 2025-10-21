import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RegionSpecies } from '@/services/regionService';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { SpeciesTypeFilter, type SpeciesTypeFilter as SpeciesTypeFilterType } from '@/components/SpeciesTypeFilter';
import { InfoCard } from '@/components/InfoCard';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
import { ParkList } from '@/components/ParkList';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';

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

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

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

        // Load parks for this eco-region using MCP server
        const boundsRadius = 10; // degrees (~1100km)

        // Query parks from database
        const { data: parksData, error: parksError } = await supabase
          .from('parks')
          .select('id, name, center_lat, center_lng, park_type, size_km2, wdpa_id, protection_status, image_url, image_attribution')
          .gte('center_lat', lat - boundsRadius)
          .lte('center_lat', lat + boundsRadius)
          .gte('center_lng', lng - boundsRadius)
          .lte('center_lng', lng + boundsRadius)
          .not('center_lat', 'is', null)
          .not('center_lng', 'is', null)
          .order('size_km2', { ascending: false })
          .limit(50);

        if (!parksError && parksData) {
          console.log(`Found ${parksData.length} parks`);
          // Transform to the format GoogleEarthMap expects
          const parks = parksData.map(park => ({
            ...park,
            lat: park.center_lat,
            lng: park.center_lng,
          }));
          setWildlifePlaces(parks);
        }

        // Load species using MCP server
        const { getRegionSpecies } = await import('@/services/mcpClient');

        console.log('🌿 Loading species with params:', {
          ecoregionName: regionName,
          limit: 200
        });

        // Only call MCP if we have a valid region name
        if (regionName && regionName.trim() !== '') {
          try {
            const speciesResult = await getRegionSpecies({
              ecoregionName: regionName,  // Correct parameter name
              limit: 200  // Get large pool for variety
            });

            console.log('🌿 MCP species result:', speciesResult);

            if (speciesResult.success && speciesResult.species) {
              console.log(`✅ Found ${speciesResult.species.length} species via MCP`);

              // Map MCP Species format to RegionSpecies format
              const mappedSpecies: RegionSpecies[] = speciesResult.species.map(species => ({
                scientificName: species.scientific_name,
                commonName: species.common_name || species.scientific_name,
                animalType: species.species_type || 'Unknown',
                conservationStatus: species.conservation_status || 'Unknown',
                occurrenceCount: 1,
                speciesType: species.species_type || undefined,
                dietaryCategory: species.dietary_category || undefined,
                imageKeyword: species.common_name || species.scientific_name,
                imageUrl: species.image_url || undefined, // Include image URL
              }));

              console.log('🗺️ Mapped species:', mappedSpecies);

              // Remove duplicates based on imageUrl (keep first occurrence)
              const seenImages = new Set<string>();
              const uniqueSpecies = mappedSpecies.filter(species => {
                if (!species.imageUrl) return true; // Keep species without images
                if (seenImages.has(species.imageUrl)) {
                  return false; // Skip duplicate image
                }
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
        } else {
          console.warn('⚠️ No region name provided, skipping species fetch');
        }

        setIsLoading(false);

        toast({
          title: `📍 ${regionName}`,
          description: `Found ${parksData?.length || 0} protected areas`,
        });

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

  // Send welcome message when page loads
  useEffect(() => {
    if (!isLoading && regionSpecies.length > 0 && chatHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `🌍 Welcome to **${regionName}**!\n\nI'm your learning guide. Click on any species in the carousel to learn about them, or select a protected area on the map to start playing!\n\n**${regionSpecies.length} species** are waiting to be discovered.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory([welcomeMessage]);
      setIsChatHistoryExpanded(true);
    }
  }, [isLoading, regionSpecies.length, chatHistory.length, regionName]);

  const handleParkClick = (point: any) => {
    console.log('Park clicked:', point);
    // Select the park
    setSelectedPark(point);
    // Deselect species when park is selected
    setSelectedCarouselSpecies(null);

    // Create park info message for chat
    const parkMessage: ChatMessage = {
      id: `park-${point.id}-${Date.now()}`,
      role: 'assistant',
      content: `${point.image_url ? `![${point.name}](${point.image_url})\n\n` : ''}**${point.name}**\n\n🏞️ **Type:** ${point.park_type || 'Protected Area'}\n${point.size_km2 ? `📏 **Size:** ${point.size_km2.toLocaleString()} km²` : ''}\n${point.protection_status ? `🛡️ **Protection Status:** ${point.protection_status}` : ''}\n\nThis protected area is home to many of the species found in ${regionName}. Ready to test your knowledge?`,
      timestamp: new Date(),
      status: 'sent'
    };

    setChatHistory(prev => [...prev, parkMessage]);

    // Add quick reply for "Play Park"
    setQuickReplies([
      {
        id: 'play-park',
        label: `🎮 Play ${point.name}`,
        emoji: '🎮',
        action: 'play-park' as const
      }
    ]);

    // Auto-expand chat to show park info
    setIsChatHistoryExpanded(true);
  };

  const handleDoubleClick = () => {
    // Prevent any zoom changes on double click
    return;
  };

  const handleSpeciesClick = (species: RegionSpecies) => {
    console.log('Species clicked:', species);
    // Select the species for carousel highlighting
    setSelectedCarouselSpecies(species);
    // Deselect park when species is selected
    setSelectedPark(null);
    // Clear quick replies
    setQuickReplies([]);

    // Create teaching message about the species
    const conservationEmoji =
      species.conservationStatus.toLowerCase().includes('critical') || species.conservationStatus.toLowerCase().includes('extinct') ? '🔴' :
      species.conservationStatus.toLowerCase().includes('endangered') ? '🟠' :
      species.conservationStatus.toLowerCase().includes('vulnerable') ? '🟡' :
      '🟢';

    const dietEmoji =
      species.dietaryCategory?.toLowerCase() === 'carnivore' ? '🥩' :
      species.dietaryCategory?.toLowerCase() === 'herbivore' ? '🌱' :
      species.dietaryCategory?.toLowerCase() === 'omnivore' ? '🍽️' :
      species.dietaryCategory?.toLowerCase() === 'producer' ? '☀️' :
      '🦁';

    const speciesMessage: ChatMessage = {
      id: `species-${species.scientificName}-${Date.now()}`,
      role: 'assistant',
      content: `${species.imageUrl ? `![${species.commonName}](${species.imageUrl})\n\n` : ''}**${species.commonName}**\n_${species.scientificName}_\n\n🏷️ **Type:** ${species.animalType}\n${species.dietaryCategory ? `${dietEmoji} **Diet:** ${species.dietaryCategory}` : ''}\n${conservationEmoji} **Conservation Status:** ${species.conservationStatus}\n\n${getSpeciesDescription(species)}`,
      timestamp: new Date(),
      status: 'sent'
    };

    setChatHistory(prev => [...prev, speciesMessage]);
    // Auto-expand chat to show species info
    setIsChatHistoryExpanded(true);
  };

  const getSpeciesDescription = (species: RegionSpecies): string => {
    // Generate contextual description based on species type
    const descriptions: Record<string, string> = {
      'carnivore': 'This predator plays a vital role in maintaining the ecosystem balance by controlling prey populations.',
      'herbivore': 'As a plant-eater, this species helps shape the landscape and disperse seeds throughout the region.',
      'omnivore': 'With a flexible diet, this adaptable species can thrive in changing environments.',
      'producer': 'As a primary producer, this organism forms the foundation of the food web, converting sunlight into energy.',
    };

    return descriptions[species.dietaryCategory?.toLowerCase() || ''] || 'This species is an important part of the ecosystem.';
  };

  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'play-park') {
      handleStartTrivia();
    }
  };

  const handleChatSubmit = async (query: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, userMessage]);

    // Simple response for now (can be enhanced with AI later)
    const responseMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `I'm here to help you learn about ${regionName}! Click on species in the carousel to learn more about them.`,
      timestamp: new Date(),
      status: 'sent'
    };

    setTimeout(() => {
      setChatHistory(prev => [...prev, responseMessage]);

      // Re-add play button if park is selected
      if (selectedPark) {
        setQuickReplies([
          {
            id: 'play-park',
            label: `🎮 Play ${selectedPark.name}`,
            emoji: '🎮',
            action: 'play-park' as const
          }
        ]);
      }
    }, 500);
  };

  const handleStartTrivia = () => {
    if (!selectedPark) {
      toast({
        title: "⚠️ No Park Selected",
        description: "Please click on a green park marker to select it",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 ParkSelectionPage - Navigating to trivia with regionSpecies:', regionSpecies);
    console.log('🚀 ParkSelectionPage - regionSpecies.length:', regionSpecies?.length);

    // Navigate to trivia page with all necessary state
    navigate('/trivia', {
      state: {
        ecoRegionId: ecoRegionId,
        regionName: regionName,
        parkId: selectedPark.id,
        parkName: selectedPark.name,
        lat: lat,
        lng: lng,
        chatHistory: [],
        selectedFoodWebSpecies: {
          carnivore: null,
          herbivore: null,
          omnivore: null,
          bird: null,
          plantCoral: null,
        },
        regionSpecies: regionSpecies,
      }
    });
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
          center={{ lat, lng }}
          zoom={4}
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
            <GlobalHealthBar />
          </div>

          {/* Sign In - Far Right */}
          <Button
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Right Side - Info Panel (Eco-region only) */}
      <div className="absolute right-6 top-24 z-40 pointer-events-auto" style={{ width: '360px' }}>
        <div className="flex flex-col gap-4">
          {/* Eco-region Card */}
          <InfoCard
            type="ecoregion"
            regionName={regionName || 'Unknown Region'}
            speciesCount={regionSpecies.length}
            locationCount={wildlifePlaces.length + protectedAreas.length}
          />

          {/* Glowing Call-to-Action Banner */}
          <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 p-4 border border-primary/40 animate-pulse-glow glass-panel">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/20 to-transparent animate-shimmer" />
            <p className="relative text-base font-semibold text-primary text-center flex items-center justify-center gap-2">
              <span className="text-2xl">👇</span>
              <span>Select park below or on map</span>
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

      {/* Bottom - Chat (Learning Mode) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[1250px] flex flex-col items-center gap-3 pointer-events-none pb-2">
        <div className="flex justify-center items-end gap-3 pointer-events-none">
          <div className="w-full max-w-[650px] flex flex-col pointer-events-auto">
            {/* Chat History - Semi-transparent with backdrop blur */}
            {chatHistory.length > 0 && (
              <div
                className="pointer-events-none"
                style={{
                  backgroundColor: isChatHistoryExpanded ? 'rgba(15, 23, 42, 0.75)' : 'transparent',
                  backdropFilter: isChatHistoryExpanded ? 'blur(12px)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="pointer-events-auto">
                  <ChatHistory
                    messages={chatHistory}
                    quickReplies={quickReplies}
                    onQuickReply={handleQuickReplyClick}
                    isExpanded={isChatHistoryExpanded}
                    onMinimize={() => setIsChatHistoryExpanded(false)}
                    isTyping={isLoadingResponse}
                  />
                </div>
              </div>
            )}

            {/* Chat Input */}
            <ChatInput
              onSubmit={handleChatSubmit}
              isLoading={isLoadingResponse}
              placeholder="Ask about species or ecosystems..."
              hasMessages={chatHistory.length > 0}
              onExpandHistory={() => setIsChatHistoryExpanded(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkSelectionPage;
