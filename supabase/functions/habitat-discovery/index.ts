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
    const { location } = await req.json();
    console.log('Discovering habitat for location:', location);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Use OpenAI to identify habitat region
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a geographic and ecological expert. When given a location name, identify the primary habitat region it belongs to.
            
Return a JSON object with:
- habitatName: The name of the habitat/ecoregion (e.g., "Mojave Desert", "Amazon Rainforest", "Arctic Tundra")
- centerLat: Approximate center latitude of the habitat region
- centerLng: Approximate center longitude of the habitat region
- minLat: Minimum latitude of the habitat region
- maxLat: Maximum latitude of the habitat region
- minLng: Minimum longitude of the habitat region
- maxLng: Maximum longitude of the habitat region
- climate: Climate type (e.g., "Hot Desert", "Tropical Rainforest", "Arctic", "Temperate Forest")
- area: Approximate area in square kilometers
- characteristics: Array of 3-5 key characteristics (e.g., ["Arid", "High temperatures", "Low rainfall"])

Example for "Las Vegas":
{
  "habitatName": "Mojave Desert",
  "centerLat": 35.0,
  "centerLng": -115.5,
  "minLat": 34.0,
  "maxLat": 37.0,
  "minLng": -117.0,
  "maxLng": -114.0,
  "climate": "Hot Desert",
  "area": 124000,
  "characteristics": ["Arid climate", "Extreme temperatures", "Sparse vegetation", "Unique desert wildlife", "Joshua trees"]
}`
          },
          {
            role: 'user',
            content: `What is the habitat region for: ${location}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const habitatData = JSON.parse(data.choices[0].message.content);

    console.log('Habitat discovered:', habitatData);

    return new Response(JSON.stringify({ 
      success: true,
      habitat: {
        id: `habitat_${habitatData.habitatName.toLowerCase().replace(/\s+/g, '_')}`,
        name: habitatData.habitatName,
        location: {
          lat: habitatData.centerLat,
          lng: habitatData.centerLng
        },
        bounds: {
          ne: { lat: habitatData.maxLat, lng: habitatData.maxLng },
          sw: { lat: habitatData.minLat, lng: habitatData.minLng }
        },
        climate: habitatData.climate,
        area: habitatData.area,
        characteristics: habitatData.characteristics,
        imageUrl: '',
        parkCount: 0,
        keySpecies: [],
        threats: [],
        protectedAreas: []
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habitat-discovery:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
