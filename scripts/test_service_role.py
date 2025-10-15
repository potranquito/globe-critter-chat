#!/usr/bin/env python3
"""Test if service role key bypasses RLS"""

import os
from dotenv import load_dotenv
from supabase import create_client
import jwt

load_dotenv()

url = os.getenv('VITE_SUPABASE_URL')
service_key = os.getenv('VITE_SUPABASE_SERVICE_KEY')
anon_key = os.getenv('VITE_SUPABASE_ANON_KEY')

print('🔍 Checking Supabase Keys\n')
print('=' * 60)

# Decode and check service key
print('\n📋 Service Key:')
print(f'   Key: {service_key[:50]}...')
try:
    decoded = jwt.decode(service_key, options={"verify_signature": False})
    print(f'   Role: {decoded.get("role")}')
    print(f'   Issued: {decoded.get("iat")}')
    print(f'   Project: {decoded.get("ref")}')
except Exception as e:
    print(f'   ❌ Error decoding: {e}')

print('\n📋 Anon Key:')
print(f'   Key: {anon_key[:50]}...')
try:
    decoded = jwt.decode(anon_key, options={"verify_signature": False})
    print(f'   Role: {decoded.get("role")}')
except Exception as e:
    print(f'   ❌ Error decoding: {e}')

print('\n' + '=' * 60)

# Test connection
print('\n🧪 Testing Connection with Service Key\n')

try:
    supabase = create_client(url, service_key)

    # Try to insert a test species
    test_species = {
        'scientific_name': 'Test species',
        'common_name': 'Test',
        'iucn_id': 99999999,
        'conservation_status': 'Test',
        'sample_points': [{"lat": 0, "lon": 0}]
    }

    print('   Attempting insert...')
    result = supabase.table('species').insert(test_species).execute()
    print(f'   ✅ Insert successful! ID: {result.data[0]["id"]}')

    # Clean up
    print('   Cleaning up test record...')
    supabase.table('species').delete().eq('iucn_id', 99999999).execute()
    print('   ✅ Cleanup successful')

except Exception as e:
    print(f'   ❌ Error: {e}')
    error_dict = str(e)
    if '42501' in error_dict:
        print('\n⚠️  RLS is still blocking the insert!')
        print('   The service role key should bypass RLS, but it\'s not working.')
        print('   This might be a Supabase client configuration issue.')
    print('\n💡 Recommended Solution:')
    print('   Apply the migration SQL via Supabase Dashboard SQL Editor:')
    print('   https://supabase.com/dashboard/project/iwmbvpdqwekgxegaxrhr/sql')

print('\n' + '=' * 60)
