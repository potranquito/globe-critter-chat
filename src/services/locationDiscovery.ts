/**
 * Location Discovery Service
 * Orchestrates location discovery from multiple APIs based on user triggers
 * - Geolocation button
 * - Location search
 * - Animal search
 */

import { searchProtectedAreasNearby, HabitatRegion } from './api/protectedPlanetApi';
import { getNearbyHotspots, EBirdLocation } from './api/eBirdApi';
import { searchProtectedPlacesNearby, PlaceLocation } from './api/googlePlacesApi';
import { getCachedDiscovery, setCachedDiscovery } from './locationCache';

export interface UnifiedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'habitat_region' | 'ebird_hotspot' | 'national_park' | 'wildlife_refuge' | 'nature_reserve' | 'protected_area';
  source: 'protected_planet' | 'ebird' | 'google_places';
  metadata: Record<string, any>;
  bounds?: any;
}

export interface DiscoveryResult {
  locations: UnifiedLocation[];
  source: string;
  timestamp: Date;
  searchParams: {
    latitude: number;
    longitude: number;
    radius?: number;
    query?: string;
  };
}

/**
 * Discover habitat regions near coordinates (for 3D globe)
 * Uses Protected Planet API to find large ecological regions
 */
export async function discoverHabitatsByGeolocation(
  lat: number,
  lng: number,
  radiusKm: number = 50
): Promise<DiscoveryResult> {
  try {
    console.log(`🌍 Discovering habitats near ${lat}, ${lng} (radius: ${radiusKm}km)`);

    // Check cache first
    const cacheParams = { lat, lng, radiusKm };
    const cached = await getCachedDiscovery('habitats', cacheParams);
    if (cached) {
      console.log('📦 Returning cached habitat data');
      return cached;
    }

    // Fetch from Protected Planet API
    const habitats = await searchProtectedAreasNearby(lat, lng, radiusKm);

    // Transform to unified format
    const locations: UnifiedLocation[] = habitats.map((habitat) => ({
      id: habitat.id,
      name: habitat.name,
      latitude: habitat.latitude,
      longitude: habitat.longitude,
      type: 'habitat_region' as const,
      source: 'protected_planet' as const,
      metadata: habitat.metadata,
      bounds: habitat.bounds,
    }));

    console.log(`✅ Found ${locations.length} habitats from Protected Planet`);

    const result: DiscoveryResult = {
      locations,
      source: '3D Habitat Discovery',
      timestamp: new Date(),
      searchParams: { latitude: lat, longitude: lng, radius: radiusKm },
    };

    // Cache the result
    await setCachedDiscovery('habitats', cacheParams, result);

    return result;
  } catch (error) {
    console.error('Error discovering habitats:', error);
    throw new Error('Failed to discover habitats. Please try again.');
  }
}

/**
 * Discover specific locations near coordinates (for 2D map)
 * Uses Google Places + eBird to find parks, refuges, and hotspots
 */
export async function discoverLocationsByGeolocation(
  lat: number,
  lng: number,
  radiusKm: number = 10,
  googleMapsApiKey?: string
): Promise<DiscoveryResult> {
  try {
    console.log(`🗺️ Discovering locations near ${lat}, ${lng} (radius: ${radiusKm}km)`);

    // Check cache first
    const cacheParams = { lat, lng, radiusKm };
    const cached = await getCachedDiscovery('locations', cacheParams);
    if (cached) {
      console.log('📦 Returning cached location data');
      return cached;
    }

    const allLocations: UnifiedLocation[] = [];

    // 1. Fetch eBird hotspots
    try {
      const hotspots = await getNearbyHotspots(lat, lng, radiusKm);
      const eBirdLocations: UnifiedLocation[] = hotspots.map((hotspot) => ({
        id: hotspot.id,
        name: hotspot.name,
        latitude: hotspot.latitude,
        longitude: hotspot.longitude,
        type: 'ebird_hotspot' as const,
        source: 'ebird' as const,
        metadata: hotspot.metadata,
      }));
      allLocations.push(...eBirdLocations);
      console.log(`✅ Found ${eBirdLocations.length} hotspots from eBird`);
    } catch (error) {
      console.warn('eBird API error, continuing with other sources:', error);
    }

    // 2. Fetch Google Places (if API key provided)
    if (googleMapsApiKey) {
      try {
        const radiusMeters = radiusKm * 1000;
        const places = await searchProtectedPlacesNearby(googleMapsApiKey, lat, lng, radiusMeters);
        const googleLocations: UnifiedLocation[] = places.map((place) => ({
          id: place.id,
          name: place.name,
          latitude: place.latitude,
          longitude: place.longitude,
          type: place.type,
          source: 'google_places' as const,
          metadata: place.metadata,
        }));
        allLocations.push(...googleLocations);
        console.log(`✅ Found ${googleLocations.length} places from Google Places`);
      } catch (error) {
        console.warn('Google Places API error, continuing with other sources:', error);
      }
    }

    // Deduplicate by name and proximity (within 100m)
    const uniqueLocations = deduplicateLocations(allLocations);

    // Limit to 20 results
    const limitedLocations = uniqueLocations.slice(0, 20);

    console.log(`✅ Total unique locations: ${limitedLocations.length}`);

    const result: DiscoveryResult = {
      locations: limitedLocations,
      source: '2D Location Discovery',
      timestamp: new Date(),
      searchParams: { latitude: lat, longitude: lng, radius: radiusKm },
    };

    // Cache the result
    await setCachedDiscovery('locations', cacheParams, result);

    return result;
  } catch (error) {
    console.error('Error discovering locations:', error);
    throw new Error('Failed to discover locations. Please try again.');
  }
}

