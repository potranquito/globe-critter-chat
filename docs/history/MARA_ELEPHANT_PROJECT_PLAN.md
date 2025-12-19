# Mara Elephant Project - Implementation Plan

## 🐘 Overview
Create a conservation-focused ecoregion for the Mara Elephant Project, centered around African elephant conservation in the Maasai Mara.

**Location:** Maasai Mara National Reserve
**Coordinates:** -1.4818803551990296, 35.13053140187004
**Focus:** Conservation education vs. park exploration

---

## 📊 Phase 1: Database Setup

### 1.1 Ecoregion Entry
```sql
INSERT INTO ecoregions (
  name,
  biome,
  lat,
  lng,
  image_url,
  description
) VALUES (
  'Maasai Mara Savanna',
  'Tropical and Subtropical Grasslands',
  -1.4818803551990296,
  35.13053140187004,
  'borneo-elephant-sprite.png', -- Use existing Borneo elephant sprite
  'Home to the African elephant and one of the world''s most important conservation areas'
);
```

### 1.2 Species Data
**Primary Focus:** African Elephant (Loxodonta africana)
- Conservation Status: Endangered
- Population: ~2,000 in Mara ecosystem
- Threats: Poaching, human-wildlife conflict, habitat loss, climate change

**Supporting Species:**
- Lions, wildebeest, zebras, giraffes, hippos (for ecosystem context)

