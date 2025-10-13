import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  isExpanded: boolean;
  onMinimize: () => void;
  className?: string;
}

const ChatHistory = ({ messages, isExpanded, onMinimize, className }: ChatHistoryProps) => {
  const [shouldRender, setShouldRender] = useState(isExpanded);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!shouldRender || messages.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden transition-all duration-300 ease-in-out backdrop-blur-md bg-black/20 border border-white/10",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      style={{
        maxHeight: isExpanded ? '40vh' : '0',
      }}
    >
      {/* Minimize button - floating in top right */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onMinimize}
        className="absolute top-2 right-2 h-8 w-8 hover:bg-white/10 z-10"
      >
        <Minimize2 className="h-4 w-4" />
      </Button>

      {/* Messages */}
      <div className="overflow-y-auto p-4 space-y-4 pt-12" style={{ maxHeight: '40vh' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex flex-col gap-1 animate-fade-in",
              message.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                "rounded-xl px-4 py-2 max-w-[80%]",
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/10 text-foreground'
              )}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
            </div>
            <span className="text-xs text-muted-foreground px-2">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistory;
