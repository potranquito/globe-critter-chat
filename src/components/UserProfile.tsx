/**
 * UserProfile Component
 * Displays user avatar and stats in top-right corner
 * Shows dropdown menu with profile options
 */

import { User, Trophy, BarChart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

export function UserProfile() {
  const { user, loading, signIn, signOut } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="fixed top-8 right-8 z-[100] pointer-events-auto">
        <Button
          variant="outline"
          className="glass-panel rounded-xl h-12 px-4"
          disabled
        >
          Loading...
        </Button>
      </div>
    );
  }

  // Show sign in button if not authenticated
  if (!user) {
    return (
      <div className="fixed top-8 right-8 z-[100] pointer-events-auto">
        <Button
          onClick={signIn}
          className="glass-panel rounded-xl h-12 px-6 bg-primary/90 hover:bg-primary text-primary-foreground"
        >
          Sign In
        </Button>
      </div>
    );
  }

  // Get first letter of username for avatar fallback
  const avatarFallback = user.username.charAt(0).toUpperCase();

  // Calculate progress towards next milestone (every 100 health points)
  const currentMilestone = Math.floor(user.health_contributed / 100) * 100;
  const nextMilestone = currentMilestone + 100;
  const progressToNextMilestone = ((user.health_contributed - currentMilestone) / 100) * 100;

  return (
    <div className="fixed top-8 right-8 z-[100] pointer-events-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="glass-panel rounded-xl h-12 px-4 flex gap-3 hover:bg-white/10 transition-colors"
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                {avatarFallback}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm font-medium leading-none">{user.username}</p>
              <p className="text-xs text-primary font-semibold mt-0.5">
                ⚡ {user.health_contributed} Health
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-72 glass-panel border-border/50"
        >
          {/* User Stats Header */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url || undefined} alt={user.username} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-lg">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            {/* Health Progress */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Health Contribution</span>
                <span className="font-medium">
                  {user.health_contributed} / {nextMilestone}
                </span>
              </div>
              <Progress value={progressToNextMilestone} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {nextMilestone - user.health_contributed} to next milestone
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-3 grid grid-cols-2 gap-3 border-b border-border/50">
            <div className="text-center p-2 bg-primary/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Lessons</p>
              <p className="text-2xl font-bold text-primary">
                {user.total_lessons_completed}
              </p>
            </div>
            <div className="text-center p-2 bg-accent/5 rounded-lg">
              <p className="text-xs text-muted-foreground">Badges</p>
              <p className="text-2xl font-bold text-accent">
                {/* TODO: Will be populated from user_badges count */}
                0
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>View Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Trophy className="mr-2 h-4 w-4" />
              <span>My Badges</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <BarChart className="mr-2 h-4 w-4" />
              <span>Progress</span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />

          {/* Sign Out */}
          <div className="py-1">
            <DropdownMenuItem
              onClick={signOut}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
