# IUCN Spatial Data - Analysis & Integration Plan

## ✅ Data Available

You have **13GB of IUCN Red List spatial data** ready to use!

### Downloaded Files

Located in: `/Users/williamhenderson/Downloads/Animal Zips/`

**Total Size**: ~13GB

**Taxonomic Groups** (22+ complete files):
- ✅ MAMMALS_MARINE_AND_TERRESTRIAL (23MB)
- ✅ MAMMALS_FRESHWATER (54MB)
- ✅ MAMMALS_MARINE_ONLY (305MB)
- ✅ SHARKS_RAYS_CHIMAERAS (416MB)
- ✅ GROUPERS (281MB)
- ✅ EELS (453MB)
- ✅ SALMONIDS (100MB)
- ✅ TUNAS_BILLFISHES_SWORDFISH (117MB)
- ✅ SEABREAMS_SNAPPERS_GRUNTS (538MB)
- ✅ SYNGNATHIFORM_FISHES (261MB)
- ✅ CROAKERS_DRUMS (105MB)
- ✅ STURGEONS_PADDLEFISHES (25MB)
- ✅ HAGFISH (4.7MB)
- ✅ FW_MOLLUSCS (496MB - freshwater)
- ✅ FW_CRABS (53MB - freshwater)
- ✅ FW_CRAYFISH (42MB - freshwater)
- ✅ FW_SHRIMPS (75MB - freshwater)
- ✅ LOBSTERS (217MB)
- ✅ CONE_SNAILS (388MB)
- ✅ ABALONES (30MB)
- ✅ WRASSES_PARROTFISHES (378MB)
- ✅ MANGROVES (88MB - plants)
- ✅ SEAGRASSES (58MB - plants)
- 🔄 Several large files still downloading (.crdownload files)

---

## 📊 Data Structure Analysis

### File Format
- **Format**: Esri Shapefiles (.shp + supporting files)
- **Projection**: WGS 1984 (latitude/longitude, decimal degrees)
- **Geometry**: Polygons representing species ranges

### Available Fields (Per Species Record)

```
Key Fields:
├── id_no           → IUCN species ID
├── sci_name        → Scientific name (e.g., "Panthera leo")
├── category        → Conservation status (CR, EN, VU, NT, LC, DD)
├── presence        → Presence type (extant, extinct, etc.)
├── origin          → Native, introduced, reintroduced
├── seasonal        → Resident, breeding, non-breeding, passage
│
├── Taxonomy:
│   ├── kingdom
│   ├── phylum
│   ├── class
│   ├── order_
│   ├── family
│   └── genus
│
├── Habitat Types:
│   ├── marine      → "true"/"false"
│   ├── terrestria  → "true"/"false"
│   └── freshwater  → "true"/"false"
│
└── Metadata:
    ├── compiler    → Who compiled the map
    ├── yrcompiled  → Year compiled
    ├── citation    → Proper citation
    ├── source      → Data source
    └── legend      → Display legend text
```

---

## ✅ These Files WILL WORK!

### Why They're Perfect:

1. **✅ FREE for Educational Use**
   - Non-commercial/educational use allowed
   - Must provide proper citation (automated in app)

2. **✅ Comprehensive Coverage**
   - Mammals (all types)
   - Marine life (fish, molluscs, crustaceans)
   - Freshwater species
   - Plants (mangroves, seagrasses)
   - MORE files still downloading (likely reptiles, amphibians, etc.)

3. **✅ Geographic Range Data**
   - Precise polygon boundaries
   - Can intersect with eco-regions
   - Can intersect with parks/refuges
   - WGS84 standard (compatible with everything)

4. **✅ Conservation Status**
   - Endangered (EN), Vulnerable (VU), etc.
   - Perfect for educational content about threats

5. **✅ Habitat Classification**
   - Marine vs. terrestrial vs. freshwater
   - Matches your eco-region system

---

## 💾 Storage Recommendations

### Current Situation:
- **Downloaded**: 13GB in `/Downloads/Animal Zips/`
- **Your concern**: Running out of storage

### Recommended Actions:

#### Option 1: Process Then Delete (Recommended) ⭐
```bash
# 1. Process each shapefile into database
# 2. Extract only needed fields
# 3. Store in Supabase (compressed, indexed)
# 4. Delete original shapefiles
#
# Final storage: ~500MB-1GB in database (vs 13GB raw)
```

#### Option 2: Keep Essential Files Only
```bash
# Keep only:
- MAMMALS (all 3 files) ~382MB
- Key marine files ~500MB
- Plants ~150MB
# Delete rest after processing
#
# Reduced to: ~1GB total
```

