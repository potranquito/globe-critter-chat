// MCP Client for connecting React frontend to MCP server
// Uses JSON-RPC 2.0 protocol over HTTP

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000/mcp';

// DEBUG: Show actual MCP server URL at module load time
console.error('🚀 [MCP Client] MODULE LOADED - Server URL:', MCP_SERVER_URL);
console.error('🚀 [MCP Client] Environment variable:', import.meta.env.VITE_MCP_SERVER_URL);
console.error('🚀 [MCP Client] TIMESTAMP:', new Date().toISOString());

// VISIBLE ALERT for debugging
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const msg = `MCP Server URL: ${MCP_SERVER_URL}`;
    console.error('🔴🔴🔴 ALERT:', msg);
    // Uncomment to show browser alert:
    // alert(msg);
  }, 1000);
}

interface MCPRequest {
  jsonrpc: '2.0';
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
  id: number;
}

interface MCPResponse {
  jsonrpc: '2.0';
  result?: {
    content: Array<{
      type: 'text';
      text: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
  id: number;
}

let requestId = 0;

/**
 * Call an MCP tool
 */
export async function callMCPTool<T = any>(
  toolName: string,
  args: Record<string, any>
): Promise<T> {
  requestId++;

  const request: MCPRequest = {
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    },
    id: requestId
  };

  console.log('[MCP Client] 🔧 Calling tool:', toolName, args);

  try {
    // Add cache-busting timestamp to force fresh requests
    const cacheBustUrl = `${MCP_SERVER_URL}?t=${Date.now()}`;
    console.log('[MCP Client] 🌐 Fetching from:', cacheBustUrl.substring(0, 50) + '...');

    const response = await fetch(cacheBustUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(request),
      cache: 'no-store' // Disable HTTP caching
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MCPResponse = await response.json();

    if (data.error) {
      throw new Error(`MCP Error: ${data.error.message}`);
    }

    if (!data.result?.content?.[0]?.text) {
      throw new Error('Invalid MCP response format');
    }

    // Parse the text content (it's JSON)
    const result = JSON.parse(data.result.content[0].text);
    console.log('[MCP Client] Result:', result);

    return result;
  } catch (error) {
    console.error('[MCP Client] Error:', error);
    throw error;
  }
}

// Typed helpers for specific tools

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

/**
 * Get species in an eco-region with filters
 */
export async function getRegionSpecies(
  args: GetRegionSpeciesArgs
): Promise<GetRegionSpeciesResult> {
  return callMCPTool<GetRegionSpeciesResult>('get_region_species', args);
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
  return callMCPTool<GetSpeciesDetailsResult>('get_species_details', args);
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
  return callMCPTool<GetEcoregionInfoResult>('get_ecoregion_info', args);
}

export interface GenerateColorThemeArgs {
  ecoregionName: string;
  biome?: string;
  description?: string;
}

export interface ColorTheme {
  primary: string;      // HSL color string
  secondary: string;    // HSL color string
  background: string;   // HSL color string
  text: string;         // HSL color string
  accent: string;       // HSL color string
}

export interface GenerateColorThemeResult {
  success: boolean;
  theme?: ColorTheme;
  baseHue?: number;
  characteristics?: {
    dominantColor: string;
    temperature: 'warm' | 'cool' | 'neutral';
  };
  message?: string;
}

/**
 * Generate dynamic HSL color theme for ecoregion using color theory
 */
export async function generateColorTheme(
  args: GenerateColorThemeArgs
): Promise<GenerateColorThemeResult> {
  return callMCPTool<GenerateColorThemeResult>('generate_color_theme', args);
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

/**
 * Generate cartoon illustration of species using DALL-E 2
 * Returns image URL which frontend will convert to ASCII
 */
export async function generateCartoonAscii(
  args: GenerateCartoonAsciiArgs
): Promise<GenerateCartoonAsciiResult> {
  return callMCPTool<GenerateCartoonAsciiResult>('generate_cartoon_ascii', args);
}

export interface GenerateFastVisualDescriptionArgs {
  scientificName: string;
  commonName: string;
  animalType: string;
  ecoregion?: string;
}

export interface GenerateFastVisualDescriptionResult {
  success: boolean;
  description?: string;
  method?: string;
  timestamp?: string;
  error?: string;
}

/**
 * Generate fast visual description for a species (2-3s)
 */
export async function generateFastVisualDescription(
  args: GenerateFastVisualDescriptionArgs
): Promise<GenerateFastVisualDescriptionResult> {
  return callMCPTool<GenerateFastVisualDescriptionResult>('generate_fast_visual_description', args);
}
