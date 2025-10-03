import { Button } from '@/components/ui/button';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface FastFactsCardProps {
  commonName: string;
  animalType: string;
  population: string;
  populationTrend: 'increasing' | 'decreasing' | 'stable';
  conservationStatus: string;
  imageUrl: string;
  onChatClick: () => void;
}

const FastFactsCard = ({ 
  commonName,
  animalType,
  population,
  populationTrend,
  conservationStatus,
  imageUrl,
  onChatClick 
}: FastFactsCardProps) => {
  const TrendIcon = populationTrend === 'increasing' ? TrendingUp : populationTrend === 'decreasing' ? TrendingDown : Minus;
  return (
    <div className="space-y-2 animate-fade-in">
      {/* Animal Image */}
      <div className="glass-panel rounded-2xl p-3 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={commonName}
          className="w-full h-40 object-cover rounded-xl"
        />
      </div>

      {/* Fast Facts Card */}
      <div className="glass-panel rounded-2xl p-3">
        <h3 className="text-base font-bold text-foreground mb-1">{commonName}</h3>
        <p className="text-sm text-muted-foreground mb-3">{animalType}</p>
        
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Conservation Status</p>
          <p className="text-base font-semibold text-accent">{conservationStatus}</p>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Population</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-primary">{population}</p>
            <TrendIcon className={`h-4 w-4 ${populationTrend === 'increasing' ? 'text-green-500' : populationTrend === 'decreasing' ? 'text-red-500' : 'text-muted-foreground'}`} />
          </div>
        </div>

        <Button 
          size="sm"
          onClick={onChatClick}
          className="w-full bg-pink-200 hover:bg-pink-300 text-pink-900 glow-effect"
        >
          <Heart className="h-3 w-3 mr-2" />
          Rescue Me
        </Button>
      </div>
    </div>
  );
};

export default FastFactsCard;