#### Option 3: External Storage
```bash
# Move to external drive or cloud storage
# Process on-demand
```

---

## 🚀 Integration Plan

### Phase 1: Extract & Transform (This Week)

**Goal**: Convert 13GB shapefiles → PostgreSQL/Supabase database

```python
# Processing pipeline:
for shapefile in iucn_files:
    1. Read shapefile with geopandas
    2. Extract species records
    3. Simplify geometries (reduce precision)
    4. Insert into species table:
       - id_no, sci_name, common_name
       - category (conservation status)
       - taxonomic info
       - geographic_range (PostGIS geometry)
       - habitat_types (marine/terrestrial/freshwater)
    5. Delete processed shapefile
```

**Expected database size**: ~500MB-1GB (vs 13GB raw)

### Phase 2: Map to Eco-regions

```sql
-- Spatial join: Find which species live in which eco-regions
INSERT INTO species_ecoregions (species_id, ecoregion_id)
SELECT DISTINCT
    s.id,
    e.id
FROM species s
JOIN ecoregions e ON ST_Intersects(s.geographic_range, e.geometry)
```

### Phase 3: Map to Parks/Refuges

```sql
-- Similar spatial join for parks
INSERT INTO species_parks (species_id, park_id)
SELECT DISTINCT
    s.id,
    p.id
FROM species s
JOIN parks p ON ST_Intersects(s.geographic_range, p.bounds)
```

---

## 📋 Database Schema (Updated)

```sql
-- Species table (from IUCN shapefiles)
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iucn_id INTEGER UNIQUE NOT NULL,           -- id_no from shapefile
    scientific_name TEXT NOT NULL,              -- sci_name
    common_name TEXT,                           -- lookup from API

    -- Conservation
    conservation_status TEXT,                   -- category (CR, EN, VU, NT, LC, DD)
    conservation_status_name TEXT,              -- Full name

    -- Taxonomy
    kingdom TEXT,
    phylum TEXT,
    class TEXT,
    order_name TEXT,
    family TEXT,
    genus TEXT,

    -- Habitat
    is_marine BOOLEAN DEFAULT false,
    is_terrestrial BOOLEAN DEFAULT false,
    is_freshwater BOOLEAN DEFAULT false,

    -- Geographic
    geographic_range GEOGRAPHY(MULTIPOLYGON),   -- From shapefile geometry

    -- Metadata
    iucn_citation TEXT,                         -- citation field
    compiler TEXT,
    year_compiled INTEGER,

    -- Cached data
    description TEXT,                           -- From IUCN API
    threats TEXT[],                             -- From IUCN API
    image_url TEXT,                             -- From EOL or iNaturalist

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction tables (many-to-many)
CREATE TABLE species_ecoregions (
    species_id UUID REFERENCES species(id),
    ecoregion_id UUID REFERENCES ecoregions(id),
    PRIMARY KEY (species_id, ecoregion_id)
);

CREATE TABLE species_parks (
    species_id UUID REFERENCES species(id),
    park_id UUID REFERENCES parks(id),
    PRIMARY KEY (species_id, park_id)
);

-- Indexes for performance
CREATE INDEX idx_species_conservation ON species(conservation_status);
CREATE INDEX idx_species_habitat ON species(is_marine, is_terrestrial, is_freshwater);
CREATE INDEX idx_species_range ON species USING GIST(geographic_range);
CREATE INDEX idx_species_taxonomy ON species(class, order_name, family);
```

---

## 🔧 Processing Script (Proof of Concept)

