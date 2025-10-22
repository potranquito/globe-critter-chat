/**
 * Pixel Game Species-to-Template Mapping
 *
 * Maps species data (from trivia game) to animal type templates and biome types
 * for the 2D Pixel Pacman game.
 */

import { Species } from '@/types/habitat';

/**
 * Maps common animal type keywords to template names
 */
const ANIMAL_TYPE_KEYWORDS: Record<string, string> = {
  // Mammals
  bear: 'bear',
  fox: 'fox',
  wolf: 'wolf',
  rabbit: 'rabbit',
  hare: 'rabbit',
  deer: 'deer',
  elk: 'deer',
  moose: 'deer',
  caribou: 'deer',

  // Birds
  eagle: 'eagle',
  hawk: 'eagle',
  falcon: 'eagle',
  owl: 'eagle',
  bird: 'eagle',

  // Reptiles & Amphibians
  lizard: 'lizard',
  gecko: 'lizard',
  iguana: 'lizard',
  chameleon: 'lizard',
  frog: 'frog',
  toad: 'frog',
  turtle: 'turtle',
  tortoise: 'turtle',

  // Arctic/Antarctic
  penguin: 'penguin',
  seal: 'turtle', // Similar body shape
  walrus: 'turtle',

  // Default fallbacks by taxonomic group
  mammal: 'fox',
  bird: 'eagle',
  reptile: 'lizard',
  amphibian: 'frog',
  fish: 'turtle',
};

/**
 * Maps biome/habitat characteristics to biome types
 */
const BIOME_KEYWORDS: Record<string, string> = {
  // Forest types
  rainforest: 'rainforest',
  tropical: 'rainforest',
  jungle: 'rainforest',

  // Cold biomes
  arctic: 'arctic',
  tundra: 'arctic',
  polar: 'arctic',
  antarctic: 'arctic',
  ice: 'arctic',
  snow: 'arctic',

  // Dry biomes
  desert: 'desert',
  arid: 'desert',
  sahara: 'desert',

  // Water biomes
  ocean: 'ocean',
  marine: 'ocean',
  coastal: 'ocean',
  reef: 'ocean',

  // Grasslands
  grassland: 'grassland',
  savanna: 'grassland',
  prairie: 'grassland',
  steppe: 'grassland',

  // Mountains
  mountain: 'mountain',
  alpine: 'mountain',
  highland: 'mountain',
};

/**
 * Determines animal type template from species data
 */
export function getAnimalTypeFromSpecies(species: Species): string {
  const searchText = `${species.name} ${species.scientificName} ${species.type || ''} ${species.taxonomicGroup || ''}`.toLowerCase();

  // Try to match specific animal keywords first
  for (const [keyword, template] of Object.entries(ANIMAL_TYPE_KEYWORDS)) {
    if (searchText.includes(keyword)) {
      return template;
    }
  }

  // Fallback to taxonomic group
  const taxonomicGroup = (species.taxonomicGroup || species.type || '').toLowerCase();
  for (const [keyword, template] of Object.entries(ANIMAL_TYPE_KEYWORDS)) {
    if (taxonomicGroup.includes(keyword)) {
      return template;
    }
  }

  // Final fallback
  return 'default';
}

/**
 * Determines biome type from eco-region name
 */
export function getBiomeTypeFromRegion(regionName: string, climate?: string): string {
  const searchText = `${regionName} ${climate || ''}`.toLowerCase();

  // Try to match biome keywords
  for (const [keyword, biomeType] of Object.entries(BIOME_KEYWORDS)) {
    if (searchText.includes(keyword)) {
      return biomeType;
    }
  }

  // Default fallback based on common patterns
  if (searchText.includes('forest')) return 'rainforest';
  if (searchText.includes('cold') || searchText.includes('northern')) return 'arctic';
  if (searchText.includes('dry') || searchText.includes('hot')) return 'desert';
  if (searchText.includes('sea') || searchText.includes('water')) return 'ocean';
  if (searchText.includes('plain') || searchText.includes('grass')) return 'grassland';
  if (searchText.includes('mount') || searchText.includes('high')) return 'mountain';

  return 'default';
}

/**
 * Creates pixel game configuration from trivia completion data
 */
export interface PixelGameConfig {
  animalType: string;
  animalName: string;
  biomeType: string;
  ecoRegionId: string;
  ecoRegionName: string;
}

export function createPixelGameConfig(
  species: Species,
  ecoRegionId: string,
  ecoRegionName: string,
  climate?: string
): PixelGameConfig {
  return {
    animalType: getAnimalTypeFromSpecies(species),
    animalName: species.commonName || species.name,
    biomeType: getBiomeTypeFromRegion(ecoRegionName, climate),
    ecoRegionId,
    ecoRegionName,
  };
}

/**
 * Example usage:
 *
 * const config = createPixelGameConfig(
 *   selectedSpecies,
 *   'congo-rainforest',
 *   'Congo Rainforest',
 *   'tropical'
 * );
 *
 * <PixelGameModal
 *   isOpen={showPixelGame}
 *   onClose={() => setShowPixelGame(false)}
 *   animalType={config.animalType}
 *   animalName={config.animalName}
 *   biomeType={config.biomeType}
 *   ecoRegionId={config.ecoRegionId}
 *   onGameComplete={handleGameComplete}
 * />
 */
