# Game Structure Documentation

This document explains the game flow and button structure in the Globe Critter Chat application.

## Game Flow

### 1. Food Web Trivia Game (First Game)
- **Trigger**: Automatically starts when user completes species finding in an eco-region
- **Purpose**: Educational trivia about food web relationships
- **Location**: Built into the main chat flow
- **Completion**: After answering all trivia questions correctly

### 2. Poopy Minion Escape Game (Second Game - PixelGame)
- **Trigger**: Button appears after Food Web Trivia completion
- **Button Label**: "Play Poopy Minion Escape" 🤖
- **Component**: `PixelGameModal` wrapping `PixelGame`
- **Files**:
  - `src/components/PixelGame.tsx`
  - `src/components/PixelGameModal.tsx`
- **Type**: Pacman-style maze game with robot character and poop enemies
- **Flow**:
  - Goes directly to game board (no intro page)
  - **Win**: Closes automatically, conversation continues toward whack-a-mole game
  - **Lose**: Shows "Start Over" button that resets ALL eco-region progress (Food Web Trivia + species selection)
- **Current Status**: ✅ Complete and working

### 3. Battle Poopy Pants (Third Game - WhackAMole)
- **Trigger**: Button will appear in chat history (to be implemented)
- **Button Label**: "Battle Poopy Pants" ⚔️
- **Component**: `WhackAMoleGameModal` wrapping `WhackAMoleGame`
- **Files**:
  - `src/components/WhackAMoleGame.tsx` (placeholder created)
  - `src/components/WhackAMoleGameModal.tsx` (modal created)
- **Type**: Whack-a-mole style game
- **Current Status**: 🚧 Structure ready, game logic to be implemented

## Button Configuration

### Current Button (Food Web Trivia Complete)
```typescript
// Location: src/pages/Index.tsx line ~4100
setQuickReplies([
  {
    id: 'play-food-web-game',
    label: 'Play Poopy Minion Escape',
    emoji: '🤖',
    action: 'play-food-web-game' as const
  }
]);
```

### Future Button (Battle Poopy Pants - To Be Added)
```typescript
// Will be added later in the chat flow
// Suggested location: After completing Poopy Minion Escape game
setQuickReplies([
  {
    id: 'play-whack-a-mole',
    label: 'Battle Poopy Pants',
    emoji: '⚔️',
    action: 'play-whack-a-mole' as const
  }
]);
```

## Adding the Whack-A-Mole Game Button

When ready to integrate, add the following in `src/pages/Index.tsx`:

1. **Add state for whack-a-mole game:**
```typescript
const [showWhackAMole, setShowWhackAMole] = useState(false);
const [whackAMoleConfig, setWhackAMoleConfig] = useState<any>(null);
```

2. **Add import:**
```typescript
import { WhackAMoleGameModal } from "@/components/WhackAMoleGameModal";
```

3. **Add case handler in handleQuickReplyAction:**
```typescript
case 'play-whack-a-mole':
  setQuickReplies([]);
  const gameConfig = {
    animalType: lastFoundSpecies,
    biomeType: currentEcoRegionId
  };
  setWhackAMoleConfig(gameConfig);
  setShowWhackAMole(true);
  console.log('⚔️ Whack-A-Mole game launched');
  return;
```

4. **Add modal to JSX:**
```typescript
<WhackAMoleGameModal
  isOpen={showWhackAMole}
  onClose={() => setShowWhackAMole(false)}
  onWin={() => {
    setShowWhackAMole(false);
    // Handle win logic
  }}
  onLose={() => {
    setShowWhackAMole(false);
    // Handle lose logic
  }}
  gameConfig={whackAMoleConfig}
/>
```

## Notes
- All game modals prevent closing by clicking outside or pressing ESC (can only exit via in-game controls)
- Games use the same animal/biome config system
- Win/lose callbacks integrate with the main chat flow
