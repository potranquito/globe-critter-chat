import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

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
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {animals.map((animal) => (
            <CarouselItem key={animal.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
              <Card
                onClick={() => onAnimalClick(animal.id)}
                className="glass-panel cursor-pointer hover:border-primary transition-colors p-4"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <span className="text-4xl">{animal.emoji}</span>
                  <div>
                    <p className="font-medium text-foreground text-sm">{animal.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{animal.population}</p>
                  </div>
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="glass-panel -left-12" />
        <CarouselNext className="glass-panel -right-12" />
      </Carousel>
    </div>
  );
};

export default RegionalAnimalsList;
