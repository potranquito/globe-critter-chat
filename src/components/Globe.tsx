import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

interface HabitatPoint {
  lat: number;
  lng: number;
  species?: string;
  size: number;
  color?: string;
  emoji?: string;
  imageUrl?: string;
  type?: 'species' | 'habitat' | 'threat' | 'protected';
  name?: string;
  title?: string;
}

interface HabitatZoneOverlay {
  lat: number;
  lng: number;
  radiusKm: number;
  color?: string;
  name?: string;
}

interface GlobeComponentProps {
  habitats: HabitatPoint[];
  onPointClick?: (point: HabitatPoint) => void;
  onDoubleGlobeClick?: (lat: number, lng: number) => void;
  onImageMarkerClick?: (marker: any) => void;
  targetLocation?: { lat: number; lng: number } | null;
  habitatZones?: HabitatZoneOverlay[]; // NEW: Transparent circular overlays
  resetView?: boolean; // Trigger to reset globe to default view
}

// Helper function to generate circle polygon coordinates
const generateCirclePolygon = (lat: number, lng: number, radiusKm: number, numPoints: number = 64) => {
  const coordinates: [number, number][] = [];
  const earthRadiusKm = 6371;
  const radiusRad = radiusKm / earthRadiusKm;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;
    const dx = radiusRad * Math.cos(angle);
    const dy = radiusRad * Math.sin(angle);

    const pointLat = lat + (dy * 180) / Math.PI;
    const pointLng = lng + (dx * 180) / (Math.PI * Math.cos((lat * Math.PI) / 180));

    coordinates.push([pointLng, pointLat]);
  }

  return coordinates;
};

