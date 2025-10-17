import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizontal, Globe } from 'lucide-react';

export interface ChatContext {
  type: 'species' | 'habitat' | 'wildlife-park' | 'threat' | 'ecosystem' | 'region-species' | 'default';
  name: string;
  details?: string;
}

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  context?: ChatContext;
  onFocus?: () => void;
  onBlur?: () => void;
}

const ChatInput = ({ onSubmit, isLoading = false, placeholder, context, onFocus, onBlur }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Log when ChatInput mounts/unmounts and dimensions
  useEffect(() => {
    if (inputContainerRef.current) {
      const rect = inputContainerRef.current.getBoundingClientRect();
      console.log('💬 ChatInput MOUNTED:', {
        context: context?.type || 'default',
        height: rect.height,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
      });

      return () => {
        console.log('💬 ChatInput UNMOUNTED');
      };
    }
  }, []);

  // Log when focus state changes
  useEffect(() => {
    console.log('💬 ChatInput focus changed:', { isFocused });
  }, [isFocused]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  // Determine if in discovery mode or chat mode
  const isDiscoveryMode = !context || context.type === 'default';

  // Generate contextual placeholder based on what's showing on the right
  const getContextualPlaceholder = () => {
    if (placeholder) return placeholder; // Allow override

    if (isDiscoveryMode) {
      return "Search for animals (e.g., polar bear) or locations (e.g., Yellowstone)...";
    }

    switch (context.type) {
      case 'species':
        return `Ask about ${context.name}'s habitat, diet, or conservation...`;
      case 'habitat':
        return `Ask about ${context.name}'s ecosystem, threats, or wildlife...`;
      case 'wildlife-park':
        return `Ask about ${context.name}'s animals, facilities, or visit info...`;
      case 'threat':
        return `Ask about this environmental threat and its impact...`;
      case 'ecosystem':
        return `Ask about this ecosystem connection...`;
      case 'region-species':
        return `Ask about ${context.name} in ${context.details || 'this region'}...`;
      default:
        return "Ask me anything about this...";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-none justify-center relative" ref={inputContainerRef}>
      {/* Animated glow effect on focus */}
      {isFocused && (
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 blur-xl animate-pulse" />
      )}

      <div
        className={`
          relative backdrop-blur-xl rounded-3xl p-1.5 flex gap-2 items-center w-full
          transition-all duration-300 shadow-2xl
          bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-800/90
          border-2
          ${isFocused
            ? 'border-emerald-400/60 scale-[1.02]'
            : 'border-emerald-500/30 hover:border-emerald-400/40'
          }
        `}
        style={{ maxWidth: '912px' }}
      >
        {/* Decorative gradient line */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent rounded-full" />

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            onFocus?.();
          }}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          placeholder={getContextualPlaceholder()}
          className="border-0 bg-transparent text-slate-100 placeholder:text-slate-400/70 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4 py-3"
          disabled={isLoading}
        />

        {/* Minimal Send Icon - No Background Shape, Pure Glow */}
        <button
          type="submit"
          disabled={isLoading || !message.trim()}
          className="relative shrink-0 p-2 bg-transparent border-0 group transition-all duration-300"
        >
          {/* Icon with glow effect */}
          {isLoading ? (
            <Globe
              className="h-6 w-6 text-emerald-400 animate-spin drop-shadow-[0_0_12px_rgba(16,185,129,0.9)]"
              style={{ animationDuration: '2s' }}
            />
          ) : (
            <SendHorizontal
              className={`
                h-6 w-6 transition-all duration-300
                ${message.trim()
                  ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.9)] group-hover:drop-shadow-[0_0_16px_rgba(52,211,153,1)] group-hover:text-emerald-300 group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                  : 'text-slate-600 drop-shadow-none'
                }
              `}
            />
          )}
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
