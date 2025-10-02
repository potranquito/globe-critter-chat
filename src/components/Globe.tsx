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
}

const GlobeComponent = ({ habitats }: GlobeComponentProps) => {
  const globeEl = useRef<any>();
  const [globeReady, setGlobeReady] = useState(false);

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
            altitude: 1.5,
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
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
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
        pointLabel={(d: any) => `<div class="glass-panel px-3 py-2 rounded-lg"><strong>${d.species}</strong><br/>Location: ${d.lat.toFixed(2)}, ${d.lng.toFixed(2)}</div>`}
        onGlobeReady={() => setGlobeReady(true)}
        animateIn={true}
      />
    </div>
  );
};

export default GlobeComponent;
