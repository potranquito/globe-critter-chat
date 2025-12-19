# 🌍 Gamification Architecture: Earth Cleanup System

## Executive Summary

**Core Mechanic:** Users "clean up" Earth by generating and completing location-based lesson activities. Each lesson teaches about real-time wildlife, conservation, and environmental data.

**Key Decision:** Lessons can be generated at ANY level (ecosystem/region/location) with random location selection within that scope.

**Location Discovery:** Use existing map/API infrastructure to dynamically discover wildlife parks, refuges, and conservation areas - no manual ecosystem classification needed.

---

## System Overview

### Hierarchy Structure
```
🌍 World (Global Health: 0-100%)
  │
  ├── 🏙️ Region: Las Vegas, NV (10 locations, 30% complete)
  │   ├── 📍 Corn Creek (completed ✓)
  │   ├── 📍 Henderson Bird Preserve (completed ✓)
  │   ├── 📍 Red Rock Canyon (completed ✓)
  │   ├── 📍 Lake Mead NRA
  │   ├── 📍 Clark County Wetlands Park
  │   └── ... (5 more)
  │
  ├── 🏙️ Region: Death Valley, CA (8 locations, 0% complete)
  │   ├── 📍 Furnace Creek
  │   ├── 📍 Badwater Basin
  │   └── ... (6 more)
  │
  └── ... (thousands of regions worldwide)
```

### Lesson Generation Options

When user clicks "Generate Lesson Plan" on **any card**, they can:

1. **Generate for this specific location** (e.g., Corn Creek)
   - Focused lesson about that exact place
   - Most detailed and targeted

2. **Generate for region (random location)** (e.g., Las Vegas → picks random from 10 locations)
   - Picks random sub-location (Lake Mead, Red Rock, etc.)
   - User discovers new places
   - Lesson focuses on the randomly selected location

3. **Generate for ecosystem (random in area)** (e.g., Mojave Desert → picks random region → random location)
   - Picks random region within ecosystem
   - Then picks random location within that region
   - Broadest discovery experience

---

## API Integration Strategy

### Location Discovery Workflow

**User Action:** Searches "Las Vegas" or clicks on map coordinates

**System Response:**
```javascript
async function discoverLocationsInArea(lat, lng, radius = 50000) {
  // 1. Use Protected Planet API to find protected areas
  const protectedAreas = await protectedPlanetAPI.search({
    lat, lng,
    radius, // 50km
    filters: ['national_park', 'wildlife_refuge', 'nature_reserve']
  });

  // 2. Use Google Places API for additional locations
  const places = await googlePlacesAPI.nearbySearch({
    location: { lat, lng },
    radius,
    type: ['park', 'zoo', 'aquarium', 'natural_feature']
  });

  // 3. Use eBird Hotspots for birding locations
  const hotspots = await ebirdAPI.nearbyHotspots(lat, lng, radius / 1000);

  // 4. Combine and deduplicate
  const allLocations = deduplicateLocations([
    ...protectedAreas,
    ...places,
    ...hotspots
  ]);

  // 5. Store in database
  await storeLocations(allLocations);

  return allLocations;
}
```

**Result:**
- Las Vegas region created/updated
- 10+ sub-locations discovered automatically
- No manual ecosystem classification needed
- Map automatically shows all discovered locations

### API Data Sources

#### Priority 1: Location Discovery
| API | Purpose | Rate Limit | Cost |
|-----|---------|------------|------|
| **Protected Planet API** | Protected areas worldwide | Open | Free |
| **Google Places API** | Parks, nature areas | Limited | $$ per 1000 |
| **eBird Hotspots API** | Birding locations | 100/day | Free |
| **OpenStreetMap Overpass** | Natural features | Open | Free |

#### Priority 2: Species Data (fetch per location)
| API | Species Types | Limit Strategy |
|-----|---------------|----------------|
| **eBird API** | Birds | Top 20 recent sightings |
| **iNaturalist API** | All taxa | Top 30 research-grade |
| **GBIF API** | All biodiversity | Top 20 observations |

#### Priority 3: Environmental Threats
| API | Threat Type | Update Frequency |
|-----|-------------|------------------|
| **NASA FIRMS** | Active fires | Real-time |
| **USGS Earthquake** | Earthquakes | Real-time |
| **Global Forest Watch** | Deforestation | Weekly |
| **NOAA Storm Events** | Severe weather | Daily |

