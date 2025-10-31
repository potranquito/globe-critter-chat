/**
 * Global Health Bar Component
 * Displays the overall game progress across all users
 */

import { useProgressTracking } from '@/hooks/useProgressTracking';
import { Progress } from './ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Globe, Users, MapPin } from 'lucide-react';

interface GlobalHealthBarProps {
  variant?: 'full' | 'compact';
}

export function GlobalHealthBar({ variant = 'full' }: GlobalHealthBarProps) {
  const { globalHealth } = useProgressTracking();

  if (!globalHealth) {
    return null;
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-green-500" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Global Health</span>
            <span className="text-sm font-bold text-green-500">
              {Math.round(globalHealth.health_percentage)}%
            </span>
          </div>
          <Progress value={globalHealth.health_percentage} className="h-2" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-500" />
          Global Health Meter
        </CardTitle>
        <CardDescription>
          Track progress across all players worldwide
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Percentage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Health</span>
            <span className="text-2xl font-bold text-green-500">
              {Math.round(globalHealth.health_percentage)}%
            </span>
          </div>
          <Progress value={globalHealth.health_percentage} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">
            {globalHealth.completed_ecoregions} of {globalHealth.total_ecoregions} eco-regions completed
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-2xl font-bold">{globalHealth.active_users}</span>
            </div>
            <p className="text-xs text-muted-foreground">Active Players</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-purple-500" />
              <span className="text-2xl font-bold">{globalHealth.total_parks_completed}</span>
            </div>
            <p className="text-xs text-muted-foreground">Parks Completed</p>
          </div>
        </div>

        {/* Goal Message */}
        <div className="text-center pt-4 border-t">
          {globalHealth.health_percentage >= 100 ? (
            <p className="text-sm font-medium text-green-500">
              🎉 Goal Achieved! The planet is healthy!
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {Math.round(100 - globalHealth.health_percentage)}% to go until the planet is fully healthy!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
