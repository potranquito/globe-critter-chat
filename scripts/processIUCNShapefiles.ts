#!/usr/bin/env tsx
/**
 * IUCN Shapefile Processing Script
 *
 * Processes IUCN Red List shapefiles and imports species data into Supabase
 *
 * Requirements:
 * - ogr2ogr (GDAL tools) installed: brew install gdal
 * - IUCN shapefiles downloaded to: ~/Downloads/Animal Zips/
 *
 * Usage:
 *   npm run process-shapefiles
 *   or
 *   tsx scripts/processIUCNShapefiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SHAPEFILE_DIR = path.join(process.env.HOME!, 'Downloads', 'Animal Zips');
const TEMP_DIR = '/tmp/iucn_processing';
const BATCH_SIZE = 500; // Insert 500 species at a time

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface IUCNProperties {
  id_no: number;
  sci_name: string;
  category: string;
  kingdom?: string;
  phylum?: string;
  class?: string;
  order_?: string;
  family?: string;
  genus?: string;
  marine?: string;
  terrestria?: string;
  freshwater?: string;
  citation?: string;
  compiler?: string;
  yrcompiled?: number;
  presence?: string;
  origin?: string;
  seasonal?: string;
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: IUCNProperties;
  geometry: any;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

// Conservation status mapping
const STATUS_MAP: Record<string, string> = {
  'CR': 'Critically Endangered',
  'EN': 'Endangered',
  'VU': 'Vulnerable',
  'NT': 'Near Threatened',
  'LC': 'Least Concern',
  'DD': 'Data Deficient',
  'EX': 'Extinct',
  'EW': 'Extinct in the Wild'
};

/**
 * Check if ogr2ogr is installed
 */
function checkDependencies() {
  try {
    execSync('which ogr2ogr', { stdio: 'ignore' });
    console.log('✓ ogr2ogr found');
  } catch (error) {
    console.error('❌ Error: ogr2ogr not found');
    console.error('Install GDAL tools: brew install gdal');
    process.exit(1);
  }
}

/**
 * Get list of zip files to process
 */