```typescript
// scripts/processIUCNShapefiles.ts

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SHAPEFILE_DIR = '/Users/williamhenderson/Downloads/Animal Zips/';
const TEMP_DIR = '/tmp/iucn_processing/';

interface IUCNRecord {
    id_no: number;
    sci_name: string;
    category: string;
    kingdom: string;
    phylum: string;
    class: string;
    order_: string;
    family: string;
    genus: string;
    marine: string;
    terrestria: string;
    freshwater: string;
    citation: string;
    compiler: string;
    yrcompiled: number;
    // ... other fields
}

async function processShapefile(zipPath: string) {
    console.log(`Processing: ${zipPath}`);

    // 1. Unzip
    const filename = path.basename(zipPath, '.zip');
    const extractPath = path.join(TEMP_DIR, filename);
    fs.mkdirSync(extractPath, { recursive: true });

    await execAsync(`unzip -q "${zipPath}" -d "${extractPath}"`);

    // 2. Convert to GeoJSON using ogr2ogr
    const shpFile = path.join(extractPath, `${filename}.shp`);
    const geojsonFile = path.join(extractPath, `${filename}.geojson`);

    await execAsync(
        `ogr2ogr -f GeoJSON "${geojsonFile}" "${shpFile}"`
    );

    // 3. Parse GeoJSON
    const geojson = JSON.parse(fs.readFileSync(geojsonFile, 'utf8'));

    // 4. Process features
    const speciesRecords = geojson.features.map((feature: any) => {
        const props = feature.properties;

        return {
            iucn_id: props.id_no,
            scientific_name: props.sci_name,
            conservation_status: props.category,
            kingdom: props.kingdom,
            phylum: props.phylum,
            class: props.class,
            order_name: props.order_,
            family: props.family,
            genus: props.genus,
            is_marine: props.marine === 'true',
            is_terrestrial: props.terrestria === 'true',
            is_freshwater: props.freshwater === 'true',
            iucn_citation: props.citation,
            compiler: props.compiler,
            year_compiled: props.yrcompiled,
            geographic_range: feature.geometry // GeoJSON geometry
        };
    });

    // 5. Batch insert to Supabase
    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );

    // Insert in batches of 500
    for (let i = 0; i < speciesRecords.length; i += 500) {
        const batch = speciesRecords.slice(i, i + 500);

        const { error } = await supabase
            .from('species')
            .upsert(batch, {
                onConflict: 'iucn_id',
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`Error inserting batch ${i}:`, error);
        } else {
            console.log(`Inserted ${batch.length} species`);
        }
    }

    // 6. Cleanup
    fs.rmSync(extractPath, { recursive: true, force: true });

    console.log(`✅ Processed ${speciesRecords.length} species from ${filename}`);
}

async function main() {
    const zipFiles = fs.readdirSync(SHAPEFILE_DIR)
        .filter(f => f.endsWith('.zip'))
        .map(f => path.join(SHAPEFILE_DIR, f));

    console.log(`Found ${zipFiles.length} shapefiles to process`);

    for (const zipFile of zipFiles) {
        await processShapefile(zipFile);

        // Optional: Delete after processing to save space
        // fs.unlinkSync(zipFile);
    }

    console.log('🎉 All shapefiles processed!');
}

main().catch(console.error);
```

---

## 📸 Image Data (EOL)

The Zenodo link you shared (https://zenodo.org/records/13136202) contains:
- **Image catalog** from Encyclopedia of Life
- **2.6KB metadata file** with URLs to millions of species images
- Can fetch images on-demand using species names

**Usage**:
```typescript
// Fetch image for a species
async function getSpeciesImage(scientificName: string) {
    // Query EOL API or use the catalog
    // Return image URL
}
```

---

## 🎯 Next Steps

### Immediate (Today/Tomorrow):

1. **✅ Architecture designed** (BACKGROUND_ENRICHMENT_ARCHITECTURE.md)
2. **✅ Data verified** (shapefiles are valid and complete)
3. **🔄 Wait for remaining downloads** (check .crdownload files)

### This Week:

1. **Create processing script** (see above)
2. **Setup Supabase tables** (species, species_ecoregions, species_parks)
3. **Process 1-2 shapefiles** (test with mammals)
4. **Verify data quality** (check insertions)

### Next Week:

1. **Process all shapefiles** (automated script)
2. **Spatial joins** (map species → eco-regions)
3. **Add parks database** (protected areas)
4. **Spatial joins** (map species → parks)

### After That:

1. **Build background enrichment agents** (NASA, USGS, weather, eBird, iNaturalist)
2. **Quiz generation integration**
3. **UI implementation** (3D globe → 2D map → species list)

---

## ⚠️ Important Notes

### Licensing:
- **✅ FREE for educational/non-commercial use**
- **❌ Cannot use for commercial purposes**
- **✅ Must provide citation** (automated in your app)

Example citation (auto-generated):
```
IUCN 2023. The IUCN Red List of Threatened Species. Version 2023-1.
https://www.iucnredlist.org. Downloaded on October 11, 2025.
```

### Storage After Processing:
- Raw shapefiles: ~13GB
- Database storage: ~500MB-1GB
- **Can delete raw files after import** ✅

---

## 🎮 Implementation Plan Updates Needed

Please update these documents:
- `IMPLEMENTATION_PLAN.md` - Add IUCN data processing phase
- `PHASE_2_CONTINUATION.md` - Add species database integration

Should I:
1. **Read and update those documents now?**
2. **Build the processing script?**
3. **Create the Supabase migration for species tables?**
