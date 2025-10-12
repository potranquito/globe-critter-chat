# Phase 2 Continuation Guide

**Last Updated:** 2025-10-10 (Updated after ecoregions database integration)
**Status:** Tasks 2.1-2.11 Complete + 8 Bonus Features! (✅ 95% Phase 2 Complete)
**Current Branch:** `feature/species-filter-banner`
**Latest Commit:** `11e09ba` - Complete UX fixes and ecoregions database integration

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

**Geolocation & Search Integration (2.4-2.8):**
- ✅ useLocationDiscovery hook (bridges service with UI)
- ✅ Geolocation button triggers automatic discovery
- ✅ View-mode-aware (3D: 50km habitats, 2D: 10km locations)
- ✅ Emoji-coded markers by location type (🌍🐦🏞️🦅🌲)
- ✅ ChatInput mode indicators (🔍 Discovery / 💬 Chat)
- ✅ Contextual placeholders based on mode
- ✅ Loading states on geolocation button
- ✅ Single input paradigm - no separate search boxes needed

**Bonus Features (Added Beyond Original Plan):**
- ✅ Dynamic emoji system for GlobalHealthBar (💩 → 🌍 → 🦸)
- ✅ **Species Filter Banner** - Left-side vertical filter bar
- ✅ **Region Species Carousel** - Vertical scrollable species list
- ✅ **Locations Filter & Carousel** - Parks, refuges, protected areas
- ✅ **Auto-Activate Locations Filter** - Shows locations carousel first
- ✅ **Unified UX Flow** - All searches populate filter banner + carousel
- ✅ **Persistent Pins** - Markers stay visible until Reset clicked
- ✅ **Filter Banner Positioning** - Locations at top, then Animals, Plants, etc.
- ✅ **Cross-Search Location Data** - Animals and locations both fetch parks/refuges
- ✅ **WWF Ecoregions Database** - 1,509 global ecoregions (terrestrial, marine, freshwater)
- ✅ **Smart Habitat Resolver** - OpenAI + database lookup (no hardcoding)
- ✅ **Coordinate Validation** - Filters ocean pins for land animals
- ✅ **Transparent Habitat Overlays** - Multiple zones for wide-ranging species
- ✅ **Complete UX Overhaul** - Reset, loading, carousel, pin stability fixes

---

## 📋 Next Steps (Task 2.9 onwards)

### Tasks 2.4-2.8: Location Discovery & Search Integration ✅ COMPLETE

**What Was Built:**

**Task 2.4 - 3D/2D Habitat Markers:**
- Created `useLocationDiscovery` hook to bridge service with UI
- Integrated with existing Globe component (no new marker component needed)
- Converts UnifiedLocation → HabitatPoint format with emoji markers
- Automatic marker rendering on discovery

**Task 2.5 - Location Markers (Merged with 2.4):**
- Single hook handles both 3D and 2D markers
- View-mode-aware discovery (3D: 50km, 2D: 10km)
- Emoji-coded by type: 🌍 habitats, 🐦 hotspots, 🏞️ parks, 🦅 refuges, 🌲 reserves

**Task 2.6 - Geolocation Button:**
- Enhanced `handleFetchLocation` in Index.tsx
- Shows spinner during discovery (`isDiscovering` state)
- Automatic discovery + marker rendering
- Pan to user location with toast notifications
- Graceful error handling

**Task 2.7-2.8 - Search (SIMPLIFIED UX):**
- **No separate search inputs needed!**
- Users use existing ChatInput at bottom-center for EVERYTHING
- Added mode indicator badge:
  * 🔍 Discovery Mode (blue) - Search for animals/locations
  * 💬 Chat Mode (green) - Ask questions about selected item
- Contextual placeholders that change based on mode
- Reset button returns to Discovery Mode

**Why This Approach:**
- Single input paradigm - users type "polar bear" or "Yellowstone" in ChatInput
- System auto-detects if it's species or location
- Shows markers + appropriate card on right
- Auto-switches to Chat Mode for follow-up questions
- Less UI clutter, more intuitive workflow

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

## ✅ Latest Work: Ecoregions Database & UX Overhaul (COMPLETE)

**Completed Feature: Transparent Habitat Overlays + WWF Ecoregions**

See `IMPLEMENTATION_STATUS.md` for detailed summary.

