# 🎮 Food Web Game - Next Steps Guide

## 📍 Current Status

### ✅ What's Complete:

1. **MCP Server Built & Deployed**
   - GitHub: `https://github.com/potranquito/globe-critter-mcp-server`
   - Railway (Production): `https://globe-critter-mcp-server-production.up.railway.app`
   - Local Claude Desktop: Configured at `~/.config/Claude/claude_desktop_config.json`
   - **Status: Working!** (Both test buttons passed ✅)

2. **MCP Tools Available:**
   - `get_region_species` - Query species by eco-region with filters
   - `get_species_details` - Get full species information
   - `get_ecoregion_info` - Get biome colors for 2D games
   - `get_park_species` - (Future ready)
   - `get_park_info` - (Future ready)

3. **React Frontend Connected:**
   - MCP client: `src/services/mcpClient.ts`
   - Test component: `src/components/MCPTestComponent.tsx` (temporary)
   - Environment: `.env` has `VITE_MCP_SERVER_URL`

4. **Game UI Exists:**
   - Food web selection bar at top of screen
   - "START FOOD WEB TRIVIA" button (not wired up yet)
   - Chat interface (not connected to MCP yet)
   - Species carousel on map

---

## 🎯 What Needs to Be Built

Your goal: **AI-powered trivia game where students select 3 species (Carnivore, Herbivore, Producer) to build a food web, unlocking a custom 2D ecosystem game.**

### Flow Overview:
1. Student clicks eco-region pin → Sees species carousel
2. Student clicks "START FOOD WEB TRIVIA" → Chat opens
3. AI asks trivia questions (powered by MCP server)
4. Student answers correctly → AI reveals species hints
5. Student selects 3 species → Progress bar fills to 100%
6. AI generates 2D game with selected species
7. Student plays Pac-man style ecosystem game

---

## 📋 Implementation Phases

### **Phase 1: Wire Up MCP to Education Agent** (Start Here!)

**Goal:** Make the AI agent use MCP server to query species

**Current Issue:**
- `educationAgent.ts` doesn't know about MCP yet
- When trivia starts, AI should call `getRegionSpecies()` to filter by diet

**What to Do:**

#### 1.1 Update Education Agent to Use MCP

**File:** `src/services/educationAgent.ts`

**Find this section** (around line 94-162):
```typescript
export async function sendEducationMessage(
  message: string,
  context: EducationContext
): Promise<string> {
  // Current implementation uses OpenAI directly
  // Need to add MCP tool calling
}
```

**Add MCP integration:**
```typescript
import { getRegionSpecies, getEcoregionInfo } from './mcpClient';

// When game starts, query species by dietary category
const carnivores = await getRegionSpecies({
  ecoregionName: context.regionInfo.regionName,
  dietaryCategory: 'Carnivore',
  limit: 10
});

const herbivores = await getRegionSpecies({
  ecoregionName: context.regionInfo.regionName,
  dietaryCategory: 'Herbivore',
  limit: 10
});

const producers = await getRegionSpecies({
  ecoregionName: context.regionInfo.regionName,
  dietaryCategory: 'Producer',
  limit: 10
});
```

**System Prompt Enhancement:**
```typescript
const systemPrompt = `
You are helping a student build a food web for ${context.regionInfo.regionName}.

Available species in this region:
- Carnivores: ${carnivores.species.map(s => s.common_name).join(', ')}
- Herbivores: ${herbivores.species.map(s => s.common_name).join(', ')}
- Producers: ${producers.species.map(s => s.common_name).join(', ')}

Game Rules:
1. Student must select 1 Carnivore, 1 Herbivore/Omnivore, and 1 Producer
2. Ask trivia questions before giving hints
3. When all 3 species selected, say "GAME_COMPLETE"
`;
```

#### 1.2 Test MCP Integration

**Steps:**
1. Open dev server: `npm run dev`
2. Click an eco-region pin
3. Click "START FOOD WEB TRIVIA"
4. Check browser console - should see MCP queries
5. AI should mention real species names from database

