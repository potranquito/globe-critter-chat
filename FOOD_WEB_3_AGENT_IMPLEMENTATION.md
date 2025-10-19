# Food Web Game - 3 Agent Architecture

## ✅ Complete Implementation

### Overview

The food web trivia game now uses a **3-agent sequential architecture** where each agent is responsible for helping the user find ONE specific species. The user must complete each phase before moving to the next.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  GAME START: Initialize 3 Target Species via MCP   │
│  - Producer (random from database)                  │
│  - Herbivore (random from database)                 │
│  - Carnivore (random from database)                 │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 1: Producer Agent                            │
│  Target: "African Teak"                             │
│  - User must find this specific species             │
│  - Wrong selection → Trivia question → Hint         │
│  - Correct selection → Move to Phase 2              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 2: Herbivore Agent                           │
│  Target: "Forest Elephant"                          │
│  - Shares chat history with Phase 1                 │
│  - Same validation & trivia logic                   │
│  - Correct selection → Move to Phase 3              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 3: Carnivore Agent                           │
│  Target: "Leopard"                                  │
│  - Shares chat history with Phase 1 & 2             │
│  - Same validation & trivia logic                   │
│  - Correct selection → GAME COMPLETE! 🎉            │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Guide

### Step 1: Initialize Target Species (Game Start)

```typescript
import { initializeFoodWebTargets } from '@/services/educationAgent';

// When user clicks "START FOOD WEB TRIVIA"
const targetSpecies = await initializeFoodWebTargets(ecoregionName);

// Returns:
// {
//   producer: { id: '123', commonName: 'African Teak', scientificName: '...', animalType: 'Plant' },
//   herbivoreOmnivore: { id: '456', commonName: 'Forest Elephant', ... },
//   carnivore: { id: '789', commonName: 'Leopard', ... }
// }

console.log('Game initialized with targets:', targetSpecies);
```

### Step 2: Create Agent Context for Each Phase

```typescript
import {
  createProducerAgentContext,
  createHerbivoreAgentContext,
  createCarnivoreAgentContext
} from '@/services/educationAgent';

// State management
const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
const [foundSpecies, setFoundSpecies] = useState<Array<any>>([]);
const [chatHistory, setChatHistory] = useState<Array<any>>([]);

// Get active agent context based on phase
const getActiveContext = () => {
  switch (currentPhase) {
    case 1:
      return createProducerAgentContext(ecoregionName, targetSpecies, foundSpecies);
    case 2:
      return createHerbivoreAgentContext(ecoregionName, targetSpecies, foundSpecies);
    case 3:
      return createCarnivoreAgentContext(ecoregionName, targetSpecies, foundSpecies);
  }
};

const context = getActiveContext();
```

### Step 3: Validate User Selection

```typescript
import { validateSpeciesSelection } from '@/services/educationAgent';

// When user clicks a species card in the carousel
const handleSpeciesClick = (selectedSpecies: any) => {
  const currentTarget = currentPhase === 1
    ? targetSpecies.producer
    : currentPhase === 2
      ? targetSpecies.herbivoreOmnivore
      : targetSpecies.carnivore;

  const validation = validateSpeciesSelection(
    String(selectedSpecies.id),
    currentTarget
  );

  if (validation.correct) {
    // ✅ CORRECT SELECTION
    console.log('Correct! User found:', validation.targetName);

    // Add to found species
    setFoundSpecies([...foundSpecies, {
      commonName: currentTarget.commonName,
      scientificName: currentTarget.scientificName,
      role: currentPhase === 1 ? 'producer' : currentPhase === 2 ? 'herbivoreOmnivore' : 'carnivore',
      conservationStatus: selectedSpecies.conservationStatus || 'Unknown',
      animalType: currentTarget.animalType
    }]);

    // Send message to AI
    sendMessageToAI(`I found the ${validation.targetName}!`);

    // Move to next phase or complete game
    if (currentPhase < 3) {
      setCurrentPhase(currentPhase + 1);
    } else {
      // GAME COMPLETE!
      console.log('🎉 All 3 species found! Game complete!');
    }
  } else {
    // ❌ WRONG SELECTION
    console.log('Wrong! That is not:', validation.targetName);

    // Send message to AI (will trigger trivia question)
    sendMessageToAI(`Is this the ${validation.targetName}?`);
  }
};
```

### Step 4: Send Messages with Shared Chat History

```typescript
import { sendEducationMessage } from '@/services/educationAgent';

const sendMessageToAI = async (message: string) => {
  const context = getActiveContext();

  await sendEducationMessage(
    message,
    context,
    chatHistory, // Shared across all phases!
    (chunk) => {
      // Handle streaming response
      setCurrentMessage(prev => prev + chunk);
    },
    () => {
      // Message complete
      console.log('AI response complete');
    },
    (error) => {
      console.error('AI error:', error);
    }
  );
};
```

---

## Complete React Component Example

