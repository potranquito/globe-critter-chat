# Background Enrichment Agent Architecture

## Overview
Multi-source data enrichment system that fetches real-time environmental, ecological, and conservation data while users explore educational content.

## Data Sources

### 1. NASA FIRMS (Fire Information)
- **API**: https://firms.modaps.eosdis.nasa.gov/api/
- **Data**: Active fires, thermal anomalies
- **Use Case**: "⚠️ Active wildfire detected 15 miles from park"
- **Update Frequency**: Near real-time (every 3-6 hours)
- **Fields**: lat, lng, brightness, confidence, acquisition_date

### 2. USGS Earthquake Data
- **API**: https://earthquake.usgs.gov/fdsnws/event/1/
- **Data**: Recent earthquakes by region
- **Use Case**: "Recent seismic activity may affect wildlife behavior"
- **Update Frequency**: Real-time
- **Fields**: magnitude, depth, time, lat, lng

### 3. Weather Data
- **API Options**:
  - OpenWeatherMap (free tier)
  - NOAA API (US-focused, free)
- **Data**: Current conditions, forecasts
- **Use Case**: "Current temp 72°F - peak activity time for cold-blooded species"
- **Fields**: temp, humidity, conditions, wind

### 4. eBird (Bird Sightings)
- **API**: https://documenter.getpostman.com/view/664302/S1ENwy59
- **Data**: Recent bird observations
- **Use Case**: "5 Bald Eagles spotted this week!"
- **Update Frequency**: Real-time citizen science
- **Fields**: species, count, date, location, observer

### 5. iNaturalist (All Species Observations)
- **API**: https://api.inaturalist.org/v1/docs/
- **Data**: Research-grade observations with photos
- **Use Case**: Show recent sightings gallery
- **Fields**: species, photo_url, observer, date, research_grade

### 6. GBIF (Species Occurrences)
- **API**: https://www.gbif.org/developer/occurrence
- **Data**: Historical occurrence data
- **Use Case**: "20,000 grizzly bear sightings recorded in Yellowstone"
- **Fields**: species, count, time_range

### 7. Conservation Events
- **API Options**:
  - WWF News API (if available)
  - Guardian API (environment section)
  - Custom RSS feeds
- **Data**: Recent conservation news
- **Use Case**: "New wolf pack discovered in park last month"

## Agent Architecture

### Multi-Agent Coordinator

```typescript
interface EnrichmentAgent {
  id: string;
  source: DataSource;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeout: number;
  retryAttempts: number;
}

interface EnrichmentResult {
  source: string;
  data: any;
  success: boolean;
  timestamp: Date;
  cached?: boolean;
}

class BackgroundEnrichmentCoordinator {
  agents: EnrichmentAgent[];

  async enrichPark(park: Park): Promise<EnrichmentResult[]> {
    const results = await Promise.allSettled([
      this.fetchFireData(park.bounds),
      this.fetchEarthquakeData(park.bounds),
      this.fetchWeather(park.coordinates),
      this.fetchBirdSightings(park.id),
      this.fetchiNaturalistSightings(park.bounds),
      this.fetchConservationNews(park.name)
    ]);

    return this.processResults(results);
  }
}
```

## Agent Execution Flow

### Stage 1: User Clicks Region (3D → 2D transition)
```
User clicks "North American Deserts" ecoregion
  ↓
IMMEDIATE:
- Show ecoregion info
- Display pre-loaded species list (from IUCN data)
- Render 2D map with park pins
  ↓
BACKGROUND (parallel execution):
- Start regional enrichment agent
  → Fetch regional weather patterns
  → Fetch regional fire activity (NASA FIRMS)
  → Fetch regional earthquake activity (USGS)
```

