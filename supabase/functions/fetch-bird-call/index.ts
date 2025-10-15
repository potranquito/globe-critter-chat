import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const XENO_CANTO_API_KEY = Deno.env.get('XENO_CANTO_API_KEY') ?? '';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scientificName } = await req.json();

    if (!scientificName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Scientific name is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching bird call for: ${scientificName}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cachedCall, error: cacheError } = await supabase
      .rpc('get_bird_call', { p_scientific_name: scientificName });

    if (!cacheError && cachedCall && cachedCall.length > 0) {
      console.log(`Cache hit for ${scientificName}`);

      // Increment playback count
      await supabase.rpc('increment_bird_call_playback', {
        p_xc_id: cachedCall[0].xc_id
      });

      return new Response(JSON.stringify({
        success: true,
        cached: true,
        call: {
          audioUrl: cachedCall[0].audio_url,
          xcId: cachedCall[0].xc_id,
          quality: cachedCall[0].quality,
          recordist: cachedCall[0].recordist,
          lengthSeconds: cachedCall[0].length_seconds
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Not in cache - fetch from Xeno-Canto API
    console.log(`Cache miss - fetching from Xeno-Canto for ${scientificName}`);

    // Try scientific name first, then fall back to common name if no results
    // API v3 requires separate gen: and sp: tags for scientific names
    const nameParts = scientificName.trim().split(/\s+/);
    let query: string;

    // Check if it looks like a scientific name (capitalized first word, exactly 2-3 words)
    const looksLikeScientificName = nameParts.length === 2 && /^[A-Z]/.test(nameParts[0]);

    if (looksLikeScientificName) {
      // Looks like "Genus species" - use gen: and sp: tags
      // No quality filter in API (will filter for A/B client-side)
      query = `gen:${nameParts[0]} sp:${nameParts[1]}`;
      console.log(`Trying scientific name: gen:${nameParts[0]} sp:${nameParts[1]}`);
    } else {
      // Doesn't look like scientific name - skip directly to common name search
      console.log(`"${scientificName}" doesn't look like a scientific name, skipping to common name search`);
      query = ''; // Will trigger fallback immediately
    }

    let xenoCantoUrl = query ? `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(query)}&key=${XENO_CANTO_API_KEY}` : '';

    let xenoResponse = xenoCantoUrl ? await fetch(xenoCantoUrl) : null;
    let xenoData: any = { numRecordings: 0, recordings: [] };

    if (xenoResponse) {
      if (!xenoResponse.ok) {
        throw new Error(`Xeno-Canto API error: ${xenoResponse.status}`);
      }

      xenoData = await xenoResponse.json();
      console.log(`Found ${xenoData.numRecordings} recordings for ${scientificName} (scientific name search)`);

      // Filter for A or B quality client-side (API v3 doesn't support comma-separated quality)
      if (xenoData.recordings && xenoData.recordings.length > 0) {
        xenoData.recordings = xenoData.recordings.filter((r: any) => r.q === 'A' || r.q === 'B');
        console.log(`  -> ${xenoData.recordings.length} A/B quality recordings after filtering`);
      }
    } else {
      console.log(`Skipped scientific name search, going directly to common name`);
    }

    // If no results with scientific name, try common name search
    // This handles cases where database has common names in scientific_name field
    if (xenoData.numRecordings === 0 || !xenoData.recordings || xenoData.recordings.length === 0) {
      console.log(`No results with scientific name, trying common name search...`);

      // Search by English name - API v3 requires separate en: tags for each word
      // Convert "African grey parrot" -> "en:african en:grey en:parrot"
      // Don't add quality/length filters here - will filter client-side
      const nameWords = scientificName.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      query = nameWords.map(w => `en:${w}`).join(' ');
      xenoCantoUrl = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(query)}&key=${XENO_CANTO_API_KEY}`;

      console.log(`Trying common name search: ${query}`);

      xenoResponse = await fetch(xenoCantoUrl);

      if (!xenoResponse.ok) {
        throw new Error(`Xeno-Canto API error: ${xenoResponse.status}`);
      }

      xenoData = await xenoResponse.json();
      console.log(`  -> Found ${xenoData.numRecordings} total recordings by common name`);

      // If still no results, try variations (remove geographic prefixes/suffixes)
      if (xenoData.numRecordings === 0) {
        const variations = [
          scientificName.replace(/^(African|American|European|Asian|Northern|Southern|Eastern|Western)\s+/i, ''),
          scientificName.replace(/\s+(parrot|warbler|sparrow|finch|thrush|dove|crow|hawk|eagle|owl|kingfisher|heron)$/i, ''),
        ].filter(v => v !== scientificName && v.length > 2);

        for (const variation of variations) {
          console.log(`  Trying variation: "${variation}"`);
          const varWords = variation.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          query = varWords.map(w => `en:${w}`).join(' ');
          xenoCantoUrl = `https://xeno-canto.org/api/3/recordings?query=${encodeURIComponent(query)}&key=${XENO_CANTO_API_KEY}`;

          xenoResponse = await fetch(xenoCantoUrl);
          if (xenoResponse.ok) {
            const varData = await xenoResponse.json();
            if (varData.numRecordings > 0) {
              console.log(`  -> Found ${varData.numRecordings} recordings with variation`);
              xenoData = varData;
              break;
            }
          }
        }
      }

      // Filter for quality client-side (accept any length)
      if (xenoData.recordings && xenoData.recordings.length > 0) {
        xenoData.recordings = xenoData.recordings.filter((r: any) => {
          return r.q === 'A' || r.q === 'B';
        });
        console.log(`  -> ${xenoData.recordings.length} A/B-quality recordings (any length)`);
      }
    }

    if (!xenoData.recordings || xenoData.recordings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        cached: false,
        call: null,
        message: 'No recordings found for this species'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get species ID for caching
    const { data: speciesData } = await supabase
      .from('species')
      .select('id')
      .ilike('scientific_name', scientificName)
      .limit(1)
      .single();

    // Sort recordings by quality and length, pick the best ones
    const sortedRecordings = xenoData.recordings
      .filter((r: any) => r.file && r.type && (r.type.includes('song') || r.type.includes('call')))
      .sort((a: any, b: any) => {
        // First by quality (A > B > C)
        const qualityOrder: any = { 'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4 };
        const qualityDiff = (qualityOrder[a.q] || 99) - (qualityOrder[b.q] || 99);
        if (qualityDiff !== 0) return qualityDiff;

        // Then prefer songs over calls
        if (a.type.includes('song') && !b.type.includes('song')) return -1;
        if (!a.type.includes('song') && b.type.includes('song')) return 1;

        // Then prefer shorter recordings (but still accept long ones)
        const lengthA = parseFloat(a.length) || 999;
        const lengthB = parseFloat(b.length) || 999;
        return lengthA - lengthB;
      })
      .slice(0, 3); // Keep top 3

    if (sortedRecordings.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        cached: false,
        call: null,
        message: 'No suitable recordings found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Cache the recordings
    const recordingsToCache = sortedRecordings.map((recording: any, index: number) => {
      // Fix URL - Xeno-Canto returns URLs like "//xeno-canto.org/..." or "https://..."
      let audioUrl = recording.file;
      if (audioUrl.startsWith('//')) {
        audioUrl = `https:${audioUrl}`;
      } else if (!audioUrl.startsWith('http')) {
        audioUrl = `https://${audioUrl}`;
      }

      return {
        species_id: speciesData?.id || null,
        scientific_name: scientificName,
        xc_id: recording.id,
        audio_url: audioUrl,
        quality: recording.q,
        recording_type: recording.type,
        length_seconds: parseFloat(recording.length) || null,
        recordist: recording.rec,
        country: recording.cnt,
        location: recording.loc,
        date: recording.date,
        is_primary: index === 0 // First one is primary
      };
    });

    const { error: insertError } = await supabase
      .from('bird_calls')
      .upsert(recordingsToCache, {
        onConflict: 'species_id,xc_id',
        ignoreDuplicates: false
      });

    if (insertError) {
      console.error('Error caching bird calls:', insertError);
    } else {
      console.log(`Cached ${recordingsToCache.length} recordings for ${scientificName}`);
    }

    // Return the primary (best) recording
    const primaryRecording = sortedRecordings[0];

    // Fix URL - Xeno-Canto returns URLs like "//xeno-canto.org/..." or "https://..."
    let audioUrl = primaryRecording.file;
    if (audioUrl.startsWith('//')) {
      audioUrl = `https:${audioUrl}`;
    } else if (!audioUrl.startsWith('http')) {
      audioUrl = `https://${audioUrl}`;
    }

    return new Response(JSON.stringify({
      success: true,
      cached: false,
      call: {
        audioUrl: audioUrl,
        xcId: primaryRecording.id,
        quality: primaryRecording.q,
        recordist: primaryRecording.rec,
        lengthSeconds: parseFloat(primaryRecording.length) || null,
        country: primaryRecording.cnt,
        location: primaryRecording.loc
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fetch-bird-call:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