#### Priority 4: Conservation News
| Source | Content Type | Access Method |
|--------|--------------|---------------|
| **IUCN Red List** | Species status | API |
| **Conservation blogs** | News articles | RSS feeds |
| **X (Twitter)** | Real-time updates | API v2 |
| **Reddit** | Community posts | API |
| **Research papers** | Scientific studies | PubMed API |

---

## Database Schema (Supabase)

### Core Tables

```sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  health_contributed INTEGER DEFAULT 0,
  total_lessons_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Regions (discovered dynamically from searches)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL, -- "Las Vegas, NV"
  center_lat FLOAT NOT NULL,
  center_lng FLOAT NOT NULL,
  bounds JSONB, -- GeoJSON polygon
  country TEXT,
  state_province TEXT,

  -- Stats
  total_locations INTEGER DEFAULT 0,
  completed_locations INTEGER DEFAULT 0,
  completion_percentage FLOAT DEFAULT 0,

  -- Discovery metadata
  discovered_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Locations (parks, refuges, preserves)
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  region_id UUID REFERENCES regions(id),

  -- Basic info
  name TEXT NOT NULL, -- "Corn Creek"
  type TEXT, -- "wildlife_refuge", "national_park", "preserve"
  description TEXT,
  center_lat FLOAT NOT NULL,
  center_lng FLOAT NOT NULL,
  bounds JSONB,

  -- External IDs
  protected_planet_id TEXT,
  google_place_id TEXT,
  ebird_hotspot_id TEXT,

  -- Cached data (refreshed every 24 hours)
  species_count INTEGER DEFAULT 0,
  threat_count INTEGER DEFAULT 0,
  cached_data JSONB, -- Full API responses
  last_data_fetch TIMESTAMP,

  -- Gamification
  times_completed INTEGER DEFAULT 0,
  health_value INTEGER DEFAULT 5, -- Base points for completion
  difficulty_level TEXT, -- "easy", "medium", "hard" (based on data complexity)

  created_at TIMESTAMP DEFAULT NOW()
);

-- Species master list
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  common_name TEXT,
  scientific_name TEXT UNIQUE NOT NULL,
  species_type TEXT, -- "bird", "mammal", "plant", etc.
  conservation_status TEXT, -- IUCN: "CR", "EN", "VU", "NT", "LC"
  description TEXT,
  image_url TEXT,

  -- External IDs
  ebird_code TEXT,
  inaturalist_taxon_id INTEGER,
  gbif_taxon_id INTEGER,

  -- Badge info
  badge_icon TEXT, -- Emoji or icon name
  badge_rarity TEXT, -- "common", "rare", "epic", "legendary"

  created_at TIMESTAMP DEFAULT NOW()
);

-- Location-Species relationship (what lives where)
CREATE TABLE location_species (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id),
  species_id UUID REFERENCES species(id),
  observation_count INTEGER DEFAULT 1,
  last_observed TIMESTAMP,
  data_source TEXT, -- "ebird", "inaturalist", "gbif"
  UNIQUE(location_id, species_id)
);

-- Environmental threats
CREATE TABLE threats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id),
  threat_type TEXT, -- "wildfire", "earthquake", "deforestation", etc.
  severity TEXT, -- "low", "medium", "high", "critical"
  title TEXT,
  description TEXT,
  lat FLOAT,
  lng FLOAT,
  detected_at TIMESTAMP,
  data_source TEXT, -- "NASA_FIRMS", "USGS", etc.
  metadata JSONB
);

-- Generated lessons (cached for 7 days)
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES locations(id),

  -- Content
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Markdown
  difficulty TEXT, -- "beginner", "intermediate", "advanced"
  estimated_minutes INTEGER DEFAULT 30,

  -- Featured elements
  featured_species UUID[], -- Array of species IDs
  featured_threats UUID[],
  key_concepts TEXT[], -- ["adaptation", "food_web", etc.]

  -- Generation metadata
  generated_by TEXT DEFAULT 'LLM',
  generation_prompt TEXT,
  api_sources JSONB, -- Which APIs were called
  generated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Regenerate after 7 days

  -- Quality metrics
  times_completed INTEGER DEFAULT 0,
  average_rating FLOAT
);

-- User lesson completions
CREATE TABLE user_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  lesson_id UUID REFERENCES lessons(id),
  location_id UUID REFERENCES locations(id),

  -- Completion info
  completed_at TIMESTAMP DEFAULT NOW(),
  time_spent_minutes INTEGER,
  health_earned INTEGER,
  species_learned UUID[], -- Species badge IDs

  -- Optional feedback
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback TEXT,

  UNIQUE(user_id, lesson_id)
);

-- User badges and achievements
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  badge_type TEXT, -- "species", "achievement", "milestone"

  -- Species badges
  species_id UUID REFERENCES species(id),

  -- Achievement badges
  achievement_id TEXT, -- "las_vegas_explorer", "fire_spotter", etc.
  achievement_name TEXT,
  achievement_description TEXT,
  achievement_icon TEXT,

  earned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, species_id),
  UNIQUE(user_id, achievement_id)
);

-- Global health tracking
CREATE TABLE global_health (
  id INTEGER PRIMARY KEY DEFAULT 1,
  current_health FLOAT DEFAULT 0, -- 0-100%
  total_lessons_completed INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (id = 1) -- Singleton
);

-- API cache (reduce duplicate API calls)
CREATE TABLE api_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT UNIQUE NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_regions_coords ON regions(center_lat, center_lng);
CREATE INDEX idx_locations_region ON locations(region_id);
CREATE INDEX idx_locations_coords ON locations(center_lat, center_lng);
CREATE INDEX idx_species_scientific ON species(scientific_name);
CREATE INDEX idx_user_completions_user ON user_completions(user_id);
CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_api_cache_key ON api_cache(cache_key);
CREATE INDEX idx_api_cache_expires ON api_cache(expires_at);
```