**What Was Built:**
- ✅ Integrated WWF Ecoregions database (1,509 regions)
- ✅ Transparent green circular overlays around habitat pins
- ✅ Multiple zones for wide-ranging species (e.g., polar bears get 5 zones)
- ✅ Smart species-to-ecoregion resolver using OpenAI
- ✅ Coordinate validation (no more ocean pins for land animals)
- ✅ Complete UX fixes (reset, loading, carousel, pin stability)
- ✅ Removed all hardcoded species data (now scales infinitely)

---

## 🎯 Recommended Next Session Plan

**Phase 2 Completion (95% → 100%):**
1. ✅ Task 2.9: LocationInfoCard (COMPLETE)
2. ✅ Task 2.10: Map/Globe toggle (COMPLETE - works well)
3. 🔄 Task 2.11: Final polish & optimization (IN PROGRESS)

**Priority Tasks:**
1. **Performance Optimization** ⬜ HIGH PRIORITY
   - Parallelize API calls (currently sequential)
   - Reduce redundant fetches
   - Optimize Wikipedia image loading

2. **Species Photo Integration** ⬜ HIGH PRIORITY
   - Replace placeholder polar bear image
   - Fetch species images (iNaturalist, Flickr, Wikipedia)
   - Cache species images

3. **Enhanced Species Data** ⬜ MEDIUM PRIORITY
   - Real conservation status (IUCN API)
   - Actual population data
   - Threat information

**Completed This Session (October 10):**
1. ✅ WWF Ecoregions database (1,509 regions)
2. ✅ Smart habitat resolver (OpenAI + database)
3. ✅ Coordinate validation system
4. ✅ Transparent habitat overlays
5. ✅ Multiple habitat zones
6. ✅ Complete UX overhaul (reset, loading, carousel, pins)
7. ✅ Removed all hardcoded species data

---

## 🐛 Known Issues (Minor)

1. **Loading Performance** - Sequential API calls
   - Impact: Medium (2-3s search time)
   - Priority: High
   - Fix: Parallelize with Promise.all()

2. **Species Image Placeholder** - Using polar bear for all
   - Impact: Medium (visual consistency)
   - Priority: High
   - Fix: Integrate iNaturalist/Flickr API

3. **Plant Filter** - Shows "No species match" when no plants
   - Impact: Low (expected behavior)
   - Priority: Low
   - Fix: Better empty state message

4. **Map View Clustering** - Dense markers overlap
   - Impact: Low (3D globe is primary)
   - Priority: Medium
   - Fix: Add marker clustering library

---

## 📊 Updated Stats

**Tasks Completed:** 2.1-2.8 + Bonus Features (11+ tasks)
**Files Created:** 9 (APIs + services + LocationsCarousel + SpeciesFilterBanner + etc)
**Files Modified:** 8 (Index, ChatInput, MapControls, Globe, types, etc)
**Lines of Code:** ~3,500+
**APIs Integrated:** 3 (eBird, Protected Planet, Google Places)
**Build Status:** ✅ Passing
**TypeScript Errors:** 0
**Commits:** 12+
**Branch:** `feature/species-filter-banner`

---

## 💡 Tips for Continuation

1. **Check existing globe/map components first** before building markers
2. **Test with real API calls** to see actual data structure
3. **Cache is working** - check console logs for cache hits
4. **Use glass-panel styling** for UI consistency
5. **Mobile-first design** - test on small viewports

---

Ready to add habitat overlays and continue Phase 2! 🚀

## 🎉 Phase 2 Progress: ✅ 95% Complete (11/11 original tasks + 13 bonus features!)

**What's Left:**
- Performance optimizations (parallel API calls)
- Species photo integration
- Final testing & bug fixes

**What's Complete:**
- ✅ All 11 original Phase 2 tasks
- ✅ 13 bonus features including:
  - WWF Ecoregions database
  - Smart habitat resolver
  - Transparent habitat overlays
  - Complete UX overhaul
  - Coordinate validation
  - Filter banner & carousels
  - And more!

**Ready for Phase 3:** Species Intelligence & Advanced Features

---

## 🎮 Phase 3: Species Database & Gamification (NEW)

### Overview
Phase 3 transforms the discovery tool into an educational game with:
- Comprehensive species database (IUCN Red List)
- Real-time environmental intelligence agents
- AI-powered quiz generation
- New game flow: 3D globe → 2D map → parks → species → quiz

