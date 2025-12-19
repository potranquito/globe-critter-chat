# ✅ NEW Reveal Mechanic - COMPLETE!

## 🎉 Implementation Summary

The food web game now uses a **reveal-based mechanic** where students must carefully choose which species to reveal, with penalties for wrong guesses!

---

## 🆕 What Changed

### The Old Flow (Removed):
❌ Click species → Instant validation → Trivia question

### The New Flow (Implemented):
✅ Click species → Image appears (facts hidden) → Click "Reveal Species" → Validation + consequences

---

## 🎮 Complete Game Flow

```
BEFORE GAME:
Carousel DISABLED → Can't click species

↓ User clicks "Play Trivia" ↓

MCP fetches 3 target species
AI: "Find the African Teak!"
Carousel UNLOCKED

↓ User clicks species in carousel ↓

RIGHT PANEL:
- Shows image
- ❓ Facts HIDDEN
- Button: "🔍 Reveal Species"

↓ User clicks "Reveal Species" ↓

REVEAL + VALIDATION:
Facts appear momentarily
AI checks if correct

     ↙               ↘
  CORRECT          WRONG
     ↓               ↓
 Add to         Clear panel
 food web       Carousel LOCKED
 Next phase     AI: "That was a Sun Bear! They love honey.
                     But I need the Clouded Leopard.
                     Want a hint? Answer this..."
                ↓
           User answers trivia
                ↓
           Attempt 1: Hint Level 1 (vague)
           Attempt 2: Hint Level 2 (medium)
           Attempt 3: Hint Level 3 (specific)
           Attempt 4: AUTO-REVEAL (give them answer)
                ↓
           Carousel UNLOCKED
           Try again
```

---

## 🎯 Key Features Implemented

### 1. **Reveal Mechanic**
- Species image shown immediately
- Facts hidden until "Reveal Species" clicked
- Creates suspense and engagement

### 2. **One Reveal Per Turn**
- After wrong reveal, carousel locks
- Must answer trivia to unlock
- Forces careful selection

### 3. **Progressive Hints** (1→2→3)
- **Attempt 1**: Level 1 hint (vague) - "Look for green leaves"
- **Attempt 2**: Level 2 hint (medium) - "Look for green leaves and thick trunk"
- **Attempt 3**: Level 3 hint (specific) - "Look for green leaves, thick trunk, and smooth bark"
- **Attempt 4**: AUTO-REVEAL - AI just tells them the answer

### 4. **Educational Even When Wrong**
- AI explains what the wrong species was
- Shares a fact about it
- Students learn about multiple species

### 5. **Smart Unlocking**
- Carousel locks after wrong reveal
- Unlocks after correct trivia answer
- Prevents spam clicking

---

## 📊 State Management

### New State Variables (`src/pages/Index.tsx`):
```typescript
const [selectedSpeciesForReveal, setSelectedSpeciesForReveal] = useState<RegionSpecies | null>(null);
const [isSpeciesRevealed, setIsSpeciesRevealed] = useState(false);
const [revealAttemptCount, setRevealAttemptCount] = useState(0); // Max 4
const [isCarouselLocked, setIsCarouselLocked] = useState(false);
```

### Flow Control:
1. `selectedSpeciesForReveal` - Species waiting to be revealed
2. `isSpeciesRevealed` - Whether facts are showing
3. `revealAttemptCount` - Tracks attempts (0-4)
4. `isCarouselLocked` - Prevents clicking during trivia

---

## 🔧 Implementation Details

### Files Modified:

#### 1. **`src/pages/Index.tsx`**
- Added reveal mechanic state management
- Updated `handleCarouselSpeciesSelect()` - now shows image only
- Added `handleRevealSpecies()` - validates and handles consequences
- Updated `handlePlayTrivia()` - resets reveal state
- Wired up `RegionSpeciesCard` with new props

#### 2. **`src/components/RegionSpeciesCard.tsx`**
- Added props: `isGameMode`, `hideFacts`, `onRevealClick`
- Conditionally hides name/facts when `hideFacts=true`
- Shows placeholder: "❓ Click 'Reveal Species' to find out!"
- Displays "🔍 Reveal Species" button in game mode
- Shows facts after reveal

#### 3. **`src/services/educationAgent.ts`**
- Increased MCP species limit from 20 to 50 (better success rate)
- Added debug logging for MCP results
- Updated system prompt to mention progressive hints

---

## 🧪 How To Test

### Step 1: Start Game
1. Open http://localhost:8081
2. Click Borneo or Amazon region
3. Click "🎮 START FOOD WEB TRIVIA"
4. Watch console for MCP queries

**Expected Console:**
```
🎯 Initializing target species for: Borneo Lowland Rain Forests
[Food Web Game] MCP Results: { carnivores: 15, herbivores: 22, producers: 18 }
[Food Web Game] Selected targets: { carnivore: "Clouded Leopard", herbivore: "...", producer: "..." }
```

### Step 2: Click Species (Wrong One)
1. Click a species in carousel
2. Right panel shows image + "❓" placeholder
3. Click "🔍 Reveal Species"

**Expected Behavior:**
```
✅ Facts appear briefly
❌ Panel clears
🔒 Carousel locks
🤖 AI: "That was a Sun Bear! Did you know they love honey? But I need the Clouded Leopard. Want a hint? Answer this question: [trivia]"
```