### Stage 2: User Clicks Park Pin
```
User clicks "Joshua Tree National Park"
  ↓
IMMEDIATE:
- Show park info
- Display park species list (pre-loaded)
- Show educational content
  ↓
BACKGROUND (parallel execution):
- Fire Agent: Check NASA FIRMS within 50mi radius
- Earthquake Agent: Check USGS for recent activity
- Weather Agent: Current conditions + 7-day forecast
- eBird Agent: Recent bird sightings (last 30 days)
- iNaturalist Agent: Research-grade observations (last 30 days)
- News Agent: Conservation stories mentioning park
  ↓
USER READS (30-60 seconds)
  ↓
Agents complete, cache results
```

### Stage 3: User Clicks "Play Quiz"
```
User ready to play
  ↓
Generate quiz using:
- Static species data (IUCN) ← Always available
- Enriched real-time data ← If agents succeeded
- Fallback questions ← If agents failed
  ↓
Example Quiz Question:
"A wildfire was detected 15 miles west of Joshua Tree
this week. Which of these desert animals is MOST likely
to temporarily relocate?"
a) Desert Tortoise ✓ (correct - slow moving, fire-sensitive)
b) Roadrunner
c) Kangaroo Rat
d) Chuckwalla
```

## Agent Implementation

### Individual Agent Structure

```typescript
// src/services/enrichment/agents/FireAgent.ts

export class FireAgent {
  private apiKey: string;
  private cacheDuration = 3600000; // 1 hour

  async fetch(bounds: GeoBounds): Promise<FireData> {
    const cached = await this.checkCache(bounds);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${this.apiKey}/VIIRS_SNPP_NRT/${bounds.minLat},${bounds.minLng},${bounds.maxLat},${bounds.maxLng}/1`
      );

      const data = await this.parseCSV(response);
      await this.cacheResult(bounds, data);
      return data;
    } catch (error) {
      return this.handleError(error);
    }
  }

  async analyze(data: FireData, park: Park): Promise<FireAlert> {
    const nearbyFires = data.filter(fire =>
      this.distanceInMiles(fire, park.coordinates) < 50
    );

    if (nearbyFires.length > 0) {
      return {
        severity: this.calculateSeverity(nearbyFires),
        distance: Math.min(...nearbyFires.map(f =>
          this.distanceInMiles(f, park.coordinates)
        )),
        count: nearbyFires.length,
        mostRecent: nearbyFires[0].acquisition_date
      };
    }

    return { severity: 'none' };
  }
}
```

### Coordinator with Error Handling

```typescript
// src/services/enrichment/EnrichmentCoordinator.ts

export class EnrichmentCoordinator {
  private agents = {
    fire: new FireAgent(),
    earthquake: new EarthquakeAgent(),
    weather: new WeatherAgent(),
    ebird: new EBirdAgent(),
    inaturalist: new INaturalistAgent(),
    news: new NewsAgent()
  };

  async enrichPark(park: Park): Promise<EnrichmentData> {
    const startTime = Date.now();

    // Execute all agents in parallel with timeout
    const results = await Promise.allSettled([
      this.timeoutPromise(
        this.agents.fire.fetch(park.bounds),
        5000, 'fire'
      ),
      this.timeoutPromise(
        this.agents.earthquake.fetch(park.bounds),
        5000, 'earthquake'
      ),
      this.timeoutPromise(
        this.agents.weather.fetch(park.coordinates),
        3000, 'weather'
      ),
      this.timeoutPromise(
        this.agents.ebird.fetch(park.id),
        10000, 'ebird'
      ),
      this.timeoutPromise(
        this.agents.inaturalist.fetch(park.bounds),
        10000, 'inaturalist'
      ),
      this.timeoutPromise(
        this.agents.news.fetch(park.name),
        5000, 'news'
      )
    ]);

    const enrichmentData = this.processResults(results);

    // Log performance
    console.log(`Enrichment completed in ${Date.now() - startTime}ms`);
    console.log(`Successful: ${enrichmentData.successful.length}`);
    console.log(`Failed: ${enrichmentData.failed.length}`);

    return enrichmentData;
  }