### What's Available

**IUCN Data (Downloaded & Ready):**
- ✅ 13GB of spatial data (22+ taxonomic groups)
- ✅ Mammals, fish, marine life, freshwater, plants
- ✅ Conservation status, ranges, habitat types
- ✅ Free for educational use
- 📊 Estimated: 50,000+ species when processed

**Architecture Documents:**
- ✅ `IUCN_DATA_SUMMARY.md` - Complete data analysis
- ✅ `BACKGROUND_ENRICHMENT_ARCHITECTURE.md` - Multi-agent system
- ✅ `IMPLEMENTATION_PLAN.md` - Updated with Phase 3

### Phase 3 Tasks

#### Task 3.1: Database Setup ⬜ NOT STARTED
**Files to Create:**
- `supabase/migrations/20251012000000_create_species_tables.sql`
- `supabase/migrations/20251012000001_create_parks_tables.sql`

**Tables:**
- `species` - Main species table with IUCN data
- `species_ecoregions` - Junction table
- `parks` - Protected areas/refuges
- `species_parks` - Junction table

**Storage Cost:** ~500MB-1GB (vs 13GB raw shapefiles)

---

#### Task 3.2: Shapefile Processing Script ⬜ NOT STARTED
**Files to Create:**
- `scripts/processIUCNShapefiles.ts`
- `scripts/importSpeciesImages.ts`

**What It Does:**
1. Extract shapefiles from `/Downloads/Animal Zips/`
2. Convert to GeoJSON using ogr2ogr
3. Parse species records
4. Batch insert to Supabase (500 at a time)
5. Spatial joins (species → ecoregions, species → parks)
6. Cleanup temp files

**Expected Output:** 50,000+ species in database

---

#### Task 3.3: Species Image Service ⬜ NOT STARTED
**Files to Create:**
- `src/services/speciesImageService.ts`
- `src/services/imageProviders/iNaturalistProvider.ts`
- `src/services/imageProviders/wikipediaProvider.ts`
- `src/services/imageProviders/eolProvider.ts`

**Multi-Source Strategy (Priority Order):**
1. iNaturalist API (best quality, CC licensed)
2. Wikipedia/Wikimedia (curated, free)
3. EOL catalog (you have this!)
4. Flickr (fallback)
5. Placeholder

**Storage:** URL-only approach = $0/month
- Store image URLs in database (~2MB for 10K species)
- Load images from CDNs (iNaturalist, Wikipedia, etc.)
- Attribution displayed with each image

---

#### Task 3.4: Background Enrichment Agents ⬜ NOT STARTED
**Files to Create:**
- `src/services/enrichment/agents/FireAgent.ts`
- `src/services/enrichment/agents/EarthquakeAgent.ts`
- `src/services/enrichment/agents/WeatherAgent.ts`
- `src/services/enrichment/agents/EBirdAgent.ts`
- `src/services/enrichment/agents/INaturalistAgent.ts`
- `src/services/enrichment/agents/NewsAgent.ts`
- `src/services/enrichment/EnrichmentCoordinator.ts`

**How It Works:**
```
User clicks park → Show species list (instant)
  ↓
Background: 6 agents run in parallel
  - NASA FIRMS: Active fires
  - USGS: Earthquakes
  - OpenWeather: Current conditions
  - eBird: Recent sightings
  - iNaturalist: Photos + observations
  - News APIs: Conservation updates
  ↓
User reads for 30-60 seconds
  ↓
Agents complete → Data cached for quiz
  ↓
User clicks "Play Quiz" → AI generates questions
```

**See:** `BACKGROUND_ENRICHMENT_ARCHITECTURE.md` for full details

---

#### Task 3.5: Game UX Flow ⬜ NOT STARTED
**Files to Create:**
- `src/components/ParkSelector.tsx` - 2D map showing parks
- `src/components/SpeciesList.tsx` - Tabbed list (Animals/Plants/Threats)
- `src/components/SpeciesCard.tsx` - Enhanced with images
- `src/components/QuizGenerator.tsx` - AI quiz creation
- `src/components/QuizPlayer.tsx` - Interactive quiz UI

**User Journey:**
1. 3D Globe → Click eco-region pin
2. Transition to 2D map → Show parks in region
3. Click park → Left panel shows species (Animals/Plants tabs)
4. Read about species → Background agents fetch data
5. Click "Play Quiz" → AI generates quiz using:
   - Static species data (IUCN)
   - Real-time enriched data (agents)
   - Current events (fires, weather, sightings)

