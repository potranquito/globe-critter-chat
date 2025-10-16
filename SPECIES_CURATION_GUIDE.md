# Species Curation Guide

## Overview
This guide explains how to manually curate species for the Globe Critter Chat educational game. The curated species database powers the **card matching game** where players must recognize animals by their images.

## Why Manual Curation?
- **Image Quality**: Ensures high-quality, recognizable images for card game
- **Diversity**: Handpicked species provide educational variety
- **Accuracy**: Wikipedia-sourced data is reliable and well-documented
- **Regional Separation**: Keeps Coral Triangle (marine) distinct from Borneo (terrestrial)

---

## Quick Start

### 1. Add Species to CSV
Edit `curated_species_database.csv` and add rows:

```csv
ecoregion_name,scientific_name,common_name,class,conservation_status,image_url,image_attribution,description,habitat_type
Coral Triangle,Amphiprion percula,Orange Clownfish,ACTINOPTERYGII,LC,https://...,Wikimedia Commons,Bright orange fish with white bands,marine
```

### 2. Run Import Script
```bash
source venv/bin/activate
python3 scripts/import_curated_species.py
```

### 3. Refresh Browser
The species will immediately appear in their ecoregion's carousel!

---

## CSV Field Guide

### Required Fields

| Field | Description | Example |
|-------|-------------|---------|
| `ecoregion_name` | Exact name from database | `Coral Triangle` |
| `scientific_name` | Latin binomial name | `Chelonia mydas` |
| `common_name` | English name | `Green Sea Turtle` |
| `class` | Taxonomic class | `REPTILIA` |
| `conservation_status` | IUCN status | `EN` |
| `image_url` | High-quality image URL | `https://...` |
| `image_attribution` | Image source | `Wikimedia Commons` |
| `description` | 1-2 sentence description | `Large sea turtle...` |
| `habitat_type` | Habitat classification | `marine` |

### Ecoregion Names (EXACT MATCH REQUIRED)
```
- Coral Triangle
- Borneo
- Amazon and Guianas
- Congo Basin
- Arctic Terrestrial
- Madagascar
```

### Taxonomic Classes

**Marine Animals:**
- `ACTINOPTERYGII` - Ray-finned fish (most fish)
- `CHONDRICHTHYES` - Cartilaginous fish (sharks, rays)
- `REPTILIA` - Reptiles (sea turtles)
- `ANTHOZOA` - Corals
- `GASTROPODA` - Snails, slugs
- `BIVALVIA` - Clams, mussels
- `MALACOSTRACA` - Crabs, lobsters, shrimp

**Terrestrial Animals:**
- `MAMMALIA` - Mammals
- `AVES` - Birds
- `REPTILIA` - Reptiles
- `AMPHIBIA` - Amphibians
- `INSECTA` - Insects
- `ARACHNIDA` - Spiders, scorpions

**Plants:**
- `MAGNOLIOPSIDA` - Flowering plants
- `LILIOPSIDA` - Monocots
- `PINOPSIDA` - Conifers

### Conservation Status
```
LC = Least Concern
NT = Near Threatened
VU = Vulnerable
EN = Endangered
CR = Critically Endangered
EW = Extinct in the Wild
EX = Extinct
DD = Data Deficient
```

### Habitat Types
```
marine       - Ocean/sea species
terrestrial  - Land species
freshwater   - River/lake species
```

---

## Finding Images on Wikipedia

### 1. Search Wikipedia
Go to https://en.wikipedia.org and search for the species (e.g., "Clownfish")

### 2. Find the Image
Look for a high-quality photo in the Wikipedia article

### 3. Get Image URL
- Click the image
- Click "More details"
- Find a resolution like `1280px` (good balance of quality and file size)
- Right-click the image → Copy Image Address

