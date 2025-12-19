import { useEffect, useRef, useState, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import { MapPin } from 'lucide-react';
import { useGoogleMapsApi } from '@/hooks/useGoogleMapsApi';
// ZoomControls and UsageIndicator removed per user request
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
  emoji?: string;
  imageUrl?: string;
  type?: 'species' | 'habitat' | 'threat' | 'protected';
  name?: string;
  title?: string;
  description?: string;
  spriteSheet?: string; // Path to sprite sheet image
  spriteFrames?: number; // Number of frames in animation (default: 3)
  spriteRows?: number; // Number of rows in sprite sheet (default: 4)
  spriteCols?: number; // Number of columns in sprite sheet (default: 3)
  spriteRow?: number; // Which row to use for animation (0-indexed, default: 0 for front-facing)
  walkInCircle?: boolean; // Cycle through all 4 directions (rows)
}

interface GoogleEarthMapProps {
  habitats: HabitatPoint[];
  onPointClick?: (habitat: HabitatPoint) => void;
  onDoubleGlobeClick?: (lat: number, lng: number) => void;
  onImageMarkerClick?: (marker: HabitatPoint) => void;
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  wildlifePlaces?: any[];
  protectedAreas?: any[];
  locationName?: string;
  disableMarkerZoom?: boolean; // Disable auto-zoom on marker click
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
  wildlifePlaces = [],
  protectedAreas = [],
  locationName,
  disableMarkerZoom = false
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
      try { delete (window as any).gm_authFailure; } catch { /* ignore */ }
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
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="bg-background">
        <div className="glass-panel rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
          <p className="text-sm text-muted-foreground">Loading Google Earth...</p>
        </div>
      </div>
    );
  }
  if (authError) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
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
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
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
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Map
          mapId="wildlife-map"
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
          style={{ width: '100%', height: '100%' }}
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

          {/* Wildlife location markers with thumbnails */}
          {wildlifePlaces.map((place, idx) => {
            const apiKey = 'AIzaSyC4205XHgzRi8VswW7zqdFVanY-HoEDTIg';
            const photoUrl = place.photoReference
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=100&photoreference=${place.photoReference}&key=${apiKey}`
              : null;

            // Support both snake_case (from database) and camelCase (from other sources)
            const imageUrl = place.image_url || place.imageUrl;

            return (
              <AdvancedMarker
                key={`wildlife-${idx}`}
                position={{ lat: place.lat, lng: place.lng }}
                onClick={() => {
                  if (mapRef.current && !disableMarkerZoom) {
                    mapRef.current.panTo({ lat: place.lat, lng: place.lng });
                    mapRef.current.setZoom(15);
                  }
                  // Trigger the image marker click handler with wildlife park data
                  onImageMarkerClick?.({
                    ...place,
                    type: 'wildlife-park',
                    imageUrl: imageUrl
                  });
                }}
              >
                <div className="cursor-pointer hover:scale-110 transition-transform group">
                  {photoUrl || imageUrl ? (
                    <div className="relative">
                      <img
                        src={photoUrl || imageUrl}
                        alt={place.name}
                        className="w-16 h-16 rounded-lg border-2 border-emerald-400 object-cover"
                        style={{
                          boxShadow: '0 0 15px rgba(52, 211, 153, 0.5), 0 0 30px rgba(52, 211, 153, 0.3), 0 4px 10px rgba(0, 0, 0, 0.3)'
                        }}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                        {place.name}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center"
                      style={{
                        boxShadow: '0 0 15px rgba(52, 211, 153, 0.5), 0 0 30px rgba(52, 211, 153, 0.3), 0 4px 10px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      🌳
                    </div>
                  )}
                </div>
              </AdvancedMarker>
            );
          })}

          {/* Protected areas with images or green dots */}
          {protectedAreas.slice(0, 3).map((area, idx) => (
            <AdvancedMarker
              key={`protected-${idx}`}
              position={{ lat: area.location?.lat || area.lat, lng: area.location?.lng || area.lng }}
              onClick={() => {
                // Don't zoom - just show the park info card
                onPointClick?.({
                  ...area,
                  lat: area.location?.lat || area.lat,
                  lng: area.location?.lng || area.lng,
                  type: 'protected'
                });
              }}
            >
              <div className="cursor-pointer hover:scale-110 transition-transform group">
                {area.image_url ? (
                  <div className="relative">
                    <img
                      src={area.image_url}
                      alt={area.name}
                      className="w-16 h-16 rounded-lg border-2 border-emerald-400 object-cover"
                      style={{
                        boxShadow: '0 0 15px rgba(52, 211, 153, 0.5), 0 0 30px rgba(52, 211, 153, 0.3), 0 4px 10px rgba(0, 0, 0, 0.3)'
                      }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 min-w-max">
                      <div className="font-semibold">{area.name}</div>
                      {area.designation && <div className="text-muted-foreground text-[10px]">{area.designation}</div>}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="hover:scale-125 transition-transform"
                      style={{
                        width: '24px',
                        height: '24px',
                        backgroundColor: '#22c55e',
                        borderRadius: '50%',
                        border: '3px solid white',
                        boxShadow: '0 0 10px rgba(52, 211, 153, 0.6), 0 0 20px rgba(52, 211, 153, 0.4), 0 2px 10px rgba(34, 197, 94, 0.5)',
                      }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur-sm px-3 py-1.5 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10 min-w-max">
                      <div className="font-semibold">{area.name}</div>
                      {area.designation && <div className="text-muted-foreground text-[10px]">{area.designation}</div>}
                    </div>
                  </div>
                )}
              </div>
            </AdvancedMarker>
          ))}
        </Map>

        {/* UI Overlays - Zoom controls and UsageIndicator removed per user request */}

      </div>
    </APIProvider>
  );
};

export default GoogleEarthMap;