const GlobeComponent = ({ habitats, onPointClick: onPointClickProp, onDoubleGlobeClick, onImageMarkerClick, targetLocation, habitatZones = [], resetView = false }: GlobeComponentProps) => {
  const globeEl = useRef<any>();
  const MIN_ALT = 0.8;
  const MAX_ALT = 3.0;
  const INITIAL_ALT = 2.2;
  const [globeReady, setGlobeReady] = useState(false);
  const lastClickRef = useRef<number>(0);
  const [currentAltitude, setCurrentAltitude] = useState(INITIAL_ALT);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout>();
  const interactionRef = useRef(false);

  // Separate markers by type
  // Filter out any invalid/undefined entries first
  const validHabitats = habitats.filter(h => 
    h && typeof h.lat === 'number' && typeof h.lng === 'number'
  );
  
  // ✅ DEDUPLICATE: Remove duplicate pins at same coordinates (prevents random pins bug)
  const deduplicatedHabitats = validHabitats.reduce((acc: HabitatPoint[], current) => {
    // Check if this coordinate already exists (within 0.001 degrees tolerance)
    const exists = acc.some(h => 
      Math.abs(h.lat - current.lat) < 0.001 && 
      Math.abs(h.lng - current.lng) < 0.001
    );
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, []);
  
  // Log deduplication stats (helps debug random pins)
  if (validHabitats.length !== deduplicatedHabitats.length) {
    console.warn(`🔧 Removed ${validHabitats.length - deduplicatedHabitats.length} duplicate pins (${validHabitats.length} → ${deduplicatedHabitats.length})`);
  }
  
  const emojiMarkers = deduplicatedHabitats.filter(h => h.emoji);
  const imageMarkers = deduplicatedHabitats.filter(h => h.imageUrl && h.type === 'species');
  const habitatImageMarkers = deduplicatedHabitats.filter(h => h.imageUrl && h.type === 'habitat');
  const regularPoints = deduplicatedHabitats.filter(h => !h.emoji && !h.imageUrl);

  // Convert habitat zones to polygon data for Globe.gl
  // Filter out any invalid zones first
  const validZones = habitatZones.filter(zone => 
    zone && 
    typeof zone.lat === 'number' && 
    typeof zone.lng === 'number' && 
    typeof zone.radiusKm === 'number'
  );
  const zonePolygons = validZones.map(zone => ({
    coordinates: [generateCirclePolygon(zone.lat, zone.lng, zone.radiusKm)],
    color: zone.color || 'rgba(16, 185, 129, 0.2)', // Default green with transparency
    name: zone.name || 'Habitat Zone'
  }));

  // Enable full zoom and interaction controls - only run once when globe is ready
  useEffect(() => {
    if (!globeEl.current || !globeReady) return;
    
    const controls = globeEl.current.controls();
    // Force-enable interactions across OrbitControls or TrackballControls
    controls.enabled = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    // Support both controls APIs
    if ('noZoom' in controls) {
      // TrackballControls style flags
      controls.noZoom = false;
      controls.noPan = false;
      controls.noRotate = false;
    }
    if ('enableZoom' in controls) {
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
    }

    // Disable minDistance/maxDistance - we'll control zoom via altitude only
    if ('minDistance' in controls) (controls as any).minDistance = 0;
    if ('maxDistance' in controls) (controls as any).maxDistance = Infinity;
    controls.zoomSpeed = 0.8;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    
    // Pause auto-rotate during user interaction, resume after
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });

    controls.addEventListener('end', () => {
      // Resume auto-rotation after user stops interacting
      setTimeout(() => {
        if (controls) {
          controls.autoRotate = true;
        }
      }, 2000); // Wait 2 seconds after interaction ends
    });

    // Ensure the canvas actually receives pointer events
    const canvas = globeEl.current.renderer().domElement as HTMLCanvasElement | undefined;
    if (canvas) {
      canvas.style.pointerEvents = 'auto';
      // Prevent browser gestures from hijacking drag/zoom on touch devices
      (canvas.style as any).touchAction = 'none';
      canvas.style.cursor = 'grab';
      const onDown = () => (canvas.style.cursor = 'grabbing');
      const onUp = () => (canvas.style.cursor = 'grab');
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointerup', onUp);
    }

    // Track altitude changes from mouse wheel / interactions
    controls.addEventListener('change', () => {
      if (!globeEl.current) return;
      const pov = globeEl.current.pointOfView();
      if (typeof pov.altitude === 'number') {
        let alt = pov.altitude;
        if (alt < MIN_ALT) {
          globeEl.current.pointOfView({ ...pov, altitude: MIN_ALT });
          alt = MIN_ALT;
        }
        if (alt > MAX_ALT) {
          globeEl.current.pointOfView({ ...pov, altitude: MAX_ALT });
          alt = MAX_ALT;
        }
        setCurrentAltitude(alt);
      }
    });

    // Set initial camera position only once
    globeEl.current.pointOfView(
      { lat: 20, lng: 0, altitude: INITIAL_ALT },
      1500
    );
    setCurrentAltitude(INITIAL_ALT);
  }, [globeReady]);

  // Separate effect to handle habitat changes without resetting camera
  useEffect(() => {
    if (!globeEl.current || !globeReady || regularPoints.length === 0) return;
    
    const firstHabitat = regularPoints[0];
    globeEl.current.pointOfView(
      { lat: firstHabitat.lat, lng: firstHabitat.lng, altitude: INITIAL_ALT },
      1500
    );
    setCurrentAltitude(INITIAL_ALT);
  }, [regularPoints.length > 0 ? regularPoints[0]?.species : null, globeReady]);

  // Effect to fly to target location when searching
  useEffect(() => {
    if (!globeEl.current || !globeReady || !targetLocation) return;

    // Stop auto-rotation when flying to a location
    const controls = globeEl.current.controls();
    if (controls) {
      controls.autoRotate = false;
    }

    // Animate to target location with much closer zoom (0.5 instead of 1.0)
    globeEl.current.pointOfView(
      { lat: targetLocation.lat, lng: targetLocation.lng, altitude: 0.5 },
      3000 // Slower animation for better visual effect
    );
    setCurrentAltitude(0.5);
  }, [targetLocation, globeReady]);

  // Effect to reset view to default when user clicks "Back to Globe"
  useEffect(() => {
    if (!globeEl.current || !globeReady || !resetView) return;

    console.log('🔄 Resetting globe view to altitude:', INITIAL_ALT);
    // Reset to same zoomed out view as initial page load
    globeEl.current.pointOfView(
      { lat: 20, lng: 0, altitude: INITIAL_ALT },
      1500
    );
    setCurrentAltitude(INITIAL_ALT);

    // Resume auto-rotation after a short delay to ensure it takes effect
    setTimeout(() => {
      const controls = globeEl.current?.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
      }
    }, 200);
  }, [resetView, globeReady]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      const newAltitude = Math.max(MIN_ALT, pov.altitude - 0.3);
      globeEl.current.pointOfView({ ...pov, altitude: newAltitude }, 800);
      setCurrentAltitude(newAltitude);
    }
  };

  const handleZoomOut = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      const newAltitude = Math.min(MAX_ALT, pov.altitude + 0.3);
      globeEl.current.pointOfView({ ...pov, altitude: newAltitude }, 800);
      setCurrentAltitude(newAltitude);
    }
  };

  const handleResetView = () => {
    if (globeEl.current) {
      globeEl.current.pointOfView(
        {
          lat: 20,
          lng: 0,
          altitude: INITIAL_ALT,
        },
        1500
      );
      setCurrentAltitude(INITIAL_ALT);
      // Re-enable auto-rotate on reset
      const controls = globeEl.current.controls();
      if (controls) controls.autoRotate = true;
    }
  };

  const getZoomLevel = () => {
    if (currentAltitude < 0.5) return 'Very Close';
    if (currentAltitude < 1) return 'Close';
    if (currentAltitude < 2) return 'Medium';
    if (currentAltitude < 3) return 'Far';
    return 'Very Far';
  };

  return (
    <div className="globe-root w-full h-full relative cursor-grab active:cursor-grabbing z-0 touch-none select-none" 
         style={{ pointerEvents: 'auto' }} 
         aria-label="Interactive 3D Earth">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="rgb(22, 163, 74)"
        atmosphereAltitude={0.25}
        enablePointerInteraction={true}

        // Habitat zone overlays (transparent green circles)
        polygonsData={zonePolygons}
        polygonCapColor={(d: any) => d.color}
        polygonSideColor={(d: any) => d.color}
        polygonStrokeColor={() => '#10B981'}
        polygonAltitude={0.005}
        polygonsTransitionDuration={0}
        polygonLabel={(d: any) => `<div class="glass-panel px-3 py-2 rounded-lg"><strong>${d.name}</strong></div>`}

        pointsData={regularPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.015}
        pointRadius="size"
        pointLabel={(d: any) => `<div class="glass-panel px-3 py-2 rounded-lg"><strong>${d.species || d.name}</strong><br/>Location: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}<br/><em>Click to view</em></div>`}
        pointsTransitionDuration={0}
        onPointClick={(d: any) => {
          if (globeEl.current) {
            globeEl.current.pointOfView(
              { lat: d.lat, lng: d.lng, altitude: 1.0 },
              1200
            );
            setCurrentAltitude(1.0);
          }
          onPointClickProp?.(d);
        }}
        htmlElementsData={[...emojiMarkers, ...imageMarkers, ...habitatImageMarkers]}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.015}
        htmlTransitionDuration={0}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.className = 'cursor-pointer hover:scale-125 transition-transform';
          el.style.pointerEvents = 'auto';
          
          // If it's an emoji marker, render emoji with pulsing ring for green pins
          if (d.emoji) {
            const isGreenPin = d.emoji === '🟢';
            el.innerHTML = `
              <div class="relative flex items-center justify-center">
                ${isGreenPin ? `
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="habitat-pulse-ring"></div>
                  </div>
                ` : ''}
                <div class="text-4xl drop-shadow-lg relative z-10" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
                  ${d.emoji}
                </div>
              </div>
            `;
          }
          // If it's a wildlife park marker, show image with name overlay
          else if (d.type === 'wildlife-park') {
            el.innerHTML = `
              <div class="relative group">
                <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-emerald-400 shadow-lg">
                  ${d.imageUrl 
                    ? `<img src="${d.imageUrl}" alt="${d.name || 'Wildlife Park'}" class="w-full h-full object-cover" />`
                    : `<div class="w-full h-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-2xl">🌳</div>`
                  }
                </div>
                <div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  ${d.name || 'Wildlife Park'}
                </div>
              </div>
            `;
          }
          // If it's a habitat image marker (Wikipedia URL), use directly
          else if (d.imageUrl && d.type === 'habitat') {
            el.innerHTML = `
              <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <img src="${d.imageUrl}" alt="${d.name || 'Habitat'}" class="w-full h-full object-cover" />
              </div>
            `;
          }
          // If it's a species image marker (Google photo reference), fetch via proxy
          else if (d.imageUrl && d.type === 'species') {
            el.innerHTML = `
              <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg bg-gray-200">
                <div class="w-full h-full flex items-center justify-center">
                  <div class="animate-pulse text-xs text-gray-500">Loading...</div>
                </div>
              </div>
            `;
            
            (async () => {
              try {
                const { supabase } = await import('@/integrations/supabase/client');
                const { data, error } = await supabase.functions.invoke('google-photo', {
                  body: { photoReference: d.imageUrl, maxWidth: 200 }
                });
                
                if (!error && data) {
                  const blob = new Blob([data], { type: 'image/jpeg' });
                  const imageUrl = URL.createObjectURL(blob);
                  el.innerHTML = `
                    <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                      <img src="${imageUrl}" alt="${d.species || 'Species'}" class="w-full h-full object-cover" />
                    </div>
                  `;
                }
              } catch (err) {
                console.error('Error loading photo:', err);
              }
            })();
          }
          
          el.onclick = (e) => {
            e.stopPropagation();
            console.log('HTML element clicked:', d);
            if (globeEl.current) {
              globeEl.current.pointOfView(
                { lat: d.lat, lng: d.lng, altitude: 1.2 },
                1200
              );
              setCurrentAltitude(1.2);
            }
            onImageMarkerClick?.(d);
          };
          return el;
        }}
        onGlobeClick={(coords: any) => {
          const now = Date.now();
          const isDouble = now - (lastClickRef.current || 0) < 300;
          lastClickRef.current = now;

          if (isDouble) {
            const lat = coords?.lat ?? coords?.[0];
            const lng = coords?.lng ?? coords?.[1];
            if (typeof lat === 'number' && typeof lng === 'number') {
              if (globeEl.current) {
                globeEl.current.pointOfView({ lat, lng, altitude: 1.3 }, 1200);
                setCurrentAltitude(1.3);
              }
              onDoubleGlobeClick?.(lat, lng);
            }
          }
        }}
        onGlobeReady={() => { console.log('Globe ready'); setGlobeReady(true); }}
        animateIn={true}
      />
    </div>
  );
};

export default GlobeComponent;
export type { HabitatPoint, GlobeComponentProps, HabitatZoneOverlay };
