import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2, Globe, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickReplies, { QuickReply } from '@/components/QuickReplies';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  errorMessage?: string;
}

interface ChatHistoryProps {
  messages: ChatMessage[];
  isExpanded: boolean;
  onMinimize: () => void;
  className?: string;
  isTyping?: boolean;
  onRetry?: (messageId: string) => void;
  quickReplies?: QuickReply[];
  onQuickReply?: (reply: QuickReply) => void;
}

const ChatHistory = ({
  messages,
  isExpanded,
  onMinimize,
  className,
  isTyping = false,
  onRetry,
  quickReplies = [],
  onQuickReply
}: ChatHistoryProps) => {
  const [shouldRender, setShouldRender] = useState(isExpanded);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  // Auto-scroll to bottom when new messages arrive or typing indicator appears
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, quickReplies]);

  if (!shouldRender || messages.length === 0) {
    return null;
  }

  // Check if last assistant message is currently streaming (empty or with content)
  const lastMessage = messages[messages.length - 1];
  // Show earth if typing AND it's an assistant message
  const isLastMessageStreaming = isTyping && lastMessage?.role === 'assistant';

  return (
    <div
      className={cn(
        "relative rounded-3xl overflow-hidden transition-all duration-300 ease-in-out shadow-2xl",
        "backdrop-blur-xl bg-gradient-to-br from-emerald-900/30 via-green-900/25 to-teal-900/30",
        "border-2 border-emerald-500/20 hover:border-emerald-400/30",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      style={{
        maxHeight: isExpanded ? 'calc(100vh - 350px)' : '0',
        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(5, 46, 22, 0.25) 50%, rgba(19, 78, 74, 0.3) 100%)',
      }}
    >
      {/* Minimize button - wildlife themed */}
      {isExpanded && (
        <Button
          size="icon"
          variant="ghost"
          onClick={onMinimize}
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-emerald-500/20 hover:bg-emerald-400/30 border border-emerald-400/40 z-[100] transition-all duration-200 hover:scale-110"
          style={{ pointerEvents: 'auto' }}
        >
          <Minimize2 className="h-4 w-4 text-emerald-300" />
        </Button>
      )}

      {/* Messages */}
      <div
        className="overflow-y-auto p-5 space-y-4 pt-16 custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {messages.map((message, index) => {
          const isCurrentlyStreaming = isLastMessageStreaming && index === messages.length - 1;

          return (
            <div
              key={message.id}
              className={cn(
                "flex flex-col gap-1.5 animate-fade-in",
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-5 py-3 max-w-[80%] shadow-lg transition-all duration-200",
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border border-emerald-400/30'
                    : 'bg-gradient-to-br from-slate-800/90 to-slate-700/80 text-slate-100 border border-slate-600/40 backdrop-blur-sm'
                )}
              >
                {/* Assistant message with spinning earth during streaming */}
                {message.role === 'assistant' ? (
                  <div className="flex items-start gap-2">
                    {/* Spinning earth - only show while streaming */}
                    {isCurrentlyStreaming && (
                      <Globe
                        className="h-5 w-5 text-cyan-400 animate-spin shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                        style={{ animationDuration: '2s' }}
                      />
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed flex-1">
                      {message.content || (isCurrentlyStreaming && 'Thinking...')}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                )}
              </div>

              {/* Timestamp and error handling */}
              <div className="flex items-center gap-2 px-3">
                <span className="text-xs text-emerald-300/70 font-medium">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>

                {/* Error icon with retry - wildlife themed */}
                {message.role === 'user' && message.status === 'error' && (
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    {onRetry && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRetry(message.id)}
                        className="h-6 px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 rounded-full border border-amber-400/20"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Error message */}
              {message.status === 'error' && message.errorMessage && (
                <div className="text-xs text-amber-300 px-3 max-w-[80%] bg-amber-900/20 rounded-lg py-1.5 px-3 border border-amber-500/20">
                  {message.errorMessage}
                </div>
              )}
            </div>
          );
        })}

        {/* Quick Reply Buttons */}
        {quickReplies.length > 0 && onQuickReply && !isTyping && (
          <div className="flex justify-center px-2 pt-2">
            <QuickReplies
              replies={quickReplies}
              onSelect={onQuickReply}
              disabled={isTyping}
            />
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(5, 46, 22, 0.2);
          border-radius: 10px;
          margin: 8px 0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #10b981 0%, #14b8a6 100%);
          border-radius: 10px;
          border: 2px solid rgba(5, 46, 22, 0.2);
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #34d399 0%, #2dd4bf 100%);
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:active {
          background: linear-gradient(180deg, #059669 0%, #0d9488 100%);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #10b981 rgba(5, 46, 22, 0.2);
        }
      `}</style>
    </div>
  );
};

export default ChatHistory;