**Expected Output:**
```
[MCP Client] Calling tool: get_region_species
[MCP Client] Result: { success: true, species: [...] }
```

---

### **Phase 2: Build Progress Bar Component**

**Goal:** Visual feedback showing game completion (0-100%)

**What to Build:**

#### 2.1 Create Progress Bar Component

**File:** `src/components/FoodWebProgressBar.tsx`

```typescript
interface FoodWebProgressBarProps {
  selectedSpecies: {
    carnivore: string | null;
    herbivoreOmnivore: string | null;
    producer: string | null;
  };
}

export const FoodWebProgressBar = ({ selectedSpecies }: FoodWebProgressBarProps) => {
  const speciesCount = Object.values(selectedSpecies).filter(Boolean).length;
  const progress = Math.round((speciesCount / 3) * 100);

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-64 glass-panel rounded-xl p-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl animate-pulse">👁️</div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-emerald-300">
            AI Vision Restoring
          </p>
          <p className="text-[10px] text-muted-foreground">
            {progress}% Complete
          </p>
        </div>
      </div>

      <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Species Checkboxes */}
      <div className="mt-3 space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${selectedSpecies.carnivore ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <span>Carnivore</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${selectedSpecies.herbivoreOmnivore ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <span>Herbivore/Omnivore</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${selectedSpecies.producer ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          <span>Producer</span>
        </div>
      </div>
    </div>
  );
};
```

#### 2.2 Add to Index.tsx

**File:** `src/pages/Index.tsx`

**Find:** The section where `FoodWebSelectionBar` is rendered (around line 3088)

**Add after it:**
```typescript
{/* Progress Bar - Shows during trivia game */}
{isChatHistoryExpanded && (
  <FoodWebProgressBar selectedSpecies={selectedFoodWebSpecies} />
)}
```

---

### **Phase 3: Trivia-Gated Hints System**

**Goal:** Student must answer trivia before getting species hints

**What to Build:**

#### 3.1 Add Trivia State to Index.tsx

```typescript
const [currentTriviaQuestion, setCurrentTriviaQuestion] = useState<string | null>(null);
const [triviaAnswered, setTriviaAnswered] = useState(false);
```

#### 3.2 Update Education Agent Prompt

**Add to system prompt:**
```typescript
Trivia Rules:
1. Before revealing a species hint, ask a trivia question
2. Question should be about ecosystems, food webs, or the region
3. Mark questions with "TRIVIA:" prefix
4. After correct answer, give hint with "HINT:" prefix
5. Example:
   - "TRIVIA: What do carnivores eat?"
   - Student: "Other animals"
   - "HINT: This carnivore has spotted fur and climbs trees..."
```

#### 3.3 Parse AI Responses

```typescript
// In handleSearch function
if (response.includes('TRIVIA:')) {
  const question = response.split('TRIVIA:')[1].trim();
  setCurrentTriviaQuestion(question);
  setTriviaAnswered(false);
} else if (response.includes('HINT:')) {
  setTriviaAnswered(true);
}
```

---

### **Phase 4: Species Selection Logic**

**Goal:** Track selected species and validate food web

**What to Build:**

#### 4.1 Add Selection Handler

```typescript
const handleSpeciesSelect = (species: RegionSpecies, slot: 'carnivore' | 'herbivoreOmnivore' | 'producer') => {
  // Validate species matches slot
  if (slot === 'carnivore' && species.dietaryCategory !== 'Carnivore') {
    toast({
      title: 'Invalid Selection',
      description: 'This species is not a carnivore!',
      variant: 'destructive'
    });
    return;
  }

  // Update state
  setSelectedFoodWebSpecies(prev => ({
    ...prev,
    [slot]: species.id
  }));

  // Check if game complete
  const allSelected = Object.values({
    ...selectedFoodWebSpecies,
    [slot]: species.id
  }).every(Boolean);

  if (allSelected) {
    // Trigger game generation!
    generateFoodWebGame();
  }
};
```

