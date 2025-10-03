import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Usage limits for free tier protection
const DAILY_LIMIT = 300;
const MONTHLY_LIMIT = 9000;

interface UsageRecord {
  date: string;
  count: number;
}

// In-memory usage tracking (resets on function restart)
const usageStore = new Map<string, UsageRecord>();

function getUsageKey(type: 'daily' | 'monthly'): string {
  const now = new Date();
  if (type === 'daily') {
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
}

function trackUsage(): { daily: number; monthly: number; allowed: boolean } {
  const dailyKey = getUsageKey('daily');
  const monthlyKey = getUsageKey('monthly');
  
  // Get or initialize counters
  const dailyRecord = usageStore.get(`daily-${dailyKey}`) || { date: dailyKey, count: 0 };
  const monthlyRecord = usageStore.get(`monthly-${monthlyKey}`) || { date: monthlyKey, count: 0 };
  
  // Check limits
  const allowed = dailyRecord.count < DAILY_LIMIT && monthlyRecord.count < MONTHLY_LIMIT;
  
  if (allowed) {
    // Increment counters
    dailyRecord.count++;
    monthlyRecord.count++;
    usageStore.set(`daily-${dailyKey}`, dailyRecord);
    usageStore.set(`monthly-${monthlyKey}`, monthlyRecord);
  }
  
  return {
    daily: dailyRecord.count,
    monthly: monthlyRecord.count,
    allowed
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, params } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    // Track usage
    const usage = trackUsage();
    console.log(`[${new Date().toISOString()}] API Request - Daily: ${usage.daily}/${DAILY_LIMIT}, Monthly: ${usage.monthly}/${MONTHLY_LIMIT}`);

    if (!usage.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily or monthly API limit reached',
          usage: {
            daily: usage.daily,
            monthly: usage.monthly,
            dailyLimit: DAILY_LIMIT,
            monthlyLimit: MONTHLY_LIMIT
          }
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Return usage stats with API key
    return new Response(
      JSON.stringify({ 
        apiKey,
        usage: {
          daily: usage.daily,
          monthly: usage.monthly,
          dailyLimit: DAILY_LIMIT,
          monthlyLimit: MONTHLY_LIMIT,
          warningThreshold: Math.floor(DAILY_LIMIT * 0.8)
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in google-maps-proxy:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
