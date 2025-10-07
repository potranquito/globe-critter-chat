import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { location } = await req.json();
    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!GOOGLE_MAPS_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    // Geocode the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_KEY}`;
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      return new Response(
        JSON.stringify({ error: 'Location not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const result = geocodeData.results[0];
    const { lat, lng } = result.geometry.location;
    const formattedAddress = result.formatted_address;

    return new Response(
      JSON.stringify({ lat, lng, name: formattedAddress }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
