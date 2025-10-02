import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface FastFactsCardProps {
  commonName: string;
  scientificName: string;
  population: string;
  imageUrl: string;
  onLearnMore: () => void;
}

const FastFactsCard = ({ 
  commonName, 
  scientificName, 
  population, 
  imageUrl,
  onLearnMore 
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
        <h3 className="text-base font-bold text-foreground mb-2">{commonName}</h3>
        <div className="flex items-center gap-2 mb-2.5">
          <Info className="h-4 w-4 text-accent" />
          <p className="text-sm font-semibold text-foreground">Fast Facts</p>
        </div>
        
        <div className="space-y-2.5">
          <div>
            <p className="text-xs text-muted-foreground">Scientific Name</p>
            <p className="text-base font-medium text-foreground italic">{scientificName}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground">Population</p>
            <p className="text-base font-semibold text-accent">{population}</p>
          </div>
        </div>

        <Button 
          size="sm"
          onClick={onLearnMore}
          className="w-full mt-3 bg-primary hover:bg-primary/90 glow-effect"
        >
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default FastFactsCard;
