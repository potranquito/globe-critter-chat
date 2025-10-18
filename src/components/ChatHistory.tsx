import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2, Loader2, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
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

  // Check if last assistant message is currently streaming
  const lastMessage = messages[messages.length - 1];
  const isLastMessageStreaming = isTyping && lastMessage?.role === 'assistant';

  return (
    <div
      className={cn(
        "relative rounded-t-lg overflow-hidden transition-all duration-300 ease-in-out shadow-2xl",
        "bg-slate-950/95 backdrop-blur-sm",
        "border-x border-t border-emerald-500/30",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      style={{
        maxHeight: isExpanded ? 'calc(100vh - 350px)' : '0',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      }}
    >
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs font-semibold text-emerald-400 ml-2">wildlife-terminal</span>
        </div>

        {isExpanded && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onMinimize}
            className="h-7 w-7 rounded hover:bg-emerald-500/10 text-emerald-400/70 hover:text-emerald-300"
            style={{ pointerEvents: 'auto' }}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Terminal Output */}
      <div
        className="overflow-y-auto p-4 space-y-2 custom-scrollbar"
        style={{ maxHeight: 'calc(100vh - 400px)' }}
      >
        {messages.map((message, index) => {
          const isCurrentlyStreaming = isLastMessageStreaming && index === messages.length - 1;
          const showSpinner = message.role === 'assistant' && isCurrentlyStreaming;

          return (
            <div
              key={message.id}
              className="animate-fade-in"
            >
              {/* User Input Line */}
              {message.role === 'user' ? (
                <div className="flex items-start gap-2 group">
                  <span className="text-emerald-400 font-bold shrink-0">❯</span>
                  <div className="flex-1">
                    <p className="text-sm text-emerald-100 whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                    {message.status === 'error' && (
                      <div className="flex items-center gap-2 mt-1">
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                        <span className="text-xs text-red-400">Failed to send</span>
                        {onRetry && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onRetry(message.id)}
                            className="h-5 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ) : (
                /* Assistant Output Line */
                <div className="flex items-start gap-2 group">
                  {/* Status Indicator */}
                  {showSpinner ? (
                    <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                  ) : message.status === 'error' ? (
                    <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500/70 shrink-0 mt-0.5" />
                  )}

                  <div className="flex-1">
                    <p className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                      {message.content || (showSpinner && <span className="text-slate-500 italic">Processing...</span>)}
                    </p>
                    {message.status === 'error' && message.errorMessage && (
                      <div className="flex items-start gap-2 mt-1 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded px-2 py-1">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>{message.errorMessage}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-xs text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Quick Reply Buttons */}
        {quickReplies.length > 0 && onQuickReply && !isTyping && (
          <div className="flex justify-start px-2 pt-2">
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
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.4);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.3);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.5);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(16, 185, 129, 0.3) rgba(15, 23, 42, 0.4);
        }
      `}</style>
    </div>
  );
};

export default ChatHistory;
