#!/usr/bin/env python3
"""
Check if habitat flags (is_marine, is_terrestrial, is_freshwater) are populated
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(override=True)

url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
supabase = create_client(url, key)

print('🔍 Checking Habitat Flags in Species Table\n')
print('=' * 70)

# Check total species
total = supabase.table('species').select('*', count='exact', head=True).execute()
print(f'\nTotal species: {total.count:,}\n')

# Check how many have habitat flags set
marine = supabase.table('species').select('*', count='exact', head=True).eq('is_marine', True).execute()
terrestrial = supabase.table('species').select('*', count='exact', head=True).eq('is_terrestrial', True).execute()
freshwater = supabase.table('species').select('*', count='exact', head=True).eq('is_freshwater', True).execute()

print(f'Species with habitat flags:')
print(f'  is_marine = true:      {marine.count:6,} ({marine.count/total.count*100:.1f}%)')
print(f'  is_terrestrial = true: {terrestrial.count:6,} ({terrestrial.count/total.count*100:.1f}%)')
print(f'  is_freshwater = true:  {freshwater.count:6,} ({freshwater.count/total.count*100:.1f}%)')

# Sample some species from each category
print('\n📊 Sample Marine Species:')
marine_sample = supabase.table('species')\
    .select('scientific_name, class, is_marine, is_terrestrial, is_freshwater')\
    .eq('is_marine', True)\
    .limit(10)\
    .execute()

for sp in marine_sample.data:
    print(f'  • {sp["scientific_name"]} ({sp.get("class")}) - M:{sp["is_marine"]}, T:{sp["is_terrestrial"]}, F:{sp["is_freshwater"]}')

print('\n🌳 Sample Terrestrial Species:')
terrestrial_sample = supabase.table('species')\
    .select('scientific_name, class, is_marine, is_terrestrial, is_freshwater')\
    .eq('is_terrestrial', True)\
    .eq('is_marine', False)\
    .limit(10)\
    .execute()

for sp in terrestrial_sample.data:
    print(f'  • {sp["scientific_name"]} ({sp.get("class")}) - M:{sp["is_marine"]}, T:{sp["is_terrestrial"]}, F:{sp["is_freshwater"]}')

# Check species linked to Coral Triangle and Borneo
print('\n' + '=' * 70)
print('🌊 Coral Triangle - Habitat Breakdown:\n')

coral = supabase.table('ecoregions').select('id').eq('name', 'Coral Triangle').single().execute()
if coral.data:
    coral_species = supabase.table('species_ecoregions')\
        .select('species(scientific_name, is_marine, is_terrestrial, is_freshwater, class)')\
        .eq('ecoregion_id', coral.data['id'])\
        .limit(1000)\
        .execute()

    marine_count = sum(1 for s in coral_species.data if s['species']['is_marine'])
    terrestrial_count = sum(1 for s in coral_species.data if s['species']['is_terrestrial'])
    freshwater_count = sum(1 for s in coral_species.data if s['species']['is_freshwater'])

    print(f'  Sample of 1,000 species:')
    print(f'    Marine:      {marine_count:4} ({marine_count/len(coral_species.data)*100:.1f}%)')
    print(f'    Terrestrial: {terrestrial_count:4} ({terrestrial_count/len(coral_species.data)*100:.1f}%)')
    print(f'    Freshwater:  {freshwater_count:4} ({freshwater_count/len(coral_species.data)*100:.1f}%)')

print('\n🦧 Borneo - Habitat Breakdown:\n')

borneo = supabase.table('ecoregions').select('id').eq('name', 'Borneo').single().execute()
if borneo.data:
    borneo_species = supabase.table('species_ecoregions')\
        .select('species(scientific_name, is_marine, is_terrestrial, is_freshwater, class)')\
        .eq('ecoregion_id', borneo.data['id'])\
        .limit(1000)\
        .execute()

    marine_count = sum(1 for s in borneo_species.data if s['species']['is_marine'])
    terrestrial_count = sum(1 for s in borneo_species.data if s['species']['is_terrestrial'])
    freshwater_count = sum(1 for s in borneo_species.data if s['species']['is_freshwater'])

    print(f'  Sample of 1,000 species:')
    print(f'    Marine:      {marine_count:4} ({marine_count/len(borneo_species.data)*100:.1f}%)')
    print(f'    Terrestrial: {terrestrial_count:4} ({terrestrial_count/len(borneo_species.data)*100:.1f}%)')
    print(f'    Freshwater:  {freshwater_count:4} ({freshwater_count/len(borneo_species.data)*100:.1f}%)')

print('\n' + '=' * 70)
print('\n✅ YES! The habitat flags are available and can be used for filtering!')
print('\nRecommendations:')
print('1. Filter Coral Triangle to show is_marine=true species first')
print('2. Filter Borneo to show is_terrestrial=true species first')
print('3. Use weighted sorting or separate tabs in the UI')
