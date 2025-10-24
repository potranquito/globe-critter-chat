import { useState, useEffect } from 'react';
import { ParkStars } from '../types/learning';

const STORAGE_KEY = 'globe-critter-park-stars';

/**
 * Hook for tracking park stars (0-3 per park)
 * Persists to localStorage
 */
export function useParkStars() {
  const [parkStars, setParkStars] = useState<Record<string, ParkStars>>({});
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setParkStars(parsed);
      }
      setHasLoaded(true); // Mark as loaded even if empty
    } catch (error) {
      console.error('[useParkStars] Error loading from localStorage:', error);
      setHasLoaded(true);
    }
  }, []);

  // Save to localStorage when parkStars changes (but only after initial load)
  useEffect(() => {
    if (!hasLoaded) {
      return; // Don't save on initial render before loading
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parkStars));
    } catch (error) {
      console.error('[useParkStars] Error saving to localStorage:', error);
    }
  }, [parkStars, hasLoaded]);

  /**
   * Get stars for a specific park
   */
  const getStars = (parkId: string): number => {
    return parkStars[parkId]?.stars || 0;
  };

  /**
   * Add one star to a park (max 3)
   */
  const addStar = (parkId: string, parkName: string) => {
    setParkStars((prev) => {
      const current = prev[parkId]?.stars || 0;
      const newStars = Math.min(current + 1, 3);

      return {
        ...prev,
        [parkId]: {
          parkId,
          parkName,
          stars: newStars,
          completedAt: newStars === 3 ? new Date().toISOString() : prev[parkId]?.completedAt
        }
      };
    });
  };

  /**
   * Set exact star count for a park
   */
  const setStars = (parkId: string, parkName: string, stars: number) => {
    const clampedStars = Math.max(0, Math.min(3, stars));

    setParkStars((prev) => ({
      ...prev,
      [parkId]: {
        parkId,
        parkName,
        stars: clampedStars,
        completedAt: clampedStars === 3 ? new Date().toISOString() : undefined
      }
    }));
  };

  /**
   * Reset stars for a park
   */
  const resetPark = (parkId: string) => {
    setParkStars((prev) => {
      const { [parkId]: _, ...rest } = prev;
      return rest;
    });
  };

  /**
   * Reset all stars
   */
  const resetAll = () => {
    setParkStars({});
    localStorage.removeItem(STORAGE_KEY);
  };

  /**
   * Get all parks with stars
   */
  const getAllParks = (): ParkStars[] => {
    return Object.values(parkStars).sort((a, b) => b.stars - a.stars);
  };

  return {
    getStars,
    addStar,
    setStars,
    resetPark,
    resetAll,
    getAllParks,
    parkStars
  };
}
