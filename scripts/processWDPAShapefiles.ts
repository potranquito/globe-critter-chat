#!/usr/bin/env tsx
/**
 * WDPA Shapefile Processing Script
 *
 * Processes World Database on Protected Areas (WDPA) shapefiles
 * and imports protected areas (parks, refuges, reserves) into Supabase
 *
 * Requirements:
 * - ogr2ogr (GDAL tools) installed: brew install gdal
 * - WDPA shapefiles downloaded to: ~/Downloads/protected-regions/
 *
 * Usage:
 *   npm run process-wdpa
 *   or
 *   tsx scripts/processWDPAShapefiles.ts
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const SHAPEFILE_DIR = path.join(process.env.HOME!, 'Downloads', 'protected-regions');
const TEMP_DIR = '/tmp/wdpa_processing';
const BATCH_SIZE = 500;

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface WDPAProperties {
  WDPAID: number;
  NAME: string;
  ORIG_NAME?: string;
  DESIG: string;
  DESIG_ENG: string;
  DESIG_TYPE?: string;
  IUCN_CAT: string;
  INT_CRIT?: string;
  MARINE?: string;
  REP_M_AREA?: number;
  GIS_M_AREA?: number;
  REP_AREA?: number;
  GIS_AREA: number;
  NO_TAKE?: string;
  NO_TK_AREA?: number;
  STATUS: string;
  STATUS_YR: number;
  GOV_TYPE?: string;
  OWN_TYPE?: string;
  MANG_AUTH?: string;
  MANG_PLAN?: string;
  VERIF?: string;
  METADATAID: number;
  SUB_LOC?: string;
  PARENT_ISO?: string;
  ISO3: string;
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: WDPAProperties;
  geometry: any;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * Calculate centroid from geometry
 */
function calculateCentroid(geometry: any): { lat: number; lng: number } | null {
  if (!geometry || !geometry.coordinates) return null;

  try {
    if (geometry.type === 'Point') {
      return { lng: geometry.coordinates[0], lat: geometry.coordinates[1] };
    }

    if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
      // Simple centroid calculation (average of all points)
      let sumLat = 0, sumLng = 0, count = 0;

      const coords = geometry.type === 'Polygon'
        ? geometry.coordinates[0]
        : geometry.coordinates[0][0];

      for (const [lng, lat] of coords) {
        sumLng += lng;
        sumLat += lat;
        count++;
      }

      return { lat: sumLat / count, lng: sumLng / count };
    }
  } catch (error) {
    return null;
  }

  return null;
}

/**
 * Map WDPA designation to park_type
 */
function mapDesignationToType(designation: string): string {
  const desigLower = designation.toLowerCase();

  if (desigLower.includes('national park')) return 'national_park';
  if (desigLower.includes('wildlife refuge') || desigLower.includes('wildlife sanctuary')) return 'wildlife_refuge';
  if (desigLower.includes('nature reserve')) return 'nature_reserve';
  if (desigLower.includes('wilderness')) return 'wilderness_area';
  if (desigLower.includes('marine')) return 'marine_protected_area';
  if (desigLower.includes('conservation area')) return 'conservation_area';
  if (desigLower.includes('monument')) return 'national_monument';

  return 'protected_area';
}

/**
 * Extract and process zip file
 */
function extractZip(zipPath: string, extractPath: string): void {
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }

  console.log(`  ↳ Extracting ${path.basename(zipPath)}...`);
  execSync(`unzip -q -o "${zipPath}" -d "${extractPath}"`, { stdio: 'inherit' });
}

/**
 * Find shapefile in extracted directory
 */
function findShapefile(extractPath: string, pattern: string): string | null {
  const files = fs.readdirSync(extractPath, { recursive: true }) as string[];
  const shpFile = files.find(f => f.toString().includes(pattern) && f.toString().endsWith('.shp'));

  if (shpFile) {
    return path.join(extractPath, shpFile.toString());
  }
  return null;
}

/**
 * Convert shapefile to GeoJSON
 */
function convertToGeoJSON(shpPath: string, geojsonPath: string, filterCountry?: string): void {
  console.log(`  ↳ Converting to GeoJSON...`);

  let cmd = `ogr2ogr -f GeoJSON "${geojsonPath}" "${shpPath}"`;

  // Optional: filter by country to reduce size
  if (filterCountry) {
    cmd += ` -where "ISO3='${filterCountry}'"`;
  }

  execSync(cmd, { stdio: 'inherit' });
}

/**
 * Parse GeoJSON and extract park records
 */
