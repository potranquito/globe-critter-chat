import { useState, useEffect, useContext } from 'react';
import { ParkStars } from '../types/learning';
import { AuthContext } from '../components/AuthProvider';
import {
  getUserParkProgress,
  updateParkStars as dbUpdateParkStars,
  addParkStar as dbAddParkStar,
  resetParkProgress as dbResetParkProgress,
  resetAllParkProgress as dbResetAllParkProgress,
  migrateLocalStorageToDb,
} from '../lib/parkProgress';

const STORAGE_KEY = 'globe-critter-park-stars';

/**
 * Hook for tracking park stars (0-3 per park)
 * Syncs with Supabase database when user is authenticated
 * Falls back to localStorage for guest users
 */
export function useParkStars() {
  const [parkStars, setParkStars] = useState<Record<string, ParkStars>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const auth = useContext(AuthContext);

  // Load progress on mount
  useEffect(() => {
    let mounted = true;

    async function loadProgress() {
      try {
        if (auth?.user?.id) {
          // User is authenticated - load from database
          console.log('[useParkStars] Loading progress from database...');
          const dbProgress = await getUserParkProgress(auth.user.id);

          if (mounted) {
            setParkStars(dbProgress);
            setHasLoaded(true);

            // Migrate any localStorage data to database (one-time migration)
            const localStored = localStorage.getItem(STORAGE_KEY);
            if (localStored) {
              try {
                const localProgress = JSON.parse(localStored);
                if (Object.keys(localProgress).length > 0) {
                  console.log('[useParkStars] Found localStorage data, migrating to database...');
                  await migrateLocalStorageToDb(auth.user.id, localProgress);
                  // Reload from DB after migration
                  const updatedProgress = await getUserParkProgress(auth.user.id);
                  if (mounted) {
                    setParkStars(updatedProgress);
                  }
                  // Clear localStorage after successful migration
                  localStorage.removeItem(STORAGE_KEY);
                }
              } catch (e) {
                console.error('[useParkStars] Error during migration:', e);
              }
            }
          }
        } else {
          // Guest user - load from localStorage
          console.log('[useParkStars] Loading progress from localStorage (guest mode)...');
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setParkStars(parsed);
          }
          if (mounted) {
            setHasLoaded(true);
          }
        }
      } catch (error) {
        console.error('[useParkStars] Error loading progress:', error);
        if (mounted) {
          setHasLoaded(true);
        }
      }
    }

    loadProgress();

    return () => {
      mounted = false;
    };
  }, [auth?.user?.id]);

  // Save to localStorage when in guest mode (fallback)
  useEffect(() => {
    if (!hasLoaded || auth?.user?.id) {
      return; // Don't save to localStorage if authenticated or not loaded yet
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parkStars));
    } catch (error) {
      console.error('[useParkStars] Error saving to localStorage:', error);
    }
  }, [parkStars, hasLoaded, auth?.user?.id]);

  /**
   * Get stars for a specific park
   */
  const getStars = (parkId: string): number => {
    return parkStars[parkId]?.stars || 0;
  };

  /**
   * Add one star to a park (max 3)
   */
  const addStar = async (parkId: string, parkName: string) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      if (auth?.user?.id) {
        // Authenticated - update database
        const result = await dbAddParkStar(auth.user.id, parkId, parkName);
        if (result) {
          setParkStars((prev) => ({
            ...prev,
            [parkId]: result,
          }));
        }
      } else {
        // Guest - update localStorage
        setParkStars((prev) => {
          const current = prev[parkId]?.stars || 0;
          const newStars = Math.min(current + 1, 3);

          return {
            ...prev,
            [parkId]: {
              parkId,
              parkName,
              stars: newStars,
              completedAt: newStars === 3 ? new Date().toISOString() : prev[parkId]?.completedAt,
            },
          };
        });
      }
    } catch (error) {
      console.error('[useParkStars] Error adding star:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Set exact star count for a park
   */
  const setStars = async (parkId: string, parkName: string, stars: number) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const clampedStars = Math.max(0, Math.min(3, stars));

      if (auth?.user?.id) {
        // Authenticated - update database
        const result = await dbUpdateParkStars(auth.user.id, parkId, parkName, clampedStars);
        if (result) {
          setParkStars((prev) => ({
            ...prev,
            [parkId]: result,
          }));
        }
      } else {
        // Guest - update localStorage
        setParkStars((prev) => ({
          ...prev,
          [parkId]: {
            parkId,
            parkName,
            stars: clampedStars,
            completedAt: clampedStars === 3 ? new Date().toISOString() : undefined,
          },
        }));
      }
    } catch (error) {
      console.error('[useParkStars] Error setting stars:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Reset stars for a park
   */
  const resetPark = async (parkId: string) => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      if (auth?.user?.id) {
        // Authenticated - delete from database
        await dbResetParkProgress(auth.user.id, parkId);
      }

      // Update local state
      setParkStars((prev) => {
        const { [parkId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('[useParkStars] Error resetting park:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  /**
   * Reset all stars
   */
  const resetAll = async () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      if (auth?.user?.id) {
        // Authenticated - delete all from database
        await dbResetAllParkProgress(auth.user.id);
      }

      // Update local state
      setParkStars({});
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('[useParkStars] Error resetting all:', error);
    } finally {
      setIsSyncing(false);
    }
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
    parkStars,
    hasLoaded,
    isSyncing,
  };
}
