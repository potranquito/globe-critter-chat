import { Button } from '@/components/ui/button';

interface Park {
  id: string;
  name: string;
  park_type?: string;
  size_km2?: number;
  protection_status?: string;
  image_url?: string;
  image_attribution?: string;
}

interface ParkListProps {
  parks: Park[];
  selectedPark: Park | null;
  onParkClick: (park: Park) => void;
}

export const ParkList = ({ parks, selectedPark, onParkClick }: ParkListProps) => {
  if (parks.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-3 border-b border-border/50 bg-gradient-to-r from-primary/10 to-primary/5">
        <h3 className="text-sm font-semibold text-foreground">
          🏞️ Protected Areas ({parks.length})
        </h3>
      </div>

      {/* Park List - Scrollable */}
      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '300px' }}>
        {parks.map((park) => (
          <button
            key={park.id}
            onClick={(e) => {
              e.stopPropagation();
              onParkClick(park);
            }}
            className={`w-full text-left px-3 py-2.5 border-b border-border/30 transition-all hover:bg-primary/10 cursor-pointer ${
              selectedPark?.id === park.id
                ? 'bg-primary/20 border-l-4 border-l-primary'
                : 'border-l-4 border-l-transparent'
            }`}
          >
            <div className="flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {park.name}
                </p>
                {park.park_type && (
                  <p className="text-xs text-muted-foreground truncate">
                    {park.park_type}
                  </p>
                )}
              </div>
              {park.size_km2 && (
                <div className="shrink-0">
                  <p className="text-xs text-primary font-semibold">
                    {park.size_km2.toLocaleString()} km²
                  </p>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb), 0.3);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb), 0.5);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(var(--primary-rgb), 0.3) rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};
