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
    const { bounds, speciesName } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log(`Analyzing habitat region for ${speciesName}...`);
    console.log('Bounds:', bounds);

    // Use AI to identify the habitat region
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
            content: `You are a biogeographer and ecologist. Analyze geographic bounds and identify the habitat region, ecosystem type, and climate zone.

Return JSON with:
- regionName: The common name for this habitat region (e.g., "Arctic Tundra", "Amazon Rainforest", "Great Barrier Reef")
- ecosystemType: Type of ecosystem (e.g., "Tundra", "Tropical Rainforest", "Coral Reef", "Desert", "Temperate Forest")
- climate: Climate classification (e.g., "Polar", "Tropical", "Temperate", "Arid")
- biome: Biome name (e.g., "Arctic", "Neotropical", "Marine", "Desert")
- characteristics: Array of 3-5 key habitat characteristics
- threatFactors: Array of 2-4 main environmental threats in this region

Example for Arctic:
{
  "regionName": "Arctic Tundra",
  "ecosystemType": "Tundra",
  "climate": "Polar",
  "biome": "Arctic",
  "characteristics": ["Permafrost soil", "Low biodiversity", "Extreme cold", "Short growing season", "Sea ice dependence"],
  "threatFactors": ["Climate change", "Sea ice loss", "Oil drilling", "Shipping traffic"]
}

Example for Amazon:
{
  "regionName": "Amazon Rainforest",
  "ecosystemType": "Tropical Rainforest",
  "climate": "Tropical",
  "biome": "Neotropical",
  "characteristics": ["High biodiversity", "Dense canopy", "Year-round warmth", "Heavy rainfall", "Layered forest structure"],
  "threatFactors": ["Deforestation", "Illegal logging", "Agricultural expansion", "Climate change"]
}`
          },
          {
            role: 'user',
            content: `Analyze this habitat region for ${speciesName}:

Geographic bounds:
- Latitude: ${bounds.minLat}° to ${bounds.maxLat}°
- Longitude: ${bounds.minLng}° to ${bounds.maxLng}°
- Center: ${bounds.centerLat}°, ${bounds.centerLng}°

What habitat region and ecosystem type is this?`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const regionData = JSON.parse(data.choices[0].message.content);

    console.log('Region identified:', regionData.regionName);

    return new Response(JSON.stringify({
      success: true,
      region: {
        ...regionData,
        bounds,
        analyzedFor: speciesName
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in analyze-habitat-region:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
