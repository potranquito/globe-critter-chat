# 🎮 MCP-Powered Food Web Game - Implementation Plan

## Executive Summary
Build MCP server that lets AI agent intelligently select species, guide students with trivia-gated hints, and generate custom 2D ecosystem game on-demand.

---

## Phase 1: MCP Server Foundation (Week 1)

### Setup
```bash
mkdir food-web-mcp-server
cd food-web-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk dotenv pg
```

### MCP Tools to Build

#### 1. `get_region_species`
```typescript
// Returns filtered list of species in region
Input: { regionName: string, filters?: { dietaryCategory, animalType } }
Output: Array<{ id, commonName, scientificName, animalType, dietaryCategory }>
```

#### 2. `get_species_details`
```typescript
// Full details for hints
Input: { speciesId: number }
Output: { id, commonName, scientificName, animalType, dietaryCategory, conservationStatus, imageUrl }
```

#### 3. `add_species_to_food_web`
```typescript
// Track progress
Input: { slot: "carnivore" | "herbivoreOmnivore" | "producer", speciesId: number }
Output: { success: boolean, progress: number (0-100) }
```

#### 4. `validate_trivia_answer`
```typescript
// Check answer correctness
Input: { question: string, answer: "A"|"B"|"C"|"D", correctAnswer: string }
Output: { correct: boolean, explanation: string }
```

### Database Connection
```typescript
// Use existing Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);
```

**No database schema changes needed!** Use existing tables as-is.

---

## Phase 2: AI Agent Integration (Week 1-2)

### Update Frontend to Connect MCP

```typescript
// src/services/mcpClient.ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

export const mcpClient = new Client({
  name: "globe-critter-frontend",
  version: "1.0.0"
});

// Connect to MCP server
await mcpClient.connect(
  new StdioClientTransport({
    command: "node",
    args: ["../food-web-mcp-server/build/index.js"]
  })
);
```

### Update Education Agent Prompt

Already done! (educationAgent.ts lines 94-162)
- AI knows to use trivia-gated hints
- AI guides through species search
- AI celebrates progress
- AI triggers game generation at 100%

### Add MCP Tool Calls to AI Flow

```typescript
// When AI needs species list:
const species = await mcpClient.callTool({
  name: "get_region_species",
  arguments: {
    regionName: regionInfo.regionName,
    filters: { dietaryCategory: "Producer" }
  }
});

// AI can now intelligently pick which species to ask for
```

---

## Phase 3: Progress Bar Component (Week 2)

### Component: `src/components/FoodWebProgressBar.tsx`

```tsx
export const FoodWebProgressBar = ({ progress }: { progress: number }) => {
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
    </div>
  );
};
```

### Add to Index.tsx
```tsx
// Show progress bar when trivia is active
{isChatHistoryExpanded && (
  <FoodWebProgressBar progress={foodWebProgress} />
)}
```

### Calculate Progress
```typescript
const calculateProgress = () => {
  const speciesCount = Object.values(selectedFoodWebSpecies).filter(Boolean).length;
  return Math.round((speciesCount / 3) * 100);
};
```

---

## Phase 4: Game Generation (Week 3)

### MCP Tool: `generate_game_characters`

```typescript
{
  name: "generate_game_characters",
  description: "Generate 2D pixel art character designs from species",
  inputSchema: {
    carnivoreId: number,
    herbivoreId: number,
    producerId: number
  }
}

// Implementation:
async function generateGameCharacters(carnivoreId, herbivoreId, producerId) {
  // 1. Fetch minimal species data (no new DB fields needed!)
  const [carnivore, herbivore, producer] = await Promise.all([
    supabase.from('species').select('common_name, scientific_name, animal_type').eq('id', carnivoreId).single(),
    supabase.from('species').select('common_name, scientific_name, animal_type').eq('id', herbivoreId).single(),
    supabase.from('species').select('common_name, scientific_name, animal_type').eq('id', producerId).single()
  ]);

  // 2. Let AI generate everything on-demand
  const prompt = `Design 2D pixel art characters for Pacman-style game:

Player (collects food): ${herbivore.common_name}
Enemy (chases player): ${carnivore.common_name}
Collectible (food): ${producer.common_name}

