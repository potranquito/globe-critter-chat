#!/usr/bin/env python3
"""
Check for duplicate examples in MAMMALS shapefile
"""
import zipfile
import tempfile
from pathlib import Path
import fiona
from collections import defaultdict

shapefile_path = Path.home() / 'Downloads' / 'Animal Zips' / 'MAMMALS.zip'

print("🔍 Analyzing MAMMALS.zip for duplicate variants...\n")

with tempfile.TemporaryDirectory() as temp_dir:
    extract_dir = Path(temp_dir) / 'mammals'

    # Extract
    print("Extracting...")
    with zipfile.ZipFile(shapefile_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)

    # Find shapefile
    shp_file = None
    for shp in extract_dir.rglob('*.shp'):
        shp_file = shp
        break

    if not shp_file:
        print("No shapefile found")
        exit(1)

    print(f"Reading: {shp_file.name}\n")

    # Track variants
    variant_map = defaultdict(list)

    with fiona.open(shp_file, 'r') as src:
        for idx, feature in enumerate(src):
            if idx >= 5000:  # Sample first 5000 to speed up
                break

            props = feature['properties']

            # Create variant key
            iucn_id = props.get('id_no')
            subspecies = props.get('subspecies') if props.get('subspecies') not in ('None', '0', 0, None) else ''
            subpop = props.get('subpop') if props.get('subpop') not in ('None', '0', 0, None) else ''
            presence = props.get('presence') if props.get('presence') not in (None, '') else 0
            seasonal = props.get('seasonal') if props.get('seasonal') not in (None, '') else 0

            variant_key = (iucn_id, subspecies, subpop, presence, seasonal)

            # Store the record info
            variant_map[variant_key].append({
                'idx': idx,
                'scientific_name': props.get('sci_name'),
                'iucn_id': iucn_id,
                'subspecies': subspecies,
                'subpopulation': subpop,
                'presence': presence,
                'seasonal': seasonal
            })

    # Find duplicates
    duplicates_found = 0
    examples_shown = 0

    print("=" * 80)
    print("DUPLICATE VARIANT EXAMPLES")
    print("=" * 80)

    for variant_key, records in variant_map.items():
        if len(records) > 1:
            duplicates_found += len(records) - 1

            if examples_shown < 5:  # Show first 5 examples
                print(f"\n🔄 DUPLICATE SET #{examples_shown + 1}:")
                print(f"   Appears {len(records)} times in the file")
                first = records[0]
                print(f"   Species: {first['scientific_name']}")
                print(f"   IUCN ID: {first['iucn_id']}")
                print(f"   Subspecies: '{first['subspecies']}'")
                print(f"   Subpopulation: '{first['subpopulation']}'")
                print(f"   Presence: {first['presence']}")
                print(f"   Seasonal: {first['seasonal']}")
                print(f"   Record indices: {[r['idx'] for r in records]}")
                examples_shown += 1

    print("\n" + "=" * 80)
    print(f"📊 SUMMARY (first 5,000 features analyzed)")
    print("=" * 80)
    print(f"Total duplicate records found: {duplicates_found}")
    print(f"Unique variants: {len(variant_map)}")
    print(f"Total records: {sum(len(v) for v in variant_map.values())}")

    if duplicates_found == 0:
        print("\n✅ NO DUPLICATES FOUND - All records are unique!")
        print("The 9,576 'duplicates' may be:")
        print("  1. Different geographic polygons for the same variant")
        print("  2. Or my deduplication logic might be too aggressive")