function getShapefileZips(): string[] {
  if (!fs.existsSync(SHAPEFILE_DIR)) {
    console.error(`❌ Error: Directory not found: ${SHAPEFILE_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(SHAPEFILE_DIR)
    .filter(f => f.endsWith('.zip'))
    .map(f => path.join(SHAPEFILE_DIR, f));

  console.log(`\n📁 Found ${files.length} shapefile archives in ${SHAPEFILE_DIR}`);
  return files;
}

/**
 * Extract zip file
 */
function extractZip(zipPath: string, extractPath: string): void {
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  console.log(`  ↳ Extracting...`);
  execSync(`unzip -q -o "${zipPath}" -d "${extractPath}"`, { stdio: 'inherit' });
}

/**
 * Find shapefile in extracted directory
 */
function findShapefile(extractPath: string): string | null {
  const files = fs.readdirSync(extractPath, { recursive: true }) as string[];
  const shpFile = files.find(f => f.toString().endsWith('.shp'));

  if (shpFile) {
    return path.join(extractPath, shpFile.toString());
  }
  return null;
}

/**
 * Convert shapefile to GeoJSON using ogr2ogr
 */
function convertToGeoJSON(shpPath: string, geojsonPath: string): void {
  console.log(`  ↳ Converting to GeoJSON...`);

  execSync(
    `ogr2ogr -f GeoJSON "${geojsonPath}" "${shpPath}"`,
    { stdio: 'inherit' }
  );
}

/**
 * Parse GeoJSON and extract species records
 */
function parseGeoJSON(geojsonPath: string): any[] {
  console.log(`  ↳ Parsing GeoJSON...`);

  const geojson: GeoJSON = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  const speciesRecords: any[] = [];

  for (const feature of geojson.features) {
    const props = feature.properties;

    // Skip if missing required fields
    if (!props.id_no || !props.sci_name) {
      continue;
    }

    const record = {
      iucn_id: props.id_no,
      scientific_name: props.sci_name,
      conservation_status: props.category || null,
      conservation_status_full: STATUS_MAP[props.category] || null,

      // Taxonomy
      kingdom: props.kingdom || null,
      phylum: props.phylum || null,
      class: props.class || null,
      order_name: props.order_ || null,
      family: props.family || null,
      genus: props.genus || null,

      // Habitat classification
      is_marine: props.marine === 'true' || props.marine === '1',
      is_terrestrial: props.terrestria === 'true' || props.terrestria === '1',
      is_freshwater: props.freshwater === 'true' || props.freshwater === '1',

      // Geographic range (convert to PostGIS geography)
      geographic_range: feature.geometry ? JSON.stringify(feature.geometry) : null,

      // Metadata
      iucn_citation: props.citation || null,
      compiler: props.compiler || null,
      year_compiled: props.yrcompiled || null
    };

    speciesRecords.push(record);
  }

  console.log(`  ↳ Parsed ${speciesRecords.length} species records`);
  return speciesRecords;
}

/**
 * Insert species records into Supabase in batches
 */
async function insertSpecies(records: any[]): Promise<void> {
  console.log(`  ↳ Inserting ${records.length} species into database...`);

  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('species')
        .upsert(batch, {
          onConflict: 'iucn_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`    ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        errorCount += batch.length;
      } else {
        insertedCount += batch.length;
        process.stdout.write(`    ✓ Inserted ${insertedCount}/${records.length} species\r`);
      }
    } catch (err) {
      console.error(`    ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, err);
      errorCount += batch.length;
    }
  }

  console.log(`\n  ↳ Successfully inserted: ${insertedCount}`);
  if (errorCount > 0) {
    console.log(`  ↳ Errors: ${errorCount}`);
  }
}

/**
 * Process a single shapefile archive
 */
async function processShapefile(zipPath: string): Promise<void> {
  const filename = path.basename(zipPath, '.zip');
  console.log(`\n📦 Processing: ${filename}`);

  const extractPath = path.join(TEMP_DIR, filename);
  const geojsonPath = path.join(TEMP_DIR, `${filename}.geojson`);

  try {
    // Step 1: Extract
    extractZip(zipPath, extractPath);

    // Step 2: Find shapefile
    const shpPath = findShapefile(extractPath);
    if (!shpPath) {
      console.error(`  ✗ No .shp file found in ${filename}`);
      return;
    }

    // Step 3: Convert to GeoJSON
    convertToGeoJSON(shpPath, geojsonPath);

    // Step 4: Parse and extract records
    const records = parseGeoJSON(geojsonPath);

    if (records.length === 0) {
      console.log(`  ⚠ No valid species records found`);
      return;
    }

    // Step 5: Insert into database
    await insertSpecies(records);

    console.log(`  ✓ Completed ${filename}`);

  } catch (error) {
    console.error(`  ✗ Error processing ${filename}:`, error);
  } finally {
    // Cleanup
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    if (fs.existsSync(geojsonPath)) {
      fs.unlinkSync(geojsonPath);
    }
  }
}

/**
 * Get species count from database
 */
async function getSpeciesCount(): Promise<number> {
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
 * Main execution
 */
async function main() {
  console.log('🌍 IUCN Shapefile Processing Script\n');
  console.log('=' .repeat(60));

  // Check dependencies
  checkDependencies();

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Get initial count
  const initialCount = await getSpeciesCount();
  console.log(`\n📊 Current species in database: ${initialCount}`);

  // Get list of shapefiles
  const zipFiles = getShapefileZips();

  if (zipFiles.length === 0) {
    console.log('\n❌ No shapefile archives found');
    console.log(`   Expected location: ${SHAPEFILE_DIR}`);
    process.exit(1);
  }

  console.log('\nStarting processing...');
  const startTime = Date.now();

  // Process each shapefile
  for (let i = 0; i < zipFiles.length; i++) {
    console.log(`\n[${i + 1}/${zipFiles.length}]`);
    await processShapefile(zipFiles[i]);
  }

  // Get final count
  const finalCount = await getSpeciesCount();
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Processing Complete!\n');
  console.log(`   Initial species: ${initialCount}`);
  console.log(`   Final species: ${finalCount}`);
  console.log(`   New species added: ${finalCount - initialCount}`);
  console.log(`   Duration: ${duration} minutes`);
  console.log('\n' + '='.repeat(60));

  console.log('\n✓ You can now delete the original shapefile archives to free up space');
  console.log(`  Location: ${SHAPEFILE_DIR}`);
  console.log(`  Total size: ~13GB`);
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
