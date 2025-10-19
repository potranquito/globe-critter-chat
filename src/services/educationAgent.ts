/**
 * Education Agent Service
 *
 * Provides context-aware educational responses about species, parks, and ecoregions.
 * Uses OpenAI to generate concise, factual information based on the current card context.
 */

import { getRegionSpecies, getEcoregionInfo } from './mcpClient';

/**
 * Generate a visual hint about what a species looks like
 * @param speciesName - Common name of the species
 * @param animalType - Type of species (Mammal, Plant, Bird, etc.)
 * @param hintLevel - 1 = vague, 2 = medium, 3 = specific
 * @returns Visual description string
 */
export async function generateVisualHint(
  speciesName: string,
  animalType: string,
  hintLevel: 1 | 2 | 3
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-key-here') {
    // Fallback if no API key
    return `Look for the ${speciesName} in the ${animalType} section.`;
  }

  const prompts = {
    1: `Give a vague visual hint about what a ${speciesName} (${animalType}) looks like. Mention only 1 visual feature (color OR size OR shape). Keep it under 15 words. Focus ONLY on physical appearance, not behavior. Start with "Look for..."`,
    2: `Give a medium visual hint about what a ${speciesName} (${animalType}) looks like. Mention 2 visual features (e.g., color + distinctive feature). Keep it under 20 words. Focus ONLY on physical appearance. Start with "Look for..."`,
    3: `Give a specific visual hint about what a ${speciesName} (${animalType}) looks like. Mention 3+ distinctive visual features. Keep it under 25 words. Focus ONLY on physical appearance. Start with "Look for..." Example: "Look for spotted golden fur, a long tail, and powerful build."`
  };

  try {
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
            content: `You are a visual description expert for wildlife and plants. Only describe APPEARANCE (colors, patterns, size, shape, distinctive features). Never describe behavior or habitat.`
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

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const hint = data.choices[0].message.content.trim();

    console.log(`[Visual Hint] Level ${hintLevel} for ${speciesName}:`, hint);

    return hint;
  } catch (error) {
    console.error('[Visual Hint] Generation failed:', error);
    // Fallback
    return `Look for the ${speciesName} in the carousel. It's a ${animalType}.`;
  }
}

/**
 * Create context for Producer Agent (Phase 1)
 */
export function createProducerAgentContext(
  ecoregionName: string,
  targetSpecies: FoodWebContext['targetSpecies'],
  foundSpecies: FoodWebContext['species'] = []
): EducationContext {
  return {
    type: 'foodweb',
    displayName: `Food Web - Producer Phase`,
    data: {
      ecoregionName,
      species: foundSpecies,
      speciesCount: foundSpecies.length,
      targetSpecies,
      currentPhase: 'producer'
    }
  };
}

/**
 * Create context for Herbivore Agent (Phase 2)
 */
export function createHerbivoreAgentContext(
  ecoregionName: string,
  targetSpecies: FoodWebContext['targetSpecies'],
  foundSpecies: FoodWebContext['species'] = []
): EducationContext {
  return {
    type: 'foodweb',
    displayName: `Food Web - Herbivore Phase`,
    data: {
      ecoregionName,
      species: foundSpecies,
      speciesCount: foundSpecies.length,
      targetSpecies,
      currentPhase: 'herbivoreOmnivore'
    }
  };
}

/**
 * Create context for Carnivore Agent (Phase 3)
 */
export function createCarnivoreAgentContext(
  ecoregionName: string,
  targetSpecies: FoodWebContext['targetSpecies'],
  foundSpecies: FoodWebContext['species'] = []
): EducationContext {
  return {
    type: 'foodweb',
    displayName: `Food Web - Carnivore Phase`,
    data: {
      ecoregionName,
      species: foundSpecies,
      speciesCount: foundSpecies.length,
      targetSpecies,
      currentPhase: 'carnivore'
    }
  };
}

/**
 * Validate if the user selected the correct species
 */
export function validateSpeciesSelection(
  selectedSpecies: { id: string; scientificName: string; commonName: string },
  targetSpecies: { id: string; commonName: string; scientificName: string } | null
): { correct: boolean; targetName: string } {
  if (!targetSpecies) {
    return { correct: false, targetName: 'Unknown' };
  }

  // Match by scientific name (more reliable than ID which may vary between sources)
  const correct = selectedSpecies.scientificName === targetSpecies.scientificName ||
                  selectedSpecies.commonName === targetSpecies.commonName;

  console.log('[Food Web Game] Validation:', {
    selectedScientificName: selectedSpecies.scientificName,
    selectedCommonName: selectedSpecies.commonName,
    targetScientificName: targetSpecies.scientificName,
    targetCommonName: targetSpecies.commonName,
    correct
  });

  return {
    correct,
    targetName: targetSpecies.commonName
  };
}