function parseGeoJSON(geojsonPath: string): any[] {
  console.log(`  ↳ Parsing GeoJSON...`);

  const geojson: GeoJSON = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  const parkRecords: any[] = [];

  for (const feature of geojson.features) {
    const props = feature.properties;

    // Skip if missing required fields
    if (!props.WDPAID || !props.NAME) {
      continue;
    }

    const centroid = calculateCentroid(feature.geometry);
    if (!centroid) continue;

    const record = {
      wdpa_id: props.WDPAID,
      name: props.NAME,
      designation: props.DESIG || null,
      designation_eng: props.DESIG_ENG || null,
      iucn_category: props.IUCN_CAT || null,
      park_type: mapDesignationToType(props.DESIG_ENG || props.DESIG || ''),

      // Location
      center_lat: centroid.lat,
      center_lng: centroid.lng,
      iso3: props.ISO3 || null,
      parent_iso3: props.PARENT_ISO || null,
      sub_location: props.SUB_LOC || null,
      country: null, // Will be filled based on ISO3

      // Area
      gis_area_km2: props.GIS_AREA || null,
      reported_area_km2: props.REP_AREA || null,
      marine_area_km2: props.GIS_M_AREA || null,
      no_take_area_km2: props.NO_TK_AREA || null,

      // Management
      governance: props.GOV_TYPE || null,
      own_type: props.OWN_TYPE || null,
      management_authority: props.MANG_AUTH || null,
      status: props.STATUS || null,
      status_year: props.STATUS_YR || null,

      // Metadata
      verif: props.VERIF || null,
      metadataid: props.METADATAID || null,

      // Geographic boundary (PostGIS)
      bounds: feature.geometry ? JSON.stringify(feature.geometry) : null
    };

    parkRecords.push(record);
  }

  console.log(`  ↳ Parsed ${parkRecords.length} park records`);
  return parkRecords;
}

/**
 * Insert park records into Supabase
 */
async function insertParks(records: any[]): Promise<void> {
  console.log(`  ↳ Inserting ${records.length} parks into database...`);

  let insertedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    try {
      const { data, error } = await supabase
        .from('parks')
        .upsert(batch, {
          onConflict: 'wdpa_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`    ✗ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
        errorCount += batch.length;
      } else {
        insertedCount += batch.length;
        process.stdout.write(`    ✓ Inserted ${insertedCount}/${records.length} parks\r`);
      }
    } catch (err) {
      console.error(`    ✗ Batch error:`, err);
      errorCount += batch.length;
    }
  }

  console.log(`\n  ↳ Successfully inserted: ${insertedCount}`);
  if (errorCount > 0) {
    console.log(`  ↳ Errors: ${errorCount}`);
  }
}

/**
 * Process WDPA shapefile
 */
async function processWDPAShapefile(type: 'polygons' | 'points', filterCountry?: string): Promise<void> {
  console.log(`\n📦 Processing WDPA ${type}...`);

  const extractPath = path.join(TEMP_DIR, 'extracted');
  const geojsonPath = path.join(TEMP_DIR, `wdpa_${type}.geojson`);

  try {
    // Extract all zip files to same directory
    const zipFiles = fs.readdirSync(SHAPEFILE_DIR)
      .filter(f => f.startsWith('WDPA_') && f.endsWith('.zip'))
      .map(f => path.join(SHAPEFILE_DIR, f));

    for (const zipFile of zipFiles) {
      if (fs.statSync(zipFile).size > 100 * 1024 * 1024) { // > 100MB
        extractZip(zipFile, extractPath);
      }
    }

    // Find shapefile
    const shpPath = findShapefile(extractPath, type);
    if (!shpPath) {
      console.error(`  ✗ No ${type} shapefile found`);
      return;
    }

    // Convert to GeoJSON
    convertToGeoJSON(shpPath, geojsonPath, filterCountry);

    // Parse and extract records
    const records = parseGeoJSON(geojsonPath);

    if (records.length === 0) {
      console.log(`  ⚠ No valid park records found`);
      return;
    }

    // Insert into database
    await insertParks(records);

    console.log(`  ✓ Completed ${type}`);

  } catch (error) {
    console.error(`  ✗ Error processing ${type}:`, error);
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
 * Get park count from database
 */
async function getParksCount(): Promise<number> {
  const { count, error } = await supabase
    .from('parks')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error getting parks count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Main execution
 */
async function main() {
  console.log('🏞️  WDPA Shapefile Processing Script\n');
  console.log('='.repeat(60));

  // Create temp directory
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // Get initial count
  const initialCount = await getParksCount();
  console.log(`\n📊 Current parks in database: ${initialCount}`);

  const startTime = Date.now();

  // Optional: Filter by country (e.g., 'USA' for testing)
  // Change to null to process all countries
  const filterCountry = process.argv[2] || null;

  if (filterCountry) {
    console.log(`\n🌍 Filtering parks for country: ${filterCountry}`);
  }

  // Process polygons (park boundaries)
  await processWDPAShapefile('polygons', filterCountry);

  // Process points (smaller parks)
  await processWDPAShapefile('points', filterCountry);

  // Get final count
  const finalCount = await getParksCount();
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 Processing Complete!\n');
  console.log(`   Initial parks: ${initialCount}`);
  console.log(`   Final parks: ${finalCount}`);
  console.log(`   New parks added: ${finalCount - initialCount}`);
  console.log(`   Duration: ${duration} minutes`);
  console.log('\n' + '='.repeat(60));
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
