export interface HabitatRegion {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  bounds: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
  climate: string;
  area: number;
  characteristics: string[];
  imageUrl: string;
  parkCount: number;
  keySpecies: Species[];
  threats: Threat[];
  protectedAreas: ProtectedArea[];
}

export interface ProtectedArea {
  id: string;
  name: string;
  type: string;
  area: number;
  iucnCategory?: string;
  designation?: string;
  location: { lat: number; lng: number };
  bounds?: {
    ne: { lat: number; lng: number };
    sw: { lat: number; lng: number };
  };
}

export interface Species {
  id: string;
  name: string;
  scientificName: string;
  conservationStatus: string;
  observationCount: number;
  lastSeen?: string;
  imageUrl?: string;
  type: string;
  taxonomicGroup?: string;
  kingdom?: string;
  animalType?: string;
  commonName?: string;
}

export interface Threat {
  id: string;
  type: 'fire' | 'drought' | 'development' | 'pollution' | 'flood' | 'earthquake';
  title: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  status: 'active' | 'ongoing' | 'planned' | 'resolved';
  impact: 'critical' | 'high' | 'medium' | 'low';
  severity: number;
  description: string;
  affectedArea?: number;
  imageUrl?: string;
  timestamp: string;
  lastUpdated: string;
  source: {
    name: string;
    url: string;
  };
  affectedParks?: string[];
  affectedSpecies?: string[];
}
