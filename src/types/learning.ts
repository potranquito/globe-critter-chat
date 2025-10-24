// Learning system types for 3-phase education flow

export type LearningPhase = 'plants' | 'birds' | 'predators';

export interface TaughtSpecies {
  id: string;
  scientificName: string;
  commonName: string | null;
  imageUrl: string | null;
  phase: LearningPhase;
}

export interface LearningSession {
  parkId: string;
  ecoregionName: string;
  phases: {
    plants: TaughtSpecies[];
    birds: TaughtSpecies[];
    predators: TaughtSpecies[];
  };
  currentPhase: LearningPhase;
  completedPhases: LearningPhase[];
}

export interface TriviaRound {
  phase: LearningPhase;
  correctAnswer: TaughtSpecies; // Must be from taught species
  wrongAnswers: TaughtSpecies[]; // Can be any species (taught or not)
  allOptions: TaughtSpecies[]; // Shuffled array of correct + wrong answers
}

export interface ParkStars {
  parkId: string;
  parkName: string;
  stars: number; // 0-3 stars
  completedAt?: string;
}

// Helper to get next phase
export function getNextPhase(current: LearningPhase): LearningPhase | null {
  const order: LearningPhase[] = ['plants', 'birds', 'predators'];
  const currentIndex = order.indexOf(current);
  return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
}

// Helper to get phase display name
export function getPhaseDisplayName(phase: LearningPhase): string {
  const names = {
    plants: 'Plants',
    birds: 'Birds',
    predators: 'Predators'
  };
  return names[phase];
}

// Helper to get phase emoji
export function getPhaseEmoji(phase: LearningPhase): string {
  const emojis = {
    plants: '🌿',
    birds: '🦅',
    predators: '🦁'
  };
  return emojis[phase];
}
