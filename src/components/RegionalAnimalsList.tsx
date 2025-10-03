import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Animal {
  id: string;
  name: string;
  population: string;
  emoji: string;
}

interface RegionalAnimalsListProps {
  animals: Animal[];
  region: string;
  onAnimalClick: (animalId: string) => void;
  onClose: () => void;
}

const RegionalAnimalsList = ({ animals, region, onAnimalClick, onClose }: RegionalAnimalsListProps) => {
  return (
    <div className="glass-panel rounded-2xl p-4 animate-float">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-foreground">
          Endangered Species in {region}
        </h3>
        <Button
          onClick={onClose}
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {animals.map((animal) => (
          <Card
            key={animal.id}
            onClick={() => onAnimalClick(animal.id)}
            className="glass-panel cursor-pointer hover:border-primary transition-colors px-4 py-3 flex items-center gap-3"
          >
            <span className="text-2xl">{animal.emoji}</span>
            <div>
              <p className="font-medium text-foreground text-sm">{animal.name}</p>
              <p className="text-xs text-muted-foreground">{animal.population}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RegionalAnimalsList;
