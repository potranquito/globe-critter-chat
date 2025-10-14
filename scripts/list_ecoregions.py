#!/usr/bin/env python3
"""List all WWF ecoregions in database"""

import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌍 WWF Ecoregions in Database\n')
print('=' * 70)

response = supabase.table('ecoregions').select('*').execute()
ecoregions = response.data

print(f'Found {len(ecoregions)} ecoregions\n')

for eco in ecoregions:
    print(f'{eco["name"]}')
    print(f'  Realm: {eco.get("realm", "N/A")}')
    print(f'  Biome: {eco.get("biome", "N/A")}')
    print(f'  Center: ({eco.get("center_lat", "N/A")}, {eco.get("center_lng", "N/A")})')
    print(f'  Radius: {eco.get("radius_km", "N/A")} km')
    print()
