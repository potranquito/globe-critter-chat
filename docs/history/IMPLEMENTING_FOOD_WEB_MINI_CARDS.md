# 🎮 Implementing Food Web Species Selection & Mini Cards

## Overview
This document outlines the implementation plan for the food web species selection game feature. Users select 3 species (1 Carnivore, 1 Herbivore/Omnivore, 1 Producer) to play a trivia game.

---

## ✅ Implementation Checklist

### **Phase 1: Component Creation**

#### 1.1 FoodWebMiniCard Component
- [ ] Create `/src/components/FoodWebMiniCard.tsx`
- [ ] Component props:
  - `species: RegionSpecies`
  - `slotType: 'carnivore' | 'herbivoreOmnivore' | 'producer'`
  - `onRemove?: () => void` (optional - for future deselect feature)
- [ ] Design specs:
  - Width: 200px
  - Height: Proportional (approx 240px for 5:6 ratio)
  - Rectangle card shape
  - Display: Species image (top) + name (bottom)
  - Style: glass-panel with border
  - Hover: Subtle scale effect
- [ ] Add dietary category indicator (emoji badge: 🥩/🌱/🍽️/☀️)

#### 1.2 FoodWebSelectionBar Component
- [ ] Create `/src/components/FoodWebSelectionBar.tsx`
- [ ] Component props:
  - `selectedSpecies: SelectedFoodWebSpecies`
  - `onSpeciesClick?: (species: RegionSpecies, slot: string) => void` (for future deselect)
- [ ] Layout:
  - Horizontal flex container
  - Center-aligned under GlobalHealthBar
  - Gap between cards: 16px (gap-4)
  - Dynamic width based on selected cards
- [ ] Empty state:
  - Show placeholder slots or hide completely when empty
  - Consider showing "Select 3 species to play" hint
- [ ] Animation:
  - Cards fade in when added
  - Cards slide/fade when swapped

---

### **Phase 2: State Management**

#### 2.1 Add Types & Interfaces
- [ ] Add to `/src/pages/Index.tsx`:
```typescript
interface SelectedFoodWebSpecies {
  carnivore: RegionSpecies | null;
  herbivoreOmnivore: RegionSpecies | null;
  producer: RegionSpecies | null;
}
```

#### 2.2 Add State Variables
- [ ] Add state: `selectedFoodWebSpecies`
```typescript
const [selectedFoodWebSpecies, setSelectedFoodWebSpecies] = useState<SelectedFoodWebSpecies>({
  carnivore: null,
  herbivoreOmnivore: null,
  producer: null
});
```

#### 2.3 Helper Functions
- [ ] Create `determineSpeciesSlot(species: RegionSpecies): string` function
  - Uses `species.dietaryCategory` to determine slot
  - Returns: 'carnivore' | 'herbivoreOmnivore' | 'producer'
  - Logic:
    - dietaryCategory === 'Carnivore' → 'carnivore'
    - dietaryCategory === 'Herbivore' OR 'Omnivore' → 'herbivoreOmnivore'
    - dietaryCategory === 'Producer' → 'producer'
- [ ] Create `isAllSlotsFilledForTrivia(): boolean` function
  - Returns true if all 3 slots have species
- [ ] Create `isSpeciesSelected(scientificName: string): boolean` function
  - Check if species is in any of the 3 slots

---

### **Phase 3: Selection Logic**

#### 3.1 Handle Species Selection
- [ ] Create `handleSelectSpeciesForGame(species: RegionSpecies)` function
- [ ] Logic flow:
  1. Determine which slot the species belongs to (carnivore/herbivoreOmnivore/producer)
  2. Update state (swap if slot already filled)
  3. Visual feedback (toast notification? subtle animation?)
- [ ] Edge cases:
  - Handle species without dietaryCategory (fallback logic)
  - Validate species data before selection

#### 3.2 Handle Species Deselection (Future)
- [ ] Create `handleDeselectSpecies(slotType: string)` function (placeholder for future)
- [ ] For now: Swap-only behavior (no explicit remove)

---

### **Phase 4: Update RegionSpeciesCard**

