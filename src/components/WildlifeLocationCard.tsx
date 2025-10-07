import { Card } from './ui/card';
import { MapPin, Star } from 'lucide-react';

interface WildlifeLocationCardProps {
  name: string;
  address?: string;
  rating?: number;
  types?: string[];
  photoReference?: string;
  onClick?: () => void;
}

const WildlifeLocationCard = ({ 
  name, 
  address, 
  rating,
  types,
  photoReference,
  onClick 
}: WildlifeLocationCardProps) => {
  const apiKey = 'AIzaSyC4205XHgzRi8VswW7zqdFVanY-HoEDTIg'; // From google-maps-proxy
  const photoUrl = photoReference 
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=200&photoreference=${photoReference}&key=${apiKey}`
    : null;

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all bg-card/95 backdrop-blur-sm border-2 border-primary/20 overflow-hidden"
      onClick={onClick}
    >
      {photoUrl ? (
        <div className="w-full h-32 overflow-hidden">
          <img 
            src={photoUrl} 
            alt={name}
            className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <MapPin className="w-12 h-12 text-primary/40" />
        </div>
      )}
      
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{name}</h3>
        
        {rating && (
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs text-muted-foreground">{rating.toFixed(1)}</span>
          </div>
        )}
        
        {address && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex items-start gap-1">
            <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>{address}</span>
          </p>
        )}
        
        {types && types.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {types.slice(0, 2).map((type, idx) => (
              <span 
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default WildlifeLocationCard;
