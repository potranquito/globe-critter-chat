import { useEffect, useRef, useState } from 'react';
import { Viewer, Entity, CameraFlyTo } from 'resium';
import * as Cesium from 'cesium';
import { useGoogleMapsApi } from '@/hooks/useGoogleMapsApi';
import ZoomControls from './ZoomControls';
import UsageIndicator from './UsageIndicator';
import GlobeComponent from './Globe';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Set Cesium Ion token (free tier)
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI5N2UyMjcwOS00MDY1LTQxYjEtYjZjMy00YTU0ZTg1YmJjYzYiLCJpZCI6ODAzMDYsImlhdCI6MTY0Mjc0ODI2MX0.dkwAL1CcljUV7NA7fDbhXXnmyZQU_c-G4zsiUqCxRnc';

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
  index?: number;
}

interface CesiumGlobeProps {
  habitats: HabitatPoint[];
  onPointClick?: (habitat: HabitatPoint) => void;
  onDoubleGlobeClick?: (lat: number, lng: number) => void;
  onImageMarkerClick?: (marker: HabitatPoint) => void;
}

const CesiumGlobe = ({ 
  habitats, 
  onPointClick, 
  onDoubleGlobeClick,
  onImageMarkerClick 
}: CesiumGlobeProps) => {
  const { apiKey, loading, usage, error } = useGoogleMapsApi();
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [currentZoom, setCurrentZoom] = useState(3);
  const [cameraPosition, setCameraPosition] = useState<Cesium.Cartesian3 | null>(null);

  // Separate regular points from image markers
  const regularPoints = habitats.filter(h => !h.imageUrl);
  const imageMarkers = habitats.filter(h => h.imageUrl);

  useEffect(() => {
    if (!viewerRef.current) return;

    const viewer = viewerRef.current;

    // Add Google Photorealistic 3D Tiles
    const loadTiles = async () => {
      if (apiKey) {
        try {
          const tileset = await Cesium.Cesium3DTileset.fromUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${apiKey}`,
            {
              showCreditsOnScreen: true,
            }
          );
          viewer.scene.primitives.add(tileset);
          console.log('Google 3D Tiles loaded successfully');
        } catch (err) {
          console.error('Failed to load Google 3D Tiles:', err);
        }
      }
    };
    
    loadTiles();

    // Handle double click for region detection
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((click: any) => {
      const cartesian = viewer.camera.pickEllipsoid(
        click.position,
        viewer.scene.globe.ellipsoid
      );
      if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        const lng = Cesium.Math.toDegrees(cartographic.longitude);
        onDoubleGlobeClick?.(lat, lng);
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

    // Track camera changes
    const removeListener = viewer.camera.changed.addEventListener(() => {
      const cameraHeight = viewer.camera.positionCartographic.height;
      const zoomLevel = Math.max(0, Math.min(20, 20 - Math.log10(cameraHeight / 1000)));
      setCurrentZoom(zoomLevel);
    });

    return () => {
      handler.destroy();
      removeListener();
    };
  }, [apiKey, onDoubleGlobeClick]);

  // Auto-fly to first habitat when available
  useEffect(() => {
    if (viewerRef.current && regularPoints.length > 0) {
      const firstPoint = regularPoints[0];
      const destination = Cesium.Cartesian3.fromDegrees(
        firstPoint.lng,
        firstPoint.lat,
        5000000 // 5000km altitude
      );
      setCameraPosition(destination);
    }
  }, [regularPoints]);

  const handleZoomIn = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.zoomIn(viewerRef.current.camera.positionCartographic.height * 0.5);
    }
  };

  const handleZoomOut = () => {
    if (viewerRef.current) {
      viewerRef.current.camera.zoomOut(viewerRef.current.camera.positionCartographic.height * 0.5);
    }
  };

  const handleResetView = () => {
    if (viewerRef.current) {
      if (regularPoints.length > 0) {
        const firstPoint = regularPoints[0];
        viewerRef.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            firstPoint.lng,
            firstPoint.lat,
            5000000
          ),
          duration: 2,
        });
      } else {
        viewerRef.current.camera.flyHome(2);
      }
    }
  };

  const getZoomLevel = () => {
    if (currentZoom >= 15) return 'Street';
    if (currentZoom >= 10) return 'City';
    if (currentZoom >= 5) return 'Regional';
    return 'Global';
  };

  const handleLayerToggle = (layer: string, enabled: boolean) => {
    console.log(`Conservation layer ${layer} ${enabled ? 'enabled' : 'disabled'}`);
    // Will implement GEE data layers
  };

  // Fallback to original globe if API key issues
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

  return (
    <div className="relative w-full h-screen">
      <Viewer
        ref={(ref) => {
          if (ref?.cesiumElement) {
            viewerRef.current = ref.cesiumElement;
          }
        }}
        full
        animation={false}
        timeline={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        selectionIndicator={false}
        infoBox={false}
        requestRenderMode={true}
        maximumRenderTimeChange={Infinity}
      >
        {/* Fly to position when set */}
        {cameraPosition && (
          <CameraFlyTo
            destination={cameraPosition}
            duration={2}
            once
          />
        )}

        {/* Regular habitat markers */}
        {regularPoints.map((habitat, idx) => (
          <Entity
            key={`habitat-${idx}`}
            position={Cesium.Cartesian3.fromDegrees(habitat.lng, habitat.lat)}
            point={{
              pixelSize: (habitat.size || 0.5) * 20,
              color: Cesium.Color.fromCssColorString(habitat.color || '#22c55e'),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
            }}
            onClick={() => onPointClick?.(habitat)}
          />
        ))}

        {/* Image markers */}
        {imageMarkers.map((marker, idx) => (
          <Entity
            key={`image-${idx}`}
            position={Cesium.Cartesian3.fromDegrees(marker.lng, marker.lat)}
            billboard={{
              image: marker.imageUrl,
              width: 48,
              height: 48,
              scaleByDistance: new Cesium.NearFarScalar(1.5e2, 1.0, 1.5e7, 0.5),
            }}
            onClick={() => onImageMarkerClick?.(marker)}
          />
        ))}
      </Viewer>

      {/* UI Overlays */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetView}
        zoomLevel={getZoomLevel()}
      />

      {usage && (
        <UsageIndicator
          daily={usage.daily}
          monthly={usage.monthly}
          dailyLimit={usage.dailyLimit}
          monthlyLimit={usage.monthlyLimit}
        />
      )}
    </div>
  );
};

export default CesiumGlobe;
