import { useEffect, useRef, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useGoogleMapsApi } from '@/hooks/useGoogleMapsApi';
import ZoomControls from './ZoomControls';
import ConservationLayers from './ConservationLayers';
import UsageIndicator from './UsageIndicator';
import ImageMarker from './ImageMarker';
import GlobeComponent from './Globe';
import WildlifeLocationCard from './WildlifeLocationCard';
import { ScrollArea } from './ui/scroll-area';
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
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  wildlifePlaces?: any[];
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
  onImageMarkerClick,
  center,
  zoom = 3,
  wildlifePlaces = []
}: GoogleEarthMapProps) => {
  const { apiKey, loading, usage, error } = useGoogleMapsApi();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [authError, setAuthError] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      setAuthError(true);
      console.error('Google Maps auth failure');
    };
    return () => {
      // cleanup
      try { delete (window as any).gm_authFailure; } catch {}
    };
  }, []);
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
      if (center) {
        mapRef.current.setCenter(center);
        mapRef.current.setZoom(zoom);
        mapRef.current.setTilt(zoom >= 10 ? 0 : 45);
      } else if (regularPoints.length > 0) {
        const firstPoint = regularPoints[0];
        mapRef.current.setCenter({ lat: firstPoint.lat, lng: firstPoint.lng });
        mapRef.current.setZoom(5);
        mapRef.current.setTilt(45);
      } else {
        mapRef.current.setCenter({ lat: 20, lng: 0 });
        mapRef.current.setZoom(3);
        mapRef.current.setTilt(45);
      }
    }
  }, [regularPoints, center, zoom]);

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
  if (authError) {
    return (
      <div className="relative w-full h-screen">
        <GlobeComponent 
          habitats={habitats as any}
          onPointClick={onPointClick}
          onDoubleGlobeClick={onDoubleGlobeClick}
          onImageMarkerClick={onImageMarkerClick}
        />
      </div>
    );
  }

  if (error || !apiKey) {
    return (
      <div className="relative w-full h-screen">
        <GlobeComponent 
          habitats={habitats as any}
          onPointClick={onPointClick}
          onDoubleGlobeClick={onDoubleGlobeClick}
          onImageMarkerClick={onImageMarkerClick}
        />
      </div>
    );
  }

  const defaultCenter = center || (regularPoints.length > 0 
    ? { lat: regularPoints[0].lat, lng: regularPoints[0].lng }
    : { lat: 20, lng: 0 });

  const defaultZoom = zoom > 3 ? zoom : (regularPoints.length > 0 ? 5 : 3);
  const defaultTilt = zoom >= 10 ? 0 : 45; // Top-down view for city zoom

  return (
    <APIProvider apiKey={apiKey}>
      <div className="relative w-full h-screen">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          defaultTilt={defaultTilt}
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

        {/* Wildlife locations sidebar */}
        {wildlifePlaces.length > 0 && (
          <div className="absolute top-6 left-6 w-80 max-h-[80vh] z-10">
            <div className="glass-panel rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Wildlife Locations ({wildlifePlaces.length})
              </h3>
              <ScrollArea className="h-[calc(80vh-8rem)]">
                <div className="space-y-3 pr-3">
                  {wildlifePlaces.map((place, idx) => (
                    <WildlifeLocationCard
                      key={idx}
                      name={place.name}
                      address={place.address}
                      rating={place.rating}
                      types={place.types}
                      photoReference={place.photoReference}
                      onClick={() => {
                        if (mapRef.current) {
                          mapRef.current.panTo({ lat: place.lat, lng: place.lng });
                          mapRef.current.setZoom(15);
                        }
                      }}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </APIProvider>
  );
};

export default GoogleEarthMap;
