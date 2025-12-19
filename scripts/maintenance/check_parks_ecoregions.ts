#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkParksEcoregions() {
  console.log('\n🏞️  Parks and Ecoregions Analysis\n');
  console.log('='.repeat(80));

  // Get all ecoregions
  const { data: ecoregions } = await supabase
    .from('ecoregions')
    .select('*');

  console.log(`\nTotal ecoregions: ${ecoregions?.length}\n`);

  // Get all parks with their ecoregion link
  const { data: parks } = await supabase
    .from('parks')
    .select('id, name, country, ecoregion_id, center_lat, center_lng');

  console.log(`Total parks: ${parks?.length}\n`);

  // Show parks linked to ecoregions
  const { count: linkedParks } = await supabase
    .from('parks')
    .select('*', { count: 'exact', head: true })
    .not('ecoregion_id', 'is', null);

  console.log(`Parks with ecoregion link: ${linkedParks}`);
  console.log(`Parks without ecoregion link: ${(parks?.length || 0) - (linkedParks || 0)}\n`);

  // Show all parks grouped by location
  console.log('All Parks by Location:');
  console.log('-'.repeat(80));
  parks?.forEach(p => {
    const ecoName = ecoregions?.find(e => e.id === p.ecoregion_id)?.name || 'NOT LINKED';
    console.log(`${p.name} (${p.country})`);
    console.log(`  Location: ${p.center_lat}, ${p.center_lng}`);
    console.log(`  Ecoregion: ${ecoName}`);
    console.log();
  });

  // Show ecoregions with their parks
  console.log('\nEcoregions with their parks:');
  console.log('-'.repeat(80));
  for (const eco of ecoregions || []) {
    const ecoParks = parks?.filter(p => p.ecoregion_id === eco.id);
    console.log(`\n${eco.name} (${eco.realm})`);
    console.log(`  ID: ${eco.id}`);
    console.log(`  Parks: ${ecoParks?.length || 0}`);
    ecoParks?.forEach(p => {
      console.log(`    - ${p.name} (${p.country})`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

checkParksEcoregions().catch(console.error);
