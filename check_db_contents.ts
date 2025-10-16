#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseContents() {
  console.log('\n🔍 Checking Database Contents\n');
  console.log('='.repeat(80));

  // 1. Species table stats
  console.log('\n📊 SPECIES TABLE:');
  console.log('-'.repeat(80));

  const { count: totalSpecies } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true });
  console.log(`Total species: ${totalSpecies}`);

  const { count: curatedSpecies } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true })
    .eq('is_curated', true);
  console.log(`Curated species: ${curatedSpecies}`);

  const { count: withImages } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true })
    .not('image_url', 'is', null);
  console.log(`Species with images: ${withImages}`);

  // Data sources
  const { data: sources } = await supabase
    .from('species')
    .select('image_source')
    .not('image_source', 'is', null);
  const uniqueSources = new Set(sources?.map(s => s.image_source));
  console.log(`Image sources: ${Array.from(uniqueSources).join(', ')}`);

  // Species types
  const { data: types } = await supabase
    .from('species')
    .select('species_type')
    .not('species_type', 'is', null);
  const uniqueTypes = new Set(types?.map(t => t.species_type));
  console.log(`Species types: ${Array.from(uniqueTypes).join(', ')}`);

  // Trophic roles
  const { data: roles } = await supabase
    .from('species')
    .select('trophic_role')
    .not('trophic_role', 'is', null);
  const uniqueRoles = new Set(roles?.map(r => r.trophic_role));
  console.log(`Trophic roles: ${Array.from(uniqueRoles).join(', ')}`);

  // 2. Ecoregions table
  console.log('\n🌍 ECOREGIONS TABLE (WWF):');
  console.log('-'.repeat(80));

  const { count: totalEcoregions } = await supabase
    .from('ecoregions')
    .select('*', { count: 'exact', head: true });
  console.log(`Total ecoregions: ${totalEcoregions}`);

  const { data: sampleEcoregions } = await supabase
    .from('ecoregions')
    .select('name, biome, realm')
    .limit(5);
  console.log('Sample ecoregions:');
  sampleEcoregions?.forEach(e => {
    console.log(`  - ${e.name} (${e.biome}, ${e.realm})`);
  });

  // 3. Parks table
  console.log('\n🏞️  PARKS TABLE (Protected Planet/WDPA):');
  console.log('-'.repeat(80));

  const { count: totalParks } = await supabase
    .from('parks')
    .select('*', { count: 'exact', head: true });
  console.log(`Total parks: ${totalParks}`);

  const { count: withWDPA } = await supabase
    .from('parks')
    .select('*', { count: 'exact', head: true })
    .not('wdpa_id', 'is', null);
  console.log(`Parks with WDPA ID: ${withWDPA}`);

  const { data: sampleParks } = await supabase
    .from('parks')
    .select('name, country, park_type, wdpa_id')
    .limit(5);
  console.log('Sample parks:');
  sampleParks?.forEach(p => {
    console.log(`  - ${p.name} (${p.country}) - Type: ${p.park_type}, WDPA: ${p.wdpa_id || 'N/A'}`);
  });

  // 4. Junction tables
  console.log('\n🔗 JUNCTION TABLES:');
  console.log('-'.repeat(80));

  const { count: speciesEcoregions } = await supabase
    .from('species_ecoregions')
    .select('*', { count: 'exact', head: true });
  console.log(`Species-Ecoregion links: ${speciesEcoregions}`);

  const { count: speciesParks } = await supabase
    .from('species_parks')
    .select('*', { count: 'exact', head: true });
  console.log(`Species-Park links: ${speciesParks}`);

  // 5. Sample data check - get a few species with all details
  console.log('\n🦁 SAMPLE SPECIES WITH FULL DETAILS:');
  console.log('-'.repeat(80));

  const { data: sampleSpecies } = await supabase
    .from('species')
    .select('scientific_name, common_name, species_type, trophic_role, conservation_status, is_curated, image_source')
    .not('image_url', 'is', null)
    .limit(5);

  sampleSpecies?.forEach(s => {
    console.log(`\n${s.common_name || s.scientific_name}`);
    console.log(`  Scientific: ${s.scientific_name}`);
    console.log(`  Type: ${s.species_type}`);
    console.log(`  Trophic: ${s.trophic_role}`);
    console.log(`  Status: ${s.conservation_status}`);
    console.log(`  Curated: ${s.is_curated ? 'Yes' : 'No'}`);
    console.log(`  Image: ${s.image_source}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('✅ Database check complete!\n');
}

checkDatabaseContents().catch(console.error);
