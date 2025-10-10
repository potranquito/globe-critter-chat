/**
 * Google Places API Service
 * Fetches parks, refuges, and protected areas using Google Places API
 * Documentation: https://developers.google.com/maps/documentation/places/web-service
 */

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: {
        lat: number;
        lng: number;
      };
      southwest: {
        lat: number;
        lng: number;
      };
    };
  };
  types: string[];
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
}

export interface PlaceLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'national_park' | 'wildlife_refuge' | 'nature_reserve' | 'protected_area';
  metadata: {
    address?: string;
    placeTypes: string[];
    rating?: number;
    photoReference?: string;
  };
}

/**
 * Search for protected areas near coordinates using Google Places
 * @param apiKey Google Maps API key
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusMeters Radius in meters (max 50000)
 * @returns Array of locations
 */
export async function searchProtectedPlacesNearby(
  apiKey: string,
  lat: number,
  lng: number,
  radiusMeters: number = 10000
): Promise<PlaceLocation[]> {
  try {
    const locations: PlaceLocation[] = [];

    // Search for multiple types of protected areas
    const searchTypes = [
      'national_park',
      'park',  // General parks that might include nature reserves
    ];

    const searchKeywords = [
      'wildlife refuge',
      'nature reserve',
      'conservation area',
      'protected area',
    ];

    // First, search by type
    for (const type of searchTypes) {
      const results = await searchPlacesByType(apiKey, lat, lng, radiusMeters, type);
      locations.push(...results);
    }

    // Then search by keywords for more specific areas
    for (const keyword of searchKeywords) {
      const results = await searchPlacesByKeyword(apiKey, lat, lng, radiusMeters, keyword);
      locations.push(...results);
    }

    // Deduplicate by place_id
    const uniqueLocations = Array.from(
      new Map(locations.map((loc) => [loc.id, loc])).values()
    );

    return uniqueLocations.slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('Error fetching Google Places:', error);
    throw error;
  }
}

/**
 * Search places by type
 */
async function searchPlacesByType(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  type: string
): Promise<PlaceLocation[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return transformGooglePlaces(data.results || []);
}

/**
 * Search places by keyword
 */
async function searchPlacesByKeyword(
  apiKey: string,
  lat: number,
  lng: number,
  radius: number,
  keyword: string
): Promise<PlaceLocation[]> {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Google Places API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return transformGooglePlaces(data.results || []);
}

/**
 * Transform Google Places results to our unified format
 */
function transformGooglePlaces(places: GooglePlace[]): PlaceLocation[] {
  return places.map((place) => {
    // Determine location type based on place types
    let locationType: PlaceLocation['type'] = 'protected_area';

    if (place.types.includes('national_park')) {
      locationType = 'national_park';
    } else if (
      place.name.toLowerCase().includes('wildlife refuge') ||
      place.name.toLowerCase().includes('refuge')
    ) {
      locationType = 'wildlife_refuge';
    } else if (
      place.name.toLowerCase().includes('nature reserve') ||
      place.name.toLowerCase().includes('reserve')
    ) {
      locationType = 'nature_reserve';
    }

    return {
      id: place.place_id,
      name: place.name,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      type: locationType,
      metadata: {
        address: place.formatted_address,
        placeTypes: place.types,
        rating: place.rating,
        photoReference: place.photos?.[0]?.photo_reference,
      },
    };
  });
}

/**
 * Get place details by ID
 * @param apiKey Google Maps API key
 * @param placeId Google Place ID
 * @returns Place details
 */
export async function getPlaceDetails(apiKey: string, placeId: string): Promise<GooglePlace | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      if (data.status === 'NOT_FOUND') {
        return null;
      }
      throw new Error(`Google Places API error: ${data.status}`);
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching Google Place details:', error);
    throw error;
  }
}

/**
 * Get photo URL from photo reference
 * @param apiKey Google Maps API key
 * @param photoReference Photo reference from place data
 * @param maxWidth Maximum width in pixels
 * @returns Photo URL
 */
export function getPhotoUrl(apiKey: string, photoReference: string, maxWidth: number = 400): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${apiKey}`;
}
