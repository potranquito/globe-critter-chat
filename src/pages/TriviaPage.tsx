import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import ChatInput, { ChatContext } from '@/components/ChatInput';
import ChatHistory, { ChatMessage } from '@/components/ChatHistory';
import { QuickReply } from '@/components/QuickReplies';
import { RegionSpeciesCarousel } from '@/components/RegionSpeciesCarousel';
import { EcoRegionCard } from '@/components/EcoRegionCard';
import { ScatteredSpeciesImages } from '@/components/ScatteredSpeciesImages';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { sendEducationMessage, selectTriviaSpeciesWithAI } from '@/services/educationAgent';
import { markWhackAMoleComplete, isEcoRegionCompleted, markPixelGameComplete } from '@/utils/ecoRegionProgress';
import { WhackAMoleGameModal } from '@/components/WhackAMoleGameModal';
import confetti from 'canvas-confetti';
import type { RegionSpecies } from '@/services/regionService';
import type { TaughtSpecies } from '@/types/learning';
import { useParkStars } from '@/hooks/useParkStars';

interface TriviaPageLocationState {
  ecoRegionId: string;
  regionName: string;
  parkId: string;
  parkName: string;
  lat: number;
  lng: number;
  chatHistory: ChatMessage[];
  selectedFoodWebSpecies: {
    carnivore: any;
    herbivore: any;
    omnivore: any;
    bird: any;
    plantCoral: any;
  };
  regionSpecies: RegionSpecies[];
  taughtSpecies?: TaughtSpecies[]; // Species taught during 3-phase learning
}

// Question configs - matches 3-phase learning system (Plants → Birds → Predators)
const QUESTION_CONFIGS = [
  {
    number: 1,
    difficulty: 'easy' as const,
    question: "Which one is the **plant species**?",
    phase: 'plants' as const,
    requiredCorrectType: 'plant',
    selectionStrategy: 'plant_and_animals'
  },
  {
    number: 2,
    difficulty: 'medium' as const,
    question: "Which is the **bird species**?",
    phase: 'birds' as const,
    requiredCorrectType: 'bird',
    selectionStrategy: 'bird_and_others'
  },
  {
    number: 3,
    difficulty: 'hard' as const,
    question: "Which is the **top predator**?",
    phase: 'predators' as const,
    requiredCorrectType: 'carnivore',
    selectionStrategy: 'carnivore_and_others'
  }
];

const TriviaPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { addStar } = useParkStars();

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
  const [isChatHistoryExpanded, setIsChatHistoryExpanded] = useState(true);

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

  // Spin wheel state (5 phases for trivia - all same type)
  const [isSpinningWheel, setIsSpinningWheel] = useState(false);
  const [spinPhase, setSpinPhase] = useState<1|2|3|4|5>(1);
  const [isAISelecting, setIsAISelecting] = useState(false);
  const spinSelectedSpeciesRef = useRef<any>(null);
  const triviaSelectionRef = useRef<{
    correctAnswer: any;
    wrongAnswers: any[];
    allOptions: any[];
  } | null>(null);

  // Timer state - 30 second countdown
  const [timeRemaining, setTimeRemaining] = useState(30); // 30 seconds
  const [timerActive, setTimerActive] = useState(false);

  // Game state
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

  // Timer countdown effect
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          // Time's up! Restart game
          const timeoutMessage: ChatMessage = {
            id: `timeout-${Date.now()}`,
            role: 'assistant',
            content: '⏰ **Time\'s up!** Game restarting...',
            timestamp: new Date(),
            status: 'sent'
          };
          setChatHistory(prev => [...prev, timeoutMessage]);

          toast({
            title: "⏰ Time's Up!",
            description: "Restarting the trivia game",
            variant: "destructive"
          });

          // Restart game after 2 seconds
          setTimeout(() => {
            handleStartGame();
          }, 2000);

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, navigate, toast]);

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

  // 🎭 Show intro message with Start/Go Back options
  useEffect(() => {
    // Only run once when page loads
    if (chatHistory.length > 0 || !state?.regionName) return;

    console.log('🎮 Showing trivia game intro message...', { regionName: state.regionName, parkName: state?.parkName });

    // Create intro message
    const introMessage: ChatMessage = {
      id: `intro-${Date.now()}`,
      role: 'assistant',
      content: `Would you like to begin the **${state.regionName}** trivia game${state?.parkName ? ` at **${state.parkName}**` : ''}?`,
      timestamp: new Date(),
      status: 'sent'
    };

    setChatHistory([introMessage]);

    // Show Start and Go Back buttons
    setQuickReplies([
      {
        id: 'start-trivia',
        label: 'Start',
        emoji: '🎮',
        action: 'start-trivia' as const
      },
      {
        id: 'go-back-to-park',
        label: 'Go Back',
        emoji: '🔙',
        action: 'go-back-to-park' as const
      }
    ]);
  }, [state?.regionName, chatHistory.length]);

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
    console.log('🎰 Starting trivia question', currentQuestionIndex + 1);

    // Prevent double-clicking
    if (isAISelecting || isSpinningWheel) {
      console.log('🎰 Already in progress - ignoring click');
      return;
    }

    setIsAISelecting(true);
    // Quick replies already cleared by button click handler

    // Show loading message
    const loadingMessage: ChatMessage = {
      id: `loading-${Date.now()}`,
      role: 'assistant',
      content: 'Loading species game...',
      timestamp: new Date(),
      status: 'loading' as const
    };
    setChatHistory([loadingMessage]);

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

    // Get current question config and taught species
    const questionConfig = QUESTION_CONFIGS[currentQuestionIndex];
    const taughtSpecies = state?.taughtSpecies || [];

    console.log('🎰 Question config:', questionConfig);
    console.log('🎰 State taughtSpecies:', state?.taughtSpecies);
    console.log('🎰 Taught species count:', taughtSpecies.length);
    console.log('🎰 Taught species data:', taughtSpecies);

    // Call trivia AI to select species (1 correct + 3 wrong = 4)
    console.log('🤖 Calling trivia AI to select species...');
    try {
      const triviaSelection = await selectTriviaSpeciesWithAI(
        regionSpecies,
        taughtSpecies,
        questionConfig.phase,
        state.regionName
      );

      console.log('🤖 Trivia AI selected:', {
        correctAnswer: triviaSelection.correctAnswer?.commonName || triviaSelection.correctAnswer?.common_name,
        wrongAnswers: triviaSelection.wrongAnswers.map(s => s.commonName || s.common_name),
        strategy: triviaSelection.strategy
      });

      // Store trivia selections in ref
      triviaSelectionRef.current = triviaSelection;

      // Need to add 1 more species of same type to get 5 total
      // Filter species by question phase type
      let filteredPool: any[] = [];
      if (questionConfig.phase === 'plants') {
        filteredPool = regionSpecies.filter(sp =>
          sp.dietaryCategory?.toLowerCase() === 'producer' ||
          sp.speciesType?.toLowerCase() === 'plant'
        );
      } else if (questionConfig.phase === 'birds') {
        filteredPool = regionSpecies.filter(sp =>
          sp.speciesType?.toLowerCase() === 'bird'
        );
      } else if (questionConfig.phase === 'predators') {
        filteredPool = regionSpecies.filter(sp =>
          sp.dietaryCategory?.toLowerCase() === 'carnivore'
        );
      }

      console.log(`🔍 Q${questionConfig.number} Filtered pool for '${questionConfig.phase}':`, {
        total: filteredPool.length,
        species: filteredPool.slice(0, 5).map(s => ({
          name: s.commonName || s.common_name,
          type: s.speciesType,
          animalType: s.animalType,
          dietaryCategory: s.dietaryCategory
        }))
      });

      // Get the 5th species (exclude the 4 already selected)
      const alreadySelected = triviaSelection.allOptions.map(s => s.scientificName || s.scientific_name);
      const remainingSpecies = filteredPool.filter(sp =>
        !alreadySelected.includes(sp.scientificName || sp.scientific_name)
      );
      const fifthSpecies = remainingSpecies[Math.floor(Math.random() * remainingSpecies.length)];

      // Store all 5 options in spinSelectedSpeciesRef for carousel (in shuffled order)
      const all5Options = [...triviaSelection.allOptions, fifthSpecies].sort(() => Math.random() - 0.5);
      spinSelectedSpeciesRef.current = {
        carnivore: all5Options[0],
        herbivore: all5Options[1],
        omnivore: all5Options[2],
        bird: all5Options[3],
        plantCoral: all5Options[4]
      };

      // DEBUG: Log all 5 species being placed on screen
      console.log('🎰 All 5 species for Question', questionConfig.number, ':', all5Options.map(s => ({
        name: s.commonName || s.common_name,
        type: s.speciesType,
        animalType: s.animalType,
        dietaryCategory: s.dietaryCategory
      })));

      // Start spin wheel animation (5 phases)
      console.log('🎰 Starting spin wheel animation with 5 options...');
      setIsAISelecting(false);
      setSpinPhase(1); // Start with option 1
      setIsSpinningWheel(true);
    } catch (error) {
      console.error('🤖 Trivia AI selection failed:', error);
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

    // Update food web selection based on phase (using generic option slots)
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
      // All 5 phases complete - set correct answer from trivia selection
      console.log('🎰 All 5 species selected! Setting correct answer...');
      setIsSpinningWheel(false);

      // Get correct answer from trivia selection
      let correctSpecies = triviaSelectionRef.current?.correctAnswer || spinSelectedSpeciesRef.current.carnivore;

      console.log(`✅ Correct answer for Q${QUESTION_CONFIGS[currentQuestionIndex].number}:`, correctSpecies?.commonName || correctSpecies?.common_name);
      setCorrectSpeciesForCurrentQuestion(correctSpecies);

      // NOW show the question with the correct answer's name
      const questionConfig = QUESTION_CONFIGS[currentQuestionIndex];
      const speciesName = correctSpecies?.commonName || correctSpecies?.common_name || 'this species';
      const questionText = `🎮 **Question ${questionConfig.number} (${questionConfig.difficulty.toUpperCase()}):** Which one is the **${speciesName}**?`;

      // Replace loading message with the question (filter out loading/temp messages)
      setChatHistory(prev => {
        const questionAlreadyExists = prev.some(msg => msg.content === questionText);
        if (questionAlreadyExists) {
          console.log('⚠️ Question already in chat history, skipping duplicate');
          return prev;
        }

        const questionMessage: ChatMessage = {
          id: `question-display-${Date.now()}`,
          role: 'assistant',
          content: questionText,
          timestamp: new Date(),
          status: 'sent'
        };
        // Filter out loading messages and add the question
        return [...prev.filter(msg => msg.status !== 'loading'), questionMessage];
      });

      // Start timer!
      console.log('⏱️ Starting timer - 30 seconds!');
      setTimerActive(true);
    }
  };

  // 🎮 Start/Restart the trivia game
  const handleStartGame = () => {
    console.log('🎮 Starting trivia game!');

    // Reset game state
    setIsGameActive(true);
    setCurrentQuestionIndex(0);
    setGameResults([]);
    setCorrectSpeciesForCurrentQuestion(null);
    setIsWaitingForNextQuestion(false);
    setTimerActive(false);
    setTimeRemaining(30);

    // Clear chat history
    setChatHistory([]);
    setQuickReplies([]);

    // Load Question 1
    loadQuestion(0);
  };

  // 🎯 Load a question - stream question text + trigger AI species selection
  const loadQuestion = async (questionIndex: number) => {
    // Note: Game finish is now handled directly in handleScatteredSpeciesClick
    // when it detects the last question has been answered

    const questionConfig = QUESTION_CONFIGS[questionIndex];
    console.log(`🎯 Loading Question ${questionConfig.number}...`);

    // Reset correct answer for new question (prevents clicks during wheel spin)
    setCorrectSpeciesForCurrentQuestion(null);

    // Clear chat history for questions 2 and 3 (so only one question shows at a time)
    if (questionIndex > 0) {
      setChatHistory([]);
    }

    // Don't show generic question - we'll show specific species name after spin completes
    // Trigger AI species selection (this will call handlePlayTrivia which starts the wheel)
    handlePlayTrivia();
  };

  // ✅❌ Handle scattered species click
  const handleScatteredSpeciesClick = (species: RegionSpecies) => {
    if (!isGameActive || isWaitingForNextQuestion || !correctSpeciesForCurrentQuestion) {
      console.log('🚫 Not accepting clicks right now');
      return;
    }

    const isCorrect = species.scientificName === correctSpeciesForCurrentQuestion.scientificName;
    const questionConfig = QUESTION_CONFIGS[currentQuestionIndex];

    console.log(`🎮 User clicked: ${species.commonName}, Correct: ${isCorrect}`);

    // Set visual feedback for borders
    if (isCorrect) {
      setCorrectAnswerFeedback(species.scientificName);
    } else {
      setWrongAnswerFeedback(species.scientificName);
    }

    // Record result and store newResults for potential use
    const newResult = {
      questionNumber: questionConfig.number,
      question: questionConfig.question,
      userAnswer: species.commonName,
      correctAnswer: correctSpeciesForCurrentQuestion.commonName,
      isCorrect
    };

    let updatedResults: typeof gameResults = [];
    setGameResults(prev => {
      updatedResults = [...prev, newResult];
      return updatedResults;
    });

    setIsWaitingForNextQuestion(true);
    setTimerActive(false); // Pause timer during feedback

    if (isCorrect) {
      // ✅ Correct answer - add a star!
      addStar(state.parkId, state.parkName);

      const correctMessage: ChatMessage = {
        id: `correct-${Date.now()}`,
        role: 'assistant',
        content: `✅ **Correct!** That's the ${species.commonName}! ⭐ +1 Star`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, correctMessage]);

      // Move to next question after 1 second
      setTimeout(() => {
        // Clear feedback states
        setCorrectAnswerFeedback(null);
        setWrongAnswerFeedback(null);

        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setIsWaitingForNextQuestion(false);
        setTimeRemaining(30); // Reset timer

        // Check if this was the last question
        if (nextIndex >= QUESTION_CONFIGS.length) {
          // Use the updatedResults we captured
          finishGameWithResults(updatedResults);
        } else {
          loadQuestion(nextIndex);
        }
      }, 1000);
    } else {
      // ❌ Wrong answer
      const wrongMessage: ChatMessage = {
        id: `wrong-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Wrong!** The correct answer was **${correctSpeciesForCurrentQuestion.commonName}**, not ${species.commonName}.`,
        timestamp: new Date(),
        status: 'sent'
      };
      setChatHistory(prev => [...prev, wrongMessage]);

      // Move to next question after 2 seconds
      setTimeout(() => {
        // Clear feedback states
        setCorrectAnswerFeedback(null);
        setWrongAnswerFeedback(null);

        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);
        setIsWaitingForNextQuestion(false);
        setTimeRemaining(30); // Reset timer

        // Check if this was the last question
        if (nextIndex >= QUESTION_CONFIGS.length) {
          // Use the updatedResults we captured
          finishGameWithResults(updatedResults);
        } else {
          loadQuestion(nextIndex);
        }
      }, 2000);
    }
  };

  // 🏁 Finish game - return to park with results (accepts results parameter)
  const finishGameWithResults = (results: typeof gameResults) => {
    setIsGameActive(false);
    setTimerActive(false);

    const completionMessage: ChatMessage = {
      id: `complete-${Date.now()}`,
      role: 'assistant',
      content: `🎉 **Game Complete!** You answered ${results.filter(r => r.isCorrect).length} out of ${results.length} questions correctly!`,
      timestamp: new Date(),
      status: 'sent'
    };
    setChatHistory(prev => [...prev, completionMessage]);

    // Return to park with results after 3 seconds
    setTimeout(() => {
      const params = new URLSearchParams({
        ecoRegionId: state.ecoRegionId,
        regionName: state.regionName,
        lat: state.lat?.toString() || '0',
        lng: state.lng?.toString() || '0',
        triviaResults: JSON.stringify(results),
        triviaCompleted: 'true'
      });
      navigate(`/park-select?${params.toString()}`);
    }, 3000);
  };

  // Handle quick reply clicks
  const handleQuickReplyClick = (reply: QuickReply) => {
    if (reply.action === 'start-trivia') {
      setQuickReplies([]);
      handleStartGame();
    } else if (reply.action === 'go-back-to-park') {
      // Navigate back to park selection page
      setQuickReplies([]);
      handleBackToPark();
    } else if (reply.action === 'help-find-species') {
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
      lat: state.lat?.toString() || '0',
      lng: state.lng?.toString() || '0',
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

  // Select background image based on region
  const getBackgroundImage = () => {
    const regionLower = state.regionName?.toLowerCase() || '';

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

      {/* Header Bar - Top */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-auto">
        <div className="flex justify-between items-center px-4 py-2 gap-4">
          {/* Back to Park - Far Left */}
          <Button
            onClick={handleBackToPark}
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12"
          >
            ← Back to Park
          </Button>

          {/* Timer - Center (replacing Global Health Bar) */}
          <div className="flex-1 flex justify-center">
            <div className="glass-panel rounded-xl h-12 px-6 flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <span className={`text-xl font-bold ${timeRemaining <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
            </div>
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

      {/* Scattered Species Images - Randomly positioned across page */}
      <ScatteredSpeciesImages
        species={selectedFoodWebSpecies}
        onSpeciesClick={(species) => handleScatteredSpeciesClick(species)}
        isClickable={isGameActive && !isWaitingForNextQuestion}
        correctAnswer={correctAnswerFeedback || undefined}
        wrongAnswer={wrongAnswerFeedback || undefined}
        questionKey={currentQuestionIndex}
      />

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


      {/* Bottom - Chat (always visible) */}
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
              onExpandHistory={() => setIsChatHistoryExpanded(!isChatHistoryExpanded)}
              isChatHistoryExpanded={isChatHistoryExpanded}
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
