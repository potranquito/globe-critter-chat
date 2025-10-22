import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronUp } from 'lucide-react';

export interface ChatContext {
  type: 'species' | 'habitat' | 'wildlife-park' | 'threat' | 'ecosystem' | 'region-species' | 'default';
  name: string;
  details?: string;
}

interface ChatTheme {
  primary: string;      // HSL color string (e.g., "hsl(160, 84%, 39%)")
  secondary: string;    // HSL color string
  background: string;   // HSL color string
  text: string;         // HSL color string
  accent?: string;      // HSL color string (optional)
}

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  context?: ChatContext;
  onFocus?: () => void;
  onBlur?: () => void;
  hasMessages?: boolean;
  onExpandHistory?: () => void;
  theme?: ChatTheme;
}

const ChatInput = ({ onSubmit, isLoading = false, placeholder, context, onFocus, onBlur, hasMessages = false, onExpandHistory, theme }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 🎯 Auto-focus input on mount (terminal-like behavior)
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      setIsFocused(true); // Show cursor immediately
    }
  }, []);

  // Default theme if none provided (emerald theme)
  const currentTheme = theme || {
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  };

  // Debug: Log when theme changes
  useEffect(() => {
    console.log('[ChatInput] 🎨 Theme prop changed:', theme);
    console.log('[ChatInput] 🎨 Using theme:', currentTheme);
  }, [theme]);

  // Helper to add alpha to HSL color
  const withAlpha = (hslColor: string, alpha: number) => {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  // Handle ESC key to clear input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setMessage('');
      e.currentTarget.blur();
    }
  };

  // Determine if in discovery mode or chat mode
  const isDiscoveryMode = !context || context.type === 'default';

  // Generate contextual placeholder based on what's showing on the right
  const getContextualPlaceholder = () => {
    if (placeholder) return placeholder; // Allow override

    if (isDiscoveryMode) {
      return "type command or 'help'";
    }

    switch (context.type) {
      case 'species':
        return `ask about ${context.name}`;
      case 'habitat':
        return `ask about ${context.name}`;
      case 'wildlife-park':
        return `ask about ${context.name}`;
      case 'threat':
        return `ask about this threat`;
      case 'ecosystem':
        return `ask about ecosystem`;
      case 'region-species':
        return `ask about ${context.name}`;
      default:
        return "type here";
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-none justify-center relative"
      style={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      <div
        className={`relative backdrop-blur-lg border w-full ${
          hasMessages ? 'rounded-b-lg border-t-0' : 'rounded-lg'
        }`}
        style={{
          backgroundColor: withAlpha(currentTheme.background, 0.5),
          borderColor: currentTheme.secondary,
          animation: 'gentle-glow 3s ease-in-out infinite'
        }}
      >
        {/* Expand History Button - Show when messages exist but history is minimized */}
        {hasMessages && onExpandHistory && (
          <div
            className="flex items-center justify-between px-4 py-2 border-b"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              borderColor: withAlpha(currentTheme.primary, 0.1),
            }}
          >
            <button
              type="button"
              onClick={onExpandHistory}
              className="flex items-center gap-2 text-xs transition-colors"
              style={{ color: 'rgb(148, 163, 184)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = currentTheme.secondary; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgb(148, 163, 184)'; }}
            >
              <ChevronUp className="h-3 w-3" />
              <span>Show chat history</span>
            </button>
            <span className="text-xs text-slate-600">Click to expand</span>
          </div>
        )}

        {/* Terminal Input Line */}
        <div
          className="flex items-center gap-2 px-4 py-3 border-t"
          style={{ borderColor: withAlpha(currentTheme.primary, 0.1) }}
        >
          {/* Prompt Symbol */}
          <span className="font-bold shrink-0" style={{ color: currentTheme.secondary }}>❯</span>

          {/* Loading Spinner */}
          {isLoading && (
            <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
          )}

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
            placeholder={getContextualPlaceholder()}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-slate-600"
            style={{
              color: currentTheme.text,
              caretColor: currentTheme.secondary,
            }}
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Cursor Blink Effect (only when focused and empty) */}
          {isFocused && !message && (
            <span className="animate-pulse" style={{ color: currentTheme.secondary }}>▊</span>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div
          className="flex items-center justify-between px-4 py-1.5 border-t text-xs"
          style={{
            backgroundColor: withAlpha(currentTheme.background, 0.4),
            borderColor: withAlpha(currentTheme.primary, 0.3),
          }}
        >
          <div className="flex items-center gap-3" style={{ color: withAlpha(currentTheme.text, 0.6) }}>
            <span>ESC to clear</span>
            <span>•</span>
            <span>ENTER to send</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-2 text-cyan-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Processing...</span>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
