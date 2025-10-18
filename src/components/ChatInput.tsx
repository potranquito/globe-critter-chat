import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronUp } from 'lucide-react';

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
  hasMessages?: boolean;
  onExpandHistory?: () => void;
}

const ChatInput = ({ onSubmit, isLoading = false, placeholder, context, onFocus, onBlur, hasMessages = false, onExpandHistory }: ChatInputProps) => {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
        className={`relative bg-slate-950/95 backdrop-blur-sm border border-emerald-500/30 w-full shadow-2xl ${
          hasMessages ? 'rounded-b-lg border-t-0' : 'rounded-lg'
        }`}
        style={{ maxWidth: '912px' }}
      >
        {/* Expand History Button - Show when messages exist but history is minimized */}
        {hasMessages && onExpandHistory && (
          <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-emerald-500/10">
            <button
              type="button"
              onClick={onExpandHistory}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ChevronUp className="h-3 w-3" />
              <span>Show chat history</span>
            </button>
            <span className="text-xs text-slate-600">Click to expand</span>
          </div>
        )}

        {/* Terminal Input Line */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-emerald-500/10">
          {/* Prompt Symbol */}
          <span className="text-emerald-400 font-bold shrink-0">❯</span>

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
            className="flex-1 bg-transparent border-none outline-none text-sm text-emerald-100 placeholder:text-slate-600 caret-emerald-400"
            disabled={isLoading}
            autoComplete="off"
            spellCheck="false"
          />

          {/* Cursor Blink Effect (only when focused and empty) */}
          {isFocused && !message && (
            <span className="text-emerald-400 animate-pulse">▊</span>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900/50 border-t border-emerald-500/10 text-xs">
          <div className="flex items-center gap-3 text-slate-600">
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
