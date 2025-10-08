import { Button } from "@/components/ui/button";
import { MapPin, Map } from "lucide-react";

interface MapControlsProps {
  useGoogleMaps: boolean;
  onToggleMap: () => void;
  onFetchLocation: () => void;
  onFilterClick: () => void;
}

const MapControls = ({ useGoogleMaps, onToggleMap, onFetchLocation, onFilterClick }: MapControlsProps) => {
  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={onFetchLocation}
        size="icon"
        variant="outline"
        className="glass-panel hover:bg-accent rounded-xl h-12 w-12"
        title="Find My Location"
      >
        <MapPin className="h-5 w-5" />
      </Button>

      <Button
        onClick={onToggleMap}
        size="icon"
        variant="outline"
        className="glass-panel hover:bg-accent rounded-xl h-12 w-12"
        title={useGoogleMaps ? "Switch to Globe" : "Switch to Map"}
      >
        <Map className="h-5 w-5" />
      </Button>

      <Button
        onClick={onFilterClick}
        size="icon"
        variant="outline"
        className="glass-panel hover:bg-accent rounded-xl h-12 w-12"
        title="Filters"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </Button>
    </div>
  );
};

export default MapControls;
