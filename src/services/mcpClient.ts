// MCP Client for connecting React frontend to MCP server
// Uses JSON-RPC 2.0 protocol over HTTP

const MCP_SERVER_URL = import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:3000/mcp';

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

  console.log('[MCP Client] Calling tool:', toolName, args);

  try {
    const response = await fetch(MCP_SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify(request)
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
