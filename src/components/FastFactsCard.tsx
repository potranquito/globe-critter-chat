import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Animal Image */}
      <div className="w-full">
        <img
          src={imageUrl}
          alt={commonName}
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Fast Facts */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{commonName}</h3>
        <p className="text-sm text-primary mb-4">{animalType}</p>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Conservation Status</p>
          <p className="text-base font-semibold text-accent">{conservationStatus}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">Population</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-primary">{population}</p>
            <TrendIcon className={`h-4 w-4 ${populationTrend === 'increasing' ? 'text-green-500' : populationTrend === 'decreasing' ? 'text-red-500' : 'text-muted-foreground'}`} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastFactsCard;
