// MCP Client REPLACEMENT - Direct Supabase Implementation
// Replaces broken MCP server calls with direct database queries

import { supabase } from "@/integrations/supabase/client";

// DEBUG: Log that we are using the Direct Supabase client
console.log('🚀 [Direct Client] Initialized. Bypassing MCP server.');

export interface GetRegionSpeciesArgs {
  ecoregionName: string;
  dietaryCategory?: 'Carnivore' | 'Herbivore' | 'Omnivore' | 'Producer';
  speciesType?: 'Mammal' | 'Bird' | 'Reptile' | 'Amphibian' | 'Fish' | 'Plant' | 'Coral' | 'Invertebrate';
  limit?: number;
  offset?: number;
}

export interface Species {
  id: string;
  scientific_name: string;
  common_name: string | null;
  species_type: string | null;
  dietary_category: string | null;
  conservation_status: string | null;
  image_url: string | null;
  description: string | null;
  is_curated: boolean;
}

export interface GetRegionSpeciesResult {
  success: boolean;
  ecoregion?: {
    id: string;
    name: string;
    biome: string | null;
  };
  species: Species[];
  totalCount: number;
  limit: number;
  offset: number;
  message?: string;
}

// 🦁 FALLBACK DATA: Rich hardcoded species for demo regions if DB is empty
const DEMO_REGIONAL_SPECIES: Record<string, any[]> = {
  'arctic': [
    // Mammals
    { id: 'polar-bear', scientific_name: 'Ursus maritimus', common_name: 'Polar Bear', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'VU', image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/66/Polar_Bear_-_Alaska_%28cropped%29.jpg' },
    { id: 'arctic-fox', scientific_name: 'Vulpes lagopus', common_name: 'Arctic Fox', species_type: 'Mammal', dietary_category: 'Omnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/83/Iceland-1979445_%28cropped_3%29.jpg' },
    { id: 'arctic-wolf', scientific_name: 'Canis lupus arctos', common_name: 'Arctic Wolf', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Arctic_Wolf_in_Aulavik_National_Park_04_%28cropped%29.jpg' },
    { id: 'arctic-hare', scientific_name: 'Lepus arcticus', common_name: 'Arctic Hare', species_type: 'Mammal', dietary_category: 'Herbivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Arctic_Hare_1.jpg' },
    { id: 'musk-ox', scientific_name: 'Ovibos moschatus', common_name: 'Musk Ox', species_type: 'Mammal', dietary_category: 'Herbivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Muskox_%28Ovibos_moschatus%29_male_Dovrefjell_4.jpg' },
    { id: 'caribou', scientific_name: 'Rangifer tarandus', common_name: 'Caribou', species_type: 'Mammal', dietary_category: 'Herbivore', conservation_status: 'NT', image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Reinbukken_p%C3%A5_frisk_gr%C3%B8nt_beite._-_panoramio.jpg' },
    { id: 'walrus', scientific_name: 'Odobenus rosmarus', common_name: 'Walrus', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'VU', image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Walrus_in_the_Russian_Arctic_National_Park%2C_Novaya_Zemlya_2015-2.jpg' },
    { id: 'ringed-seal', scientific_name: 'Pusa hispida', common_name: 'Ringed Seal', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Pusa_hispida_hispida_NOAA_1.jpg' },
    { id: 'bearded-seal', scientific_name: 'Erignathus barbatus', common_name: 'Bearded Seal', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/7/78/Bearded_Seal.jpg' },
    { id: 'harp-seal', scientific_name: 'Pagophilus groenlandicus', common_name: 'Harp Seal', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Harp_Seal_%28Pagophilus_groenlandicus%29%2C_Greenland_Sea_IMG_5075.jpg' },
    { id: 'narwhal', scientific_name: 'Monodon monoceros', common_name: 'Narwhal', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'NT', image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/bc/%D0%9D%D0%B0%D1%80%D0%B2%D0%B0%D0%BB_%D0%B2_%D1%80%D0%BE%D1%81%D1%81%D0%B9%D1%81%D0%BA%D0%BE%D0%B9_%D0%90%D1%80%D0%BA%D1%82%D0%B8%D0%BA%D0%B5.jpg' },
    { id: 'beluga-whale', scientific_name: 'Delphinapterus leucas', common_name: 'Beluga Whale', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e8/Oceanogr%C3%A0fic_29102004.jpg' },
    { id: 'bowhead-whale', scientific_name: 'Balaena mysticetus', common_name: 'Bowhead Whale', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Bowhead_Whale_NOAA.jpg' },
    
    // Birds
    { id: 'snowy-owl', scientific_name: 'Bubo scandiacus', common_name: 'Snowy Owl', species_type: 'Bird', dietary_category: 'Carnivore', conservation_status: 'VU', image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/f1/SnowyOwlAmericanBlackDuck.jpg' },
    { id: 'gyrfalcon', scientific_name: 'Falco rusticolus', common_name: 'Gyrfalcon', species_type: 'Bird', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Falco_rusticolus_white_cropped.jpg' },
    { id: 'willow-ptarmigan', scientific_name: 'Lagopus lagopus', common_name: 'Willow Ptarmigan', species_type: 'Bird', dietary_category: 'Herbivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Lagopus_lagopus_adult_%28Denali%2C_2010%29.jpg' },
    { id: 'rock-ptarmigan', scientific_name: 'Lagopus muta', common_name: 'Rock Ptarmigan', species_type: 'Bird', dietary_category: 'Herbivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/4/46/Rock_ptarmigan_%28Lagopus_muta_islandorum%29_female_breeding_Botnsvatn.jpg' },
    { id: 'arctic-tern', scientific_name: 'Sterna paradisaea', common_name: 'Arctic Tern', species_type: 'Bird', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Arctic_tern_%28Sterna_paradisaea%29_Flatey_3.jpg' },
    { id: 'atlantic-puffin', scientific_name: 'Fratercula arctica', common_name: 'Atlantic Puffin', species_type: 'Bird', dietary_category: 'Carnivore', conservation_status: 'VU', image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Puffin_%28Fratercula_arctica%29.jpg' },

    // Plants (Producers)
    { id: 'bearberry', scientific_name: 'Arctostaphylos uva-ursi', common_name: 'Bearberry', species_type: 'Plant', dietary_category: 'Producer', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Arctostaphylos-uva-ursi.JPG' },
    { id: 'arctic-willow', scientific_name: 'Salix arctica', common_name: 'Arctic Willow', species_type: 'Plant', dietary_category: 'Producer', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Salix_arctica.jpg/1200px-Salix_arctica.jpg' },
    { id: 'purple-saxifrage', scientific_name: 'Saxifraga oppositifolia', common_name: 'Purple Saxifrage', species_type: 'Plant', dietary_category: 'Producer', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Purple_Saxifrage.jpg/1200px-Purple_Saxifrage.jpg' }
  ],
  'antarctic': [
    { id: 'emperor-penguin', scientific_name: 'Aptenodytes forsteri', common_name: 'Emperor Penguin', species_type: 'Bird', dietary_category: 'Carnivore', conservation_status: 'NT', image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Emperor_Penguin_Manchot_empereur.jpg' },
    { id: 'leopard-seal', scientific_name: 'Hydrurga leptonyx', common_name: 'Leopard Seal', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'LC', image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Leopard_seal.jpg' },
    { id: 'blue-whale', scientific_name: 'Balaenoptera musculus', common_name: 'Blue Whale', species_type: 'Mammal', dietary_category: 'Carnivore', conservation_status: 'EN', image_url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Blue_Whale_001_body_bw.jpg' }
  ]
};

/**
 * Get species in an eco-region with filters (Direct DB Version)
 */
export async function getRegionSpecies(
  args: GetRegionSpeciesArgs
): Promise<GetRegionSpeciesResult> {
  console.log('[Direct Client] getRegionSpecies called for:', args.ecoregionName);

  try {
    // 1. Find the ecoregion ID from the name
    const { data: regionData, error: regionError } = await supabase
      .from('ecoregions')
      .select('id, name, biome')
      .ilike('name', args.ecoregionName) // Case-insensitive match
      .maybeSingle();

    if (regionError) {
      console.error('[Direct Client] Error finding region:', regionError);
      // Fallback for demo if DB error
      const demoKey = Object.keys(DEMO_REGIONAL_SPECIES).find(k => args.ecoregionName.toLowerCase().includes(k));
      if (demoKey) {
        console.log(`[Direct Client] Using DEMO fallback for ${args.ecoregionName}`);
        return {
          success: true,
          ecoregion: { id: 'demo-region', name: args.ecoregionName, biome: 'Demo Biome' },
          species: DEMO_REGIONAL_SPECIES[demoKey].map(s => mapDemoSpecies(s)),
          totalCount: DEMO_REGIONAL_SPECIES[demoKey].length,
          limit: 20,
          offset: 0
        };
      }
      throw new Error(`Database error: ${regionError.message}`);
    }

    if (!regionData) {
      console.warn('[Direct Client] Region not found in DB:', args.ecoregionName);
      // Check demo fallback before giving up
      const demoKey = Object.keys(DEMO_REGIONAL_SPECIES).find(k => args.ecoregionName.toLowerCase().includes(k));
      if (demoKey) {
        console.log(`[Direct Client] Using DEMO fallback for ${args.ecoregionName}`);
        return {
          success: true,
          ecoregion: { id: 'demo-region', name: args.ecoregionName, biome: 'Demo Biome' },
          species: DEMO_REGIONAL_SPECIES[demoKey].map(s => mapDemoSpecies(s)),
          totalCount: DEMO_REGIONAL_SPECIES[demoKey].length,
          limit: 20,
          offset: 0
        };
      }

      return {
        success: false,
        species: [],
        totalCount: 0,
        limit: args.limit || 10,
        offset: args.offset || 0,
        message: `Region '${args.ecoregionName}' not found in database.`
      };
    }

    // 2. Call the balanced species RPC function
    // Note: The RPC signature is (p_ecoregion_id, p_species_per_class, p_exclude_species)
    // We map the "limit" arg to "species_per_class" roughly (dividing by 6 groups)
    const speciesPerClass = Math.ceil((args.limit || 18) / 6);

    const { data: speciesData, error: speciesError } = await supabase
      .rpc('get_balanced_ecoregion_species', {
        p_ecoregion_id: regionData.id,
        p_species_per_class: speciesPerClass
      });

    if (speciesError) {
      console.error('[Direct Client] Error fetching species:', speciesError);
      throw new Error(`Species fetch error: ${speciesError.message}`);
    }

    // 3. Map the RPC result to the frontend Species interface
    let mappedSpecies: Species[] = (speciesData || []).map((s: any) => ({
      id: s.id,
      scientific_name: s.scientific_name,
      common_name: s.common_name,
      species_type: s.class, // Mapping class to species_type (rough approximation)
      dietary_category: determineDiet(s.taxonomic_group), // Helper to guess diet
      conservation_status: s.conservation_status,
      image_url: s.image_url,
      description: `A ${s.taxonomic_group} found in ${regionData.name}.`,
      is_curated: false
    }));

    // If DB returned empty (maybe no data yet), use fallback if available
    if (mappedSpecies.length === 0) {
      const demoKey = Object.keys(DEMO_REGIONAL_SPECIES).find(k => args.ecoregionName.toLowerCase().includes(k));
      if (demoKey) {
        console.log(`[Direct Client] DB empty, using DEMO fallback for ${args.ecoregionName}`);
        mappedSpecies = DEMO_REGIONAL_SPECIES[demoKey].map(s => mapDemoSpecies(s));
      }
    }

    return {
      success: true,
      ecoregion: {
        id: regionData.id,
        name: regionData.name,
        biome: regionData.biome
      },
      species: mappedSpecies,
      totalCount: mappedSpecies.length,
      limit: args.limit || 20,
      offset: args.offset || 0
    };

  } catch (err: any) {
    console.error('[Direct Client] Critical error:', err);
    return {
      success: false,
      species: [],
      totalCount: 0,
      limit: 0,
      offset: 0,
      message: err.message
    };
  }
}

// Helper to map demo species to Species interface
function mapDemoSpecies(s: any): Species {
  return {
    id: s.id,
    scientific_name: s.scientific_name,
    common_name: s.common_name,
    species_type: s.species_type,
    dietary_category: s.dietary_category,
    conservation_status: s.conservation_status,
    image_url: s.image_url,
    description: `A ${s.species_type} found in this region.`,
    is_curated: true
  };
}

// Helper to guess diet based on group (imperfect but functional for fallback)
function determineDiet(group: string): string {
  if (group === 'Plants') return 'Producer';
  if (group === 'Carnivore') return 'Carnivore'; // If DB has it
  return 'Omnivore'; // Default safe guess
}


export interface GetSpeciesDetailsArgs {
  speciesId: string;
}

export interface GetSpeciesDetailsResult {
  success: boolean;
  species?: any;
  message?: string;
}

/**
 * Get detailed information about a specific species
 */
export async function getSpeciesDetails(
  args: GetSpeciesDetailsArgs
): Promise<GetSpeciesDetailsResult> {
  // Check if ID is a UUID (real DB id) or a simple string (demo id)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(args.speciesId);

  if (!isUuid) {
    // It's a demo ID, look it up in fallback list
    for (const regionKey in DEMO_REGIONAL_SPECIES) {
      const found = DEMO_REGIONAL_SPECIES[regionKey].find(s => s.id === args.speciesId);
      if (found) {
        return { success: true, species: mapDemoSpecies(found) };
      }
    }
    return { success: false, message: "Species not found (Demo ID)" };
  }

  const { data, error } = await supabase
    .from('species')
    .select('*')
    .eq('id', args.speciesId)
    .single();
    
  if (error) {
    return { success: false, message: error.message };
  }
  
  return { success: true, species: data };
}

export interface GetEcoregionInfoArgs {
  ecoregionName: string;
}

export interface EcoregionInfo {
  id: string;
  ecoregion_id: string;
  name: string;
  biome: string;
  backgroundColor: string; // For 2D game!
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
}

export interface GetEcoregionInfoResult {
  success: boolean;
  ecoregions?: EcoregionInfo[];
  count?: number;
  message?: string;
}

/**
 * Get eco-region info with biome colors for 2D game backgrounds
 */
export async function getEcoregionInfo(
  args: GetEcoregionInfoArgs
): Promise<GetEcoregionInfoResult> {
    const { data, error } = await supabase
      .from('ecoregions')
      .select('*')
      .ilike('name', args.ecoregionName);

    if (error || !data) {
        return { success: false, message: error?.message || "Not found" };
    }

    const mappedRegions: EcoregionInfo[] = data.map((r: any) => ({
        id: r.id,
        ecoregion_id: r.unique_id || r.id,
        name: r.name,
        biome: r.biome,
        backgroundColor: '#2d3748', // Default dark gray
        center_lat: null,
        center_lng: null,
        radius_km: null
    }));

    return {
        success: true,
        ecoregions: mappedRegions,
        count: mappedRegions.length
    };
}

// ============================================================================
// MOCK IMPLEMENTATIONS FOR AI FEATURES (Since MCP is offline)
// ============================================================================

export interface GenerateColorThemeArgs {
  ecoregionName: string;
  biome?: string;
  description?: string;
}

export interface GenerateColorThemeResult {
  success: boolean;
  theme?: any;
  baseHue?: number;
  characteristics?: any;
  message?: string;
}

export async function generateColorTheme(
  args: GenerateColorThemeArgs
): Promise<GenerateColorThemeResult> {
  // Static fallback theme
  return {
    success: true,
    theme: {
      primary: "hsl(140, 70%, 50%)",
      secondary: "hsl(160, 60%, 40%)",
      background: "hsl(140, 30%, 10%)",
      text: "hsl(0, 0%, 95%)",
      accent: "hsl(35, 90%, 60%)"
    },
    message: "Offline fallback theme generated"
  };
}

export interface GenerateCartoonAsciiArgs {
  commonName: string;
  scientificName: string;
  animalType?: string;
  width?: number;
}

export interface GenerateCartoonAsciiResult {
  success: boolean;
  cartoonUrl?: string;
  commonName?: string;
  scientificName?: string;
  width?: number;
  message?: string;
}

export async function generateCartoonAscii(
  args: GenerateCartoonAsciiArgs
): Promise<GenerateCartoonAsciiResult> {
    return {
        success: false,
        message: "ASCII generation unavailable (Offline Mode)"
    };
}

export interface GenerateFastVisualDescriptionArgs {
  scientificName: string;
  commonName: string;
  animalType: string;
  imageUrl?: string;
  ecoregion?: string;
}

export interface GenerateFastVisualDescriptionResult {
  success: boolean;
  description?: string;
  method?: string;
  timestamp?: string;
  error?: string;
}

export async function generateFastVisualDescription(
  args: GenerateFastVisualDescriptionArgs
): Promise<GenerateFastVisualDescriptionResult> {
    return {
        success: true,
        description: `A beautiful ${args.commonName} (${args.scientificName}).`,
        method: "offline-fallback"
    };
}