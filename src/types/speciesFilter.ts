// New simplified UI Group categories
export type UIGroupCategory =
  | 'animals'
  | 'birds'
  | 'plants-corals';

export type ConservationCategory =
  | 'critically-endangered'
  | 'endangered'
  | 'vulnerable'
  | 'near-threatened'
  | 'least-concern';

// Legacy animal categories (kept for backward compatibility)
export type AnimalCategory =
  | 'all-animals'
  | 'mammals'
  | 'reptiles'
  | 'amphibians'
  | 'birds'
  | 'fish'
  | 'insects';

export type FilterCategory =
  | UIGroupCategory
  | ConservationCategory
  | AnimalCategory
  | 'locations'
  | 'plants'
  | 'ecosystems'
  | 'food-chain'
  | 'disasters'
  | 'news'
  | 'protected-areas';

export interface FilterOption {
  id: FilterCategory;
  label: string;
  emoji: string;
  category?: 'animals' | 'other';
  description?: string;
  isSubCategory?: boolean;
}

// New simplified UI Group filters (primary)
export const UI_GROUP_FILTERS: FilterOption[] = [
  { id: 'animals', label: 'Animals', emoji: '🦁', category: 'animals' },
  { id: 'birds', label: 'Birds', emoji: '🐦', category: 'animals' },
  { id: 'plants-corals', label: 'Plants & Corals', emoji: '🌿', category: 'other' },
];

// Legacy animal filters (kept for backward compatibility)
export const ANIMAL_FILTERS: FilterOption[] = [
  { id: 'all-animals', label: 'All Animals', emoji: '🦁', category: 'animals', isSubCategory: true },
  { id: 'mammals', label: 'Mammals', emoji: '🦒', category: 'animals', isSubCategory: true },
  { id: 'reptiles', label: 'Reptiles', emoji: '🦎', category: 'animals', isSubCategory: true },
  { id: 'amphibians', label: 'Amphibians', emoji: '🐸', category: 'animals', isSubCategory: true },
  { id: 'birds', label: 'Birds', emoji: '🐦', category: 'animals', isSubCategory: true },
  { id: 'fish', label: 'Fish', emoji: '🐟', category: 'animals', isSubCategory: true },
  { id: 'insects', label: 'Insects', emoji: '🦋', category: 'animals', isSubCategory: true },
];

export const CONSERVATION_FILTERS: FilterOption[] = [
  { id: 'critically-endangered', label: 'Critically Endangered', emoji: '🔴', category: 'other', isSubCategory: true },
  { id: 'endangered', label: 'Endangered', emoji: '🟠', category: 'other', isSubCategory: true },
  { id: 'vulnerable', label: 'Vulnerable', emoji: '🟡', category: 'other', isSubCategory: true },
  { id: 'near-threatened', label: 'Near Threatened', emoji: '🔵', category: 'other', isSubCategory: true },
  { id: 'least-concern', label: 'Least Concern', emoji: '🟢', category: 'other', isSubCategory: true },
];

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'locations', label: 'Locations', emoji: '📍', category: 'other', description: 'Nearby parks, refuges & preserves' },
  { id: 'all-animals', label: 'Animals', emoji: '🦁', category: 'animals', description: 'Filter by animal types' },
  { id: 'plants', label: 'Plants', emoji: '🌿', category: 'other', description: 'Show plant species' },
  { id: 'critically-endangered', label: 'Conservation Status', emoji: '⚠️', category: 'other', description: 'Filter by conservation status' },
  { id: 'ecosystems', label: 'Ecosystems', emoji: '🌍', category: 'other', description: 'View ecosystem data' },
  { id: 'food-chain', label: 'Food Chain', emoji: '🍽️', category: 'other', description: 'Show food chain relationships' },
  { id: 'disasters', label: 'Disasters', emoji: '🌪️', category: 'other', description: 'Show natural disasters' },
  { id: 'news', label: 'News', emoji: '📰', category: 'other', description: 'Conservation news' },
  { id: 'protected-areas', label: 'Protected Areas', emoji: '🛡️', category: 'other', description: 'Show protected regions' },
];
