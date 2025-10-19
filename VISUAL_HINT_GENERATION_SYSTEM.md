# Visual Hint Generation System

## The Challenge

Students need to find specific species in a carousel by clicking on images. The AI must give **visual hints** (what the species looks like) not just behavioral/ecological hints.

### Bad Hints (Behavioral):
❌ "This animal is a carnivore that hunts at night"
❌ "This producer provides food for many animals"
❌ "This herbivore lives in the forest"

### Good Hints (Visual):
✅ "Look for an animal with spotted golden fur and a long tail"
✅ "This tree has large, dark green leaves and smooth bark"
✅ "It's a large gray animal with big ears and a trunk"

---

## Solution Options

### **Option 1: AI-Generated Hints On-Demand (Fastest to Implement)**

Use GPT-4 to generate visual descriptions when needed.

#### Implementation:

```typescript
// New function in educationAgent.ts
export async function generateVisualHint(
  speciesName: string,
  animalType: string,
  hintLevel: 1 | 2 | 3
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const prompts = {
    1: `Give a vague visual hint about what a ${speciesName} looks like. Mention only 1 feature (color OR size OR shape). Keep it under 15 words. Focus ONLY on appearance, not behavior.`,
    2: `Give a medium visual hint about what a ${speciesName} looks like. Mention 2 features (e.g., color + distinctive feature). Keep it under 20 words. Focus ONLY on appearance.`,
    3: `Give a specific visual hint about what a ${speciesName} looks like. Mention 3+ distinctive features. Keep it under 25 words. Focus ONLY on appearance. Example: "Look for spotted golden fur, a long tail, and powerful build."`
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a visual description expert for wildlife. Only describe APPEARANCE (colors, patterns, size, shape, distinctive features). Never describe behavior or habitat.`
        },
        {
          role: 'user',
          content: prompts[hintLevel]
        }
      ],
      max_tokens: 50,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}
```

#### Usage in System Prompt:

```typescript
**TRIVIA ANSWER - CORRECT**:
1. Praise them: "Great job! That's correct!"
2. Call generateVisualHint() to get appearance description
3. Share the hint: "Hint: [visual description]"
```

#### Pros:
- ✅ Fast to implement (no database changes)
- ✅ Works for all species (uses GPT-4's knowledge)
- ✅ Progressive hints (level 1 → 2 → 3)
- ✅ No MCP server changes needed

#### Cons:
- ❌ Costs OpenAI API calls per hint
- ❌ May not always be accurate for rare species
- ❌ Latency (extra API call)

---

### **Option 2: MCP Tool for Species Appearance (Most Accurate)**

Add a new MCP tool that fetches visual descriptions from the database.

#### Step 1: Add Column to Database

```sql
-- Add visual_description column to species table
ALTER TABLE species
ADD COLUMN visual_description TEXT;

-- Example data:
UPDATE species
SET visual_description = 'Spotted golden fur with black rosettes, long tail, powerful muscular build, white belly, amber eyes'
WHERE common_name = 'Leopard';
```

#### Step 2: Create MCP Tool

```typescript
// In globe-critter-mcp-server/src/tools/speciesTools.ts