---

## Lesson Generation Workflow

### User Flow

```
User on Las Vegas Region Card
  ↓
Clicks "Generate Lesson Plan"
  ↓
Modal appears:
┌─────────────────────────────────────────┐
│  Generate Lesson for Las Vegas Region   │
├─────────────────────────────────────────┤
│  Choose Location:                        │
│                                          │
│  🎲 Random Location (Recommended)        │
│     Let us pick a location to explore    │
│                                          │
│  OR choose specific:                     │
│  ○ Corn Creek (45 species, Easy)        │
│  ○ Henderson Bird Preserve (120, Med)   │
│  ○ Red Rock Canyon (200, Hard)          │
│  ○ Lake Mead NRA (300, Hard)            │
│  ... [+6 more]                           │
│                                          │
│  [Cancel]       [Generate Lesson] ────→ │
└─────────────────────────────────────────┘
```

### Backend Process

```javascript
// Supabase Edge Function: /generate-lesson
async function generateLesson(req) {
  const { regionId, locationId, randomize } = req.body;

  // 1. Select location
  let targetLocation;
  if (randomize) {
    // Pick random location in region
    const locations = await db.locations
      .select('*')
      .eq('region_id', regionId)
      .order('RANDOM()')
      .limit(1);
    targetLocation = locations[0];
  } else {
    targetLocation = await db.locations.findById(locationId);
  }

  // 2. Check for cached lesson (< 7 days old)
  const cachedLesson = await db.lessons
    .select('*')
    .eq('location_id', targetLocation.id)
    .gt('expires_at', new Date())
    .single();

  if (cachedLesson) {
    return { lesson: cachedLesson, cached: true };
  }

  // 3. Fetch fresh data (use cache where possible)
  const locationData = await aggregateLocationData(targetLocation);

  // 4. Generate lesson via LLM
  const lesson = await callLLM({
    prompt: buildLessonPrompt(locationData),
    model: 'claude-3-5-sonnet-20241022',
    maxTokens: 4000
  });

  // 5. Store lesson in database
  const savedLesson = await db.lessons.create({
    location_id: targetLocation.id,
    title: extractTitle(lesson),
    content: lesson,
    featured_species: locationData.topSpecies.map(s => s.id),
    featured_threats: locationData.threats.map(t => t.id),
    key_concepts: extractConcepts(lesson),
    generated_at: new Date(),
    expires_at: addDays(new Date(), 7)
  });

  return { lesson: savedLesson, cached: false };
}

// Aggregate all API data for a location
async function aggregateLocationData(location) {
  // Phase 1: Check cache (24 hour TTL)
  const cached = await getCachedData(location.id, 24 * 60 * 60 * 1000);
  if (cached) return cached;

  // Phase 2: Fetch data in parallel with priority
  const [species, threats, news] = await Promise.allSettled([
    // Priority 1: Species (critical)
    fetchSpeciesData(location),

    // Priority 2: Threats (important)
    fetchThreatsData(location),

    // Priority 3: News (nice-to-have)
    fetchConservationNews(location)
  ]);

  // Phase 3: Process and prioritize
  const allSpecies = combineSpeciesSources(species.value);
  const topSpecies = selectTopSpecies(allSpecies, {
    limit: 20,
    criteria: ['endangered', 'endemic', 'charismatic', 'recent']
  });

  const aggregated = {
    location,
    topSpecies,
    threats: threats.value || [],
    news: news.value || [],
    fetchedAt: new Date()
  };

  // Cache for 24 hours
  await cacheData(location.id, aggregated, 24 * 60 * 60 * 1000);

  return aggregated;
}

// Fetch species from multiple APIs
async function fetchSpeciesData(location) {
  const { center_lat: lat, center_lng: lng } = location;

  // Parallel fetch
  const [birds, inaturalist, gbif] = await Promise.allSettled([
    // eBird: Birds (fast, reliable)
    ebirdAPI.getRecentObservations({
      lat, lng,
      dist: 25, // 25km radius
      maxResults: 20,
      back: 30 // Last 30 days
    }),

    // iNaturalist: All taxa (comprehensive)
    iNaturalistAPI.getObservations({
      lat, lng,
      radius: 5, // 5km
      quality_grade: 'research',
      per_page: 30,
      order_by: 'observed_on'
    }),

    // GBIF: Historical data (slow but valuable)
    gbifAPI.searchOccurrences({
      decimalLatitude: lat,
      decimalLongitude: lng,
      radius: 5000, // meters
      limit: 20,
      basisOfRecord: 'HUMAN_OBSERVATION'
    })
  ]);

  return {
    birds: birds.status === 'fulfilled' ? birds.value : [],
    inaturalist: inaturalist.status === 'fulfilled' ? inaturalist.value : [],
    gbif: gbif.status === 'fulfilled' ? gbif.value : []
  };
}

// Fetch threats from multiple sources
async function fetchThreatsData(location) {
  const { bounds } = location;

  const [fires, earthquakes, deforestation] = await Promise.allSettled([
    // NASA FIRMS: Active fires
    nasaFIRMS.getActiveFires({
      bounds,
      days: 7
    }),

    // USGS: Recent earthquakes
    usgsEarthquakeAPI.search({
      bounds,
      minmagnitude: 2.5,
      starttime: subDays(new Date(), 30)
    }),

    // Global Forest Watch: Deforestation
    globalForestWatchAPI.getAlerts({
      bounds,
      weeks: 12
    })
  ]);

  return [
    ...(fires.value || []),
    ...(earthquakes.value || []),
    ...(deforestation.value || [])
  ];
}

// LLM prompt construction
function buildLessonPrompt(data) {
  const { location, topSpecies, threats, news } = data;

  return `