#### 4.1 Remove "Generate Lesson Plan" Button
- [ ] Open `/src/components/RegionSpeciesCard.tsx`
- [ ] Locate "Generate Lesson Plan" button section
- [ ] Comment out or remove entirely (species cards don't generate lessons)

#### 4.2 Add "Select Species" Button
- [ ] Add new button at same location
- [ ] Props needed from parent:
  - `onSelectForGame?: (species: RegionSpecies) => void`
  - `isSelectedForGame?: boolean` (for visual feedback)
- [ ] Button specs:
  - Text: "Select Species" or "Add Species"
  - Background: Red (`bg-red-500` or `bg-red-600`)
  - Text color: White (`text-white`)
  - Hover: Darker red (`hover:bg-red-700`)
  - Icon: Optional (➕ or 🎮)
- [ ] Button states:
  - Default: "Select Species"
  - If already selected: Keep enabled (allows swap)
  - Visual: Show checkmark or different styling if selected

#### 4.3 Pass Props from Index.tsx
- [ ] Update RegionSpeciesCard usage in Index.tsx
- [ ] Pass `onSelectForGame={handleSelectSpeciesForGame}`
- [ ] Pass `isSelectedForGame={isSpeciesSelected(species.scientificName)}`

---

### **Phase 5: Update RegionSpeciesCarousel**

#### 5.1 Add Selected State Highlighting
- [ ] Open `/src/components/RegionSpeciesCarousel.tsx`
- [ ] Add prop: `selectedForGameSpecies?: string[]` (array of scientific names)
- [ ] Update card rendering logic:
  - Add conditional className for selected species
  - Visual: Border glow, checkmark badge, or opacity change
  - Example: `ring-2 ring-green-500` for selected cards

#### 5.2 Pass Selected Species from Index.tsx
- [ ] Extract selected species scientific names:
```typescript
const selectedGameSpeciesNames = Object.values(selectedFoodWebSpecies)
  .filter(s => s !== null)
  .map(s => s!.scientificName);
```
- [ ] Pass to carousel: `selectedForGameSpecies={selectedGameSpeciesNames}`

---

### **Phase 6: Layout Integration**

#### 6.1 Add FoodWebSelectionBar to Index.tsx
- [ ] Import FoodWebSelectionBar component
- [ ] Position under GlobalHealthBar
- [ ] Placement options:
  - **Option A:** Fixed position (top center, z-index above map)
  - **Option B:** Inside existing layout structure
  - **Recommended:** Fixed position, similar to GlobalHealthBar
- [ ] Example positioning:
```tsx
{/* Food Web Selection Bar - Under Health Bar */}
{isMapView && (Object.values(selectedFoodWebSpecies).some(s => s !== null)) && (
  <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-[95] pointer-events-auto">
    <FoodWebSelectionBar selectedSpecies={selectedFoodWebSpecies} />
  </div>
)}
```

#### 6.2 Adjust GlobalHealthBar Spacing
- [ ] Ensure enough vertical space between health bar and selection bar
- [ ] Adjust z-index if needed (health bar: z-90, selection bar: z-95)

---

### **Phase 7: Play Trivia Button**

#### 7.1 Add Button to Layout
- [ ] Locate "Back to Globe" button in Index.tsx
- [ ] Add "Play Trivia" button **above** it
- [ ] Conditional rendering:
```tsx
{isMapView && isAllSlotsFilledForTrivia() && (
  <Button
    onClick={handlePlayTrivia}
    className="glass-panel rounded-xl px-6 py-3 bg-primary hover:bg-primary/90"
  >
    🎮 Play Trivia
  </Button>
)}
```

#### 7.2 Button Styling
- [ ] Style: Primary color (blue) with game emoji
- [ ] Size: Prominent but not overwhelming
- [ ] Position: Fixed position (right side, above "Back to Globe")

---

### **Phase 8: Trivia Game Integration**

#### 8.1 Create Trivia Context Data
- [ ] Create function to prepare trivia context:
```typescript
const prepareTriviaContext = (): EducationContext => {
  return {
    mode: 'trivia',
    ecoregion: regionInfo,
    selectedSpecies: [
      selectedFoodWebSpecies.carnivore,
      selectedFoodWebSpecies.herbivoreOmnivore,
      selectedFoodWebSpecies.producer
    ].filter(s => s !== null) as RegionSpecies[],
    foodWebRelationships: true // Flag for agent to focus on food web
  };
};
```

#### 8.2 Implement handlePlayTrivia Function
- [ ] Create handler:
```typescript
const handlePlayTrivia = async () => {
  // 1. Prepare trivia context
  const triviaContext = prepareTriviaContext();

  // 2. Open chat panel if closed
  setChatOpen(true);

  // 3. Send to education agent
  const triviaPrompt = `Start a trivia game about the food web with these species:
    - Carnivore: ${selectedFoodWebSpecies.carnivore?.commonName}
    - Herbivore/Omnivore: ${selectedFoodWebSpecies.herbivoreOmnivore?.commonName}
    - Producer: ${selectedFoodWebSpecies.producer?.commonName}

    Ask easy multiple-choice questions about their roles in the ecosystem, what they eat,
    and how they interact. Evaluate the student's answers and provide educational feedback.`;

  await sendEducationMessage(triviaPrompt, triviaContext);
};
```

#### 8.3 Update Education Agent Prompt
- [ ] Check `/src/services/educationAgent.ts`
- [ ] Ensure agent can handle trivia mode
- [ ] Add trivia-specific prompting:
  - Generate multiple-choice questions
  - Focus on food web relationships
  - Easy difficulty level
  - Evaluate student answers
  - Provide encouraging feedback

---

### **Phase 9: Visual Polish & UX**

#### 9.1 Animations
- [ ] FoodWebMiniCard:
  - Fade in when added (`animate-fade-in`)
  - Scale on hover (`hover:scale-105`)
  - Smooth transitions (`transition-all duration-300`)
- [ ] Card swap animation:
  - Fade out old card
  - Fade in new card
  - Use CSS keyframes or Framer Motion

#### 9.2 Visual Feedback
- [ ] Toast notifications:
  - "✅ [Species Name] selected as [Carnivore/Herbivore/Producer]!"
  - "🔄 [Old Species] replaced with [New Species]"
  - "🎮 All species selected! Ready to play trivia!"
- [ ] Button state changes:
  - "Select Species" → Shows checkmark when that species is selected
  - Disabled state styling if needed

#### 9.3 Responsive Design
- [ ] Test mini cards on different screen sizes
- [ ] Mobile: Stack cards vertically or reduce size
- [ ] Tablet: Adjust spacing
- [ ] Desktop: Current design (horizontal layout)

---

### **Phase 10: Testing & Edge Cases**

#### 10.1 Core Functionality Tests
- [ ] Test selecting 3 different species (1 of each type)
- [ ] Test swapping carnivore with another carnivore
- [ ] Test swapping herbivore with omnivore (same slot)
- [ ] Test swapping producer with another producer
- [ ] Test "Play Trivia" button appears after 3 selections
- [ ] Test trivia game launches correctly

#### 10.2 Edge Cases
- [ ] Species without dietaryCategory field (fallback logic)
- [ ] Selecting same species twice (should be no-op or show message)
- [ ] Navigating away from map view (preserve selections?)
- [ ] Clearing selections (future feature)
- [ ] Species data missing images/names

#### 10.3 Integration Tests
- [ ] Carousel highlighting updates correctly
- [ ] Mini cards persist when viewing other species in right panel
- [ ] Chat panel opens when Play Trivia clicked
- [ ] Education agent receives correct context

---

## 📋 File Checklist

### New Files to Create:
- [ ] `/src/components/FoodWebMiniCard.tsx`
- [ ] `/src/components/FoodWebSelectionBar.tsx`
- [ ] `/src/types/foodWebGame.ts` (optional - for type definitions)

### Files to Modify:
- [ ] `/src/pages/Index.tsx` (state, handlers, layout)
- [ ] `/src/components/RegionSpeciesCard.tsx` (button replacement)
- [ ] `/src/components/RegionSpeciesCarousel.tsx` (highlighting)
- [ ] `/src/services/educationAgent.ts` (trivia mode support - optional for now)

---

## 🎯 Success Criteria

**Feature is complete when:**
1. ✅ User can click "Select Species" on any species card
2. ✅ Mini card appears under GlobalHealthBar
3. ✅ Selecting a second species of same diet category replaces the first (swap behavior)
4. ✅ Selected species show highlight in carousel
5. ✅ Mini cards show image + name in 200px width rectangle
6. ✅ "Play Trivia" button appears when all 3 slots filled
7. ✅ Clicking "Play Trivia" opens chat and sends context to education agent
8. ✅ Agent asks first trivia question
9. ✅ All animations and transitions are smooth
10. ✅ No console errors, all TypeScript types correct

---

## 🚀 Implementation Order

**Recommended sequence:**
1. Create components (FoodWebMiniCard, FoodWebSelectionBar)
2. Add state management to Index.tsx
3. Update RegionSpeciesCard button
4. Implement selection logic & handlers
5. Add carousel highlighting
6. Integrate layout (selection bar under health bar)
7. Add Play Trivia button
8. Wire up education agent
9. Polish animations & UX
10. Test thoroughly

---

## 📝 Notes & Decisions

### Design Decisions:
- **Swap behavior:** No explicit remove button - selecting a new species of the same category replaces the old one
- **Button always enabled:** "Select Species" stays clickable even after selection (allows easy swapping)
- **Mini card size:** 200px width, proportional height (approx 5:6 ratio)
- **Button color:** Red background (`bg-red-600`) with white text
- **Trivia button:** Primary blue color, positioned above "Back to Globe"

### Future Enhancements (Not in Scope):
- [ ] Explicit deselect/remove button on mini cards (X icon)
- [ ] Drag & drop species into slots
- [ ] Save selected species to database
- [ ] Background agent/MCP for species data processing during trivia
- [ ] Trivia scoring system
- [ ] Trivia completion rewards (badges, points, etc.)

---

**Ready to begin implementation!** 🎮✨
