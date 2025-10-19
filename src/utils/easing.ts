/**
 * Custom easing functions for roulette animation
 */

// Roulette-style easing: slow start, fast middle, dramatic slowdown
export const rouletteEase = (t: number): number => {
  if (t < 0.1) {
    // Ease in
    return t * t * 10;
  } else if (t < 0.7) {
    // Fast steady spin
    return 0.01 + (t - 0.1) * 1.5;
  } else {
    // Dramatic deceleration
    const slowT = (t - 0.7) / 0.3;
    return 0.91 + (1 - Math.pow(1 - slowT, 3)) * 0.09;
  }
};

// Bounce effect for card flying to banner
export const bounceEase = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// Cubic bezier presets
export const easingPresets = {
  roulette: [0.22, 0.61, 0.36, 1] as const,
  bounce: [0.34, 1.56, 0.64, 1] as const,
  smooth: [0.4, 0.0, 0.2, 1] as const,
  snappy: [0.87, 0.0, 0.13, 1.0] as const,
};
