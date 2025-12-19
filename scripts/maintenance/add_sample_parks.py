#!/usr/bin/env python3
"""
Add sample parks for each of the 6 ecoregions
These are well-known, major protected areas that will show up on the map
"""

import os
import sys
from supabase import create_client

# Configuration
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing environment variables")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Sample parks for each ecoregion (3 major parks each)
SAMPLE_PARKS = [
    # Amazon and Guianas
    {
        "name": "Yasuní National Park",
        "country": "Ecuador",
        "center_lat": -0.9,
        "center_lng": -75.4,
        "ecoregion_name": "Amazon and Guianas",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 9820,
        "description": "One of the most biodiverse places on Earth"
    },
    {
        "name": "Manu National Park",
        "country": "Peru",
        "center_lat": -12.2,
        "center_lng": -71.4,
        "ecoregion_name": "Amazon and Guianas",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 15328,
        "description": "UNESCO World Heritage Site protecting Amazon rainforest"
    },
    {
        "name": "Jaú National Park",
        "country": "Brazil",
        "center_lat": -1.9,
        "center_lng": -61.8,
        "ecoregion_name": "Amazon and Guianas",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 22720,
        "description": "Largest forest reserve in South America"
    },

    # Arctic Terrestrial
    {
        "name": "Northeast Greenland National Park",
        "country": "Greenland",
        "center_lat": 76.0,
        "center_lng": -30.0,
        "ecoregion_name": "Arctic Terrestrial",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 972000,
        "description": "World's largest national park"
    },
    {
        "name": "Quttinirpaaq National Park",
        "country": "Canada",
        "center_lat": 82.0,
        "center_lng": -70.0,
        "ecoregion_name": "Arctic Terrestrial",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 37775,
        "description": "Canada's most northern national park"
    },
    {
        "name": "Vatnajökull National Park",
        "country": "Iceland",
        "center_lat": 64.4,
        "center_lng": -16.8,
        "ecoregion_name": "Arctic Terrestrial",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 14141,
        "description": "Europe's largest national park with glaciers"
    },

    # Borneo
    {
        "name": "Kinabalu Park",
        "country": "Malaysia",
        "center_lat": 6.08,
        "center_lng": 116.55,
        "ecoregion_name": "Borneo",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 754,
        "description": "UNESCO World Heritage Site, home to Mount Kinabalu"
    },
    {
        "name": "Gunung Mulu National Park",
        "country": "Malaysia",
        "center_lat": 4.05,
        "center_lng": 114.9,
        "ecoregion_name": "Borneo",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 528,
        "description": "Spectacular karst formations and caves"
    },
    {
        "name": "Tanjung Puting National Park",
        "country": "Indonesia",
        "center_lat": -2.8,
        "center_lng": 111.9,
        "ecoregion_name": "Borneo",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 4150,
        "description": "Famous for orangutan rehabilitation"
    },

    # Congo Basin
    {
        "name": "Salonga National Park",
        "country": "Democratic Republic of Congo",
        "center_lat": -2.0,
        "center_lng": 21.5,
        "ecoregion_name": "Congo Basin",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 33350,
        "description": "Africa's largest tropical rainforest reserve"
    },
    {
        "name": "Virunga National Park",
        "country": "Democratic Republic of Congo",
        "center_lat": -0.92,
        "center_lng": 29.68,
        "ecoregion_name": "Congo Basin",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 7769,
        "description": "Home to mountain gorillas"
    },
    {
        "name": "Nouabalé-Ndoki National Park",
        "country": "Republic of Congo",
        "center_lat": 2.2,
        "center_lng": 16.5,
        "ecoregion_name": "Congo Basin",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 3921,
        "description": "Pristine rainforest with forest elephants"
    },

    # Coral Triangle
    {
        "name": "Tubbataha Reefs Natural Park",
        "country": "Philippines",
        "center_lat": 8.96,
        "center_lng": 119.86,
        "ecoregion_name": "Coral Triangle",
        "designation_eng": "Natural Park",
        "iucn_category": "II",
        "gis_area_km2": 1300,
        "marine_area_km2": 1300,
        "description": "UNESCO World Heritage marine sanctuary"
    },
    {
        "name": "Raja Ampat Marine Reserve",
        "country": "Indonesia",
        "center_lat": -1.5,
        "center_lng": 130.5,
        "ecoregion_name": "Coral Triangle",
        "designation_eng": "Marine Reserve",
        "iucn_category": "IV",
        "gis_area_km2": 4600,
        "marine_area_km2": 4600,
        "description": "Epicenter of marine biodiversity"
    },
    {
        "name": "Kimbe Bay Marine Reserve",
        "country": "Papua New Guinea",
        "center_lat": -5.5,
        "center_lng": 150.1,
        "ecoregion_name": "Coral Triangle",
        "designation_eng": "Marine Reserve",
        "iucn_category": "IV",
        "gis_area_km2": 800,
        "marine_area_km2": 800,
        "description": "Spectacular coral reefs and dive sites"
    },

    # Madagascar
    {
        "name": "Masoala National Park",
        "country": "Madagascar",
        "center_lat": -15.7,
        "center_lng": 50.0,
        "ecoregion_name": "Madagascar",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 2300,
        "description": "Madagascar's largest protected area"
    },
    {
        "name": "Ranomafana National Park",
        "country": "Madagascar",
        "center_lat": -21.3,
        "center_lng": 47.45,
        "ecoregion_name": "Madagascar",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 416,
        "description": "Critical habitat for rare lemurs"
    },
    {
        "name": "Andasibe-Mantadia National Park",
        "country": "Madagascar",
        "center_lat": -18.9,
        "center_lng": 48.4,
        "ecoregion_name": "Madagascar",
        "designation_eng": "National Park",
        "iucn_category": "II",
        "gis_area_km2": 155,
        "description": "Home to the indri lemur"
    }
]

