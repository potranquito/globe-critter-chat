// Trivia Question Agent - Generates educational multiple choice questions
// Uses OpenAI to create contextual, grade-appropriate questions

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export interface TriviaQuestion {
  question: string;
  choices: string[]; // Array of 4 choices: ["A: ...", "B: ...", "C: ...", "D: ..."]
  correctAnswer: number; // Index 0-3
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TriviaGenerationContext {
  targetSpecies: {
    commonName: string;
    scientificName: string;
    animalType: string;
    role: 'producer' | 'herbivoreOmnivore' | 'carnivore';
  };
  ecoregionName: string;
  gradeLevel?: number; // Default: 5
  difficulty?: 'easy' | 'medium' | 'hard'; // Default: medium
}

/**
 * Generate educational trivia question using OpenAI
 *
 * Question Focus:
 * - 75% General biology / school science (food webs, energy transfer, roles)
 * - 25% Ecoregion-specific (biodiversity, conservation, habitat)
 */
export async function generateTriviaQuestion(
  context: TriviaGenerationContext
): Promise<TriviaQuestion> {
  const {
    targetSpecies,
    ecoregionName,
    gradeLevel = 5,
    difficulty = 'medium'
  } = context;

  const roleDescription = getRoleDescription(targetSpecies.role);

  const systemPrompt = `You are an educational science tutor creating DIVERSE and VARIED quiz questions for ${gradeLevel}th grade students.

Standards: NGSS 5-LS2-1 and broader biology/science topics

CRITICAL INSTRUCTION: Generate UNIQUE questions - DO NOT repeat the same topics or patterns!

Requirements:
- Difficulty: ${difficulty}
- Grade level: ${gradeLevel}
- MUST be multiple choice with EXACTLY 4 answer choices (A, B, C, D) - no more, no less
- ONE correct answer
- Brief explanation (1-2 sentences maximum)
- Age-appropriate language
- BE CREATIVE - vary the topics, angles, and question types

CRITICAL: Every question MUST be multiple choice with exactly 4 options.

Return ONLY valid JSON (no markdown, no extra text):
{
  "question": "...",
  "choices": ["A: ...", "B: ...", "C: ...", "D: ..."],
  "correctAnswer": 0,
  "explanation": "...",
  "difficulty": "medium"
}`;

  const userPrompt = `Generate a ${difficulty} difficulty question for ${gradeLevel}th graders.

Context (optional - use if relevant):
- Ecoregion: ${ecoregionName}
- Target species: ${targetSpecies.commonName} (${targetSpecies.scientificName})
- Role: ${roleDescription}
- Type: ${targetSpecies.animalType}

TOPIC IDEAS (pick ONE randomly - be very creative and diverse):

**Biology & Life Science:**
- Animal behavior and communication
- Plant structures and functions
- Cell biology basics
- Genetics and inherited traits
- Evolution and natural selection
- Symbiotic relationships (mutualism, parasitism, commensalism)
- Migration patterns
- Camouflage and mimicry
- Ecosystems and biomes
- Water cycle and its importance to life

**Earth & Environmental Science:**
- Climate and weather patterns
- Soil formation and types
- Rock cycle
- Erosion and weathering
- Renewable vs non-renewable resources
- Pollution and its effects
- Climate change basics
- Deforestation impacts

**General Science Concepts:**
- Scientific method steps
- Classification of living things
- States of matter
- Properties of materials
- Simple machines in nature
- Observations vs inferences

CRITICAL RULES:
- MUST be completely different from any food web question about producers/consumers/decomposers
- Can be completely general science - doesn't need to reference the species at all
- Be highly creative and unpredictable
- Vary question structure and format
- Pick RANDOMLY from many diverse topics - don't default to the same topic!

TOPIC VARIETY EXAMPLES (pick ONE randomly):
- Animal behavior (migration, hibernation, communication)
- Physical adaptations (camouflage, body structures, defenses)
- Habitats and biomes (rainforest vs desert, aquatic vs terrestrial)
- Weather and climate (rain cycle, seasons, temperature)
- Rocks and minerals (types, formation, erosion)
- States of matter (solid, liquid, gas)
- Classification (mammals vs reptiles, vertebrates vs invertebrates)
- Life cycles (metamorphosis, growth stages)
- Symbiotic relationships (mutualism, parasitism)
- Conservation (endangered species, habitat loss)
- Senses (how animals see, hear, smell)
- Plant structures (roots, stems, leaves - NOT just photosynthesis)
- Photosynthesis (yes, this is ONE option, but not the default!)

Request ID: ${Date.now()}-${Math.random()}

Generate a completely unique and creative question now. Pick a RANDOM topic from the list above!`;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 1.2, // High temperature for maximum variety
        max_tokens: 300,
        response_format: { type: 'json_object' },
        top_p: 0.95, // Nucleus sampling for more diversity
        frequency_penalty: 1.5, // Strong penalty against repeating topics
        presence_penalty: 1.0 // Penalty for reusing same concepts
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('[Trivia Agent] Generated question:', content);

    const question = JSON.parse(content);

    // Validate structure - MUST be multiple choice with exactly 4 options
    if (!question.question || !question.choices || question.choices.length !== 4) {
      console.error('[Trivia Agent] Invalid question - must have exactly 4 choices, got:', question.choices?.length);
      throw new Error('Invalid question format from OpenAI - must have exactly 4 choices');
    }

    // Validate correctAnswer is in range 0-3
    if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
      console.error('[Trivia Agent] Invalid correctAnswer index:', question.correctAnswer);
      throw new Error('Invalid correctAnswer - must be 0, 1, 2, or 3');
    }

    return question;

  } catch (error) {
    console.error('[Trivia Agent] Failed to generate question:', error);

    // Fallback question
    return generateFallbackQuestion(context);
  }
}