You are an expert wildlife educator creating an engaging, place-based lesson plan.

LOCATION: ${location.name}
TYPE: ${location.type}
REGION: ${location.region_name}

SPECIES (Top ${topSpecies.length}):
${topSpecies.map((s, i) => `${i + 1}. ${s.common_name} (${s.scientific_name})
   - Type: ${s.species_type}
   - Conservation: ${s.conservation_status}
   - Recent observations: ${s.observation_count}
`).join('\n')}

ENVIRONMENTAL THREATS:
${threats.map(t => `- ${t.threat_type}: ${t.title} (${t.severity})`).join('\n')}

CONSERVATION NEWS (Recent):
${news.slice(0, 3).map(n => `- ${n.title}`).join('\n')}

Create a 30-45 minute lesson plan that:
1. Introduces ${location.name} and its ecological importance
2. Highlights 2-3 featured species and their unique adaptations
3. Explains current environmental threats and conservation challenges
4. Discusses active conservation efforts and success stories
5. Includes 3-5 thought-provoking discussion questions
6. Provides a hands-on activity or citizen science opportunity (e.g., eBird, iNaturalist)
7. Ends with specific actions students can take to help

Use an engaging, educational tone appropriate for middle-high school students.
Format in Markdown with clear sections and bullet points.
Include relevant emojis to make it visually appealing.
`;
}
```

---

## User Experience Flow

### 1. Discovery Phase

