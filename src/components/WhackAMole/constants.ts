/**
 * Whack-A-Mole game configuration
 * Based on gabrielgugelmin/whack-a-mole
 */

export const GAME_CONFIG = {
  // Grid size (9 = 3x3, 12 = 4x3)
  MOLES_COUNT: 9,

  // Points per mole whacked
  INCREMENT_SCORE_BY: 10,

  // Game duration in seconds
  GAME_TIME_SECONDS: 60,

  // Speed multiplier after each whack (game gets faster)
  SPEED_INCREASE: 0.7,

  // Score needed to win
  WIN_SCORE: 100,
} as const;

export default GAME_CONFIG;