### Step 3: Answer Trivia
1. Type answer (A, B, C, or D)
2. If correct → AI gives hint
3. Carousel unlocks

**Expected AI Response:**
```
"Great job! That's correct! Hint: Look for spotted golden fur."
```

### Step 4: Try Again
1. Click another species
2. Click "Reveal Species"
3. If wrong again → Attempt 2 hint (more specific)

### Step 5: Fourth Attempt
1. If still wrong after 3 attempts
2. AI auto-reveals answer
3. Moves to next phase

**Expected:**
```
🎁 "Don't worry! It's the Clouded Leopard! They are amazing climbers..."
✅ Species added to food web
➡️ Moving to Phase 2
```

---

## 📋 Testing Checklist

### Before Game Start:
- [ ] Carousel is disabled (can't click species)
- [ ] No species card on right panel

### After "Play Trivia":
- [ ] Carousel unlocks
- [ ] AI asks for specific species by name
- [ ] Can click species

### After Species Click:
- [ ] Image appears on right panel
- [ ] Facts are HIDDEN (❓ placeholder showing)
- [ ] "🔍 Reveal Species" button appears
- [ ] Can't click other species until reveal

### After Wrong Reveal:
- [ ] Facts appear briefly then clear
- [ ] Right panel empties
- [ ] Carousel LOCKS
- [ ] AI explains what species it was
- [ ] AI asks trivia question

### After Correct Trivia:
- [ ] AI gives progressive hint (Level 1/2/3)
- [ ] Carousel UNLOCKS
- [ ] Can select another species

### After 4th Wrong Attempt:
- [ ] AI auto-reveals correct species
- [ ] Species added to food web
- [ ] Moves to next phase automatically

### After Correct Reveal:
- [ ] Species added to food web banner
- [ ] Right panel clears
- [ ] Moves to next phase
- [ ] AI asks for next species

---

## 🎨 Visual Indicators

### Right Panel States:

**1. No Selection:**
```
[Empty]
```

**2. Species Selected (Not Revealed):**
```
┌─────────────────┐
│   [Image]       │
│                 │
│      ❓         │
│  "Click Reveal  │
│   to find out!" │
│                 │
│ 🔍 Reveal       │
│    Species      │
└─────────────────┘
```

**3. Species Revealed (Facts Showing):**
```
┌─────────────────┐
│   [Image]       │
│                 │
│ Clouded Leopard │
│ Mammal          │
│                 │
│ Status: VU      │
│ Role: 🥩 Pred.  │
└─────────────────┘
```

---

## 🔍 Console Logs To Watch

### Game Start:
```
🎯 Initializing target species for: Borneo
[MCP Client] Calling tool: get_region_species
[Food Web Game] MCP Results: { carnivores: 15, herbivores: 22, producers: 18 }
✅ Food Web Trivia started! Target: Dipterocarp Tree
```

### Species Click:
```
🎮 Species clicked during food web game: Sun Bear
✅ Species selected for reveal. Facts hidden until reveal button clicked.
```

### Wrong Reveal:
```
🔍 Revealing species: Sun Bear
Validation result: { correct: false, targetName: "Dipterocarp Tree" }
❌ Wrong! That is not: Dipterocarp Tree
🔒 Carousel locked. Attempt 1/4
```

### Correct Reveal:
```
🔍 Revealing species: Dipterocarp Tree
Validation result: { correct: true, targetName: "Dipterocarp Tree" }
✅ Correct! User found: Dipterocarp Tree
✅ Moving to phase 2
```

### Fourth Attempt:
```
🎁 4th attempt - auto-revealing correct species
✅ Auto-added to food web
➡️ Moving to next phase
```

---

## ⚙️ Technical Implementation

### handleCarouselSpeciesSelect():
```typescript
// Shows image, hides facts
setSelectedSpeciesForReveal(species);
setIsSpeciesRevealed(false);
setSelectedCarouselSpecies(species);
```

### handleRevealSpecies():
```typescript
// Reveals facts
setIsSpeciesRevealed(true);

// Validates
const validation = validateSpeciesSelection(...);

if (correct) {
  // Add to food web, next phase
} else {
  // Lock carousel, increment attempts
  // Check if 4th attempt (auto-reveal)
  // Send to AI for trivia + hint
}
```

### RegionSpeciesCard:
```typescript
{!hideFacts ? (
  // Show name, facts, conservation status
) : (
  // Show ❓ placeholder
)}

{isGameMode && hideFacts && (
  <Button onClick={onRevealClick}>
    🔍 Reveal Species
  </Button>
)}
```

---

## 🚀 Ready to Test!

**Dev server**: http://localhost:8081 (already running)
**Best test regions**: Borneo, Amazon, Congo

**Expected completion time**: 5-10 minutes per game
**Max attempts per species**: 4 (then auto-reveal)
**Total species needed**: 3 (Producer → Herbivore → Carnivore)

---

## ✅ Success Criteria

You'll know it's working when:
1. ✅ Carousel disabled until game starts
2. ✅ Species click shows image only (facts hidden)
3. ✅ "Reveal Species" button appears
4. ✅ Wrong reveal locks carousel
5. ✅ AI asks trivia to unlock
6. ✅ Progressive hints get more specific
7. ✅ 4th attempt auto-reveals answer
8. ✅ Correct reveal adds to food web

---

**Status**: ✅ FULLY IMPLEMENTED AND READY TO TEST!

🎮 The reveal mechanic is live! Open the app and try it out!