#### 4.2 Add to Species Cards

```typescript
// In RegionSpeciesCarousel component
<Button onClick={() => handleSpeciesSelect(species, 'carnivore')}>
  Select as Carnivore
</Button>
```

---

### **Phase 5: Generate 2D Game Data**

**Goal:** AI generates custom game with selected species

**What to Build:**

#### 5.1 Create Game Generator Service

**File:** `src/services/gameGenerator.ts`

```typescript
import { getSpeciesDetails, getEcoregionInfo } from './mcpClient';

interface GameCharacter {
  name: string;
  role: 'player' | 'enemy' | 'collectible';
  sprite: string; // Base64 or URL
  color: string;
  size: number;
  speed: number;
}

export async function generateFoodWebGame(
  carnivoreId: string,
  herbivoreId: string,
  producerId: string,
  ecoregionName: string
) {
  // 1. Get species details
  const [carnivore, herbivore, producer] = await Promise.all([
    getSpeciesDetails({ speciesId: carnivoreId }),
    getSpeciesDetails({ speciesId: herbivoreId }),
    getSpeciesDetails({ speciesId: producerId })
  ]);

  // 2. Get biome color for background
  const ecoregionInfo = await getEcoregionInfo({ ecoregionName });
  const backgroundColor = ecoregionInfo.ecoregions?.[0]?.backgroundColor || '#1e7145';

  // 3. Generate character designs with AI
  const prompt = `Design 2D pixel art game characters for an ecosystem game:

Player (collects food): ${herbivore.species.common_name}
Enemy (chases player): ${carnivore.species.common_name}
Collectible (food): ${producer.species.common_name}

For each character, provide:
1. Shape (circle, square, triangle, or custom path)
2. Primary color (hex)
3. Size (small/medium/large)
4. Movement style (fast/medium/slow)

Return as JSON.`;

  const response = await fetch('/api/openai', {
    method: 'POST',
    body: JSON.stringify({ prompt })
  });

  const designs = await response.json();

  // 4. Return game configuration
  return {
    backgroundColor,
    characters: {
      player: {
        name: herbivore.species.common_name,
        ...designs.player,
        role: 'player'
      },
      enemy: {
        name: carnivore.species.common_name,
        ...designs.enemy,
        role: 'enemy'
      },
      collectible: {
        name: producer.species.common_name,
        ...designs.collectible,
        role: 'collectible'
      }
    },
    maze: generateMaze(), // Simple maze generation
    level: {
      width: 800,
      height: 600,
      collectibleCount: 20
    }
  };
}

function generateMaze() {
  // Simple grid-based maze
  // Return array of wall positions
  return [
    { x: 100, y: 100, width: 50, height: 200 },
    { x: 300, y: 200, width: 200, height: 50 },
    // ... more walls
  ];
}
```

---

### **Phase 6: Build Phaser.js Game** (Final Phase!)

**Goal:** Playable 2D ecosystem game

**What to Build:**

#### 6.1 Install Phaser

```bash
npm install phaser
```

#### 6.2 Create Game Component

**File:** `src/components/EcosystemGame.tsx`

```typescript
import Phaser from 'phaser';
import { useEffect, useRef } from 'react';

interface GameData {
  backgroundColor: string;
  characters: {
    player: any;
    enemy: any;
    collectible: any;
  };
  maze: any[];
  level: {
    width: number;
    height: number;
    collectibleCount: number;
  };
}

export const EcosystemGame = ({ gameData }: { gameData: GameData }) => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: gameData.level.width,
      height: gameData.level.height,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0, x: 0 },
          debug: false
        }
      },
      scene: {
        preload: function(this: Phaser.Scene) {
          // Generate simple sprites from character data
          this.textures.generate('player', {
            data: [gameData.characters.player.color],
            pixelWidth: 32,
            pixelHeight: 32
          });
        },
        create: function(this: Phaser.Scene) {
          // Set background
          this.cameras.main.setBackgroundColor(gameData.backgroundColor);

          // Create player
          const player = this.physics.add.sprite(100, 100, 'player');

          // Create enemies
          // Create collectibles
          // Create maze walls
          // Add collision detection
          // Add score counter
        },
        update: function(this: Phaser.Scene) {
          // Handle keyboard input
          // Move player
          // Move enemies (AI)
          // Check win condition
        }
      }
    };

    const game = new Phaser.Game(config);

    return () => {
      game.destroy(true);
    };
  }, [gameData]);

  return <div ref={gameRef} className="mx-auto" />;
};
```

