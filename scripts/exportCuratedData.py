#!/usr/bin/env python3
"""
Export enriched species data to TypeScript format for curated dataset
"""

import os
import sys
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

def init_supabase():
    url = os.getenv('VITE_SUPABASE_URL')
    key = os.getenv('VITE_SUPABASE_SERVICE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')
    return create_client(url, key)

def main():
    supabase = init_supabase()

    # Get Arctic Tundra species (the ones we enriched)
    response = supabase.table('species').select(
        'scientific_name, common_name, class, conservation_status, image_url'
    ).in_('scientific_name', [
        'Rangifer tarandus',
        'Ranunculus allenii',
        'Claytonia tuberosa',
        'Schoenoplectus tabernaemontani'
    ]).not_.is_('common_name', 'null').limit(10).execute()

    species_data = []
    for sp in response.data:
        species_data.append({
            'scientificName': sp['scientific_name'],
            'commonName': sp['common_name'],
            'class': sp['class'],
            'conservationStatus': sp['conservation_status'] or 'NE',
            'imageUrl': sp['image_url'] or '',
            'regions': ['Arctic Tundra']
        })

    print('Arctic Tundra Species Data:')
    print(json.dumps(species_data, indent=2))

if __name__ == '__main__':
    main()
