/**
 * Smart Ecoregion Resolver
 * 
 * Uses LLM to map species to WWF ecoregion IDs, then looks up coordinates
 * from our local database. NO HARDCODING - scales to infinite species!
 * 
 * Flow:
 * 1. User searches "polar bear"
 * 2. LLM returns ecoregion IDs: ["NA0201", "NA0203", "PA0501", ...]
 * 3. Look up coordinates from ecoregions.json (instant!)
 * 4. Cache the mapping for future searches
 */

import terrestrialEcoregions from '@/data/terrestrialEcoregions.json';
import marineEcoregions from '@/data/marineEcoregions.json';
import freshwaterEcoregions from '@/data/freshwaterEcoregions.json';
import { filterValidEcoregions, getHabitatType } from './coordinateValidator';

export interface EcoregionData {
  id: string;
  name: string;
  biome?: string;
  realm: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
}

export interface SpeciesEcoregionMapping {
  species: string;
  ecoregionIds: string[];
  habitat: 'terrestrial' | 'marine' | 'freshwater' | 'mixed';
  timestamp: Date;
}

// In-memory cache (will grow as users search)
const speciesCache: Map<string, SpeciesEcoregionMapping> = new Map();

/**
 * Resolve a species to its ecoregions using LLM + database lookup
 */
export async function resolveSpeciesToEcoregions(
  speciesName: string,
  openaiApiKey?: string
): Promise<{
  success: boolean;
  ecoregions: EcoregionData[];
  source: 'cache' | 'llm' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
}> {
  try {
    const normalized = speciesName.toLowerCase().trim();

    // 1. Check cache first
    if (speciesCache.has(normalized)) {
      const cached = speciesCache.get(normalized)!;
      const rawEcoregions = lookupEcoregionsByIds(cached.ecoregionIds, cached.habitat);
      
      // ✅ VALIDATE: Filter out invalid coordinates (e.g., land animals in ocean)
      const ecoregions = filterValidEcoregions(rawEcoregions, cached.habitat);
      
      if (ecoregions.length > 0) {
        console.log(`✅ Cache hit for "${speciesName}" (${ecoregions.length} valid ecoregions, ${rawEcoregions.length - ecoregions.length} filtered)`);
        return {
          success: true,
          ecoregions,
          source: 'cache',
          confidence: 'high'
        };
      }
      // If all were filtered out, fall through to try again
      console.warn(`⚠️ Cache hit but all ecoregions filtered out for "${speciesName}", retrying...`);
      speciesCache.delete(normalized); // Clear bad cache
    }

    // 2. Query LLM for ecoregion IDs
    console.log(`🤖 Asking LLM for ecoregion IDs for "${speciesName}"...`);
    
    // ✅ DETECT MARINE SPECIES: Check species name FIRST before asking LLM
    const marineKeywords = ['shark', 'whale', 'dolphin', 'seal', 'orca', 'tuna', 'marlin', 'ray', 'squid', 'octopus', 'jellyfish', 'coral', 'barracuda', 'sea turtle', 'sea lion'];
    const isMarineSpecies = marineKeywords.some(keyword => speciesName.toLowerCase().includes(keyword));
    
    const prompt = `You are an expert biogeographer. Given a species name, identify the WWF ecoregion IDs where this species naturally occurs.

Species: ${speciesName}

${isMarineSpecies ? '⚠️ THIS IS A MARINE SPECIES - habitat MUST be "marine"!' : ''}

Return ONLY a JSON object (no markdown, no explanations):
{
  "ecoregionIds": ["ID1", "ID2", "ID3"],
  "habitat": "${isMarineSpecies ? 'marine' : 'terrestrial or marine or freshwater or mixed'}",
  "confidence": "high" or "medium" or "low"
}

Guidelines:
- For wide-ranging species (polar bears, whales, etc.), include ALL regions (4-6 IDs)
- For localized species, include 1-2 primary regions
- WWF ecoregion IDs are numeric (e.g., "61404", "20192")
- Use your knowledge of biogeography to infer the correct ecoregion IDs
- If uncertain, return fewer IDs with "low" confidence
- MARINE SPECIES: sharks, whales, dolphins, seals = "marine" habitat ONLY!

Examples:
- Polar bears: terrestrial Arctic tundra ecoregions
- Blue whales: marine ocean ecoregions  
- Great white sharks: marine ocean ecoregions
- Desert tortoises: terrestrial desert ecoregions`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey || import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cheaper, faster model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500
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

    // Parse LLM response
    const llmResponse = JSON.parse(content.trim());
    let { ecoregionIds, habitat, confidence } = llmResponse;
    
    // ✅ FORCE CORRECTION: If marine keywords detected but LLM said terrestrial, override
    if (isMarineSpecies && habitat !== 'marine') {
      console.warn(`⚠️ LLM returned "${habitat}" for marine species "${speciesName}", forcing to "marine"`);
      habitat = 'marine';
    }

    if (!ecoregionIds || ecoregionIds.length === 0) {
      throw new Error('No ecoregion IDs returned from LLM');
    }

    // 3. Look up coordinates from database
    const rawEcoregions = lookupEcoregionsByIds(ecoregionIds, habitat || 'terrestrial');

    // ✅ VALIDATE: Filter out invalid coordinates
    const ecoregions = filterValidEcoregions(rawEcoregions, habitat || 'terrestrial');

    if (ecoregions.length === 0) {
      throw new Error(`No valid ecoregions found (${rawEcoregions.length} raw, ${rawEcoregions.length - ecoregions.length} filtered as invalid)`);
    }

    // 4. Cache this mapping (only cache valid IDs)
    const validIds = ecoregions.map(e => e.id);
    speciesCache.set(normalized, {
      species: speciesName,
      ecoregionIds: validIds,
      habitat: habitat || 'terrestrial',
      timestamp: new Date()
    });

    console.log(`✅ Resolved "${speciesName}" to ${ecoregions.length} valid ecoregions (${confidence} confidence, filtered ${rawEcoregions.length - ecoregions.length} invalid)`);

    return {
      success: true,
      ecoregions,
      source: 'llm',
      confidence: confidence || 'medium'
    };

  } catch (error) {
    console.error('Error resolving species to ecoregions:', error);

    // Fallback: Try to guess based on species name patterns
    const rawFallback = getFallbackEcoregions(speciesName);
    
    // ✅ VALIDATE: Filter fallback ecoregions too
    const fallbackEcoregions = filterValidEcoregions(rawFallback, 'terrestrial'); // Assume terrestrial for fallback
    
    if (fallbackEcoregions.length > 0) {
      console.log(`⚠️  Using fallback for "${speciesName}" (${fallbackEcoregions.length} valid ecoregions, ${rawFallback.length - fallbackEcoregions.length} filtered)`);
      return {
        success: true,
        ecoregions: fallbackEcoregions,
        source: 'fallback',
        confidence: 'low'
      };
    }

    return {
      success: false,
      ecoregions: [],
      source: 'fallback',
      confidence: 'low'
    };
  }
}