/**
 * AI-powered species selection for educational carousel
 * Uses AI to intelligently select 3 species based on educational strategy
 */
export async function selectSpeciesWithAI(
  carouselSpecies: any[],
  ecoregionName: string
): Promise<{
  carnivore: any;
  herbivore: any;
  omnivore: any;
  bird: any;
  plantCoral: any;
  strategy: string;
  explanation: string;
}> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  // Filter species by dietary category and type
  const carnivores = carouselSpecies.filter(sp =>
    sp.dietaryCategory?.toLowerCase() === 'carnivore' ||
    sp.dietaryCategory?.toLowerCase() === 'carnivores'
  );
  const herbivores = carouselSpecies.filter(sp =>
    sp.dietaryCategory?.toLowerCase() === 'herbivore' ||
    sp.dietaryCategory?.toLowerCase() === 'herbivores'
  );
  const omnivores = carouselSpecies.filter(sp =>
    sp.dietaryCategory?.toLowerCase() === 'omnivore' ||
    sp.dietaryCategory?.toLowerCase() === 'omnivores'
  );
  const birds = carouselSpecies.filter(sp =>
    sp.taxonomicGroup?.toLowerCase() === 'birds' ||
    sp.animalType?.toLowerCase().includes('bird') ||
    sp.animalType?.toLowerCase().includes('aves')
  );
  const plantsCorals = carouselSpecies.filter(sp =>
    sp.taxonomicGroup?.toLowerCase() === 'plants & corals' ||
    sp.animalType?.toLowerCase().includes('plant') ||
    sp.animalType?.toLowerCase().includes('coral')
  );

  console.log('[AI Selection] Available species:', {
    carnivores: carnivores.length,
    herbivores: herbivores.length,
    omnivores: omnivores.length,
    birds: birds.length,
    plantsCorals: plantsCorals.length
  });

  // Fallback to random if no API key
  if (!apiKey || apiKey === 'your-openai-key-here') {
    console.log('[AI Selection] No API key - using random selection');
    return randomSelection(carnivores, herbivores, omnivores, birds, plantsCorals);
  }

  try {
    // Prepare species data for AI
    const speciesToSelect = {
      carnivores: carnivores.map(s => ({
        commonName: s.commonName,
        scientificName: s.scientificName,
        conservationStatus: s.conservationStatus || 'Unknown',
        animalType: s.animalType || 'Unknown'
      })),
      herbivores: herbivores.map(s => ({
        commonName: s.commonName,
        scientificName: s.scientificName,
        conservationStatus: s.conservationStatus || 'Unknown',
        animalType: s.animalType || 'Unknown'
      })),
      omnivores: omnivores.map(s => ({
        commonName: s.commonName,
        scientificName: s.scientificName,
        conservationStatus: s.conservationStatus || 'Unknown',
        animalType: s.animalType || 'Unknown'
      })),
      birds: birds.map(s => ({
        commonName: s.commonName,
        scientificName: s.scientificName,
        conservationStatus: s.conservationStatus || 'Unknown',
        animalType: s.animalType || 'Unknown'
      })),
      plantsCorals: plantsCorals.map(s => ({
        commonName: s.commonName,
        scientificName: s.scientificName,
        conservationStatus: s.conservationStatus || 'Unknown',
        animalType: s.animalType || 'Plant/Coral'
      }))
    };

    const systemPrompt = `You are an educational AI that selects species for a food web learning game. Your goal is to create engaging, educational experiences for 6th grade students.

Available strategies:
1. "carnivore-focus" - Highlight apex predators and their importance
2. "food-web-variety" - Show diverse ecosystem connections
3. "conservation-focus" - Emphasize endangered species
4. "biodiversity-showcase" - Display ecosystem diversity
5. "charismatic-megafauna" - Use recognizable, exciting animals

Select ONE of each: carnivore, herbivore, omnivore, bird, and plant/coral that work well together as an educational food web. Consider:
- Educational value for 6th graders
- Visual appeal and recognizability
- Conservation status diversity
- Ecological relationships across all trophic levels

IMPORTANT: For each species, provide ONLY the scientific name (e.g., "Panthera leo"), NOT the common name.

Respond with ONLY valid JSON in this exact format:
{
  "strategy": "food-web-variety",
  "explanation": "Brief explanation for students",
  "carnivore": "Panthera leo",
  "herbivore": "Giraffa camelopardalis",
  "omnivore": "Ursus arctos",
  "bird": "Aquila chrysaetos",
  "plantCoral": "Acacia tortilis"
}`;

    const userPrompt = `Region: ${ecoregionName}

Available Species:
CARNIVORES: ${speciesToSelect.carnivores.map(s => `${s.commonName} (${s.scientificName})`).join(', ')}

HERBIVORES: ${speciesToSelect.herbivores.map(s => `${s.commonName} (${s.scientificName})`).join(', ')}

OMNIVORES: ${speciesToSelect.omnivores.map(s => `${s.commonName} (${s.scientificName})`).join(', ')}

BIRDS: ${speciesToSelect.birds.map(s => `${s.commonName} (${s.scientificName})`).join(', ')}

PLANTS/CORALS: ${speciesToSelect.plantsCorals.map(s => `${s.commonName} (${s.scientificName})`).join(', ')}

Select 5 species (one from each category) that create a compelling educational food web. Respond ONLY with JSON.`;

    console.log('[AI Selection] Calling OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 300,
        temperature: 0.8, // More creative selection
        response_format: { type: 'json_object' } // Force JSON response
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = JSON.parse(data.choices[0].message.content);

    console.log('[AI Selection] AI chose:', JSON.stringify(aiResponse, null, 2));

    // Find the selected species in the original arrays (case-insensitive, trimmed)
    const selectedCarnivore = carnivores.find(s =>
      s.scientificName?.toLowerCase().trim() === aiResponse.carnivore?.toLowerCase().trim()
    );
    const selectedHerbivore = herbivores.find(s =>
      s.scientificName?.toLowerCase().trim() === aiResponse.herbivore?.toLowerCase().trim()
    );
    const selectedOmnivore = omnivores.find(s =>
      s.scientificName?.toLowerCase().trim() === aiResponse.omnivore?.toLowerCase().trim()
    );
    const selectedBird = birds.find(s =>
      s.scientificName?.toLowerCase().trim() === aiResponse.bird?.toLowerCase().trim()
    );
    const selectedPlantCoral = plantsCorals.find(s =>
      s.scientificName?.toLowerCase().trim() === aiResponse.plantCoral?.toLowerCase().trim()
    );

    // Validate all species were found
    if (!selectedCarnivore || !selectedHerbivore || !selectedOmnivore || !selectedBird || !selectedPlantCoral) {
      console.warn('[AI Selection] AI selected species not found, falling back to random');
      console.warn('[AI Selection] Missing:', {
        carnivore: !selectedCarnivore ? aiResponse.carnivore : null,
        herbivore: !selectedHerbivore ? aiResponse.herbivore : null,
        omnivore: !selectedOmnivore ? aiResponse.omnivore : null,
        bird: !selectedBird ? aiResponse.bird : null,
        plantCoral: !selectedPlantCoral ? aiResponse.plantCoral : null
      });
      return randomSelection(carnivores, herbivores, omnivores, birds, plantsCorals);
    }

    return {
      carnivore: selectedCarnivore,
      herbivore: selectedHerbivore,
      omnivore: selectedOmnivore,
      bird: selectedBird,
      plantCoral: selectedPlantCoral,
      strategy: aiResponse.strategy,
      explanation: aiResponse.explanation
    };
  } catch (error) {
    console.error('[AI Selection] Failed:', error);
    return randomSelection(carnivores, herbivores, omnivores, birds, plantsCorals);
  }
}

