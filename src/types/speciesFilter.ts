export type AnimalCategory =
  | 'all-animals'
  | 'mammals'
  | 'reptiles'
  | 'amphibians'
  | 'birds'
  | 'fish'
  | 'insects';

export type FilterCategory =
  | AnimalCategory
  | 'plants'
  | 'endangered'
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

export const ANIMAL_FILTERS: FilterOption[] = [
  { id: 'all-animals', label: 'All Animals', emoji: '🦁', category: 'animals', isSubCategory: true },
  { id: 'mammals', label: 'Mammals', emoji: '🦒', category: 'animals', isSubCategory: true },
  { id: 'reptiles', label: 'Reptiles', emoji: '🦎', category: 'animals', isSubCategory: true },
  { id: 'amphibians', label: 'Amphibians', emoji: '🐸', category: 'animals', isSubCategory: true },
  { id: 'birds', label: 'Birds', emoji: '🐦', category: 'animals', isSubCategory: true },
  { id: 'fish', label: 'Fish', emoji: '🐟', category: 'animals', isSubCategory: true },
  { id: 'insects', label: 'Insects', emoji: '🦋', category: 'animals', isSubCategory: true },
];

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all-animals', label: 'Animals', emoji: '🦁', category: 'animals', description: 'Filter by animal types' },
  { id: 'plants', label: 'Plants', emoji: '🌿', category: 'other', description: 'Show plant species' },
  { id: 'endangered', label: 'Endangered', emoji: '⚠️', category: 'other', description: 'Show endangered species' },
  { id: 'ecosystems', label: 'Ecosystems', emoji: '🌍', category: 'other', description: 'View ecosystem data' },
  { id: 'food-chain', label: 'Food Chain', emoji: '🍽️', category: 'other', description: 'Show food chain relationships' },
  { id: 'disasters', label: 'Disasters', emoji: '🌪️', category: 'other', description: 'Show natural disasters' },
  { id: 'news', label: 'News', emoji: '📰', category: 'other', description: 'Conservation news' },
  { id: 'protected-areas', label: 'Protected Areas', emoji: '🛡️', category: 'other', description: 'Show protected regions' },
];