---

#### Task 3.6: Quiz System ⬜ NOT STARTED
**Files to Create:**
- `src/services/quiz/EnrichedQuizGenerator.ts`
- `src/services/quiz/QuestionTemplates.ts`
- `src/types/quiz.ts`

**Quiz Types:**
1. Species Identification - "Which animal is this?"
2. Habitat Matching - "Where does this species live?"
3. Conservation Status - "What's the threat level?"
4. Real-time Events - "Fire detected 15mi away, which species at risk?"
5. Ecological Relationships - "What does this animal eat?"

**Generation:**
- Mix of template-based + AI-generated questions
- Uses both static data + real-time enrichment
- 10 questions per quiz
- Adaptive difficulty

---

### Implementation Order (Recommended)

**Phase 0: Proof of Concept (2-3 hours) ⭐ START HERE**
1. ✅ Build Fire Agent POC (NASA FIRMS API)
2. ✅ Build Weather Agent POC (OpenWeatherMap API)
3. ✅ Build POC Coordinator (parallel execution)
4. ✅ Create demo UI to display enriched data
5. ✅ Validate: agents run in parallel, handle failures, cache results

**Benefits:**
- Quick validation of architecture (before full build)
- Tests API integrations
- Demonstrates value to stakeholders
- Foundation for full enrichment system

**Week 1: Foundation**
1. ✅ Create database migrations
2. ✅ Build shapefile processing script
3. ✅ Import first dataset (mammals) - test pipeline
4. ✅ Verify spatial joins working

**Week 2: Images**
1. ✅ Build image service (multi-source)
2. ✅ Background image fetcher
3. ✅ Update 1,000 species with images (test)
4. ✅ UI integration (species cards with images)

**Week 3: Enrichment**
1. ✅ Build Fire + Earthquake + Weather agents
2. ✅ Build eBird + iNaturalist agents
3. ✅ Build coordinator with parallel execution
4. ✅ Test with real park data

**Week 4: Game UX**
1. ✅ Park selector (2D map)
2. ✅ Species list (tabs: Animals/Plants/Threats)
3. ✅ Quiz generator (static + enriched)
4. ✅ Quiz player UI

**Week 5: Polish**
1. ✅ Process all shapefiles (full import)
2. ✅ Fetch all species images (background job)
3. ✅ Performance optimization
4. ✅ End-to-end testing

---

### API Keys Needed

```bash
# Required for enrichment agents
NASA_FIRMS_API_KEY=         # Free: https://firms.modaps.eosdis.nasa.gov/api/
OPENWEATHER_API_KEY=        # Free tier: https://openweathermap.org/api
EBIRD_API_KEY=              # Free: https://ebird.org/api/keygen

# Optional but recommended
FLICKR_API_KEY=             # Free: https://www.flickr.com/services/api/
INATURALIST_TOKEN=          # Free: https://www.inaturalist.org/oauth/applications

# Already have
OPENAI_API_KEY=             # For quiz generation
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
```

---

### Storage & Cost Summary

**Database:**
- Species data: ~500MB-1GB
- Image URLs: ~2MB
- Total: <1GB = FREE on Supabase free tier

**Image Strategy:**
- Store URLs only (not actual images)
- Load from CDNs (iNaturalist, Wikipedia, etc.)
- Cost: $0/month

**API Costs:**
- NASA FIRMS: Free
- USGS: Free
- OpenWeather: Free tier (1M calls/month)
- eBird: Free
- iNaturalist: Free
- Wikipedia: Free
- OpenAI: ~$5-10/month for quiz generation

**Total Monthly Cost: $5-10** (just OpenAI for quizzes)

---

## 📊 Updated Project Stats

**Phase 2 Complete:**
- Tasks Completed: 11/11 + 13 bonus features
- APIs Integrated: 3 (eBird, Protected Planet, Google Places)
- Files Created: 15+
- Lines of Code: 4,500+

**Phase 3 Ready:**
- IUCN Data: 13GB downloaded, analyzed
- Architecture: Fully designed
- Implementation Plan: Updated
- Storage Cost: $0/month (URL-only images)
- Ready to build!

---

**Ready for Phase 3:** Species Intelligence & Advanced Features ✅