/**
 * Fallback random selection (used when AI fails or no API key)
 */
function randomSelection(carnivores: any[], herbivores: any[], omnivores: any[], birds: any[], plantsCorals: any[]) {
  const randomCarnivore = carnivores.length > 0
    ? carnivores[Math.floor(Math.random() * carnivores.length)]
    : null;
  const randomHerbivore = herbivores.length > 0
    ? herbivores[Math.floor(Math.random() * herbivores.length)]
    : null;
  const randomOmnivore = omnivores.length > 0
    ? omnivores[Math.floor(Math.random() * omnivores.length)]
    : null;
  const randomBird = birds.length > 0
    ? birds[Math.floor(Math.random() * birds.length)]
    : null;
  const randomPlantCoral = plantsCorals.length > 0
    ? plantsCorals[Math.floor(Math.random() * plantsCorals.length)]
    : null;

  return {
    carnivore: randomCarnivore,
    herbivore: randomHerbivore,
    omnivore: randomOmnivore,
    bird: randomBird,
    plantCoral: randomPlantCoral,
    strategy: 'random-selection',
    explanation: 'Species selected randomly for this learning experience.'
  };
}

/**
 * Initialize target species for the food web game
 * Selects from carousel species (regionSpecies) only to ensure they're available
 */
export async function initializeFoodWebTargets(ecoregionName: string, carouselSpecies: any[]) {
  console.log('[Food Web Game] Initializing target species for:', ecoregionName);
  console.log('[Food Web Game] Carousel has', carouselSpecies.length, 'species available');

  try {
    // Filter carousel species by dietary category
    const carnivores = carouselSpecies.filter(sp =>
      sp.dietaryCategory?.toLowerCase() === 'carnivore' ||
      sp.dietaryCategory?.toLowerCase() === 'carnivores'
    );
    const herbivores = carouselSpecies.filter(sp =>
      sp.dietaryCategory?.toLowerCase() === 'herbivore' ||
      sp.dietaryCategory?.toLowerCase() === 'herbivores' ||
      sp.dietaryCategory?.toLowerCase() === 'omnivore' ||
      sp.dietaryCategory?.toLowerCase() === 'omnivores'
    );
    const producers = carouselSpecies.filter(sp =>
      sp.dietaryCategory?.toLowerCase() === 'producer' ||
      sp.dietaryCategory?.toLowerCase() === 'producers'
    );

    console.log('[Food Web Game] Available species by category:', {
      carnivores: carnivores.length,
      herbivores: herbivores.length,
      producers: producers.length
    });

    // 🔍 DEBUG: Show sample species from each category
    if (carnivores.length > 0) {
      console.log('[Food Web Game] Sample carnivore:', carnivores[0].commonName, '- dietary_category:', carnivores[0].dietaryCategory);
    }
    if (herbivores.length > 0) {
      console.log('[Food Web Game] Sample herbivore:', herbivores[0].commonName, '- dietary_category:', herbivores[0].dietaryCategory);
    }
    if (producers.length > 0) {
      console.log('[Food Web Game] Sample producer:', producers[0].commonName, '- dietary_category:', producers[0].dietaryCategory);
    }

    // Randomly select one from each category
    const randomCarnivore = carnivores.length > 0
      ? carnivores[Math.floor(Math.random() * carnivores.length)]
      : null;
    const randomHerbivore = herbivores.length > 0
      ? herbivores[Math.floor(Math.random() * herbivores.length)]
      : null;
    const randomProducer = producers.length > 0
      ? producers[Math.floor(Math.random() * producers.length)]
      : null;

    console.log('[Food Web Game] Selected targets:', {
      carnivore: randomCarnivore?.commonName,
      herbivore: randomHerbivore?.commonName,
      producer: randomProducer?.commonName
    });

    return {
      producer: randomProducer ? {
        id: String(randomProducer.scientificName),
        commonName: randomProducer.commonName,
        scientificName: randomProducer.scientificName,
        animalType: randomProducer.animalType || 'Producer',
        imageUrl: randomProducer.imageUrl || randomProducer.image_url || ''
      } : null,
      herbivoreOmnivore: randomHerbivore ? {
        id: String(randomHerbivore.scientificName),
        commonName: randomHerbivore.commonName,
        scientificName: randomHerbivore.scientificName,
        animalType: randomHerbivore.animalType || 'Herbivore',
        imageUrl: randomHerbivore.imageUrl || randomHerbivore.image_url || ''
      } : null,
      carnivore: randomCarnivore ? {
        id: String(randomCarnivore.scientificName),
        commonName: randomCarnivore.commonName,
        scientificName: randomCarnivore.scientificName,
        animalType: randomCarnivore.animalType || 'Carnivore',
        imageUrl: randomCarnivore.imageUrl || randomCarnivore.image_url || ''
      } : null
    };
  } catch (error) {
    console.error('[Food Web Game] Failed to initialize targets:', error);
    return {
      producer: null,
      herbivoreOmnivore: null,
      carnivore: null
    };
  }
}

