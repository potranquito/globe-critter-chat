import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import ZoomControls from './ZoomControls';

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
}

const GlobeComponent = ({ habitats, onPointClick: onPointClickProp, onDoubleGlobeClick, onImageMarkerClick }: GlobeComponentProps) => {
  const globeEl = useRef<any>();
  const [globeReady, setGlobeReady] = useState(false);
  const lastClickRef = useRef<number>(0);
  const [currentAltitude, setCurrentAltitude] = useState(2);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout>();
  const interactionRef = useRef(false);

  // Separate regular points from image markers
  const regularPoints = habitats.filter(h => !('imageUrl' in h));
  const imageMarkers = habitats.filter(h => 'imageUrl' in h);

  // Enable full zoom and interaction controls
  useEffect(() => {
    if (globeEl.current && globeReady) {
      const controls = globeEl.current.controls();
      controls.enabled = true; // Explicitly enable controls
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      // Use library defaults for zoom distances to prevent clamping issues
      controls.zoomSpeed = 1.0;
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

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
        if (globeEl.current) {
          const pov = globeEl.current.pointOfView();
          if (typeof pov.altitude === 'number') setCurrentAltitude(pov.altitude);
        }
      });

      if (regularPoints.length > 0) {
        const firstHabitat = regularPoints[0];
        globeEl.current.pointOfView(
          { lat: firstHabitat.lat, lng: firstHabitat.lng, altitude: 1.5 },
          2000
        );
        setCurrentAltitude(1.5);
      } else {
        globeEl.current.pointOfView(
          { lat: 20, lng: 0, altitude: 2 },
          2000
        );
        setCurrentAltitude(2);
      }
    }
  }, [regularPoints, globeReady]);

  // Zoom control handlers
  const handleZoomIn = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      const newAltitude = Math.max(0.15, pov.altitude - 0.3);
      globeEl.current.pointOfView({ ...pov, altitude: newAltitude }, 800);
      setCurrentAltitude(newAltitude);
    }
  };

  const handleZoomOut = () => {
    if (globeEl.current) {
      const pov = globeEl.current.pointOfView();
      const newAltitude = Math.min(3.5, pov.altitude + 0.3);
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
          altitude: 2,
        },
        1500
      );
      setCurrentAltitude(2);
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
    <div className="globe-root w-full h-full relative cursor-grab active:cursor-grabbing pointer-events-auto z-0 touch-none select-none">
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        zoomLevel={getZoomLevel()}
      />
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
              { lat: d.lat, lng: d.lng, altitude: 0.25 },
              1800
            );
            setCurrentAltitude(0.25);
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
                { lat: d.lat, lng: d.lng, altitude: 0.4 },
                1800
              );
              setCurrentAltitude(0.4);
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
                globeEl.current.pointOfView({ lat, lng, altitude: 0.8 }, 1800);
                setCurrentAltitude(0.8);
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
