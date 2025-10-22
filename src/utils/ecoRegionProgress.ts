/**
 * localStorage helper for tracking eco-region game completion
 * Stores which eco-regions have completed both Food Web Trivia + 2D Pixel Game
 */

const STORAGE_KEY = 'globe-critter-ecoregion-completion';

export interface EcoRegionCompletion {
  ecoRegionId: string;
  completedGames: {
    foodWebTrivia: boolean;
    pixelGame: boolean;
    whackAMole: boolean;
  };
  completedAt?: string; // ISO timestamp when ALL THREE games completed
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
 * Check if an eco-region is fully completed (all three games done)
 */
export const isEcoRegionCompleted = (ecoRegionId: string): boolean => {
  const completions = getCompletedEcoRegions();
  const completion = completions.get(ecoRegionId);

  if (!completion) return false;

  return (
    completion.completedGames.foodWebTrivia &&
    completion.completedGames.pixelGame &&
    completion.completedGames.whackAMole
  );
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
      whackAMole: existing?.completedGames.whackAMole || false,
    },
  };

  // If all three games now complete, add timestamp
  if (
    updated.completedGames.foodWebTrivia &&
    updated.completedGames.pixelGame &&
    updated.completedGames.whackAMole
  ) {
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
 * Mark 2D Pixel Game as complete for an eco-region
 */
export const markPixelGameComplete = (ecoRegionId: string): void => {
  const completions = getCompletedEcoRegions();
  const existing = completions.get(ecoRegionId);

  const updated: EcoRegionCompletion = {
    ecoRegionId,
    completedGames: {
      foodWebTrivia: existing?.completedGames.foodWebTrivia || false,
      pixelGame: true,
      whackAMole: existing?.completedGames.whackAMole || false,
    },
  };

  // If all three games now complete, add timestamp
  if (
    updated.completedGames.foodWebTrivia &&
    updated.completedGames.pixelGame &&
    updated.completedGames.whackAMole
  ) {
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
 * Mark Whack-A-Mole as complete for an eco-region
 * This is the FINAL game - completing this completes the entire eco-region!
 */
export const markWhackAMoleComplete = (ecoRegionId: string): void => {
  const completions = getCompletedEcoRegions();
  const existing = completions.get(ecoRegionId);

  const updated: EcoRegionCompletion = {
    ecoRegionId,
    completedGames: {
      foodWebTrivia: existing?.completedGames.foodWebTrivia || false,
      pixelGame: existing?.completedGames.pixelGame || false,
      whackAMole: true,
    },
  };

  // If all three games now complete, add timestamp
  if (
    updated.completedGames.foodWebTrivia &&
    updated.completedGames.pixelGame &&
    updated.completedGames.whackAMole
  ) {
    updated.completedAt = new Date().toISOString();
  }

  completions.set(ecoRegionId, updated);
  saveCompletions(completions);

  console.log(`✅ Whack-A-Mole completed for eco-region: ${ecoRegionId}`);
  if (updated.completedAt) {
    console.log(`🎉🎉🎉 Eco-region ${ecoRegionId} FULLY COMPLETED! 🎉🎉🎉`);
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
 * Clear completion data for a specific eco-region (for game loss/reset)
 */
export const clearEcoRegionProgress = (ecoRegionId: string): void => {
  const completions = getCompletedEcoRegions();
  completions.delete(ecoRegionId);
  saveCompletions(completions);
  console.log(`🔄 Cleared progress for eco-region: ${ecoRegionId}`);
};

/**
 * Clear all completion data (for testing/reset)
 */
export const clearAllCompletions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ Cleared all eco-region completion data');
};
