# 🎓 Trivia Agent Architecture Plan

## 📋 Current Flow vs. New Flow

### **Current (What Works):**
```
User selects wrong species
    ↓
AI shares verbose info about wrong species ✅
    ↓
❌ No follow-up question
❌ Carousel stays unlocked
```

### **New Educational Flow:**
```
User selects wrong species
    ↓
Brief Info Agent: Share condensed species info
    ├─ Name
    ├─ Conservation status
    ├─ One fast fact
    └─ Brief ID tip
    ↓
🔒 Lock carousel
    ↓
Trivia Question Agent: Generate educational question
    "In order to continue, you must answer this question:"
    ↓
Student answers...
    ├─ ✅ CORRECT → Unlock carousel + Show "Hint" button
    │             → Student can continue searching
    │
    └─ ❌ WRONG → Show correct answer
                → Ask another question
                → Repeat (max 3 attempts)
                    ↓
                    After 3 wrong → Skip to next phase
```

---

## 🤖 New Agent: Trivia Question Agent

### **Purpose:**
Generate educational questions that reinforce learning about:
- Food web concepts (producer/consumer/predator roles)
- Species characteristics
- Ecoregion biodiversity
- Conservation

### **Trigger:**
- Activates **after wrong species selection**
- Called **after brief species info shared**

### **Question Types:**

#### **Option A: Multiple Choice (Recommended)**
```
Question: "What role does a producer play in a food web?"
A) It hunts other animals
B) It makes its own food through photosynthesis ✓
C) It eats plants and animals
D) It breaks down dead organisms
```

#### **Option B: True/False**
```
Question: "True or False: The African teak is a producer because it makes its own food."
[ True ✓ ] [ False ]
```