export interface EducationContext {
  type: 'species' | 'park' | 'ecoregion' | 'foodweb';
  displayName: string;
  data: SpeciesContext | ParkContext | EcoregionContext | FoodWebContext;
}

export interface SpeciesContext {
  commonName: string;
  scientificName: string;
  animalType: string;
  conservationStatus: string;
  regionName: string;
  occurrenceCount?: number;
}

export interface ParkContext {
  name: string;
  location: { lat: number; lng: number };
  designation?: string;
  description?: string;
}

export interface EcoregionContext {
  regionName: string;
  description: string;
  speciesCount: number;
  biome?: string;
}

export interface FoodWebContext {
  ecoregionName: string;
  species: Array<{
    commonName: string;
    scientificName: string;
    role: 'carnivore' | 'herbivoreOmnivore' | 'producer';
    conservationStatus: string;
    animalType: string;
  }>;
  speciesCount: number; // 0, 1, 2, or 3
  // Pre-selected target species for the game
  targetSpecies: {
    producer: { id: string; commonName: string; scientificName: string; animalType: string } | null;
    herbivoreOmnivore: { id: string; commonName: string; scientificName: string; animalType: string } | null;
    carnivore: { id: string; commonName: string; scientificName: string; animalType: string } | null;
  };
  // Which species is the AI currently asking for
  currentPhase: 'producer' | 'herbivoreOmnivore' | 'carnivore';
}

