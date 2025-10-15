import type { FilterCategory } from '@/types/speciesFilter';

interface SpeciesData {
  commonName?: string;
  scientificName?: string;
  animalType?: string;
  class?: string;
  description?: string;
  habitatType?: string;
  kingdom?: string;
}

interface SpeciesClassification {
  speciesType: string;
  uiGroup: FilterCategory;
  trophicRole: string;
  trophicRoleEmoji: string;
  trophicRoleLabel: string;
}

/**
 * Classifies species with full metadata
 */
export function classifySpecies(data: SpeciesData): SpeciesClassification {
  const type = (data.animalType || data.class || '').toLowerCase();
  const name = (data.commonName || '').toLowerCase();
  const scientificName = (data.scientificName || '').toLowerCase();
  
  // Determine species type
  let speciesType = 'Animal';
  if (type.includes('mammal')) speciesType = 'Mammal';
  else if (type.includes('bird') || type.includes('aves')) speciesType = 'Bird';
  else if (type.includes('reptil')) speciesType = 'Reptile';
  else if (type.includes('amphibian')) speciesType = 'Amphibian';
  else if (type.includes('fish')) speciesType = 'Fish';
  else if (type.includes('insect')) speciesType = 'Insect';
  else if (type.includes('coral')) speciesType = 'Coral';
  else if (type.includes('mollusc')) speciesType = 'Mollusc';
  else if (type.includes('crustacean')) speciesType = 'Crustacean';
  else if (type.includes('arthropod')) speciesType = 'Arthropod';
  else if (data.kingdom?.toLowerCase().includes('plant')) speciesType = 'Plant';
  
  // Determine UI group
  let uiGroup: FilterCategory = 'mammals';
  if (speciesType === 'Bird') uiGroup = 'birds';
  else if (speciesType === 'Reptile') uiGroup = 'reptiles';
  else if (speciesType === 'Amphibian') uiGroup = 'amphibians';
  else if (speciesType === 'Fish') uiGroup = 'fish';
  else if (['Insect', 'Mollusc', 'Crustacean', 'Arthropod', 'Coral'].includes(speciesType)) uiGroup = 'invertebrates';
  else if (speciesType === 'Plant') uiGroup = 'plants';
  
  // Determine trophic role (simplified)
  let trophicRole = 'Consumer';
  let trophicRoleEmoji = '🍽️';
  let trophicRoleLabel = 'Consumer';
  
  if (speciesType === 'Plant') {
    trophicRole = 'Producer';
    trophicRoleEmoji = '🌱';
    trophicRoleLabel = 'Producer';
  } else if (name.includes('predator') || scientificName.includes('predator')) {
    trophicRole = 'Predator';
    trophicRoleEmoji = '🦁';
    trophicRoleLabel = 'Predator';
  } else if (name.includes('herbivore') || scientificName.includes('herbivore')) {
    trophicRole = 'Herbivore';
    trophicRoleEmoji = '🌿';
    trophicRoleLabel = 'Herbivore';
  }
  
  return {
    speciesType,
    uiGroup,
    trophicRole,
    trophicRoleEmoji,
    trophicRoleLabel
  };
}

/**
 * Gets species type for display (simplified version)
 */
export function getSpeciesType(data: SpeciesData | string): string {
  if (typeof data === 'string') {
    const type = data.toLowerCase();
    if (type.includes('mammal')) return 'Mammal';
    if (type.includes('bird') || type.includes('aves')) return 'Bird';
    if (type.includes('reptil')) return 'Reptile';
    if (type.includes('amphibian')) return 'Amphibian';
    if (type.includes('fish')) return 'Fish';
    if (type.includes('insect')) return 'Insect';
    if (type.includes('coral')) return 'Coral';
    if (type.includes('mollusc')) return 'Mollusc';
    if (type.includes('crustacean')) return 'Crustacean';
    if (type.includes('arthropod')) return 'Arthropod';
    return data;
  }
  
  return classifySpecies(data).speciesType;
}

/**
 * Gets UI group for filtering
 */
export function getUIGroup(data: SpeciesData | string): FilterCategory {
  if (typeof data === 'string') {
    const type = data.toLowerCase();
    if (type.includes('mammal')) return 'mammals';
    if (type.includes('bird') || type.includes('aves')) return 'birds';
    if (type.includes('reptil')) return 'reptiles';
    if (type.includes('amphibian')) return 'amphibians';
    if (type.includes('fish')) return 'fish';
    if (type.includes('insect') || type.includes('arthropod') || type.includes('coral') || 
        type.includes('mollusc') || type.includes('crustacean')) return 'invertebrates';
    return 'mammals';
  }
  
  return classifySpecies(data).uiGroup;
}