### **Question Focus:**
1. **About target species** (what they're looking for) - 70%
2. **About food web concepts** (general learning) - 20%
3. **About the ecoregion** (context) - 10%

---

## 📊 State Management

### **New State Variables:**

```typescript
// Question/Answer System
const [triviaQuestion, setTriviaQuestion] = useState<{
  question: string;
  choices: string[];
  correctAnswer: number; // Index of correct choice
  explanation: string;
} | null>(null);

const [triviaAttemptCount, setTriviaAttemptCount] = useState(0); // Max 3
const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

// Hint System
const [showHintButton, setShowHintButton] = useState(false);
const [hintLevel, setHintLevel] = useState(0); // 0 = no hint, 1-3 = increasing detail
```

### **Carousel Lock Logic:**
```typescript
const isCarouselLocked =
  isWaitingForAnswer ||           // During trivia question
  (revealAttemptCount >= 4) ||    // After 4 wrong reveals (existing)
  (!isFoodWebGameActive);         // Before game starts (existing)
```

---

## 🎯 Detailed Flow Diagram

### **Scenario: Wrong Species Selected**

```
┌─────────────────────────────────────────────────┐
│ 1. User clicks species in carousel             │
│    handleCarouselSpeciesSelect(species)         │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 2. User clicks "Reveal Species"                 │
│    handleRevealSpecies()                        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│ 3. Validate Selection                           │
│    validateFoodWebSelection(species, target)    │
└────────────────┬────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
   ✅ CORRECT        ❌ WRONG
        │                 │
        │                 ▼
        │    ┌─────────────────────────────────────┐
        │    │ 4a. Share Brief Species Info        │
        │    │     Format:                         │
        │    │     "That was a [name]!             │
        │    │     • Status: [conservation]        │
        │    │     • Fast fact: [fact]             │
        │    │     • ID tip: [how to identify]     │
        │    │     But we need the [target]."      │
        │    └──────────────┬──────────────────────┘
        │                   │
        │                   ▼
        │    ┌─────────────────────────────────────┐
        │    │ 4b. Lock Carousel                   │
        │    │     setIsWaitingForAnswer(true)     │
        │    └──────────────┬──────────────────────┘
        │                   │
        │                   ▼
        │    ┌─────────────────────────────────────┐
        │    │ 5. Generate Trivia Question         │
        │    │    Trivia Agent (via MCP or OpenAI) │
        │    │    - Based on current phase         │
        │    │    - About target species           │
        │    │    - Grade-appropriate (5th grade)  │
        │    └──────────────┬──────────────────────┘
        │                   │
        │                   ▼
        │    ┌─────────────────────────────────────┐
        │    │ 6. Display Question + Choices       │
        │    │    setTriviaQuestion({...})         │
        │    │    Quick Replies: [ A ] [ B ] [ C ] │
        │    └──────────────┬──────────────────────┘
        │                   │
        │                   ▼
        │    ┌─────────────────────────────────────┐
        │    │ 7. User Selects Answer              │
        │    │    handleTriviaAnswer(choice)       │
        │    └──────────────┬──────────────────────┘
        │                   │
        │          ┌────────┴────────┐
        │          │                 │
        │          ▼                 ▼
        │    ✅ CORRECT        ❌ WRONG
        │          │                 │
        │          │                 ▼
        │          │    ┌─────────────────────────────┐
        │          │    │ 8a. Show Correct Answer     │
        │          │    │     "The answer is B..."    │
        │          │    │     [explanation]           │
        │          │    └──────────┬──────────────────┘
        │          │               │
        │          │               ▼
        │          │    ┌─────────────────────────────┐
        │          │    │ 8b. Increment Attempts      │
        │          │    │     triviaAttemptCount++    │
        │          │    └──────────┬──────────────────┘
        │          │               │
        │          │         ┌─────┴─────┐
        │          │         │           │
        │          │         ▼           ▼
        │          │   Attempts < 3  Attempts = 3
        │          │         │           │
        │          │         │           ▼
        │          │         │    ┌──────────────────┐
        │          │         │    │ Skip to Next     │
        │          │         │    │ Phase (auto-     │
        │          │         │    │ reveal target)   │
        │          │         │    └──────────────────┘
        │          │         │
        │          │         ▼
        │          │    ┌─────────────────────────────┐
        │          │    │ 8c. Ask Another Question    │
        │          │    │     (Loop back to Step 5)   │
        │          │    └─────────────────────────────┘
        │          │
        │          ▼
        │    ┌─────────────────────────────────────┐
        │    │ 9. Unlock Carousel                  │
        │    │    setIsWaitingForAnswer(false)     │
        │    │    setShowHintButton(true)          │
        │    └──────────────┬──────────────────────┘
        │                   │
        │                   ▼
        │    ┌─────────────────────────────────────┐
        │    │ 10. User Can Continue Searching     │
        │    │     + "Hint" button available       │
        │    └─────────────────────────────────────┘
        │
        ▼
   (Correct species path - existing flow)
```

---

## 🎨 UI Changes

### **Quick Replies During Game:**

#### **Before Question (Normal Search):**
```typescript
// KEEP:
✅ { text: '💡 Hint', emoji: '💡' }          // After correct trivia answer only
✅ { text: 'Tell me more', emoji: '📚' }      // About target species

// REMOVE:
❌ { text: 'New Trivia', emoji: '🎯' }
❌ { text: 'Fun Facts', emoji: '🌟' }
❌ { text: 'Status', emoji: '📊' }
```

#### **During Trivia Question:**
```typescript
// NEW: Multiple choice buttons
[
  { text: 'A', emoji: '🅰️' },
  { text: 'B', emoji: '🅱️' },
  { text: 'C', emoji: '🅲' },
  { text: 'D', emoji: '🅳' }
]
```

#### **After Correct Answer:**
```typescript
[
  { text: '💡 Hint', emoji: '💡' },          // NEW: Shows hints about target
  { text: 'Tell me more', emoji: '📚' }      // About target species
]
```

### **Hint Button Behavior:**

```typescript
// Progressive hints (3 levels)
hintLevel = 1: "Look for a tall tree with distinctive bark."
hintLevel = 2: "This species is a producer. It has large leaves and grows in the rainforest canopy."
hintLevel = 3: "The African teak (scientific name: Milicia excelsa) is a tree species. Look for it in the 'Producers' filter."

// Visual indicator
🔓 1/3 hints used
```

---

## 🔧 Implementation Plan

### **Phase 1: Core Trivia Agent (Priority 1)**

#### **File: `src/services/triviaAgent.ts`** (NEW)

```typescript
import { getOpenAICompletion } from './openaiService';

export interface TriviaQuestion {
  question: string;
  choices: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * Generate educational trivia question
 */
export async function generateTriviaQuestion(
  targetSpecies: { commonName: string; scientificName: string; animalType: string },
  ecoregionName: string,
  phase: 'producer' | 'herbivoreOmnivore' | 'carnivore',
  gradeLevel: number = 5
): Promise<TriviaQuestion> {

  const prompt = `You are an educational science tutor for ${gradeLevel}th grade students.

Context:
- We're playing a food web game in the ${ecoregionName} ecoregion
- Current phase: Finding a ${phase}
- Target species: ${targetSpecies.commonName} (${targetSpecies.scientificName})
- Role: ${targetSpecies.animalType}

Generate ONE multiple choice question that helps the student understand:
1. The role of a ${phase} in a food web
2. Characteristics of the target species
3. Why this species is important to the ecosystem

Requirements:
- Aligned with NGSS 5-LS2-1 (food webs and energy transfer)
- 4 answer choices (A, B, C, D)
- One correct answer
- Brief explanation of why the answer is correct
- Age-appropriate language

Return JSON format:
{
  "question": "...",
  "choices": ["A: ...", "B: ...", "C: ...", "D: ..."],
  "correctAnswer": 0-3,
  "explanation": "...",
  "difficulty": "medium"
}`;

  const response = await getOpenAICompletion(prompt, {
    temperature: 0.7,
    maxTokens: 300
  });

  return JSON.parse(response);
}
```

#### **File: `src/pages/Index.tsx`** (MODIFY)

```typescript
// NEW STATE
const [triviaQuestion, setTriviaQuestion] = useState<TriviaQuestion | null>(null);
const [triviaAttemptCount, setTriviaAttemptCount] = useState(0);
const [isWaitingForAnswer, setIsWaitingForAnswer] = useState(false);
const [showHintButton, setShowHintButton] = useState(false);
const [hintLevel, setHintLevel] = useState(0);

// MODIFY: handleRevealSpecies (when wrong)
const handleRevealSpecies = async () => {
  // ... existing validation ...

  if (!validation.correct) {
    // ❌ WRONG SELECTION

    // 1. Share brief species info
    const briefInfo = `That was a **${selectedSpeciesForReveal.commonName}**!

• **Conservation Status:** ${getStatusLabel(selectedSpeciesForReveal.conservationStatus)}
• **Fast Fact:** ${generateFastFact(selectedSpeciesForReveal)}
• **ID Tip:** ${generateIDTip(selectedSpeciesForReveal)}

But we need the **${validation.targetName}**.`;

    setChatHistory(prev => [...prev, {
      id: `wrong-${Date.now()}`,
      role: 'assistant',
      content: briefInfo,
      timestamp: new Date()
    }]);

    // 2. Lock carousel
    setIsWaitingForAnswer(true);

    // 3. Generate trivia question
    const question = await generateTriviaQuestion(
      currentTarget,
      regionInfo!.regionName,
      foodWebGamePhase === 1 ? 'producer' :
        foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore',
      5 // grade level
    );

    setTriviaQuestion(question);

    // 4. Display question
    const questionMessage = `In order to continue, you must answer this question:

**${question.question}**`;

    setChatHistory(prev => [...prev, {
      id: `trivia-q-${Date.now()}`,
      role: 'assistant',
      content: questionMessage,
      timestamp: new Date()
    }]);

    // 5. Set multiple choice quick replies
    setQuickReplies([
      { text: 'A', emoji: '🅰️' },
      { text: 'B', emoji: '🅱️' },
      { text: 'C', emoji: '🅲' },
      { text: 'D', emoji: '🅳' }
    ]);

    return;
  }
};

// NEW: Handle trivia answer
const handleTriviaAnswer = async (choice: string) => {
  if (!triviaQuestion) return;

  const answerIndex = ['A', 'B', 'C', 'D'].indexOf(choice);
  const correct = answerIndex === triviaQuestion.correctAnswer;

  if (correct) {
    // ✅ CORRECT ANSWER
    const successMessage = `✅ Correct! ${triviaQuestion.explanation}

You can now continue searching for the **${currentTarget.commonName}**. Click the **💡 Hint** button if you need help!`;

    setChatHistory(prev => [...prev, {
      id: `trivia-correct-${Date.now()}`,
      role: 'assistant',
      content: successMessage,
      timestamp: new Date()
    }]);

    // Unlock carousel
    setIsWaitingForAnswer(false);
    setShowHintButton(true);
    setTriviaQuestion(null);
    setTriviaAttemptCount(0);

    // Restore normal quick replies
    setQuickReplies([
      { text: '💡 Hint', emoji: '💡' },
      { text: 'Tell me more', emoji: '📚' }
    ]);

  } else {
    // ❌ WRONG ANSWER
    const wrongMessage = `❌ Not quite. The correct answer is **${triviaQuestion.choices[triviaQuestion.correctAnswer]}**.

${triviaQuestion.explanation}`;

    setChatHistory(prev => [...prev, {
      id: `trivia-wrong-${Date.now()}`,
      role: 'assistant',
      content: wrongMessage,
      timestamp: new Date()
    }]);

    const newAttemptCount = triviaAttemptCount + 1;
    setTriviaAttemptCount(newAttemptCount);

    if (newAttemptCount >= 3) {
      // After 3 wrong attempts, skip to next phase
      const skipMessage = `Let's move on. The species we were looking for is the **${currentTarget.commonName}**. It's a ${currentTarget.animalType} that plays a key role in this ecosystem.`;

      setChatHistory(prev => [...prev, {
        id: `trivia-skip-${Date.now()}`,
        role: 'assistant',
        content: skipMessage,
        timestamp: new Date()
      }]);

      // Auto-advance to next phase
      advanceToNextPhase();

    } else {
      // Generate another question
      const newQuestion = await generateTriviaQuestion(
        currentTarget,
        regionInfo!.regionName,
        foodWebGamePhase === 1 ? 'producer' :
          foodWebGamePhase === 2 ? 'herbivoreOmnivore' : 'carnivore',
        5
      );

      setTriviaQuestion(newQuestion);

      const nextQuestionMessage = `Let's try another question:

**${newQuestion.question}**`;

      setChatHistory(prev => [...prev, {
        id: `trivia-q2-${Date.now()}`,
        role: 'assistant',
        content: nextQuestionMessage,
        timestamp: new Date()
      }]);
    }
  }
};
```

---

## 🎯 Phase 2: Hint System

### **Progressive Hints:**

```typescript
const generateHint = (
  targetSpecies: any,
  hintLevel: number
): string => {
  switch (hintLevel) {
    case 1:
      return `🔍 **Hint 1/3:** This species is a ${targetSpecies.animalType}. Look for it in the carousel.`;

    case 2:
      return `🔍 **Hint 2/3:** The ${targetSpecies.commonName} is found in ${ecoregionName}. ${generateVisualHint(targetSpecies)}`;

    case 3:
      return `🔍 **Hint 3/3:** Look for "${targetSpecies.commonName}" (scientific name: ${targetSpecies.scientificName}). It's a ${targetSpecies.animalType} species.`;

    default:
      return 'No more hints available.';
  }
};

