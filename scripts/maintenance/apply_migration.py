#!/usr/bin/env python3

"""
Apply the dietary category migration to Supabase database
"""

import os
import sys
from dotenv import load_dotenv

# Try to import supabase
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    print('⚠️  supabase-py not installed. Install with: pip install supabase')

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌ Missing Supabase credentials in .env file')
    sys.exit(1)

if not HAS_SUPABASE:
    print('\n📋 Migration instructions:')
    print('=' * 50)
    print('Since supabase-py is not installed, please apply the migration manually:')
    print('\n1. Using Supabase Dashboard (Recommended):')
    print('   - Go to https://supabase.com/dashboard')
    print('   - Open SQL Editor')
    print('   - Copy contents of: supabase/migrations/20251016000001_add_dietary_category.sql')
    print('   - Paste and run')
    print('\n2. Using Supabase CLI:')
    print('   npm install -g supabase')
    print('   supabase db push')
    print('\n3. Using psql:')
    print(f'   psql -h db.iwmbvpdqwekgxegaxrhr.supabase.co -U postgres -d postgres -f supabase/migrations/20251016000001_add_dietary_category.sql')
    print('=' * 50)
    sys.exit(1)

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def main():
    print('🚀 Checking dietary category migration status...\n')

    # Check if column exists
    print('🔍 Checking if dietary_category column exists...')
    try:
        result = supabase.table('species').select('dietary_category').limit(1).execute()
        print('✅ Column dietary_category exists!\n')
    except Exception as e:
        print(f'❌ Column does not exist or cannot be accessed: {e}')
        print('\n📋 To apply the migration:')
        print('   1. Supabase Dashboard > SQL Editor > Run migration file')
        print('   2. Or use: supabase db push\n')
        sys.exit(1)

    # Check data population
    print('📊 Checking dietary category distribution...')
    try:
        categories = ['Carnivore', 'Herbivore', 'Omnivore', 'Producer']
        distribution = {}

        for category in categories:
            result = supabase.table('species').select('*', count='exact').eq('dietary_category', category).execute()
            count = result.count
            distribution[category] = count

        total = sum(distribution.values())
        print('-----------------------------------')
        print(f'📊 Total classified: {total}')
        print(f'🦁 Carnivores: {distribution["Carnivore"]}')
        print(f'🦌 Herbivores: {distribution["Herbivore"]}')
        print(f'🐻 Omnivores: {distribution["Omnivore"]}')
        print(f'🌿 Producers: {distribution["Producer"]}')
        print('-----------------------------------\n')

        print('✅ Migration is active!\n')

    except Exception as e:
        print(f'❌ Error: {e}\n')
        sys.exit(1)

    print('🎉 Next steps:')
    print('   1. Deploy Edge Function: supabase functions deploy discover-region-species')
    print('   2. Build frontend: npm run build')
    print('   3. Test locally: npm run dev\n')

if __name__ == '__main__':
    main()