### 1.3 Conservation Topics (New Table Needed)
```sql
CREATE TABLE conservation_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ecoregion_id UUID REFERENCES ecoregions(id),
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'threat', 'solution', 'monitoring', 'community'
  description TEXT,
  image_url TEXT,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Phase 2: Conservation Topics & Content

### 2.1 Threats to Elephants
1. **Poaching**
   - Description: Illegal hunting for ivory
   - Visual: Image of rangers on patrol, confiscated ivory
   - Education: Why ivory trade is harmful, anti-poaching efforts

2. **Human-Wildlife Conflict**
   - Description: Elephants raid crops, causing farmer losses
   - Visual: Damaged crops, elephants near settlements
   - Education: Economic impact on communities, mitigation strategies

3. **Wildfires**
   - Description: Habitat destruction from fires
   - Visual: Fire damage, burnt savanna
   - Education: Climate change impacts, fire management

4. **Habitat Loss**
   - Description: Land conversion for agriculture
   - Visual: Fragmented habitat maps
   - Education: Corridor importance, land use planning

### 2.2 Conservation Solutions
1. **Drone Monitoring**
   - Description: UAVs for anti-poaching patrols
   - Visual: Drones in flight, aerial surveillance footage
   - Education: Technology in conservation, patrol efficiency

2. **Firecracker Deterrents**
   - Description: Non-lethal elephant deterrents for farms
   - Visual: Community members using firecrackers
   - Education: Human-wildlife coexistence, alternative livelihoods

3. **Community Rangers**
   - Description: Local employment in conservation
   - Visual: Rangers with tracking equipment
   - Education: Community-based conservation, economic benefits

4. **GPS Collaring**
   - Description: Tracking elephant movements
   - Visual: Collared elephants, movement data maps
   - Education: Migration patterns, conflict prediction

---

## 🎮 Phase 3: Conservation-Focused Education Flow

### Current Flow (Park-Focused):
```
Globe → Click Ecoregion → 2D Map → Select Park → Trivia → Pixel Game → Whack-a-Mole
```

### New Flow (Conservation-Focused):
```
Globe → Click Mara Ecoregion → Conservation Dashboard → Interactive Challenges → Impact Tracking
```

### 3.1 Conservation Dashboard (Replaces Park Selection)
**Layout:**
```
┌────────────────────────────────────────────────────┐
│  [← Back]     MARA ELEPHANT PROJECT    [Profile]   │
├─────────────────┬──────────────────────────────────┤
│                 │                                   │
│  🦏 Threats     │    LIVE MAP                      │
│  - Poaching     │    - Elephant locations (Earth   │
│  - Wildfires    │      Ranger API)                 │
│  - Conflict     │    - Threat hotspots             │
│                 │    - Ranger patrols              │
│  🛡️ Solutions  │                                   │
│  - Drones       │                                   │
│  - Deterrents   │                                   │
│  - Rangers      │                                   │
│                 │                                   │
│  📊 Impact      │                                   │
│  - Elephants    │                                   │
│    Protected    │                                   │
│  - Community    │                                   │
│    Supported    │                                   │
└─────────────────┴──────────────────────────────────┘
```

### 3.2 Interactive Challenge System
**Type 1: Threat Response**
- Scenario: "Elephant herd approaching farmland. What action?"
- Options: Deploy rangers, use deterrents, alert community
- Outcome: Show conservation impact, educate on strategy

**Type 2: Resource Allocation**
- Scenario: "Limited budget. Prioritize: drones, rangers, or community programs?"
- Options: Choose allocation strategy
- Outcome: Show trade-offs, long-term impacts

**Type 3: Pattern Recognition**
- Scenario: "Identify elephant movement patterns to predict conflict zones"
- Interaction: Mark areas on map, analyze data
- Outcome: Learn about elephant behavior, migration

### 3.3 Impact Tracking
- **Elephants Protected:** Count increases with completed challenges
- **Communities Supported:** Show economic impact
- **Threats Mitigated:** Track user's conservation actions
- **Conservation Score:** Overall effectiveness rating

---

## 🖼️ Phase 4: Required Assets

### 4.1 Images We Can Generate (AI)
✅ **Can Generate:**
1. African elephant illustrations/portraits
2. Savanna landscape backgrounds
3. Conservation equipment icons (drones, GPS collars)
4. Educational diagrams (elephant anatomy, migration maps)
5. Threat scenario illustrations (stylized)

❌ **Need Real Photos:**
1. Actual Mara Elephant Project operations
2. Real drone footage/photos
3. Authentic ranger patrol images
4. Community interaction photos
5. Specific threat documentation (if appropriate)

### 4.2 Asset List
**Critical Assets:**
- [ ] Borneo elephant sprite (already exists - reuse)
- [ ] African elephant portrait (hero image)
- [ ] 4-6 threat images (poaching, fire, conflict, habitat loss)
- [ ] 4-6 solution images (drones, firecrackers, rangers, collars)
- [ ] Conservation dashboard background
- [ ] Impact metrics icons

**Optional Assets:**
- [ ] Video clips (drone footage, ranger patrols)
- [ ] Audio clips (elephant sounds, ranger radio)
- [ ] 360° photos (immersive savanna experience)

### 4.3 Content We Can Generate
✅ **AI-Generated Content:**
- Educational text about elephant conservation
- Trivia questions about elephants and Mara ecosystem
- Challenge scenarios and outcomes
- Conservation tips and facts

❌ **Need from Mara Elephant Project:**
- Real statistics and data
- Specific conservation methodologies
- Success stories and case studies
- Approved messaging and terminology

---

## 🌐 Phase 5: Earth Ranger API Integration

### 5.1 What is Earth Ranger?
- **Purpose:** Real-time conservation data platform
- **Features:**
  - Live animal tracking (GPS collar data)
  - Ranger patrol routes
  - Incident reporting (poaching, conflicts)
  - Resource management

### 5.2 Integration Benefits
**vs. Google Maps:**
| Feature | Google Maps | Earth Ranger |
|---------|-------------|--------------|
| Real-time animal tracking | ❌ | ✅ |
| Conservation incidents | ❌ | ✅ |
| Ranger patrol data | ❌ | ✅ |
| Historical data | ❌ | ✅ |
| Cost | $$$ | Free (with partnership) |

### 5.3 API Integration Plan

**Step 1: API Access**
- Request API credentials from Mara Elephant Project
- Obtain Earth Ranger API documentation
- Set up OAuth/API key authentication

**Step 2: Data Endpoints Needed**
```typescript
// Example endpoints
GET /api/v1.0/subjects/       // Get elephant locations
GET /api/v1.0/events/         // Get conservation incidents
GET /api/v1.0/patrols/        // Get ranger patrol routes
GET /api/v1.0/observations/   // Get sightings/reports
```

**Step 3: Implementation**
```typescript
// New service: src/services/earthRangerClient.ts
export async function getElephantLocations(timeRange?: string) {
  const response = await fetch('https://api.earthranger.com/api/v1.0/subjects/', {
    headers: {
      'Authorization': `Bearer ${EARTH_RANGER_API_KEY}`,
      'Accept': 'application/json'
    }
  });
  return response.json();
}

export async function getConservationIncidents(bounds: Bounds) {
  // Fetch incidents within map bounds
}

export async function getRangerPatrols(date: Date) {
  // Fetch patrol data for visualization
}
```

**Step 4: Map Visualization**
- Replace GoogleEarthMap component with EarthRangerMap
- Show real-time elephant locations (if available)
- Display incident markers (color-coded by severity)
- Render patrol routes (with timestamps)

**Step 5: Privacy & Security**
- Anonymize sensitive location data
- Implement rate limiting
- Cache data appropriately
- Add terms of use disclosure

---

## 🛠️ Phase 6: Technical Implementation

### 6.1 New Components Needed
```
src/
├── components/
│   ├── EarthRangerMap.tsx           # Replace GoogleEarthMap for Mara
│   ├── ConservationDashboard.tsx     # Main conservation view
│   ├── ThreatCard.tsx                # Display conservation threats
│   ├── SolutionCard.tsx              # Display conservation solutions
│   ├── ConservationChallenge.tsx     # Interactive challenges
│   └── ImpactMetrics.tsx             # Show conservation impact
├── services/
│   └── earthRangerClient.ts          # Earth Ranger API integration
├── types/
│   └── conservation.ts               # Type definitions
└── pages/
    └── ConservationPage.tsx          # Conservation experience page
