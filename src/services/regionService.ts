import { supabase } from '@/integrations/supabase/client';

export interface HabitatBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  centerLat: number;
  centerLng: number;
}

export interface RegionInfo {
  regionName: string;
  ecosystemType: string;
  climate: string;
  biome: string;
  characteristics: string[];
  threatFactors: string[];
  bounds: HabitatBounds;
  analyzedFor: string;
  imageUrl?: string;
  imageAttribution?: string;
}

export interface RegionSpecies {
  scientificName: string;
  commonName: string;
  animalType: string;
  conservationStatus: string;
  occurrenceCount: number;
  imageKeyword?: string;
  // New classification fields (from backend)
  speciesType?: string;
  uiGroup?: string;
  trophicRole?: string;
  dietaryCategory?: string; // New: Carnivore, Herbivore, Omnivore, Producer
}

/**
 * Calculate habitat bounds from an array of points
 */
export function calculateHabitatBounds(points: Array<{ lat: number; lng: number }>): HabitatBounds {
  if (points.length === 0) {
    return {
      minLat: -90,
      maxLat: 90,
      minLng: -180,
      maxLng: 180,
      centerLat: 0,
      centerLng: 0
    };
  }

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  // Add buffer zone (20% of range, minimum 2 degrees)
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  const latBuffer = Math.max(latRange * 0.2, 2);
  const lngBuffer = Math.max(lngRange * 0.2, 2);

  return {
    minLat: Math.max(-90, minLat - latBuffer),
    maxLat: Math.min(90, maxLat + latBuffer),
    minLng: Math.max(-180, minLng - lngBuffer),
    maxLng: Math.min(180, maxLng + lngBuffer),
    centerLat: (minLat + maxLat) / 2,
    centerLng: (minLng + maxLng) / 2
  };
}

/**
 * Analyze habitat region using AI
 */
export async function analyzeHabitatRegion(
  bounds: HabitatBounds,
  speciesName: string
): Promise<RegionInfo> {
  const { data, error } = await supabase.functions.invoke('analyze-habitat-region', {
    body: { bounds, speciesName }
  });

  if (error) {
    console.error('Error analyzing habitat region:', error);
    throw error;
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to analyze habitat region');
  }

  return data.region;
}

/**
 * Discover other species in the region
 */
export async function discoverRegionSpecies(
  bounds: HabitatBounds,
  regionName: string,
  excludeSpecies?: string,
  limit: number = 30
): Promise<RegionSpecies[]> {
  const { data, error } = await supabase.functions.invoke('discover-region-species', {
    body: {
      bounds,
      regionName,
      excludeSpecies,
      limit
    }
  });

  if (error) {
    console.error('Error discovering region species:', error);
    throw error;
  }

  if (!data.success) {
    throw new Error(data.error || 'Failed to discover region species');
  }

  return data.species || [];
}

/**
 * Complete region analysis and species discovery workflow
 */
export async function performRegionAnalysis(
  points: Array<{ lat: number; lng: number }>,
  speciesName: string,
  limit: number = 30
): Promise<{
  bounds: HabitatBounds;
  region: RegionInfo;
  species: RegionSpecies[];
}> {
  // 1. Calculate bounds
  const bounds = calculateHabitatBounds(points);

  // 2. Analyze region (parallel with species discovery for speed)
  const [region, species] = await Promise.all([
    analyzeHabitatRegion(bounds, speciesName),
    discoverRegionSpecies(bounds, 'Unknown Region', speciesName, limit)
  ]);

  // 3. Re-discover species with proper region name
  const finalSpecies = await discoverRegionSpecies(bounds, region.regionName, speciesName, limit);

  return {
    bounds,
    region,
    species: finalSpecies
  };
}