/**
 * Fallback question if OpenAI fails
 */
function generateFallbackQuestion(context: TriviaGenerationContext): TriviaQuestion {
  const { targetSpecies } = context;

  if (targetSpecies.role === 'producer') {
    return {
      question: "What role do producers play in a food web?",
      choices: [
        "A: They hunt other animals for food",
        "B: They make their own food through photosynthesis",
        "C: They eat both plants and animals",
        "D: They break down dead organisms"
      ],
      correctAnswer: 1,
      explanation: "Producers make their own food through photosynthesis, converting sunlight into energy that flows through the food web.",
      difficulty: 'medium'
    };
  }

  if (targetSpecies.role === 'herbivoreOmnivore') {
    return {
      question: "What do herbivores eat in a food web?",
      choices: [
        "A: Only other animals",
        "B: Only plants and producers",
        "C: Both plants and animals",
        "D: Dead and decaying matter"
      ],
      correctAnswer: 1,
      explanation: "Herbivores are consumers that eat plants and producers. They transfer energy from producers to higher levels of the food web.",
      difficulty: 'medium'
    };
  }

  // Carnivore fallback
  return {
    question: "What is the role of a carnivore in a food web?",
    choices: [
      "A: To make food from sunlight",
      "B: To eat only plants",
      "C: To hunt and eat other animals",
      "D: To break down dead organisms"
    ],
    correctAnswer: 2,
    explanation: "Carnivores are predators that hunt and eat other animals. They help control populations and transfer energy through the food web.",
    difficulty: 'medium'
  };
}

/**
 * Get human-readable role description
 */
function getRoleDescription(role: 'producer' | 'herbivoreOmnivore' | 'carnivore'): string {
  switch (role) {
    case 'producer':
      return 'Producer (makes own food through photosynthesis)';
    case 'herbivoreOmnivore':
      return 'Herbivore/Omnivore (eats plants or both plants and animals)';
    case 'carnivore':
      return 'Carnivore (hunts and eats other animals)';
  }
}

/**
 * Generate brief species info for wrong selections
 * Format: Name, conservation status, fast fact, ID tip
 */
export function generateBriefSpeciesInfo(
  species: any,
  targetSpecies: { commonName: string }
): string {
  const statusLabels: Record<string, string> = {
    'CR': 'critically endangered',
    'EN': 'endangered',
    'VU': 'vulnerable',
    'NT': 'near threatened',
    'LC': 'least concern',
    'DD': 'data deficient',
    'NE': 'not evaluated'
  };

  const status = statusLabels[species.conservationStatus] || species.conservationStatus?.toLowerCase() || '';
  const statusText = status ? `${status} ` : '';

  return `You selected a ${statusText}**${species.commonName}**. We are looking for a **${targetSpecies.commonName}** though. You need to answer a question now to get a hint and continue.`;
}

/**
 * Generate a fast fact about the species
 */
