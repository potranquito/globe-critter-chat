# Phase 2 Continuation Guide

**Last Updated:** 2025-10-10
**Status:** Tasks 2.1-2.3 Complete, Ready for 2.4
**Current Branch:** `feature/species-filter-banner`

---

## ✅ Completed (Tasks 2.1-2.3)

### What's Been Built:

**API Infrastructure (2.1):**
- ✅ eBird API service (`src/services/api/eBirdApi.ts`)
- ✅ Protected Planet API service (`src/services/api/protectedPlanetApi.ts`)
- ✅ Google Places API service (`src/services/api/googlePlacesApi.ts`)
- ✅ API keys configured in `.env`

**Location Discovery Service (2.2):**
- ✅ `discoverHabitatsByGeolocation()` - 3D globe regions (Protected Planet)
- ✅ `discoverLocationsByGeolocation()` - 2D map locations (eBird + Google Places)
- ✅ `discoverByUserInput()` - Location search with geocoding
- ✅ `discoverByAnimal()` - Placeholder for Phase 3
- ✅ Smart deduplication within 100m
- ✅ Error handling and fallbacks

**Caching System (2.3):**
- ✅ Configurable TTL by data type:
  - Locations/habitats: 1 hour
  - Species data: 7 days (ready for Phase 3!)
  - Threats: 1 hour
- ✅ Cache management utilities
- ✅ Integrated with location discovery
- ✅ Expected 70-80% API call reduction

**Bonus:**
- ✅ Dynamic emoji system for GlobalHealthBar (💩 → 🌍 → 🦸)

---

## 📋 Next Steps (Task 2.4 onwards)

### Task 2.4: Add 3D Globe Habitat Markers ⬜ NOT STARTED

**Goal:** Display green dot markers for discovered habitats on 3D globe

**What to Build:**
1. `src/components/map/HabitatMarker.tsx` component
2. Integration with existing 3D globe library
3. Render green dots at habitat coordinates (from Protected Planet)
4. Click handler → opens LocationInfoCard on right side
5. Hover tooltip showing habitat name
6. Support multiple markers for animal searches
7. Optional: Visual distinction by habitat type (marine=blue, forest=green, etc.)

**Dependencies:**
- Existing 3D globe component (check `src/components/Globe.tsx` or `GoogleEarthMap.tsx`)
- `locationDiscovery.ts` service (already implemented)
- Need to understand how current globe renders markers

**Where to Start:**
1. Read existing globe implementation to understand marker API
2. Create test data with `discoverHabitatsByGeolocation()`
3. Build marker component with click/hover interactions
4. Integrate with globe

---

### Task 2.5: Add 2D Map Location Markers ⬜ NOT STARTED

**Goal:** Display markers for specific locations on 2D map

**What to Build:**
1. `src/components/map/LocationMarker.tsx` component
2. Integration with existing Google Maps
3. Render markers for parks, refuges, hotspots
4. Different icons for location types (🏞️ 🦅 🐦 🌊)
5. Click handler → opens LocationInfoCard
6. Marker clustering for dense areas
7. Info window on hover

---

### Task 2.6: Connect Geolocation Button ⬜ NOT STARTED

**Goal:** Trigger location discovery when user clicks geolocation button

**What to Build:**
1. Update existing geolocation button handler
2. Show loading state: "Discovering locations near you..."
3. Call `discoverHabitatsByGeolocation()` (3D) or `discoverLocationsByGeolocation()` (2D)
4. Render markers on map/globe
5. Pan to user's location
6. Show success toast

**Existing Code:**
- Geolocation button likely in `MapControls` component
- May already have basic geolocation logic

---

### Task 2.7: Add Location Search Input ⬜ NOT STARTED

**Goal:** Allow users to search for locations by name

**What to Build:**
1. `src/components/LocationSearchInput.tsx`
2. Add to left sidebar (above species filters)
3. Google Places Autocomplete integration
4. On selection → call `discoverByUserInput()`
5. Render markers and pan to location

---

