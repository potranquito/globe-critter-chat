/**
 * Education Agent Service
 *
 * Provides context-aware educational responses about species, parks, and ecoregions.
 * Uses OpenAI to generate concise, factual information based on the current card context.
 */

export interface EducationContext {
  type: 'species' | 'park' | 'ecoregion';
  displayName: string;
  data: SpeciesContext | ParkContext | EcoregionContext;
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

/**
 * Generate a system prompt based on the education context
 */
function generateSystemPrompt(context: EducationContext): string {
  const baseInstructions = `You are a wildlife education assistant. Provide concise, factual responses in 2-3 sentences (max 100 words). Focus on facts that are interesting and educational.`;

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
    const systemPrompt = generateSystemPrompt(context);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast and cost-effective for educational content
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
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

  const systemPrompt = generateSystemPrompt(context);

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
