# Chat Context System

## Overview
The ChatInput component now dynamically adapts its placeholder text based on which card is displayed on the right side of the screen. This creates a contextually-aware conversation experience that guides users to ask relevant questions about the current topic.

## How It Works

### 1. Chat Context Type
The system uses a `ChatContext` interface to represent what's currently being viewed:

```typescript
export interface ChatContext {
  type: 'species' | 'habitat' | 'wildlife-park' | 'threat' | 'ecosystem' | 'region-species' | 'default';
  name: string;
  details?: string;
}
```

### 2. Context Priority (Matches Card Display Priority)
The context is determined by checking which card is visible, in this order:

1. **Wildlife Park** - When user clicks on a wildlife park marker
2. **Expanded Image** - When viewing threat or ecosystem images
3. **Region Species** - When a species is selected from the carousel
4. **Hardcoded Species** - When viewing species like Polar Bear (legacy data)
5. **Habitat** - When viewing habitat/location information
6. **Default** - No card showing (initial state)

### 3. Dynamic Placeholders
Based on the context type, the ChatInput displays relevant placeholder text:

| Context Type | Example Placeholder |
|-------------|-------------------|
| `species` | "Ask about Polar Bear's habitat, diet, or conservation..." |
| `habitat` | "Ask about Arctic Tundra's ecosystem, threats, or wildlife..." |
| `wildlife-park` | "Ask about Yellowstone National Park's animals, facilities, or visit info..." |
| `threat` | "Ask about this environmental threat and its impact..." |
| `ecosystem` | "Ask about this ecosystem connection..." |
| `region-species` | "Ask about Arctic Fox in Arctic Region..." |
| `default` | "Enter an animal species or location to begin" |

## Implementation Details

### ChatInput Component (`src/components/ChatInput.tsx`)
- Added `ChatContext` interface and exported it for use in other components
- Added `context?: ChatContext` prop to `ChatInputProps`
- Created `getContextualPlaceholder()` function that generates appropriate placeholder text
- Maintains support for manual `placeholder` override if needed

### Index Component (`src/pages/Index.tsx`)
- Imported `useMemo` from React and `ChatContext` from ChatInput
- Added `chatContext` computed using `useMemo` to track the current context
- The memo dependencies ensure context updates whenever any card state changes
- Passes `chatContext` to the `ChatInput` component instead of manual placeholder

## Benefits

1. **User Guidance** - Users immediately understand what they can ask about
2. **Context Awareness** - The chat input is always relevant to what's on screen
3. **LLM-Ready** - The context object can be passed to the LLM to provide relevant conversation context
4. **Maintainable** - Single source of truth for what's being displayed

## Next Steps for LLM Integration

When you're ready to add the LLM, you can use the `chatContext` to:

1. **System Prompt**: Inject context into the system prompt
   ```typescript
   const systemPrompt = `You are discussing ${chatContext.type} named ${chatContext.name}. ${chatContext.details ? `Additional info: ${chatContext.details}` : ''}`;
   ```

2. **Retrieve Relevant Data**: Use the context to fetch additional data
   ```typescript
   if (chatContext.type === 'species') {
     // Fetch species-specific info from speciesInfo state
   } else if (chatContext.type === 'habitat') {
     // Fetch habitat-specific info from currentHabitat state
   }
   ```

3. **Conversation Memory**: Track context changes to maintain coherent conversations
   ```typescript
   // When context changes, you might want to add a system message
   if (previousContext.name !== chatContext.name) {
     addSystemMessage(`Now discussing ${chatContext.name}`);
   }
   ```

## Testing

To test the system:
1. Search for a species (e.g., "polar bear") - placeholder should say "Ask about Polar Bear's habitat..."
2. Search for a location (e.g., "Yellowstone") - placeholder should say "Ask about [Habitat Name]'s ecosystem..."
3. Click on a wildlife park marker - placeholder should say "Ask about [Park Name]'s animals..."
4. Select a species from the carousel - placeholder should say "Ask about [Species] in [Region]..."
5. Click on threat/ecosystem images - placeholder should adapt accordingly

All placeholders update automatically based on what card is visible on the right side.
