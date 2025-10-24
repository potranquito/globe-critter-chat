import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RegionSpecies } from '@/services/regionService';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { SpeciesTypeFilter, type SpeciesTypeFilter as SpeciesTypeFilterType } from '@/components/SpeciesTypeFilter';
import { InfoCard } from '@/components/InfoCard';
import ChatInput, { ChatContext, ChatTheme } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
import { ParkList } from '@/components/ParkList';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';
import { generateColorTheme, generateFastVisualDescription } from '@/services/mcpClient';
import { getAnimalForRegion } from '@/config/ecoRegionAnimals';
import { useLearningSession } from '@/hooks/useLearningSession';
import { useParkStars } from '@/hooks/useParkStars';
import { getPhaseDisplayName, getPhaseEmoji, getNextPhase, type LearningPhase } from '@/types/learning';

/**
 * Get filters for a specific learning phase
 */
function getFiltersForPhase(phase: LearningPhase): string[] {
  switch (phase) {
    case 'plants':
      return ['producer-diet', 'plant'];
    case 'birds':
      return ['bird'];
    case 'predators':
      return ['carnivore-diet'];
    default:
      return [];
  }
}

/**
 * Map IUCN conservation status codes to full names
 */
function getConservationStatusFullName(code: string | undefined): string {
  if (!code) return 'Not Evaluated';

  const statusMap: Record<string, string> = {
    'LC': 'Least Concern',
    'NT': 'Near Threatened',
    'VU': 'Vulnerable',
    'EN': 'Endangered',
    'CR': 'Critically Endangered',
    'EW': 'Extinct in the Wild',
    'EX': 'Extinct',
    'DD': 'Data Deficient',
    'NE': 'Not Evaluated'
  };

  return statusMap[code.toUpperCase()] || code;
}

/**
 * Get more specific species subtype (flower, tree, mammal, bird, etc.)
 * Uses animalType and speciesType fields to determine subtype
 */
function getSpeciesSubtype(species: RegionSpecies): string {
  const animalType = species.animalType?.toLowerCase() || '';
  const speciesType = species.speciesType?.toLowerCase() || '';

  // Plants
  if (speciesType === 'plant' || species.dietaryCategory === 'Producer') {
    // Try to determine plant subtype from name or animalType
    if (animalType.includes('tree') || species.commonName?.toLowerCase().includes('tree')) {
      return 'tree';
    }
    if (animalType.includes('flower') || animalType.includes('saxifrage') || species.commonName?.toLowerCase().includes('flower')) {
      return 'flower';
    }
    if (animalType.includes('bush') || animalType.includes('shrub') || species.commonName?.toLowerCase().includes('bush')) {
      return 'bush';
    }
    if (animalType.includes('grass') || species.commonName?.toLowerCase().includes('grass')) {
      return 'grass';
    }
    if (animalType.includes('moss') || species.commonName?.toLowerCase().includes('moss')) {
      return 'moss';
    }
    if (animalType.includes('lichen') || species.commonName?.toLowerCase().includes('lichen')) {
      return 'lichen';
    }
    return 'plant'; // Default for plants
  }

  // Birds
  if (speciesType === 'bird' || animalType.includes('bird') || animalType.includes('aves')) {
    return 'bird';
  }

  // Mammals
  if (speciesType === 'mammal' || animalType.includes('mammal')) {
    return 'mammal';
  }

  // Reptiles
  if (speciesType === 'reptile' || animalType.includes('reptile') || animalType.includes('snake') || animalType.includes('lizard')) {
    return 'reptile';
  }

  // Amphibians
  if (speciesType === 'amphibian' || animalType.includes('amphibian') || animalType.includes('frog') || animalType.includes('toad')) {
    return 'amphibian';
  }

  // Fish
  if (speciesType === 'fish' || animalType.includes('fish')) {
    return 'fish';
  }

  // Insects
  if (speciesType === 'insect' || animalType.includes('insect') || animalType.includes('beetle') || animalType.includes('butterfly')) {
    return 'insect';
  }

  // Invertebrates
  if (animalType.includes('invertebrate') || animalType.includes('coral') || animalType.includes('jellyfish')) {
    return 'invertebrate';
  }

  // Default: use animalType or speciesType as-is
  return animalType || speciesType || 'organism';
}

const ParkSelectionPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const ecoRegionId = searchParams.get('ecoRegionId');
  const regionName = searchParams.get('regionName');
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const triviaCompleted = searchParams.get('triviaCompleted');
  const triviaResultsParam = searchParams.get('triviaResults');

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

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);

  // Park stars for trivia gamification
  const { resetAll: resetParkStars } = useParkStars();

  // Learning mode state
  const [isLearningMode, setIsLearningMode] = useState(false);
  const [learningFilters, setLearningFilters] = useState<string[]>([]);
  const [learningSessionCount, setLearningSessionCount] = useState(0);
  const [currentLearningTopic, setCurrentLearningTopic] = useState<string>('');
  const [isSpeciesStreamingInProgress, setIsSpeciesStreamingInProgress] = useState(false); // Prevents next species from loading too soon
  const [parkListKey, setParkListKey] = useState(0); // Force ParkList re-mount when trivia completes

  // Track processed trivia results to avoid duplicate processing
  const processedTriviaResultsRef = useRef<string | null>(null);

  // 3-Phase Learning Session (Plants → Birds → Predators)
  const learningSession = useLearningSession(selectedPark?.id || ecoRegionId || '', regionName || '');

  // Synchronous tracking with refs (prevents closure/timing issues)
  const taughtSpeciesRef = useRef<any[]>([]); // Taught species for trivia
  const shownSpeciesRef = useRef<string[]>([]); // Shown species to prevent duplicates

  // Streaming intervals/timeouts to clean up on /end
  const streamingIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentPhaseRef = useRef<LearningPhase>('plants'); // Current phase tracker

  // Chameleon theme state
  const [chatTheme, setChatTheme] = useState<ChatTheme>({
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  });

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

        // 🎨 Generate chameleon color theme for this eco-region
        console.log('🎨 Generating chameleon theme for:', regionName);
        try {
          const themeResult = await generateColorTheme({ ecoregionName: regionName || '' });
          if (themeResult.success && themeResult.theme) {
            console.log('✅ Chameleon theme applied:', themeResult.theme);
            setChatTheme(themeResult.theme);
          } else {
            console.warn('[Theme] ⚠️ MCP color theme generation failed, using default');
          }
        } catch (themeError) {
          console.error('[Theme] ❌ Error generating color theme:', themeError);
        }

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

        // Load parks for this eco-region using MCP server
        // Use larger radius for high-latitude regions (Arctic/Antarctic) where parks are sparse
        const isHighLatitude = Math.abs(lat) > 60;
        const boundsRadius = isHighLatitude ? 25 : 10; // degrees (Arctic: ~2750km, others: ~1100km)

        console.log('🏞️ Park search params:', {
          regionName,
          centerLat: lat,
          centerLng: lng,
          isHighLatitude,
          boundsRadius,
          searchArea: {
            minLat: lat - boundsRadius,
            maxLat: lat + boundsRadius,
            minLng: isHighLatitude ? 'ALL (Arctic wraps around)' : lng - boundsRadius,
            maxLng: isHighLatitude ? 'ALL (Arctic wraps around)' : lng + boundsRadius,
          }
        });

        // Query parks from database
        // For Arctic/Antarctic, search by latitude only (since they wrap around all longitudes)
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
          if (parksData.length > 0) {
            console.log('First 3 parks:', parksData.slice(0, 3).map(p => ({
              name: p.name,
              lat: p.center_lat,
              lng: p.center_lng,
            })));
          }
          // Transform to the format GoogleEarthMap expects
          const parks = parksData.map(park => ({
            ...park,
            lat: park.center_lat,
            lng: park.center_lng,
          }));
          setWildlifePlaces(parks);

          // Calculate optimal map center based on park locations
          if (parks.length > 0) {
            const validParks = parks.filter(p => p.lat && p.lng);
            if (validParks.length > 0) {
              // Calculate the center point of all parks
              const avgLat = validParks.reduce((sum, p) => sum + p.lat, 0) / validParks.length;
              const avgLng = validParks.reduce((sum, p) => sum + p.lng, 0) / validParks.length;

              // Adjust zoom based on park spread (Arctic regions need lower zoom)
              const isHighLatitude = Math.abs(avgLat) > 60;

              // Pan south a bit to ensure top of map is within bounds (shows ocean blue)
              // For high latitude regions, subtract more degrees to account for curvature
              const latitudeOffset = isHighLatitude ? 8 : 3;
              const adjustedLat = avgLat - latitudeOffset;

              console.log(`🎯 Centering map on parks: lat=${adjustedLat.toFixed(2)}, lng=${avgLng.toFixed(2)} (offset: -${latitudeOffset}°)`);
              setMapCenter({ lat: adjustedLat, lng: avgLng });
              setMapZoom(isHighLatitude ? 3 : 5);
            }
          }
        } else {
          console.warn('⚠️ No parks found or error occurred');
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
                description: species.description || undefined, // Include description for fast learning mode
                isInvasive: species.is_invasive || false,
                isVenomous: species.is_venomous || false,
                habitatInfo: species.habitat_info || undefined, // Include habitat description
              }));

              console.log('🗺️ Mapped species:', mappedSpecies);

              // Remove duplicates based on imageUrl AND filter out species without images (uncurated)
              const seenImages = new Set<string>();
              const uniqueSpecies = mappedSpecies.filter(species => {
                if (!species.imageUrl) return false; // 🎯 Skip species without images (uncurated species)
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

  // Handle trivia completion results
  useEffect(() => {
    // Check if we have trivia results AND haven't processed them yet
    if (triviaCompleted && triviaResultsParam && processedTriviaResultsRef.current !== triviaResultsParam) {
      try {
        const results = JSON.parse(triviaResultsParam);
        const correctCount = results.filter((r: any) => r.isCorrect).length;
        const totalCount = results.length;

        // Star emoji based on score
        const starEmoji = correctCount === 3 ? '⭐⭐⭐' : correctCount === 2 ? '⭐⭐' : correctCount === 1 ? '⭐' : '';

        const completionMessage: ChatMessage = {
          id: `trivia-complete-${Date.now()}`,
          role: 'assistant',
          content: `🎉 **Trivia Complete!**\n\nYou answered **${correctCount} out of ${totalCount}** questions correctly!\n\n${starEmoji}\n\nYour stars have been saved to the park. Check the park list on the right to see your progress!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, completionMessage]);
        setIsChatHistoryExpanded(true);

        // Force ParkList to re-mount and reload stars from localStorage
        setParkListKey(prev => prev + 1);

        // Mark these results as processed
        processedTriviaResultsRef.current = triviaResultsParam;

        // Clean up URL params after showing message
        const params = new URLSearchParams(window.location.search);
        params.delete('triviaCompleted');
        params.delete('triviaResults');
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
      } catch (error) {
        console.error('Failed to parse trivia results:', error);
      }
    }
  }, [triviaCompleted, triviaResultsParam]);

  // Send welcome message when page loads
  useEffect(() => {
    if (!isLoading && regionSpecies.length > 0 && chatHistory.length === 0 && !triviaCompleted) {
      // Get ASCII art animal for this region
      const animalData = getAnimalForRegion(regionName || '');
      const asciiArt = animalData.frames[0]; // Use first frame of animation

      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `🌍 Welcome to **${regionName}**!\n\n\`\`\`\n${asciiArt}\n\`\`\`\n\nI'm your learning guide. Click on any species in the carousel to learn about them, or select a protected area on the map to start playing!\n\n**${regionSpecies.length} species** are waiting to be discovered.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory([welcomeMessage]);
      setIsChatHistoryExpanded(true);

      // Add "Start Learning" quick reply
      setQuickReplies([
        {
          id: 'start-learning',
          label: '🎓 Start Learning',
          emoji: '🎓',
          action: 'start-learning' as const
        }
      ]);
    }
  }, [isLoading, regionSpecies.length, chatHistory.length, regionName, triviaCompleted]);

  const handleParkClick = (point: any) => {
    console.log('Park clicked:', point);

    // Terminate learning mode if active
    if (isLearningMode) {
      setIsLearningMode(false);
      setIsSpeciesStreamingInProgress(false);
      setQuickReplies([]);
      streamingIntervalsRef.current.forEach(interval => clearInterval(interval));
      streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      streamingIntervalsRef.current = [];
      streamingTimeoutsRef.current = [];
    }

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

    // Terminate learning mode if active
    if (isLearningMode) {
      setIsLearningMode(false);
      setIsSpeciesStreamingInProgress(false);
      setQuickReplies([]);
      streamingIntervalsRef.current.forEach(interval => clearInterval(interval));
      streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      streamingIntervalsRef.current = [];
      streamingTimeoutsRef.current = [];
    }

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

  // Filter species based on learning filters (helper that takes filters as param)
  const getFilteredSpeciesWithFilters = (filters: string[]) => {
    if (filters.length === 0) return regionSpecies;
    if (filters.includes('all')) return regionSpecies; // 'all' returns everything

    const filtered = regionSpecies.filter(species => {
      return filters.every(filter => { // Use 'every' for AND logic when multiple filters
        const filterLower = filter.toLowerCase();
        const taxonomicGroup = (species.taxonomicGroup || '').toLowerCase();
        const animalType = (species.animalType || '').toLowerCase();
        const dietaryCategory = (species.dietaryCategory || '').toLowerCase();

        // Special Categories
        if (filterLower === 'invasive') return species.isInvasive === true;
        if (filterLower === 'venomous') return species.isVenomous === true;
        if (filterLower === 'native') return !species.isInvasive; // Assume non-invasive = native

        // Conservation Status
        if (filterLower === 'endangered') return species.conservationStatus?.toLowerCase().includes('endangered');
        if (filterLower === 'critical') return species.conservationStatus?.toLowerCase().includes('critical');
        if (filterLower === 'vulnerable') return species.conservationStatus?.toLowerCase().includes('vulnerable');

        // Animal Types - check both taxonomicGroup and animalType
        if (filterLower === 'mammal') return animalType === 'mammal' || animalType.includes('mammal') || taxonomicGroup.includes('mammal');
        if (filterLower === 'bird') return taxonomicGroup === 'birds' || animalType.includes('bird') || animalType.includes('aves');
        if (filterLower === 'reptile') return animalType.includes('reptile') || taxonomicGroup.includes('reptile');
        if (filterLower === 'amphibian') return animalType.includes('amphibian') || taxonomicGroup.includes('amphibian');
        if (filterLower === 'fish') return animalType.includes('fish') || taxonomicGroup.includes('fish');
        if (filterLower === 'insect') return animalType.includes('insect') || taxonomicGroup.includes('insect');

        // Plant Types
        if (filterLower === 'plant') return animalType.includes('plant') || taxonomicGroup.includes('plant');
        if (filterLower === 'tree') return animalType.includes('tree') || taxonomicGroup.includes('tree');
        if (filterLower === 'flower') return animalType.includes('flower') || taxonomicGroup.includes('flower');

        // Dietary Categories (use dietaryCategory field)
        if (filterLower === 'carnivore-diet') return dietaryCategory.includes('carnivore');
        if (filterLower === 'herbivore-diet') return dietaryCategory.includes('herbivore');
        if (filterLower === 'omnivore-diet') return dietaryCategory.includes('omnivore');
        if (filterLower === 'producer-diet') return dietaryCategory.includes('producer');

        // Behavioral (these would need database fields - for now return false)
        if (filterLower === 'nocturnal') return false; // TODO: Add nocturnal field to database
        if (filterLower === 'migratory') return false; // TODO: Add migratory field to database
        if (filterLower === 'apex') return dietaryCategory.includes('carnivore'); // Approximate
        if (filterLower === 'pollinator') return false; // TODO: Add pollinator field to database

        return true; // Default: include species if filter not recognized
      });
    });

    console.log(`🔍 Filter "${filters.join(', ')}" found ${filtered.length} species out of ${regionSpecies.length} total`);
    return filtered;
  };

  // Filter species based on learning filters
  const getFilteredSpecies = () => {
    return getFilteredSpeciesWithFilters(learningFilters);
  };

  // Select and display a random species for learning
  const selectRandomSpecies = (filtersToUse?: string[], sessionCount?: number, alreadyShown?: string[]) => {
    // 🚫 Don't load next species if current one is still streaming
    if (isSpeciesStreamingInProgress) {
      console.log('⏳ Species streaming in progress - skipping selection');
      return;
    }

    // Use provided filters or fall back to state (but prefer provided for accuracy)
    const activeFilters = filtersToUse !== undefined ? filtersToUse : learningFilters;
    const shownSpecies = alreadyShown !== undefined ? alreadyShown : shownSpeciesRef.current;
    console.log('🔍 selectRandomSpecies called with filters:', activeFilters);
    console.log('🔍 Already shown species:', shownSpecies);

    // Filter species and exclude already shown ones
    const filteredSpecies = getFilteredSpeciesWithFilters(activeFilters);
    const availableSpecies = filteredSpecies.filter(s => !shownSpecies.includes(s.scientificName));

    console.log(`🔍 Filtered species count: ${filteredSpecies.length} out of ${regionSpecies.length}`);
    console.log(`🔍 Available (not shown) species count: ${availableSpecies.length}`);
    if (availableSpecies.length > 0) {
      console.log('🔍 First 3 available species:', availableSpecies.slice(0, 3).map(s => `${s.commonName} (${s.animalType})`));
    }
    if (availableSpecies.length === 0) {
      console.log('⚠️ No more unique species available for this topic');
      return;
    }

    // Increment session count and capture the new value (use provided count to avoid closure issues)
    const previousCount = sessionCount !== undefined ? sessionCount : learningSessionCount;
    const currentSessionNumber = previousCount + 1;
    setLearningSessionCount(currentSessionNumber);
    console.log(`📊 Learning session: ${currentSessionNumber}/5 (previous: ${previousCount})`);

    // Check if we've reached 5 species in current phase (check AFTER incrementing)
    if (currentSessionNumber > 5) {
      console.log(`🎉 Reached 5 species in ${learningSession.currentPhase} phase`);

      // Check if all 3 phases are complete
      if (learningSession.isAllPhasesComplete()) {
        console.log('🎓 All 3 phases complete!');

        // Show congratulations message
        const congratsMessage: ChatMessage = {
          id: `all-complete-${Date.now()}`,
          role: 'assistant',
          content: `🎉 **Congratulations!**\n\nYou've completed all 3 learning phases!\n\n✅ Plants (5 species)\n✅ Birds (5 species)\n✅ Predators (5 species)\n\nReady to test your knowledge?`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, congratsMessage]);

        // Show "Play Trivia Game" button
        setQuickReplies([
          {
            id: 'start-trivia-game',
            label: 'Play Trivia Game',
            emoji: '🎮',
            action: 'start-trivia-game' as const
          }
        ]);
        return;
      }

      // Show "Continue" button to advance to next phase
      const currentPhaseDisplay = getPhaseDisplayName(currentPhaseRef.current);
      const completionMessage: ChatMessage = {
        id: `phase-complete-${Date.now()}`,
        role: 'assistant',
        content: `🎉 **Phase Complete!**\n\nYou've learned about 5 ${currentPhaseDisplay.toLowerCase()} species. Ready for the next lesson?`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, completionMessage]);

      // Show "Continue" button (or "Play Trivia" if all phases done)
      setQuickReplies([
        {
          id: 'continue-next-phase',
          label: 'Continue',
          emoji: '▶️',
          action: 'continue-next-phase' as const
        }
      ]);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableSpecies.length);
    const species = availableSpecies[randomIndex];

    // 🎓 Set streaming in progress to prevent next species from loading
    setIsSpeciesStreamingInProgress(true);
    console.log('✨ Starting species learning for:', species.commonName);

    // 📚 Track taught species in learning session
    learningSession.addTaughtSpecies(species);

    // Also track synchronously in ref for reliable navigation
    taughtSpeciesRef.current.push({
      id: species.id,
      scientificName: species.scientificName,
      commonName: species.commonName,
      imageUrl: species.imageUrl,
      phase: learningSession.currentPhase
    });

    console.log(`📚 Added ${species.commonName} to ${learningSession.currentPhase} phase (${learningSession.currentPhaseCount}/5)`);

    // Add this species to the shown list to prevent duplicates (use ref for immediate updates)
    shownSpeciesRef.current = [...shownSpecies, species.scientificName];
    console.log('📝 Updated shown species list:', shownSpeciesRef.current);

    // Highlight in carousel
    setSelectedCarouselSpecies(species);

    // Create educational chat message with image first
    const messageId = `learn-${Date.now()}`;
    const imageContent = species.imageUrl ? `![${species.commonName}](${species.imageUrl})` : '';

    const initialMessage: ChatMessage = {
      id: messageId,
      role: 'assistant',
      content: imageContent,
      timestamp: new Date(),
      status: 'sending'
    };

    setChatHistory(prev => [...prev, initialMessage]);

    // Stream educational text after image "loads" (simulate 1 second load)
    setTimeout(async () => {
      // Get formatted values
      const speciesSubtype = getSpeciesSubtype(species);
      const conservationStatus = getConservationStatusFullName(species.conservationStatus);

      // Build species info lines (conditionally include invasive/venomous)
      const infoLines = [
        `**${species.commonName} - Species ${currentSessionNumber}/5**`,
        '',
        `**Type:** ${speciesSubtype}`,
        `**Conservation Status:** ${conservationStatus}`
      ];

      // Add Habitat Info if available (right after Conservation Status)
      if (species.habitatInfo) {
        infoLines.push(`**Habitat Info:** ${species.habitatInfo}`);
      }

      // Only add invasive species line if true
      if (species.isInvasive) {
        infoLines.push('**Invasive Species:** Yes');
      }

      // Only add venomous line if true
      if (species.isVenomous) {
        infoLines.push('**Venomous:** Yes');
      }

      // Add visual description header
      infoLines.push('', '**Visual Description:** ');

      const baseInfo = '\n\n' + infoLines.join('\n');

      // Stream base info first
      let currentText = '';
      let charIndex = 0;
      const streamInterval = setInterval(() => {
        if (charIndex >= baseInfo.length) {
          clearInterval(streamInterval);
          // Now fetch and stream the description
          fetchAndStreamDescription();
          return;
        }

        currentText += baseInfo[charIndex];
        charIndex++;

        setChatHistory(prev => {
          const updated = [...prev];
          const lastIndex = updated.findIndex(m => m.id === messageId);
          if (lastIndex !== -1) {
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: imageContent + currentText,
              status: 'sent'
            };
          }
          return updated;
        });
      }, 30);
      // Track interval for cleanup
      streamingIntervalsRef.current.push(streamInterval);

      // Fetch fast visual description from MCP
      const fetchAndStreamDescription = async () => {
        try {
          // 🔬 VISION AI: Always generate fresh descriptions using Qwen3 vision
          const descResult = await generateFastVisualDescription({
            scientificName: species.scientificName,
            commonName: species.commonName,
            animalType: species.animalType,
            imageUrl: species.imageUrl || undefined, // Pass image for Qwen3 vision AI
            ecoregion: regionName || undefined
          });

          const finalText = descResult.success
            ? descResult.description || 'Description not available.'
            : 'Description not available.';

          // Stream the description
          let descText = '';
          let descIndex = 0;
          const descInterval = setInterval(() => {
            if (descIndex >= finalText.length) {
              clearInterval(descInterval);

              // ⏱️ Wait 1.5 seconds after streaming completes, then trigger next species
              const nextSpeciesTimeout = setTimeout(() => {
                setIsSpeciesStreamingInProgress(false);
                console.log('✅ Species learning complete - ready for next');

                // 🔄 Automatically trigger next species (ref has latest shown species list)
                selectRandomSpecies(activeFilters, currentSessionNumber, shownSpeciesRef.current);
              }, 1500);
              // Track timeout for cleanup
              streamingTimeoutsRef.current.push(nextSpeciesTimeout);

              return;
            }

            descText += finalText[descIndex];
            descIndex++;

            setChatHistory(prev => {
              const updated = [...prev];
              const lastIndex = updated.findIndex(m => m.id === messageId);
              if (lastIndex !== -1) {
                updated[lastIndex] = {
                  ...updated[lastIndex],
                  content: imageContent + baseInfo + descText,
                  status: 'sent'
                };
              }
              return updated;
            });
          }, 30);
          // Track interval for cleanup
          streamingIntervalsRef.current.push(descInterval);
        } catch (error) {
          console.error('[Learning Mode] Description fetch failed:', error);
          // Fallback text
          const fallbackText = 'Unable to generate description.';
          setChatHistory(prev => {
            const updated = [...prev];
            const lastIndex = updated.findIndex(m => m.id === messageId);
            if (lastIndex !== -1) {
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: imageContent + baseInfo + fallbackText,
                status: 'sent'
              };
            }
            return updated;
          });

          // ⏱️ Also clear flag on error after 1.5 second delay, then trigger next species
          setTimeout(() => {
            setIsSpeciesStreamingInProgress(false);
            console.log('✅ Species learning complete (error fallback) - ready for next');

            // 🔄 Automatically trigger next species (pass filters, count, and shown species to avoid closure issues)
            selectRandomSpecies(activeFilters, currentSessionNumber, updatedShownSpecies);
          }, 1500);
        }
      };
    }, 1000);
  };

  // Comprehensive topic definitions
  const LEARNING_TOPICS = {
    // Animal Types
    mammals: { label: 'Mammals', emoji: '🐾', filters: ['mammal'] },
    birds: { label: 'Birds', emoji: '🦜', filters: ['bird'] },
    reptiles: { label: 'Reptiles', emoji: '🦎', filters: ['reptile'] },
    amphibians: { label: 'Amphibians', emoji: '🐸', filters: ['amphibian'] },
    fish: { label: 'Fish', emoji: '🐟', filters: ['fish'] },
    insects: { label: 'Insects', emoji: '🦋', filters: ['insect'] },

    // Plant Types
    plants: { label: 'Plants', emoji: '🌱', filters: ['plant'] },
    trees: { label: 'Trees', emoji: '🌳', filters: ['tree'] },
    flowers: { label: 'Flowers', emoji: '🌸', filters: ['flower'] },

    // Ecological Roles
    carnivores: { label: 'Carnivores', emoji: '🦁', filters: ['carnivore-diet'] },
    herbivores: { label: 'Herbivores', emoji: '🦌', filters: ['herbivore-diet'] },
    omnivores: { label: 'Omnivores', emoji: '🐻', filters: ['omnivore-diet'] },
    producers: { label: 'Producers', emoji: '☀️', filters: ['producer-diet'] },

    // Conservation Status
    endangered_species: { label: 'Endangered Species', emoji: '🦅', filters: ['endangered'] },
    critically_endangered: { label: 'Critically Endangered', emoji: '⚠️', filters: ['critical'] },
    vulnerable_species: { label: 'Vulnerable Species', emoji: '⚡', filters: ['vulnerable'] },

    // Special Categories
    invasive_species: { label: 'Invasive Species', emoji: '🌿', filters: ['invasive'] },
    invasive_plants: { label: 'Invasive Plants', emoji: '🌾', filters: ['invasive', 'plant'] },
    venomous: { label: 'Venomous Species', emoji: '☠️', filters: ['venomous'] },
    native_species: { label: 'Native Species', emoji: '🏡', filters: ['native'] },

    // Relationships
    food_web: { label: 'Food Web', emoji: '🕸️', filters: ['all'] },
    apex_predators: { label: 'Apex Predators', emoji: '👑', filters: ['apex'] },
    pollinators: { label: 'Pollinators', emoji: '🐝', filters: ['pollinator'] },

    // Behavior
    nocturnal: { label: 'Nocturnal Species', emoji: '🌙', filters: ['nocturnal'] },
    migratory: { label: 'Migratory Species', emoji: '✈️', filters: ['migratory'] },
  };

  // Show topic selection BEFORE learning starts
  const showTopicSelectionBeforeLearning = () => {
    // Add message asking to choose a topic
    const topicSelectionMessage: ChatMessage = {
      id: `topic-selection-${Date.now()}`,
      role: 'assistant',
      content: '🎓 **Choose Your Learning Mode**\n\nHow would you like to explore?',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, topicSelectionMessage]);

    // Show Random Topic and Topics List buttons
    setQuickReplies([
      {
        id: 'random-topic',
        label: '🎲 Random Topic',
        emoji: '🎲',
        action: '/random_topic' as const
      },
      {
        id: 'topics-list',
        label: '📋 Topics List',
        emoji: '📋',
        action: '/topics_list' as const
      }
    ]);
  };

  // Show topic selection after 5 species
  const showTopicSelection = () => {
    // Add completion message
    const completionMessage: ChatMessage = {
      id: `learning-complete-${Date.now()}`,
      role: 'assistant',
      content: '🎉 **Session Complete!**\n\nYou\'ve studied 5 species. Great work!\n\nChoose a topic for your next learning session:',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, completionMessage]);

    // Generate topic quick replies based on available species
    const topics: QuickReply[] = [];

    // Check what types of species we have
    const hasInvasive = regionSpecies.some(s => s.isInvasive);
    const hasVenomous = regionSpecies.some(s => s.isVenomous);
    const hasEndangered = regionSpecies.some(s =>
      s.conservationStatus?.toLowerCase().includes('endangered') ||
      s.conservationStatus?.toLowerCase().includes('critical')
    );
    const hasMammals = regionSpecies.some(s => s.animalType === 'Mammal');
    const hasBirds = regionSpecies.some(s => s.animalType === 'Bird');
    const hasPlants = regionSpecies.some(s => s.animalType === 'Plant');

    // Add available topics
    if (hasInvasive) {
      topics.push({
        id: 'topic-invasive',
        label: '🌿 Invasive Species',
        emoji: '🌿',
        action: 'learn-topic-invasive' as const
      });
    }

    if (hasEndangered) {
      topics.push({
        id: 'topic-endangered',
        label: '🦅 Endangered Species',
        emoji: '🦅',
        action: 'learn-topic-endangered' as const
      });
    }

    if (hasMammals) {
      topics.push({
        id: 'topic-mammals',
        label: '🐾 Mammals',
        emoji: '🐾',
        action: 'learn-topic-mammals' as const
      });
    }

    if (hasBirds) {
      topics.push({
        id: 'topic-birds',
        label: '🦜 Birds',
        emoji: '🦜',
        action: 'learn-topic-birds' as const
      });
    }

    // Limit to 3 topics max for clean UI
    setQuickReplies(topics.slice(0, 3));
  };

  // Start learning mode
  const startLearningMode = (topic: string = 'general', filters?: string[]) => {
    setIsLearningMode(true);
    setQuickReplies([]); // Clear quick replies
    setLearningSessionCount(0); // Reset session counter
    shownSpeciesRef.current = []; // Reset shown species list (use ref)
    setCurrentLearningTopic(topic);

    // Reset learning session to start from plants phase
    learningSession.resetSession();
    taughtSpeciesRef.current = []; // Reset taught species ref
    currentPhaseRef.current = 'plants'; // Initialize phase ref to plants
    const phaseFilters = learningSession.getCurrentPhaseFilters();
    setLearningFilters(phaseFilters);

    // Add confirmation message with 3-phase system info
    const confirmMessage: ChatMessage = {
      id: `learning-start-${Date.now()}`,
      role: 'assistant',
      content: `🎓 **3-Phase Learning Mode Activated!**\n\n🌿 **Phase 1:** Plants (5 species)\n🦅 **Phase 2:** Birds (5 species)\n🦁 **Phase 3:** Predators (5 species)\n\nAfter completing all phases, you\'ll take a trivia quiz to test your knowledge!\n\nStarting with Plants...`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, confirmMessage]);

    // Select first species after a short delay (use phase filters)
    setTimeout(() => selectRandomSpecies(phaseFilters, 0, []), 1500);
  };

  // Handle random topic selection
  const handleRandomTopic = () => {
    const availableTopics = Object.entries(LEARNING_TOPICS).filter(([_, config]) => {
      // Check if region has species matching this topic's filters
      // Use the helper function instead of setting state
      const matches = getFilteredSpeciesWithFilters(config.filters);
      return matches.length > 0;
    });

    if (availableTopics.length === 0) {
      toast({
        title: "No topics available",
        description: "This region doesn't have enough species variety.",
        variant: "destructive"
      });
      return;
    }

    // Pick random topic
    const randomTopic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
    const [topicKey, topicConfig] = randomTopic;

    // Show random topic selected message
    const randomMessage: ChatMessage = {
      id: `random-topic-${Date.now()}`,
      role: 'assistant',
      content: `🎲 **Random Topic Selected!**\n\n${topicConfig.emoji} **${topicConfig.label}**\n\nLet's learn about ${topicConfig.label.toLowerCase()}!`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, randomMessage]);

    // Start learning with this topic
    setLearningFilters(topicConfig.filters);
    setTimeout(() => startLearningMode(topicConfig.label, topicConfig.filters), 1000);
  };

  // Show comprehensive topics list
  const showTopicsList = () => {
    const topicsListMessage: ChatMessage = {
      id: `topics-list-${Date.now()}`,
      role: 'assistant',
      content: `📋 **All Learning Topics**\n\nType any command to start learning:\n\n**🐾 Animals**\n/mammals, /birds, /reptiles, /amphibians, /fish, /insects\n\n**🌱 Plants**\n/plants, /trees, /flowers\n\n**🍽️ Dietary Roles**\n/carnivores, /herbivores, /omnivores, /producers\n\n**🦅 Conservation**\n/endangered_species, /critically_endangered, /vulnerable_species\n\n**⚠️ Special**\n/invasive_species, /invasive_plants, /venomous, /native_species\n\n**🕸️ Ecology**\n/food_web, /apex_predators, /pollinators\n\n**🌙 Behavior**\n/nocturnal, /migratory`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, topicsListMessage]);
    setQuickReplies([]); // Clear quick replies so user can type commands
  };

  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'start-trivia-game') {
      // User clicked "Play Trivia Game" after completing all phases
      setQuickReplies([]); // Clear button

      // Navigate to trivia with taught species data
      console.log('🎓 Navigating to trivia with taught species:', taughtSpeciesRef.current.length);

      navigate('/trivia', {
        state: {
          ecoRegionId,
          regionName,
          parkId: selectedPark?.id || ecoRegionId,
          parkName: selectedPark?.name || regionName,
          lat,
          lng,
          chatHistory,
          regionSpecies,
          taughtSpecies: [...taughtSpeciesRef.current] // Use ref for reliable data
        }
      });
    } else if (reply.action === 'continue-next-phase') {
      // User clicked "Continue" to advance to next phase
      setQuickReplies([]); // Clear button

      // Get NEXT phase using ref (to avoid React state timing issues)
      const currentPhase = currentPhaseRef.current;
      const nextPhase = getNextPhase(currentPhase);

      if (nextPhase) {
        console.log(`🔄 Advancing from ${currentPhase} to ${nextPhase}`);

        // Update phase ref IMMEDIATELY
        currentPhaseRef.current = nextPhase;

        // Get filters for the NEXT phase
        const newFilters = getFiltersForPhase(nextPhase);
        console.log(`🔍 Filters for ${nextPhase}:`, newFilters);

        // Update state with new filters
        setLearningFilters(newFilters);

        // Also advance the phase in the hook (for taught species tracking)
        learningSession.advanceToNextPhase();

        // Reset session count and shown species for new phase
        setLearningSessionCount(0);
        shownSpeciesRef.current = []; // Reset shown species for new phase

        // Get display info for the next phase
        const phaseEmoji = getPhaseEmoji(nextPhase);
        const phaseName = getPhaseDisplayName(nextPhase);

        // Show phase transition message
        const transitionMessage: ChatMessage = {
          id: `phase-transition-${Date.now()}`,
          role: 'assistant',
          content: `${phaseEmoji} **Starting ${phaseName} Phase!**\n\nLet's explore 5 ${phaseName.toLowerCase()} species...`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, transitionMessage]);

        // Start next phase with the correct filters
        setTimeout(() => {
          console.log(`🎯 Starting species selection for ${nextPhase} with filters:`, newFilters);
          selectRandomSpecies(newFilters, 0, []);
        }, 1000);
      }
    } else if (reply.action === 'play-park') {
      handleStartTrivia();
    } else if (reply.action === 'start-learning') {
      // Show topic selection instead of starting immediately
      showTopicSelectionBeforeLearning();
    } else if (reply.action === '/random_topic') {
      handleRandomTopic();
    } else if (reply.action === '/topics_list') {
      showTopicsList();
    } else if (reply.action?.toString().startsWith('learn-topic-')) {
      // Legacy topic handling (keep for backwards compatibility)
      const topic = reply.action.toString().replace('learn-topic-', '');
      if (topic === 'invasive') {
        const filters = ['invasive'];
        setLearningFilters(filters);
        startLearningMode('Invasive Species', filters);
      } else if (topic === 'endangered') {
        const filters = ['endangered'];
        setLearningFilters(filters);
        startLearningMode('Endangered Species', filters);
      } else if (topic === 'mammals') {
        const filters = ['mammal'];
        setLearningFilters(filters);
        startLearningMode('Mammals', filters);
      } else if (topic === 'birds') {
        const filters = ['bird'];
        setLearningFilters(filters);
        startLearningMode('Birds', filters);
      } else if (topic === 'all') {
        const filters = ['all'];
        setLearningFilters(filters);
        startLearningMode('All Species', filters);
      }
    }
  };

  const handleChatSubmit = async (query: string) => {
    const queryLower = query.toLowerCase().trim();

    // Check for topic commands (e.g., /birds, /plants, /invasive_species)
    if (queryLower.startsWith('/')) {
      const command = queryLower.substring(1); // Remove leading /

      // Add user message first
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, userMessage]);

      // Handle /random_topic
      if (command === 'random_topic') {
        handleRandomTopic();
        return;
      }

      // Handle /topics_list
      if (command === 'topics_list') {
        showTopicsList();
        return;
      }

      // Handle /end or /stop to end learning mode
      if (command === 'end' || command === 'stop') {
        // Clear all active streaming intervals and timeouts
        streamingIntervalsRef.current.forEach(interval => clearInterval(interval));
        streamingTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        streamingIntervalsRef.current = [];
        streamingTimeoutsRef.current = [];

        setIsLearningMode(false);
        setIsSpeciesStreamingInProgress(false);
        setQuickReplies([]);

        const stopMessage: ChatMessage = {
          id: `stop-${Date.now()}`,
          role: 'assistant',
          content: `🛑 **Learning mode stopped.**\n\nYou can start a new lesson anytime by typing a command like:\n• /plants\n• /birds\n• /random_topic`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, stopMessage]);
        return;
      }

      // Handle /clear to restart learning session
      if (command === 'clear') {
        // Reset all learning state
        setIsLearningMode(false);
        setIsSpeciesStreamingInProgress(false);
        setQuickReplies([]);
        setLearningSessionCount(0);
        shownSpeciesRef.current = [];
        currentPhaseRef.current = 'plants';
        taughtSpeciesRef.current = [];
        learningSession.resetSession();

        const restartMessage: ChatMessage = {
          id: `restart-${Date.now()}`,
          role: 'assistant',
          content: `🔄 **Learning session restarted.**\n\nYou can start fresh with:\n• /plants\n• /birds\n• /random_topic`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, restartMessage]);
        return;
      }

      // Handle /reset-stars to clear trivia progress
      if (command === 'reset-stars' || command === 'reset_stars') {
        resetParkStars();
        setParkListKey(prev => prev + 1); // Force ParkList to re-render

        const resetMessage: ChatMessage = {
          id: `reset-stars-${Date.now()}`,
          role: 'assistant',
          content: `⭐ **Stars Reset!**\n\nAll trivia progress has been cleared. You can now replay trivia games and earn stars again!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, resetMessage]);
        return;
      }

      // Handle /learn to show learning options
      if (command === 'learn') {
        const learnMessage: ChatMessage = {
          id: `learn-${Date.now()}`,
          role: 'assistant',
          content: `🎓 **Ready to learn about ${regionName}?**\n\nClick the button below to start your learning journey!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, learnMessage]);

        // Show "Start Learning" quick reply
        setQuickReplies([
          {
            id: 'start-learning',
            label: '🎓 Start Learning',
            emoji: '🎓',
            action: 'start-learning' as const
          }
        ]);
        return;
      }

      // Check if command matches a learning topic
      const topicKey = command as keyof typeof LEARNING_TOPICS;
      if (LEARNING_TOPICS[topicKey]) {
        const topicConfig = LEARNING_TOPICS[topicKey];

        // Stop current learning if active
        setIsSpeciesStreamingInProgress(false);
        setLearningSessionCount(0);

        // Show confirmation message
        const confirmMessage: ChatMessage = {
          id: `command-${Date.now()}`,
          role: 'assistant',
          content: `${topicConfig.emoji} **Starting: ${topicConfig.label}**\n\nSwitching to this topic now!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, confirmMessage]);

        // Start learning with this topic
        setLearningFilters(topicConfig.filters);
        setTimeout(() => startLearningMode(topicConfig.label, topicConfig.filters), 1000);
        return;
      }

      // Unknown command
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Unknown command: ${query}\n\nType **/topics_list** to see all available topics.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, errorMessage]);
      return;
    }

    // Check for filter slash commands in learning mode
    if (isLearningMode && query.startsWith('/filter ')) {
      const filterType = query.replace('/filter ', '').trim().toLowerCase();

      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, userMessage]);

      let responseContent = '';
      if (filterType === 'all') {
        setLearningFilters([]);
        responseContent = '✅ **Filter Reset**\n\nShowing all species now.';
      } else if (['invasive', 'venomous', 'endangered', 'critical', 'vulnerable'].includes(filterType)) {
        setLearningFilters([filterType]);
        responseContent = `✅ **Filter Applied**\n\nNow showing only ${filterType} species.`;
      } else {
        responseContent = '❌ **Unknown Filter**\n\nAvailable filters: invasive, venomous, endangered, critical, vulnerable, all';
      }

      const responseMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
        status: 'sent'
      };

      setTimeout(() => {
        setChatHistory(prev => [...prev, responseMessage]);
      }, 300);

      return;
    }

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
            imageUrl={ecoregionData?.image_url}
            imageAttribution={ecoregionData?.image_attribution}
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
            key={parkListKey}
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
                className="pointer-events-none w-full"
                style={{
                  backgroundColor: isChatHistoryExpanded ? 'rgba(15, 23, 42, 0.4)' : 'transparent', // More transparent
                  backdropFilter: isChatHistoryExpanded ? 'blur(12px)' : 'none',
                  borderRadius: '0.5rem 0.5rem 0 0', // rounded-t-lg to match ChatHistory
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="pointer-events-auto w-full">
                  <ChatHistory
                    messages={chatHistory}
                    quickReplies={quickReplies}
                    onQuickReply={handleQuickReplyClick}
                    isExpanded={isChatHistoryExpanded}
                    onMinimize={() => setIsChatHistoryExpanded(false)}
                    isTyping={isLoadingResponse}
                    theme={chatTheme}
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
              onExpandHistory={() => setIsChatHistoryExpanded(!isChatHistoryExpanded)}
              isChatHistoryExpanded={isChatHistoryExpanded}
              theme={chatTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParkSelectionPage;
