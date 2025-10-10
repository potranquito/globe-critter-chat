/**
 * Protected Planet API Service
 * Fetches protected areas and habitat regions from UNEP-WCMC Protected Planet API
 * Documentation: https://api.protectedplanet.net/documentation
 */

const PROTECTED_PLANET_BASE = 'https://api.protectedplanet.net/v3';
const API_KEY = import.meta.env.VITE_PROTECTED_PLANET_KEY;

export interface ProtectedArea {
  id: number;
  name: string;
  original_name?: string;
  wdpa_pid: string;
  geojson?: {
    type: string;
    coordinates: any;
  };
  countries: Array<{
    name: string;
    iso_3: string;
  }>;
  iucn_category?: {
    name: string;
    id: number;
  };
  designation?: {
    name: string;
    jurisdiction: string;
  };
  marine: boolean;
  reported_marine_area: number;
  reported_area: number;
  no_take_status?: {
    name: string;
    id: number;
  };
  legal_status?: {
    name: string;
    id: number;
  };
  management_authority?: string;
  conservation_objectives?: string;
}

export interface HabitatRegion {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'protected_area';
  metadata: {
    area: number;
    marine: boolean;
    iucnCategory?: string;
    designation?: string;
    country?: string;
    conservationStatus?: string;
  };
  bounds?: {
    type: string;
    coordinates: any;
  };
}

/**
 * Search protected areas near coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusKm Radius in kilometers
 * @returns Array of protected areas
 */
export async function searchProtectedAreasNearby(
  lat: number,
  lng: number,
  radiusKm: number = 50
): Promise<HabitatRegion[]> {
  try {
    // Note: Protected Planet API doesn't have direct radius search
    // We'll need to use bounding box or country-based search
    // For now, we'll search by bounding box calculated from radius

    const bounds = calculateBounds(lat, lng, radiusKm);

    const url = `${PROTECTED_PLANET_BASE}/protected_areas/search?bbox=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&per_page=50`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Protected Planet API key is invalid or missing');
      }
      throw new Error(`Protected Planet API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const areas: ProtectedArea[] = data.protected_areas || [];

    // Transform to our unified format
    return areas.map((area) => ({
      id: area.wdpa_pid || area.id.toString(),
      name: area.name,
      // Calculate centroid from bounds if available, otherwise use approximate
      latitude: lat, // TODO: Calculate actual centroid from geojson
      longitude: lng,
      type: 'protected_area' as const,
      metadata: {
        area: area.reported_area,
        marine: area.marine,
        iucnCategory: area.iucn_category?.name,
        designation: area.designation?.name,
        country: area.countries[0]?.name,
        conservationStatus: area.legal_status?.name,
      },
      bounds: area.geojson,
    }));
  } catch (error) {
    console.error('Error fetching Protected Planet areas:', error);
    throw error;
  }
}

/**
 * Get protected area details by ID
 * @param areaId WDPA ID or numeric ID
 * @returns Protected area details
 */
export async function getProtectedAreaDetails(areaId: string | number): Promise<ProtectedArea | null> {
  try {
    const url = `${PROTECTED_PLANET_BASE}/protected_areas/${areaId}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${API_KEY}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Protected Planet API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.protected_area;
  } catch (error) {
    console.error('Error fetching Protected Planet area details:', error);
    throw error;
  }
}

/**
 * Search protected areas by country
 * @param countryIso3 ISO 3-letter country code (e.g., 'USA')
 * @returns Array of protected areas
 */
export async function searchProtectedAreasByCountry(countryIso3: string): Promise<HabitatRegion[]> {
  try {
    const url = `${PROTECTED_PLANET_BASE}/protected_areas/search?country=${countryIso3}&per_page=50`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Protected Planet API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const areas: ProtectedArea[] = data.protected_areas || [];

    return areas.map((area) => ({
      id: area.wdpa_pid || area.id.toString(),
      name: area.name,
      latitude: 0, // TODO: Calculate from geojson
      longitude: 0,
      type: 'protected_area' as const,
      metadata: {
        area: area.reported_area,
        marine: area.marine,
        iucnCategory: area.iucn_category?.name,
        designation: area.designation?.name,
        country: area.countries[0]?.name,
        conservationStatus: area.legal_status?.name,
      },
      bounds: area.geojson,
    }));
  } catch (error) {
    console.error('Error fetching Protected Planet areas by country:', error);
    throw error;
  }
}

/**
 * Calculate bounding box from center point and radius
 * Approximation using lat/lng degrees
 */
function calculateBounds(lat: number, lng: number, radiusKm: number) {
  // Rough approximation: 1 degree lat = 111km, 1 degree lng varies by latitude
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta,
  };
}