/**
 * Discover locations by user input (location name/query)
 * Geocodes the query and then calls appropriate discovery method
 */
export async function discoverByUserInput(
  locationQuery: string,
  viewMode: '3d' | '2d',
  googleMapsApiKey?: string
): Promise<DiscoveryResult & { geocoded: { lat: number; lng: number } }> {
  try {
    console.log(`🔍 Searching for: "${locationQuery}"`);

    // Geocode the location query using Google Geocoding API
    if (!googleMapsApiKey) {
      throw new Error('Google Maps API key required for location search');
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(locationQuery)}&key=${googleMapsApiKey}`;
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      throw new Error('Location not found. Please try a different search term.');
    }

    const { lat, lng } = data.results[0].geometry.location;
    console.log(`📍 Geocoded to: ${lat}, ${lng}`);

    // Call appropriate discovery method based on view mode
    let result: DiscoveryResult;
    if (viewMode === '3d') {
      result = await discoverHabitatsByGeolocation(lat, lng, 50);
    } else {
      result = await discoverLocationsByGeolocation(lat, lng, 10, googleMapsApiKey);
    }

    return {
      ...result,
      geocoded: { lat, lng },
    };
  } catch (error) {
    console.error('Error discovering by user input:', error);
    throw error;
  }
}

/**
 * Discover habitats by animal name
 * Finds where the animal lives and returns habitat regions
 * This is a placeholder - will be enhanced in Phase 3 with species APIs
 */
export async function discoverByAnimal(
  animalName: string
): Promise<DiscoveryResult & { habitatCount: number }> {
  try {
    console.log(`🦁 Searching habitats for: "${animalName}"`);

    // TODO Phase 3: Query GBIF/iNaturalist for animal's range
    // For now, return empty results with informative message
    throw new Error(
      `Animal habitat search will be implemented in Phase 3. For now, please use location search.`
    );

    // Placeholder structure for when we implement this:
    // 1. Query GBIF/iNaturalist for animal's scientific name and range
    // 2. Get list of coordinates where animal is observed
    // 3. Query Protected Planet for regions containing those coordinates
    // 4. Return habitat regions with green dot markers
  } catch (error) {
    console.error('Error discovering by animal:', error);
    throw error;
  }
}

/**
 * Deduplicate locations by name and proximity
 * Removes duplicates within 100m of each other
 */
function deduplicateLocations(locations: UnifiedLocation[]): UnifiedLocation[] {
  const unique: UnifiedLocation[] = [];

  for (const location of locations) {
    const isDuplicate = unique.some((existing) => {
      // Check if same name (case-insensitive)
      const sameName = existing.name.toLowerCase() === location.name.toLowerCase();

      // Check if within 100m
      const distance = calculateDistance(
        existing.latitude,
        existing.longitude,
        location.latitude,
        location.longitude
      );
      const nearby = distance < 0.1; // 100m

      return sameName || nearby;
    });

    if (!isDuplicate) {
      unique.push(location);
    }
  }

  return unique;
}

/**
 * Calculate distance between two points in kilometers
 * Using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
