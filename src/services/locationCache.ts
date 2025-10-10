/**
 * Location Cache Service
 * Caches API responses to reduce redundant calls
 * Uses Supabase api_cache table for persistence
 *
 * TTL Strategy:
 * - Location discovery: 1 hour (dynamic, changes frequently)
 * - Species data: 7 days (semi-static, animals don't migrate daily)
 * - Threat data: 1 hour (fires, earthquakes change rapidly)
 */

import { supabase } from '@/integrations/supabase/client';
import { DiscoveryResult } from './locationDiscovery';

// Cache TTL configurations (in hours)
const CACHE_TTL_CONFIG = {
  locations: 1,      // Location discovery: 1 hour
  habitats: 1,       // Habitat discovery: 1 hour
  user_search: 1,    // User searches: 1 hour
  animal: 1,         // Animal searches: 1 hour
  species: 168,      // Species data: 7 days (7 * 24 hours)
  threats: 1,        // Threat/disaster data: 1 hour
} as const;

type CacheType = keyof typeof CACHE_TTL_CONFIG;

export interface CacheEntry {
  key: string;
  data: any;
  cached_at: string;
  expires_at: string;
}

/**
 * Generate cache key from search parameters
 */
function generateCacheKey(
  type: CacheType,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|');
  return `api_cache:${type}:${sortedParams}`;
}

/**
 * Get cached discovery result
 */
export async function getCachedDiscovery(
  type: CacheType,
  params: Record<string, any>
): Promise<DiscoveryResult | null> {
  try {
    const cacheKey = generateCacheKey(type, params);

    const { data, error } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    console.log(`💾 Cache HIT for ${cacheKey}`);
    return data.response_data as DiscoveryResult;
  } catch (error) {
    console.warn('Cache retrieval error:', error);
    return null;
  }
}

/**
 * Store discovery result in cache
 */
export async function setCachedDiscovery(
  type: CacheType,
  params: Record<string, any>,
  result: DiscoveryResult
): Promise<void> {
  try {
    const cacheKey = generateCacheKey(type, params);
    const now = new Date();
    const ttlHours = CACHE_TTL_CONFIG[type];
    const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

    const { error } = await supabase.from('api_cache').upsert(
      {
        cache_key: cacheKey,
        api_name: `api_${type}`,
        endpoint: JSON.stringify(params),
        response_data: result,
        cached_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      {
        onConflict: 'cache_key',
      }
    );

    if (error) {
      console.warn('Cache storage error:', error);
      return;
    }

    const ttlDisplay = ttlHours >= 24 ? `${ttlHours / 24} days` : `${ttlHours} hour(s)`;
    console.log(`💾 Cached ${type} data: ${cacheKey} (expires in ${ttlDisplay})`);
  } catch (error) {
    console.warn('Cache storage error:', error);
  }
}

/**
 * Clear expired cache entries
 * Should be called periodically or on app startup
 */
export async function clearExpiredCache(): Promise<void> {
  try {
    const { error } = await supabase
      .from('api_cache')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.warn('Cache cleanup error:', error);
      return;
    }

    console.log('🧹 Cleared expired cache entries');
  } catch (error) {
    console.warn('Cache cleanup error:', error);
  }
}

/**
 * Clear cache by type
 * Useful for manual refresh of specific data types
 */
export async function clearCacheByType(type: CacheType): Promise<void> {
  try {
    const { error } = await supabase
      .from('api_cache')
      .delete()
      .like('cache_key', `api_cache:${type}:%`);

    if (error) {
      console.warn('Cache clear error:', error);
      return;
    }

    console.log(`🧹 Cleared ${type} cache`);
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Clear all API cache
 * Useful for full refresh
 */
export async function clearAllCache(): Promise<void> {
  try {
    const { error } = await supabase
      .from('api_cache')
      .delete()
      .like('cache_key', 'api_cache:%');

    if (error) {
      console.warn('Cache clear error:', error);
      return;
    }

    console.log('🧹 Cleared all API cache');
  } catch (error) {
    console.warn('Cache clear error:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number;
  expiredEntries: number;
  byType?: Record<string, number>;
}> {
  try {
    const { count: totalCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true })
      .like('cache_key', 'api_cache:%');

    const { count: expiredCount } = await supabase
      .from('api_cache')
      .select('*', { count: 'exact', head: true })
      .like('cache_key', 'api_cache:%')
      .lt('expires_at', new Date().toISOString());

    return {
      totalEntries: totalCount || 0,
      expiredEntries: expiredCount || 0,
    };
  } catch (error) {
    console.warn('Cache stats error:', error);
    return {
      totalEntries: 0,
      expiredEntries: 0,
    };
  }
}

/**
 * Export CacheType for use in other modules
 */
export type { CacheType };
