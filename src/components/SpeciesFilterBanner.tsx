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
import { UI_GROUP_FILTERS, CONSERVATION_FILTERS, type FilterCategory } from '@/types/speciesFilter';

interface SpeciesFilterBannerProps {
  activeFilters: Set<FilterCategory>;
  onFilterToggle: (filterId: FilterCategory) => void;
}

export const SpeciesFilterBanner = ({
  activeFilters,
  onFilterToggle,
}: SpeciesFilterBannerProps) => {
  const [isConservationExpanded, setIsConservationExpanded] = useState(false);

  const isUIGroupFilterActive = () => {
    return UI_GROUP_FILTERS.some(filter => activeFilters.has(filter.id));
  };

  const isConservationFilterActive = () => {
    return CONSERVATION_FILTERS.some(filter => activeFilters.has(filter.id));
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-panel rounded-r-2xl rounded-l-none p-2 w-16 flex flex-col animate-fade-in" style={{height: 'calc(100vh - 48px)'}}>
        {/* Header */}
        <div className="text-center mb-2 pb-2 border-b border-border/50">
          <h3 className="text-[10px] font-semibold text-muted-foreground">Filters</h3>
        </div>

        {/* Scrollable Filter Options */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-2">
            {/* UI Group Filters - Animals, Birds, Plants & Corals */}
            {UI_GROUP_FILTERS.map((filter) => (
              <Tooltip key={filter.id}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant={activeFilters.has(filter.id) ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-full h-12 text-xl ${
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
                <TooltipContent side="right" className="glass-panel">
                  <p className="font-semibold">{filter.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Divider */}
            <div className="my-1 border-t border-border/50" />

            {/* Conservation Status Filter with Expandable Sub-menu */}
            <div className="relative">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button
                      variant={isConservationFilterActive() ? 'default' : 'ghost'}
                      size="icon"
                      className={`w-full h-12 text-xl relative ${
                        isConservationFilterActive() ? 'bg-primary/20 hover:bg-primary/30' : ''
                      }`}
                      onClick={() => setIsConservationExpanded(!isConservationExpanded)}
                    >
                      <span>⚠️</span>
                      {/* Expansion indicator */}
                      <div className="absolute bottom-1 right-1">
                        {isConservationExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                      </div>
                    </Button>
                    {isConservationFilterActive() && (
                      <div className="absolute -right-1 -top-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="glass-panel">
                  <p className="font-semibold">Conservation Status</p>
                  <p className="text-xs text-muted-foreground">Click to expand categories</p>
                </TooltipContent>
              </Tooltip>

              {/* Conservation Sub-categories */}
              {isConservationExpanded && (
                <div className="mt-1 ml-1 space-y-1 animate-fade-in">
                  {CONSERVATION_FILTERS.map((filter) => (
                    <Tooltip key={filter.id}>
                      <TooltipTrigger asChild>
                        <div className="relative">
                          <Button
                            variant={activeFilters.has(filter.id) ? 'default' : 'ghost'}
                            size="icon"
                            className={`w-12 h-10 text-lg ${
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
                      <TooltipContent side="right" className="glass-panel">
                        <p className="font-semibold">{filter.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
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
