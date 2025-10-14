import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WikimediaImageResponse {
  imageUrl?: string;
  attribution?: string;
  license?: string;
  source: string;
  error?: string;
}

/**
 * Fetch image from Wikimedia Commons
 *
 * API SOURCES (all public, NO API keys required):
 * 1. Wikimedia Commons API - https://commons.wikimedia.org/w/api.php
 * 2. Wikipedia API - https://en.wikipedia.org/w/api.php
 * 3. Wikidata API - https://www.wikidata.org/w/api.php
 * 4. iNaturalist API - https://api.inaturalist.org/v1
 *
 * All APIs are public and free to use with reasonable rate limits.
 * No API keys needed!
 *
 * First tries to find images via Wikimedia Commons API
 * Falls back to Wikipedia page images if no Commons images found
 * Final fallback to iNaturalist for biodiversity data
 */
async function fetchWikimediaImage(searchTerm: string, preferredSize = 800): Promise<WikimediaImageResponse> {
  try {
    // Step 1: Try Wikimedia Commons search
    const commonsSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&origin=*`;

    const commonsResponse = await fetch(commonsSearchUrl);
    const commonsData = await commonsResponse.json();

    if (commonsData.query?.search?.length > 0) {
      // Get the first result's page title
      const pageTitle = commonsData.query.search[0].title;

      // Fetch image info
      const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=${preferredSize}&format=json&origin=*`;

      const imageInfoResponse = await fetch(imageInfoUrl);
      const imageInfoData = await imageInfoResponse.json();

      const pages = imageInfoData.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        const imageInfo = pages[pageId]?.imageinfo?.[0];

        if (imageInfo) {
          const metadata = imageInfo.extmetadata;

          return {
            imageUrl: imageInfo.thumburl || imageInfo.url,
            attribution: metadata?.Artist?.value || metadata?.Attribution?.value || 'Wikimedia Commons',
            license: metadata?.LicenseShortName?.value || metadata?.License?.value || 'Unknown',
            source: 'wikimedia_commons'
          };
        }
      }
    }

    // Step 2: Fallback to Wikipedia page image
    const wikipediaSearchUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchTerm)}&prop=pageimages&pithumbsize=${preferredSize}&format=json&origin=*`;

    const wikiResponse = await fetch(wikipediaSearchUrl);
    const wikiData = await wikiResponse.json();

    const wikiPages = wikiData.query?.pages;
    if (wikiPages) {
      const wikiPageId = Object.keys(wikiPages)[0];
      const thumbnail = wikiPages[wikiPageId]?.thumbnail;

      if (thumbnail?.source) {
        return {
          imageUrl: thumbnail.source,
          attribution: 'Wikipedia',
          license: 'Various (see Wikipedia)',
          source: 'wikipedia'
        };
      }
    }

    // Step 3: Try iNaturalist as additional fallback
    const inatUrl = `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(searchTerm)}&per_page=1`;

    const inatResponse = await fetch(inatUrl);
    const inatData = await inatResponse.json();

    if (inatData.results?.length > 0 && inatData.results[0].default_photo) {
      const photo = inatData.results[0].default_photo;
      return {
        imageUrl: photo.medium_url || photo.url,
        attribution: photo.attribution || 'iNaturalist',
        license: photo.license_code || 'Unknown',
        source: 'inaturalist'
      };
    }

    return {
      error: 'No images found',
      source: 'none'
    };

  } catch (error) {
    console.error('Error fetching Wikimedia image:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'error'
    };
  }
}

/**
 * Fetch common name for a species from Wikipedia/Wikidata
 */
async function fetchCommonName(scientificName: string): Promise<string | null> {
  try {
    // Try Wikipedia API first
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(scientificName)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`;

    const response = await fetch(wikiUrl);
    const data = await response.json();

    const pages = data.query?.pages;
    if (pages) {
      const pageId = Object.keys(pages)[0];
      const extract = pages[pageId]?.extract;

      if (extract) {
        // Try to extract common name from first sentence
        // Pattern: "Scientific name, also known as common name" or "Scientific name is a common name"
        const patterns = [
          /also (?:known|called) as (?:the )?([A-Z][a-z]+(?:\s+[a-z]+)*)/i,
          /commonly known as (?:the )?([A-Z][a-z]+(?:\s+[a-z]+)*)/i,
          /is (?:a|an) ([A-Z][a-z]+(?:\s+[a-z]+)*)/i,
        ];

        for (const pattern of patterns) {
          const match = extract.match(pattern);
          if (match && match[1]) {
            return match[1];
          }
        }
      }
    }

    // Try Wikidata as fallback
    const wikidataSearchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(scientificName)}&language=en&format=json&origin=*`;

    const wikidataResponse = await fetch(wikidataSearchUrl);
    const wikidataData = await wikidataResponse.json();

    if (wikidataData.search?.length > 0) {
      const description = wikidataData.search[0].description;
      if (description && description.includes('species')) {
        // Extract common name from description if it's in format "species of [common name]"
        const match = description.match(/species of (.+)/i);
        if (match && match[1]) {
          return match[1];
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error fetching common name:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchTerm, type = 'species', preferredSize = 800, fetchCommonNameFlag = false } = await req.json();

    if (!searchTerm) {
      throw new Error('searchTerm is required');
    }

    console.log(`Fetching image for: ${searchTerm} (type: ${type})`);

    // Fetch image
    const imageResult = await fetchWikimediaImage(searchTerm, preferredSize);

    // Optionally fetch common name (for species)
    let commonName = null;
    if (fetchCommonNameFlag && type === 'species') {
      commonName = await fetchCommonName(searchTerm);
      console.log(`Common name for ${searchTerm}: ${commonName || 'not found'}`);
    }

    return new Response(JSON.stringify({
      success: !imageResult.error,
      searchTerm,
      imageUrl: imageResult.imageUrl,
      attribution: imageResult.attribution,
      license: imageResult.license,
      source: imageResult.source,
      commonName: commonName,
      error: imageResult.error
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in wikimedia-image-fetch:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
