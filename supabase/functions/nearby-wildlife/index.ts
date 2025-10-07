Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });
  }

  try {
    const { lat, lng, radius = 50000 } = await req.json();
    console.log('Searching for wildlife near:', lat, lng, 'radius:', radius);
    
    const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_SERVER_API_KEY') || Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!GOOGLE_MAPS_KEY) {
      console.error('Google Maps Server API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    // Search for wildlife-related places
    const searchQueries = [
      'wildlife refuge',
      'nature reserve', 
      'wildlife park',
      'national park',
      'zoo',
      'aquarium'
    ];

    const allPlaces: any[] = [];

    for (const query of searchQueries) {
      const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=${radius}&key=${GOOGLE_MAPS_KEY}`;
      console.log(`Searching for: ${query}`);
      const placesResponse = await fetch(placesUrl);
      const placesData = await placesResponse.json();
      console.log(`${query} results:`, placesData.status, placesData.results?.length || 0);

      if (placesData.status === 'OK' && placesData.results) {
        allPlaces.push(...placesData.results.slice(0, 3)); // Limit per category
      } else if (placesData.error_message) {
        console.error(`${query} error:`, placesData.error_message);
      }
    }

    // Remove duplicates and format results
    const uniquePlaces = Array.from(
      new Map(allPlaces.map(place => [place.place_id, place])).values()
    );

    const formattedPlaces = uniquePlaces.slice(0, 15).map(place => ({
      name: place.name,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng,
      address: place.formatted_address,
      rating: place.rating,
      types: place.types,
      photoReference: place.photos?.[0]?.photo_reference,
    }));

    console.log('Found total wildlife places:', formattedPlaces.length);

    return new Response(
      JSON.stringify({ places: formattedPlaces }),
      { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch (error: any) {
    console.error('Nearby wildlife error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
});
