#!/usr/bin/env python3
"""
Add Wikipedia images to Borneo ecoregion and parks
"""

import os
from supabase import create_client, Client

# Supabase connection
SUPABASE_URL = "https://iwmbvpdqwekgxegaxrhr.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Ecoregion data
ecoregion_data = {
    "name": "Borneo",
    "image_url": "https://upload.wikimedia.org/wikipedia/commons/d/d4/Dipterocarp_Forest_at_Danum_Valley_%2813997709808%29.jpg",
    "image_attribution": "Primary lowland forest at Danum Valley, Sabah (Wikimedia Commons)"
}

# Park data with Wikipedia images
parks_data = [
    {
        "name": "Tanjung Puting National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6c/Tanjung-Puting90153.jpg",
        "image_attribution": "Vegetation at Sekonyer river, Tanjung Puting (Wikimedia Commons)"
    },
    {
        "name": "Tubbataha Reefs Natural Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/e/e1/Tubbataha_Shark.jpg",
        "image_attribution": "Whitetip reef shark at Tubbataha (Wikimedia Commons)"
    },
    {
        "name": "Kinabalu Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/0/0a/Mount_kinabalu_01.png",
        "image_attribution": "Mount Kinabalu, highest mountain on Borneo (Wikimedia Commons)"
    },
    {
        "name": "Gunung Mulu National Park",
        "image_url": "https://upload.wikimedia.org/wikipedia/commons/6/6e/Mulu.JPG",
        "image_attribution": "Mount Mulu viewed from a distance (Wikimedia Commons)"
    }
]

def update_ecoregion_image():
    """Update Borneo ecoregion with Wikipedia image"""

    print("🌍 Updating Borneo ecoregion image...\n")

    # Find the ecoregion by name
    result = supabase.table('ecoregions').select('id, name').ilike('name', f'%{ecoregion_data["name"]}%').execute()

    if not result.data:
        print(f"❌ Ecoregion not found: {ecoregion_data['name']}")
        return

    ecoregion_id = result.data[0]['id']
    found_name = result.data[0]['name']

    # Update the ecoregion with image data
    update_result = supabase.table('ecoregions').update({
        'image_url': ecoregion_data['image_url'],
        'image_attribution': ecoregion_data['image_attribution']
    }).eq('id', ecoregion_id).execute()

    if update_result.data:
        print(f"✅ Updated ecoregion: {found_name}")
        print(f"   Image: {ecoregion_data['image_url']}")
        print(f"   Attribution: {ecoregion_data['image_attribution']}\n")
    else:
        print(f"❌ Failed to update ecoregion: {found_name}\n")

def update_park_images():
    """Update parks with Wikipedia images"""

    print("🖼️  Updating Borneo park images from Wikipedia...\n")

    for park_data in parks_data:
        park_name = park_data["name"]

        # Find the park by name
        result = supabase.table('parks').select('id, name').ilike('name', f'%{park_name}%').execute()

        if not result.data:
            print(f"❌ Park not found: {park_name}")
            continue

        park_id = result.data[0]['id']
        found_name = result.data[0]['name']

        # Update the park with image data
        update_result = supabase.table('parks').update({
            'image_url': park_data['image_url'],
            'image_attribution': park_data['image_attribution']
        }).eq('id', park_id).execute()

        if update_result.data:
            print(f"✅ Updated: {found_name}")
            print(f"   Image: {park_data['image_url']}")
            print(f"   Attribution: {park_data['image_attribution']}\n")
        else:
            print(f"❌ Failed to update: {found_name}\n")

    print("✨ Done! Park images updated.")

if __name__ == "__main__":
    update_ecoregion_image()
    update_park_images()
