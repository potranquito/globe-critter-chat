/**
 * GlobalHealthBar Component
 * Compact widget showing global Earth health percentage
 */

import { Button } from '@/components/ui/button';
import { useGlobalHealth } from '@/hooks/useGlobalHealth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function GlobalHealthBar() {
  const { health, loading } = useGlobalHealth();

  const healthPercentage = health?.current_health || 0;

  // Determine health color based on percentage
  const getHealthColor = () => {
    if (healthPercentage < 30) return 'text-red-500';
    if (healthPercentage < 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  // Determine health emoji based on percentage
  const getHealthEmoji = () => {
    if (healthPercentage < 30) return '💩'; // Sick/poopy earth
    if (healthPercentage < 90) return '🌍'; // Healing earth
    return '🦸'; // Healthy earth with superhero
  };

  // Determine status text
  const getStatusText = () => {
    if (healthPercentage < 30) return 'Critical';
    if (healthPercentage < 50) return 'Poor';
    if (healthPercentage < 70) return 'Fair';
    if (healthPercentage < 90) return 'Good';
    return 'Excellent';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className="glass-panel hover:bg-accent rounded-xl h-12 px-3 flex items-center gap-2"
            disabled={loading}
          >
            <span className="text-xl">{getHealthEmoji()}</span>
            <span className={`text-sm font-bold ${getHealthColor()}`}>
              {healthPercentage.toFixed(1)}%
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="glass-panel border-border/50">
          <div className="text-left space-y-1">
            <p className="font-semibold">🌍 Global Earth Health</p>
            <p className="text-xs text-muted-foreground">
              Status: <span className={getHealthColor()}>{getStatusText()}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {health?.total_species?.toLocaleString() || 0} Species Tracked
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              💩🦸 Keep cleaning to reach 100%!
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