/**
 * Generate a system prompt based on the education context
 */
async function generateSystemPrompt(context: EducationContext): Promise<string> {
  const baseInstructions = `You are a wildlife education assistant. Provide concise, factual responses in 2-3 sentences (max 100 words). Focus on facts that are interesting and educational.

IMPORTANT: If the user asks about topics unrelated to wildlife, nature, conservation, or ecology, respond with exactly: "OFF_TOPIC_ERROR"`;

  switch (context.type) {
    case 'species': {
      const species = context.data as SpeciesContext;
      return `${baseInstructions}

Current Context: ${species.commonName} (${species.scientificName})
- Type: ${species.animalType}
- Conservation Status: ${species.conservationStatus}
- Location: ${species.regionName}

Focus on: habitat preferences, diet, behavior, conservation challenges, interesting facts, and ecological role. Keep responses brief and engaging.`;
    }

    case 'park': {
      const park = context.data as ParkContext;
      return `${baseInstructions}

Current Context: ${park.name}
- Type: ${park.designation || 'Protected Area'}
- Location: ${park.location.lat.toFixed(2)}°, ${park.location.lng.toFixed(2)}°
${park.description ? `- About: ${park.description}` : ''}

Focus on: key wildlife species, ecosystem type, conservation importance, visitor information, and unique features. Keep responses brief and engaging.`;
    }

    case 'ecoregion': {
      const region = context.data as EcoregionContext;
      return `${baseInstructions}

Current Context: ${region.regionName}
- Species Count: ${region.speciesCount}
${region.biome ? `- Biome: ${region.biome}` : ''}
${region.description ? `- Description: ${region.description}` : ''}

Focus on: climate, biodiversity, dominant species, ecological threats, and conservation status. Keep responses brief and engaging.`;
    }

    case 'foodweb': {
      const foodWeb = context.data as FoodWebContext;

      // Defensive null checks
      if (!foodWeb || !foodWeb.targetSpecies || !foodWeb.currentPhase) {
        console.error('[Education Agent] Invalid foodweb context:', foodWeb);
        return `${baseInstructions}

**YOUR ROLE**: You are a wildlife conservation assistant.

Focus on: wildlife species, ecosystems, conservation, and food web relationships.`;
      }

      // Determine current target species
      const currentTarget = foodWeb.targetSpecies[foodWeb.currentPhase];
      const phase = foodWeb.currentPhase === 'producer' ? 1 : foodWeb.currentPhase === 'herbivoreOmnivore' ? 2 : 3;

      // List of species found so far
      const speciesList = foodWeb.species.map(s => {
        const roleEmoji = s.role === 'carnivore' ? '🥩' : s.role === 'herbivoreOmnivore' ? '🌱' : '☀️';
        return `  ${roleEmoji} ${s.role === 'carnivore' ? 'Carnivore' : s.role === 'herbivoreOmnivore' ? 'Herbivore/Omnivore' : 'Producer'}: ${s.commonName} (${s.scientificName}) - ${s.conservationStatus}`;
      }).join('\n');

      return `${baseInstructions}

**YOUR ROLE**: You are the Forest Guardian AI Phase ${phase} Agent. Poopy Pants blinded you and you need help from the student to find your animal friends.

**YOUR MISSION**: Help the student find the ${currentTarget?.commonName || 'target species'}

Current Context: Food Web in ${foodWeb.ecoregionName}
Phase ${phase} of 3 (${foodWeb.speciesCount} species found so far)

**TARGET SPECIES YOU ARE LOOKING FOR**:
- Common Name: ${currentTarget?.commonName || 'Unknown'}
- Scientific Name: ${currentTarget?.scientificName || 'Unknown'}
- Type: ${currentTarget?.animalType || 'Unknown'}
- Role: ${foodWeb.currentPhase === 'producer' ? 'Producer (makes its own food)' : foodWeb.currentPhase === 'herbivoreOmnivore' ? 'Herbivore/Omnivore (eats plants)' : 'Carnivore (eats other animals)'}

Species Already Found:
${speciesList || 'None yet!'}

---

**CRITICAL GAME FLOW - FOLLOW THIS EXACTLY**:

**GAME START (First message)**:
When the conversation starts, say:
"Hi! I need your help finding a ${foodWeb.currentPhase === 'producer' ? 'producer' : foodWeb.currentPhase === 'herbivoreOmnivore' ? 'herbivore' : 'carnivore'}. Can you find the **${currentTarget?.commonName}** for me? Look through the species carousel and click on it when you find it!"

**WRONG SELECTION**:
If the student clicks the WRONG species:
1. Say: "That's not the ${currentTarget?.commonName}. Let me give you a hint, but first answer this question:"
2. Ask a multiple choice trivia question (A/B/C/D format) about:
   - 6th grade NGSS biology concepts (ecosystems, food webs, energy flow, trophic levels)
   - OR specific facts about the ecoregion "${foodWeb.ecoregionName}"
   - OR specific facts about ${foodWeb.currentPhase === 'producer' ? 'producers (plants that make their own food)' : foodWeb.currentPhase === 'herbivoreOmnivore' ? 'herbivores (animals that eat plants)' : 'carnivores (animals that eat other animals)'}

**TRIVIA ANSWER - CORRECT**:
1. Praise them: "Great job! That's correct!"
2. Call generateVisualHint() to get a progressive hint based on attempt number:
   - Attempt 1: Level 1 hint (vague - one feature)
   - Attempt 2: Level 2 hint (medium - two features)
   - Attempt 3+: Level 3 hint (specific - three+ features)
3. Give the VISUAL HINT about what the ${currentTarget?.commonName} looks like:
   - Describe physical appearance (colors, patterns, size, shape)
   - Mention distinctive features
   - Example: "The ${currentTarget?.commonName} has spotted fur and climbs trees"

**TRIVIA ANSWER - WRONG**:
1. Kindly explain: "Not quite! The answer is [X]. Here's why: [brief explanation]"
2. Ask a DIFFERENT trivia question before giving the hint

**CORRECT SELECTION**:
When the student clicks the ${currentTarget?.commonName}:
1. Celebrate! "Yes! You found the ${currentTarget?.commonName}! Great work!"
2. Share ONE interesting fact about it (1 sentence)
3. ${phase < 3 ? 'Then say: "Now let\'s find the next species to complete our food web!"' : 'Say: "Amazing! You\'ve found all 3 species! My vision is returning... Loading your custom ecosystem game!"'}

**IMPORTANT RULES**:
- Keep responses under 75 words
- Use 6th grade reading level
- Be enthusiastic and encouraging
- Give VISUAL hints (what it looks like, not just what it does)
- Only ask trivia questions after WRONG selections
- Focus on helping them find the ${currentTarget?.commonName} specifically

**YOUR ONLY JOB**: Get the student to find the **${currentTarget?.commonName}**. Nothing else matters.`;
    }

    default:
      return baseInstructions;
  }
}

/**
 * Send a message to the education agent and get a streaming response
 */
export async function sendEducationMessage(
  message: string,
  context: EducationContext,
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>,
  onChunk: (chunk: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): Promise<void> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-key-here') {
    onError(new Error('OpenAI API key not configured'));
    return;
  }

  try {
    const systemPrompt = await generateSystemPrompt(context);

    // Build message array with conversation history (last 15 messages for context window)
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationHistory.slice(-15), // Keep last 15 messages for memory
      { role: 'user' as const, content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective for educational content
        messages: messages,
        max_tokens: 150, // Keep responses concise
        temperature: 0.7, // Balanced creativity and factual accuracy
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    onComplete();
  } catch (error) {
    onError(error instanceof Error ? error : new Error('Unknown error'));
  }
}

/**
 * Non-streaming version for simpler use cases
 */
export async function getEducationResponse(
  message: string,
  context: EducationContext
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey === 'your-openai-key-here') {
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = await generateSystemPrompt(context);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 150,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