def get_ecoregion_id(name):
    """Get ecoregion ID by name"""
    result = supabase.from_('ecoregions').select('id').eq('name', name).execute()
    if result.data:
        return result.data[0]['id']
    return None

def main():
    print("🏞️  Adding sample parks to database...\n")

    added_count = 0

    for park in SAMPLE_PARKS:
        try:
            # Get ecoregion ID
            ecoregion_id = get_ecoregion_id(park['ecoregion_name'])

            if not ecoregion_id:
                print(f"  ⚠️  Ecoregion not found: {park['ecoregion_name']}")
                continue

            # Insert park
            park_data = {
                'name': park['name'],
                'country': park['country'],
                'center_lat': park['center_lat'],
                'center_lng': park['center_lng'],
                'ecoregion_id': ecoregion_id,
                'park_type': park.get('designation_eng'),  # Using park_type instead of designation_eng
                'protection_status': park.get('iucn_category'),  # Using protection_status
                'size_km2': park.get('gis_area_km2'),  # Using size_km2 instead of gis_area_km2
                'description': park.get('description')
            }

            result = supabase.from_('parks').insert(park_data).execute()

            if result.data:
                added_count += 1
                print(f"  ✓ Added: {park['name']} ({park['ecoregion_name']})")
            else:
                print(f"  ✗ Failed: {park['name']}")

        except Exception as e:
            print(f"  ✗ Error adding {park['name']}: {str(e)}")

    print(f"\n✅ Added {added_count} parks successfully!")
    print(f"\n📊 Parks by ecoregion:")

    # Count parks per ecoregion
    ecoregions = supabase.from_('ecoregions').select('id, name').execute()
    for eco in ecoregions.data:
        count = supabase.from_('parks').select('*', count='exact').eq('ecoregion_id', eco['id']).execute().count or 0
        print(f"  {eco['name']}: {count} parks")

    print("\n🎯 Next: Refresh your browser and click on an ecoregion!")

if __name__ == '__main__':
    main()
