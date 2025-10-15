#!/usr/bin/env python3
"""
Update Coral Triangle realm to 'Marine' for better habitat classification
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🌊 Updating Coral Triangle Realm to Marine\n')
print('=' * 70)

# Check current value
current = supabase.table('ecoregions').select('*').eq('name', 'Coral Triangle').single().execute()
print(f'\nCurrent Coral Triangle data:')
print(f'  Name: {current.data["name"]}')
print(f'  Realm: {current.data["realm"]}')
print(f'  Biome: {current.data["biome"]}')

# Update to Marine
result = supabase.table('ecoregions')\
    .update({'realm': 'Marine'})\
    .eq('name', 'Coral Triangle')\
    .execute()

print(f'\n✅ Updated Coral Triangle realm to "Marine"')

# Verify
updated = supabase.table('ecoregions').select('*').eq('name', 'Coral Triangle').single().execute()
print(f'\nUpdated Coral Triangle data:')
print(f'  Name: {updated.data["name"]}')
print(f'  Realm: {updated.data["realm"]}')
print(f'  Biome: {updated.data["biome"]}')

print('\n' + '=' * 70)
print('✅ Done! Now Coral Triangle will prioritize marine species.')
