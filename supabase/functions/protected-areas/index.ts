import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json();
    console.log('Fetching protected areas for bounds:', bounds);

    const PROTECTED_PLANET_API_KEY = Deno.env.get('PROTECTED_PLANET_API_KEY');
    if (!PROTECTED_PLANET_API_KEY) {
      throw new Error('PROTECTED_PLANET_API_KEY is not configured');
    }

    // Query Protected Planet API with bounding box
    const bbox = `${bounds.sw.lng},${bounds.sw.lat},${bounds.ne.lng},${bounds.ne.lat}`;
    const url = `https://api.protectedplanet.net/v3/protected_areas?bbox=${bbox}&token=${PROTECTED_PLANET_API_KEY}`;
    
    console.log('Calling Protected Planet API:', url);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Protected Planet API error:', response.status, errorText);
      throw new Error(`Protected Planet API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Protected areas found:', data.protected_areas?.length || 0);

    const protectedAreas = (data.protected_areas || []).map((area: any) => ({
      id: area.id.toString(),
      name: area.name,
      type: area.designation?.type || 'Protected Area',
      area: area.reported_area || 0,
      iucnCategory: area.iucn_category?.name,
      designation: area.designation?.name,
      location: {
        lat: area.centroid?.coordinates?.[1] || 0,
        lng: area.centroid?.coordinates?.[0] || 0
      },
      bounds: area.bounds ? {
        ne: { lat: area.bounds.max_lat, lng: area.bounds.max_lng },
        sw: { lat: area.bounds.min_lat, lng: area.bounds.min_lng }
      } : undefined
    }));

    return new Response(JSON.stringify({ 
      success: true,
      protectedAreas: protectedAreas,
      count: protectedAreas.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in protected-areas:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
