#!/usr/bin/env python3
"""Search WDPA shapefiles for specific parks"""

import sys
import geopandas as gpd
from pathlib import Path

shapefile_dir = Path('/home/potranquito/Downloads/protected-regions')
print('🔍 Searching WDPA Shapefiles for Missing Parks\n')
print('=' * 70)

# Target parks we're looking for
target_parks = {
    'Arctic/Alaska': [
        'arctic national wildlife refuge',
        'gates of the arctic',
        'tallurutiup imanga'
    ],
    'Amazon': [
        'manu national park',
        'manu',
        'jau national park',
        'jaú',
        'yasuni national park',
        'yasuní'
    ]
}

# Search both polygon and point shapefiles
shapefiles = [
    shapefile_dir / 'WDPA_Oct2025_Public_shp-polygons.shp',
    shapefile_dir / 'WDPA_Oct2025_Public_shp-points.shp'
]

for shapefile in shapefiles:
    if not shapefile.exists():
        print(f'❌ Shapefile not found: {shapefile}')
        continue

    print(f'\n📦 Searching: {shapefile.name}')
    print(f'   Loading shapefile...')

    try:
        gdf = gpd.read_file(shapefile)
        print(f'   Total features: {len(gdf):,}')

        for region, search_terms in target_parks.items():
            print(f'\n   🔎 Searching for {region} parks:')

            for term in search_terms:
                # Case-insensitive search in NAME field
                matches = gdf[gdf['NAME'].str.lower().str.contains(term, na=False)]

                if len(matches) > 0:
                    print(f'      ✅ Found "{term}": {len(matches)} match(es)')
                    for idx, row in matches.iterrows():
                        area = row.get('GIS_AREA', row.get('REP_AREA', 0))
                        print(f'         - {row["NAME"]}')
                        print(f'           WDPA_PID: {row.get("WDPA_PID", "N/A")}')
                        print(f'           Area: {area:,.1f} km²')
                        print(f'           Country: {row.get("ISO3", "N/A")}')
                        print(f'           Status: {row.get("STATUS", "N/A")}')
                        if idx < 3:  # Only show first 3 matches
                            continue
                        else:
                            print(f'         ... and {len(matches) - 3} more')
                            break
                else:
                    print(f'      ❌ Not found: "{term}"')

    except Exception as e:
        print(f'   ❌ Error reading shapefile: {e}')

print('\n' + '=' * 70)
print('Search complete!')