---

## 🧪 Testing Checklist

### After Each Phase:

- [ ] Phase 1: AI mentions real species from MCP server
- [ ] Phase 2: Progress bar shows 0%, 33%, 66%, 100%
- [ ] Phase 3: Trivia questions appear before hints
- [ ] Phase 4: Can select 3 species, validation works
- [ ] Phase 5: Game data generated with biome colors
- [ ] Phase 6: Playable Phaser.js game loads

---

## 🚀 Quick Start (Pick Up Where You Left Off)

### Option A: Test MCP First (Recommended)
```bash
# 1. Restart Claude Desktop
# 2. Ask Claude: "Use globe-critter to get 5 carnivores in Borneo"
# 3. Verify real species data appears
```

### Option B: Start Phase 1 (Jump In)
```bash
# 1. Open educationAgent.ts
# 2. Import mcpClient functions
# 3. Add MCP queries to system prompt
# 4. Test in browser
```

---

## 📁 Key Files Reference

```
globe-critter-chat/
├── src/
│   ├── services/
│   │   ├── mcpClient.ts          ✅ MCP client (done)
│   │   ├── educationAgent.ts     🔄 Phase 1 (update this)
│   │   └── gameGenerator.ts      🔜 Phase 5 (create this)
│   ├── components/
│   │   ├── FoodWebProgressBar.tsx    🔜 Phase 2 (create this)
│   │   ├── EcosystemGame.tsx         🔜 Phase 6 (create this)
│   │   ├── FoodWebSelectionBar.tsx   ✅ (exists, needs wiring)
│   │   └── MCPTestComponent.tsx      ✅ (temp, can remove)
│   └── pages/
│       └── Index.tsx             🔄 Wire everything together
└── .env                          ✅ Has MCP_SERVER_URL

globe-critter-mcp-server/
├── src/
│   ├── index.ts                  ✅ Stdio server (Claude Desktop)
│   ├── http-server.ts            ✅ HTTP server (Production)
│   └── tools/                    ✅ All MCP tools ready
└── build/                        ✅ Compiled, deployed to Railway
```

---

## 💡 Pro Tips

1. **Start Small:** Test Phase 1 with just console.logs first
2. **Use Browser DevTools:** Check Network tab for MCP requests
3. **Test in Claude Desktop:** Validate MCP queries work before integrating
4. **Save Game Data:** Store generated games in localStorage for replay
5. **Iterate Fast:** Build minimal version of each phase, then polish

---

## 🆘 If You Get Stuck

### MCP Not Working?
- Check Railway logs
- Test health endpoint: `curl https://globe-critter-mcp-server-production.up.railway.app/health`
- Verify `.env` has correct URL

### AI Not Calling MCP?
- Check browser console for errors
- Verify import statements
- Test MCP functions directly in console

### Game Not Generating?
- Check if all 3 species selected
- Verify OpenAI API key in `.env`
- Start with hardcoded game data first

---

## 🎯 Success Criteria

**You're done when:**
1. Student clicks region → Sees species
2. Clicks "START FOOD WEB TRIVIA" → AI asks questions
3. Answers trivia → Gets species hints
4. Selects 3 species → Progress bar fills
5. Sees "AI Vision Restored!" → Game generates
6. Plays Pac-man style ecosystem game
7. Learns about food webs while having fun! 🎮

---

**Start with Phase 1 and work through one phase at a time. You got this! 🚀**