### 4. Check License
Ensure it's:
- **Wikimedia Commons** (always free to use)
- **CC BY-SA** or **Public Domain** (free with attribution)
- **NOT** "Fair Use" (copyrighted, can't use)

### Image Requirements for Card Game
- ✅ **High resolution**: At least 800px wide
- ✅ **Clear subject**: Animal/plant is main focus
- ✅ **Good lighting**: Bright, well-lit
- ✅ **Distinctive features visible**: Can identify species by sight
- ✅ **Natural pose**: Not heavily cropped or edited
- ❌ **Avoid**: Blurry, dark, or multiple animals in frame

---

## Example Workflow

### Adding a New Marine Species to Coral Triangle

1. **Research on Wikipedia**
   - Go to https://en.wikipedia.org/wiki/Manta_ray
   - Read about the species
   - Note scientific name: `Mobula birostris` (updated taxonomy)
   - Note conservation status: Endangered (EN)

2. **Get Image**
   - Click the main image
   - Find 1280px version
   - Copy URL: `https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Manta_birostris-Thailand4.jpg/1280px-Manta_birostris-Thailand4.jpg`

3. **Add to CSV**
   ```csv
   Coral Triangle,Mobula birostris,Giant Manta Ray,CHONDRICHTHYES,EN,https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Manta_birostris-Thailand4.jpg/1280px-Manta_birostris-Thailand4.jpg,Wikimedia Commons,Largest ray species with wingspan up to 7 meters,marine
   ```

4. **Import**
   ```bash
   python3 scripts/import_curated_species.py
   ```

5. **Test**
   - Reload browser
   - Click Coral Triangle
   - See Giant Manta Ray in carousel!

---

## Batch Adding Species

### Bulk Import Template
Create entries for multiple species at once:

```csv
ecoregion_name,scientific_name,common_name,class,conservation_status,image_url,image_attribution,description,habitat_type
Borneo,Hylobates muelleri,Müller's Bornean Gibbon,MAMMALIA,EN,https://...,Wikimedia Commons,Small ape with loud dawn calls,terrestrial
Borneo,Rhabdophis chrysargos,Speckle-bellied Keelback,REPTILIA,LC,https://...,Wikimedia Commons,Non-venomous water snake,freshwater
Borneo,Buceros rhinoceros,Rhinoceros Hornbill,AVES,VU,https://...,Wikimedia Commons,Large bird with prominent casque on bill,terrestrial
```

### Pro Tips
- **Start with iconic species**: Clownfish, Orangutans, Jaguars
- **Mix taxonomic groups**: Don't add 20 fish in a row
- **Prioritize endangered species**: Educational value
- **Choose visually distinct species**: Easier for card game
- **Add 10-20 species per ecoregion minimum**

---

## Card Game Image Requirements

Since players must **recognize species by image only** (no names shown), images must be:

### ✅ DO
- Use close-up shots showing distinctive features
- Choose photos with good contrast and lighting
- Select images with single animal in focus
- Pick images showing iconic poses/behaviors
- Use photos that show coloration clearly

### ❌ DON'T
- Use images with multiple species visible
- Use backlit or silhouetted photos
- Use extreme close-ups (can't tell what it is)
- Use black & white photos
- Use drawings or illustrations (use real photos)

---

## Current Status

### Species Count by Ecoregion
- **Coral Triangle**: 8 marine species (target: 20+)
- **Borneo**: 4 terrestrial species (target: 15+)
- **Amazon and Guianas**: 4 species (target: 15+)
- **Congo Basin**: 3 species (target: 15+)
- **Arctic Terrestrial**: 3 species (target: 10+)
- **Madagascar**: 0 species (target: 15+)

### Suggested Next Steps
1. **Coral Triangle**: Add more reef fish (Parrotfish, Butterflyfish, etc.)
2. **Borneo**: Add birds (Hornbills, Kingfishers) and reptiles
3. **Amazon**: Add more mammals (Tapir, Capybara) and reptiles (Anaconda)
4. **Congo**: Add more primates and birds
5. **Madagascar**: Start with lemurs and chameleons!

---

## Troubleshooting

### "Ecoregion not found"
- Check spelling exactly matches database name
- Use `Amazon and Guianas` not `Amazon`
- Use `Arctic Terrestrial` not `Arctic`

### "Species already exists"
- Script will update existing species with new image/description
- This is normal and expected

### "Image not loading in browser"
- Check URL is correct (copy/paste directly from Wikipedia)
- Ensure URL is HTTPS
- Try opening URL in browser to verify it works

### "Species not appearing in carousel"
- Check `habitat_type` matches ecoregion (marine for Coral Triangle)
- Ensure `is_marine`, `is_terrestrial`, `is_freshwater` flags are correct
- Verify species has a common_name (required for display)

---

## Future: Card Matching Game Design

Players will see **4-6 cards** with just images (no names).

**Example Challenge:**
```
Question: "Which species lives in the Coral Triangle?"

[Image: Polar Bear]  [Image: Clownfish]  [Image: Jaguar]  [Image: Gorilla]

Correct Answer: Clownfish
```

**Educational Value:**
- Visual recognition training
- Geographic distribution learning
- Conservation awareness
- Field biologist skills

**Image quality is critical for this feature!**

---

## Questions?

- Check available ecoregions: See import script output
- Need more examples: Look at existing curated_species_database.csv
- Technical issues: Check console logs when running import script