function generateFastFact(species: any): string {
  const type = species.speciesType?.toLowerCase() || species.animalType?.toLowerCase() || '';

  if (type.includes('mammal')) {
    return 'This mammal plays an important role in its ecosystem.';
  }
  if (type.includes('bird')) {
    return 'Birds help disperse seeds and control insect populations.';
  }
  if (type.includes('fish')) {
    return 'Fish are crucial for aquatic food webs.';
  }
  if (type.includes('reptile')) {
    return 'Reptiles are cold-blooded and regulate their body temperature externally.';
  }
  if (type.includes('amphibian')) {
    return 'Amphibians live both in water and on land during their life cycle.';
  }
  if (type.includes('plant')) {
    return 'Plants are producers that make their own food through photosynthesis.';
  }

  return 'This species is an important part of the food web.';
}

/**
 * Generate identification tip
 */
function generateIDTip(species: any): string {
  const type = species.speciesType?.toLowerCase() || species.animalType?.toLowerCase() || '';
  const dietary = species.dietaryCategory?.toLowerCase() || '';

  if (dietary === 'producer' || type.includes('plant')) {
    return 'Look for plant species in the carousel - they are producers.';
  }
  if (dietary === 'carnivore') {
    return 'Carnivores are predators that hunt other animals.';
  }
  if (dietary === 'herbivore') {
    return 'Herbivores eat plants and vegetation.';
  }
  if (dietary === 'omnivore') {
    return 'Omnivores eat both plants and animals.';
  }

  return `This is a ${species.animalType || 'species'}.`;
}

/**
 * Generate Hint Level 1 using OpenAI knowledge base
 * Describes physical appearance without revealing the name
 */
export async function generateHintLevel1WithLLM(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string
): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert field biologist who helps students identify species by describing ONLY their visual physical appearance.'
          },
          {
            role: 'user',
            content: `Describe ONLY the physical visual appearance of ${targetSpecies.scientificName}.

REQUIRED - Include ONLY these physical details:
- Colors and color patterns
- Size and shape
- Distinctive visual features (texture, form, structure)
- For plants: leaf shape, bark texture, flower appearance

STRICTLY FORBIDDEN - Do NOT mention:
- Habitat or location
- Ecological role or importance
- Economic uses or human interaction
- Behavior or life cycle
- Conservation status
- The species name (common or scientific)

Maximum 50 words. Be specific and visual.

Format as: "🔍 **Hint 1/3 (Expert knowledge):** [your pure visual description]"`
          }
        ],
        temperature: 0.7,
        max_tokens: 120
      })
    });

    if (!response.ok) {
      console.error('[Hint Level 1] OpenAI API error:', response.status);
      // Fallback to simple hint
      const roleDesc = targetSpecies.role === 'producer' ? 'producer'
        : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore or omnivore'
        : 'carnivore';
      return `🔍 **Hint 1/3:** You're looking for a ${roleDesc}. This species is a ${targetSpecies.animalType} found in ${ecoregionName}.`;
    }

    const data = await response.json();
    const hint = data.choices[0].message.content;

    console.log('[Hint Level 1] Generated hint with LLM:', hint);
    return hint;

  } catch (error) {
    console.error('[Hint Level 1] Error:', error);
    // Fallback to simple hint
    const roleDesc = targetSpecies.role === 'producer' ? 'producer'
      : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore or omnivore'
      : 'carnivore';
    return `🔍 **Hint 1/3:** You're looking for a ${roleDesc}. This species is a ${targetSpecies.animalType} found in ${ecoregionName}.`;
  }
}

/**
 * DEPRECATED: Simple hint generator (kept for backward compatibility)
 * Use generateHintLevel1WithLLM, generateHintLevel2WithWebSearch, or generateHintLevel3WithVision instead
 */
export function generateHint(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string,
  hintLevel: number
): string {
  const roleDesc = targetSpecies.role === 'producer' ? 'producer'
    : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore or omnivore'
    : 'carnivore';

  switch (hintLevel) {
    case 1:
      return `🔍 **Hint 1/3:** You're looking for a ${roleDesc}. This species is a ${targetSpecies.animalType} found in the ${ecoregionName}.`;

    case 2:
      return `🔍 **Hint 2/3:** The species is called the **${targetSpecies.commonName}**. Look through the carousel carefully!`;

    case 3:
      return `🔍 **Hint 3/3:** Look for **"${targetSpecies.commonName}"** (scientific name: *${targetSpecies.scientificName}*). It's a ${targetSpecies.animalType} species in the carousel.`;

    default:
      return '❌ No more hints available. Keep searching!';
  }
}

