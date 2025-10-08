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
    const { bounds, regionName, excludeSpecies, limit = 20 } = await req.json();

    console.log(`Discovering species in ${regionName}...`);
    console.log('Bounds:', bounds);
    console.log('Excluding:', excludeSpecies);

    // Strategy 1: GBIF bounding box search (fast, real data)
    const gbifUrl = `https://api.gbif.org/v1/occurrence/search?hasCoordinate=true&decimalLatitude=${bounds.minLat},${bounds.maxLat}&decimalLongitude=${bounds.minLng},${bounds.maxLng}&limit=1000`;

    console.log('Fetching from GBIF:', gbifUrl);

    const gbifResponse = await fetch(gbifUrl);

    if (!gbifResponse.ok) {
      throw new Error(`GBIF API error: ${gbifResponse.status}`);
    }

    const gbifData = await gbifResponse.json();

    console.log(`GBIF returned ${gbifData.results?.length || 0} occurrences`);

    // Count occurrences per species
    const speciesCounts = new Map();
    gbifData.results?.forEach((record: any) => {
      if (record.scientificName && record.scientificName !== excludeSpecies) {
        const count = speciesCounts.get(record.scientificName) || 0;
        speciesCounts.set(record.scientificName, count + 1);
      }
    });

    // Sort by occurrence count
    const topSpecies = Array.from(speciesCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({
        scientificName: name,
        occurrenceCount: count
      }));

    console.log(`Found ${topSpecies.length} unique species via GBIF`);

    // Strategy 2: Use LLM to enrich with common names and types
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      console.warn('No OPENAI_API_KEY - returning GBIF data only');
      // Return GBIF data only if no LLM
      return new Response(JSON.stringify({
        success: true,
        species: topSpecies,
        count: topSpecies.length,
        source: 'gbif'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Enrich with LLM data
    console.log('Enriching species data with OpenAI...');

    const enrichmentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a taxonomist. For each scientific name, provide common name, animal type, and conservation status. Return JSON with "species" array.

Format:
{
  "species": [
    {
      "scientificName": "Ursus maritimus",
      "commonName": "Polar Bear",
      "animalType": "Mammal",
      "conservationStatus": "VU",
      "imageKeyword": "polar bear arctic"
    }
  ]
}

Animal types: Mammal, Bird, Fish, Reptile, Amphibian, Insect, Plant, Other
Conservation status: CR (Critically Endangered), EN (Endangered), VU (Vulnerable), NT (Near Threatened), LC (Least Concern), DD (Data Deficient), NE (Not Evaluated)

If unknown, use: commonName = scientificName, animalType = "Other", conservationStatus = "NE"`
          },
          {
            role: 'user',
            content: `Enrich these species from ${regionName}:\n\n${topSpecies.map(s => s.scientificName).slice(0, 30).join('\n')}`
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!enrichmentResponse.ok) {
      console.warn('LLM enrichment failed, using GBIF data only');
      return new Response(JSON.stringify({
        success: true,
        species: topSpecies,
        count: topSpecies.length,
        source: 'gbif'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const enrichmentData = await enrichmentResponse.json();
    const parsedEnrichment = JSON.parse(enrichmentData.choices[0].message.content);

    // Merge GBIF counts with LLM enrichment
    const finalSpecies = topSpecies.map(species => {
      const enriched = parsedEnrichment.species?.find(
        (e: any) => e.scientificName === species.scientificName
      );

      return {
        ...species,
        commonName: enriched?.commonName || species.scientificName,
        animalType: enriched?.animalType || 'Other',
        conservationStatus: enriched?.conservationStatus || 'NE',
        imageKeyword: enriched?.imageKeyword || species.scientificName
      };
    });

    console.log(`Enriched ${finalSpecies.length} species successfully`);

    return new Response(JSON.stringify({
      success: true,
      species: finalSpecies,
      count: finalSpecies.length,
      region: regionName,
      source: 'gbif+llm'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in discover-region-species:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
