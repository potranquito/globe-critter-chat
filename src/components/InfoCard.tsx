import { Button } from '@/components/ui/button';

type InfoCardType = 'ecoregion' | 'park' | 'species';

interface BaseInfoCardProps {
  type: InfoCardType;
  imageUrl?: string;
  onPlayClick?: () => void;
}

interface EcoRegionInfoCardProps extends BaseInfoCardProps {
  type: 'ecoregion';
  regionName: string;
  description?: string;
  speciesCount: number;
  locationCount: number;
  imageAttribution?: string;
}

interface ParkInfoCardProps extends BaseInfoCardProps {
  type: 'park';
  parkName: string;
  parkType?: string;
  size?: number; // in km²
  protectionStatus?: string;
  imageAttribution?: string;
}

interface SpeciesInfoCardProps extends BaseInfoCardProps {
  type: 'species';
  commonName: string;
  scientificName: string;
  animalType: string;
  conservationStatus: string;
  dietaryCategory?: string;
  habitatInfo?: string;
}

type InfoCardProps = EcoRegionInfoCardProps | ParkInfoCardProps | SpeciesInfoCardProps;

export const InfoCard = (props: InfoCardProps) => {
  const { type, imageUrl, onPlayClick } = props;

  // Map region names to appropriate emojis
  const getRegionEmoji = (name: string) => {
    if (name.toLowerCase().includes('arctic')) return '❄️';
    if (name.toLowerCase().includes('amazon') || name.toLowerCase().includes('rainforest')) return '🌳';
    if (name.toLowerCase().includes('congo') || name.toLowerCase().includes('basin')) return '🌳';
    if (name.toLowerCase().includes('desert')) return '🏜️';
    if (name.toLowerCase().includes('reef') || name.toLowerCase().includes('ocean')) return '🌊';
    if (name.toLowerCase().includes('savanna') || name.toLowerCase().includes('grassland')) return '🦁';
    return '🌍';
  };

  // Get conservation status color
  const getConservationColor = (status: string) => {
    const lower = status.toLowerCase();
    if (lower.includes('critical') || lower.includes('extinct')) return 'text-red-500';
    if (lower.includes('endangered')) return 'text-orange-500';
    if (lower.includes('vulnerable')) return 'text-yellow-500';
    if (lower.includes('least concern')) return 'text-green-500';
    return 'text-blue-500';
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in shadow-2xl">
      {/* Image Section */}
      <div className="w-full">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={type === 'ecoregion' ? props.regionName : type === 'park' ? props.parkName : props.commonName}
              className="w-full h-64 object-cover"
            />
            {((type === 'park' && props.imageAttribution) || (type === 'ecoregion' && props.imageAttribution)) && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white/80 text-xs px-2 py-1">
                {type === 'park' ? props.imageAttribution : type === 'ecoregion' ? props.imageAttribution : ''}
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-2">
                {type === 'ecoregion' && getRegionEmoji(props.regionName)}
                {type === 'park' && '🏞️'}
                {type === 'species' && '🦁'}
              </div>
              <p className="text-lg font-semibold text-foreground">
                {type === 'ecoregion' && props.regionName}
                {type === 'park' && props.parkName}
                {type === 'species' && props.commonName}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-5">
        {/* Eco-Region Info */}
        {type === 'ecoregion' && (
          <>
            <h3 className="text-xl font-bold text-foreground mb-1">{props.regionName}</h3>
            {props.description && (
              <p className="text-sm text-muted-foreground mb-4">{props.description}</p>
            )}

            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Species Discovered</p>
              <p className="text-base font-semibold text-primary">
                {props.speciesCount > 0 ? `${props.speciesCount} species` : 'Loading species...'}
              </p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Protected Locations</p>
              <p className="text-base font-semibold text-accent">
                {props.locationCount > 0 ? `${props.locationCount} parks & refuges` : 'Loading locations...'}
              </p>
            </div>
          </>
        )}

        {/* Park Info */}
        {type === 'park' && (
          <>
            <h3 className="text-xl font-bold text-foreground mb-1">{props.parkName}</h3>
            {props.parkType && (
              <p className="text-sm text-primary mb-4">{props.parkType}</p>
            )}

            {props.size && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Protected Area Size</p>
                <p className="text-base font-semibold text-primary">
                  {props.size.toLocaleString()} km²
                </p>
              </div>
            )}

            {props.protectionStatus && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Protection Status</p>
                <p className="text-base font-semibold text-accent">{props.protectionStatus}</p>
              </div>
            )}
          </>
        )}

        {/* Species Info */}
        {type === 'species' && (
          <>
            <h3 className="text-xl font-bold text-foreground mb-1">{props.commonName}</h3>
            <p className="text-sm text-muted-foreground italic mb-4">{props.scientificName}</p>

            <div className="mb-3">
              <p className="text-xs text-muted-foreground">Species Type</p>
              <p className="text-base font-semibold text-primary">{props.animalType}</p>
            </div>

            {props.dietaryCategory && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Diet</p>
                <p className="text-base font-semibold text-primary capitalize">{props.dietaryCategory}</p>
              </div>
            )}

            {props.habitatInfo && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Habitat</p>
                <p className="text-base font-semibold text-primary">{props.habitatInfo}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-muted-foreground">Conservation Status</p>
              <p className={`text-base font-semibold ${getConservationColor(props.conservationStatus)}`}>
                {props.conservationStatus}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                📚 Study this species for the trivia game!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