/**
 * Generate Hint Level 2 using OpenAI with enhanced knowledge
 * Provides detailed physical description as if gathered from web sources
 */
export async function generateHintLevel2WithWebSearch(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string
): Promise<string> {
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a field guide expert providing detailed species identification hints based on comprehensive biological knowledge. You help students identify species by describing them in rich detail WITHOUT revealing their names.`
          },
          {
            role: 'user',
            content: `I need help identifying a ${targetSpecies.animalType} from ${ecoregionName}. The scientific name is ${targetSpecies.scientificName}.

Provide a detailed identification hint as if you've gathered information from multiple field guides and species databases. Include:
- Detailed physical characteristics (size, color, texture, patterns)
- Distinctive morphological features that help distinguish it from similar species
- Habitat preferences and where it's typically found
- Any notable behavioral traits or ecological role

CRITICAL RULES:
- DO NOT mention "${targetSpecies.commonName}" or any common names
- DO NOT mention the scientific name "${targetSpecies.scientificName}"
- Refer to it only as "this species" or "this ${targetSpecies.animalType}"
- Be specific and descriptive (3-4 sentences)
- Focus on VISUAL identification features that would appear in photos/carousel

Format as: "🔍 **Hint 2/3 (Detailed description):** [your detailed identification hint]"

Example good hint: "This species features large, pinnate leaves up to 5 meters long with a distinctive glossy dark green texture. The trunk is tall and fibrous, reaching heights of 15-20 meters. It typically grows in swampy lowland areas and produces creamy yellow flower clusters."

Example bad hint: "This is an Okoumé tree" or "Look for the Raffia palm"`
          }
        ],
        temperature: 0.8,
        max_tokens: 250
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Hint Level 2] OpenAI API error:', response.status, errorText);
      // Fallback to basic descriptive hint
      const roleDesc = targetSpecies.role === 'producer' ? 'producer plant'
        : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore or omnivore'
        : 'carnivore';
      return `🔍 **Hint 2/3:** Look for a ${roleDesc} in the ${ecoregionName}. This ${targetSpecies.animalType} has distinctive features that set it apart from similar species in the region.`;
    }

    const data = await response.json();
    const hint = data.choices[0].message.content;

    console.log('[Hint Level 2] Generated detailed hint:', hint);
    return hint;

  } catch (error) {
    console.error('[Hint Level 2] Error:', error);
    // Fallback to basic descriptive hint
    const roleDesc = targetSpecies.role === 'producer' ? 'producer plant'
      : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore or omnivore'
      : 'carnivore';
    return `🔍 **Hint 2/3:** Look for a ${roleDesc} in the ${ecoregionName}. This ${targetSpecies.animalType} has distinctive features that set it apart from similar species in the region.`;
  }
}

/**
 * Generate Hint Level 3 using OpenAI Vision API
 * Analyzes the species image and provides a visual description
 */
export async function generateHintLevel3WithVision(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; imageUrl: string },
  ecoregionName: string
): Promise<string> {
  try {
    if (!targetSpecies.imageUrl) {
      console.error('[Hint Level 3] No image URL available');
      return `🔍 **Hint 3/3:** Look for **"${targetSpecies.commonName}"** (scientific name: *${targetSpecies.scientificName}*) in the carousel.`;
    }

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a wildlife educator helping students identify species by analyzing images. Provide clear, helpful visual descriptions.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this image of a ${targetSpecies.animalType} from the ${ecoregionName}.

Describe what you see in the image to help a student identify this species in a carousel. Focus on:
- Colors and patterns visible in the image
- Shape and body structure
- Any distinctive visual features

Keep the hint specific to THIS IMAGE (2-3 sentences) and format as: "🔍 **Hint 3/3 (image analysis):** [your visual description]"

Do NOT mention the species name.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: targetSpecies.imageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      console.error('[Hint Level 3] OpenAI Vision API error:', response.status);
      // Fallback to simple hint
      return `🔍 **Hint 3/3:** Look for **"${targetSpecies.commonName}"** (scientific name: *${targetSpecies.scientificName}*) in the carousel.`;
    }

    const data = await response.json();
    const hint = data.choices[0].message.content;

    console.log('[Hint Level 3] Generated hint with vision:', hint);
    return hint;

  } catch (error) {
    console.error('[Hint Level 3] Error:', error);
    // Fallback to simple hint
    return `🔍 **Hint 3/3:** Look for **"${targetSpecies.commonName}"** (scientific name: *${targetSpecies.scientificName}*) in the carousel.`;
  }
}
