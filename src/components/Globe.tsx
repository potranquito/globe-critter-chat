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
}

const GlobeComponent = ({ habitats, onPointClick: onPointClickProp, onDoubleGlobeClick }: GlobeComponentProps) => {
  const globeEl = useRef<any>();
  const [globeReady, setGlobeReady] = useState(false);
  const lastClickRef = useRef<number>(0);

  useEffect(() => {
    if (globeEl.current && globeReady) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      
      // Point camera at the first habitat if exists
      if (habitats.length > 0) {
        const firstHabitat = habitats[0];
        globeEl.current.pointOfView(
          {
            lat: firstHabitat.lat,
            lng: firstHabitat.lng,
            altitude: 1.2,
          },
          2000
        );
      }
    }
  }, [habitats, globeReady]);

  return (
    <div className="w-full h-full">
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
        backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
        backgroundColor="rgba(0,0,0,0)"
        atmosphereColor="rgba(22, 163, 74, 0.5)"
        atmosphereAltitude={0.25}
        pointsData={habitats}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointAltitude={0.01}
        pointRadius="size"
        pointLabel={(d: any) => `<div class="glass-panel px-3 py-2 rounded-lg"><strong>${d.species}</strong><br/>Location: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}<br/><em>Click to view</em></div>`}
        onPointClick={(d: any) => {
          if (globeEl.current) {
            globeEl.current.pointOfView(
              { lat: d.lat, lng: d.lng, altitude: 0.4 },
              1500
            );
          }
          onPointClickProp?.(d);
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
                globeEl.current.pointOfView({ lat, lng, altitude: 0.6 }, 1200);
              }
              onDoubleGlobeClick?.(lat, lng);
            }
          }
        }}
        onGlobeReady={() => setGlobeReady(true)}
        animateIn={true}
      />
    </div>
  );
};

export default GlobeComponent;
