/**
 * Progress Tracking Service
 * Manages eco-region progress and global health calculations
 */

import { supabase } from '@/integrations/supabase/client';

export interface EcoregionProgress {
  ecoregion_id: string;
  ecoregion_name: string;
  biome: string;
  realm: string;
  total_parks: number;
  completed_parks: number;
  completion_percentage: number;
  is_complete: boolean;
  pollution_removed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface ParkProgressDetail {
  park_id: string;
  park_name: string;
  stars: number;
  completed: boolean;
  completed_at: string | null;
}

export interface GlobalHealth {
  id: number;
  health_percentage: number;
  total_ecoregions: number;
  completed_ecoregions: number;
  total_users: number;
  active_users: number;
  total_parks_completed: number;
  updated_at: string;
}

/**
 * Get global health statistics
 */
export async function getGlobalHealth(): Promise<GlobalHealth | null> {
  try {
    const { data, error } = await supabase
      .from('global_health')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('Error fetching global health:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getGlobalHealth:', error);
    return null;
  }
}

/**
 * Get user's eco-region progress summary
 */
export async function getUserEcoregionProgress(
  userId: string
): Promise<EcoregionProgress[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_ecoregion_summary', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching ecoregion progress:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserEcoregionProgress:', error);
    return [];
  }
}

/**
 * Get parks in an eco-region with user's progress
 */
export async function getEcoregionParksWithProgress(
  ecoregionId: string,
  userId: string
): Promise<ParkProgressDetail[]> {
  try {
    const { data, error } = await supabase.rpc('get_ecoregion_parks_with_progress', {
      p_ecoregion_id: ecoregionId,
      p_user_id: userId,
    });

    if (error) {
      console.error('Error fetching ecoregion parks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEcoregionParksWithProgress:', error);
    return [];
  }
}

/**
 * Manually trigger global health recalculation
 * (Usually done automatically by database triggers)
 */
export async function refreshGlobalHealth(): Promise<void> {
  try {
    const { error } = await supabase.rpc('update_global_health');

    if (error) {
      console.error('Error refreshing global health:', error);
    }
  } catch (error) {
    console.error('Error in refreshGlobalHealth:', error);
  }
}

/**
 * Recalculate all progress for a user (for testing/debugging)
 */
export async function recalculateUserProgress(userId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('recalculate_user_progress', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error recalculating user progress:', error);
    }
  } catch (error) {
    console.error('Error in recalculateUserProgress:', error);
  }
}

/**
 * Check if a specific eco-region is complete for a user
 */
export async function isEcoregionComplete(
  userId: string,
  ecoregionId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_ecoregion_progress')
      .select('is_complete')
      .eq('user_id', userId)
      .eq('ecoregion_id', ecoregionId)
      .maybeSingle();

    if (error) {
      console.error('Error checking ecoregion completion:', error);
      return false;
    }

    return data?.is_complete || false;
  } catch (error) {
    console.error('Error in isEcoregionComplete:', error);
    return false;
  }
}

/**
 * Get completion stats for a user
 */
export async function getUserCompletionStats(userId: string): Promise<{
  totalEcoregions: number;
  completedEcoregions: number;
  totalParks: number;
  completedParks: number;
  completionPercentage: number;
}> {
  try {
    // Get ecoregion progress
    const ecoregionProgress = await getUserEcoregionProgress(userId);

    const completedEcoregions = ecoregionProgress.filter((e) => e.is_complete).length;
    const totalEcoregions = ecoregionProgress.length;

    // Get park progress
    const { data: parkData, error: parkError } = await supabase
      .from('user_park_progress')
      .select('stars')
      .eq('user_id', userId);

    if (parkError) {
      console.error('Error fetching park stats:', parkError);
      return {
        totalEcoregions,
        completedEcoregions,
        totalParks: 0,
        completedParks: 0,
        completionPercentage: 0,
      };
    }

    const totalParks = parkData?.length || 0;
    const completedParks = parkData?.filter((p) => p.stars === 3).length || 0;

    const completionPercentage =
      totalEcoregions > 0 ? (completedEcoregions / totalEcoregions) * 100 : 0;

    return {
      totalEcoregions,
      completedEcoregions,
      totalParks,
      completedParks,
      completionPercentage: Math.round(completionPercentage * 100) / 100,
    };
  } catch (error) {
    console.error('Error in getUserCompletionStats:', error);
    return {
      totalEcoregions: 0,
      completedEcoregions: 0,
      totalParks: 0,
      completedParks: 0,
      completionPercentage: 0,
    };
  }
}