```
User searches "Las Vegas" or clicks on map
  ↓
System discovers 10 locations:
  - Corn Creek
  - Henderson Bird Preserve
  - Red Rock Canyon
  - Lake Mead NRA
  - Clark County Wetlands Park
  - Sloan Canyon
  - Spring Mountain Ranch
  - Floyd Lamb Park
  - Sunset Park
  - Tule Springs Fossil Beds
  ↓
Las Vegas Region card appears on right
  ↓
Species carousel appears on left (combined species from all 10 locations)
```

### 2. Lesson Generation Phase

```
User clicks "Generate Lesson Plan"
  ↓
Modal appears with options:
  - 🎲 Random Location (recommended)
  - Or choose from list of 10
  ↓
User selects option
  ↓
Loading modal shows progress:
  ✓ Collecting species data...
  ✓ Analyzing threats...
  ✓ Researching conservation...
  ⏳ Generating lesson... (15-20 seconds)
  ↓
Lesson appears in full-screen view
```

### 3. Lesson Completion Phase

```
User reads lesson content
  ↓
Scrolls to bottom
  ↓
Clicks "Mark Complete" button
  ↓
Backend calculates rewards:
  - Base health: +5 points
  - Species badges: Unlocked 3 new species
  - Achievement check: 3/10 Las Vegas locations complete
  ↓
Celebration modal shows:
  🎉 Lesson Complete!
  +5 Health Points
  🐦 Phainopepla Badge Unlocked!
  🦎 Desert Tortoise Badge Unlocked!
  🌵 Joshua Tree Badge Unlocked!

  Las Vegas Progress: 3/10 (30%)
  Global Health: 23.4% → 23.45%

  [View Badges] [Next Lesson]
  ↓
User clicks "Next Lesson"
  ↓
System suggests:
  - Next location in Las Vegas (to complete region)
  - Random location in nearby region (Death Valley)
  - Location with urgent threats (wildfire nearby)
```

### 4. Profile & Progress Tracking

```
User clicks profile icon (top-right)
  ↓
Dropdown shows:
  - Health contributed: 45 points
  - Lessons completed: 9
  - Badges earned: 23
  ↓
User clicks "View Profile"
  ↓
Profile page shows:

  📊 My Impact
  - Global Health contributed: 45 pts (0.045%)
  - Lessons completed: 9
  - Total time learning: 4.5 hours
  - Rank: #247 of 1,234 users

  🗺️ Regions Explored
  - Las Vegas, NV: 3/10 (30%) ██████░░░░
  - Death Valley, CA: 0/8 (0%) ░░░░░░░░
  - Grand Canyon, AZ: 1/12 (8%) █░░░░░░░░░░░

  🏆 Badges (23 total)
  [Species Badges: 18]
  🐦 Phainopepla
  🦎 Desert Tortoise
  🌵 Joshua Tree
  ... [+15 more]

  [Achievement Badges: 5]
  🎖️ First Lesson Complete
  🔥 Fire Spotter (Learned about wildfire threat)
  🌊 Water Warrior (Completed wetlands lesson)
  ... [+2 more]

  📈 Learning Streak
  Current: 3 days 🔥
  Longest: 7 days

  [Share Profile] [Download Certificate]
```

---

## Performance Optimization

### API Call Strategy

**Problem:** Fetching data for 10 locations simultaneously = slow

**Solution:** Staggered loading + caching

```javascript
// 1. Show region immediately (from search/click)
showRegionCard(region);

// 2. Fetch locations in background (parallel)
const locations = await discoverLocations(region);
updateLocationList(locations); // Show list immediately

// 3. Fetch data for each location (staggered)
locations.forEach((loc, index) => {
  setTimeout(async () => {
    const data = await fetchLocationData(loc);
    updateLocationCard(loc.id, data); // Update UI as data arrives
  }, index * 500); // Stagger by 500ms
});

// 4. Cache everything for 24 hours
cacheRegionData(region, locations, 24 * 60 * 60 * 1000);
```

### Species List Loading

**Current:** Slow, waits for all APIs

**Improved:** Progressive loading

