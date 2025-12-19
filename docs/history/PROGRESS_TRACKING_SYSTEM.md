# Progress Tracking System - Complete Guide

## Overview

The game now has a **3-tier hierarchical progress system**:

1. **Park Level** → Users earn 0-3 stars per park (one star per completed phase)
2. **Eco-region Level** → Complete ALL parks in an eco-region → eco-region becomes complete
3. **Global Level** → Eco-regions completed by players increase the global health bar towards 100%

## How It Works

### Automatic Progress Flow

```
User completes park phase
    ↓
Park stars update (user_park_progress table)
    ↓
Trigger: update_ecoregion_progress_on_park_change()
    ↓
Eco-region progress calculated automatically
    ↓
When eco-region complete (all parks = 3 stars)
    ↓
Trigger: trigger_global_health_on_ecoregion_complete()
    ↓
Global health bar updated
```

Everything is **automatic** - no manual updates needed!

## Database Schema

### 1. User Park Progress (Already Exists)
`user_park_progress` - Tracks individual park completion

```sql
- user_id (FK to users)
- park_id (FK to parks)
- park_name
- stars (0-3)
- completed_at (when stars reached 3)
```

### 2. User Eco-region Progress (Already Exists)
`user_ecoregion_progress` - Tracks eco-region completion

```sql
- user_id (FK to users)
- ecoregion_id (FK to ecoregions)
- parks_completed (array of park UUIDs with 3 stars)
- parks_in_progress (array of park UUIDs with 1-2 stars)
- total_parks (total parks in this ecoregion)
- completed_parks (parks with 3 stars)
- completion_percentage (auto-calculated: completed_parks / total_parks * 100)
- is_complete (boolean: true when all parks have 3 stars)
- pollution_asset_removed (game mechanic: remove pollution graphic)
- completed_at (when is_complete became true)
```

### 3. Global Health (NEW)
`global_health` - Tracks overall game progress

```sql
- id (always 1 - singleton table)
- health_percentage (0-100)
- total_ecoregions (ecoregions with parks)
- completed_ecoregions (ecoregions completed by ANY user)
- total_users
- active_users (active in last 7 days)
- total_parks_completed (all parks with 3 stars)
- updated_at
```

## Database Migration

Apply the new migration to enable progress tracking:

```bash
# Option 1: Supabase Dashboard
1. Go to SQL Editor
2. Paste contents of: supabase/migrations/20251031000002_global_health_and_progress_tracking.sql
3. Run

# Option 2: CLI (when Docker running)
supabase db push
```

## TypeScript API

### Service Functions (`src/lib/progressTracking.ts`)

```typescript
import {
  getGlobalHealth,
  getUserEcoregionProgress,
  getUserCompletionStats,
  getEcoregionParksWithProgress,
  isEcoregionComplete,
  refreshGlobalHealth,
  recalculateUserProgress
} from '@/lib/progressTracking';

// Get global health stats
const health = await getGlobalHealth();
// Returns: { health_percentage, total_ecoregions, completed_ecoregions, ... }

// Get user's eco-region progress
const progress = await getUserEcoregionProgress(userId);
// Returns array of eco-regions with completion data

// Get parks in an eco-region with user's progress
const parks = await getEcoregionParksWithProgress(ecoregionId, userId);
// Returns array of parks with stars and completion status

// Get user completion stats
const stats = await getUserCompletionStats(userId);
// Returns: { totalEcoregions, completedEcoregions, totalParks, completedParks, completionPercentage }

// Check if eco-region is complete
const isComplete = await isEcoregionComplete(userId, ecoregionId);
// Returns: boolean

// Manually refresh global health (usually automatic)
await refreshGlobalHealth();

// Recalculate user progress (for testing/debugging)
await recalculateUserProgress(userId);
```

### React Hook (`src/hooks/useProgressTracking.ts`)

```typescript
import { useProgressTracking } from '@/hooks/useProgressTracking';

function MyComponent() {
  const {
    globalHealth,           // Global health data
    ecoregionProgress,      // User's eco-region progress array
    userStats,              // User completion stats
    isLoading,              // Loading state
    getEcoregionProgress,   // Helper: get specific eco-region
    isEcoregionComplete,    // Helper: check if complete
    getCompletedEcoregions, // Helper: get all completed
    getInProgressEcoregions // Helper: get in-progress
  } = useProgressTracking();

  return (
    <div>
      <h1>Global Health: {globalHealth?.health_percentage}%</h1>
      <p>You've completed {userStats.completedEcoregions} eco-regions!</p>
    </div>
  );
}
```

## UI Components

### GlobalHealthBar Component

```typescript
import { GlobalHealthBar } from '@/components/GlobalHealthBar';

// Full version (card with stats)
<GlobalHealthBar variant="full" />

// Compact version (inline progress bar)
<GlobalHealthBar variant="compact" />
```

## Example Usage

### Show User Progress on Home Page

```typescript
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { GlobalHealthBar } from '@/components/GlobalHealthBar';

export function HomePage() {
  const { userStats, ecoregionProgress, isLoading } = useProgressTracking();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {/* Global health */}
      <GlobalHealthBar variant="compact" />

      {/* User stats */}
      <div>
        <h2>Your Progress</h2>
        <p>Eco-regions completed: {userStats.completedEcoregions}</p>
        <p>Parks completed: {userStats.completedParks}</p>
        <p>Overall completion: {userStats.completionPercentage}%</p>
      </div>

      {/* Eco-region list */}
      <div>
        <h3>Eco-regions</h3>
        {ecoregionProgress.map(region => (
          <div key={region.ecoregion_id}>
            <h4>{region.ecoregion_name}</h4>
            <p>{region.completed_parks} / {region.total_parks} parks</p>
            <p>{region.completion_percentage}% complete</p>
            {region.is_complete && <span>✅ Complete!</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Show Eco-region Details

```typescript
import { getEcoregionParksWithProgress } from '@/lib/progressTracking';

