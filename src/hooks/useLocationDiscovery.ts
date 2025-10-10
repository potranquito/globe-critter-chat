/**
 * useLocationDiscovery Hook
 * Integrates location discovery service with the Globe/Map components
 */

import { useState, useCallback } from 'react';
import {
  discoverHabitatsByGeolocation,
  discoverLocationsByGeolocation,
  discoverByUserInput,
  type UnifiedLocation,
  type DiscoveryResult
} from '@/services/locationDiscovery';
import type { HabitatPoint } from '@/components/Globe';
import { useToast } from './use-toast';

export function useLocationDiscovery() {
  const [discoveredLocations, setDiscoveredLocations] = useState<UnifiedLocation[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [lastDiscovery, setLastDiscovery] = useState<DiscoveryResult | null>(null);
  const { toast } = useToast();

  /**
   * Convert UnifiedLocation to HabitatPoint for Globe component
   */
  const convertToHabitatPoints = useCallback((locations: UnifiedLocation[]): HabitatPoint[] => {
    return locations.map((loc) => {
      // Determine marker appearance based on type
      let emoji = '';
      let color = '#10b981'; // default green
      let size = 1.0;

      switch (loc.type) {
        case 'habitat_region':
          emoji = '🌍'; // Earth for protected areas
          color = '#10b981'; // green
          size = 1.5;
          break;
        case 'ebird_hotspot':
          emoji = '🐦'; // Bird for eBird hotspots
          color = '#3b82f6'; // blue
          size = 1.0;
          break;
        case 'national_park':
          emoji = '🏞️'; // Mountain/park
          color = '#059669'; // darker green
          size = 1.2;
          break;
        case 'wildlife_refuge':
          emoji = '🦅'; // Eagle
          color = '#f59e0b'; // amber
          size = 1.2;
          break;
        case 'nature_reserve':
          emoji = '🌲'; // Tree
          color = '#34d399'; // emerald
          size = 1.0;
          break;
        default:
          emoji = '📍'; // Pin
          color = '#6366f1'; // indigo
          size = 0.8;
      }

      return {
        lat: loc.latitude,
        lng: loc.longitude,
        name: loc.name,
        species: loc.name, // Use name as species for tooltip
        emoji,
        color,
        size,
        type: 'habitat' as const,
        title: `${loc.name} (${loc.source})`,
      };
    });
  }, []);

  /**
   * Discover habitats near coordinates (for 3D globe)
   */
  const discoverNearbyHabitats = useCallback(async (
    lat: number,
    lng: number,
    radiusKm: number = 50
  ) => {
    setIsDiscovering(true);
    try {
      const result = await discoverHabitatsByGeolocation(lat, lng, radiusKm);
      setDiscoveredLocations(result.locations);
      setLastDiscovery(result);

      toast({
        title: 'Habitats Discovered',
        description: `Found ${result.locations.length} protected areas nearby`,
      });

      return result;
    } catch (error) {
      console.error('Error discovering habitats:', error);
      toast({
        title: 'Discovery Failed',
        description: error instanceof Error ? error.message : 'Failed to discover habitats',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  }, [toast]);

  /**
   * Discover specific locations near coordinates (for 2D map)
   */
  const discoverNearbyLocations = useCallback(async (
    lat: number,
    lng: number,
    radiusKm: number = 10,
    googleMapsApiKey?: string
  ) => {
    setIsDiscovering(true);
    try {
      const result = await discoverLocationsByGeolocation(lat, lng, radiusKm, googleMapsApiKey);
      setDiscoveredLocations(result.locations);
      setLastDiscovery(result);

      toast({
        title: 'Locations Discovered',
        description: `Found ${result.locations.length} parks, refuges, and hotspots`,
      });

      return result;
    } catch (error) {
      console.error('Error discovering locations:', error);
      toast({
        title: 'Discovery Failed',
        description: error instanceof Error ? error.message : 'Failed to discover locations',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  }, [toast]);

  /**
   * Discover locations by user search query
   */
  const discoverBySearch = useCallback(async (
    query: string,
    viewMode: '3d' | '2d',
    googleMapsApiKey?: string
  ) => {
    setIsDiscovering(true);
    try {
      const result = await discoverByUserInput(query, viewMode, googleMapsApiKey);
      setDiscoveredLocations(result.locations);
      setLastDiscovery(result);

      toast({
        title: 'Location Found',
        description: `Discovered ${result.locations.length} locations for "${query}"`,
      });

      return result;
    } catch (error) {
      console.error('Error discovering by search:', error);
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to find location',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsDiscovering(false);
    }
  }, [toast]);

  /**
   * Get habitat points for Globe component
   */
  const getHabitatPoints = useCallback((): HabitatPoint[] => {
    return convertToHabitatPoints(discoveredLocations);
  }, [discoveredLocations, convertToHabitatPoints]);

  /**
   * Clear discovered locations
   */
  const clearDiscovery = useCallback(() => {
    setDiscoveredLocations([]);
    setLastDiscovery(null);
  }, []);

  return {
    // State
    discoveredLocations,
    isDiscovering,
    lastDiscovery,

    // Actions
    discoverNearbyHabitats,
    discoverNearbyLocations,
    discoverBySearch,
    clearDiscovery,

    // Utilities
    getHabitatPoints,
  };
}
