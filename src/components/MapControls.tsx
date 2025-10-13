import { Button } from "@/components/ui/button";
import { MapPin, Map, Trophy, Loader2 } from "lucide-react";
import { GlobalHealthBar } from "@/components/GlobalHealthBar";

interface MapControlsProps {
  useGoogleMaps: boolean;
  onToggleMap: () => void;
  onFetchLocation: () => void;
  onLeaderboardClick: () => void;
  isDiscovering?: boolean;
}

const MapControls = ({ useGoogleMaps, onToggleMap, onFetchLocation, onLeaderboardClick, isDiscovering = false }: MapControlsProps) => {
  return (
    <div className="flex flex-row gap-2">
      <Button
        onClick={onFetchLocation}
        size="icon"
        variant="outline"
        className="glass-panel hover:bg-accent rounded-xl h-12 w-12"
        title={isDiscovering ? "Discovering locations..." : "Find My Location"}
        disabled={isDiscovering}
      >
        {isDiscovering ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <MapPin className="h-5 w-5" />
        )}
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
        onClick={onLeaderboardClick}
        size="icon"
        variant="outline"
        className="glass-panel hover:bg-accent rounded-xl h-12 w-12"
        title="Leaderboard"
      >
        <Trophy className="h-5 w-5" />
      </Button>

      {/* Global Health Widget */}
      <GlobalHealthBar />
    </div>
  );
};

export default MapControls;
