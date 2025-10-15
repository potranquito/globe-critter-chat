#!/usr/bin/env python3
"""
Enrich species CSV with missing data using OpenAI

This script:
1. Reads your CSV with species data
2. For each species, uses OpenAI to lookup:
   - Common name (if missing)
   - Taxonomic class (MAMMALIA, AVES, etc.)
   - IUCN conservation status (LC, EN, VU, CR, etc.)
3. Outputs enriched CSV ready for import

Usage:
    python scripts/enrich_species_csv.py INPUT.csv OUTPUT.csv
"""

import os
import sys
import csv
import time
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(override=True)

def enrich_species(scientific_name, common_name, description):
    """Use OpenAI to enrich species data"""

    api_key = os.getenv('VITE_OPENAI_API_KEY')
    if not api_key or api_key.startswith('your-'):
        print("❌ OpenAI API key not found in .env")
        return None

    client = OpenAI(api_key=api_key)

    prompt = f"""
Given this species information:
Scientific name: {scientific_name}
Common name: {common_name or 'Unknown'}
Description: {description[:500] if description else 'N/A'}

Please provide ONLY this information in the EXACT format shown (no extra text):

Common Name: [English common name]
Class: [One of: MAMMALIA, AVES, REPTILIA, AMPHIBIA, ACTINOPTERYGII, CHONDRICHTHYES, INSECTA, ANTHOZOA, GASTROPODA, BIVALVIA, MALACOSTRACA, MAGNOLIOPSIDA]
Conservation Status: [One of: LC, NT, VU, EN, CR, EW, EX, DD]

Examples:
- Panthera onca → MAMMALIA, EN
- Ara macao → AVES, LC
- Chelonia mydas → REPTILIA, EN
- Rhincodon typus → CHONDRICHTHYES, EN
- Acropora millepora → ANTHOZOA, NT

Be accurate with the taxonomic class and current IUCN status.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a marine biology and taxonomy expert. Provide accurate species data in the exact format requested."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,  # Low temperature for factual accuracy
            max_tokens=100
        )

        result = response.choices[0].message.content.strip()

        # Parse response
        lines = result.split('\n')
        data = {}
        for line in lines:
            if ':' in line:
                key, value = line.split(':', 1)
                data[key.strip()] = value.strip()

        return {
            'common_name': data.get('Common Name', common_name or scientific_name),
            'class': data.get('Class', 'ACTINOPTERYGII'),
            'conservation_status': data.get('Conservation Status', 'LC')
        }

    except Exception as e:
        print(f"   ⚠️  Error: {e}")
        return None

def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/enrich_species_csv.py INPUT.csv OUTPUT.csv")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    print(f"🔬 Enriching species data from {input_file}...")
    print(f"📝 Output will be saved to {output_file}\n")

    # Read input CSV
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Filter out empty rows
    rows = [r for r in rows if r.get('ecoregion')]

    print(f"📊 Found {len(rows)} species to enrich\n")

    # Enrich each row
    enriched_rows = []
    for i, row in enumerate(rows, 1):
        scientific_name = row.get('scientific_name', '')
        common_name = row.get('common_name', '')
        description = row.get('description', '')

        print(f"[{i}/{len(rows)}] {scientific_name or 'Unknown'}")

        if not scientific_name:
            print("   ⚠️  No scientific name, skipping")
            continue

        # Check if already has all data
        if common_name and row.get('class') and row.get('conservation_status'):
            print("   ✓ Already has all data, keeping as-is")
            enriched_rows.append(row)
            continue

        # Enrich via OpenAI
        enriched = enrich_species(scientific_name, common_name, description)

        if enriched:
            row['common_name'] = enriched['common_name']
            row['class'] = enriched['class']
            row['conservation_status'] = enriched['conservation_status']
            print(f"   ✅ {enriched['common_name']} - {enriched['class']} - {enriched['conservation_status']}")
        else:
            # Fallback defaults
            row['common_name'] = common_name or scientific_name
            row['class'] = 'ACTINOPTERYGII'  # Default to fish
            row['conservation_status'] = 'LC'
            print(f"   ⚠️  Using defaults")

        enriched_rows.append(row)

        # Rate limiting (OpenAI has limits)
        if i % 10 == 0:
            print("   ⏸️  Pausing 5 seconds to avoid rate limits...")
            time.sleep(5)
        else:
            time.sleep(0.5)  # Small delay between requests

    # Write output CSV with new columns
    fieldnames = ['ecoregion', 'scientific_name', 'common_name', 'class', 'conservation_status',
                  'habitat_type', 'image_url', 'attribution', 'description']

    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for row in enriched_rows:
            # Ensure all fields exist
            output_row = {field: row.get(field, '') for field in fieldnames}
            writer.writerow(output_row)

    print(f"\n{'='*70}")
    print(f"✅ Enrichment complete!")
    print(f"📄 Enriched data saved to: {output_file}")
    print(f"📊 {len(enriched_rows)} species enriched")
    print(f"\n💡 Next step: python scripts/import_curated_species.py")

if __name__ == '__main__':
    main()