```

### 6.2 Database Migrations
```sql
-- 1. Add conservation_topics table
-- 2. Add conservation_challenges table
-- 3. Add user_conservation_progress table
-- 4. Link ecoregions to conservation experiences
```

### 6.3 Configuration
```typescript
// src/config/ecoregions.ts
export const ECOREGION_TYPES = {
  PARK_EXPLORATION: 'park',      // Existing: Borneo, etc.
  CONSERVATION: 'conservation'   // New: Mara Elephant Project
};

export const ECOREGION_CONFIG = {
  'maasai-mara': {
    type: ECOREGION_TYPES.CONSERVATION,
    apiProvider: 'earth-ranger',
    focusSpecies: 'african-elephant',
    features: ['real-time-tracking', 'threats', 'solutions', 'challenges']
  }
};
```

---

## 📋 Phase 7: What You Need to Provide

### 7.1 From Mara Elephant Project
**Critical:**
1. ✅ Earth Ranger API credentials (if approved)
2. ✅ Brand guidelines (logo, colors, messaging)
3. ✅ Approved conservation content/facts
4. ✅ Contact person for content approval

**High Priority:**
5. 📸 Real photos/videos of operations (if allowed)
6. 📊 Statistics and impact data
7. 📝 Success stories and case studies
8. 🗺️ Specific areas/boundaries to highlight

**Nice to Have:**
9. 🎥 Drone footage
10. 🎙️ Audio clips (elephant sounds, ranger comms)
11. 📱 Social media content to repurpose

### 7.2 Technical Decisions Needed
1. **Earth Ranger Access:** Confirmed or fallback to Google Maps?
2. **Data Privacy:** What animal data can be shown publicly?
3. **Real-time vs. Historical:** Show live tracking or historical patterns?
4. **Gamification:** How much "game" vs. "education"?
5. **Age Audience:** Kids, adults, or both?

---

## 🚀 Phase 8: Implementation Timeline

### Week 1: Foundation
- [ ] Get Mara Elephant Project assets and approval
- [ ] Set up database schema for conservation topics
- [ ] Create EcoregionPage routing logic
- [ ] Design ConservationDashboard UI mockups

### Week 2: Core Features
- [ ] Build ConservationDashboard component
- [ ] Implement threat and solution cards
- [ ] Add conservation challenges system
- [ ] Create impact tracking

### Week 3: Integration
- [ ] Integrate Earth Ranger API (or Google Maps fallback)
- [ ] Add real-time data visualization
- [ ] Test data updates and performance
- [ ] Implement caching strategy

### Week 4: Polish & Testing
- [ ] User testing with Mara team
- [ ] Content refinement
- [ ] Performance optimization
- [ ] Documentation and handoff

---

## 💡 Key Design Differences: Park vs. Conservation

| Aspect | Park Experience | Conservation Experience |
|--------|-----------------|-------------------------|
| **Goal** | Learn about species | Understand conservation challenges |
| **Interaction** | Explore locations | Respond to scenarios |
| **Data** | Static facts | Real-time incidents |
| **Map** | Show parks | Show threats, solutions, patrol routes |
| **Progress** | Park completion | Conservation impact |
| **Tone** | Discovery | Urgency + hope |
| **Metrics** | Stars/badges | Elephants protected, communities helped |

---

## 🎨 Visual Direction

### Color Palette (Savanna Theme)
- **Primary:** Warm orange (#E67E22) - Savanna sunset
- **Secondary:** Sage green (#27AE60) - Grassland
- **Accent:** Earth brown (#8B4513) - Soil
- **Danger:** Red (#E74C3C) - Threats
- **Success:** Green (#2ECC71) - Solutions

### UI Style
- More documentary/serious vs. playful game
- Real photos over illustrations (where possible)
- Data visualizations (charts, heat maps)
- Call-to-action buttons (e.g., "Support Rangers")

---

## 📄 Next Steps

1. **Get Approval:** Share this plan with Mara Elephant Project
2. **Asset Collection:** Gather approved photos, content, and data
3. **API Access:** Apply for Earth Ranger API credentials
4. **Design Review:** Create mockups for dashboard and challenges
5. **Development Sprint:** Build conservation experience
6. **Testing & Iteration:** User test with stakeholders
7. **Launch:** Deploy Mara ecoregion to production

---

## 🤝 Questions for Mara Elephant Project

1. Do we have confirmed access to Earth Ranger API?
2. What animal tracking data can be shown publicly?
3. Are there specific conservation messages to emphasize?
4. Can we use real photos/videos from your operations?
5. What is the target audience? (Age, knowledge level)
6. Should we include donation/support CTAs?
7. Do you want branding (logo, colors) throughout?
8. Timeline expectations for launch?

---

**Next Action:** Review this plan and let me know:
- What assets you can provide
- What we should generate with AI
- Whether Earth Ranger API is confirmed
- Any adjustments to the conservation experience flow
