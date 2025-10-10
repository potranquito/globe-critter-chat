/**
 * eBird API Service
 * Fetches birding hotspots and observation data from eBird API 2.0
 * Documentation: https://documenter.getpostman.com/view/664302/S1ENwy59
 */

const EBIRD_API_BASE = 'https://api.ebird.org/v2';
const API_KEY = import.meta.env.VITE_EBIRD_API_KEY;

export interface EBirdHotspot {
  locId: string;
  locName: string;
  countryCode: string;
  subnational1Code: string;
  lat: number;
  lng: number;
  latestObsDt: string;
  numSpeciesAllTime: number;
}

export interface EBirdLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'ebird_hotspot';
  metadata: {
    country: string;
    region: string;
    speciesCount: number;
    lastObserved: string;
  };
}

/**
 * Get nearby eBird hotspots within a radius
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusKm Radius in kilometers (max 50km)
 * @returns Array of hotspots
 */
export async function getNearbyHotspots(
  lat: number,
  lng: number,
  radiusKm: number = 10
): Promise<EBirdLocation[]> {
  try {
    // eBird API uses different endpoint format for nearby hotspots
    // ref/hotspot/geo?lat={latitude}&lng={longitude}&dist={distance}&back={days}
    const url = `${EBIRD_API_BASE}/ref/hotspot/geo?lat=${lat}&lng=${lng}&dist=${radiusKm}&back=30`;

    const response = await fetch(url, {
      headers: {
        'X-eBirdApiToken': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
    }

    const hotspots: EBirdHotspot[] = await response.json();

    // Transform to our unified format
    return hotspots.map((hotspot) => ({
      id: hotspot.locId,
      name: hotspot.locName,
      latitude: hotspot.lat,
      longitude: hotspot.lng,
      type: 'ebird_hotspot' as const,
      metadata: {
        country: hotspot.countryCode,
        region: hotspot.subnational1Code,
        speciesCount: hotspot.numSpeciesAllTime,
        lastObserved: hotspot.latestObsDt,
      },
    }));
  } catch (error) {
    console.error('Error fetching eBird hotspots:', error);
    throw error;
  }
}

/**
 * Get hotspot details by ID
 * @param locId Location ID
 * @returns Hotspot details
 */
export async function getHotspotDetails(locId: string): Promise<EBirdHotspot | null> {
  try {
    const url = `${EBIRD_API_BASE}/ref/hotspot/info/${locId}`;

    const response = await fetch(url, {
      headers: {
        'X-eBirdApiToken': API_KEY,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching eBird hotspot details:', error);
    throw error;
  }
}

/**
 * Search hotspots by region code
 * @param regionCode Region code (e.g., 'US-CA' for California)
 * @returns Array of hotspots in region
 */
export async function getHotspotsByRegion(regionCode: string): Promise<EBirdLocation[]> {
  try {
    const url = `${EBIRD_API_BASE}/ref/hotspot/${regionCode}`;

    const response = await fetch(url, {
      headers: {
        'X-eBirdApiToken': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`eBird API error: ${response.status} ${response.statusText}`);
    }

    const hotspots: EBirdHotspot[] = await response.json();

    return hotspots.map((hotspot) => ({
      id: hotspot.locId,
      name: hotspot.locName,
      latitude: hotspot.lat,
      longitude: hotspot.lng,
      type: 'ebird_hotspot' as const,
      metadata: {
        country: hotspot.countryCode,
        region: hotspot.subnational1Code,
        speciesCount: hotspot.numSpeciesAllTime,
        lastObserved: hotspot.latestObsDt,
      },
    }));
  } catch (error) {
    console.error('Error fetching eBird hotspots by region:', error);
    throw error;
  }
}
