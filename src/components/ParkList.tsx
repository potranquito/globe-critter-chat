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
            <div className="flex items-center justify-between gap-3 pointer-events-none">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {park.name}
                </p>
                {park.size_km2 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {park.size_km2.toLocaleString()} km²
                  </p>
                )}
              </div>
              {/* Star tracking circle for trivia gamification */}
              <div className="shrink-0 relative" style={{ width: '40px', height: '40px' }}>
                {/* Circle background */}
                <svg width="40" height="40" viewBox="0 0 40 40" className="absolute inset-0">
                  <circle
                    cx="20"
                    cy="20"
                    r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-muted-foreground/30"
                  />
                </svg>
                {/* Three stars positioned on top of circle */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((index) => (
                      <svg
                        key={index}
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground/40"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
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