async function EcoregionPage({ ecoregionId, userId }) {
  const parks = await getEcoregionParksWithProgress(ecoregionId, userId);

  return (
    <div>
      <h2>Parks in this Eco-region</h2>
      {parks.map(park => (
        <div key={park.park_id}>
          <h3>{park.park_name}</h3>
          <p>Stars: {park.stars} / 3</p>
          {park.completed && <span>✅ Completed!</span>}
        </div>
      ))}
    </div>
  );
}
```

## Testing the System

### 1. Create a Test Account
```bash
# Sign up at: http://localhost:8080/park-select
# Email: test@test.com
# Password: test123
```

### 2. Complete Some Parks
- Play through parks and earn stars
- Each park has 3 phases → 3 stars total
- Progress saves automatically to database

### 3. Check Progress in Database

```sql
-- View your park progress
SELECT park_name, stars, completed_at
FROM user_park_progress
WHERE user_id = '<your-user-id>'
ORDER BY stars DESC;

-- View your eco-region progress
SELECT e.name, uep.completed_parks, uep.total_parks, uep.completion_percentage, uep.is_complete
FROM user_ecoregion_progress uep
JOIN ecoregions e ON e.id = uep.ecoregion_id
WHERE uep.user_id = '<your-user-id>';

-- View global health
SELECT * FROM global_health;
```

### 4. Test Completion Flow

```typescript
// In browser console or component:
import { recalculateUserProgress } from '@/lib/progressTracking';

// Force recalculation (useful after manual DB changes)
await recalculateUserProgress('<your-user-id>');
```

## Gamification Goals

### Park Level
- **Goal**: Complete all 3 phases of a park
- **Reward**: 3 stars, unlock next park in eco-region

### Eco-region Level
- **Goal**: Get 3 stars on ALL parks in eco-region
- **Reward**:
  - Eco-region marked complete
  - Pollution graphic removed from globe
  - Contributes to global health

### Global Level
- **Goal**: Get global health to 100%
- **How**: Complete as many eco-regions as possible
- **Calculation**: (completed_ecoregions / total_ecoregions) × 100
- **Community Goal**: All players contribute!

## Advanced Features

### Pollution Removal Mechanic

When a user completes an eco-region:
```typescript
const region = await getEcoregionProgress(userId, ecoregionId);
if (region.pollution_removed) {
  // Hide pollution graphic on globe for this eco-region
  hidePollutionGraphic(ecoregionId);
}
```

### Leaderboards (Future)

Track top contributors:
```sql
-- Top users by eco-regions completed
SELECT
  u.username,
  COUNT(*) as completed_ecoregions
FROM user_ecoregion_progress uep
JOIN users u ON u.id = uep.user_id
WHERE uep.is_complete = true
GROUP BY u.id, u.username
ORDER BY completed_ecoregions DESC
LIMIT 10;
```

### Progress Notifications

Show toast when user completes eco-region:
```typescript
const { addStar } = useParkStars();

await addStar(parkId, parkName);

// Check if eco-region just completed
const isComplete = await isEcoregionComplete(userId, ecoregionId);
if (isComplete) {
  toast({
    title: '🎉 Eco-region Complete!',
    description: 'You completed the Amazon Rainforest!',
  });
}
```

## Troubleshooting

### Progress not updating?

```typescript
// Force recalculation
import { recalculateUserProgress, refreshGlobalHealth } from '@/lib/progressTracking';

await recalculateUserProgress(userId);
await refreshGlobalHealth();
```

### Check trigger execution

```sql
-- See if triggers are enabled
SELECT * FROM pg_trigger WHERE tgname LIKE '%ecoregion%';

-- Manual trigger test
UPDATE user_park_progress
SET stars = stars
WHERE user_id = '<your-user-id>'
LIMIT 1;
-- This should trigger eco-region recalculation
```

### Debug eco-region progress

```sql
-- See which parks belong to which eco-region
SELECT e.name as ecoregion, p.name as park
FROM parks p
JOIN ecoregions e ON e.id = p.ecoregion_id
ORDER BY e.name, p.name;

-- See user's progress per eco-region
SELECT
  e.name,
  uep.completed_parks,
  uep.total_parks,
  uep.is_complete
FROM user_ecoregion_progress uep
JOIN ecoregions e ON e.id = uep.ecoregion_id
WHERE uep.user_id = '<your-user-id>';
```

## Performance Considerations

- ✅ All progress updates use **database triggers** (automatic, no API calls needed)
- ✅ Global health uses **indexes** for fast queries
- ✅ `completion_percentage` is **auto-calculated** (GENERATED column)
- ✅ React hook **caches** data and refreshes every 30 seconds
- ✅ Only **changed eco-regions** trigger global health updates

## Files Created

### Database:
- `supabase/migrations/20251031000002_global_health_and_progress_tracking.sql`

### TypeScript:
- `src/lib/progressTracking.ts` - Service functions
- `src/hooks/useProgressTracking.ts` - React hook
- `src/components/GlobalHealthBar.tsx` - UI component

## Next Steps

1. **Apply the migration** (see instructions above)
2. **Test the system** by completing parks
3. **Add GlobalHealthBar** to your home page
4. **Show eco-region progress** in park selection
5. **Add celebratory animations** when eco-regions complete
6. **Implement pollution removal** visual feedback

Your gamification system is ready! 🎮🌍