```typescript
import { useState, useEffect } from 'react';
import {
  initializeFoodWebTargets,
  createProducerAgentContext,
  createHerbivoreAgentContext,
  createCarnivoreAgentContext,
  validateSpeciesSelection,
  sendEducationMessage
} from '@/services/educationAgent';

export function FoodWebGame({ ecoregionName }: { ecoregionName: string }) {
  const [targetSpecies, setTargetSpecies] = useState(null);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3>(1);
  const [foundSpecies, setFoundSpecies] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [gameComplete, setGameComplete] = useState(false);

  // Initialize game
  useEffect(() => {
    const init = async () => {
      const targets = await initializeFoodWebTargets(ecoregionName);
      setTargetSpecies(targets);
      console.log('Targets:', targets);
    };
    init();
  }, [ecoregionName]);

  // Get active agent context
  const getActiveContext = () => {
    if (!targetSpecies) return null;

    switch (currentPhase) {
      case 1:
        return createProducerAgentContext(ecoregionName, targetSpecies, foundSpecies);
      case 2:
        return createHerbivoreAgentContext(ecoregionName, targetSpecies, foundSpecies);
      case 3:
        return createCarnivoreAgentContext(ecoregionName, targetSpecies, foundSpecies);
    }
  };

  // Handle species selection
  const handleSpeciesClick = (selectedSpecies: any) => {
    if (!targetSpecies) return;

    const currentTarget = currentPhase === 1
      ? targetSpecies.producer
      : currentPhase === 2
        ? targetSpecies.herbivoreOmnivore
        : targetSpecies.carnivore;

    const validation = validateSpeciesSelection(
      String(selectedSpecies.id),
      currentTarget
    );

    if (validation.correct) {
      // Add to found species
      setFoundSpecies([...foundSpecies, {
        commonName: currentTarget.commonName,
        scientificName: currentTarget.scientificName,
        role: currentPhase === 1 ? 'producer' : currentPhase === 2 ? 'herbivoreOmnivore' : 'carnivore',
        conservationStatus: selectedSpecies.conservationStatus || 'Unknown',
        animalType: currentTarget.animalType
      }]);

      // Move to next phase
      if (currentPhase < 3) {
        setCurrentPhase(currentPhase + 1);
      } else {
        setGameComplete(true);
      }
    }

    // Always send message to AI (for correct or wrong)
    sendMessageToAI(`I selected ${selectedSpecies.commonName}`);
  };

  // Send message to AI
  const sendMessageToAI = async (message: string) => {
    const context = getActiveContext();
    if (!context) return;

    // Add user message to history
    setChatHistory([...chatHistory, { role: 'user', content: message }]);

    let fullResponse = '';

    await sendEducationMessage(
      message,
      context,
      chatHistory,
      (chunk) => {
        fullResponse += chunk;
      },
      () => {
        // Add AI response to history
        setChatHistory([
          ...chatHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: fullResponse }
        ]);
      },
      (error) => {
        console.error('AI error:', error);
      }
    );
  };

  return (
    <div>
      <h2>Food Web Game - Phase {currentPhase}/3</h2>
      <p>Looking for: {
        currentPhase === 1 ? targetSpecies?.producer?.commonName :
        currentPhase === 2 ? targetSpecies?.herbivoreOmnivore?.commonName :
        targetSpecies?.carnivore?.commonName
      }</p>

      {gameComplete && <h1>🎉 Game Complete!</h1>}

      {/* Species carousel with click handlers */}
      {/* Chat interface */}
    </div>
  );
}
```

---

## Key Features

### ✅ Implemented:
1. **3-Agent Sequential Architecture** - Each phase has its own focused agent
2. **Shared Chat History** - Seamless conversation across all phases
3. **Specific Species Targeting** - AI asks for exact species by name
4. **Random Species Selection** - Different game each time via MCP
5. **Validation System** - Checks if user clicked correct species
6. **Phase Progression** - Automatic transition between phases
7. **Console Logging** - Easy debugging

### 🔄 Trivia Flow:
- **Wrong Selection** → AI asks trivia question
- **Correct Answer** → AI gives VISUAL hint about appearance
- **Wrong Answer** → AI explains, asks different question
- **Correct Selection** → AI celebrates, moves to next phase

---

## Next Steps: Visual Hint Generation

The current challenge is giving good VISUAL hints about what species look like. We need to enhance the hint system with:

### Option 1: MCP Tool for Species Appearance Data
```typescript
// New MCP tool
getSpeciesAppearance({
  speciesId: '123'
})

// Returns:
{
  physicalDescription: "Spotted fur with rosettes",
  size: "Large cat, 4-6 feet long",
  distinctiveFeatures: "Long tail, powerful build",
  colors: ["Yellow", "Black spots"],
  habitat: "Trees and dense forest"
}
```

### Option 2: AI-Generated Hints on Demand
```typescript
// When user gets answer wrong, call:
const hint = await generateSpeciesHint({
  speciesName: "Leopard",
  ecoregion: "Borneo",
  hintLevel: 1 // 1=vague, 2=medium, 3=specific
});
```

### Option 3: Pre-seed Visual Descriptions
- Add `visual_description` column to species table
- Populate with GPT-4 generated descriptions
- Agent pulls from database

---

## Testing Checklist

- [ ] Game initializes with 3 random target species
- [ ] Phase 1 agent asks for specific producer name
- [ ] Wrong selection triggers trivia question
- [ ] Correct trivia answer gives visual hint
- [ ] Correct species selection moves to Phase 2
- [ ] Phase 2 agent knows about Phase 1 conversation
- [ ] All 3 phases complete successfully
- [ ] Console logs show validation results

---

**Status**: ✅ Core architecture complete and ready to test!