### Task 2.8: Add Animal Search Input ⬜ NOT STARTED

**Goal:** Allow users to search for animals to find their habitats

**What to Build:**
1. `src/components/AnimalSearchInput.tsx`
2. Add to left sidebar (separate from location search)
3. Species autocomplete (GBIF/iNaturalist)
4. On selection → call `discoverByAnimal()` (needs Phase 3 implementation)
5. Place green dots on all habitats
6. Rotate globe to first habitat

**Note:** This will be partially implemented in Phase 3 when species APIs are added

---

### Task 2.9: Create LocationInfoCard ⬜ NOT STARTED

**Goal:** Display location/habitat details when marker is clicked

**What to Build:**
1. `src/components/LocationInfoCard.tsx`
2. Takes over right side space (where SpeciesCard goes)
3. Display:
   - Location/habitat name and type
   - Photo (from Google Places or Protected Planet)
   - Description and conservation status
   - "Explore Species Here" button (triggers Phase 3)
   - "Switch to Map View" / "Switch to Globe View" buttons
   - Close button (X)
4. Slide-in animation from right
5. Glass-panel styling

---

### Task 2.10: Map/Globe View Toggle Enhancement ⬜ NOT STARTED

**Goal:** Smooth transitions between 3D and 2D views

**What to Build:**
1. 3D → 2D transition flow
2. 2D → 3D transition flow
3. Preserve selected location across view changes
4. Transition animations

---

### Task 2.11: Test & Polish ⬜ NOT STARTED

**Goal:** Comprehensive testing and bug fixes

---

## 🔧 Technical Notes

### Available Services:

```typescript
// Location Discovery
import {
  discoverHabitatsByGeolocation,
  discoverLocationsByGeolocation,
  discoverByUserInput,
  discoverByAnimal
} from '@/services/locationDiscovery';

// Caching
import {
  getCachedDiscovery,
  setCachedDiscovery,
  clearCacheByType,
  clearAllCache,
  getCacheStats
} from '@/services/locationCache';

// APIs (if needed directly)
import { getNearbyHotspots } from '@/services/api/eBirdApi';
import { searchProtectedAreasNearby } from '@/services/api/protectedPlanetApi';
import { searchProtectedPlacesNearby } from '@/services/api/googlePlacesApi';
```

### Data Types:

```typescript
interface UnifiedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  type: 'habitat_region' | 'ebird_hotspot' | 'national_park' | 'wildlife_refuge' | 'nature_reserve' | 'protected_area';
  source: 'protected_planet' | 'ebird' | 'google_places';
  metadata: Record<string, any>;
  bounds?: any;
}

interface DiscoveryResult {
  locations: UnifiedLocation[];
  source: string;
  timestamp: Date;
  searchParams: {
    latitude: number;
    longitude: number;
    radius?: number;
    query?: string;
  };
}
```

---

## 🎯 Recommended Next Session Plan

**Option A (Recommended):** Complete UI tasks in order
1. Start with Task 2.4 (3D markers)
2. Move to Task 2.5 (2D markers)
3. Then Task 2.6 (geolocation integration)

**Option B:** Build search functionality first
1. Task 2.7 (Location search)
2. Task 2.9 (LocationInfoCard)
3. Then backfill markers

**Option C:** Vertical slice
1. Do minimal version of 2.4, 2.5, 2.6 together
2. Get end-to-end flow working
3. Polish afterwards

---

## 🐛 Known Issues

- None yet! All code compiles and builds successfully.

---

## 📊 Stats

**Files Created:** 5
**Lines of Code:** ~1,500
**APIs Integrated:** 3
**Build Status:** ✅ Passing
**TypeScript Errors:** 0

---

## 💡 Tips for Continuation

1. **Check existing globe/map components first** before building markers
2. **Test with real API calls** to see actual data structure
3. **Cache is working** - check console logs for cache hits
4. **Use glass-panel styling** for UI consistency
5. **Mobile-first design** - test on small viewports

---

Ready to continue with Task 2.4! 🚀
