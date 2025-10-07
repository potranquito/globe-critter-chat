import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';

interface HabitatPoint {
  lat: number;
  lng: number;
  species: string;
  size: number;
  color: string;
}

interface GlobeComponentProps {
  habitats: HabitatPoint[];
  onPointClick?: (point: HabitatPoint) => void;
  onDoubleGlobeClick?: (lat: number, lng: number) => void;
  onImageMarkerClick?: (marker: any) => void;
  targetLocation?: { lat: number; lng: number } | null;
}

const GlobeComponent = ({ habitats, onPointClick: onPointClickProp, onDoubleGlobeClick, onImageMarkerClick, targetLocation }: GlobeComponentProps) => {
  const globeEl = useRef<any>();
  const MIN_ALT = 0.8;
  const MAX_ALT = 3.0;
  const INITIAL_ALT = 2.2;
  const [globeReady, setGlobeReady] = useState(false);
  const lastClickRef = useRef<number>(0);
  const [currentAltitude, setCurrentAltitude] = useState(INITIAL_ALT);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout>();
  const interactionRef = useRef(false);

  // Separate regular points from image markers
  const regularPoints = habitats.filter(h => !('imageUrl' in h));
  const imageMarkers = habitats.filter(h => 'imageUrl' in h);

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
    
    // Pause auto-rotate during user interaction
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
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
    
    globeEl.current.pointOfView(
      { lat: targetLocation.lat, lng: targetLocation.lng, altitude: 1.5 },
      2000
    );
    setCurrentAltitude(1.5);
  }, [targetLocation, globeReady]);

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
        pointsData={regularPoints}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointLabel={(d: any) => `<div class="glass-panel px-3 py-2 rounded-lg"><strong>${d.species}</strong><br/>Location: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}<br/><em>Click to view</em></div>`}
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
        htmlElementsData={imageMarkers}
        htmlLat="lat"
        htmlLng="lng"
        htmlAltitude={0.01}
        htmlElement={(d: any) => {
          const el = document.createElement('div');
          el.className = 'cursor-pointer hover:scale-110 transition-transform';
          el.style.pointerEvents = 'auto';
          el.innerHTML = `
            <div class="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <img src="${d.imageUrl}" alt="${d.type}" class="w-full h-full object-cover" />
            </div>
          `;
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
export type { HabitatPoint, GlobeComponentProps };
