import { useEffect, useRef, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { useGoogleMapsApi } from '@/hooks/useGoogleMapsApi';
import ZoomControls from './ZoomControls';
import ConservationLayers from './ConservationLayers';
import UsageIndicator from './UsageIndicator';
import ImageMarker from './ImageMarker';

interface HabitatPoint {
  lat: number;
  lng: number;
  species?: string;
  size?: number;
  color?: string;
  imageUrl?: string;
  type?: 'threat' | 'ecosystem';
  title?: string;
  description?: string;
}

interface GoogleEarthMapProps {
  habitats: HabitatPoint[];
  onPointClick?: (habitat: HabitatPoint) => void;
  onDoubleGlobeClick?: (lat: number, lng: number) => void;
  onImageMarkerClick?: (marker: HabitatPoint) => void;
}

// Helper component to access map instance and add event listeners
const MapEventHandler = ({ 
  onDoubleClick 
}: { 
  onDoubleClick?: (lat: number, lng: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const listener = map.addListener('dblclick', (e: google.maps.MapMouseEvent) => {
      if (e.latLng && onDoubleClick) {
        onDoubleClick(e.latLng.lat(), e.latLng.lng());
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [map, onDoubleClick]);

  return null;
};

const GoogleEarthMap = ({ 
  habitats, 
  onPointClick, 
  onDoubleGlobeClick,
  onImageMarkerClick 
}: GoogleEarthMapProps) => {
  const { apiKey, loading, usage, error } = useGoogleMapsApi();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(3);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Separate regular points from image markers
  const regularPoints = habitats.filter(h => !h.imageUrl);
  const imageMarkers = habitats.filter(h => h.imageUrl);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom() || 3;
      mapRef.current.setZoom(Math.min(zoom + 1, 20));
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      const zoom = mapRef.current.getZoom() || 3;
      mapRef.current.setZoom(Math.max(zoom - 1, 2));
    }
  }, []);

  const handleResetView = useCallback(() => {
    if (mapRef.current) {
      if (regularPoints.length > 0) {
        const firstPoint = regularPoints[0];
        mapRef.current.setCenter({ lat: firstPoint.lat, lng: firstPoint.lng });
        mapRef.current.setZoom(5);
      } else {
        mapRef.current.setCenter({ lat: 20, lng: 0 });
        mapRef.current.setZoom(3);
      }
      mapRef.current.setTilt(45);
    }
  }, [regularPoints]);

  const getZoomLevel = () => {
    if (currentZoom >= 15) return 'Street';
    if (currentZoom >= 10) return 'City';
    if (currentZoom >= 5) return 'Regional';
    return 'Global';
  };

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    console.log(`Conservation layer ${layer} ${enabled ? 'enabled' : 'disabled'}`);
    // Conservation layers will be implemented with Google Earth Engine integration
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="glass-panel rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading Google Earth...</p>
        </div>
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="glass-panel rounded-lg p-6 max-w-md">
          <p className="text-sm text-destructive">{error || 'Failed to load Google Maps'}</p>
        </div>
      </div>
    );
  }

  const defaultCenter = regularPoints.length > 0 
    ? { lat: regularPoints[0].lat, lng: regularPoints[0].lng }
    : { lat: 20, lng: 0 };

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-screen">
        <Map
          mapId="conservation-map"
          defaultCenter={defaultCenter}
          defaultZoom={regularPoints.length > 0 ? 5 : 3}
          defaultTilt={45}
          defaultHeading={0}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapTypeId="satellite"
          onCameraChanged={(e) => {
            if (e.map) {
              mapRef.current = e.map;
              setMapLoaded(true);
              setCurrentZoom(e.map.getZoom() || 3);
            }
          }}
          className="w-full h-full"
        >
          <MapEventHandler onDoubleClick={onDoubleGlobeClick} />

          {/* Regular habitat markers */}
          {regularPoints.map((habitat, idx) => (
            <AdvancedMarker
              key={`habitat-${idx}`}
              position={{ lat: habitat.lat, lng: habitat.lng }}
              onClick={() => onPointClick?.(habitat)}
            >
              <div 
                className="cursor-pointer hover:scale-110 transition-transform"
                style={{
                  width: `${(habitat.size || 10) * 2}px`,
                  height: `${(habitat.size || 10) * 2}px`,
                  backgroundColor: habitat.color || '#22c55e',
                  borderRadius: '50%',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              />
            </AdvancedMarker>
          ))}

          {/* Image markers for threats/ecosystem */}
          {imageMarkers.map((marker, idx) => (
            <AdvancedMarker
              key={`image-${idx}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => onImageMarkerClick?.(marker)}
            >
              <ImageMarker 
                imageUrl={marker.imageUrl!}
                type={marker.type || 'threat'}
                onClick={() => onImageMarkerClick?.(marker)}
              />
            </AdvancedMarker>
          ))}
        </Map>

        {/* UI Overlays */}
        <ZoomControls
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleResetView}
          zoomLevel={getZoomLevel()}
        />

        <ConservationLayers onToggleLayer={handleLayerToggle} />

        {usage && (
          <UsageIndicator
            daily={usage.daily}
            monthly={usage.monthly}
            dailyLimit={usage.dailyLimit}
            monthlyLimit={usage.monthlyLimit}
          />
        )}
      </div>
    </APIProvider>
  );
};

export default GoogleEarthMap;
