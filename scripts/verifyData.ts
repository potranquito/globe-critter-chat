#!/usr/bin/env tsx
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('🔍 Verifying Database Contents\n');
  console.log('='.repeat(60));

  // Species stats
  const { count: totalSpecies } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true });

  const { count: withSamplePoints } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true })
    .not('sample_points', 'is', null);

  const { data: statuses } = await supabase
    .from('species')
    .select('conservation_status')
    .not('conservation_status', 'is', null);

  const uniqueStatuses = new Set(statuses?.map(s => s.conservation_status));

  const { data: sampleSpecies } = await supabase
    .from('species')
    .select('scientific_name, conservation_status, sample_points')
    .not('sample_points', 'is', null)
    .limit(3);

  console.log('\n📊 Species Data:');
  console.log(`   Total species: ${totalSpecies}`);
  console.log(`   With sample points: ${withSamplePoints}`);
  console.log(`   Conservation statuses: ${uniqueStatuses.size}`);
  console.log(`   Statuses: ${Array.from(uniqueStatuses).join(', ')}`);

  console.log('\n📋 Sample Species:');
  sampleSpecies?.forEach((s, i) => {
    const points = JSON.parse(s.sample_points);
    console.log(`   ${i + 1}. ${s.scientific_name} (${s.conservation_status})`);
    console.log(`      Sample points: ${points.length} locations`);
    if (points[0]) {
      console.log(`      First point: ${points[0].lat.toFixed(2)}°, ${points[0].lng.toFixed(2)}°`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification Complete!\n');
}

verifyData();
