/**
 * Park Progress Service
 * Handles saving and loading user park progress (stars) to/from Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { ParkStars } from '@/types/learning';

export interface DbParkProgress {
  id: string;
  user_id: string;
  park_id: string;
  park_name: string;
  stars: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all park progress for the current user
 */
export async function getUserParkProgress(userId: string): Promise<Record<string, ParkStars>> {
  try {
    const { data, error } = await supabase
      .from('user_park_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching park progress:', error);
      return {};
    }

    // Convert database format to ParkStars format
    const progressMap: Record<string, ParkStars> = {};
    data?.forEach((row: DbParkProgress) => {
      progressMap[row.park_id] = {
        parkId: row.park_id,
        parkName: row.park_name,
        stars: row.stars,
        completedAt: row.completed_at || undefined,
      };
    });

    return progressMap;
  } catch (error) {
    console.error('Error in getUserParkProgress:', error);
    return {};
  }
}

/**
 * Update park stars for a user
 */
export async function updateParkStars(
  userId: string,
  parkId: string,
  parkName: string,
  stars: number
): Promise<ParkStars | null> {
  try {
    // Clamp stars to 0-3
    const clampedStars = Math.max(0, Math.min(3, stars));

    const { data, error } = await supabase
      .from('user_park_progress')
      .upsert({
        user_id: userId,
        park_id: parkId,
        park_name: parkName,
        stars: clampedStars,
        completed_at: clampedStars === 3 ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating park stars:', error);
      return null;
    }

    return {
      parkId: data.park_id,
      parkName: data.park_name,
      stars: data.stars,
      completedAt: data.completed_at || undefined,
    };
  } catch (error) {
    console.error('Error in updateParkStars:', error);
    return null;
  }
}

/**
 * Add one star to a park (max 3)
 */
export async function addParkStar(
  userId: string,
  parkId: string,
  parkName: string
): Promise<ParkStars | null> {
  try {
    // Get current progress
    const { data: currentData, error: fetchError } = await supabase
      .from('user_park_progress')
      .select('stars')
      .eq('user_id', userId)
      .eq('park_id', parkId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching current progress:', fetchError);
      return null;
    }

    const currentStars = currentData?.stars || 0;
    const newStars = Math.min(currentStars + 1, 3);

    return updateParkStars(userId, parkId, parkName, newStars);
  } catch (error) {
    console.error('Error in addParkStar:', error);
    return null;
  }
}

/**
 * Reset progress for a specific park
 */
export async function resetParkProgress(userId: string, parkId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_park_progress')
      .delete()
      .eq('user_id', userId)
      .eq('park_id', parkId);

    if (error) {
      console.error('Error resetting park progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetParkProgress:', error);
    return false;
  }
}

/**
 * Reset all park progress for a user
 */
export async function resetAllParkProgress(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_park_progress')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error resetting all park progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in resetAllParkProgress:', error);
    return false;
  }
}

/**
 * Get stars for a specific park
 */
export async function getParkStars(userId: string, parkId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_park_progress')
      .select('stars')
      .eq('user_id', userId)
      .eq('park_id', parkId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching park stars:', error);
      return 0;
    }

    return data?.stars || 0;
  } catch (error) {
    console.error('Error in getParkStars:', error);
    return 0;
  }
}

/**
 * Migrate localStorage data to database
 * Call this once when user signs in to preserve their local progress
 */
export async function migrateLocalStorageToDb(
  userId: string,
  localProgress: Record<string, ParkStars>
): Promise<void> {
  try {
    console.log('[Migration] Starting localStorage to DB migration...');

    // Get existing DB progress to avoid overwriting higher values
    const dbProgress = await getUserParkProgress(userId);

    const updates: Promise<ParkStars | null>[] = [];

    // For each park in localStorage
    for (const [parkId, localData] of Object.entries(localProgress)) {
      const dbStars = dbProgress[parkId]?.stars || 0;
      const localStars = localData.stars;

      // Only update if local has more stars than DB
      if (localStars > dbStars) {
        console.log(`[Migration] Migrating ${localData.parkName}: ${localStars} stars`);
        updates.push(updateParkStars(userId, parkId, localData.parkName, localStars));
      }
    }

    await Promise.all(updates);
    console.log('[Migration] Migration complete!');
  } catch (error) {
    console.error('[Migration] Error migrating localStorage to DB:', error);
  }
}
