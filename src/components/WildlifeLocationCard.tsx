import { Card } from './ui/card';
import { Button } from './ui/button';
import { MapPin, Star, MessageCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [aiInfo, setAiInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasAsked, setHasAsked] = useState(false);

  const displayImageUrl = imageUrl || (photoReference 
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoReference}&key=AIzaSyC4205XHgzRi8VswW7zqdFVanY-HoEDTIg`
    : null);

  const handleAskAboutLocation = async () => {
    setIsLoading(true);
    setHasAsked(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('location-info', {
        body: {
          name,
          address,
          rating,
          types,
          location
        }
      });

      if (error) throw error;

      if (data.success) {
        setAiInfo(data.response);
      } else {
        toast.error('Failed to get location information');
      }
    } catch (error) {
      console.error('Error fetching location info:', error);
      toast.error('Failed to get location information');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-panel p-6 max-w-md animate-fade-in max-h-[calc(100vh-200px)]">
      <div className="overflow-y-auto h-full space-y-4">
      <div className="flex justify-between items-start">
        <h2 className="text-2xl font-bold text-foreground">{name}</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>

      {displayImageUrl && (
        <div className="w-full h-48 rounded-lg overflow-hidden">
          <img 
            src={displayImageUrl} 
            alt={name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-3">
        {rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating.toFixed(1)} Rating</span>
          </div>
        )}

        {address && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{address}</span>
          </div>
        )}

        {types && types.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {types.slice(0, 3).map((type, idx) => (
              <span 
                key={idx}
                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {!hasAsked ? (
        <Button 
          onClick={handleAskAboutLocation}
          disabled={isLoading}
          className="w-full"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Learn More About This Location
        </Button>
      ) : (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-foreground whitespace-pre-line">{aiInfo}</p>
            </div>
          )}
        </div>
      )}
      </div>
    </Card>
  );
};

export default WildlifeLocationCard;
