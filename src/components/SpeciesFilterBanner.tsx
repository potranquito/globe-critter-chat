import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { FILTER_OPTIONS, ANIMAL_FILTERS, type FilterCategory } from '@/types/speciesFilter';

interface SpeciesFilterBannerProps {
  activeFilters: Set<FilterCategory>;
  onFilterToggle: (filterId: FilterCategory) => void;
}

export const SpeciesFilterBanner = ({
  activeFilters,
  onFilterToggle,
}: SpeciesFilterBannerProps) => {
  const [isAnimalsExpanded, setIsAnimalsExpanded] = useState(false);

  const isAnimalFilterActive = () => {
    return ANIMAL_FILTERS.some(filter => activeFilters.has(filter.id));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-panel rounded-2xl p-2 w-20 h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="text-center mb-3 pb-2 border-b border-border/50">
          <h3 className="text-xs font-semibold text-muted-foreground">Filters</h3>
        </div>

        {/* Scrollable Filter Options */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2">
            {/* Animals Filter with Expandable Sub-menu */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant={isAnimalFilterActive() ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-full h-14 text-2xl relative ${
                        isAnimalFilterActive() ? 'bg-primary/20 hover:bg-primary/30' : ''
                      }`}
                      onClick={() => setIsAnimalsExpanded(!isAnimalsExpanded)}
                    >
                      <span>🦁</span>
                      {/* Expansion indicator */}
                      <div className="absolute bottom-1 right-1">
                        {isAnimalsExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </Button>
                    {isAnimalFilterActive() && (
                      <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="glass-panel">
                  <p className="font-semibold">Animals</p>
                  <p className="text-xs text-muted-foreground">Click to expand categories</p>
                </TooltipContent>
              </Tooltip>

              {/* Animal Sub-categories */}
              {isAnimalsExpanded && (
                <div className="mt-2 ml-2 space-y-1 animate-fade-in">
                  {ANIMAL_FILTERS.map((filter) => (
                    <Tooltip key={filter.id}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Button
                            variant={activeFilters.has(filter.id) ? 'default' : 'ghost'}
                            size="icon"
                            className={`w-14 h-12 text-xl ${
                              activeFilters.has(filter.id) ? 'bg-primary/20 hover:bg-primary/30' : ''
                            }`}
                            onClick={() => onFilterToggle(filter.id)}
                          >
                            <span>{filter.emoji}</span>
                          </Button>
                          {activeFilters.has(filter.id) && (
                            <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="glass-panel">
                        <p className="font-semibold">{filter.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>

            {/* Other Filters */}
            {FILTER_OPTIONS.filter(f => f.id !== 'all-animals').map((filter) => (
              <Tooltip key={filter.id}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant={activeFilters.has(filter.id) ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-full h-14 text-2xl ${
                        activeFilters.has(filter.id) ? 'bg-primary/20 hover:bg-primary/30' : ''
                      }`}
                      onClick={() => onFilterToggle(filter.id)}
                    >
                      <span>{filter.emoji}</span>
                    </Button>
                    {activeFilters.has(filter.id) && (
                      <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="glass-panel">
                  <p className="font-semibold">{filter.label}</p>
                  {filter.description && (
                    <p className="text-xs text-muted-foreground">{filter.description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        {/* Active Filter Count */}
        {activeFilters.size > 0 && (
          <div className="mt-3 pt-2 border-t border-border/50 text-center">
            <div className="w-6 h-6 mx-auto bg-primary rounded-full flex items-center justify-center text-xs font-bold">
              {activeFilters.size}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};
