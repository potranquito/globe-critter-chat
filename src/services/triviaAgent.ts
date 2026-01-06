// Trivia Question Agent - Generates educational multiple choice questions
// Uses LOCAL LOGIC to create contextual, grade-appropriate questions (Offline/Mock Mode)

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
 * Generate educational trivia question (Mock/Offline Version)
 */
export async function generateTriviaQuestion(
  context: TriviaGenerationContext
): Promise<TriviaQuestion> {
  // Simulate API delay for realism
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return generateFallbackQuestion(context);
}

/**
 * Robust Fallback Question Generator
 * Creates varied questions based on species data without needing AI
 */
function generateFallbackQuestion(context: TriviaGenerationContext): TriviaQuestion {
  const { targetSpecies, ecoregionName } = context;
  const templates = [];

  // 1. Role-based questions
  if (targetSpecies.role === 'producer') {
    templates.push({
      question: `How does the ${targetSpecies.commonName} obtain its energy?`,
      choices: [
        "A: By hunting smaller animals",
        "B: From sunlight through photosynthesis",
        "C: By decomposing dead matter",
        "D: From drinking ocean water"
      ],
      correctAnswer: 1,
      explanation: "As a producer, it converts sunlight into energy using photosynthesis."
    });
    templates.push({
      question: `What is the role of the ${targetSpecies.commonName} in its ecosystem?`,
      choices: [
        "A: Top predator",
        "B: Primary consumer",
        "C: Producer (base of food web)",
        "D: Scavenger"
      ],
      correctAnswer: 2,
      explanation: "Producers like this plant form the foundation of the food web."
    });
  } else if (targetSpecies.role === 'herbivoreOmnivore') {
    templates.push({
      question: `What does the ${targetSpecies.commonName} mainly eat?`,
      choices: [
        "A: Only meat",
        "B: Plants and vegetation",
        "C: Rocks and minerals",
        "D: Sunlight"
      ],
      correctAnswer: 1,
      explanation: "Herbivores consume plants to get their energy."
    });
  } else { // Carnivore
    templates.push({
      question: `The ${targetSpecies.commonName} is a carnivore. What does this mean?`,
      choices: [
        "A: It eats only plants",
        "B: It makes its own food",
        "C: It hunts and eats other animals",
        "D: It eats dead organisms"
      ],
      correctAnswer: 2,
      explanation: "Carnivores are predators that hunt other animals for food."
    });
  }

  // 2. Classification questions
  templates.push({
    question: `Which group does the ${targetSpecies.commonName} belong to?`,
    choices: [
      `A: ${targetSpecies.animalType || 'Mammals'}`,
      "B: Fungi",
      "C: Bacteria",
      "D: Minerals"
    ],
    correctAnswer: 0,
    explanation: `The ${targetSpecies.commonName} is classified as a ${targetSpecies.animalType || 'animal'}.`
  });

  // 3. Habitat questions
  templates.push({
    question: `Where would you most likely find a ${targetSpecies.commonName}?`,
    choices: [
      `A: In the ${ecoregionName}`,
      "B: On the moon",
      "C: Deep inside a volcano",
      "D: In a shopping mall"
    ],
    correctAnswer: 0,
    explanation: `This species is native to the ${ecoregionName} ecosystem.`
  });

  // Select a random template
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
  
  return {
    ...randomTemplate,
    difficulty: context.difficulty || 'medium'
  };
}

/**
 * Generate brief species info for wrong selections
 */
export function generateBriefSpeciesInfo(
  species: any,
  targetSpecies: { commonName: string }
): string {
  return `That's a **${species.commonName}**. Try again! We are looking for the **${targetSpecies.commonName}**.`;
}

/**
 * Generate hints (Offline/Mock Mode)
 */
export async function generateHintLevel1WithLLM(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string
): Promise<string> {
  const roleDesc = targetSpecies.role === 'producer' ? 'producer'
    : targetSpecies.role === 'herbivoreOmnivore' ? 'herbivore/omnivore'
    : 'carnivore';
  return `🔍 **Hint 1/3:** You're looking for a **${roleDesc}**. This species is a ${targetSpecies.animalType} found in ${ecoregionName}.`;
}

export async function generateHintLevel2WithWebSearch(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string
): Promise<string> {
   return `🔍 **Hint 2/3:** The species name starts with **${targetSpecies.commonName.charAt(0)}**. It plays a key role in the ${ecoregionName}.`;
}

export async function generateHintLevel3WithVision(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; imageUrl: string },
  ecoregionName: string
): Promise<string> {
  return `🔍 **Hint 3/3:** Look for **"${targetSpecies.commonName}"** (Scientific: *${targetSpecies.scientificName}*).`;
}

// Deprecated function kept for compatibility
export function generateHint(
  targetSpecies: { commonName: string; scientificName: string; animalType: string; role: string },
  ecoregionName: string,
  hintLevel: number
): string {
  return `🔍 **Hint:** Look for the ${targetSpecies.commonName}.`;
}