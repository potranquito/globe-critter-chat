import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type SpeciesTypeFilter = 'all' | 'carnivores' | 'herbivores' | 'omnivores' | 'producers';

interface SpeciesTypeFilterProps {
  activeFilter: SpeciesTypeFilter;
  onFilterChange: (filter: SpeciesTypeFilter) => void;
  showCorals?: boolean; // Show "Plants & Corals" instead of just "Plants" for marine regions
}

export const SpeciesTypeFilter = ({
  activeFilter,
  onFilterChange,
  showCorals = false
}: SpeciesTypeFilterProps) => {

  const filters = [
    {
      id: 'all' as SpeciesTypeFilter,
      label: 'All',
      emoji: '🌍',
      description: 'Show all species'
    },
    {
      id: 'carnivores' as SpeciesTypeFilter,
      label: 'Carnivores',
      emoji: '🥩',
      description: 'Meat-eating predators and scavengers'
    },
    {
      id: 'herbivores' as SpeciesTypeFilter,
      label: 'Herbivores',
      emoji: '🌱',
      description: 'Plant-eating grazers and browsers'
    },
    {
      id: 'omnivores' as SpeciesTypeFilter,
      label: 'Omnivores',
      emoji: '🍽️',
      description: 'Mixed diet - plants and animals'
    },
    {
      id: 'producers' as SpeciesTypeFilter,
      label: 'Producers',
      emoji: '☀️',
      description: 'Plants and corals (energy producers)'
    }
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="glass-panel rounded-2xl p-1.5 w-14 flex flex-col gap-1.5 animate-fade-in" style={{height: 'calc(100vh - 48px)'}}>
        {/* Header */}
        <div className="text-center pb-1.5 border-b border-border/50">
          <h3 className="text-[9px] font-semibold text-muted-foreground">Type</h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-col gap-1.5 flex-1">
          {filters.map((filter) => (
            <Tooltip key={filter.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Button
                    variant={activeFilter === filter.id ? 'default' : 'ghost'}
                    size="icon"
                    className={`w-full h-12 text-xl ${
                      activeFilter === filter.id ? 'bg-primary/20 hover:bg-primary/30' : ''
                    }`}
                    onClick={() => onFilterChange(filter.id)}
                  >
                    <span>{filter.emoji}</span>
                  </Button>
                  {activeFilter === filter.id && (
                    <div className="absolute -right-0.5 -top-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass-panel">
                <p className="font-semibold">{filter.label}</p>
                <p className="text-xs text-muted-foreground">{filter.description}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};
