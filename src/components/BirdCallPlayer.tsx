import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BirdCallPlayerProps {
  scientificName: string;
  commonName?: string;
  size?: 'sm' | 'md' | 'lg';
}

interface BirdCall {
  audioUrl: string;
  xcId: string;
  quality: string;
  recordist?: string;
  lengthSeconds?: number;
}

export const BirdCallPlayer = ({
  scientificName,
  commonName,
  size = 'md'
}: BirdCallPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [birdCall, setBirdCall] = useState<BirdCall | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sizeClasses = {
    sm: 'h-6 w-6 text-sm',
    md: 'h-8 w-8 text-base',
    lg: 'h-10 w-10 text-lg'
  };

  const fetchBirdCall = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🐦 Fetching bird call for: ${scientificName}`);

      const { data, error } = await supabase.functions.invoke('fetch-bird-call', {
        body: { scientificName }
      });

      console.log('🐦 Response:', { data, error });

      if (error) {
        console.error('🐦 Supabase function error:', error);
        throw error;
      }

      if (data.success && data.call) {
        console.log('🐦 Got bird call:', data.call);
        setBirdCall(data.call);
        return data.call.audioUrl;
      } else {
        console.log('🐦 No recordings found');
        setError('No recordings available');
        return null;
      }
    } catch (err) {
      console.error('🐦 Error fetching bird call:', err);
      setError('Failed to load bird call');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    // Reset error on user retry
    if (error) {
      setError(null);
    }

    if (!audioRef.current) {
      // First time - fetch and create audio element
      const audioUrl = await fetchBirdCall();
      if (!audioUrl) return;

      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('ended', () => setIsPlaying(false));
      audioRef.current.addEventListener('error', () => {
        setError('Audio playback failed');
        setIsPlaying(false);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Error playing audio:', err);
        setError('Audio playback failed');
        setIsPlaying(false);
      }
    }
  };

  // Reset audio when species changes
  useEffect(() => {
    // Clear previous audio and state when switching to a different species
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setBirdCall(null);
    setIsPlaying(false);
    setError(null);
  }, [scientificName]); // Re-run whenever scientificName changes

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // NEVER hide the component - always show the icon so users can retry
  // Even if there's an error, keep the icon visible

  const tooltipContent = error
    ? `Error: ${error}\nClick to retry`
    : birdCall
    ? `${commonName || scientificName} call\nRecorded by ${birdCall.recordist || 'Unknown'}\nQuality: ${birdCall.quality}`
    : `Play ${commonName || scientificName} call`;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`${sizeClasses[size]} rounded-full hover:bg-primary/20 transition-colors`}
            onClick={handlePlayPause}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-full w-full animate-spin text-muted-foreground" />
            ) : isPlaying ? (
              <Volume2 className="h-full w-full text-primary animate-pulse" />
            ) : (
              <VolumeX className="h-full w-full text-muted-foreground hover:text-primary" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="glass-panel max-w-xs">
          <p className="text-xs whitespace-pre-line">{tooltipContent}</p>
          {birdCall && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Source: Xeno-Canto #{birdCall.xcId}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
