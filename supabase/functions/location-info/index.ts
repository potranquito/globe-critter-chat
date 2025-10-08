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
    const { name, address, rating, types, location } = await req.json();
    console.log('Location info request:', { name, address });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context from location data
    let contextInfo = `
Location: ${name}
${address ? `Address: ${address}` : ''}
${rating ? `Rating: ${rating}/5` : ''}
${types?.length > 0 ? `Types: ${types.join(', ')}` : ''}
Coordinates: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}
`;

    // Use Lovable AI (Gemini 2.5 Flash) for location information
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
            content: `You are a wildlife and nature park expert. Provide detailed, engaging information about wildlife locations, parks, and nature preserves. Focus on:
- Wildlife species that can be found there
- Unique ecological features
- Conservation efforts and importance
- Best times to visit for wildlife viewing
- Educational value and visitor experience

Keep responses informative but concise (2-3 paragraphs).`
          },
          {
            role: 'user',
            content: `Tell me about this wildlife location:\n${contextInfo}\n\nProvide interesting facts about the wildlife, ecosystems, and conservation efforts at this location.`
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

    console.log('Location info response generated for:', name);

    return new Response(JSON.stringify({
      success: true,
      response: aiResponse
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in location-info:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
