Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { photoReference, maxWidth = 200 } = await req.json();
    
    if (!photoReference) {
      throw new Error('Photo reference is required');
    }
    
    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!GOOGLE_MAPS_KEY) {
      console.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_MAPS_KEY}`;
    
    console.log('Fetching photo from Google Places API');
    const photoResponse = await fetch(photoUrl);
    
    if (!photoResponse.ok) {
      throw new Error(`Failed to fetch photo: ${photoResponse.statusText}`);
    }

    // Get the image blob
    const imageBlob = await photoResponse.blob();
    
    // Return the image with proper headers
    return new Response(imageBlob, {
      headers: {
        'Content-Type': photoResponse.headers.get('Content-Type') || 'image/jpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    });
  } catch (error: any) {
    console.error('Photo fetch error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