```javascript
async function loadSpeciesList(location, onUpdate) {
  // 1. Show cached immediately
  const cached = await getCachedSpecies(location.id);
  if (cached) {
    onUpdate({ species: cached, status: 'cached', loading: true });
  }

  // 2. Fetch eBird (fastest)
  const birds = await ebirdAPI.get(location);
  onUpdate({ species: birds, status: 'birds_loaded', loading: true });

  // 3. Fetch iNaturalist
  const inat = await iNaturalistAPI.get(location);
  const combined = mergeDeduplicate([birds, inat]);
  onUpdate({ species: combined, status: 'comprehensive', loading: true });

  // 4. Fetch GBIF (slowest, historical)
  const gbif = await gbifAPI.get(location);
  const all = mergeDeduplicate([combined, gbif]);
  onUpdate({ species: all, status: 'complete', loading: false });
}

// UI shows loading states:
// "Loading... ✓ Birds ✓ Mammals ✓ Plants ✓ Historical data"
```

### Caching Rules

| Data Type | TTL | Storage |
|-----------|-----|---------|
| Location info | 30 days | Supabase DB |
| Species list | 24 hours | Supabase DB |
| Threats | 1 hour | Supabase DB |
| Lessons | 7 days | Supabase DB |
| User profile | No expiration | Supabase DB |
| API responses | 6 hours | Supabase `api_cache` table |

---

## UI Components

### 1. User Profile (Top-Right)

```tsx
// UserProfileButton.tsx
<div className="fixed top-8 right-8 z-[100] pointer-events-auto">
  {user ? (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button className="glass-panel rounded-xl h-12 px-4 gap-2">
          <Avatar src={user.avatar_url} fallback={user.username[0]} />
          <div className="text-left">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-primary">⚡ {user.health_contributed} Health</p>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64 glass-panel">
        <div className="p-3 border-b">
          <p className="text-xs text-muted-foreground">Your Contribution</p>
          <Progress value={(user.health_contributed / 1000) * 100} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {user.health_contributed} / 1000 points
          </p>
        </div>

        <div className="p-3 grid grid-cols-2 gap-2 border-b">
          <div>
            <p className="text-xs text-muted-foreground">Lessons</p>
            <p className="text-xl font-bold">{user.total_lessons_completed}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Badges</p>
            <p className="text-xl font-bold">{user.badge_count}</p>
          </div>
        </div>

        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" /> View Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/badges')}>
          <Trophy className="mr-2 h-4 w-4" /> My Badges
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLeaderboardOpen(true)}>
          <BarChart className="mr-2 h-4 w-4" /> Leaderboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button onClick={handleSignIn} className="glass-panel rounded-xl h-12 px-6">
      Sign In
    </Button>
  )}
</div>
```

### 2. Global Health Bar (Top)

```tsx
// GlobalHealthBar.tsx
<div className="fixed top-0 left-0 right-0 z-[90] bg-background/80 backdrop-blur-sm border-b pointer-events-auto">
  <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-4">
    {/* Mascot */}
    <div className="text-2xl">💩🦸</div>

    {/* Health Bar */}
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium">Global Earth Health</p>
        <p className="text-sm text-muted-foreground">{globalHealth.toFixed(2)}%</p>
      </div>
      <Progress
        value={globalHealth}
        className="h-3"
        indicatorClassName={
          globalHealth < 30 ? "bg-red-500" :
          globalHealth < 70 ? "bg-yellow-500" : "bg-green-500"
        }
      />
    </div>

    {/* Community Stats */}
    <div className="text-right">
      <p className="text-xs text-muted-foreground">Community</p>
      <p className="text-sm font-bold">
        {globalStats.total_lessons.toLocaleString()} Lessons
      </p>
    </div>
  </div>
</div>
```

### 3. Lesson Selection Modal

