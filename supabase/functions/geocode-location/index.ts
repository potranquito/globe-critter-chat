Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { location } = await req.json();
    console.log('Geocoding location:', location);
    
    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!GOOGLE_MAPS_KEY) {
      console.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    // Geocode the location
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${GOOGLE_MAPS_KEY}`;
    console.log('Fetching geocode from Google Maps API...');
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();
    console.log('Geocode API response status:', geocodeData.status);

    if (geocodeData.status !== 'OK' || !geocodeData.results[0]) {
      console.error('Location not found:', geocodeData.status, geocodeData.error_message);
      return new Response(
        JSON.stringify({ error: 'Location not found', details: geocodeData.error_message }),
        { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
      );
    }

    const result = geocodeData.results[0];
    const { lat, lng } = result.geometry.location;
    const formattedAddress = result.formatted_address;
    console.log('Geocoded successfully:', formattedAddress, lat, lng);

    return new Response(
      JSON.stringify({ lat, lng, name: formattedAddress }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('Geocode error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
