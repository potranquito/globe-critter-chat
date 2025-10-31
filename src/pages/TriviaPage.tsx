import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { RegionSpecies } from '@/services/regionService';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import ChatInput, { ChatTheme } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
import { ScatteredSpeciesImages } from '@/components/ScatteredSpeciesImages';
import { useLearningSession } from '@/hooks/useLearningSession';
import { useParkStars } from '@/hooks/useParkStars';
import { getPhaseDisplayName, getPhaseEmoji, getNextPhase, type LearningPhase } from '@/types/learning';
import { generateColorTheme, generateFastVisualDescription } from '@/services/mcpClient';
import confetti from 'canvas-confetti';

interface TriviaPageLocationState {
  ecoRegionId: string;
  regionName: string;
  parkId: string;
  parkName: string;
  lat: number;
  lng: number;
  regionSpecies: RegionSpecies[];
  parkData: any;
}

type PagePhase = 'learning' | 'trivia';

// Question configs matching 3-phase learning
const QUESTION_CONFIGS = [
  {
    number: 1,
    difficulty: 'easy' as const,
    question: "Which one is the **plant species**?",
    phase: 'plants' as const,
  },
  {
    number: 2,
    difficulty: 'medium' as const,
    question: "Which is the **bird species**?",
    phase: 'birds' as const,
  },
  {
    number: 3,
    difficulty: 'hard' as const,
    question: "Which is the **top predator**?",
    phase: 'predators' as const,
  }
];

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
 * Get conservation status full name
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
 * Get species subtype (flower, tree, mammal, bird, etc.)
 */
function getSpeciesSubtype(species: RegionSpecies): string {
  const animalType = species.animalType?.toLowerCase() || '';
  const speciesType = species.speciesType?.toLowerCase() || '';

  if (speciesType === 'plant' || species.dietaryCategory === 'Producer') {
    if (animalType.includes('tree') || species.commonName?.toLowerCase().includes('tree')) return 'tree';
    if (animalType.includes('flower') || species.commonName?.toLowerCase().includes('flower')) return 'flower';
    if (animalType.includes('bush') || animalType.includes('shrub')) return 'bush';
    if (animalType.includes('grass')) return 'grass';
    if (animalType.includes('moss')) return 'moss';
    if (animalType.includes('lichen')) return 'lichen';
    return 'plant';
  }

  if (speciesType === 'bird' || animalType.includes('bird')) return 'bird';
  if (speciesType === 'mammal' || animalType.includes('mammal')) return 'mammal';
  if (speciesType === 'reptile' || animalType.includes('reptile')) return 'reptile';
  if (speciesType === 'amphibian' || animalType.includes('amphibian')) return 'amphibian';
  if (speciesType === 'fish' || animalType.includes('fish')) return 'fish';
  if (speciesType === 'insect' || animalType.includes('insect')) return 'insect';

  return animalType || speciesType || 'organism';
}

const TriviaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { addStar } = useParkStars();

  const state = location.state as TriviaPageLocationState;

  // Page phase state
  const [currentPhase, setCurrentPhase] = useState<PagePhase>('learning');

  // Learning phase state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(true);
  const [selectedCarouselSpecies, setSelectedCarouselSpecies] = useState<RegionSpecies | null>(null);
  const [learningFilters, setLearningFilters] = useState<string[]>([]);
  const [learningSessionCount, setLearningSessionCount] = useState(0);
  const [isSpeciesStreamingInProgress, setIsSpeciesStreamingInProgress] = useState(false);

  // Learning session hook
  const learningSession = useLearningSession(state?.parkId || '', state?.parkName || '');

  // Refs for learning
  const taughtSpeciesRef = useRef<any[]>([]);
  const shownSpeciesRef = useRef<string[]>([]);
  const streamingIntervalsRef = useRef<NodeJS.Timeout[]>([]);
  const streamingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const currentPhaseRef = useRef<LearningPhase>('plants');

  // Chameleon theme
  const [chatTheme, setChatTheme] = useState<ChatTheme>({
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  });

  // Trivia phase state
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [correctSpeciesForCurrentQuestion, setCorrectSpeciesForCurrentQuestion] = useState<RegionSpecies | null>(null);
  const [isWaitingForNextQuestion, setIsWaitingForNextQuestion] = useState(false);
  const [gameResults, setGameResults] = useState<Array<{
    questionNumber: number;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }>>([]);
  const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState<any>({
    carnivore: null,
    herbivore: null,
    omnivore: null,
    bird: null,
    plantCoral: null
  });
  const [correctAnswerFeedback, setCorrectAnswerFeedback] = useState<string | null>(null);
  const [wrongAnswerFeedback, setWrongAnswerFeedback] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  // Park-specific species (filtered from region species)
  const [parkSpecies, setParkSpecies] = useState<RegionSpecies[]>([]);

  // Redirect if missing state
  useEffect(() => {
    console.log('🏞️ TriviaPage state:', state);
    if (!state?.parkId || !state?.regionName) {
      console.error('❌ Missing required state for TriviaPage');
      navigate('/');
    } else {
      console.log('✅ TriviaPage loaded with:', {
        parkName: state.parkName,
        regionName: state.regionName,
        speciesCount: state.regionSpecies?.length
      });
    }
  }, [state, navigate]);

  // Load park-specific species
  useEffect(() => {
    console.log('🔍 Species loading check:', {
      hasRegionSpecies: !!state?.regionSpecies,
      regionSpeciesCount: state?.regionSpecies?.length || 0,
      parkName: state?.parkName,
      stateKeys: state ? Object.keys(state) : []
    });

    if (!state?.parkName) {
      console.log('❌ No park name, skipping species load');
      return;
    }

    if (!state?.regionSpecies || state.regionSpecies.length === 0) {
      console.log('❌ No region species available');
      return;
    }

    // TODO: In future, query species by park from database
    // For now, use all region species (will be filtered during learning)
    console.log('✅ Loading species for park:', state.parkName, '- Count:', state.regionSpecies.length);
    setParkSpecies(state.regionSpecies);
  }, [state?.regionSpecies, state?.parkName]);

  // Generate color theme
  useEffect(() => {
    if (!state?.regionName) return;

    const loadTheme = async () => {
      try {
        const themeResult = await generateColorTheme({ ecoregionName: state.regionName });
        if (themeResult.success && themeResult.theme) {
          setChatTheme(themeResult.theme);
        }
      } catch (error) {
        console.error('Failed to generate theme:', error);
      }
    };

    loadTheme();
  }, [state?.regionName]);

  // Show welcome message when learning starts
  useEffect(() => {
    // Don't show welcome until species are loaded
    if (parkSpecies.length === 0 && state?.regionSpecies?.length > 0) {
      console.log('⏳ Waiting for species to load...');
      return;
    }

    console.log('👋 Welcome message check:', {
      currentPhase,
      chatHistoryLength: chatHistory.length,
      parkSpeciesLength: parkSpecies.length,
      parkName: state?.parkName,
      regionSpecies: state?.regionSpecies?.length,
      shouldShow: currentPhase === 'learning' && parkSpecies.length > 0
    });

    if (currentPhase === 'learning' && parkSpecies.length > 0 && chatHistory.length === 0) {
      console.log('✅ Showing welcome message with Start Learning button');

      const welcomeMessage: ChatMessage = {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `🌍 Welcome to **${state.parkName}** in the **${state.regionName}** eco-region!\n\nI'm your learning guide. We'll explore this park together through a 3-phase learning journey:\n\n🌿 **Phase 1:** Plants (5 species)\n🦅 **Phase 2:** Birds (5 species)\n🦁 **Phase 3:** Predators (5 species)\n\nAfter learning about 15 species, you'll take a trivia quiz to test your knowledge!\n\nReady to begin?`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory([welcomeMessage]);

      setQuickReplies([
        {
          id: 'start-learning',
          label: '🎓 Start Learning',
          emoji: '🎓',
          action: 'start-learning' as const
        },
        {
          id: 'go-back',
          label: '🔙 Go Back',
          emoji: '🔙',
          action: 'go-back' as const
        }
      ]);
    }
  }, [currentPhase, chatHistory.length, parkSpecies.length, state?.parkName, state?.regionName, state?.regionSpecies?.length]);

  // Timer countdown for trivia
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  // Handle time out
  const handleTimeOut = () => {
    const timeoutMessage: ChatMessage = {
      id: `timeout-${Date.now()}`,
      role: 'assistant',
      content: '⏰ **Time\'s up!** Returning to learning mode...',
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, timeoutMessage]);

    toast({
      title: "⏰ Time's Up!",
      description: "Returning to learning mode",
      variant: "destructive"
    });

    setTimeout(() => {
      setCurrentPhase('learning');
      setIsGameActive(false);
    }, 2000);
  };

  // Start learning mode
  const startLearningMode = () => {
    setQuickReplies([]);
    learningSession.resetSession();
    taughtSpeciesRef.current = [];
    shownSpeciesRef.current = [];
    currentPhaseRef.current = 'plants';
    setLearningSessionCount(0);

    const phaseFilters = getFiltersForPhase('plants');
    setLearningFilters(phaseFilters);

    const startMessage: ChatMessage = {
      id: `learning-start-${Date.now()}`,
      role: 'assistant',
      content: `🎓 **3-Phase Learning Mode Activated!**\n\n🌿 Starting with Plants...\n\nLet me find some species for you to learn about!`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, startMessage]);

    setTimeout(() => selectRandomSpecies(phaseFilters, 0, []), 1500);
  };

  // Select random species for learning
  const selectRandomSpecies = (filtersToUse?: string[], sessionCount?: number, alreadyShown?: string[]) => {
    if (isSpeciesStreamingInProgress) {
      console.log('⏳ Species streaming in progress');
      return;
    }

    const activeFilters = filtersToUse !== undefined ? filtersToUse : learningFilters;
    const shownSpecies = alreadyShown !== undefined ? alreadyShown : shownSpeciesRef.current;

    const filteredSpecies = getFilteredSpeciesWithFilters(activeFilters);
    const availableSpecies = filteredSpecies.filter(s => !shownSpecies.includes(s.scientificName));

    if (availableSpecies.length === 0) {
      console.log('⚠️ No more species available');
      return;
    }

    const previousCount = sessionCount !== undefined ? sessionCount : learningSessionCount;
    const currentSessionNumber = previousCount + 1;
    setLearningSessionCount(currentSessionNumber);

    if (currentSessionNumber > 5) {
      if (learningSession.isAllPhasesComplete()) {
        showTriviaReadyMessage();
        return;
      }

      showPhaseCompleteMessage();
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableSpecies.length);
    const species = availableSpecies[randomIndex];

    setIsSpeciesStreamingInProgress(true);
    learningSession.addTaughtSpecies(species);
    taughtSpeciesRef.current.push({
      id: species.id,
      scientificName: species.scientificName,
      commonName: species.commonName,
      imageUrl: species.imageUrl,
      phase: learningSession.currentPhase
    });

    shownSpeciesRef.current = [...shownSpecies, species.scientificName];
    setSelectedCarouselSpecies(species);

    streamSpeciesEducation(species, currentSessionNumber, activeFilters);
  };

  // Stream species education
  const streamSpeciesEducation = async (species: RegionSpecies, sessionNumber: number, activeFilters: string[]) => {
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

    setTimeout(async () => {
      const speciesSubtype = getSpeciesSubtype(species);
      const conservationStatus = getConservationStatusFullName(species.conservationStatus);

      const infoLines = [
        `**${species.commonName} - Species ${sessionNumber}/5**`,
        '',
        `**Type:** ${speciesSubtype}`,
        `**Conservation Status:** ${conservationStatus}`
      ];

      if (species.habitatInfo) infoLines.push(`**Habitat:** ${species.habitatInfo}`);
      if (species.isInvasive) infoLines.push('**⚠️ Invasive Species**');
      if (species.isVenomous) infoLines.push('**☠️ Venomous**');

      infoLines.push('', '**Visual Description:** ');

      const baseInfo = '\n\n' + infoLines.join('\n');

      let currentText = '';
      let charIndex = 0;
      const streamInterval = setInterval(() => {
        if (charIndex >= baseInfo.length) {
          clearInterval(streamInterval);
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
      streamingIntervalsRef.current.push(streamInterval);

      const fetchAndStreamDescription = async () => {
        try {
          const descResult = await generateFastVisualDescription({
            scientificName: species.scientificName,
            commonName: species.commonName,
            animalType: species.animalType,
            imageUrl: species.imageUrl,
            ecoregion: state.regionName
          });

          const finalText = descResult.success ? descResult.description || 'Description not available.' : 'Description not available.';

          let descText = '';
          let descIndex = 0;
          const descInterval = setInterval(() => {
            if (descIndex >= finalText.length) {
              clearInterval(descInterval);

              const nextSpeciesTimeout = setTimeout(() => {
                setIsSpeciesStreamingInProgress(false);
                selectRandomSpecies(activeFilters, sessionNumber, shownSpeciesRef.current);
              }, 1500);
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
          streamingIntervalsRef.current.push(descInterval);
        } catch (error) {
          console.error('Description fetch failed:', error);
          setIsSpeciesStreamingInProgress(false);
          setTimeout(() => selectRandomSpecies(activeFilters, sessionNumber, shownSpeciesRef.current), 1500);
        }
      };
    }, 1000);
  };

  // Show phase complete message
  const showPhaseCompleteMessage = () => {
    const currentPhaseDisplay = getPhaseDisplayName(currentPhaseRef.current);
    const completionMessage: ChatMessage = {
      id: `phase-complete-${Date.now()}`,
      role: 'assistant',
      content: `🎉 **Phase Complete!**\n\nYou've learned about 5 ${currentPhaseDisplay.toLowerCase()} species. Ready for the next phase?`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, completionMessage]);

    setQuickReplies([
      {
        id: 'continue-next-phase',
        label: 'Continue',
        emoji: '▶️',
        action: 'continue-next-phase' as const
      }
    ]);
  };

  // Show trivia ready message
  const showTriviaReadyMessage = () => {
    const congratsMessage: ChatMessage = {
      id: `all-complete-${Date.now()}`,
      role: 'assistant',
      content: `🎉 **Congratulations!**\n\nYou've completed all 3 learning phases!\n\n✅ Plants (5 species)\n✅ Birds (5 species)\n✅ Predators (5 species)\n\nReady to test your knowledge?`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, congratsMessage]);

    setQuickReplies([
      {
        id: 'start-trivia-game',
        label: 'Play Trivia',
        emoji: '🎮',
        action: 'start-trivia-game' as const
      }
    ]);
  };

  // Handle continue to next phase
  const handleContinueNextPhase = () => {
    setQuickReplies([]);

    const currentPhase = currentPhaseRef.current;
    const nextPhase = getNextPhase(currentPhase);

    if (nextPhase) {
      currentPhaseRef.current = nextPhase;
      const newFilters = getFiltersForPhase(nextPhase);
      setLearningFilters(newFilters);
      learningSession.advanceToNextPhase();
      setLearningSessionCount(0);
      shownSpeciesRef.current = [];

      const phaseEmoji = getPhaseEmoji(nextPhase);
      const phaseName = getPhaseDisplayName(nextPhase);

      const transitionMessage: ChatMessage = {
        id: `phase-transition-${Date.now()}`,
        role: 'assistant',
        content: `${phaseEmoji} **Starting ${phaseName} Phase!**\n\nLet's explore 5 ${phaseName.toLowerCase()} species...`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, transitionMessage]);

      setTimeout(() => selectRandomSpecies(newFilters, 0, []), 1000);
    }
  };

  // Filter species with filters
  const getFilteredSpeciesWithFilters = (filters: string[]) => {
    if (filters.length === 0) return parkSpecies;
    if (filters.includes('all')) return parkSpecies;

    return parkSpecies.filter(species => {
      return filters.every(filter => {
        const filterLower = filter.toLowerCase();
        const animalType = (species.animalType || '').toLowerCase();
        const dietaryCategory = (species.dietaryCategory || '').toLowerCase();

        if (filterLower === 'bird') return species.speciesType?.toLowerCase() === 'bird' || animalType.includes('bird');
        if (filterLower === 'plant') return animalType.includes('plant') || species.speciesType?.toLowerCase() === 'plant';
        if (filterLower === 'carnivore-diet') return dietaryCategory.includes('carnivore');
        if (filterLower === 'herbivore-diet') return dietaryCategory.includes('herbivore');
        if (filterLower === 'producer-diet') return dietaryCategory.includes('producer');

        return true;
      });
    });
  };

  // Start trivia game
  const startTriviaGame = () => {
    setCurrentPhase('trivia');
    setIsGameActive(true);
    setCurrentQuestionIndex(0);
    setGameResults([]);
    setChatHistory([]);
    setQuickReplies([]);

    loadTriviaQuestion(0);
  };

  // Load trivia question
  const loadTriviaQuestion = (questionIndex: number) => {
    const questionConfig = QUESTION_CONFIGS[questionIndex];
    const phaseSpecies = taughtSpeciesRef.current.filter(s => s.phase === questionConfig.phase);

    if (phaseSpecies.length === 0) {
      console.error('No species for phase:', questionConfig.phase);
      return;
    }

    // Pick correct answer from taught species
    const correctSpecies = phaseSpecies[Math.floor(Math.random() * phaseSpecies.length)];
    setCorrectSpeciesForCurrentQuestion(correctSpecies);

    // Pick 4 wrong answers from same phase
    const allPhaseSpecies = getFilteredSpeciesWithFilters(getFiltersForPhase(questionConfig.phase));
    const wrongSpecies = allPhaseSpecies
      .filter(s => s.scientificName !== correctSpecies.scientificName)
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    // Set scattered species
    setSelectedFoodWebSpecies({
      carnivore: correctSpecies,
      herbivore: wrongSpecies[0] || correctSpecies,
      omnivore: wrongSpecies[1] || correctSpecies,
      bird: wrongSpecies[2] || correctSpecies,
      plantCoral: wrongSpecies[3] || correctSpecies
    });

    const questionMessage: ChatMessage = {
      id: `question-${Date.now()}`,
      role: 'assistant',
      content: `🎮 **Question ${questionConfig.number}** (${questionConfig.difficulty}):\n\n${questionConfig.question}`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory([questionMessage]);

    setTimeRemaining(30);
    setTimerActive(true);
  };

  // Handle scattered species click
  const handleScatteredSpeciesClick = (species: RegionSpecies) => {
    if (!isGameActive || isWaitingForNextQuestion || !correctSpeciesForCurrentQuestion) return;

    const isCorrect = species.scientificName === correctSpeciesForCurrentQuestion.scientificName;
    const questionConfig = QUESTION_CONFIGS[currentQuestionIndex];

    if (isCorrect) {
      setCorrectAnswerFeedback(species.scientificName);
      addStar(state.parkId, state.parkName);

      const correctMessage: ChatMessage = {
        id: `correct-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Correct!** That's ${species.commonName}! ⭐ +1 Star`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, correctMessage]);
    } else {
      setWrongAnswerFeedback(species.scientificName);

      const wrongMessage: ChatMessage = {
        id: `wrong-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Wrong!** The correct answer was **${correctSpeciesForCurrentQuestion.commonName}**.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, wrongMessage]);
    }

    const newResult = {
      questionNumber: questionConfig.number,
      question: questionConfig.question,
      userAnswer: species.commonName,
      correctAnswer: correctSpeciesForCurrentQuestion.commonName,
      isCorrect
    };

    setGameResults(prev => [...prev, newResult]);
    setIsWaitingForNextQuestion(true);
    setTimerActive(false);

    setTimeout(() => {
      setCorrectAnswerFeedback(null);
      setWrongAnswerFeedback(null);
      setIsWaitingForNextQuestion(false);

      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (nextIndex >= QUESTION_CONFIGS.length) {
        finishTriviaGame();
      } else {
        loadTriviaQuestion(nextIndex);
      }
    }, isCorrect ? 1000 : 2000);
  };

  // Finish trivia game
  const finishTriviaGame = () => {
    setIsGameActive(false);
    setTimerActive(false);

    const correctCount = gameResults.filter(r => r.isCorrect).length;

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    const completionMessage: ChatMessage = {
      id: `complete-${Date.now()}`,
      role: 'assistant',
      content: `🎉 **Game Complete!**\n\nYou answered ${correctCount} out of ${gameResults.length} questions correctly!\n\nReturning to park discovery...`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, completionMessage]);

    setTimeout(() => {
      const params = new URLSearchParams({
        ecoRegionId: state.ecoRegionId,
        regionName: state.regionName,
        lat: state.lat?.toString() || '0',
        lng: state.lng?.toString() || '0',
      });
      navigate(`/park-select?${params.toString()}`);
    }, 3000);
  };

  // Handle quick reply
  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'start-learning') {
      startLearningMode();
    } else if (reply.action === 'go-back') {
      const params = new URLSearchParams({
        ecoRegionId: state.ecoRegionId,
        regionName: state.regionName,
        lat: state.lat?.toString() || '0',
        lng: state.lng?.toString() || '0',
      });
      navigate(`/park-select?${params.toString()}`);
    } else if (reply.action === 'continue-next-phase') {
      handleContinueNextPhase();
    } else if (reply.action === 'start-trivia-game') {
      startTriviaGame();
    }
  };

  // Handle chat submit
  const handleChatSubmit = async (query: string) => {
    // Simple response for now
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, userMessage]);
  };

  const handleCarouselSpeciesSelect = (species: RegionSpecies) => {
    setSelectedCarouselSpecies(species);
  };

  if (!state) {
    console.log('⚠️ No state, returning null');
    return null;
  }

  console.log('🎨 Rendering TriviaPage', { currentPhase, parkSpeciesCount: parkSpecies.length });

  // Select background image based on region
  const getBackgroundImage = () => {
    const regionLower = state?.regionName?.toLowerCase() || '';

    if (regionLower.includes('arctic')) {
      return '/images/arctic-trivia-bg.jpg';
    } else if (regionLower.includes('congo')) {
      return '/images/congo-basin-trivia-bg.png';
    } else if (regionLower.includes('madagascar')) {
      return '/images/madagascar-trivia-bg.png';
    } else if (regionLower.includes('borneo')) {
      return '/images/borneo-trivia-bg.png';
    }

    return '/images/trivia-bg.avif';
  };

  const backgroundImage = getBackgroundImage();

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex justify-between items-center px-4 py-2 gap-4">
          <Button
            onClick={() => {
              const params = new URLSearchParams({
                ecoRegionId: state.ecoRegionId,
                regionName: state.regionName,
                lat: state.lat?.toString() || '0',
                lng: state.lng?.toString() || '0',
              });
              navigate(`/park-select?${params.toString()}`);
            }}
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12"
          >
            ← Back to Park
          </Button>

          {currentPhase === 'trivia' && (
            <div className="flex-1 flex justify-center">
              <div className="glass-panel rounded-xl h-12 px-6 flex items-center gap-2">
                <span className="text-2xl">⏱️</span>
                <span className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          )}

          <Button variant="outline" className="glass-panel hover:bg-accent rounded-xl h-12">
            Sign In
          </Button>
        </div>
      </div>

      {/* Learning Phase: Species Carousel */}
      {currentPhase === 'learning' && parkSpecies.length > 0 && (
        <div className="absolute left-4 top-32 bottom-24 w-64 z-30 pointer-events-auto">
          <RegionSpeciesCarousel
            species={parkSpecies}
            regionName={state.parkName}
            currentSpecies={selectedCarouselSpecies?.scientificName}
            onSpeciesSelect={handleCarouselSpeciesSelect}
            disableAutoScroll={false}
          />
        </div>
      )}

      {/* Trivia Phase: Scattered Species Images */}
      {currentPhase === 'trivia' && (
        <ScatteredSpeciesImages
          species={selectedFoodWebSpecies}
          onSpeciesClick={handleScatteredSpeciesClick}
          isClickable={isGameActive && !isWaitingForNextQuestion}
          correctAnswer={correctAnswerFeedback || undefined}
          wrongAnswer={wrongAnswerFeedback || undefined}
          questionKey={currentQuestionIndex}
        />
      )}

      {/* Bottom Chat */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[1250px] flex flex-col items-center gap-3 pointer-events-none pb-2">
        <div className="flex justify-center items-end gap-3 w-full pointer-events-auto">
          <div className="w-full max-w-[650px] flex flex-col">
            {chatHistory.length > 0 && (
              <ChatHistory
                messages={chatHistory}
                quickReplies={quickReplies}
                onQuickReply={handleQuickReplyClick}
                isExpanded={isChatHistoryExpanded}
                onMinimize={() => setIsChatHistoryExpanded(false)}
                theme={chatTheme}
              />
            )}

            <ChatInput
              onSubmit={handleChatSubmit}
              isLoading={false}
              context={{
                type: 'default',
                name: state?.parkName || 'Park'
              }}
              placeholder={currentPhase === 'learning' ? "Ask about species..." : ""}
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

export default TriviaPage;
