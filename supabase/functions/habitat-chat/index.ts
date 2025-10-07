import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, habitat } = await req.json();
    console.log('Habitat chat request:', { message, habitatName: habitat?.name });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context from habitat data
    let contextInfo = '';
    if (habitat) {
      contextInfo = `
Current Habitat: ${habitat.name}
Climate: ${habitat.climate}
Area: ${habitat.area.toLocaleString()} km²
Characteristics: ${habitat.characteristics.join(', ')}
`;

      if (habitat.protectedAreas && habitat.protectedAreas.length > 0) {
        contextInfo += `\nProtected Areas (${habitat.protectedAreas.length}):\n`;
        habitat.protectedAreas.slice(0, 5).forEach((area: any) => {
          contextInfo += `- ${area.name} (${area.type}, ${area.area.toLocaleString()} km²)\n`;
        });
      }

      if (habitat.threats && habitat.threats.length > 0) {
        contextInfo += `\nActive Threats (${habitat.threats.length}):\n`;
        habitat.threats.slice(0, 5).forEach((threat: any) => {
          contextInfo += `- ${threat.title} (${threat.impact} impact, ${threat.type})\n`;
        });
      }

      if (habitat.keySpecies && habitat.keySpecies.length > 0) {
        contextInfo += `\nKey Species (${habitat.keySpecies.length}):\n`;
        habitat.keySpecies.slice(0, 5).forEach((species: any) => {
          contextInfo += `- ${species.name} (${species.scientificName}) - ${species.conservationStatus}\n`;
        });
      }
    }

    // Use Lovable AI (Gemini 2.5 Flash) for habitat Q&A
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a habitat and conservation expert. Answer questions about habitats, ecosystems, and conservation with clear, engaging, and scientifically accurate information. Focus on biodiversity, threats, protected areas, and ecological importance. Keep responses concise (2-3 paragraphs) but informative.

${contextInfo ? `Context about the current habitat:\n${contextInfo}` : ''}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('Habitat chat response generated');

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habitat-chat:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
