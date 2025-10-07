import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Bounds {
  ne: { lat: number; lng: number };
  sw: { lat: number; lng: number };
}

interface Threat {
  id: string;
  type: 'fire' | 'earthquake' | 'flood' | 'drought' | 'development' | 'pollution';
  title: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  status: 'active' | 'ongoing' | 'planned' | 'resolved';
  impact: 'critical' | 'high' | 'medium' | 'low';
  severity: number;
  description: string;
  affectedArea?: number;
  timestamp: string;
  lastUpdated: string;
  source: {
    name: string;
    url: string;
  };
  emoji: string;
}

function isInBounds(coords: [number, number], bounds: Bounds): boolean {
  const [lng, lat] = coords;
  return lat >= bounds.sw.lat && lat <= bounds.ne.lat &&
         lng >= bounds.sw.lng && lng <= bounds.ne.lng;
}

function calculateImpact(magnitude: number | undefined): 'critical' | 'high' | 'medium' | 'low' {
  if (!magnitude) return 'low';
  if (magnitude >= 1000) return 'critical';
  if (magnitude >= 500) return 'high';
  if (magnitude >= 100) return 'medium';
  return 'low';
}

function calculateEarthquakeImpact(magnitude: number): 'critical' | 'high' | 'medium' | 'low' {
  if (magnitude >= 7.0) return 'critical';
  if (magnitude >= 6.0) return 'high';
  if (magnitude >= 4.0) return 'medium';
  return 'low';
}

async function fetchFireThreats(bounds: Bounds): Promise<Threat[]> {
  try {
    const res = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open');
    const data = await res.json();
    
    return data.events
      .filter((event: any) => 
        event.geometry && event.geometry[0] && 
        isInBounds([event.geometry[0].coordinates[0], event.geometry[0].coordinates[1]], bounds)
      )
      .map((event: any) => ({
        id: event.id,
        type: 'fire' as const,
        title: event.title,
        location: {
          lat: event.geometry[0].coordinates[1],
          lng: event.geometry[0].coordinates[0],
          name: event.title
        },
        status: 'active' as const,
        impact: calculateImpact(event.geometry[0].magnitudeValue),
        severity: event.geometry[0].magnitudeValue ? event.geometry[0].magnitudeValue / 1000 : 5,
        description: event.description || `Active wildfire detected`,
        affectedArea: event.geometry[0].magnitudeValue,
        timestamp: event.geometry[0].date,
        lastUpdated: event.geometry[0].date,
        source: { 
          name: 'NASA EONET', 
          url: event.link || 'https://eonet.gsfc.nasa.gov'
        },
        emoji: '🔥'
      }));
  } catch (err) {
    console.error('Fire fetch failed:', err);
    return [];
  }
}

async function fetchEarthquakeThreats(bounds: Bounds): Promise<Threat[]> {
  try {
    const res = await fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson');
    const data = await res.json();
    
    return data.features
      .filter((f: any) => 
        f.geometry && f.geometry.coordinates &&
        isInBounds([f.geometry.coordinates[0], f.geometry.coordinates[1]], bounds)
      )
      .map((f: any) => ({
        id: f.id,
        type: 'earthquake' as const,
        title: `M${f.properties.mag} Earthquake`,
        location: {
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          name: f.properties.place
        },
        status: 'active' as const,
        impact: calculateEarthquakeImpact(f.properties.mag),
        severity: f.properties.mag,
        description: `${f.properties.place} - Depth: ${Math.round(f.geometry.coordinates[2])}km`,
        timestamp: new Date(f.properties.time).toISOString(),
        lastUpdated: new Date(f.properties.updated).toISOString(),
        source: { 
          name: 'USGS', 
          url: f.properties.url 
        },
        emoji: '🌋'
      }));
  } catch (err) {
    console.error('Earthquake fetch failed:', err);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json();
    console.log('Fetching threats for bounds:', bounds);

    if (!bounds || !bounds.ne || !bounds.sw) {
      throw new Error('Invalid bounds provided');
    }

    // Fetch threats from all sources in parallel
    const [fireThreats, earthquakeThreats] = await Promise.all([
      fetchFireThreats(bounds),
      fetchEarthquakeThreats(bounds)
    ]);

    const allThreats = [...fireThreats, ...earthquakeThreats]
      .sort((a, b) => b.severity - a.severity);

    console.log(`Found ${allThreats.length} threats (${fireThreats.length} fires, ${earthquakeThreats.length} earthquakes)`);

    return new Response(JSON.stringify({
      success: true,
      threats: allThreats,
      count: allThreats.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habitat-threats:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      threats: [],
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
