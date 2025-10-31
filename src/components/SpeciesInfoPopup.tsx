import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { RegionSpecies } from '@/services/regionService';
import { Button } from '@/components/ui/button';

interface SpeciesInfoPopupProps {
  species: RegionSpecies | null;
  isOpen: boolean;
  onClose: () => void;
  onLearnMore?: (parkNames: string[]) => void;
  availableParks?: string[];
}

/**
 * Get conservation status emoji
 */
function getConservationEmoji(status: string | undefined): string {
  if (!status) return '🟢';

  const statusLower = status.toLowerCase();
  if (statusLower.includes('critical') || statusLower.includes('extinct')) return '🔴';
  if (statusLower.includes('endangered')) return '🟠';
  if (statusLower.includes('vulnerable')) return '🟡';
  return '🟢';
}

/**
 * Get conservation status full name
 */
function getConservationStatusFullName(code: string | undefined): string {
  if (!code) return 'Not Evaluated';

  const statusMap: Record<string, string> = {
    'LC': 'Least Concern',
    'NT': 'Near Threatened',
    'VU': 'Vulnerable',
    'EN': 'Endangered',
    'CR': 'Critically Endangered',
    'EW': 'Extinct in the Wild',
    'EX': 'Extinct',
    'DD': 'Data Deficient',
    'NE': 'Not Evaluated'
  };

  return statusMap[code.toUpperCase()] || code;
}

export const SpeciesInfoPopup = ({
  species,
  isOpen,
  onClose,
  onLearnMore,
  availableParks = []
}: SpeciesInfoPopupProps) => {
  if (!species) return null;

  const conservationEmoji = getConservationEmoji(species.conservationStatus);
  const conservationStatus = getConservationStatusFullName(species.conservationStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-panel max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {species.commonName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground italic">
            {species.scientificName}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Species Image */}
          {species.imageUrl && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
              <img
                src={species.imageUrl}
                alt={species.commonName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Type:</span>
              <span>{species.animalType || 'Unknown'}</span>
            </div>

            {species.dietaryCategory && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Diet:</span>
                <span>{species.dietaryCategory}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="font-semibold">Conservation Status:</span>
              <span className="flex items-center gap-1">
                {conservationEmoji} {conservationStatus}
              </span>
            </div>

            {species.habitatInfo && (
              <div className="space-y-1">
                <span className="font-semibold">Habitat:</span>
                <p className="text-sm text-muted-foreground">{species.habitatInfo}</p>
              </div>
            )}

            {species.isInvasive && (
              <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-2">
                <span className="text-red-400 font-semibold">⚠️ Invasive Species</span>
              </div>
            )}

            {species.isVenomous && (
              <div className="bg-orange-500/20 border border-orange-500/40 rounded-lg p-2">
                <span className="text-orange-400 font-semibold">☠️ Venomous</span>
              </div>
            )}
          </div>

          {/* Learn More Section */}
          {availableParks.length > 0 && onLearnMore && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold">Want to learn more?</p>
              <p className="text-xs text-muted-foreground">
                Found in: {availableParks.join(', ')}
              </p>
              <Button
                onClick={() => onLearnMore(availableParks)}
                className="w-full"
                size="sm"
              >
                Learn More in Park →
              </Button>
            </div>
          )}

          {/* Close Button */}
          <Button onClick={onClose} variant="outline" className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