  private async timeoutPromise<T>(
    promise: Promise<T>,
    timeoutMs: number,
    agentName: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${agentName} timeout`)), timeoutMs)
      )
    ]);
  }
}
```

## Quiz Generation Integration

```typescript
// src/services/quiz/EnrichedQuizGenerator.ts

export class EnrichedQuizGenerator {
  async generateQuiz(
    park: Park,
    species: Species[],
    enrichmentData: EnrichmentData
  ): Promise<Quiz> {
    const questions: Question[] = [];

    // Static questions (always available)
    questions.push(...this.generateStaticQuestions(species));

    // Enriched questions (if data available)
    if (enrichmentData.fire?.severity !== 'none') {
      questions.push(this.generateFireQuestion(enrichmentData.fire, species));
    }

    if (enrichmentData.weather) {
      questions.push(this.generateWeatherQuestion(enrichmentData.weather, species));
    }

    if (enrichmentData.ebird?.recentSightings.length > 0) {
      questions.push(this.generateRecentSightingQuestion(enrichmentData.ebird));
    }

    // Mix and select final questions
    return this.selectQuestions(questions, 10);
  }

  private generateFireQuestion(fire: FireAlert, species: Species[]): Question {
    const fireAdaptedSpecies = species.filter(s =>
      s.traits.includes('fire-adapted')
    );

    return {
      type: 'multiple-choice',
      question: `A wildfire was detected ${Math.round(fire.distance)} miles from the park. Which species is MOST adapted to survive fire events?`,
      options: [
        { text: fireAdaptedSpecies[0].commonName, correct: true },
        { text: species[1].commonName, correct: false },
        { text: species[2].commonName, correct: false },
        { text: species[3].commonName, correct: false }
      ],
      context: `Real-time fire data from NASA FIRMS shows active fires nearby. Understanding how wildlife responds to fire is crucial for conservation.`,
      source: 'NASA FIRMS'
    };
  }
}
```

## Caching Strategy

### Redis/Supabase Cache Structure

```typescript
interface CacheEntry {
  key: string;           // "fire:joshua-tree:2025-10-11"
  data: any;
  timestamp: Date;
  ttl: number;          // Time to live in seconds
}

// Cache keys by source
const CACHE_CONFIG = {
  fire: { ttl: 3600 },        // 1 hour
  earthquake: { ttl: 1800 },  // 30 minutes
  weather: { ttl: 1800 },     // 30 minutes
  ebird: { ttl: 86400 },      // 24 hours
  inaturalist: { ttl: 86400 },// 24 hours
  news: { ttl: 86400 }        // 24 hours
};
```

## API Keys & Environment Variables

```bash
# .env.local
NASA_FIRMS_API_KEY=your_key_here
OPENWEATHER_API_KEY=your_key_here
EBIRD_API_KEY=your_key_here
INATURALIST_API_TOKEN=your_token_here
USGS_API_KEY=optional_key_here
```

## Error Handling & Fallbacks

### Graceful Degradation
1. **All agents fail**: Use static species data only
2. **Some agents fail**: Use successful data, skip failed
3. **Timeout**: Return partial results
4. **Rate limit**: Use cached data (even if stale)

### User Experience
- Never show loading spinners for enrichment
- Display enriched data when available via subtle badges:
  - 🔥 "Recent fire activity detected"
  - 🦅 "5 new bird sightings this week"
  - 🌡️ "Current temp: 72°F - peak activity"

## Performance Targets

- **Total enrichment time**: < 10 seconds
- **Individual agent timeout**: 3-10 seconds
- **Cache hit rate**: > 70%
- **Quiz generation**: < 2 seconds

## Next Steps

1. Implement individual agents (start with Fire & Weather)
2. Build coordinator with parallel execution
3. Add Supabase caching layer
4. Integrate with quiz generation
5. Add monitoring/analytics for agent performance
