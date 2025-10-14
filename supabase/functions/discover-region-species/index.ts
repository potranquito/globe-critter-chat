import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Strategy 1: Query IUCN species data directly from database using sample_points
    console.log('Querying IUCN species database...');

    // First, find the ecoregion by name or bounds
    let ecoregionId: string | null = null;

    // Try to find ecoregion by name first
    if (regionName && regionName !== 'Unknown Region') {
      const { data: ecoregionData } = await supabase
        .from('ecoregions')
        .select('id')
        .ilike('name', `%${regionName}%`)
        .limit(1)
        .single();

      if (ecoregionData) {
        ecoregionId = ecoregionData.id;
        console.log(`Found ecoregion by name: ${ecoregionId}`);
      }
    }

    // If we found an ecoregion, use the balanced species function (fastest and most diverse)
    if (ecoregionId) {
      const speciesPerClass = Math.max(2, Math.floor(limit / 6)); // Distribute across ~6 taxonomic groups

      const { data: speciesData, error } = await supabase.rpc(
        'get_balanced_ecoregion_species',
        {
          p_ecoregion_id: ecoregionId,
          p_species_per_class: speciesPerClass,
          p_exclude_species: excludeSpecies
        }
      );

      if (error) {
        console.warn('Error querying balanced species:', error);
      } else if (speciesData && speciesData.length > 0) {
        const topSpecies = speciesData.map((item: any) => ({
          scientificName: item.scientific_name,
          commonName: item.common_name,
          animalType: item.class,
          kingdom: item.kingdom,
          conservationStatus: item.conservation_status,
          imageUrl: item.image_url,
          occurrenceCount: Math.round(item.overlap_percentage || 50),
          taxonomicGroup: item.taxonomic_group
        }));

        console.log(`Found ${topSpecies.length} balanced species from IUCN database`);

        // Log diversity breakdown
        const groupCounts = topSpecies.reduce((acc: any, s: any) => {
          acc[s.taxonomicGroup] = (acc[s.taxonomicGroup] || 0) + 1;
          return acc;
        }, {});
        console.log('Taxonomic diversity:', groupCounts);

        if (topSpecies.length > 0) {
          return new Response(JSON.stringify({
            success: true,
            species: topSpecies,
            count: topSpecies.length,
            region: regionName,
            source: 'iucn_database',
            diversity: groupCounts
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // Strategy 2: Direct spatial query using balanced selection (if junction table is empty)
    console.log('Trying balanced spatial query...');

    const speciesPerClass = Math.max(2, Math.floor(limit / 6)); // Distribute across ~6 taxonomic groups

    const { data: spatialSpecies, error: spatialError } = await supabase.rpc(
      'get_balanced_spatial_species',
      {
        p_region_lat: bounds.centerLat,
        p_region_lng: bounds.centerLng,
        p_radius_degrees: Math.max(
          Math.abs(bounds.maxLat - bounds.minLat),
          Math.abs(bounds.maxLng - bounds.minLng)
        ) / 2,
        p_species_per_class: speciesPerClass,
        p_exclude_species: excludeSpecies
      }
    );

    if (!spatialError && spatialSpecies && spatialSpecies.length > 0) {
      const topSpecies = spatialSpecies.map((s: any) => ({
        scientificName: s.scientific_name,
        commonName: s.common_name,
        animalType: s.class,
        kingdom: s.kingdom,
        conservationStatus: s.conservation_status,
        imageUrl: s.image_url,
        occurrenceCount: 10, // Default since we don't have count
        taxonomicGroup: s.taxonomic_group
      }));

      console.log(`Found ${topSpecies.length} balanced species from spatial query`);

      // Log diversity breakdown
      const groupCounts = topSpecies.reduce((acc: any, s: any) => {
        acc[s.taxonomicGroup] = (acc[s.taxonomicGroup] || 0) + 1;
        return acc;
      }, {});
      console.log('Taxonomic diversity:', groupCounts);

      if (topSpecies.length > 0) {
        return new Response(JSON.stringify({
          success: true,
          species: topSpecies,
          count: topSpecies.length,
          region: regionName,
          source: 'iucn_spatial',
          diversity: groupCounts
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Strategy 3: Fallback to GBIF if IUCN data is not available
    console.log('Falling back to GBIF API...');
    const gbifUrl = `https://api.gbif.org/v1/occurrence/search?hasCoordinate=true&decimalLatitude=${bounds.minLat},${bounds.maxLat}&decimalLongitude=${bounds.minLng},${bounds.maxLng}&limit=1000`;

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

    // Strategy 4: Use LLM to enrich GBIF data with common names and types
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
