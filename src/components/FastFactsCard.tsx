import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';

interface FastFactsCardProps {
  commonName: string;
  population: string;
  conservationStatus: string;
  imageUrl: string;
  onChatClick: () => void;
}

const FastFactsCard = ({ 
  commonName, 
  population, 
  conservationStatus,
  imageUrl,
  onChatClick 
}: FastFactsCardProps) => {
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
        <h3 className="text-base font-bold text-foreground mb-3">{commonName}</h3>
        
        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Conservation Status</p>
          <p className="text-base font-semibold text-accent">{conservationStatus}</p>
        </div>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Population</p>
          <p className="text-base font-semibold text-primary">{population}</p>
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
