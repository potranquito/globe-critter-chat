/**
 * localStorage helper for tracking eco-region game completion
 * Stores which eco-regions have completed both Food Web Trivia + 2D Pixel Game
 */

const STORAGE_KEY = 'globe-critter-ecoregion-completion';

export interface EcoRegionCompletion {
  ecoRegionId: string;
  completedGames: {
    foodWebTrivia: boolean;
    pixelGame: boolean; // Placeholder for future 2D pixel game
  };
  completedAt?: string; // ISO timestamp when BOTH games completed
}

/**
 * Get all eco-region completion data from localStorage
 */
export const getCompletedEcoRegions = (): Map<string, EcoRegionCompletion> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return new Map();

    const parsed = JSON.parse(data);
    return new Map(Object.entries(parsed));
  } catch (error) {
    console.error('Failed to load eco-region completion data:', error);
    return new Map();
  }
};

/**
 * Check if an eco-region is fully completed (both games done)
 */
export const isEcoRegionCompleted = (ecoRegionId: string): boolean => {
  const completions = getCompletedEcoRegions();
  const completion = completions.get(ecoRegionId);

  if (!completion) return false;

  return completion.completedGames.foodWebTrivia && completion.completedGames.pixelGame;
};

/**
 * Mark Food Web Trivia as complete for an eco-region
 */
export const markFoodWebTriviaComplete = (ecoRegionId: string): void => {
  const completions = getCompletedEcoRegions();
  const existing = completions.get(ecoRegionId);

  const updated: EcoRegionCompletion = {
    ecoRegionId,
    completedGames: {
      foodWebTrivia: true,
      pixelGame: existing?.completedGames.pixelGame || false,
    },
  };

  // If both games now complete, add timestamp
  if (updated.completedGames.foodWebTrivia && updated.completedGames.pixelGame) {
    updated.completedAt = new Date().toISOString();
  }

  completions.set(ecoRegionId, updated);
  saveCompletions(completions);

  console.log(`✅ Food Web Trivia completed for eco-region: ${ecoRegionId}`);
  if (updated.completedAt) {
    console.log(`🎉 Eco-region ${ecoRegionId} FULLY COMPLETED!`);
  }
};

/**
 * Mark 2D Pixel Game as complete for an eco-region (placeholder)
 */
export const markPixelGameComplete = (ecoRegionId: string): void => {
  const completions = getCompletedEcoRegions();
  const existing = completions.get(ecoRegionId);

  const updated: EcoRegionCompletion = {
    ecoRegionId,
    completedGames: {
      foodWebTrivia: existing?.completedGames.foodWebTrivia || false,
      pixelGame: true,
    },
  };

  // If both games now complete, add timestamp
  if (updated.completedGames.foodWebTrivia && updated.completedGames.pixelGame) {
    updated.completedAt = new Date().toISOString();
  }

  completions.set(ecoRegionId, updated);
  saveCompletions(completions);

  console.log(`✅ Pixel Game completed for eco-region: ${ecoRegionId}`);
  if (updated.completedAt) {
    console.log(`🎉 Eco-region ${ecoRegionId} FULLY COMPLETED!`);
  }
};

/**
 * Get completion status for a specific eco-region
 */
export const getEcoRegionCompletion = (ecoRegionId: string): EcoRegionCompletion | null => {
  const completions = getCompletedEcoRegions();
  return completions.get(ecoRegionId) || null;
};

/**
 * Save completions to localStorage
 */
const saveCompletions = (completions: Map<string, EcoRegionCompletion>): void => {
  try {
    const obj = Object.fromEntries(completions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save eco-region completion data:', error);
  }
};

/**
 * Clear all completion data (for testing/reset)
 */
export const clearAllCompletions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ Cleared all eco-region completion data');
};
