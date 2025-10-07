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
    const { habitatName } = await req.json();
    console.log('Fetching image for habitat:', habitatName);

    // Search Wikipedia for habitat images
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(habitatName)}&limit=1&namespace=0&format=json&origin=*`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData[1] || searchData[1].length === 0) {
      console.log('No Wikipedia page found');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No Wikipedia page found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pageTitle = searchData[1][0];
    console.log('Found Wikipedia page:', pageTitle);

    // Get page image
    const detailsUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&pithumbsize=800&format=json&origin=*`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    
    const pages = detailsData.query.pages;
    const pageId = Object.keys(pages)[0];
    const imageUrl = pages[pageId]?.thumbnail?.source;

    if (!imageUrl) {
      console.log('No image found for habitat');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'No image found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Image found:', imageUrl);

    return new Response(JSON.stringify({ 
      success: true,
      imageUrl: imageUrl
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in habitat-image:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
