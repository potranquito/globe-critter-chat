/**
 * Curated MVP Species Dataset
 *
 * Simple, reliable data for 5-6 key ecoregions
 * ~100 species per region with common names and image URLs
 * This bypasses complex database queries for MVP launch
 */

export interface CuratedSpecies {
  scientificName: string;
  commonName: string;
  class: string; // 'MAMMALIA', 'AVES', 'REPTILIA', 'AMPHIBIA', 'ACTINOPTERYGII', 'MAGNOLIOPSIDA', 'LILIOPSIDA', 'INSECTA'
  conservationStatus: string; // 'CR', 'EN', 'VU', 'NT', 'LC', 'DD', 'NE'
  imageUrl: string;
  regions: string[]; // Which ecoregions this species belongs to
}

export const curatedSpeciesData: Record<string, CuratedSpecies[]> = {
  'Arctic Tundra': [
    {
      scientificName: 'Rangifer tarandus',
      commonName: 'Caribou',
      class: 'MAMMALIA',
      conservationStatus: 'VU',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/386399969/medium.jpg',
      regions: ['Arctic Tundra', 'Northern Hemisphere']
    },
    {
      scientificName: 'Ranunculus allenii',
      commonName: "Allen's Buttercup",
      class: 'MAGNOLIOPSIDA',
      conservationStatus: 'LC',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/60907424/medium.jpg',
      regions: ['Arctic Tundra']
    },
    {
      scientificName: 'Claytonia tuberosa',
      commonName: 'Beringian Springbeauty',
      class: 'MAGNOLIOPSIDA',
      conservationStatus: 'LC',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/53881287/medium.jpg',
      regions: ['Arctic Tundra']
    },
    {
      scientificName: 'Schoenoplectus tabernaemontani',
      commonName: 'Soft-stemmed Bulrush',
      class: 'LILIOPSIDA',
      conservationStatus: 'LC',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/16394663/medium.jpg',
      regions: ['Arctic Tundra', 'Wetlands']
    },
  ],

  'Amazon Rainforest': [
    {
      scientificName: 'Panthera onca',
      commonName: 'Jaguar',
      class: 'MAMMALIA',
      conservationStatus: 'NT',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/jaguar/medium.jpg',
      regions: ['Amazon Rainforest', 'Tropical Rainforest']
    },
    {
      scientificName: 'Ara ararauna',
      commonName: 'Blue-and-yellow Macaw',
      class: 'AVES',
      conservationStatus: 'LC',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/macaw/medium.jpg',
      regions: ['Amazon Rainforest', 'Tropical Rainforest']
    },
    // Add more...
  ],

  'African Savanna': [
    {
      scientificName: 'Loxodonta africana',
      commonName: 'African Elephant',
      class: 'MAMMALIA',
      conservationStatus: 'EN',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/elephant/medium.jpg',
      regions: ['African Savanna', 'Grasslands']
    },
    {
      scientificName: 'Panthera leo',
      commonName: 'Lion',
      class: 'MAMMALIA',
      conservationStatus: 'VU',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/lion/medium.jpg',
      regions: ['African Savanna', 'Grasslands']
    },
    // Add more...
  ],

  'Great Barrier Reef': [
    {
      scientificName: 'Chelonia mydas',
      commonName: 'Green Sea Turtle',
      class: 'REPTILIA',
      conservationStatus: 'EN',
      imageUrl: 'https://inaturalist-open-data.s3.amazonaws.com/photos/sea-turtle/medium.jpg',
      regions: ['Great Barrier Reef', 'Coral Reef', 'Ocean']
    },
    // Add more...
  ],
};

/**
 * Get curated species for a given ecoregion
 */
export function getCuratedSpecies(ecoregionName: string): CuratedSpecies[] {
  return curatedSpeciesData[ecoregionName] || [];
}

/**
 * Check if we have curated data for this ecoregion
 */
export function hasCuratedData(ecoregionName: string): boolean {
  return ecoregionName in curatedSpeciesData;
}
