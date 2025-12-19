// Quick script to check Coral Triangle parks
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkCoralTriangle() {
  console.log('🌊 Checking Coral Triangle Parks\n');

  // Find Coral Triangle ecoregion
  const { data: ecoregions, error: ecoError } = await supabase
    .from('ecoregions')
    .select('*')
    .ilike('name', '%Coral%Triangle%');

  if (ecoError || !ecoregions || ecoregions.length === 0) {
    console.log('❌ Coral Triangle not found in database');
    return;
  }

  const coral = ecoregions[0];
  console.log(`Found: ${coral.name}`);
  console.log(`  Center: ${coral.center_lat}, ${coral.center_lng}`);
  console.log(`  Radius: ${coral.radius_km} km`);
  console.log(`  Realm: ${coral.realm}\n`);

  // Check for parks in the region
  const radiusDeg = coral.radius_km / 111; // Convert km to degrees

  const { data: parks, error: parksError } = await supabase
    .from('parks')
    .select('name, marine_area_km2, gis_area_km2, center_lat, center_lng')
    .gte('center_lat', coral.center_lat - radiusDeg)
    .lte('center_lat', coral.center_lat + radiusDeg)
    .gte('center_lng', coral.center_lng - radiusDeg)
    .lte('center_lng', coral.center_lng + radiusDeg)
    .not('center_lat', 'is', null)
    .not('center_lng', 'is', null)
    .order('gis_area_km2', { ascending: false })
    .limit(30);

  if (parksError) {
    console.log('Error fetching parks:', parksError);
    return;
  }

  console.log(`Found ${parks.length} parks in geographic bounds\n`);

  // Calculate marine percentage for each park
  const parksWithMarine = parks.map(park => {
    const marinePct = park.marine_area_km2 && park.gis_area_km2
      ? (park.marine_area_km2 / park.gis_area_km2) * 100
      : 0;
    return {
      ...park,
      marinePct,
      isMarine: marinePct > 50
    };
  });

  const marineParks = parksWithMarine.filter(p => p.isMarine);
  const terrestrialParks = parksWithMarine.filter(p => !p.isMarine);

  console.log(`🐟 Marine parks (>50% marine): ${marineParks.length}`);
  console.log(`🌳 Terrestrial parks: ${terrestrialParks.length}\n`);

  console.log('Top 10 Marine Parks:');
  marineParks.slice(0, 10).forEach((park, i) => {
    console.log(`  ${i+1}. ${park.name}`);
    console.log(`     ${park.marinePct.toFixed(1)}% marine (${park.marine_area_km2?.toFixed(0) || 0} / ${park.gis_area_km2?.toFixed(0)} km²)`);
  });

  if (marineParks.length === 0) {
    console.log('\n⚠️  NO MARINE PARKS FOUND!');
    console.log('\nThis could be because:');
    console.log('1. The marine_area_km2 field is NULL or 0 for all parks');
    console.log('2. The parks in this region are actually terrestrial');
    console.log('3. The data import didn\'t include marine area information');

    console.log('\nChecking marine_area_km2 values:');
    const parksWithMarineData = parks.filter(p => p.marine_area_km2 && p.marine_area_km2 > 0);
    console.log(`  Parks with marine_area_km2 > 0: ${parksWithMarineData.length}`);
    console.log(`  Parks with marine_area_km2 NULL/0: ${parks.length - parksWithMarineData.length}`);
  }
}

checkCoralTriangle().then(() => process.exit(0)).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