```tsx
// LessonSelectionModal.tsx
<Dialog open={showSelection} onOpenChange={setShowSelection}>
  <DialogContent className="glass-panel max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Generate Lesson for {region.name}</DialogTitle>
      <DialogDescription>
        Choose a specific location or let us surprise you!
      </DialogDescription>
    </DialogHeader>

    {/* Random Option (Recommended) */}
    <div
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
        selectedOption === 'random' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
      }`}
      onClick={() => setSelectedOption('random')}
    >
      <div className="flex items-center gap-3">
        <div className="text-3xl">🎲</div>
        <div className="flex-1">
          <p className="font-medium">Random Location</p>
          <p className="text-sm text-muted-foreground">
            Discover a new place in {region.name}
          </p>
        </div>
        <Badge variant="secondary">Recommended</Badge>
      </div>
    </div>

    <Separator className="my-4" />

    <p className="text-sm font-medium mb-2">Or choose a specific location:</p>

    {/* Location List */}
    <div className="space-y-2">
      {locations.map(loc => (
        <div
          key={loc.id}
          className={`p-3 border rounded-lg cursor-pointer transition-all ${
            selectedOption === loc.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
          }`}
          onClick={() => setSelectedOption(loc.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{loc.name}</p>
              <p className="text-xs text-muted-foreground">
                {loc.species_count} species • {loc.threat_count} threats
              </p>
            </div>
            <div className="flex items-center gap-1">
              {loc.difficulty === 'easy' && <Badge variant="outline">⭐ Easy</Badge>}
              {loc.difficulty === 'medium' && <Badge variant="outline">⭐⭐ Medium</Badge>}
              {loc.difficulty === 'hard' && <Badge variant="outline">⭐⭐⭐ Hard</Badge>}
              {loc.times_completed > 0 && (
                <Badge variant="secondary">✓ Completed</Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>

    <DialogFooter className="mt-6">
      <Button variant="outline" onClick={() => setShowSelection(false)}>
        Cancel
      </Button>
      <Button
        onClick={handleGenerateLesson}
        disabled={!selectedOption || isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>Generate Lesson</>
        )}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 4. Completion Markers on Map

**Google Maps (2D):**
```javascript
// Add markers for completed locations (green checkmarks)
completedLocations.forEach(loc => {
  new google.maps.Marker({
    position: { lat: loc.center_lat, lng: loc.center_lng },
    map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#10b981',
      fillOpacity: 0.8,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 10
    },
    title: `${loc.name} - Completed ✓`
  });
});

// Color-code regions by completion percentage
regions.forEach(region => {
  const color =
    region.completion_percentage >= 100 ? '#10b981' : // green
    region.completion_percentage >= 50 ? '#f59e0b' : // yellow
    '#ef4444'; // red

  new google.maps.Circle({
    center: { lat: region.center_lat, lng: region.center_lng },
    radius: 50000,
    fillColor: color,
    fillOpacity: 0.2,
    strokeColor: color,
    strokeOpacity: 0.5,
    strokeWeight: 2,
    map
  });
});
```

**Cesium Globe (3D):**
```javascript
// Add glowing pins for completed locations
completedLocations.forEach(loc => {
  viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(loc.center_lng, loc.center_lat),
    billboard: {
      image: '/icons/completed-checkmark.png',
      scale: 1.2,
      color: Cesium.Color.GREEN
    },
    label: {
      text: `✓ ${loc.name}`,
      font: '14px sans-serif',
      fillColor: Cesium.Color.WHITE,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      pixelOffset: new Cesium.Cartesian2(0, -25)
    }
  });
});
```

---

## Implementation Plan

### Phase 1: Database & Auth (Week 1)
- [x] Git commit current work
- [ ] Set up Supabase tables (schema above)
- [ ] Implement Google OAuth authentication
- [ ] Create user profile UI component
- [ ] Build global health bar component

### Phase 2: Location Discovery (Week 2)
- [ ] Integrate Protected Planet API
- [ ] Integrate Google Places API
- [ ] Integrate eBird Hotspots API
- [ ] Build location discovery workflow
- [ ] Add location cards to UI

### Phase 3: Data Fetching (Week 3)
- [ ] Implement species data fetching (eBird, iNaturalist, GBIF)
- [ ] Implement threat data fetching (NASA, USGS, GFW)
- [ ] Build caching system (multi-level)
- [ ] Add loading states & progressive loading

### Phase 4: Lesson Generation (Week 4)
- [ ] Build lesson selection modal
- [ ] Integrate LLM (Claude) for lesson generation
- [ ] Create lesson view component
- [ ] Implement completion tracking
- [ ] Add species badges system

### Phase 5: Gamification (Week 5)
- [ ] Build achievements system
- [ ] Add completion markers to map
- [ ] Create leaderboard
- [ ] Implement health calculation
- [ ] Add celebration animations

### Phase 6: Polish & Deploy (Week 6)
- [ ] Performance optimization
- [ ] Add error handling & fallbacks
- [ ] User testing
- [ ] Bug fixes
- [ ] Deploy to production

---

## Next Steps

Ready to begin implementation! Starting with **Phase 1: Database & Auth**.

Shall I proceed with:
1. Creating Supabase migration files for the database schema?
2. Setting up authentication components?
3. Building the user profile UI?

Let me know and I'll start implementing! 🚀
