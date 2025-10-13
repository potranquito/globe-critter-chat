/**
 * Habitat Resolver Service
 * Uses OpenAI to intelligently map species/locations to ecosystem zones
 * Faster than multiple API calls, uses LLM knowledge for instant results
 */

export interface HabitatZone {
  name: string;
  type: 'ecosystem' | 'biome' | 'region';
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  description: string;
  climate?: string;
  biodiversityLevel?: 'low' | 'medium' | 'high' | 'very high';
  species?: string; // The species this habitat is for (if applicable)
  location?: string; // The location this habitat is for (if applicable)
}

export interface HabitatResolution {
  success: boolean;
  habitat: HabitatZone;
  habitats?: HabitatZone[]; // Multiple habitat zones for species with wide ranges
  confidence: 'high' | 'medium' | 'low';
  needsApiValidation: boolean; // True if LLM is uncertain and we should verify with APIs
}

/**
 * Resolve a species name to its habitat zones (can be multiple for wide-ranging species)
 * Uses OpenAI to get instant habitat information
 */
export async function resolveSpeciesHabitat(
  speciesName: string,
  openaiApiKey?: string
): Promise<HabitatResolution> {
  try {
    console.log(`🤖 Resolving habitats for species: ${speciesName}`);

    // Use OpenAI to get habitat information
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a wildlife biogeographer. Given a species name, identify ALL major geographic regions where this species naturally occurs.

CRITICAL: For wide-ranging species (like polar bears), you MUST include EVERY country/region where they live:
- Polar bears: Alaska, Canada, Greenland, Russia (Wrangel Island, Chukotka, Kara Sea), Svalbard/Norway
- Brown bears: North America, Europe, Russia, Asia
- Tigers: India, Russia, China, Southeast Asia, etc.

Return ONLY a JSON object (no markdown, no code blocks, no explanation) with this EXACT structure:
{
  "habitats": [
    {
      "name": "Specific region name (e.g., 'Arctic Alaska (Beaufort Sea)', 'Russian Arctic (Wrangel Island)')",
      "type": "ecosystem",
      "centerLat": 70.5,
      "centerLng": -155.0,
      "radiusKm": 350,
      "description": "One sentence description",
      "climate": "Polar",
      "biodiversityLevel": "medium"
    }
  ],
  "confidence": "high"
}

IMPORTANT RULES:
1. List 4-6 habitats for wide-ranging species (don't miss any countries!)
2. List 1-2 habitats for localized/endemic species
3. Use precise coordinates for each habitat center
4. RadiusKm should reflect habitat size (100-800km typical)`
          },
          {
            role: 'user',
            content: speciesName
          }
        ],
        temperature: 0.3,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse the JSON response
    const responseData = JSON.parse(content.trim());

    const habitats: HabitatZone[] = responseData.habitats.map((h: any) => ({
      name: h.name,
      type: h.type || 'ecosystem',
      centerLat: h.centerLat,
      centerLng: h.centerLng,
      radiusKm: h.radiusKm || 200,
      description: h.description,
      climate: h.climate,
      biodiversityLevel: h.biodiversityLevel || 'medium',
      species: speciesName
    }));

    const confidence = responseData.confidence || 'high';
    const needsApiValidation = confidence === 'low';

    console.log(`✅ Resolved ${speciesName} to ${habitats.length} habitat zone(s) (${confidence} confidence)`);

    return {
      success: true,
      habitat: habitats[0], // Primary habitat for backwards compatibility
      habitats, // All habitats
      confidence,
      needsApiValidation
    };
  } catch (error) {
    console.error('Error resolving species habitat with OpenAI:', error);

    // NEW: Use smart ecoregion resolver (no hardcoding!)
    try {
      const { resolveSpeciesToEcoregions } = await import('./smartEcoregionResolver');
      const ecoResult = await resolveSpeciesToEcoregions(speciesName, openaiApiKey);
      
      if (ecoResult.success && ecoResult.ecoregions.length > 0) {
        const habitats = ecoResult.ecoregions.map(eco => ({
          name: eco.name,
          type: 'ecosystem' as const,
          centerLat: eco.centerLat,
          centerLng: eco.centerLng,
          radiusKm: eco.radiusKm,
          description: `${eco.name} - ${eco.realm}`,
          climate: eco.biome || 'Unknown',
          biodiversityLevel: 'medium' as const,
          species: speciesName
        }));

        console.log(`✅ Smart resolver found ${habitats.length} ecoregions for ${speciesName}`);

        return {
          success: true,
          habitat: habitats[0],
          habitats,
          confidence: ecoResult.confidence,
          needsApiValidation: false
        };
      }
    } catch (resolverError) {
      console.error('Smart ecoregion resolver also failed:', resolverError);
    }

    throw new Error(`Failed to resolve habitat for ${speciesName}`);
  }
}

/**
 * Resolve a location name to its ecosystem zone
 * Uses OpenAI to understand what ecosystem this location is part of
 */
export async function resolveLocationEcosystem(
  locationName: string,
  openaiApiKey?: string
): Promise<HabitatResolution> {
  try {
    console.log(`🤖 Resolving ecosystem for location: ${locationName}`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a geographic and ecological expert. Given a location name, identify the PRIMARY ecosystem/habitat zone it belongs to. Return ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "name": "Ecosystem name (e.g., 'Mojave Desert', 'Pacific Temperate Rainforest')",
  "type": "ecosystem or biome or region",
  "centerLat": latitude of ecosystem center,
  "centerLng": longitude of ecosystem center,
  "radiusKm": approximate radius of this ecosystem zone,
  "description": "Brief 1-sentence description of this ecosystem",
  "climate": "Climate type",
  "biodiversityLevel": "low or medium or high or very high",
  "confidence": "high or medium or low"
}

Focus on the natural ecosystem, not just the city coordinates. For example, Las Vegas → Mojave Desert ecosystem.`
          },
          {
            role: 'user',
            content: locationName
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const habitatData = JSON.parse(content.trim());

    const habitat: HabitatZone = {
      name: habitatData.name,
      type: habitatData.type || 'ecosystem',
      centerLat: habitatData.centerLat,
      centerLng: habitatData.centerLng,
      radiusKm: habitatData.radiusKm || 150,
      description: habitatData.description,
      climate: habitatData.climate,
      biodiversityLevel: habitatData.biodiversityLevel || 'medium',
      location: locationName
    };

    const confidence = habitatData.confidence || 'high';
    const needsApiValidation = confidence === 'low';

    console.log(`✅ Resolved ${locationName} to ${habitat.name} (${confidence} confidence)`);

    return {
      success: true,
      habitat,
      confidence,
      needsApiValidation
    };
  } catch (error) {
    console.error('Error resolving location ecosystem:', error);
    throw new Error(`Failed to resolve ecosystem for ${locationName}`);
  }
}

// ✅ REMOVED: No more hardcoded fallback data!
// All species now resolved dynamically using smartEcoregionResolver.ts

/**
 * Check if OpenAI API key is configured
 */
export function hasOpenAIKey(): boolean {
  return !!import.meta.env.VITE_OPENAI_API_KEY;
}
