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
    <div className="space-y-3 animate-fade-in">
      {/* Animal Image */}
      <div className="glass-panel rounded-2xl p-3 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={commonName}
          className="w-full h-48 object-cover rounded-xl"
        />
      </div>

      {/* Fast Facts Card */}
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="h-4 w-4 text-accent" />
          <h3 className="text-lg font-bold text-foreground">Fast Facts</h3>
        </div>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Common Name</p>
            <p className="text-lg font-semibold text-foreground">{commonName}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Scientific Name</p>
            <p className="text-lg font-medium text-foreground italic">{scientificName}</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Population</p>
            <p className="text-lg font-semibold text-accent">{population}</p>
          </div>
        </div>

        <Button 
          onClick={onLearnMore}
          className="w-full mt-4 bg-primary hover:bg-primary/90 glow-effect"
        >
          Learn More
        </Button>
      </div>
    </div>
  );
};

export default FastFactsCard;