/**
 * Look up ecoregions by their IDs in our local database
 */
function lookupEcoregionsByIds(
  ecoregionIds: string[],
  habitat: 'terrestrial' | 'marine' | 'freshwater' | 'mixed'
): EcoregionData[] {
  const ecoregions: EcoregionData[] = [];

  for (const id of ecoregionIds) {
    // Try terrestrial first
    if (habitat === 'terrestrial' || habitat === 'mixed') {
      const terr = (terrestrialEcoregions as any)[id];
      if (terr) {
        ecoregions.push(terr);
        continue;
      }
    }

    // Try marine
    if (habitat === 'marine' || habitat === 'mixed') {
      const marine = (marineEcoregions as any)[id];
      if (marine) {
        ecoregions.push(marine);
        continue;
      }
    }

    // Try freshwater
    if (habitat === 'freshwater' || habitat === 'mixed') {
      const fresh = (freshwaterEcoregions as any)[id];
      if (fresh) {
        ecoregions.push(fresh);
        continue;
      }
    }
  }

  return ecoregions;
}

/**
 * Fallback: Return some ecoregions based on simple pattern matching
 * This is a last resort if LLM fails
 */
function getFallbackEcoregions(speciesName: string): EcoregionData[] {
  const name = speciesName.toLowerCase();
  const keywords = [
    'forests', 'mangroves', 'pine', 'montane', 'dry', 'moist', 'xeric', 'scrub',
    'savanna', 'puna', 'steppe', 'taiga', 'tundra', 'islands', 'coastal', 
    'valley', 'highlands', 'lowlands', 'deserts', 'grasslands', 'wetlands', 'swamp'
  ];

  for (const keyword of keywords) {
    if (name.includes(keyword)) {
      return Object.values(terrestrialEcoregions as any).filter((eco: any) =>
        eco.name.toLowerCase().includes(keyword)
      ).slice(0, 5);
    }
  }

  // Original fallback logic
  if (name.includes('arctic') || name.includes('polar')) {
    return Object.values(terrestrialEcoregions as any).filter((eco: any) => 
      eco.name.toLowerCase().includes('arctic') || 
      eco.name.toLowerCase().includes('tundra')
    ).slice(0, 5);
  }

  if (name.includes('desert') || name.includes('arid')) {
    return Object.values(terrestrialEcoregions as any).filter((eco: any) =>
      eco.name.toLowerCase().includes('desert') ||
      eco.biome === '13.0' // Desert biome
    ).slice(0, 3);
  }

  if (name.includes('rainforest') || name.includes('tropical')) {
    return Object.values(terrestrialEcoregions as any).filter((eco: any) =>
      eco.name.toLowerCase().includes('rainforest') ||
      eco.name.toLowerCase().includes('tropical')
    ).slice(0, 4);
  }

  if (name.includes('ocean') || name.includes('whale') || name.includes('shark')) {
    return Object.values(marineEcoregions as any).slice(0, 5);
  }

  if (name.includes('river') || name.includes('lake') || name.includes('freshwater') || name.includes('salmon') || name.includes('trout')) {
    return Object.values(freshwaterEcoregions as any).slice(0, 5);
  }

  return [];
}

/**
 * Clear the species cache (useful for testing)
 */
export function clearSpeciesCache() {
  speciesCache.clear();
  console.log('🗑️  Species cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: speciesCache.size,
    species: Array.from(speciesCache.keys())
  };
}

