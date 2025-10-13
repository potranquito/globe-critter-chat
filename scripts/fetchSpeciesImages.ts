#!/usr/bin/env tsx
/**
 * Fetch Species Images from iNaturalist
 *
 * Queries iNaturalist API for species photos and updates the species table
 *
 * Requirements:
 * - Species data already in database
 * - Internet connection for API calls
 *
 * Usage:
 *   npm run fetch-images
 *   or
 *   tsx scripts/fetchSpeciesImages.ts [limit]
 *
 * Example:
 *   tsx scripts/fetchSpeciesImages.ts 100  # Fetch images for 100 species
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuration
const BATCH_SIZE = 50; // Process 50 species at a time
const DELAY_MS = 1000; // 1 second delay between batches to avoid rate limiting
const DEFAULT_LIMIT = 1000; // Default number of species to process

interface INatTaxon {
  id: number;
  name: string;
  default_photo?: {
    medium_url: string;
    attribution: string;
    license_code: string;
  };
}

interface INatResponse {
  results: INatTaxon[];
}

/**
 * Search iNaturalist for a species by scientific name
 */
async function searchINaturalist(scientificName: string): Promise<string | null> {
  try {
    const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientificName)}&rank=species&per_page=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GlobeCritterChat/1.0 (Conservation Education Game)',
      },
    });

    if (!response.ok) {
      console.error(`  ⚠ iNaturalist API error: ${response.status}`);
      return null;
    }

    const data: INatResponse = await response.json();

    if (data.results && data.results.length > 0) {
      const taxon = data.results[0];
      if (taxon.default_photo && taxon.default_photo.medium_url) {
        return taxon.default_photo.medium_url;
      }
    }

    return null;
  } catch (error) {
    console.error(`  ⚠ Error fetching from iNaturalist:`, error);
    return null;
  }
}

/**
 * Fetch species without images from database
 */
async function getSpeciesWithoutImages(limit: number): Promise<any[]> {
  const { data, error } = await supabase
    .from('species')
    .select('iucn_id, scientific_name, image_url')
    .is('image_url', null)
    .limit(limit);

  if (error) {
    console.error('Error fetching species:', error);
    return [];
  }

  return data || [];
}

/**
 * Update species image URL in database
 */
async function updateSpeciesImage(iucnId: number, imageUrl: string): Promise<boolean> {
  const { error } = await supabase
    .from('species')
    .update({ image_url: imageUrl })
    .eq('iucn_id', iucnId);

  if (error) {
    console.error(`  ✗ Error updating species ${iucnId}:`, error.message);
    return false;
  }

  return true;
}

/**
 * Get total species count
 */
async function getTotalSpeciesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting species count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Get count of species with images
 */
async function getSpeciesWithImagesCount(): Promise<number> {
  const { count, error } = await supabase
    .from('species')
    .select('*', { count: 'exact', head: true })
    .not('image_url', 'is', null);

  if (error) {
    console.error('Error getting species with images count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Process a batch of species
 */
async function processBatch(species: any[]): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const sp of species) {
    try {
      const imageUrl = await searchINaturalist(sp.scientific_name);

      if (imageUrl) {
        const updated = await updateSpeciesImage(sp.iucn_id, imageUrl);
        if (updated) {
          success++;
          process.stdout.write(`  ✓ ${sp.scientific_name}\n`);
        } else {
          failed++;
        }
      } else {
        failed++;
        process.stdout.write(`  ⚠ ${sp.scientific_name} (no image found)\n`);
      }

      // Small delay between individual requests
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.error(`  ✗ Error processing ${sp.scientific_name}:`, error);
      failed++;
    }
  }

  return { success, failed };
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main execution
 */
async function main() {
  console.log('📸 Species Image Fetcher (iNaturalist)\n');
  console.log('='.repeat(60));

  // Get limit from command line args or use default
  const limit = process.argv[2] ? parseInt(process.argv[2]) : DEFAULT_LIMIT;

  // Get counts
  const totalSpecies = await getTotalSpeciesCount();
  const withImages = await getSpeciesWithImagesCount();

  console.log(`\n📊 Database Status:`);
  console.log(`   Total species: ${totalSpecies}`);
  console.log(`   With images: ${withImages}`);
  console.log(`   Without images: ${totalSpecies - withImages}`);
  console.log(`\n📥 Fetching images for up to ${limit} species...\n`);

  // Fetch species without images
  const speciesToProcess = await getSpeciesWithoutImages(limit);

  if (speciesToProcess.length === 0) {
    console.log('✅ All species already have images!');
    return;
  }

  console.log(`Found ${speciesToProcess.length} species to process\n`);

  const startTime = Date.now();
  let totalSuccess = 0;
  let totalFailed = 0;

  // Process in batches
  for (let i = 0; i < speciesToProcess.length; i += BATCH_SIZE) {
    const batch = speciesToProcess.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(speciesToProcess.length / BATCH_SIZE);

    console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} species)`);
    console.log('-'.repeat(60));

    const { success, failed } = await processBatch(batch);
    totalSuccess += success;
    totalFailed += failed;

    console.log(`\n  Batch results: ${success} success, ${failed} failed`);

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < speciesToProcess.length) {
      console.log(`  ⏳ Waiting ${DELAY_MS}ms before next batch...`);
      await sleep(DELAY_MS);
    }
  }

  // Final counts
  const finalWithImages = await getSpeciesWithImagesCount();
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Image Fetching Complete!\n');
  console.log(`   Processed: ${speciesToProcess.length} species`);
  console.log(`   Successful: ${totalSuccess}`);
  console.log(`   Failed: ${totalFailed}`);
  console.log(`   Success rate: ${((totalSuccess / speciesToProcess.length) * 100).toFixed(1)}%`);
  console.log(`\n   Total species with images: ${finalWithImages}/${totalSpecies}`);
  console.log(`   Coverage: ${((finalWithImages / totalSpecies) * 100).toFixed(1)}%`);
  console.log(`\n   Duration: ${duration} minutes`);
  console.log('\n' + '='.repeat(60));
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
