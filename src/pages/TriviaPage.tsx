import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { EcoRegionCard } from '@/components/EcoRegionCard';
import { FoodWebSelectionBar } from '@/components/FoodWebSelectionBar';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { sendEducationMessage } from '@/services/educationAgent';
import { markWhackAMoleComplete, isEcoRegionCompleted, markPixelGameComplete } from '@/utils/ecoRegionProgress';
import { WhackAMoleGameModal } from '@/components/WhackAMoleGameModal';
import confetti from 'canvas-confetti';
import type { RegionSpecies } from '@/services/regionService';

interface TriviaPageLocationState {
  ecoRegionId: string;
  regionName: string;
  parkId: string;
  parkName: string;
  chatHistory: ChatMessage[];
  selectedFoodWebSpecies: {
    carnivore: any;
    herbivore: any;
    omnivore: any;
    bird: any;
    plantCoral: any;
  };
  regionSpecies: RegionSpecies[];
}

const TriviaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  // Get state from navigation
  const state = location.state as TriviaPageLocationState;

  // Initialize from state or redirect if missing
  useEffect(() => {
    if (!state?.ecoRegionId || !state?.regionName) {
      console.error('Missing required state for TriviaPage');
      navigate('/');
    }
  }, [state, navigate]);

  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(state?.chatHistory || []);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(false);

  // Food web game state
  const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState(state?.selectedFoodWebSpecies || {
    carnivore: null,
    herbivore: null,
    omnivore: null,
    bird: null,
    plantCoral: null
  });
  const [isFoodWebGameActive, setIsFoodWebGameActive] = useState(false);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);

  // Challenge game state
  const [currentChallengeSpecies, setCurrentChallengeSpecies] = useState<RegionSpecies | null>(null);
  const [correctAnswerFeedback, setCorrectAnswerFeedback] = useState<string | null>(null);
  const [wrongAnswerFeedback, setWrongAnswerFeedback] = useState<string | null>(null);
  const [collectedSpecies, setCollectedSpecies] = useState<RegionSpecies[]>([]);

  // Mini-game state
  const [showWhackAMole, setShowWhackAMole] = useState(false);
  const [whackAMoleConfig, setWhackAMoleConfig] = useState<any>(null);

  // Species data
  const [regionSpecies, setRegionSpecies] = useState<RegionSpecies[]>(state?.regionSpecies || []);
  const [currentSpeciesIndex, setCurrentSpeciesIndex] = useState(0);
  const [isInitializing, setIsInitializing] = useState(false);

  // Spin wheel state
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [spinPhase, setSpinPhase] = useState<1|2|3|4|5>(1);
  const [isAISelecting, setIsAISelecting] = useState(false);
  const spinSelectedSpeciesRef = useRef<any>(null);

  // Debug: Log species data
  useEffect(() => {
    console.log('🔍 TriviaPage - regionSpecies:', regionSpecies);
    console.log('🔍 TriviaPage - regionSpecies.length:', regionSpecies?.length);
    console.log('🔍 TriviaPage - state?.regionSpecies:', state?.regionSpecies);
  }, [regionSpecies, state?.regionSpecies]);

  // Streaming refs
  const streamingBufferRef = useRef<{ fullResponse: string; displayedResponse: string }>({
    fullResponse: '',
    displayedResponse: ''
  });
  const characterIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 🎭 Initial greeting with guardian blind dialogue
  useEffect(() => {
    // Only run if chat is empty and we have a region
    // Species will be loaded asynchronously, greeting can show before species load
    if (chatHistory.length > 0 || !state?.regionName) return;

    console.log('🎭 Starting food web trivia with blind guardian...');

    const initializeFoodWebGame = async () => {
      try {
        setIsInitializing(true);
        setIsChatHistoryExpanded(false);

        // Wait for species to load if not yet available
        if (regionSpecies.length === 0) {
          console.log('⏳ Waiting for species to load...');
          // Will retry when regionSpecies updates
          setIsInitializing(false);
          return;
        }

        // Pick 1 random species for the mascot
        const randomSpecies = regionSpecies[Math.floor(Math.random() * regionSpecies.length)];
        console.log('🎨 Selected mascot species:', randomSpecies.commonName);

        // Generate cartoon via MCP (if imageUrl exists, use it; otherwise generate)
        let mascotImage = randomSpecies.imageUrl;
        let asciiArt = '';

        if (!mascotImage) {
          const { generateCartoonAscii } = await import('@/services/mcpClient');
          const cartoonResult = await generateCartoonAscii({
            commonName: randomSpecies.commonName,
            scientificName: randomSpecies.scientificName,
            animalType: randomSpecies.animalType || undefined,
            width: 40
          });

          if (cartoonResult.success) {
            mascotImage = cartoonResult.cartoonUrl;
            asciiArt = cartoonResult.asciiArt || '';
          }
        }

        // Generate fun nickname
        const funNames = [
          'Hoppy', 'Junior', 'Spaz', 'Buddy', 'Champ', 'Scout',
          'Lucky', 'Dash', 'Zippy', 'Sunny', 'Flash', 'Pepper'
        ];
        const nickname = funNames[Math.floor(Math.random() * funNames.length)];

        // Show mascot character sheet
        const useDalleImage = mascotImage && Math.random() < 0.5;
        const characterSheet = useDalleImage
          ? `🎨 **${state.regionName} Mascot**

![${randomSpecies.commonName}](${mascotImage})

**📋 Character Sheet**
**Name:** ${nickname}
**Species:** ${randomSpecies.commonName}
**Type:** ${randomSpecies.animalType || 'Unknown'}
${randomSpecies.conservationStatus ? `**Status:** ${randomSpecies.conservationStatus}` : ''}`
          : `🎨 **${state.regionName} Mascot**

\`\`\`
${asciiArt || randomSpecies.commonName}
\`\`\`

**📋 Character Sheet**
**Name:** ${nickname}
**Species:** ${randomSpecies.commonName}
**Type:** ${randomSpecies.animalType || 'Unknown'}
${randomSpecies.conservationStatus ? `**Status:** ${randomSpecies.conservationStatus}` : ''}`;

        const characterMsg: ChatMessage = {
          id: `character-${Date.now()}`,
          role: 'assistant',
          content: characterSheet,
          timestamp: new Date(),
          status: 'sent'
        };

        setChatHistory([characterMsg]);

        // Wait then show guardian blind dialogue
        await new Promise(resolve => setTimeout(resolve, 1500));

        const { CHARACTER_DIALOGUES, getRandomDialogue } = await import('@/config/gameCharacters');
        const guardianDialogue = getRandomDialogue(
          CHARACTER_DIALOGUES.guardian.regionEntry,
          { regionName: state.regionName }
        );

        const guardianMsg: ChatMessage = {
          id: `guardian-${Date.now()}-${Math.random()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          status: 'sent'
        };

        setChatHistory(prev => [...prev, guardianMsg]);

        // Stream guardian dialogue
        for (let i = 0; i < guardianDialogue.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 30));
          setChatHistory(prev =>
            prev.map(msg =>
              msg.id === guardianMsg.id ? { ...msg, content: guardianDialogue.slice(0, i + 1) } : msg
            )
          );
        }

        // Wait a moment, then show quick reply button
        await new Promise(resolve => setTimeout(resolve, 800));

        // Show "Help Find Species" button
        setQuickReplies([
          {
            id: 'help-find-species',
            label: '🔍 Help Find Ecoregion Species',
            emoji: '🔍',
            action: 'help-find-species' as const
          }
        ]);

        setIsInitializing(false);
      } catch (error) {
        console.error('❌ Initialization failed:', error);
        setIsInitializing(false);

        // Fallback simple greeting
        const { CHARACTER_DIALOGUES, getRandomDialogue } = await import('@/config/gameCharacters');
        const guardianDialogue = getRandomDialogue(
          CHARACTER_DIALOGUES.guardian.regionEntry,
          { regionName: state.regionName }
        );

        setChatHistory([{
          id: `fallback-${Date.now()}`,
          role: 'assistant',
          content: guardianDialogue,
          timestamp: new Date(),
          status: 'sent'
        }]);
      }
    };

    initializeFoodWebGame();
  }, [state?.regionName, chatHistory.length, regionSpecies.length]);

  // 🎮 Handle return from Pixel Game
  useEffect(() => {
    const pixelGameWon = searchParams.get('pixelGameWon');
    const pixelGameLost = searchParams.get('pixelGameLost');
    const returnedEcoRegionId = searchParams.get('ecoRegionId');

    if (pixelGameWon === 'true' && returnedEcoRegionId) {
      setSearchParams({});

      // Add success message to chat
      const successMessage: ChatMessage = {
        id: `pixel-success-${Date.now()}`,
        role: 'assistant',
        content: '🎉 Amazing work! You escaped the toxic wasteland! Now for the final challenge...',
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, successMessage]);

      // Show "Battle Poopy Pants" button
      setQuickReplies([
        {
          id: 'battle-poopy-pants',
          label: 'Battle Poopy Pants',
          emoji: '💩',
          action: 'battle-poopy-pants' as const
        }
      ]);

      toast({
        title: "🎯 Final Boss!",
        description: "Ready to face Poopy Pants?",
      });
    } else if (pixelGameLost === 'true') {
      setSearchParams({});

      const lostMessage: ChatMessage = {
        id: `pixel-lost-${Date.now()}`,
        role: 'assistant',
        content: '😔 The toxic waste got you! Let\'s start fresh from the beginning.',
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, lostMessage]);

      // Navigate back to globe after 2 seconds
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);

      toast({
        title: "🔄 Starting Over",
        description: "Return to the globe to try again",
        variant: "destructive"
      });
    }
  }, [searchParams, setSearchParams, toast, navigate]);

  // 🎮 Handle return from Whack-A-Mole
  useEffect(() => {
    const whackAMoleWon = searchParams.get('whackAMoleWon');
    const returnedEcoRegionId = searchParams.get('ecoRegionId');

    if (whackAMoleWon === 'true' && returnedEcoRegionId) {
      setSearchParams({});

      // Mark as complete
      markWhackAMoleComplete(returnedEcoRegionId);

      // Add victory message
      const victoryMessage: ChatMessage = {
        id: `whackamole-victory-${Date.now()}`,
        role: 'assistant',
        content: '🎊 INCREDIBLE! You defeated Poopy Pants and saved the eco-region! Let me wrap things up...',
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, victoryMessage]);

      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Show AI wrap-up after 2 seconds
      setTimeout(() => {
        addAIWrapUp(returnedEcoRegionId);
      }, 2000);
    }
  }, [searchParams, setSearchParams]);

  // 🤖 AI Wrap-up after completing all 3 games
  const addAIWrapUp = async (ecoRegionId: string) => {
    const wrapUpMessageId = `wrapup-${Date.now()}`;
    const wrapUpMessage: ChatMessage = {
      id: wrapUpMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, wrapUpMessage]);

    // Stream wrap-up message
    const wrapUpText = `🌍 Congratulations, Guardian! You've completed all three challenges in ${state?.regionName}:

✅ Food Web Mastery - You identified the delicate balance of predator and prey
✅ Toxic Waste Escape - You navigated the dangers threatening this habitat
✅ Final Battle Victory - You defeated the forces of pollution

Your journey has made a real difference. The eco-region is now protected, and its species can thrive! 🌿

Return to the globe to see your completed region marked with a red pin 📍`;

    let charIndex = 0;
    const interval = setInterval(() => {
      if (charIndex < wrapUpText.length) {
        const nextChar = wrapUpText[charIndex];
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === wrapUpMessageId
              ? { ...msg, content: msg.content + nextChar }
              : msg
          )
        );
        charIndex++;
      } else {
        clearInterval(interval);

        // Show "Return to Globe" button
        setQuickReplies([
          {
            id: 'return-to-globe',
            label: 'Return to Globe',
            emoji: '🌍',
            action: 'return-to-globe' as const
          }
        ]);
      }
    }, 30);
  };

  // Handle chat input
  const handleSearch = async (query: string) => {
    if (!query.trim() || isLoading) return;

    // Add user message
    const userMessageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: query,
      timestamp: new Date(),
      status: 'sending'
    };
    setChatHistory(prev => [...prev, userMessage]);

    // Create placeholder assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };
    setChatHistory(prev => [...prev, assistantMessage]);

    // Character-by-character streaming
    streamingBufferRef.current = { fullResponse: '', displayedResponse: '' };
    characterIntervalRef.current = setInterval(() => {
      const { fullResponse, displayedResponse } = streamingBufferRef.current;

      if (displayedResponse.length < fullResponse.length) {
        streamingBufferRef.current.displayedResponse = fullResponse.substring(0, displayedResponse.length + 1);
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: streamingBufferRef.current.displayedResponse }
              : msg
          )
        );
      }
    }, 30);

    // Build education context for food web
    const foodWebSpecies = Object.values(state?.selectedFoodWebSpecies || {}).filter(Boolean);
    const educationContext = foodWebSpecies.length === 5 ? {
      type: 'foodweb' as const,
      species: foodWebSpecies.map(s => ({
        commonName: s.common_name,
        scientificName: s.scientific_name,
        trophicLevel: s.trophicLevel,
        diet: s.diet,
        habitat: s.habitat,
      })),
      regionName: state?.regionName
    } : null;

    // Call education agent
    sendEducationMessage(
      query,
      educationContext,
      chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
      (chunk: string) => {
        streamingBufferRef.current.fullResponse += chunk;
      },
      () => {
        // Success - clear interval and update status
        if (characterIntervalRef.current) clearInterval(characterIntervalRef.current);
        setChatHistory(prev =>
          prev.map(msg =>
            msg.id === userMessageId
              ? { ...msg, status: 'sent' as const }
              : msg
          )
        );
      },
      (error: Error) => {
        // Error
        if (characterIntervalRef.current) clearInterval(characterIntervalRef.current);
        console.error('Education agent error:', error);
        setChatHistory(prev =>
          prev.map(msg => {
            if (msg.id === userMessageId) {
              return { ...msg, status: 'error' as const, errorMessage: 'Failed to send message' };
            }
            return msg;
          })
        );
      }
    );
  };

  // Handle play trivia - AI selects species and starts spin wheel
  const handlePlayTrivia = async () => {
    console.log('🎰 Help Find Species clicked!');

    // Prevent double-clicking
    if (isAISelecting || isSpinningWheel) {
      console.log('🎰 Already in progress - ignoring click');
      return;
    }

    setIsAISelecting(true);
    // Quick replies already cleared by button click handler

    // Reset food web species and game state
    setSelectedFoodWebSpecies({
      carnivore: null,
      herbivore: null,
      omnivore: null,
      bird: null,
      plantCoral: null
    });
    setCurrentChallengeSpecies(null);
    setCorrectAnswerFeedback(null);
    setWrongAnswerFeedback(null);

    // Add spin message to chat
    const spinMessage: ChatMessage = {
      id: `spin-${Date.now()}`,
      role: 'assistant',
      content: '🎰 Selecting 5 species for the food web...',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, spinMessage]);

    console.log('💬 Spin message added to chat');

    // Call AI to select species
    console.log('🤖 Calling AI to select species...');
    try {
      const { selectSpeciesWithAI } = await import('@/services/educationAgent');
      const aiSelection = await selectSpeciesWithAI(regionSpecies, state.regionName);

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

      // Start spin wheel animation
      console.log('🎰 Starting spin wheel animation...');
      setIsAISelecting(false);
      setSpinPhase(1); // Start with carnivore
      setIsSpinningWheel(true);
    } catch (error) {
      console.error('🤖 AI selection failed:', error);
      setIsAISelecting(false);
      toast({
        title: "Error",
        description: "Failed to select species. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle spin wheel phase completion
  const handleSpinComplete = (selectedSpecies: RegionSpecies, phase: 1|2|3|4|5) => {
    console.log(`🎰 Phase ${phase} complete:`, selectedSpecies.commonName);

    // Update food web selection based on phase
    if (phase === 1) {
      setSelectedFoodWebSpecies(prev => ({ ...prev, carnivore: selectedSpecies }));
    } else if (phase === 2) {
      setSelectedFoodWebSpecies(prev => ({ ...prev, herbivore: selectedSpecies }));
    } else if (phase === 3) {
      setSelectedFoodWebSpecies(prev => ({ ...prev, omnivore: selectedSpecies }));
    } else if (phase === 4) {
      setSelectedFoodWebSpecies(prev => ({ ...prev, bird: selectedSpecies }));
    } else if (phase === 5) {
      setSelectedFoodWebSpecies(prev => ({ ...prev, plantCoral: selectedSpecies }));
    }

    // Move to next phase or finish
    if (phase < 5) {
      console.log(`🎰 Moving to phase ${phase + 1}`);
      setSpinPhase((phase + 1) as 1|2|3|4|5);
    } else {
      // All phases complete - start identification game
      console.log('🎰 All phases complete! Starting identification game...');
      setIsSpinningWheel(false);

      // Add completion message
      const selectionComplete: ChatMessage = {
        id: `selection-complete-${Date.now()}`,
        role: 'assistant',
        content: '✅ All 5 species selected!\n\nNow let\'s play! I\'ll challenge you to find each species...',
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, selectionComplete]);

      // Start the identification game after 2 seconds
      setTimeout(() => {
        setIsFoodWebGameActive(true);

        // Pick a random species from the 5 selected
        const allSpecies = [
          spinSelectedSpeciesRef.current.carnivore,
          spinSelectedSpeciesRef.current.herbivore,
          spinSelectedSpeciesRef.current.omnivore,
          spinSelectedSpeciesRef.current.bird,
          spinSelectedSpeciesRef.current.plantCoral
        ].filter(Boolean);

        const randomSpecies = allSpecies[Math.floor(Math.random() * allSpecies.length)];
        setCurrentChallengeSpecies(randomSpecies);

        // Challenge user to click the species in the banner
        const challengeMessage: ChatMessage = {
          id: `challenge-${Date.now()}`,
          role: 'assistant',
          content: `🎯 **Find the "${randomSpecies.commonName}"!**\n\nClick on the ${randomSpecies.commonName} above in the food web banner!`,
          timestamp: new Date(),
          status: 'sent'
        };
        setChatHistory(prev => [...prev, challengeMessage]);

        // Clear quick replies
        setQuickReplies([]);
      }, 2000);
    }
  };

  // Handle banner card click - Identification game
  const handleBannerCardClick = (species: RegionSpecies, slotType: string) => {
    console.log('🎮 Banner card clicked:', species.commonName);

    // Check if we have a challenge species (game active)
    if (!currentChallengeSpecies) return;

    const isCorrect = species.scientificName === currentChallengeSpecies.scientificName;

    if (isCorrect) {
      // ✅ CORRECT! Collect the species
      setCorrectAnswerFeedback(species.scientificName);

      // Add to collected species
      setCollectedSpecies(prev => [...prev, species]);

      // Celebrate message
      const successMessage: ChatMessage = {
        id: `success-${Date.now()}`,
        role: 'assistant',
        content: `🎉 **Correct!** You found it!\n\nSpecies added to your collection!`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, successMessage]);

      // Clear quick replies
      setQuickReplies([]);

      // Check if we've collected 3 species
      const newCollectedCount = collectedSpecies.length + 1;

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

          // Add "Play Poopy Minion Escape" button
          setQuickReplies([
            { id: 'play-poopy-minion', label: 'Play Poopy Minion Escape', emoji: '🤖', action: 'play-poopy-minion' as const }
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
      // ❌ WRONG! Give feedback
      setWrongAnswerFeedback(species.scientificName);

      const wrongMessage: ChatMessage = {
        id: `wrong-${Date.now()}`,
        role: 'assistant',
        content: `❌ Not quite! That's the ${species.commonName}, but I'm looking for the **${currentChallengeSpecies.commonName}**.\n\nTry again!`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, wrongMessage]);

      // Clear wrong feedback after 2 seconds
      setTimeout(() => {
        setWrongAnswerFeedback(null);
      }, 2000);
    }
  };

  // Handle quick reply clicks
  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'help-find-species') {
      // Clear button and collapse chat for smooth transition
      setQuickReplies([]);
      setIsChatHistoryExpanded(false);

      // Start the spin wheel game after collapse animation
      setTimeout(() => {
        handlePlayTrivia();
      }, 400);
    } else if (reply.action === 'play-poopy-minion') {
      // Navigate to pixel game
      setQuickReplies([]);

      const lastFoundSpecies = Object.values(state.selectedFoodWebSpecies).filter(Boolean).pop();
      if (lastFoundSpecies) {
        const params = new URLSearchParams({
          ecoRegionId: state.ecoRegionId,
          animalType: lastFoundSpecies.trophicLevel || 'guardian',
          animalName: lastFoundSpecies.common_name || state.regionName,
          biomeType: 'toxic-waste',
        });
        navigate(`/pixel-game?${params.toString()}`);
      }
    } else if (reply.action === 'battle-poopy-pants') {
      // Launch Whack-A-Mole game
      setQuickReplies([]);

      const config = {
        ecoRegionId: state.ecoRegionId,
        animalType: 'guardian',
        animalName: state.regionName,
        biomeType: 'bathroom'
      };

      setWhackAMoleConfig(config);
      setShowWhackAMole(true);
    } else if (reply.action === 'return-to-globe') {
      // Navigate back to globe with completion flag
      navigate(`/?completed=${state.ecoRegionId}`, { replace: true });
    } else {
      // Regular chat message
      handleSearch(reply.label);
    }
  };

  // Handle Whack-A-Mole completion
  const handleWhackAMoleComplete = (ecoRegionId: string) => {
    setShowWhackAMole(false);

    // Navigate back to this page with success flag
    navigate(`/trivia?whackAMoleWon=true&ecoRegionId=${ecoRegionId}`, {
      state,
      replace: true
    });
  };

  // Handle Whack-A-Mole loss
  const handleWhackAMoleLose = (ecoRegionId: string) => {
    setShowWhackAMole(false);

    // Add loss message
    const lossMessage: ChatMessage = {
      id: `whackamole-loss-${Date.now()}`,
      role: 'assistant',
      content: '💔 Poopy Pants got away! But don\'t worry, you can try again!',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, lossMessage]);

    // Show retry button
    setQuickReplies([
      {
        id: 'battle-poopy-pants-retry',
        label: 'Try Again',
        emoji: '🔄',
        action: 'battle-poopy-pants' as const
      }
    ]);
  };

  const handleRetryMessage = (messageId: string) => {
    const message = chatHistory.find(msg => msg.id === messageId);
    if (!message || message.role !== 'user') return;

    setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
    handleSearch(message.content);
  };

  const handleCarouselSpeciesSelect = (species: RegionSpecies) => {
    setSelectedCarouselSpecies(species);
  };

  const handlePreviousSpecies = () => {
    setCurrentSpeciesIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextSpecies = () => {
    setCurrentSpeciesIndex(prev => Math.min(regionSpecies.length - 1, prev + 1));
  };

  const handleBackToPark = () => {
    const params = new URLSearchParams({
      ecoRegionId: state.ecoRegionId,
      regionName: state.regionName,
      lat: '0', // Will be set from eco-region data
      lng: '0',
    });
    navigate(`/park-select?${params.toString()}`);
  };

  const chatContext = useMemo((): ChatContext => ({
    type: 'foodweb',
    regionName: state?.regionName || 'Unknown Region',
    speciesName: undefined,
    habitatName: undefined
  }), [state?.regionName]);

  if (!state) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/trivia-bg.avif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header Bar - Top */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex justify-between items-center px-4 py-2">
          {/* Back to Park - Far Left */}
          <Button
            onClick={handleBackToPark}
            variant="outline"
            className="bg-white/90 hover:bg-white"
          >
            ← Back to Park
          </Button>

          {/* Global Health Bar - Center */}
          <div className="flex-1 flex justify-center">
            <GlobalHealthBar />
          </div>

          {/* Sign In - Far Right */}
          <Button
            variant="outline"
            className="bg-white/90 hover:bg-white"
          >
            Sign In
          </Button>
        </div>
      </div>

      {/* Food Web Selection Bar - Below Header */}
      <div className="absolute top-16 left-0 right-0 z-40 pointer-events-auto flex justify-center">
        <FoodWebSelectionBar
          selectedSpecies={selectedFoodWebSpecies}
          onSpeciesClick={handleBannerCardClick}
          isClickable={isFoodWebGameActive && currentChallengeSpecies !== null}
          correctAnswer={correctAnswerFeedback || undefined}
          wrongAnswer={wrongAnswerFeedback || undefined}
        />
      </div>

      {/* Left Side - Species Carousel */}
      {regionSpecies && regionSpecies.length > 0 && (
        <div className="absolute left-4 top-32 bottom-24 w-64 z-30 pointer-events-auto">
          <RegionSpeciesCarousel
            species={regionSpecies}
            regionName={state.regionName}
            currentSpecies={selectedCarouselSpecies?.scientificName || regionSpecies[currentSpeciesIndex]?.scientificName}
            onSpeciesSelect={handleCarouselSpeciesSelect}
            selectedForGameSpecies={Object.values(selectedFoodWebSpecies)
              .filter(s => s !== null)
              .map(s => s!.scientificName)}
            disableAutoScroll={isSpinningWheel}
            isSpinning={isSpinningWheel}
            spinPhase={spinPhase}
            onSpinComplete={handleSpinComplete}
            preSelectedSpecies={spinSelectedSpeciesRef.current}
          />
        </div>
      )}

      {/* Right Side - Eco-Region Card */}
      <div className="absolute right-4 top-32 w-80 z-30 pointer-events-auto">
        <EcoRegionCard
          regionName={state.regionName}
          description={`Protected area in ${state.parkName}`}
          imageUrl={null}
          climate="Varies"
          threats={[]}
          speciesCount={regionSpecies.length}
          onClose={() => {}}
        />
      </div>

      {/* Bottom - Chat (using Index.tsx.backup pattern) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[1250px] flex flex-col items-center gap-3 pointer-events-none pb-2">
        <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
          <div className="w-full max-w-[650px] flex flex-col">
            {/* Chat History - shows above input when expanded */}
            {chatHistory.length > 0 && (
              <ChatHistory
                messages={chatHistory}
                quickReplies={quickReplies}
                onQuickReply={handleQuickReplyClick}
                isExpanded={isChatHistoryExpanded}
                onMinimize={() => setIsChatHistoryExpanded(false)}
                onRetry={handleRetryMessage}
              />
            )}

            {/* Chat Input */}
            <ChatInput
              onSubmit={handleSearch}
              isLoading={isLoading}
              context={chatContext}
              placeholder="Ask about the food web or species..."
              hasMessages={chatHistory.length > 0}
              onExpandHistory={() => setIsChatHistoryExpanded(true)}
            />
          </div>
        </div>
      </div>

      {/* Whack-A-Mole Modal */}
      {showWhackAMole && whackAMoleConfig && (
        <WhackAMoleGameModal
          isOpen={showWhackAMole}
          onClose={() => setShowWhackAMole(false)}
          config={whackAMoleConfig}
          onComplete={handleWhackAMoleComplete}
          onLose={handleWhackAMoleLose}
        />
      )}
    </div>
  );
};

export default TriviaPage;
