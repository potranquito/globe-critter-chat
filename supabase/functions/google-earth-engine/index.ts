import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { layerType, region } = await req.json();
    
    console.log(`Fetching GEE data for layer: ${layerType}, region: ${region}`);

    // Try to get an OAuth token using the service account, but fall back gracefully
    let accessToken: string | null = null;
    try {
      const serviceAccountJson = Deno.env.get('GEE_SERVICE_ACCOUNT_JSON');
      if (!serviceAccountJson) {
        console.warn('GEE service account not configured. Proceeding with sample data.');
      } else {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: await createJWT(serviceAccount),
          }),
        });
        if (!tokenResponse.ok) {
          const error = await tokenResponse.text();
          console.warn('Token error (non-fatal):', error);
        } else {
          const tokenJson = await tokenResponse.json();
          accessToken = tokenJson.access_token as string;
        }
      }
    } catch (tokenErr) {
      console.warn('Failed to initialize GEE auth (non-fatal):', tokenErr);
    }
    
    // Fetch conservation data based on layer type (uses sample data for now)
    let layerData;
    switch (layerType) {
      case 'forest':
        layerData = await fetchForestCover(accessToken ?? '', region);
        break;
      case 'ice':
        layerData = await fetchIceCoverage(accessToken ?? '', region);
        break;
      case 'protected':
        layerData = await fetchProtectedAreas(accessToken ?? '', region);
        break;
      default:
        throw new Error(`Unknown layer type: ${layerType}`);
    }

    return new Response(JSON.stringify(layerData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('GEE function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function createJWT(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/earthengine.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedClaim = btoa(JSON.stringify(claim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  // Import private key
  const privateKey = serviceAccount.private_key;
  const pemContents = privateKey
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signatureInput}.${encodedSignature}`;
}

async function fetchForestCover(token: string, region?: string) {
  console.log('Fetching forest cover data');
  
  // Return sample data for forest coverage
  return {
    type: 'forest',
    description: 'Global Forest Cover (Hansen et al.)',
    data: [
      { lat: 61.2181, lng: -149.9003, value: 85, name: 'Alaska Boreal Forest' },
      { lat: -3.4653, lng: -62.2159, value: 92, name: 'Amazon Rainforest' },
      { lat: 0.7893, lng: 113.9213, value: 78, name: 'Borneo Rainforest' },
      { lat: -15.7942, lng: -47.8822, value: 88, name: 'Cerrado Forest' },
    ],
    color: '#2d5a2d',
  };
}

async function fetchIceCoverage(token: string, region?: string) {
  console.log('Fetching ice coverage data');
  
  // Return sample data for ice/glacier coverage
  return {
    type: 'ice',
    description: 'Arctic & Antarctic Ice Coverage',
    data: [
      { lat: 75.0, lng: -40.0, value: 95, name: 'Greenland Ice Sheet' },
      { lat: 66.5, lng: -50.0, value: 82, name: 'Arctic Sea Ice' },
      { lat: -75.0, lng: 0.0, value: 98, name: 'Antarctic Ice Sheet' },
      { lat: 79.0, lng: 20.0, value: 88, name: 'Svalbard Glaciers' },
    ],
    color: '#a5d8ff',
  };
}

async function fetchProtectedAreas(token: string, region?: string) {
  console.log('Fetching protected areas data');
  
  // Return sample data for protected conservation areas
  return {
    type: 'protected',
    description: 'World Database on Protected Areas (WDPA)',
    data: [
      { lat: 44.4280, lng: -110.5885, value: 100, name: 'Yellowstone NP' },
      { lat: -13.1631, lng: -72.5450, value: 100, name: 'Machu Picchu' },
      { lat: -2.1540, lng: 34.6857, value: 100, name: 'Serengeti NP' },
      { lat: 36.1069, lng: -112.1129, value: 100, name: 'Grand Canyon NP' },
    ],
    color: '#51cf66',
  };
}
