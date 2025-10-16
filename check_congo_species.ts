#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCongoSpecies() {
  console.log('\n🌍 Checking Congo Basin Species\n');
  console.log('='.repeat(80));

  // Get Congo Basin ecoregion
  const { data: congo } = await supabase
    .from('ecoregions')
    .select('*')
    .eq('name', 'Congo Basin')
    .single();

  if (!congo) {
    console.log('Congo Basin not found!');
    return;
  }

  console.log(`Congo Basin ID: ${congo.id}\n`);

  // Get species linked to Congo Basin
  const { data: species } = await supabase
    .from('species')
    .select(`
      id,
      scientific_name,
      common_name,
      class,
      species_type,
      ui_group,
      trophic_role,
      species_ecoregions!inner(ecoregion_id)
    `)
    .eq('species_ecoregions.ecoregion_id', congo.id);

  console.log(`Total species in Congo Basin: ${species?.length}\n`);

  // Group by ui_group
  const byUIGroup: { [key: string]: any[] } = {};
  species?.forEach(s => {
    const group = s.ui_group || 'NULL';
    if (!byUIGroup[group]) byUIGroup[group] = [];
    byUIGroup[group].push(s);
  });

  console.log('Species by UI Group:');
  console.log('-'.repeat(80));
  Object.keys(byUIGroup).sort().forEach(group => {
    console.log(`\n${group}: ${byUIGroup[group].length} species`);
    console.log('Sample species:');
    byUIGroup[group].slice(0, 5).forEach(s => {
      console.log(`  - ${s.common_name || s.scientific_name} (${s.species_type})`);
    });
  });

  // Group by species_type
  const bySpeciesType: { [key: string]: any[] } = {};
  species?.forEach(s => {
    const type = s.species_type || 'NULL';
    if (!bySpeciesType[type]) bySpeciesType[type] = [];
    bySpeciesType[type].push(s);
  });

  console.log('\n\nSpecies by Species Type:');
  console.log('-'.repeat(80));
  Object.keys(bySpeciesType).sort().forEach(type => {
    console.log(`${type}: ${bySpeciesType[type].length} species`);
  });

  console.log('\n' + '='.repeat(80));
}

checkCongoSpecies().catch(console.error);
