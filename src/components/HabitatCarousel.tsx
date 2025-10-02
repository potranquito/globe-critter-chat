import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HabitatCarouselProps {
  images: string[];
  locationName: string;
}

const HabitatCarousel = ({ images, locationName }: HabitatCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-4 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">{locationName}</h3>
      </div>

      <div className="relative">
        <img 
          src={images[currentIndex]} 
          alt={`${locationName} habitat ${currentIndex + 1}`}
          className="w-full h-48 object-cover rounded-xl"
        />
        
        {images.length > 1 && (
          <>
            <Button
              onClick={goToPrevious}
              size="icon"
              variant="secondary"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={goToNext}
              size="icon"
              variant="secondary"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex 
                      ? 'w-6 bg-primary' 
                      : 'w-1.5 bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HabitatCarousel;