const handleHintClick = () => {
  const newHintLevel = Math.min(hintLevel + 1, 3);
  setHintLevel(newHintLevel);

  const hint = generateHint(currentTarget, newHintLevel);

  setChatHistory(prev => [...prev, {
    id: `hint-${Date.now()}`,
    role: 'assistant',
    content: hint,
    timestamp: new Date()
  }]);
};
```

---

## ❓ Questions for You:

### **1. Question Generation:**
- Should we use **OpenAI** (dynamic questions) or **pre-written question bank** (faster, cheaper)?
  - OpenAI: More variety, contextual
  - Question bank: Faster, more reliable

### **2. Question Focus:**
Which should we prioritize?
- A) Questions about the **target species** (what they're looking for)
- B) Questions about **general food web concepts**
- C) Questions about the **ecoregion ecosystem**
- Recommended: Mix (70% target species, 20% food web, 10% ecoregion)

### **3. Difficulty:**
- Should questions adapt based on student performance?
- Or keep consistent 5th grade level?

### **4. Hint Triggers:**
- Should "Hint" button always be visible?
- Or only after correct trivia answer? (Recommended)

### **5. Skip Mechanism:**
- After 3 wrong trivia answers, should we:
  - A) Auto-skip to next phase (auto-reveal target)
  - B) Give them one more chance to search
  - Recommended: A (keeps game moving)

---

## 📝 Next Steps:

1. **Confirm questions above**
2. **Create `triviaAgent.ts`** with question generation
3. **Update `Index.tsx`** with trivia flow
4. **Test trivia loop** (wrong answer → question → answer → unlock)
5. **Implement hint system**
6. **Clean up quick replies**

Let me know your preferences and I'll start implementing! 🚀
