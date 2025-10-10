# Implementation Plan: Transparent Green Rings Around Habitat Pins

## Current Status
✅ All filter and carousel functionality working
✅ Locations filter auto-activates and shows first
✅ Persistent pins (stay until Reset clicked)
✅ Filter banner and carousels working for all searches

## Next Task: Add Transparent Green Rings Around Habitat Pins

### Goal
Add semi-transparent green circular overlays around species habitat pins to show approximate range/influence area.

### Implementation Steps

1. **Modify Globe Component** (`src/components/Globe.tsx`)
   - Check if Globe.gl supports polygon/circle overlays
   - Add a `polygonsData` prop to render circular areas
   - Configure styling: semi-transparent green (#10B981 with 20% opacity)

2. **Update Index.tsx**
   - For species searches (polar bear, etc.), create circle data alongside habitat pins
   - Each habitat point gets a corresponding circle overlay
   - Circle radius: ~100-200km (adjustable)

3. **Styling**
   - Color: Green (`#10B981` / `rgba(16, 185, 129, 0.2)`)
   - Border: Slightly darker green
   - Only show for species habitat markers (green dot pins)
   - Don't show for location pins (red pins)

### Files to Modify
- `src/components/Globe.tsx` - Add polygon/circle rendering
- `src/pages/Index.tsx` - Generate circle data for habitat points

### Performance Considerations
- Semi-transparent circles are FAST (much faster than complex polygons)
- Only render circles for currently visible species (not all at once)
- Circles defined by center point + radius (very lightweight)

### Alternative Globe.gl Approach
If polygons aren't easy, we can use:
- **hexBinPointsData** - Creates hexagonal bins showing density
- **pointsData with larger size** - Simply make the green dots bigger with glow
- **labelsData with background** - Add circular labels with transparent backgrounds

## Future Enhancements (Later)
- Fetch actual Protected Planet polygon geometries (one region at a time)
- Color-code by protection level (National Park, Wildlife Refuge, etc.)
- Show polygon details on hover
- Progressive loading: bounds first, then detailed geometry on demand

## Notes
- Context getting low - save frequently
- Test performance after adding overlays
- Start with simple approach (circles) before complex polygons