server.tool(
  "get_species_visual_hints",
  "Get progressive visual hints about a species appearance",
  {
    speciesId: z.string().describe("The ID of the species"),
    hintLevel: z.enum(["1", "2", "3"]).describe("Hint difficulty: 1=vague, 2=medium, 3=specific")
  },
  async ({ speciesId, hintLevel }) => {
    const { data: species, error } = await supabase
      .from('species')
      .select('common_name, visual_description, species_type')
      .eq('id', speciesId)
      .single();

    if (error || !species) {
      throw new Error('Species not found');
    }

    // Parse visual_description and return appropriate hint level
    const fullDescription = species.visual_description || '';
    const features = fullDescription.split(',').map(f => f.trim());

    let hint = '';
    switch (hintLevel) {
      case '1':
        // Vague: 1 feature
        hint = features[0] || 'No description available';
        break;
      case '2':
        // Medium: 2 features
        hint = features.slice(0, 2).join(', ');
        break;
      case '3':
        // Specific: 3+ features
        hint = features.slice(0, 4).join(', ');
        break;
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          species: {
            common_name: species.common_name,
            type: species.species_type,
            hint: hint,
            hintLevel: hintLevel
          }
        })
      }]
    };
  }
);
```

#### Step 3: Populate Database

```typescript
// Script to auto-generate visual descriptions
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateVisualDescriptions() {
  const { data: species } = await supabase
    .from('species')
    .select('id, common_name, scientific_name, species_type')
    .is('visual_description', null)
    .limit(100);

  for (const sp of species) {
    const prompt = `Describe the physical appearance of ${sp.common_name} (${sp.scientific_name}). Include: colors, patterns, size, distinctive features, body shape. Keep it factual and concise (under 50 words). Separate features with commas.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a wildlife identification expert. Describe only visual appearance.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 100
    });

    const description = response.choices[0].message.content;

    await supabase
      .from('species')
      .update({ visual_description: description })
      .eq('id', sp.id);

    console.log(`✅ ${sp.common_name}: ${description}`);
  }
}
```

#### Pros:
- ✅ Most accurate (pre-generated and validated)
- ✅ Fast (no API calls during gameplay)
- ✅ Consistent descriptions
- ✅ Progressive hint system built-in

#### Cons:
- ❌ Requires database schema change
- ❌ Need to populate data for all species
- ❌ MCP server updates needed

---

### **Option 3: Hybrid Approach (RECOMMENDED)**

Combine both: Use database when available, fall back to AI generation.

```typescript
export async function getVisualHint(
  speciesId: string,
  speciesName: string,
  animalType: string,
  hintLevel: 1 | 2 | 3
): Promise<string> {
  // Try MCP first (if database has descriptions)
  try {
    const mcpHint = await getSpeciesVisualHints({
      speciesId,
      hintLevel: String(hintLevel)
    });

    if (mcpHint.species?.hint) {
      return mcpHint.species.hint;
    }
  } catch (error) {
    console.log('[Visual Hint] MCP failed, using AI fallback');
  }

  // Fallback to AI generation
  return await generateVisualHint(speciesName, animalType, hintLevel);
}
```

#### Pros:
- ✅ Works immediately (AI fallback)
- ✅ Improves over time (as database fills)
- ✅ Best of both worlds
- ✅ No game-breaking if MCP unavailable

---

## Implementation Roadmap

### Phase 1: Quick Win (AI-Generated)
**Timeline: 1-2 hours**

1. Add `generateVisualHint()` function to `educationAgent.ts`
2. Update system prompt to call it after correct trivia answers
3. Test with a few species
4. Deploy

### Phase 2: Database Enhancement (MCP Tool)
**Timeline: 1 day**

1. Add `visual_description` column to species table
2. Run GPT-4 script to populate top 100 species
3. Add MCP tool `get_species_visual_hints`
4. Update React frontend to use MCP tool
5. Deploy MCP server to Railway

### Phase 3: Hybrid System
**Timeline: 2 hours**

1. Create `getVisualHint()` wrapper function
2. Try MCP first, fallback to AI
3. Log which method was used (for analytics)
4. Deploy

---

## Testing Strategy

### Manual Testing:

**Test Species with Known Appearance:**
- Leopard (spotted fur, golden, black rosettes)
- African Elephant (large, gray, trunk, big ears)
- Baobab Tree (thick trunk, branches like roots)

**Test Hint Levels:**
1. **Level 1 (Vague)**: "Golden fur"
2. **Level 2 (Medium)**: "Golden fur with black spots"
3. **Level 3 (Specific)**: "Golden fur with black rosettes, long tail, muscular build"

### Validation Criteria:

✅ Hint mentions VISUAL features only
✅ No behavioral/ecological info
✅ Accurate to the actual species
✅ Helps student identify from image carousel
✅ Progressive difficulty works

---

## Recommendation

**Start with Option 1** (AI-Generated On-Demand) because:
1. No database changes needed
2. Works immediately for all species
3. Can test game flow right away
4. Easy to upgrade to hybrid later

**Then migrate to Option 3** (Hybrid) for production:
1. Better performance
2. Lower API costs
3. More accurate hints
4. Graceful degradation

---

## Next Steps

1. Implement `generateVisualHint()` function
2. Test with 5-10 species
3. Validate hint quality
4. If good → keep it
5. If not good enough → move to MCP tool approach

**Status**: Ready to implement! 🚀
