import { MapPin, Star } from 'lucide-react';

interface WildlifeLocationCardProps {
  name: string;
  address?: string;
  rating?: number;
  imageUrl?: string;
  photoReference?: string;
  types?: string[];
  location: { lat: number; lng: number };
  onClose: () => void;
}

const WildlifeLocationCard = ({
  name,
  address,
  rating,
  imageUrl,
  photoReference,
  types,
  location,
  onClose
}: WildlifeLocationCardProps) => {

  const displayImageUrl = imageUrl || (photoReference
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=AIzaSyC4205XHgzRi8VswW7zqdFVanY-HoEDTIg`
    : null);

  // Format location type for display
  const getLocationType = () => {
    if (!types || types.length === 0) return 'Wildlife Location';

    const type = types[0].replace(/_/g, ' ');
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Location Image or Placeholder */}
      <div className="w-full">
        {displayImageUrl ? (
          <img
            src={displayImageUrl}
            alt={name}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-2">🌳</div>
              <p className="text-sm text-muted-foreground">Wildlife Park</p>
            </div>
          </div>
        )}
      </div>

      {/* Fast Facts */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{name}</h3>
        <p className="text-sm text-primary mb-4">{getLocationType()}</p>

        {rating && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Rating</p>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-primary">{rating.toFixed(1)}</p>
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        )}

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Coordinates</p>
          <p className="text-base font-semibold text-primary">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        </div>

        {address && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            <MapPin className="h-3 w-3" />
            <span>{address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WildlifeLocationCard;
