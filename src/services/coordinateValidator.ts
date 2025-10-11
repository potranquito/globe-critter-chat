/**
 * Coordinate Validation Utility
 * Prevents pins from appearing in oceans for terrestrial animals
 */

export interface CoordinateValidation {
  isValid: boolean;
  reason?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Check if coordinates are likely on LAND (not water)
 * Returns TRUE for landmasses, FALSE for oceans
 */
export function isLikelyLand(lat: number, lng: number): boolean {
  // Major landmasses - these are definitely LAND
  
  // Africa (huge landmass, easy to detect)
  if (lat > -35 && lat < 40 && lng > -20 && lng < 55) {
    return true; // Africa
  }
  
  // Europe
  if (lat > 35 && lat < 72 && lng > -10 && lng < 70) {
    return true; // Europe
  }
  
  // Asia
  if (lat > -10 && lat < 75 && lng > 60 && lng < 180) {
    return true; // Asia
  }
  
  // North America
  if (lat > 15 && lat < 85 && lng > -170 && lng < -50) {
    return true; // North America
  }
  
  // South America
  if (lat > -60 && lat < 15 && lng > -85 && lng < -30) {
    return true; // South America
  }
  
  // Australia
  if (lat > -45 && lat < -10 && lng > 110 && lng < 155) {
    return true; // Australia
  }
  
  // Greenland
  if (lat > 59 && lat < 84 && lng > -75 && lng < -10) {
    return true; // Greenland
  }
  
  // Antarctica (land, not ocean)
  if (lat < -60) {
    return true; // Antarctica continent
  }
  
  return false; // Assume water if not in major landmasses
}

/**
 * Simple heuristic to check if coordinates are likely in water
 * This is a rough approximation - not perfect but catches obvious issues
 */
export function isLikelyWater(lat: number, lng: number): boolean {
  // If it's on a known landmass, it's NOT water
  if (isLikelyLand(lat, lng)) {
    return false;
  }
  
  // Otherwise, assume it's water (oceans, seas, etc.)
  return true;
}

/**
 * Validate coordinates for a species based on its habitat type
 */
export function validateCoordinates(
  lat: number,
  lng: number,
  habitatType: 'terrestrial' | 'marine' | 'freshwater' | 'mixed',
  ecoregionName?: string
): CoordinateValidation {
  // Check for invalid coordinates
  if (isNaN(lat) || isNaN(lng)) {
    return {
      isValid: false,
      reason: 'Invalid coordinates (NaN)',
      confidence: 'high'
    };
  }
  
  // Check for null island (0, 0)
  if (lat === 0 && lng === 0) {
    return {
      isValid: false,
      reason: 'Null Island coordinates (0, 0)',
      confidence: 'high'
    };
  }
  
  // Check coordinate bounds
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return {
      isValid: false,
      reason: 'Coordinates out of bounds',
      confidence: 'high'
    };
  }
  
  // For terrestrial animals, check if coordinates are in open ocean
  if (habitatType === 'terrestrial') {
    if (isLikelyWater(lat, lng)) {
      return {
        isValid: false,
        reason: `Terrestrial habitat in water (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        confidence: 'high'
      };
    }
  }
  
  // ✅ NEW: For marine animals, check if coordinates are on LAND (inverse check!)
  if (habitatType === 'marine') {
    if (isLikelyLand(lat, lng)) {
      return {
        isValid: false,
        reason: `Marine habitat on land (${lat.toFixed(2)}, ${lng.toFixed(2)}) - ${ecoregionName || 'unknown'}`,
        confidence: 'high'
      };
    }
  }
  
  // For freshwater, should not be in open ocean either
  if (habitatType === 'freshwater') {
    if (isLikelyWater(lat, lng)) {
      return {
        isValid: false,
        reason: `Freshwater habitat in open ocean (${lat.toFixed(2)}, ${lng.toFixed(2)})`,
        confidence: 'medium'
      };
    }
  }
  
  // Mixed habitat animals can be anywhere
  
  return {
    isValid: true,
    confidence: 'high'
  };
}

/**
 * Filter a list of ecoregions to remove invalid coordinates
 */
export function filterValidEcoregions<T extends { centerLat: number; centerLng: number; name?: string }>(
  ecoregions: T[],
  habitatType: 'terrestrial' | 'marine' | 'freshwater' | 'mixed'
): T[] {
  return ecoregions.filter(eco => {
    const validation = validateCoordinates(
      eco.centerLat,
      eco.centerLng,
      habitatType,
      eco.name
    );
    
    if (!validation.isValid) {
      console.warn(`❌ Filtered out invalid ecoregion: ${eco.name || 'Unknown'} - ${validation.reason}`);
    }
    
    return validation.isValid;
  });
}

/**
 * Get habitat type from ecoregion info
 */
export function getHabitatType(realm?: string, biome?: string): 'terrestrial' | 'marine' | 'freshwater' | 'mixed' {
  const realmLower = (realm || '').toLowerCase();
  const biomeLower = (biome || '').toLowerCase();
  
  // Check for marine indicators
  if (realmLower.includes('marine') || 
      realmLower.includes('ocean') || 
      biomeLower.includes('marine') ||
      biomeLower.includes('coral reef')) {
    return 'marine';
  }
  
  // Check for freshwater indicators
  if (realmLower.includes('freshwater') || 
      biomeLower.includes('freshwater') ||
      biomeLower.includes('river') ||
      biomeLower.includes('lake')) {
    return 'freshwater';
  }
  
  // Default to terrestrial
  return 'terrestrial';
}

