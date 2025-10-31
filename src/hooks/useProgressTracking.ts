/**
 * React hook for accessing progress tracking data
 * Provides global health, eco-region progress, and user stats
 */

import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '@/components/AuthProvider';
import {
  getGlobalHealth,
  getUserEcoregionProgress,
  getUserCompletionStats,
  type GlobalHealth,
  type EcoregionProgress,
} from '@/lib/progressTracking';

export function useProgressTracking() {
  const auth = useContext(AuthContext);
  const [globalHealth, setGlobalHealth] = useState<GlobalHealth | null>(null);
  const [ecoregionProgress, setEcoregionProgress] = useState<EcoregionProgress[]>([]);
  const [userStats, setUserStats] = useState({
    totalEcoregions: 0,
    completedEcoregions: 0,
    totalParks: 0,
    completedParks: 0,
    completionPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load global health (accessible to everyone)
  useEffect(() => {
    let mounted = true;

    async function loadGlobalHealth() {
      const health = await getGlobalHealth();
      if (mounted) {
        setGlobalHealth(health);
      }
    }

    loadGlobalHealth();

    // Refresh every 30 seconds
    const interval = setInterval(loadGlobalHealth, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Load user-specific progress (only when authenticated)
  useEffect(() => {
    let mounted = true;

    async function loadUserProgress() {
      if (!auth?.user?.id) {
        if (mounted) {
          setEcoregionProgress([]);
          setUserStats({
            totalEcoregions: 0,
            completedEcoregions: 0,
            totalParks: 0,
            completedParks: 0,
            completionPercentage: 0,
          });
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);

      try {
        const [progress, stats] = await Promise.all([
          getUserEcoregionProgress(auth.user.id),
          getUserCompletionStats(auth.user.id),
        ]);

        if (mounted) {
          setEcoregionProgress(progress);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('[useProgressTracking] Error loading user progress:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadUserProgress();

    return () => {
      mounted = false;
    };
  }, [auth?.user?.id]);

  // Helper: Get progress for specific eco-region
  const getEcoregionProgress = (ecoregionId: string): EcoregionProgress | undefined => {
    return ecoregionProgress.find((e) => e.ecoregion_id === ecoregionId);
  };

  // Helper: Check if eco-region is complete
  const isEcoregionComplete = (ecoregionId: string): boolean => {
    const progress = getEcoregionProgress(ecoregionId);
    return progress?.is_complete || false;
  };

  // Helper: Get completed eco-regions
  const getCompletedEcoregions = (): EcoregionProgress[] => {
    return ecoregionProgress.filter((e) => e.is_complete);
  };

  // Helper: Get in-progress eco-regions
  const getInProgressEcoregions = (): EcoregionProgress[] => {
    return ecoregionProgress.filter((e) => !e.is_complete && e.completed_parks > 0);
  };

  return {
    // Global data
    globalHealth,

    // User-specific data
    ecoregionProgress,
    userStats,

    // Loading state
    isLoading,

    // Helper functions
    getEcoregionProgress,
    isEcoregionComplete,
    getCompletedEcoregions,
    getInProgressEcoregions,
  };
}