Generate JSON with shape, colors, size, movement style for each.
Make them visually distinct and game-appropriate.`;

  const designs = await callOpenAI(prompt);
  return designs;
}
```

**Key Insight**: AI generates character designs **on-demand** using only:
- common_name
- scientific_name
- animal_type

No database changes needed!

---

## Phase 5: 2D Game Scaffold (Week 4)

### Choose Framework: **Phaser.js** (Recommended)

```bash
npm install phaser
```

### Game Component: `src/components/EcosystemGame.tsx`

```tsx
import Phaser from 'phaser';

export const EcosystemGame = ({ gameData }) => {
  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      scene: {
        preload: function() {
          // Load sprite images generated by AI
          this.load.image('player', gameData.player.spriteUrl);
          this.load.image('enemy', gameData.enemy.spriteUrl);
          this.load.image('food', gameData.collectible.spriteUrl);
        },
        create: function() {
          // Create Pacman-style maze
          // Spawn player (herbivore)
          // Spawn enemies (carnivores)
          // Scatter collectibles (producers)
        },
        update: function() {
          // Game loop
        }
      }
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, [gameData]);

  return <div id="game-container" />;
};
```

---

## Implementation Checklist

### Week 1: MCP Server
- [ ] Create `food-web-mcp-server` project
- [ ] Implement `get_region_species` tool
- [ ] Implement `get_species_details` tool
- [ ] Implement `add_species_to_food_web` tool
- [ ] Implement `validate_trivia_answer` tool
- [ ] Connect to Supabase
- [ ] Test tools manually

### Week 2: Frontend Integration
- [ ] Create `mcpClient.ts`
- [ ] Connect frontend to MCP server
- [ ] Update AI to use MCP tools
- [ ] Build `FoodWebProgressBar` component
- [ ] Add progress calculation
- [ ] Test trivia-gated hints flow

### Week 3: Game Generation
- [ ] Implement `generate_game_characters` MCP tool
- [ ] Test AI character generation with real species
- [ ] Refine AI prompts for better game designs
- [ ] Add sprite generation (DALL-E API or similar)
- [ ] Store generated game data temporarily

### Week 4: 2D Game
- [ ] Setup Phaser.js
- [ ] Build basic Pacman-style maze
- [ ] Implement player movement
- [ ] Implement enemy AI
- [ ] Implement collectibles
- [ ] Add custom sprites from AI
- [ ] Test full flow: Trivia → Selection → Game

### Week 5: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Animations
- [ ] Sound effects
- [ ] Victory screen
- [ ] "Play Again" flow

---

## File Structure

```
globe-critter-chat/
├── src/
│   ├── components/
│   │   ├── FoodWebProgressBar.tsx       [NEW]
│   │   ├── EcosystemGame.tsx            [NEW]
│   │   └── ... (existing)
│   ├── services/
│   │   ├── mcpClient.ts                 [NEW]
│   │   ├── educationAgent.ts            [UPDATED]
│   │   └── ... (existing)
│   └── ...

food-web-mcp-server/                     [NEW PROJECT]
├── src/
│   ├── index.ts                         [MCP server entry]
│   ├── tools/
│   │   ├── speciesTools.ts              [Species browsing]
│   │   ├── foodWebTools.ts              [Progress tracking]
│   │   ├── triviaTools.ts               [Answer validation]
│   │   └── gameTools.ts                 [Character generation]
│   └── database/
│       └── supabase.ts                  [DB connection]
├── package.json
└── tsconfig.json

MCP_FOOD_WEB_IMPLEMENTATION_PLAN.md     [THIS FILE]
```

---

## Key Decisions Made

✅ **Agentic AI Design**: AI generates game characters on-demand (no DB pre-population)
✅ **No Database Changes**: Use existing species fields only
✅ **MCP for Intelligence**: AI queries species intelligently via MCP
✅ **Trivia-Gated Hints**: Must answer trivia before getting hints
✅ **Progress Bar**: Shows vision restoration (0-100%)
✅ **Phaser.js**: For 2D game framework

---

## Next Immediate Steps

1. Create `food-web-mcp-server` directory
2. Setup MCP server scaffold
3. Implement first tool: `get_region_species`
4. Test MCP connection from frontend
5. Build progress bar component

**Ready to start building?** 🚀
