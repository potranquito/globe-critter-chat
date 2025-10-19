import { useState, useMemo, useEffect, useRef } from 'react';
import GlobeComponent from '@/components/Globe';
import GoogleEarthMap from '@/components/GoogleEarthMap';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
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
import { RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { ClipLoader, RingLoader, DotLoader, PulseLoader, BeatLoader } from 'react-spinners';
import { getCuratedSpecies, hasCuratedData } from '@/data/curatedSpecies';
import type { HabitatRegion } from '@/types/habitat';
import { performRegionAnalysis } from '@/services/regionService';
import type { RegionInfo, RegionSpecies } from '@/services/regionService';
import type { FilterCategory } from '@/types/speciesFilter';
import {
  sendEducationMessage,
  type EducationContext,
  initializeFoodWebTargets,
  validateSpeciesSelection,
  createProducerAgentContext,
  createHerbivoreAgentContext,
  createCarnivoreAgentContext,
  selectSpeciesWithAI
} from '@/services/educationAgent';
import { getRegionSpecies, generateColorTheme, generateCartoonAscii } from '@/services/mcpClient';
import { imageToAscii, boxAsciiArt } from '@/utils/imageToAscii';
import {
  generateTriviaQuestion,
  generateBriefSpeciesInfo,
  generateHint,
  generateHintLevel1WithLLM,
  generateHintLevel2WithWebSearch,
  generateHintLevel3WithVision,
  type TriviaQuestion
} from '@/services/triviaAgent';
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
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [lastTriviaAnswer, setLastTriviaAnswer] = useState<string | null>(null);
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState<number>(0);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);
  const [habitatZones, setHabitatZones] = useState<any[]>([]); // NEW: Transparent habitat overlays
  const [searchType, setSearchType] = useState<'species' | 'location' | null>(null); // Track search type
  const [isViewingEcoRegion, setIsViewingEcoRegion] = useState(false); // Track if viewing eco-region
  const [ecoRegionPins, setEcoRegionPins] = useState<any[]>([]); // NEW: WWF ecoregions from database

  // ✅ NEW: AbortController to cancel pending API calls on reset
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // ✅ Refs for character-by-character streaming display
  const streamingBufferRef = useRef({ fullResponse: '', displayedResponse: '' });
  const characterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🔍 DEBUG: Refs to track panel positions
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  // 🎰 Refs for sequential spin selection (to avoid state sync issues)
  const spinSelectedSpeciesRef = useRef<{
    carnivore: RegionSpecies | null;
    herbivore: RegionSpecies | null;
    omnivore: RegionSpecies | null;
    bird: RegionSpecies | null;
    plantCoral: RegionSpecies | null;
  }>({ carnivore: null, herbivore: null, omnivore: null, bird: null, plantCoral: null });

  // ✅ NEW: Separate loading state for background fetches (wildlife, protected areas)
  const [isBackgroundLoading, setIsBackgroundLoading] = useState(false);

  // ✅ NEW: Education context tracks the current card for context-aware chat
  const [educationContext, setEducationContext] = useState<EducationContext | null>(null);

  // 🎮 NEW: Food web game - selected species for trivia
  interface SelectedFoodWebSpecies {
    carnivore: RegionSpecies | null;
    herbivore: RegionSpecies | null;
    omnivore: RegionSpecies | null;
    bird: RegionSpecies | null;
    plantCoral: RegionSpecies | null;
  }
  const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState<SelectedFoodWebSpecies>({
    carnivore: null,
    herbivore: null,
    omnivore: null,
    bird: null,
    plantCoral: null
  });

  // 🎮 NEW: Food web game - target species and phase tracking
  const [foodWebTargetSpecies, setFoodWebTargetSpecies] = useState<{
    carnivore: { id: string; commonName: string; scientificName: string; animalType: string; imageUrl?: string } | null;
    herbivore: { id: string; commonName: string; scientificName: string; animalType: string; imageUrl?: string } | null;
    omnivore: { id: string; commonName: string; scientificName: string; animalType: string; imageUrl?: string } | null;
    bird: { id: string; commonName: string; scientificName: string; animalType: string; imageUrl?: string } | null;
    plantCoral: { id: string; commonName: string; scientificName: string; animalType: string; imageUrl?: string } | null;
  }>({
    carnivore: null,
    herbivore: null,
    omnivore: null,
    bird: null,
    plantCoral: null
  });

  const [foodWebGamePhase, setFoodWebGamePhase] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [foundFoodWebSpecies, setFoundFoodWebSpecies] = useState<Array<any>>([]);

  // 🎮 NEW: Reveal mechanic state
  const [selectedSpeciesForReveal, setSelectedSpeciesForReveal] = useState<RegionSpecies | null>(null);
  const [isSpeciesRevealed, setIsSpeciesRevealed] = useState(false);
  const [revealAttemptCount, setRevealAttemptCount] = useState(0); // Track attempts (max 4)
  const [isCarouselLocked, setIsCarouselLocked] = useState(false); // Lock after wrong reveal
  const [isFoodWebGameActive, setIsFoodWebGameActive] = useState(false); // 🎮 Game state flag
  const [isSpinningWheel, setIsSpinningWheel] = useState(false); // 🎰 Spin wheel animation state
  const [spinPhase, setSpinPhase] = useState<1 | 2 | 3 | 4 | 5>(1); // 🎰 Which species to select: 1=carnivore, 2=herbivore, 3=omnivore, 4=bird, 5=plantCoral
  const [isAISelecting, setIsAISelecting] = useState(false); // 🤖 AI is selecting species
  const [correctAnswerFeedback, setCorrectAnswerFeedback] = useState<string | null>(null); // 🎮 Show green glow
  const [wrongAnswerFeedback, setWrongAnswerFeedback] = useState<string | null>(null); // 🎮 Show red shake

  // 🌍 Simplified Loading State
  const [isInitializing, setIsInitializing] = useState(false);

  // 🎓 Education Agent State (additional state for food web game)
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [attemptCount, setAttemptCount] = useState(0); // Track wrong attempts for progressive hints

  // 🎮 NEW: Identification game state
  const [collectedSpecies, setCollectedSpecies] = useState<RegionSpecies[]>([]); // Species user has correctly identified (across all batches)
  const [currentChallengeSpecies, setCurrentChallengeSpecies] = useState<RegionSpecies | null>(null); // Species agent is asking for
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null); // Countdown timer (null = inactive)
  const [countdownMessageId, setCountdownMessageId] = useState<string | null>(null); // ID of countdown message for updates
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); // Timer interval ref

  // 🎨 NEW: Chat theme colors based on ecoregion (HSL format)
  interface ChatTheme {
    primary: string;      // HSL color string (e.g., "hsl(160, 84%, 39%)")
    secondary: string;    // HSL color string
    background: string;   // HSL color string
    text: string;         // HSL color string
    accent?: string;      // HSL color string (optional)
  }
  const [chatTheme, setChatTheme] = useState<ChatTheme>({
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  });

  // Debug: Log when chatTheme state changes
  useEffect(() => {
    console.log('[Index] 🎨 chatTheme state updated:', chatTheme);
  }, [chatTheme]);

  // ⏱️ Countdown timer logic
  useEffect(() => {
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // If countdown is active and greater than 0
    if (countdownSeconds !== null && countdownSeconds > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdownSeconds(prev => {
          if (prev === null || prev <= 0) {
            return null;
          }

          const newTime = prev - 1;

          // Update countdown message in chat
          if (countdownMessageId) {
            setChatHistory(prevHistory =>
              prevHistory.map(msg =>
                msg.id === countdownMessageId
                  ? { ...msg, content: `⏱️ Time remaining: **${newTime} seconds**` }
                  : msg
              )
            );
          }

          // When countdown reaches 0
          if (newTime === 0) {
            // Remove countdown message from chat
            if (countdownMessageId) {
              setChatHistory(prevHistory =>
                prevHistory.filter(msg => msg.id !== countdownMessageId)
              );
            }

            // Show hint button
            setQuickReplies([
              { id: 'hint', label: 'Give Me A Hint', emoji: '💡', action: 'hint' as const }
            ]);

            // Clear interval
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
              countdownIntervalRef.current = null;
            }

            return null;
          }

          return newTime;
        });
      }, 1000); // Update every second
    }

    // Cleanup on unmount or when countdown changes
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [countdownSeconds, countdownMessageId]);

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

  // 🎭 Show cartoon mascot and guardian greeting when entering new region
  useEffect(() => {
    // Only run if we're viewing an ecoregion, species are loaded, and chat is empty
    if (!isViewingEcoRegion || regionSpecies.length === 0 || chatHistory.length > 0) return;
    if (!regionInfo?.regionName) return;

    console.log('🎭 Generating cartoon mascot and guardian greeting via DALL-E...');

    const generateMascotAndGreeting = async () => {
      // Flag to control loading message cycling
      let shouldContinueLoading = { value: true };

      try {
        // 🎨 Regenerate color theme for variety (each mascot gets a new theme!)
        console.log('🎨 Regenerating color theme for fresh mascot...');
        const newTheme = await generateDynamicTheme(regionInfo.regionName, regionInfo.biome);
        setChatTheme(newTheme);
        console.log('✅ New theme applied:', newTheme);

        // 🌍 Show simple loading message
        setIsInitializing(true);
        setIsChatHistoryExpanded(true);

        // Sequential loading messages with narrative transitions
        const loadingMessages = [
          { initial: '🔍 Scanning ecoregion', conclusion: '⚠️ Threats detected!' },
          { initial: '🐾 Detecting nearby species', conclusion: '🏃 Endangered animals scared and running away!' },
          { initial: '📡 Interpreting warning message', conclusion: '👹 Poopy Pants has been spotted!' },
          { initial: '📞 Incoming call', conclusion: '❓ Mystery caller - Who is it?' }
        ];

        // Helper to stream a message character-by-character (returns Promise)
        const streamMessage = (text: string, messageId: string): Promise<void> => {
          return new Promise((resolve) => {
            let charIndex = 0;
            const streamInterval = setInterval(() => {
              if (charIndex < text.length) {
                const nextChar = text[charIndex];
                setChatHistory(prev =>
                  prev.map(msg =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + nextChar }
                      : msg
                  )
                );
                charIndex++;
              } else {
                clearInterval(streamInterval);
                resolve();
              }
            }, 35); // 35ms per character for loading messages (slower for better readability)
          });
        };

        // Helper to add thinking dots animation
        const addThinkingDots = (text: string, messageId: string): Promise<void> => {
          return new Promise((resolve) => {
            let dotCount = 0;
            const dotInterval = setInterval(() => {
              if (!shouldContinueLoading.value) {
                clearInterval(dotInterval);
                resolve();
                return;
              }
              dotCount = (dotCount + 1) % 4; // 0, 1, 2, 3, 0, 1, 2, 3...
              const dots = '.'.repeat(dotCount);
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === messageId
                    ? { ...msg, content: text + dots }
                    : msg
                )
              );
            }, 500); // Change dots every 500ms

            // Stop after 2 seconds (4 cycles)
            setTimeout(() => {
              clearInterval(dotInterval);
              resolve();
            }, 2000);
          });
        };

        // Async function to cycle through loading messages
        const cycleLoadingMessages = async () => {
          const messageIds: string[] = [];

          while (shouldContinueLoading.value) {
            // Cycle through all 4 messages
            for (let i = 0; i < loadingMessages.length; i++) {
              if (!shouldContinueLoading.value) break;
              const messageId = `loading-${i}-${Date.now()}`;

              // Create and add message
              const newMessage: ChatMessage = {
                id: messageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                status: 'sent'
              };

              if (i === 0 && messageIds.length === 0) {
                // First message ever
                setChatHistory([newMessage]);
                messageIds.push(messageId);
              } else {
                // Add to existing messages
                setChatHistory(prev => [...prev, newMessage]);
                messageIds.push(messageId);
              }

              // Stream initial text
              await streamMessage(loadingMessages[i].initial, messageId);

              // Add thinking dots animation for 2 seconds
              await addThinkingDots(loadingMessages[i].initial, messageId);

              // Clear and stream conclusion (faster)
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === messageId ? { ...msg, content: '' } : msg
                )
              );
              await streamMessage(loadingMessages[i].conclusion, messageId);

              // Wait 1 second before next message
              await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Keep only last 4 messages to avoid clutter
            setChatHistory(prev => prev.slice(-4));
          }
        };

        // Start cycling (will run until cleared)
        cycleLoadingMessages();

        // Pick a random species for the mascot
        const randomSpecies = regionSpecies[Math.floor(Math.random() * regionSpecies.length)];

        console.log('🎨 Calling MCP generateCartoonAscii for:', randomSpecies.commonName);

        // Generate cartoon image via MCP tool (width is for ASCII art sizing, max 80)
        const cartoonResult = await generateCartoonAscii({
          commonName: randomSpecies.commonName,
          scientificName: randomSpecies.scientificName,
          animalType: randomSpecies.animalType || undefined,
          width: 40
        });

        if (!cartoonResult.success || !cartoonResult.cartoonUrl) {
          console.error('❌ Failed to generate cartoon. Full result:', cartoonResult);
          throw new Error(`Failed to generate cartoon image: ${cartoonResult.message || 'Unknown error'}`);
        }

        console.log('✅ Cartoon generated and converted to ASCII!');

        if (!cartoonResult.asciiArt) {
          console.error('❌ No ASCII art in response');
          throw new Error('No ASCII art generated');
        }

        // Generate fun nickname for the mascot
        const funNames = [
          'Hoppy', 'Junior', 'Spaz', 'Buddy', 'Champ', 'Scout',
          'Lucky', 'Dash', 'Zippy', 'Sunny', 'Flash', 'Pepper',
          'Rocket', 'Peanut', 'Cookie', 'Sparky', 'Ace', 'Max',
          'Charlie', 'Ziggy', 'Biscuit', 'Muffin', 'Tango', 'Cosmo'
        ];
        const nickname = funNames[Math.floor(Math.random() * funNames.length)];

        // 50% chance to show DALL-E image instead of ASCII art
        const useDalleImage = Math.random() < 0.5;

        // Create character sheet with either DALL-E image or ASCII art
        const characterSheet = useDalleImage && cartoonResult.cartoonUrl
          ? `🎨 **${regionInfo.regionName} Mascot**

![${randomSpecies.commonName}](${cartoonResult.cartoonUrl})

**📋 Character Sheet**
**Name:** ${nickname}
**Species:** ${randomSpecies.commonName}
**Type:** ${randomSpecies.animalType || 'Unknown'}
${randomSpecies.conservationStatus ? `**Status:** ${randomSpecies.conservationStatus}` : ''}`
          : `🎨 **${regionInfo.regionName} Mascot**

\`\`\`
${cartoonResult.asciiArt}
\`\`\`

**📋 Character Sheet**
**Name:** ${nickname}
**Species:** ${randomSpecies.commonName}
**Type:** ${randomSpecies.animalType || 'Unknown'}
${randomSpecies.conservationStatus ? `**Status:** ${randomSpecies.conservationStatus}` : ''}`;

        // Create messages: Cartoon character first, then guardian greeting
        const asciiMessageId = `cartoon-${Date.now()}`;
        const greetingMessageId = `greeting-${Date.now() + 1}`;

        // Helper to expand conservation status abbreviations
        const expandConservationStatus = (status: string | null): string => {
          if (!status) return '';
          const statusMap: Record<string, string> = {
            'LC': 'Least Concern',
            'NT': 'Near Threatened',
            'VU': 'Vulnerable',
            'EN': 'Endangered',
            'CR': 'Critically Endangered',
            'EW': 'Extinct in the Wild',
            'EX': 'Extinct',
            'DD': 'Data Deficient'
          };
          return statusMap[status.toUpperCase()] || status;
        };

        const guardianName = generateGuardianName(regionInfo.regionName);
        const fullGreeting = `👋 Hello! I'm ${guardianName}\n\nWelcome to the ${regionInfo.regionName}! This incredible ecoregion is home to diverse wildlife and vibrant ecosystems.\n\n😵 I have a confession... The evil villain Poopy Pants blinded me! Now I've lost track of all my animal and plant friends who live here. Can you help me find them?\n\n🎮 Let's play a game! I'll give you the name of a species, and you click on its image to help me identify it. Together we can defeat Poopy Pants and reconnect with the creatures of this region!`;

        // Extract just the image/ASCII portion for laser-in animation
        const imageOnly = useDalleImage && cartoonResult.cartoonUrl
          ? `![${randomSpecies.commonName}](${cartoonResult.cartoonUrl})`
          : `\`\`\`\n${cartoonResult.asciiArt}\n\`\`\``;

        // Extract character sheet text (without image/ASCII)
        const expandedStatus = expandConservationStatus(randomSpecies.conservationStatus);
        const characterSheetText = `🎨 ${regionInfo.regionName} Mascot

📋 Character Sheet
Name: ${nickname}
Species: ${randomSpecies.commonName}
Type: ${randomSpecies.animalType || 'Unknown'}
${expandedStatus ? `Status: ${expandedStatus}` : ''}`;

        // DON'T clear loading interval yet - it will continue until laser-in completes

        // Step 1: Show image/ASCII with laser-in animation (instant display, CSS animates it)
        const imageMessageId = `image-${Date.now()}`;
        const imageMessage: ChatMessage = {
          id: imageMessageId,
          role: 'assistant',
          content: imageOnly, // Show full image/ASCII immediately (laser-in animation via CSS)
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, imageMessage]);

        // Step 2: After laser-in completes (2.5s), clear loading and start streaming character sheet
        setTimeout(() => {
          // Stop loading message cycling
          shouldContinueLoading.value = false;
          setIsInitializing(false);
          setIsLoading(true);

          // Clear chat history and show character sheet message (empty to start)
          const characterSheetMessageId = `character-sheet-${Date.now()}`;
          const characterSheetMessage: ChatMessage = {
            id: characterSheetMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            status: 'sent'
          };
          setChatHistory([imageMessage, characterSheetMessage]);

          // Stream character sheet text
          let charSheetIndex = 0;
          const charSheetInterval = setInterval(() => {
            if (charSheetIndex < characterSheetText.length) {
              const nextChar = characterSheetText[charSheetIndex];
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === characterSheetMessageId
                    ? { ...msg, content: msg.content + nextChar }
                    : msg
                )
              );
              charSheetIndex++;
            } else {
              // Character sheet complete, now stream greeting
              clearInterval(charSheetInterval);

              // Add empty greeting message
              const greetingMessageId = `greeting-${Date.now()}`;
              const greetingMessage: ChatMessage = {
                id: greetingMessageId,
                role: 'assistant',
                content: '',
                timestamp: new Date(),
                status: 'sent'
              };
              setChatHistory(prev => [...prev, greetingMessage]);

              // Stream guardian greeting
              let greetingIndex = 0;
              const greetingInterval = setInterval(() => {
                if (greetingIndex < fullGreeting.length) {
                  const nextChar = fullGreeting[greetingIndex];
                  setChatHistory(prev =>
                    prev.map(msg =>
                      msg.id === greetingMessageId
                        ? { ...msg, content: msg.content + nextChar }
                        : msg
                    )
                  );
                  greetingIndex++;
                } else {
                  // Greeting complete
                  clearInterval(greetingInterval);
                  setIsLoading(false);

                  // Set custom quick reply button
                  console.log('🎮 Setting quick reply button after greeting complete');
                  setQuickReplies([
                    {
                      id: 'help-find-species',
                      label: '🔍 Help Find Ecoregion Species',
                      emoji: '🔍',
                      action: 'help-find-species'
                    }
                  ]);
                  console.log('✅ Quick reply button set');
                }
              }, 40); // 40ms per character for greeting (slowest for better readability)
            }
          }, 30); // 30ms per character for character sheet (slower for better readability)
        }, 4000); // Wait for laser-in animation to complete (4 seconds)
      } catch (error) {
        console.error('❌ Error generating mascot:', error);
        // Stop loading message cycling
        shouldContinueLoading.value = false;
        setIsLoading(false);
        setIsInitializing(false);
        // Show error message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: '❌ Failed to generate mascot image. Please try refreshing the page.',
          timestamp: new Date(),
          status: 'error'
        };
        setChatHistory([errorMessage]);
      }
    };

    generateMascotAndGreeting();
  }, [isViewingEcoRegion, regionSpecies, chatHistory.length, regionInfo]);


  // 📚 Update education context whenever the right-side card or food web changes
  useEffect(() => {
    console.log('🔍 Education context update check:', {
      selectedCarouselSpecies: selectedCarouselSpecies?.commonName,
      selectedWildlifePark: selectedWildlifePark?.name,
      isViewingEcoRegion,
      regionInfo: regionInfo?.regionName,
      useGoogleMaps,
      foodWebCount: [selectedFoodWebSpecies.carnivore, selectedFoodWebSpecies.herbivore, selectedFoodWebSpecies.omnivore, selectedFoodWebSpecies.bird, selectedFoodWebSpecies.plantCoral].filter(Boolean).length
    });

    // Priority 1: Food Web (ONLY if all 5 species selected - after Play Trivia pressed)
    const foodWebSpeciesArray = [
      selectedFoodWebSpecies.carnivore ? { ...selectedFoodWebSpecies.carnivore, role: 'carnivore' as const } : null,
      selectedFoodWebSpecies.herbivore ? { ...selectedFoodWebSpecies.herbivore, role: 'herbivore' as const } : null,
      selectedFoodWebSpecies.omnivore ? { ...selectedFoodWebSpecies.omnivore, role: 'omnivore' as const } : null,
      selectedFoodWebSpecies.bird ? { ...selectedFoodWebSpecies.bird, role: 'bird' as const } : null,
      selectedFoodWebSpecies.plantCoral ? { ...selectedFoodWebSpecies.plantCoral, role: 'plantCoral' as const } : null,
    ].filter(Boolean);

    // Only activate food web context when all 5 species are selected AND chat has been opened (trivia started)
    if (foodWebSpeciesArray.length === 5 && regionInfo && useGoogleMaps && chatHistory.length > 0) {
      console.log('✅ Setting education context: FOOD WEB (all 5 species)');
      setEducationContext({
        type: 'foodweb',
        displayName: `Food Web in ${regionInfo.regionName}`,
        data: {
          ecoregionName: regionInfo.regionName,
          species: foodWebSpeciesArray.map(s => ({
            commonName: s!.commonName,
            scientificName: s!.scientificName,
            role: s!.role,
            conservationStatus: s!.conservationStatus,
            animalType: s!.animalType,
          })),
          speciesCount: foodWebSpeciesArray.length,
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

    // Priority 3: Carousel Species Card (only if no food web selected)
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

    // Priority 4: Eco-Region Card
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
  }, [selectedCarouselSpecies, selectedWildlifePark, isViewingEcoRegion, regionInfo, regionSpecies, useGoogleMaps, selectedFoodWebSpecies, chatHistory.length]);

  // Update quick replies when chat history changes
  // 🎮 DISABLED during Food Web Game - quick replies are managed manually by game flow
  useEffect(() => {
    // Skip auto-generation when in Food Web Game mode OR during spinning wheel phase
    if (isFoodWebGameActive || isAISelecting || isSpinningWheel) {
      return; // Quick replies managed by game flow
    }

    // Skip if loading message is showing
    const hasLoadingMessage = chatHistory.some(msg => msg.id.startsWith('loading-'));
    if (hasLoadingMessage) {
      setQuickReplies([]);
      return;
    }

    if (chatHistory.length > 0 && isChatHistoryExpanded) {
      const lastMessage = chatHistory[chatHistory.length - 1];
      const newReplies = generateQuickReplies(lastMessage);
      setQuickReplies(newReplies);
    } else {
      setQuickReplies([]);
    }
  }, [chatHistory, isChatHistoryExpanded, lastTriviaAnswer, isFoodWebGameActive, isAISelecting, isSpinningWheel]);

  // 🎯 HANDLE ECO-REGION CLICK: Switch to 2D map view centered on region

  // 🎨 Detect biome type from ecoregion name
  const detectBiomeType = (regionName: string): string => {
    const name = regionName.toLowerCase();

    if (name.includes('marine') || name.includes('ocean') || name.includes('coral') || name.includes('reef')) return 'marine';
    if (name.includes('desert') || name.includes('sahara') || name.includes('arid')) return 'desert';
    if (name.includes('arctic') || name.includes('tundra') || name.includes('polar')) return 'arctic';
    if (name.includes('tropical') || name.includes('rainforest') || name.includes('jungle')) return 'tropical';
    if (name.includes('savanna') || name.includes('grassland') || name.includes('serengeti')) return 'savanna';
    if (name.includes('mountain') || name.includes('alpine') || name.includes('highland')) return 'mountain';
    if (name.includes('wetland') || name.includes('marsh') || name.includes('swamp') || name.includes('mangrove')) return 'wetland';
    if (name.includes('temperate') || name.includes('deciduous') || name.includes('broadleaf')) return 'temperate-forest';
    if (name.includes('boreal') || name.includes('taiga') || name.includes('conifer')) return 'boreal';

    return 'forest'; // Default
  };

  // 🎨 Generate dynamic color theme using MCP service
  const generateDynamicTheme = async (ecoregionName: string, biome?: string): Promise<ChatTheme> => {
    try {
      console.log('[Theme] 🎨 Generating dynamic color theme for:', ecoregionName, 'Biome:', biome);
      const result = await generateColorTheme({ ecoregionName, biome });
      console.log('[Theme] 📡 MCP Response:', result);

      if (result.success && result.theme) {
        console.log('[Theme] ✅ Generated theme:', result.theme);
        console.log('[Theme] Base Hue:', result.baseHue, 'Dominant Color:', result.characteristics?.dominantColor);
        return result.theme;
      } else {
        console.warn('[Theme] ⚠️ MCP color theme generation failed, using default');
        return {
          primary: 'hsl(160, 84%, 39%)',
          secondary: 'hsl(158, 64%, 52%)',
          background: 'hsl(222, 47%, 11%)',
          text: 'hsl(152, 76%, 80%)',
          accent: 'hsl(160, 100%, 70%)'
        };
      }
    } catch (error) {
      console.error('[Theme] ❌ Error generating color theme:', error);
      // Fallback to default emerald theme
      return {
        primary: 'hsl(160, 84%, 39%)',
        secondary: 'hsl(158, 64%, 52%)',
        background: 'hsl(222, 47%, 11%)',
        text: 'hsl(152, 76%, 80%)',
        accent: 'hsl(160, 100%, 70%)'
      };
    }
  };

  // 🎭 Generate ASCII art for a species (DEPRECATED - now using DALL-E generated cartoons)
  // This function is no longer used but kept for reference
  /*
  const generateSpeciesASCII = (species: RegionSpecies): string => {
    // Old hardcoded ASCII art logic removed
    return '';
  };
  */

  // 🤖 Generate guardian name from region name
  const generateGuardianName = (regionName: string): string => {
    // Extract the main part of the region name (before any parentheses or dashes)
    const mainName = regionName.split(/[(\-]/)[0].trim();

    return `${mainName} AI Guardian`;
  };

  const handleEcoRegionClick = async (point: any) => {
    console.log('Eco-region clicked:', point.name);
    setHasInteracted(true);

    // ✅ Reset chat history and food web game for new ecoregion
    setChatHistory([]);
    setSelectedFoodWebSpecies({
      carnivore: null,
      herbivore: null,
      omnivore: null,
      bird: null,
      plantCoral: null
    });

    // 🎮 RESET ALL GAME STATE when entering new region
    setIsFoodWebGameActive(false);
    setFoodWebGamePhase(0);
    setSelectedSpeciesForReveal(null);
    setIsSpeciesRevealed(false);
    setRevealAttemptCount(0);
    setIsCarouselLocked(false);
    setConversationHistory([]);
    setAttemptCount(0);
    setFoodWebTargetSpecies({ carnivore: null, herbivore: null, omnivore: null, bird: null, plantCoral: null });
    console.log('🔄 Game state reset - isFoodWebGameActive set to FALSE');

    // 🎨 Generate dynamic color theme using MCP
    const theme = await generateDynamicTheme(point.name, point.biome);
    console.log('[handleEcoRegionClick] 🎨 Setting chat theme:', theme);
    setChatTheme(theme);
    console.log('[handleEcoRegionClick] ✅ Chat theme state updated');

    // Auto-expand chat to prepare for messages
    setIsChatHistoryExpanded(true);

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

      // Step 3: Get ALL species for this ecoregion via MCP server
      console.log('📡 Fetching species from MCP server for:', ecoregionData.name);

      let balancedSpecies: any[] = [];
      try {
        const mcpResult = await getRegionSpecies({
          ecoregionName: ecoregionData.name,
          limit: 200 // Get large pool for variety
        });

        if (mcpResult.success && mcpResult.species) {
          // Transform MCP species to match Supabase format
          const transformedSpecies = mcpResult.species.map((sp: any) => ({
            id: sp.id,
            scientific_name: sp.scientific_name,
            common_name: sp.common_name,
            class: sp.species_type || 'Unknown', // MCP uses species_type
            conservation_status: sp.conservation_status,
            ui_group: sp.dietary_category || 'Unknown', // Use dietary_category as ui_group
            image_url: sp.image_url,
            is_marine: sp.is_marine || false,
            is_terrestrial: sp.is_terrestrial || false,
            is_freshwater: sp.is_freshwater || false,
            species_type: sp.species_type,
            trophic_role: sp.trophic_role,
            dietary_category: sp.dietary_category,
            species_ecoregions: sp.species_ecoregions || []
          }));

          // Deduplicate by BOTH species ID and image URL (remove duplicate frogs AND duplicate images)
          const seenIds = new Set<string>();
          const seenImages = new Set<string>();
          balancedSpecies = transformedSpecies.filter((sp: any) => {
            // Skip if duplicate ID
            if (seenIds.has(sp.id)) {
              console.log(`🔄 Removing duplicate ID: ${sp.common_name} (${sp.id})`);
              return false;
            }

            // Skip if duplicate image (different species, same photo)
            if (sp.image_url && seenImages.has(sp.image_url)) {
              console.log(`🔄 Removing duplicate image: ${sp.common_name} (same image as another species)`);
              return false;
            }

            seenIds.add(sp.id);
            if (sp.image_url) seenImages.add(sp.image_url);
            return true;
          });

          console.log(`✅ MCP returned ${mcpResult.species.length} species, deduplicated to ${balancedSpecies.length}`);
        } else {
          console.error('❌ MCP query failed:', mcpResult.message || 'Unknown error');
        }
      } catch (error) {
        console.error('❌ Error fetching species from MCP:', error);
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

      // 🔍 DEBUG: Check dietary categories in carousel
      const dietaryCategoryCounts = speciesList.reduce((acc: any, sp: any) => {
        const cat = sp.dietaryCategory || 'null';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});
      console.log('🍴 Dietary categories in carousel:', dietaryCategoryCounts);

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

  // Generate quick replies based on conversation state
  const generateQuickReplies = (lastMessage: ChatMessage | undefined): QuickReply[] => {
    // Quick replies disabled - return empty array
    return [];
  };

  // Handle quick reply button clicks
  const handleQuickReply = (reply: QuickReply) => {
    let message = '';

    switch (reply.action) {
      case 'help-find-species':
        // Start the species roulette game
        setQuickReplies([]); // Clear the button

        // Show loading message with spinning wheel activation
        setIsLoading(true);
        const loadingMessage: ChatMessage = {
          id: `loading-${Date.now()}`,
          role: 'assistant',
          content: '🌍 Activating Spinning Wheel...',
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, loadingMessage]);

        // Small delay to show loading message, then start the game
        setTimeout(() => {
          setIsLoading(false);
          handlePlayTrivia();
        }, 800);
        return; // Don't send a message
      case 'answer':
        message = reply.value || '';
        setLastTriviaAnswer(reply.value || null);
        break;
      case 'explain':
        message = 'Can you explain why that answer is correct?';
        setLastTriviaAnswer(null);
        break;
      case 'trivia':
        message = 'Give me another trivia question';
        setLastTriviaAnswer(null);
        break;
      case 'facts':
        message = 'Tell me some interesting facts';
        break;
      case 'conservation':
        message = 'What is the conservation status and threats?';
        break;
      case 'hint':
        // Hints are now handled by the education agent through conversation
        message = 'Can you give me a hint?';
        break;
      case 'play-food-web-game':
        // Battle Poopy Pants game
        setQuickReplies([]); // Clear the button
        toast({
          title: "⚔️ Battle Poopy Pants - Coming Soon!",
          description: `You've collected ${collectedSpecies.length} species. The ecosystem battle game will launch here!`,
        });
        return; // Don't send a message
    }

    if (message) {
      handleSearch(message);
    }
  };

  // Retry handler for failed messages
  const handleRetryMessage = (messageId: string) => {
    const message = chatHistory.find(msg => msg.id === messageId);
    if (!message || message.role !== 'user') {
      console.error('Cannot retry: message not found or not a user message');
      return;
    }

    // Remove the failed message and its associated assistant message (if any)
    setChatHistory(prev => prev.filter(msg => msg.id !== messageId));

    // Resend the message
    handleSearch(message.content);
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
      const userMessageId = Date.now().toString();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: 'user',
        content: query,
        timestamp: new Date(),
        status: 'sending'
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

      // Character-by-character streaming display using refs
      streamingBufferRef.current = { fullResponse: '', displayedResponse: '' };

      const revealNextCharacter = () => {
        const { fullResponse, displayedResponse } = streamingBufferRef.current;

        // Character streaming progress (commented to reduce console spam)
        // console.log('🔍 Reveal:', displayedResponse.length, '/', fullResponse.length);

        if (displayedResponse.length < fullResponse.length) {
          streamingBufferRef.current.displayedResponse = fullResponse.substring(0, displayedResponse.length + 1);
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: streamingBufferRef.current.displayedResponse }
                : msg
            )
          );
        } else if (characterIntervalRef.current && fullResponse.length > 0) {
          // All characters revealed - stop the interval and stop loading
          console.log('✅ All characters revealed, stopping interval');
          clearInterval(characterIntervalRef.current);
          characterIntervalRef.current = null;
          setIsLoading(false);
        }
      };

      sendEducationMessage(
        query,
        educationContext,
        chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
        (chunk: string) => {
          // Check for off-topic response
          if (streamingBufferRef.current.fullResponse.includes('OFF_TOPIC_ERROR') || chunk.includes('OFF_TOPIC_ERROR')) {
            // Clear interval and mark as error
            if (characterIntervalRef.current) clearInterval(characterIntervalRef.current);
            setChatHistory(prev =>
              prev.map(msg =>
                msg.id === userMessageId
                  ? { ...msg, status: 'error' as const, errorMessage: 'Please stay relevant when chatting about wildlife' }
                  : msg.id === assistantMessageId
                  ? { ...msg, content: '' }
                  : msg
              )
            );
            setIsLoading(false);
            return;
          }

          // Accumulate chunks (character reveal happens via interval)
          console.log('📦 Chunk received:', chunk);
          streamingBufferRef.current.fullResponse += chunk;

          // Start the interval after the first chunk arrives
          if (!characterIntervalRef.current) {
            console.log('🚀 Starting character reveal interval');
            characterIntervalRef.current = setInterval(revealNextCharacter, 10);
          }
        },
        () => {
          // On complete - let character reveal continue naturally until all text is shown
          // Don't stop the interval or setIsLoading(false) - let revealNextCharacter handle that
          // The interval will stop automatically when displayedResponse catches up to fullResponse

          console.log('✅ Streaming complete, waiting for character reveal to finish');
          // Update user message status to 'sent'
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === userMessageId
                ? { ...msg, status: 'sent' as const }
                : msg
            )
          );
        },
        (error: Error) => {
          // On error - clear interval
          if (characterIntervalRef.current) clearInterval(characterIntervalRef.current);
          console.error('Education agent error:', error);
          // Update user message status to 'error'
          setChatHistory(prev =>
            prev.map(msg => {
              if (msg.id === userMessageId) {
                return {
                  ...msg,
                  status: 'error' as const,
                  errorMessage: 'Please stay relevant when chatting about wildlife'
                };
              }
              if (msg.id === assistantMessageId) {
                return { ...msg, content: `Sorry, I encountered an error: ${error.message}` };
              }
              return msg;
            })
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
        timestamp: new Date(),
        status: 'sending'
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
    console.log('🎯 Carousel species clicked:', species.commonName, '| Game Active:', isFoodWebGameActive);

    // 🎮 AUTO-START: If game not active, clicking a species starts the game
    if (!isFoodWebGameActive) {
      console.log('🎮 AUTO-START: Game not active - starting Food Web Trivia!');

      toast({
        title: "Starting Food Web Trivia! 🌍",
        description: "Let's find the right species together!",
      });

      // Start the game (this clears all state and initializes)
      await handlePlayTrivia();

      // IMPORTANT: Return immediately without setting any species state
      // User will need to click species again after seeing the intro
      console.log('✅ Game started. User can now select species.');
      return;
    }

    // 🎮 FOOD WEB GAME MODE: New Reveal Mechanic
    console.log('🎮 Species clicked during food web game:', species.commonName);

    // Check if carousel is locked (during game interactions)
    if (isCarouselLocked) {
      toast({
        title: "Carousel Locked",
        description: "Complete the current interaction to continue!",
        variant: "destructive"
      });
      return;
    }

    // Show species image on right panel (facts HIDDEN until reveal)
    setSelectedSpeciesForReveal(species);
    setIsSpeciesRevealed(false); // Facts hidden
    setSelectedCarouselSpecies(species); // Show in right panel

    console.log('✅ Species selected for reveal. Facts hidden until reveal button clicked.');

    toast({
      title: "Species Selected",
      description: "Click 'Reveal Species' to check if it's correct!",
    });
  };

  // 🎮 Handle Reveal Species Button
  const handleRevealSpecies = async () => {
    if (!selectedSpeciesForReveal) return;

    console.log('🔍 Revealing species:', selectedSpeciesForReveal.commonName);

    // Reveal the facts
    setIsSpeciesRevealed(true);

    // Get current target based on phase
    const currentTarget = getCurrentTarget(foodWebGamePhase);

    if (!currentTarget) {
      console.error('No current target for phase', foodWebGamePhase);
      return;
    }

    // Validate the selection
    const validation = validateSpeciesSelection(
      selectedSpeciesForReveal,
      currentTarget
    );

    console.log('Validation result:', validation);

    if (validation.correct) {
      // ✅ CORRECT SELECTION!
      console.log('✅ Correct! User found:', validation.targetName);

      // Add to found species
      const newFoundSpecies = [
        ...foundFoodWebSpecies,
        {
          commonName: currentTarget.commonName,
          scientificName: currentTarget.scientificName,
          role: getSlotForPhase(foodWebGamePhase),
          conservationStatus: selectedSpeciesForReveal.conservationStatus || 'Unknown',
          animalType: currentTarget.animalType
        }
      ];
      setFoundFoodWebSpecies(newFoundSpecies);

      // ✅ FIX: Also add to selectedFoodWebSpecies to show in banner!
      const slot = getSlotForPhase(foodWebGamePhase);
      setSelectedFoodWebSpecies(prev => ({
        ...prev,
        [slot]: selectedSpeciesForReveal
      }));

      // Clear species card after 10 seconds
      setTimeout(() => {
        setSelectedSpeciesForReveal(null);
        setIsSpeciesRevealed(false);
        setSelectedCarouselSpecies(null);
      }, 10000); // 10 second delay

      // Reset reveal state for next phase (but keep card visible)
      setRevealAttemptCount(0);
      setIsCarouselLocked(false);

      // Send celebration message to AI
      await handleSearch(`I found the ${validation.targetName}!`);

      // Check if game is complete (all 3 phases done)
      if (foodWebGamePhase >= 3) {
        // GAME COMPLETE!
        console.log('🎉 All 3 species found! Game complete!');

        // Reset game state
        setIsFoodWebGameActive(false);

        toast({
          title: "🎉 Game Complete!",
          description: "You found all 5 species!",
        });
      } else {
        // Move to next phase
        const nextPhase = (foodWebGamePhase + 1) as 1 | 2 | 3;
        setFoodWebGamePhase(nextPhase);

        // Update education context for next phase (Agent Transition)
        console.log(`🤖 Agent Transition: Phase ${foodWebGamePhase} → Phase ${nextPhase}`);
        console.log(`🤖 Activating Agent: PHASE ${nextPhase} - ${nextPhase === 2 ? 'HERBIVORE' : 'CARNIVORE'} AGENT`);

        const nextContext = nextPhase === 2
          ? createHerbivoreAgentContext(regionInfo!.regionName, foodWebTargetSpecies, newFoundSpecies)
          : createCarnivoreAgentContext(regionInfo!.regionName, foodWebTargetSpecies, newFoundSpecies);

        setEducationContext(nextContext);

        console.log(`✅ Moving to phase ${nextPhase}`);

        toast({
          title: `Phase ${nextPhase}/3`,
          description: `Now find the ${nextPhase === 2 ? foodWebTargetSpecies.herbivoreOmnivore?.commonName : foodWebTargetSpecies.carnivore?.commonName}!`,
        });
      }
    } else {
      // ❌ WRONG SELECTION
      console.log('❌ Wrong! That is not:', validation.targetName);

      // Increment attempt counter
      const newAttemptCount = revealAttemptCount + 1;
      setRevealAttemptCount(newAttemptCount);

      // 🎓 NEW: Share brief species info + trigger trivia question
      const briefInfo = generateBriefSpeciesInfo(selectedSpeciesForReveal, { commonName: validation.targetName });

      // Stream brief species info
      await streamTextToChat(
        `wrong-species-${Date.now()}`,
        briefInfo,
        'assistant'
      );

      // Show hint button after wrong answer
      setQuickReplies([
        { id: 'hint', label: 'Give Me A Hint', emoji: '💡', action: 'hint' as const }
      ]);

      // Clear right panel after a delay (10 seconds)
      setTimeout(() => {
        setSelectedSpeciesForReveal(null);
        setIsSpeciesRevealed(false);
        setSelectedCarouselSpecies(null);
      }, 10000); // 10 second delay

      // 🎁 AUTO-ADVANCE: If all 3 hints have been used, auto-select correct species and move to next phase
      if (hintLevel >= 3) {
        console.log('🎁 All hints exhausted - auto-advancing to next phase with correct species');

        const autoAdvanceMessage = `I see you're having trouble finding the **${validation.targetName}**. That's okay! Let me help you move forward.

The correct answer was the **${currentTarget.commonName}**. Now let's find the next species in our food web!`;

        await streamTextToChat(
          `auto-advance-${Date.now()}`,
          autoAdvanceMessage,
          'assistant'
        );

        // Add the species to found list
        const newFoundSpecies = [
          ...foundFoodWebSpecies,
          {
            commonName: currentTarget.commonName,
            scientificName: currentTarget.scientificName,
            role: getSlotForPhase(foodWebGamePhase),
            conservationStatus: 'Unknown',
            animalType: currentTarget.animalType
          }
        ];
        setFoundFoodWebSpecies(newFoundSpecies);

        // ✅ FIX: Also add to selectedFoodWebSpecies to show in banner
        const slot = getSlotForPhase(foodWebGamePhase);
        setSelectedFoodWebSpecies(prev => ({
          ...prev,
          [slot]: {
            ...currentTarget,
            conservationStatus: 'Unknown'
          }
        }));

        // Reset for next phase
        setRevealAttemptCount(0);
        setAttemptCount(0);

        // Advance to next phase
        if (foodWebGamePhase < 3) {
          const nextPhase = (foodWebGamePhase + 1) as 1 | 2 | 3;
          setFoodWebGamePhase(nextPhase);

          const nextTarget = nextPhase === 2
            ? foodWebTargetSpecies.herbivoreOmnivore
            : foodWebTargetSpecies.carnivore;

          const nextMessage = `Great! Now let's find a **${nextPhase === 2 ? 'herbivore or omnivore' : 'carnivore'}**.

Can you find the **${nextTarget?.commonName}**?`;

          await streamTextToChat(
            `next-phase-${Date.now()}`,
            nextMessage,
            'assistant'
          );

          setQuickReplies([
            { id: 'hint', label: 'Give Me A Hint', emoji: '💡', action: 'hint' as const }
          ]);
        } else {
          // Game complete
          const completeMessage = `🎉 **Congratulations!** You've completed the food web!

You found all five species:
- Carnivore: ${foodWebTargetSpecies.carnivore?.commonName}
- Herbivore: ${foodWebTargetSpecies.herbivore?.commonName}
- Omnivore: ${foodWebTargetSpecies.omnivore?.commonName}
- Bird: ${foodWebTargetSpecies.bird?.commonName}
- Plant/Coral: ${foodWebTargetSpecies.plantCoral?.commonName}

Great job learning about the ${regionInfo?.regionName} ecosystem!`;

          await streamTextToChat(
            `game-complete-${Date.now()}`,
            completeMessage,
            'assistant'
          );

          setQuickReplies([]);
          setIsFoodWebGameActive(false);
        }

        return; // Skip trivia generation
      }

      // Note: Old trivia system code removed - now handled by education agent
      return; // Don't execute 4th attempt logic anymore

      // Check if this was the 4th attempt
      if (newAttemptCount >= 4) {
        // AUTO-REVEAL: Give them the answer
        console.log('🎁 4th attempt - auto-revealing correct species');

        toast({
          title: "Don't worry!",
          description: `It's the ${validation.targetName}! Let me tell you about it...`,
        });

        // AI explains what the correct species is
        await handleSearch(`I've tried 4 times. Can you just tell me about the ${validation.targetName}?`);

        // Unlock carousel and reset attempts
        setIsCarouselLocked(false);
        setRevealAttemptCount(0);

        // Auto-add to food web (they get credit for trying)
        const newFoundSpecies = [
          ...foundFoodWebSpecies,
          {
            commonName: currentTarget.commonName,
            scientificName: currentTarget.scientificName,
            role: getSlotForPhase(foodWebGamePhase),
            conservationStatus: 'Unknown',
            animalType: currentTarget.animalType
          }
        ];
        setFoundFoodWebSpecies(newFoundSpecies);

        // Move to next phase
        if (foodWebGamePhase < 3) {
          const nextPhase = (foodWebGamePhase + 1) as 1 | 2 | 3;
          setFoodWebGamePhase(nextPhase);

          // Agent Transition (after 4th failed attempt)
          console.log(`🤖 Agent Transition (4th attempt): Phase ${foodWebGamePhase} → Phase ${nextPhase}`);
          console.log(`🤖 Activating Agent: PHASE ${nextPhase} - ${nextPhase === 2 ? 'HERBIVORE' : 'CARNIVORE'} AGENT`);

          const nextContext = nextPhase === 2
            ? createHerbivoreAgentContext(regionInfo!.regionName, foodWebTargetSpecies, newFoundSpecies)
            : createCarnivoreAgentContext(regionInfo!.regionName, foodWebTargetSpecies, newFoundSpecies);

          setEducationContext(nextContext);
        } else {
          // Game complete
          setIsFoodWebGameActive(false);

          toast({
            title: "🎉 Game Complete!",
            description: "You found all 5 species!",
          });
        }

        return;
      }

      // Lock carousel until trivia answered
      setIsCarouselLocked(true);

      // Send message to AI with species info + request for hint
      // AI will respond with: "That was a [species]! [fact]. But I need the [target]. Want a hint?"
      await handleSearch(`That was a ${selectedSpeciesForReveal.commonName}. Is that the ${validation.targetName}?`);

      toast({
        title: "Not quite!",
        description: `That was a ${selectedSpeciesForReveal.commonName}. Answer the question to try again!`,
        variant: "destructive"
      });
    }
  };

  // 🎓 Handle Trivia Answer
  // Old trivia handler - no longer used with education agent system
  const handleTriviaAnswer = async (choice: string) => {
    console.log('⚠️ handleTriviaAnswer called but is deprecated - education agent handles trivia now');
    return;
    if (!triviaQuestion) return;

    // Clear quick replies immediately to remove A/B/C/D buttons
    setQuickReplies([]);

    const answerIndex = ['A', 'B', 'C', 'D'].indexOf(choice);
    if (answerIndex === -1) return;

    const correct = answerIndex === triviaQuestion.correctAnswer;

    if (correct) {
      // ✅ CORRECT ANSWER

      // 🎓 Check if this was the hint-gating trivia FIRST (before streaming success message)
      if (triviaContext === 'hint') {
        console.log('[Hint Trivia] User answered correctly - showing hint now');

        // Show loading spinner IMMEDIATELY before any text
        setIsLoading(true);

        const newHintLevel = Math.min(hintLevel + 1, 3);
        setHintLevel(newHintLevel);

        const currentTarget = foodWebGamePhase === 1
          ? foodWebTargetSpecies.producer
          : foodWebGamePhase === 2
            ? foodWebTargetSpecies.herbivoreOmnivore
            : foodWebTargetSpecies.carnivore;

        // Generate hint while spinner is showing
        let hint: string = '';

        try {
          // Use different hint generation methods based on level
          if (newHintLevel === 1) {
            // Hint 1: LLM knowledge base describing physical appearance
            hint = await generateHintLevel1WithLLM(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
              },
              regionInfo!.regionName
            );
          } else if (newHintLevel === 2) {
            // Hint 2: Web search for internet descriptions
            hint = await generateHintLevel2WithWebSearch(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
              },
              regionInfo!.regionName
            );
          } else {
            // Hint 3: Vision API to analyze species image
            hint = await generateHintLevel3WithVision(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                imageUrl: currentTarget!.imageUrl || ''
              },
              regionInfo!.regionName
            );
          }
        } catch (error) {
          console.error('[Hint Generation] Error:', error);
          // Fallback hint if generation fails
          const roleDesc = getRoleDescription(foodWebGamePhase);
          hint = `🔍 **Hint ${newHintLevel}/3:** Look for a ${roleDesc} in the ${regionInfo!.regionName}. The species is a ${currentTarget!.animalType}.`;
        }

        // Ensure hint is not empty
        if (!hint || hint.trim() === '') {
          const roleDesc = getRoleDescription(foodWebGamePhase);
          hint = `🔍 **Hint ${newHintLevel}/3:** Look for a ${roleDesc} called ${currentTarget!.commonName}.`;
        }

        console.log('[Hint Generated]:', hint);

        // Stop loading animation
        setIsLoading(false);

        // NOW stream success message + hint together
        // IMPORTANT: Extra line breaks ensure hint appears clearly separated
        const successWithHintMessage = `✅ **Correct!**

${triviaQuestion.explanation}


${hint}`;

        console.log('[Streaming hint-gated response]:', successWithHintMessage);

        await streamTextToChat(
          `trivia-correct-hint-${Date.now()}`,
          successWithHintMessage,
          'assistant'
        );

        // Clear all quick replies first to remove any lingering A/B/C/D buttons
        setQuickReplies([]);

        // Small delay to ensure state updates properly
        await new Promise(resolve => setTimeout(resolve, 100));

        // Show button for next hint level (or hide if all used)
        if (newHintLevel >= 3) {
          setQuickReplies([]); // Hide button after all hints used
        } else {
          const nextLabel = newHintLevel === 1 ? 'Give Me A Second Hint' : 'Give Me A Third Hint';
          setQuickReplies([
            { id: 'hint', label: nextLabel, emoji: '💡', action: 'hint' as const }
          ]);
        }

        // Unlock carousel and clear trivia
        setIsWaitingForAnswer(false);
        setShowHintButton(true);
        setTriviaQuestion(null);
        setTriviaAttemptCount(0);

        // Clear trivia context
        setTriviaContext(null);

        toast({
          title: "Correct!",
          description: "Here's your hint!",
        });
      } else {
        // Wrong species trivia - ALSO show hint automatically after correct answer
        console.log('[Wrong Species Trivia] User answered correctly - showing hint automatically');

        // Show loading spinner IMMEDIATELY before any text
        setIsLoading(true);

        const newHintLevel = Math.min(hintLevel + 1, 3);
        setHintLevel(newHintLevel);

        const currentTarget = foodWebGamePhase === 1
          ? foodWebTargetSpecies.producer
          : foodWebGamePhase === 2
            ? foodWebTargetSpecies.herbivoreOmnivore
            : foodWebTargetSpecies.carnivore;

        // Generate hint while spinner is showing
        let hint: string = '';

        try {
          // Use different hint generation methods based on level
          if (newHintLevel === 1) {
            // Hint 1: LLM knowledge base describing physical appearance
            hint = await generateHintLevel1WithLLM(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
              },
              regionInfo!.regionName
            );
          } else if (newHintLevel === 2) {
            // Hint 2: Web search for internet descriptions
            hint = await generateHintLevel2WithWebSearch(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
              },
              regionInfo!.regionName
            );
          } else {
            // Hint 3: Vision API to analyze species image
            hint = await generateHintLevel3WithVision(
              {
                commonName: currentTarget!.commonName,
                scientificName: currentTarget!.scientificName,
                animalType: currentTarget!.animalType,
                imageUrl: currentTarget!.imageUrl || ''
              },
              regionInfo!.regionName
            );
          }
        } catch (error) {
          console.error('[Hint Generation] Error:', error);
          // Fallback hint if generation fails
          const roleDesc = getRoleDescription(foodWebGamePhase);
          hint = `🔍 **Hint ${newHintLevel}/3:** Look for a ${roleDesc} in the ${regionInfo!.regionName}. The species is a ${currentTarget!.animalType}.`;
        }

        // Ensure hint is not empty
        if (!hint || hint.trim() === '') {
          const roleDesc = getRoleDescription(foodWebGamePhase);
          hint = `🔍 **Hint ${newHintLevel}/3:** Look for a ${roleDesc} called ${currentTarget!.commonName}.`;
        }

        console.log('[Hint Generated]:', hint);

        // Stop loading animation
        setIsLoading(false);

        // Stream success message + hint together
        // IMPORTANT: Extra line breaks ensure hint appears clearly separated
        const successWithHintMessage = `✅ **Correct!**

${triviaQuestion.explanation}


${hint}`;

        console.log('[Streaming wrong-species hint response]:', successWithHintMessage);

        await streamTextToChat(
          `trivia-correct-hint-${Date.now()}`,
          successWithHintMessage,
          'assistant'
        );

        // Clear all quick replies first
        setQuickReplies([]);

        // Small delay to ensure state updates properly
        await new Promise(resolve => setTimeout(resolve, 100));

        // Show button for next hint level (or hide if all used)
        if (newHintLevel >= 3) {
          setQuickReplies([]); // Hide button after all hints used
        } else {
          const nextLabel = newHintLevel === 1 ? 'Give Me A Second Hint' : 'Give Me A Third Hint';
          setQuickReplies([
            { id: 'hint', label: nextLabel, emoji: '💡', action: 'hint' as const }
          ]);
        }

        // Unlock carousel and clear trivia
        setIsWaitingForAnswer(false);
        setShowHintButton(true);
        setTriviaQuestion(null);
        setTriviaAttemptCount(0);

        // Clear trivia context
        setTriviaContext(null);

        toast({
          title: "Correct!",
          description: "Here's your hint!",
        });
      }

    } else {
      // ❌ WRONG ANSWER - User loses this hint opportunity
      const newAttemptCount = triviaAttemptCount + 1;
      setTriviaAttemptCount(newAttemptCount);

      const wrongMessage = `❌ **Not quite.**

The correct answer is **${triviaQuestion.choices[triviaQuestion.correctAnswer]}**.

You didn't earn this hint. ${newAttemptCount < 3 ? 'Try selecting another species or press the hint button to try another trivia question.' : ''}`;

      // Stream wrong answer message
      await streamTextToChat(
        `trivia-wrong-${Date.now()}`,
        wrongMessage,
        'assistant'
      );

      // Check if auto-advance should trigger (3 trivia failures OR 3 wrong species)
      if (newAttemptCount >= 3 || revealAttemptCount >= 3) {
        console.log(`🎁 Auto-advance triggered: ${newAttemptCount} trivia failures, ${revealAttemptCount} wrong species`);

        // Auto-skip to next phase
        const currentTarget = foodWebGamePhase === 1
          ? foodWebTargetSpecies.producer
          : foodWebGamePhase === 2
            ? foodWebTargetSpecies.herbivoreOmnivore
            : foodWebTargetSpecies.carnivore;

        const skipMessage = `Let's move on. The species we're looking for is the **${currentTarget?.commonName}**. It's a ${currentTarget?.animalType} that plays an important role in this ecosystem.`;

        await streamTextToChat(
          `trivia-skip-${Date.now()}`,
          skipMessage,
          'assistant'
        );

        // Reset counters and state
        setIsWaitingForAnswer(false);
        setTriviaQuestion(null);
        setTriviaAttemptCount(0);
        setRevealAttemptCount(0);
        setShowHintButton(false);
        setHintLevel(0);

        // Add species to found list
        const newFoundSpecies = [
          ...foundFoodWebSpecies,
          {
            commonName: currentTarget!.commonName,
            scientificName: currentTarget!.scientificName,
            role: getSlotForPhase(foodWebGamePhase),
            conservationStatus: 'Unknown',
            animalType: currentTarget!.animalType
          }
        ];
        setFoundFoodWebSpecies(newFoundSpecies);

        // ✅ FIX: Also add to selectedFoodWebSpecies to show in banner
        const slot = getSlotForPhase(foodWebGamePhase);
        setSelectedFoodWebSpecies(prev => ({
          ...prev,
          [slot]: {
            ...currentTarget!,
            conservationStatus: 'Unknown'
          }
        }));

        // Advance to next phase
        if (foodWebGamePhase < 3) {
          const nextPhase = (foodWebGamePhase + 1) as 1 | 2 | 3;
          setFoodWebGamePhase(nextPhase);

          const nextTarget = nextPhase === 2
            ? foodWebTargetSpecies.herbivoreOmnivore
            : foodWebTargetSpecies.carnivore;

          const nextMessage = `Great! Now let's find a **${nextPhase === 2 ? 'herbivore or omnivore' : 'carnivore'}**.

Can you find the **${nextTarget?.commonName}**?`;

          await streamTextToChat(
            `next-phase-${Date.now()}`,
            nextMessage,
            'assistant'
          );

          setQuickReplies([
            { id: 'hint', label: 'Give Me A Hint', emoji: '💡', action: 'hint' as const }
          ]);
        } else {
          // Game complete
          setIsFoodWebGameActive(false);
          toast({
            title: "🎉 Game Complete!",
            description: "You found all 5 species!",
          });
        }

      } else {
        // User lost this hint opportunity - clear trivia and show hint button
        console.log('[Trivia Wrong] User lost hint, attempts remaining');

        // Clear trivia state
        setTriviaQuestion(null);
        setIsWaitingForAnswer(false);
        setTriviaContext(null);

        // Show hint button for next attempt
        const nextHintLabel = newAttemptCount === 1 ? 'Give Me A Second Hint' :
                              newAttemptCount === 2 ? 'Give Me A Third Hint' :
                              'Give Me A Hint';

        setQuickReplies([
          { id: 'hint', label: nextHintLabel, emoji: '💡', action: 'hint' as const }
        ]);

        const hintsRemaining = 3 - newAttemptCount;
        toast({
          title: "Hint not earned",
          description: `${hintsRemaining} hint ${hintsRemaining === 1 ? 'attempt' : 'attempts'} remaining`,
          variant: "destructive"
        });
      }
    }
  };

  // 💡 Helper: Get hint button label based on hint level
  const getHintButtonLabel = (): string => {
    switch (hintLevel) {
      case 0:
        return 'Give Me A Hint';
      case 1:
        return 'Give Me A Second Hint';
      case 2:
        return 'Give Me A Third Hint';
      default:
        return 'Give Me A Hint';
    }
  };

  // 💡 Handle Hint Click
  // Old hint handler - no longer used with education agent system
  const handleHintClick = async () => {
    console.log('⚠️ handleHintClick called but is deprecated - education agent handles hints now');
    return;
    const currentTarget = getCurrentTarget(foodWebGamePhase);

    if (!currentTarget) return;

    // 🚫 PREVENT DOUBLE TRIVIA: Don't generate hint trivia if there's already an active trivia question
    if (triviaQuestion !== null) {
      console.log('[Hint Click] Trivia already active - ignoring hint request');
      toast({
        title: "Answer the current question first",
        description: "Please answer the trivia question before requesting a hint.",
      });
      return;
    }

    // 🎓 TRIVIA GATE: If hintLevel is 0, ask trivia question first
    if (hintLevel === 0) {
      console.log('🎓 Generating trivia question to unlock hint...');

      // Show loading animation FIRST (appears in the message box where trivia will show)
      setIsLoading(true);
      setQuickReplies([]); // Clear any existing quick replies

      // Generate trivia question while loading spinner is showing
      const question = await generateTriviaQuestion({
        targetSpecies: {
          commonName: currentTarget.commonName,
          scientificName: currentTarget.scientificName,
          animalType: currentTarget.animalType,
          role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
        },
        ecoregionName: regionInfo!.regionName,
        gradeLevel: 5,
        difficulty: 'medium'
      });

      setTriviaQuestion(question);
      setTriviaContext('hint'); // Mark this as hint-gating trivia
      setTriviaAttemptCount(0);

      // Stop loading animation
      setIsLoading(false);

      // Stream COMBINED message: gate text + trivia question together in ONE message box
      const combinedMessage = `Before I give you a hint, you must answer a trivia question correctly first!

**In order to continue, you must answer this question:**

${question.question}

${question.choices.join('\n')}`;

      await streamTextToChat(
        `trivia-hint-${Date.now()}`,
        combinedMessage,
        'assistant'
      );

      // Show A/B/C/D quick replies
      setQuickReplies([
        { id: 'a', label: 'A', emoji: '🅰️', action: 'answer' as const, value: 'A' },
        { id: 'b', label: 'B', emoji: '🅱️', action: 'answer' as const, value: 'B' },
        { id: 'c', label: 'C', emoji: '🅲', action: 'answer' as const, value: 'C' },
        { id: 'd', label: 'D', emoji: '🅳', action: 'answer' as const, value: 'D' }
      ]);

      return;
    }

    // Give hint 2 or 3 (hint 1 comes from trivia gate, generated in handleTriviaAnswer)
    const newHintLevel = Math.min(hintLevel + 1, 3);
    setHintLevel(newHintLevel);

    // Show loading animation while generating hint
    setIsLoading(true);

    let hintText: string;

    // Use different hint generation methods based on level
    if (newHintLevel === 2) {
      // Hint 2: Web search for internet descriptions
      hintText = await generateHintLevel2WithWebSearch(
        {
          commonName: currentTarget.commonName,
          scientificName: currentTarget.scientificName,
          animalType: currentTarget.animalType,
          role: foodWebGamePhase === 1 ? 'producer' : foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore'
        },
        regionInfo!.regionName
      );
    } else {
      // Hint 3: Vision API to analyze species image
      hintText = await generateHintLevel3WithVision(
        {
          commonName: currentTarget.commonName,
          scientificName: currentTarget.scientificName,
          animalType: currentTarget.animalType,
          imageUrl: currentTarget.imageUrl || ''
        },
        regionInfo!.regionName
      );
    }

    // Stop loading animation
    setIsLoading(false);

    // Stream hint to chat
    await streamTextToChat(
      `hint-${Date.now()}`,
      hintText,
      'assistant'
    );

    // Update button based on hint level
    if (newHintLevel >= 3) {
      setQuickReplies([]); // Hide button after all hints used
    } else {
      // Show button for next hint level (will always be hint 3 since we're at hint 2)
      setQuickReplies([
        { id: 'hint', label: 'Give Me A Third Hint', emoji: '💡', action: 'hint' as const }
      ]);
    }
  };

  // 🎮 Food Web Game Helper Functions

  // Map phase number to slot name
  type FoodWebSlot = 'carnivore' | 'herbivore' | 'omnivore' | 'bird' | 'plantCoral';
  const getSlotForPhase = (phase: 1 | 2 | 3 | 4 | 5): FoodWebSlot => {
    const phaseMap: Record<1 | 2 | 3 | 4 | 5, FoodWebSlot> = {
      1: 'carnivore',
      2: 'herbivore',
      3: 'omnivore',
      4: 'bird',
      5: 'plantCoral'
    };
    return phaseMap[phase];
  };

  // Get human-readable role description for hints
  const getRoleDescription = (phase: 1 | 2 | 3 | 4 | 5): string => {
    const roleDescMap: Record<1 | 2 | 3 | 4 | 5, string> = {
      1: 'carnivore',
      2: 'herbivore',
      3: 'omnivore',
      4: 'bird',
      5: 'plant or coral'
    };
    return roleDescMap[phase];
  };

  // Get current target species based on phase
  const getCurrentTarget = (phase: 1 | 2 | 3 | 4 | 5) => {
    const slot = getSlotForPhase(phase);
    return foodWebTargetSpecies[slot];
  };

  // Determine which slot a species belongs to based on dietary category
  const determineSpeciesSlot = (species: RegionSpecies): FoodWebSlot | null => {
    const category = species.dietaryCategory?.toLowerCase();
    const taxonomicGroup = species.taxonomicGroup?.toLowerCase();
    const animalType = species.animalType?.toLowerCase();

    if (category === 'carnivore') {
      return 'carnivore';
    } else if (category === 'herbivore') {
      return 'herbivore';
    } else if (category === 'omnivore') {
      return 'omnivore';
    } else if (taxonomicGroup === 'birds' || animalType?.includes('bird') || animalType?.includes('aves')) {
      return 'bird';
    } else if (category === 'producer' || taxonomicGroup === 'plants & corals' || animalType?.includes('plant') || animalType?.includes('coral')) {
      return 'plantCoral';
    }

    return null; // Unknown category
  };

  // Check if all 5 slots are filled for trivia game
  const isAllSlotsFilledForTrivia = (): boolean => {
    return (
      selectedFoodWebSpecies.carnivore !== null &&
      selectedFoodWebSpecies.herbivore !== null &&
      selectedFoodWebSpecies.omnivore !== null &&
      selectedFoodWebSpecies.bird !== null &&
      selectedFoodWebSpecies.plantCoral !== null
    );
  };

  // Check if a species is already selected in any slot
  const isSpeciesSelected = (scientificName: string): boolean => {
    return (
      selectedFoodWebSpecies.carnivore?.scientificName === scientificName ||
      selectedFoodWebSpecies.herbivore?.scientificName === scientificName ||
      selectedFoodWebSpecies.omnivore?.scientificName === scientificName ||
      selectedFoodWebSpecies.bird?.scientificName === scientificName ||
      selectedFoodWebSpecies.plantCoral?.scientificName === scientificName
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

  // 🎮 STREAMING TEXT HELPER
  // ========================
  /**
   * Stream text character by character to chat history
   * Creates a typewriter effect for messages
   */
  const streamTextToChat = async (
    messageId: string,
    fullText: string,
    role: 'assistant' | 'user' = 'assistant',
    charsPerFrame: number = 1, // Characters to add per frame (1 for reading speed)
    delayMs: number = 50 // Delay between frames in milliseconds (50ms = human reading speed)
  ): Promise<void> => {
    return new Promise((resolve) => {
      let currentIndex = 0;

      // Create initial message with empty content
      const initialMessage: ChatMessage = {
        id: messageId,
        role,
        content: '',
        timestamp: new Date()
      };

      // Add empty message to chat
      setChatHistory(prev => [...prev, initialMessage]);

      // Stream text character by character
      const interval = setInterval(() => {
        currentIndex += charsPerFrame;

        if (currentIndex >= fullText.length) {
          // Finished streaming
          currentIndex = fullText.length;
          clearInterval(interval);

          // Set final complete message
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: fullText }
                : msg
            )
          );

          resolve();
        } else {
          // Update message with more characters
          const partialText = fullText.slice(0, currentIndex);
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === messageId
                ? { ...msg, content: partialText }
                : msg
            )
          );
        }
      }, delayMs);
    });
  };

  // 🎮 FOOD WEB TRIVIA GAME - AGENT ARCHITECTURE
  // =============================================
  // Intro: Forest Guardian welcome message
  // Phase 1: Producer Agent (guides to find producer species)
  //   - Transitions to Phase 2 when correct species found OR after 4th failed attempt
  // Phase 2: Herbivore Agent (guides to find herbivore/omnivore species)
  //   - Transitions to Phase 3 when correct species found OR after 4th failed attempt
  // Phase 3: Carnivore Agent (guides to find carnivore species)
  //   - Game completes when correct species found OR after 4th failed attempt

  // 🎰 Handle spin wheel complete - Sequential spins (one species at a time)
  const handleSpinComplete = (selected: RegionSpecies, phase: 1 | 2 | 3 | 4 | 5) => {
    console.log(`🎰 Spin ${phase}/5 complete! Selected:`, selected.commonName);

    // Get slot name for this phase
    const slot = getSlotForPhase(phase);

    // Update refs and state
    spinSelectedSpeciesRef.current[slot] = selected;
    setSelectedFoodWebSpecies(prev => ({
      ...prev,
      [slot]: selected
    }));
    setFoodWebTargetSpecies(prev => ({
      ...prev,
      [slot]: selected
    }));

    // Check if this was the final phase
    if (phase === 5) {
      // All 5 species selected - DONE!
      setIsSpinningWheel(false);
      setSpinPhase(1); // Reset for next game

      // 💬 Add completion message to chat (don't reveal species names!)
      const selectionComplete: ChatMessage = {
        id: `selection-complete-${Date.now()}`,
        role: 'assistant',
        content: `✅ All 5 species selected!\n\nNow let's play! I'll challenge you to find each species...`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, selectionComplete]);

      // Start the identification game
      setIsFoodWebGameActive(true);

      // Wait 2 seconds, then agent challenges user to click on a species
      setTimeout(() => {
        // Pick a random species from the 5 selected
        const allSpecies = [
          spinSelectedSpeciesRef.current.carnivore!,
          spinSelectedSpeciesRef.current.herbivore!,
          spinSelectedSpeciesRef.current.omnivore!,
          spinSelectedSpeciesRef.current.bird!,
          spinSelectedSpeciesRef.current.plantCoral!
        ];
        const randomSpecies = allSpecies[Math.floor(Math.random() * allSpecies.length)];

        setCurrentChallengeSpecies(randomSpecies);

        // Initialize education context for the game
        const foodWebContext = {
          type: 'foodweb' as const,
          displayName: 'Food Web Game',
          data: {
            ecoregionName: regionInfo?.regionName || 'Unknown',
            species: collectedSpecies.map(s => ({
              commonName: s.commonName,
              scientificName: s.scientificName,
              role: 'carnivore' as const, // Simplified for now
              conservationStatus: s.conservationStatus,
              animalType: s.animalType
            })),
            speciesCount: collectedSpecies.length,
            targetSpecies: {
              producer: null,
              herbivoreOmnivore: null,
              carnivore: {
                id: randomSpecies.id,
                commonName: randomSpecies.commonName,
                scientificName: randomSpecies.scientificName,
                animalType: randomSpecies.animalType
              }
            },
            currentPhase: 'carnivore' as const
          }
        };
        setEducationContext(foodWebContext);
        setConversationHistory([]); // Reset conversation for new challenge
        setAttemptCount(0); // Reset attempts

        // Agent challenges user - tell them which specific species to find
        const challengeMessage: ChatMessage = {
          id: `challenge-${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Find the "${randomSpecies.commonName}"!**\n\nClick on the ${randomSpecies.commonName} above!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, challengeMessage]);

        // Clear quick replies when challenging user to find species
        setQuickReplies([]);

        // Start countdown timer
        const countdownId = `countdown-${Date.now()}`;
        setCountdownMessageId(countdownId);
        setCountdownSeconds(15);

        // Add countdown message to chat
        const countdownMsg: ChatMessage = {
          id: countdownId,
          role: 'assistant',
          content: '⏱️ Time remaining: **15 seconds**',
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, countdownMsg]);
      }, 2000);
    } else {
      // More spins needed - move to next phase
      setIsSpinningWheel(false);
      setTimeout(() => {
        setSpinPhase((phase + 1) as 1 | 2 | 3 | 4 | 5);
        setIsSpinningWheel(true);
      }, 800); // Pause to see the selected species
    }
  };

  // 🎮 Handle banner card click - Identification game
  const handleBannerCardClick = (species: any, slotType: string) => {
    console.log('🎮 Banner card clicked:', species.commonName);

    // Check if we have a challenge species (game active)
    if (!currentChallengeSpecies) return;

    // Clear countdown timer and remove countdown message
    setCountdownSeconds(null);
    if (countdownMessageId) {
      setChatHistory(prev => prev.filter(msg => msg.id !== countdownMessageId));
      setCountdownMessageId(null);
    }

    const isCorrect = species.scientificName === currentChallengeSpecies.scientificName;

    if (isCorrect) {
      // ✅ CORRECT! Collect the species
      setCorrectAnswerFeedback(species.scientificName);

      // Add to collected species (total collection)
      setCollectedSpecies(prev => [...prev, species]);

      // Also set as current carousel species so it shows immediately on right panel
      setSelectedCarouselSpecies(species);

      // Celebrate message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `🎉 **Correct!** You found it!\n\nSpecies added to your collection!`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, successMessage]);

      // Clear quick replies when species found
      setQuickReplies([]);

      // Check if we've collected 3 species
      const newCollectedCount = collectedSpecies.length + 1; // +1 because state hasn't updated yet

      setTimeout(() => {
        setCorrectAnswerFeedback(null);
        setCurrentChallengeSpecies(null);

        if (newCollectedCount >= 3) {
          // 🎊 GAME COMPLETE! 3 species collected
          const completeMessage: ChatMessage = {
            id: `game-complete-${Date.now()}`,
            role: 'assistant',
            content: `🎊 **Amazing!** You've collected 3 species!\n\nYou're ready to battle the villain!`,
            timestamp: new Date(),
            status: 'sent'
          };
          setChatHistory(prev => [...prev, completeMessage]);

          // Add "Battle Poopy Pants" button in chat
          setQuickReplies([
            { id: 'play-food-web-game', label: 'Battle Poopy Pants', emoji: '⚔️', action: 'play-food-web-game' as const }
          ]);
        } else {
          // Continue game - respin for new species
          const respinMessage: ChatMessage = {
            id: `respin-${Date.now()}`,
            role: 'assistant',
            content: `Let's get 5 new species...`,
            timestamp: new Date(),
            status: 'sent'
          };
          setChatHistory(prev => [...prev, respinMessage]);

          // Auto-respin after 1 second
          setTimeout(() => {
            handlePlayTrivia(); // This triggers the spin
          }, 1000);
        }
      }, 2000);
    } else {
      // ❌ WRONG! Ask education agent for help
      setWrongAnswerFeedback(species.scientificName);
      setAttemptCount(prev => prev + 1); // Track attempts for progressive hints

      // Add user's action to conversation
      const userMessage = `I clicked on the ${species.commonName}`;
      setConversationHistory(prev => [...prev, { role: 'user', content: userMessage }]);

      // Show user's message in chat
      const userChatMessage: ChatMessage = {
        id: `user-click-${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, userChatMessage]);

      // Show loading state
      setIsLoading(true);

      // Create empty message that will be streamed into
      const agentMessageId = `agent-${Date.now()}`;
      const agentMessage: ChatMessage = {
        id: agentMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setChatHistory(prev => [...prev, agentMessage]);

      // Ask the education agent for trivia question
      setTimeout(async () => {
        setWrongAnswerFeedback(null);

        try {
          await sendEducationMessage(
            userMessage,
            educationContext,
            conversationHistory,
            (chunk) => {
              // Stream text chunk by chunk into chat
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === agentMessageId
                    ? { ...msg, content: msg.content + chunk }
                    : msg
                )
              );
            },
            () => {
              // Complete - stop loading
              setIsLoading(false);

              // Add agent's response to conversation history
              const lastMessage = chatHistory.find(msg => msg.id === agentMessageId);
              if (lastMessage) {
                setConversationHistory(prev => [...prev, { role: 'assistant', content: lastMessage.content }]);
              }
            },
            (error) => {
              // Error - stop loading and show error
              setIsLoading(false);
              console.error('Education agent error:', error);
              setChatHistory(prev =>
                prev.map(msg =>
                  msg.id === agentMessageId
                    ? { ...msg, content: '❌ Sorry, I encountered an error. Please try again.', status: 'error' }
                    : msg
                )
              );
            }
          );
        } catch (error) {
          setIsLoading(false);
          console.error('Failed to send message to education agent:', error);
        }
      }, 1000);
    }
  };


  // Handle starting the trivia game
  const handlePlayTrivia = async () => {
    console.log('🎰 Spin Species Wheel clicked!');

    // Prevent double-clicking while AI is selecting or wheel is spinning
    if (isAISelecting || isSpinningWheel) {
      console.log('🎰 Already in progress - ignoring click', { isAISelecting, isSpinningWheel });
      return;
    }

    setIsAISelecting(true);

    // Step 1: Clear any pre-selected species (starting fresh)
    setSelectedFoodWebSpecies({
      carnivore: null,
      herbivore: null,
      omnivore: null,
      bird: null,
      plantCoral: null
    });
    setFoundFoodWebSpecies([]);
    setFoodWebGamePhase(1);

    // Reset reveal mechanic state
    setSelectedSpeciesForReveal(null);
    setIsSpeciesRevealed(false);
    setRevealAttemptCount(0);
    setIsCarouselLocked(false);

    // Reset education agent state
    setEducationContext(null);
    setConversationHistory([]);
    setAttemptCount(0);

    // Don't clear selected carousel species if we're in the middle of the identification game
    // Only clear it on the very first spin (when chat history is empty)
    if (!isChatHistoryExpanded) {
      setSelectedCarouselSpecies(null);
    }

    // 💬 Show chat input and history when spin starts
    setIsChatHistoryExpanded(true);

    // Add spin message to chat history (append, don't replace)
    const spinMessage: ChatMessage = {
      id: `spin-${Date.now()}`,
      role: 'assistant',
      content: `🎰 Selecting 5 new species...`,
      timestamp: new Date(),
      status: 'sent'
    };

    // Only replace chat history if it's empty (first time), otherwise append
    setChatHistory(prev => prev.length === 0 ? [spinMessage] : [...prev, spinMessage]);

    console.log('💬 Spin message added to chat');

    // Step 2: Check if carousel has species
    if (!regionInfo?.regionName) {
      console.error('No region info available');
      return;
    }

    if (regionSpecies.length === 0) {
      toast({
        title: "Error",
        description: "No species available in carousel. Select a region first!",
        variant: "destructive"
      });
      return;
    }

    // 🤖 Step 3: AI selects species intelligently
    console.log('🤖 Calling AI to select species...');
    try {
      const aiSelection = await selectSpeciesWithAI(regionSpecies, regionInfo.regionName);

      console.log('🤖 AI selected:', {
        carnivore: aiSelection.carnivore?.commonName,
        herbivore: aiSelection.herbivore?.commonName,
        omnivore: aiSelection.omnivore?.commonName,
        bird: aiSelection.bird?.commonName,
        plantCoral: aiSelection.plantCoral?.commonName,
        strategy: aiSelection.strategy
      });

      // Store AI selections in ref for carousel to use
      spinSelectedSpeciesRef.current = {
        carnivore: aiSelection.carnivore,
        herbivore: aiSelection.herbivore,
        omnivore: aiSelection.omnivore,
        bird: aiSelection.bird,
        plantCoral: aiSelection.plantCoral
      };

      // Add AI's explanation to chat
      const aiMessage: ChatMessage = {
        id: `ai-selection-${Date.now()}`,
        role: 'assistant',
        content: `🎯 **Selection Strategy**: ${aiSelection.strategy}\n\n${aiSelection.explanation}\n\nWatch as I reveal each species...`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, aiMessage]);

      // 🎰 Start sequential spin animation (Phase 1: Carnivore)
      console.log('🎰 Starting sequential spin wheel animation...');
      console.log('🎰 Region species count:', regionSpecies.length);
      console.log('🎰 Setting isSpinningWheel to TRUE');
      setIsAISelecting(false); // AI done
      setSpinPhase(1); // Start with carnivore
      setIsSpinningWheel(true);
    } catch (error) {
      console.error('🤖 AI selection failed:', error);
      setIsAISelecting(false); // AI failed
      toast({
        title: "Error",
        description: "Failed to select species. Please try again.",
        variant: "destructive"
      });
    }
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

  // Handle back to globe - reusable function
  const handleBackToGlobe = () => {
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
    setSelectedFoodWebSpecies({ carnivore: null, herbivore: null, omnivore: null, bird: null, plantCoral: null });
    setChatHistory([]); // Clear chat history too
    setResetGlobeView(true);
    setTimeout(() => setResetGlobeView(false), 100);

    toast({
      title: 'Back to Globe 🌍',
      description: 'Returning to world view...',
    });
  };

  // Handle reset chat - clears conversation but keeps species selected
  const handleResetChat = () => {
    setChatHistory([]);
    setQuickReplies([]);
    setLastTriviaAnswer(null);

    toast({
      title: 'Chat Reset',
      description: 'Starting fresh conversation...',
    });
  };

  // Side panels need to be well below all top elements
  // Top buttons end at 64px (16px top + 48px height)
  // Food Web banner starts at 72px and is variable height
  // Set panels at 84px to ensure clearance below buttons
  const sidePanelTopPx = 84;

  // 🔍 DEBUG: Log when side panel positioning might be affected
  useEffect(() => {
    const hasAnySpeciesSelected = Object.values(selectedFoodWebSpecies).some(s => s !== null);
    console.log('📐 LAYOUT STATE CHANGED:', {
      sidePanelTopPx,
      hasFoodWebBanner: hasAnySpeciesSelected,
      selectedFoodWebSpecies: Object.keys(selectedFoodWebSpecies).reduce((acc, key) => {
        acc[key] = selectedFoodWebSpecies[key as keyof typeof selectedFoodWebSpecies] ? 'FILLED' : 'EMPTY';
        return acc;
      }, {} as Record<string, string>),
      hasChatHistory: chatHistory.length > 0,
      isChatHistoryExpanded,
      hasRightPanel: !!(selectedCarouselSpecies || speciesInfo || currentHabitat || expandedImage || selectedWildlifePark || (isViewingEcoRegion && regionInfo)),
      hasLeftPanel: !!(regionInfo && regionSpecies.length > 0) || !!(currentHabitat && currentHabitat.keySpecies),
    });

    // Log top element positions
    setTimeout(() => {
      const globalHealth = document.querySelector('.fixed.top-4.left-1\\/2');
      const foodWebBanner = globalHealth?.querySelector('.glass-panel');
      const chatInput = document.querySelector('form');

      console.log('📐 ELEMENT POSITIONS:', {
        globalHealthBar: globalHealth?.getBoundingClientRect(),
        foodWebBanner: foodWebBanner?.getBoundingClientRect(),
        chatInput: chatInput?.getBoundingClientRect(),
      });
    }, 100);
  }, [selectedFoodWebSpecies, chatHistory.length, isChatHistoryExpanded, selectedCarouselSpecies, speciesInfo, currentHabitat, expandedImage, selectedWildlifePark, isViewingEcoRegion, regionInfo, regionSpecies.length]);

  // 🔍 DEBUG: Monitor right panel position
  useEffect(() => {
    if (rightPanelRef.current) {
      const rect = rightPanelRef.current.getBoundingClientRect();
      console.log('➡️ RIGHT PANEL RENDERED:', {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        width: rect.width,
        sidePanelTopPx,
        actualStyleTop: rightPanelRef.current.style.top,
      });
    }
  }, [selectedCarouselSpecies, speciesInfo, currentHabitat, expandedImage, selectedWildlifePark, isViewingEcoRegion, regionInfo]);

  // 🔍 DEBUG: Monitor left panel position
  useEffect(() => {
    if (leftPanelRef.current) {
      const rect = leftPanelRef.current.getBoundingClientRect();
      console.log('⬅️ LEFT PANEL RENDERED:', {
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        width: rect.width,
        actualStyleTop: leftPanelRef.current.style.top,
      });
    }
  }, [regionInfo, regionSpecies.length, currentHabitat]);

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

  // Compute chat context based on what's showing (food web or right side)
  const chatContext = useMemo((): ChatContext => {
    // Priority 1: Food Web (ONLY if all 5 species selected)
    const foodWebCount = [selectedFoodWebSpecies.carnivore, selectedFoodWebSpecies.herbivore, selectedFoodWebSpecies.omnivore, selectedFoodWebSpecies.bird, selectedFoodWebSpecies.plantCoral].filter(Boolean).length;
    if (foodWebCount === 5 && regionInfo && chatHistory.length > 0) {
      const speciesNames = [
        selectedFoodWebSpecies.carnivore?.commonName,
        selectedFoodWebSpecies.herbivore?.commonName,
        selectedFoodWebSpecies.omnivore?.commonName,
        selectedFoodWebSpecies.bird?.commonName,
        selectedFoodWebSpecies.plantCoral?.commonName
      ].filter(Boolean).join(', ');

      return {
        type: 'region-species', // Reuse existing type for compatibility
        name: `Food Web`,
        details: `${speciesNames} - Ask about the species, their interactions, or ecosystem`
      };
    }

    // Priority 2: Wildlife Park
    if (selectedWildlifePark) {
      return {
        type: 'wildlife-park',
        name: selectedWildlifePark.name,
        details: selectedWildlifePark.address
      };
    }

    // Priority 3: Expanded Image
    if (expandedImage) {
      return {
        type: expandedImage.type === 'threat' ? 'threat' : 'ecosystem',
        name: currentSpecies || currentHabitat?.name || 'this habitat',
        details: expandedImage.type === 'threat' ? 'Environmental Threat' : 'Ecosystem Connection'
      };
    }

    // Priority 4: Carousel Species
    if (selectedCarouselSpecies) {
      return {
        type: 'region-species',
        name: selectedCarouselSpecies.commonName,
        details: regionInfo?.regionName
      };
    }

    // Priority 5: Hardcoded Species
    if (speciesInfo) {
      return {
        type: 'species',
        name: speciesInfo.commonName,
        details: speciesInfo.animalType
      };
    }

    // Priority 6: Habitat
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
  }, [selectedWildlifePark, expandedImage, selectedCarouselSpecies, speciesInfo, currentHabitat, currentSpecies, regionInfo, selectedFoodWebSpecies, chatHistory.length]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {/* User Profile (Top-Right) */}
      <UserProfile />

      {/* Globe or Google Maps */}
      <div className="fixed inset-0 z-0" style={{ width: '100vw', height: '100vh' }}>
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

      {/* Region Species Carousel - Left side of screen */}
      {regionInfo && regionSpecies.length > 0 && !currentHabitat && (
        <div
          ref={leftPanelRef}
          className="absolute left-4 w-64 z-[60] pointer-events-auto"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)' }}
        >
          {/* 📜 Species Carousel - Always show (works for both normal and game mode) */}
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
            disableAutoScroll={true}
            isSpinning={isSpinningWheel}
            spinPhase={spinPhase}
            onSpinComplete={handleSpinComplete}
            preSelectedSpecies={spinSelectedSpeciesRef.current}
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
        <div
          ref={rightPanelRef}
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
          <EcoRegionCard
            regionName={regionInfo.regionName}
            description={regionInfo.description}
            speciesCount={regionSpecies.length}
            locationCount={wildlifePlaces.length + protectedAreas.length}
            imageUrl={regionInfo.imageUrl}
          />

        </div>
      ) : selectedWildlifePark ? (
        <div
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
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
        </div>
      ) : expandedImage ? (
        <div
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
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
        </div>
      ) : selectedCarouselSpecies ? (
        <div
          ref={rightPanelRef}
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
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
            isGameMode={isChatHistoryExpanded && Object.values(foodWebTargetSpecies).some(t => t !== null)}
            hideFacts={!isSpeciesRevealed && selectedSpeciesForReveal !== null}
            onRevealClick={handleRevealSpecies}
          />

          {/* Species Collection Counter - only show during identification game */}
          {collectedSpecies.length > 0 && useGoogleMaps && (
            <div className="glass-panel rounded-xl p-3 shadow-lg text-center">
              <p className="text-sm font-bold text-foreground">
                Collected Species: {collectedSpecies.length}/3
              </p>
            </div>
          )}

          {/* Reset Chat Button - Shows when food web trivia is active */}
          {chatHistory.length > 0 && (
            <Button
              onClick={handleResetChat}
              className="glass-panel w-full h-11 text-sm font-medium hover:bg-white/10"
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Chat
            </Button>
          )}
        </div>
      ) : speciesInfo ? (
        <div
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
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
      ) : currentHabitat ? (
        <div
          className="absolute right-0 w-80 z-[60] pointer-events-auto flex flex-col gap-3 pr-4"
          style={{ top: `${sidePanelTopPx}px`, maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}
        >
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
      ) : null}

      {/* Back to Globe Button - Top Left */}
      {useGoogleMaps && (
        <div className="fixed top-4 left-4 z-[100] pointer-events-auto">
          <Button
            onClick={handleBackToGlobe}
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12 px-4 flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Globe</span>
          </Button>
        </div>
      )}

      {/* Global Health Bar - Top Center */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-auto items-center">
        <GlobalHealthBar />

        {/* 🎮 Food Web Selection Bar - Under Health Bar */}
        {useGoogleMaps && (
          <>
            <FoodWebSelectionBar
              selectedSpecies={selectedFoodWebSpecies}
              onSpeciesClick={handleBannerCardClick}
              isClickable={currentChallengeSpecies !== null}
              correctAnswer={correctAnswerFeedback || undefined}
              wrongAnswer={wrongAnswerFeedback || undefined}
              theme={chatTheme}
            />
          </>
        )}
      </div>

      {/* Chat History and Input with Reset Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[1250px] flex flex-col items-center gap-3 pointer-events-none pb-2">
        {/* Active Layers Chip */}
        {activeLayers.length > 0 && (
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">
              {activeLayers.map(l => `${l.name}: ${l.count}`).join(' • ')}
            </span>
          </div>
        )}

        {/* Search Loader - Shows for initial load OR background fetches, but NOT in chat mode */}
        {!isChatHistoryExpanded && (
          <SearchLoader
            isLoading={isLoading || isBackgroundLoading}
            message={
              isBackgroundLoading ? "Finding nearby wildlife locations..." :
              currentSpecies ? "Fetching wildlife data..." :
              "Discovering habitat..."
            }
          />
        )}

        {/* Terminal UI - Show when game is active or chat has messages */}
        {useGoogleMaps && (isFoodWebGameActive || chatHistory.length > 0) && (
          <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
            <div className="w-full max-w-[650px] flex flex-col">
              {/* Chat History - shows above input when expanded */}
              {chatHistory.length > 0 && (
                <ChatHistory
                  messages={chatHistory}
                  isExpanded={isChatHistoryExpanded}
                  onMinimize={() => setIsChatHistoryExpanded(false)}
                  isTyping={isLoading || isInitializing}
                  onRetry={handleRetryMessage}
                  quickReplies={quickReplies}
                  onQuickReply={handleQuickReply}
                  theme={chatTheme}
                />
              )}

              <ChatInput
                onSubmit={handleSearch}
                isLoading={isLoading}
                context={chatContext}
                theme={chatTheme}
                placeholder="Describe what you see or type 'hint'..."
                hasMessages={chatHistory.length > 0}
                onExpandHistory={!isChatHistoryExpanded ? () => setIsChatHistoryExpanded(true) : undefined}
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
          </div>
        )}

        {/* Reset Button */}
        {(habitats.length > 0 || userPins.length > 0 || speciesInfo || currentHabitat) && (
          <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
            <Button
              onClick={handleReset}
              variant="secondary"
              size="icon"
              className="glass-panel rounded-xl h-12 w-12 shrink-0 mb-2 hover:bg-secondary/80"
              title="Reset view"
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {/* Info Card - Different messages for 3D Globe vs 2D Map */}
      {!hasInteracted && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="glass-panel rounded-2xl px-8 py-4 max-w-lg text-center animate-float">
            {!useGoogleMaps ? (
              // 3D Globe view
              <p className="text-muted-foreground">
                🌍 <span className="text-accent font-medium">Click on any ecoregion pin</span> to explore wildlife and habitats
              </p>
            ) : (
              // 2D Map view
              <p className="text-muted-foreground">
                🗺️ <span className="text-accent font-medium">Select species</span> from the carousel to learn more
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
