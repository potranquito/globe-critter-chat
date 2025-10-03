import { Button } from './ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  zoomLevel: string;
}

const ZoomControls = ({ onZoomIn, onZoomOut, onReset, zoomLevel }: ZoomControlsProps) => {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
      <div className="glass-panel rounded-lg p-2 flex flex-col gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomIn}
          className="h-10 w-10 hover:bg-primary/20"
          title="Zoom In"
        >
          <ZoomIn className="h-5 w-5" />
        </Button>
        <div className="h-px bg-border" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onZoomOut}
          className="h-10 w-10 hover:bg-primary/20"
          title="Zoom Out"
        >
          <ZoomOut className="h-5 w-5" />
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onReset}
        className="glass-panel hover:bg-primary/20 gap-2"
        title="Reset View"
      >
        <Maximize2 className="h-4 w-4" />
        Reset
      </Button>
      <div className="glass-panel rounded-lg px-3 py-2 text-xs text-center">
        <div className="text-muted-foreground">Zoom</div>
        <div className="font-semibold">{zoomLevel}</div>
      </div>
    </div>
  );
};

export default ZoomControls;
