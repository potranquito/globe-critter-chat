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
 * Simple heuristic to check if coordinates are likely in water
 * This is a rough approximation - not perfect but catches obvious issues
 */
export function isLikelyWater(lat: number, lng: number): boolean {
  // Check for obviously oceanic regions (large ocean areas with no land)
  
  // Pacific Ocean - vast areas with no land
  if (lat > -60 && lat < 60 && lng > -180 && lng < -100 && lat > -30 && lat < 30) {
    // Central Pacific (exception: islands)
    if (Math.abs(lat) < 20 && lng > -160 && lng < -110) {
      return true; // Open Pacific
    }
  }
  
  // Mid-Atlantic (between Americas and Africa/Europe)
  if (lat > -40 && lat < 60 && lng > -40 && lng < -10) {
    // Central Atlantic
    if (lat > 0 && lat < 50 && lng > -35 && lng < -15) {
      return true; // Open Atlantic
    }
  }
  
  // Indian Ocean (between Africa and Australia)
  if (lat > -60 && lat < 30 && lng > 40 && lng < 110) {
    // Central Indian Ocean
    if (lat > -30 && lat < 10 && lng > 50 && lng < 90) {
      return true; // Open Indian Ocean
    }
  }
  
  // Southern Ocean (Antarctica surrounding)
  if (lat < -65) {
    return true; // Mostly water/ice
  }
  
  return false;
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
        confidence: 'medium'
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
  
  // Marine animals CAN be in water (that's correct)
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

