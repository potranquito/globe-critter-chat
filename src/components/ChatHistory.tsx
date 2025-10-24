import { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Minimize2, Loader2, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import QuickReplies, { QuickReply } from '@/components/QuickReplies';
import AnsiToHtml from 'ansi-to-html';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  errorMessage?: string;
  characterEmoji?: string;  // Character emoji (e.g. 🤖, 💩👑)
  characterName?: string;   // Character name (e.g. "Guardian AI", "Poopy Pants")
  isImage?: boolean;        // Indicates if the content is an image URL
}

interface ChatTheme {
  primary: string;      // HSL color string (e.g., "hsl(160, 84%, 39%)")
  secondary: string;    // HSL color string
  background: string;   // HSL color string
  text: string;         // HSL color string
  accent?: string;      // HSL color string (optional)
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
  theme?: ChatTheme;
  hasBooted?: boolean;
  bootLoadingStatus?: string;
}

const ChatHistory = ({
  messages,
  isExpanded,
  onMinimize,
  className,
  isTyping = false,
  onRetry,
  quickReplies = [],
  onQuickReply,
  theme,
  hasBooted = false,
  bootLoadingStatus = ''
}: ChatHistoryProps) => {
  const [shouldRender, setShouldRender] = useState(isExpanded);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    console.log('[ChatHistory] 🎨 Theme prop changed:', theme);
    console.log('[ChatHistory] 🎨 Using theme:', currentTheme);
  }, [theme]);

  // Create ANSI to HTML converter
  const ansiConverter = useMemo(() => new AnsiToHtml({
    fg: '#FFF',
    bg: '#000',
    newline: false,
    escapeXML: true,
    stream: false
  }), []);

  // Helper to add alpha to HSL color
  const withAlpha = (hslColor: string, alpha: number) => {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  };

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

  if (messages.length === 0) {
    return null;
  }

  // Check if last assistant message is currently streaming
  const lastMessage = messages[messages.length - 1];
  const isLastMessageStreaming = isTyping && lastMessage?.role === 'assistant';

  return (
    <div
      className={cn(
        "relative overflow-hidden transition-all duration-300 ease-in-out shadow-2xl backdrop-blur-lg border-x border-t w-full",
        isExpanded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none",
        className
      )}
      style={{
        borderRadius: '0.5rem 0.5rem 0 0', // rounded-t-lg - explicit for consistency
        maxHeight: isExpanded ? '550px' : '0',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        backgroundColor: withAlpha(currentTheme.background, 0.3), // More transparent
        borderColor: withAlpha(currentTheme.primary, 0.3),
      }}
    >
      {/* Terminal Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{
          backgroundColor: withAlpha(currentTheme.background, 0.4),
          borderColor: withAlpha(currentTheme.primary, 0.2),
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🌍</span>
          <span
            className="text-xs font-semibold"
            style={{
              color: currentTheme.secondary,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
          >
            wildlife-terminal
          </span>
          <span
            className="text-xs font-bold tracking-wide"
            style={{
              color: bootLoadingStatus ? '#fbbf24' : (hasBooted ? '#10b981' : '#ef4444'),
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
            }}
          >
            {bootLoadingStatus || (hasBooted ? 'online' : 'offline')}
          </span>
        </div>

        {isExpanded && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onMinimize}
            className="h-7 w-7 rounded"
            style={{
              pointerEvents: 'auto',
              color: withAlpha(currentTheme.secondary, 0.7),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = withAlpha(currentTheme.primary, 0.1);
              e.currentTarget.style.color = currentTheme.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = withAlpha(currentTheme.secondary, 0.7);
            }}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Terminal Output */}
      <div
        className="overflow-y-auto p-4 space-y-2 custom-scrollbar"
        style={{ maxHeight: '490px' }}
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
                  <span className="font-bold shrink-0" style={{ color: currentTheme.secondary }}>❯</span>
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed" style={{ color: currentTheme.text }}>
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
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: withAlpha(currentTheme.primary, 0.7) }} />
                  )}

                  <div className="flex-1">
                    {/* Character Info (if available) */}
                    {(message.characterEmoji || message.characterName) && (
                      <div className="flex items-center gap-2 mb-1">
                        {message.characterEmoji && (
                          <span className="text-lg">{message.characterEmoji}</span>
                        )}
                        {message.characterName && (
                          <span className="text-xs font-semibold" style={{ color: withAlpha(currentTheme.secondary, 0.8) }}>
                            {message.characterName}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                      {(() => {
                        const content = message.content || (showSpinner ? 'Processing...' : '');

                        // Check if this is an image message (species photo, etc.)
                        if (message.isImage && content) {
                          return (
                            <img
                              src={content}
                              alt="Species"
                              className="max-w-full h-auto rounded-lg my-1 ascii-laser-in"
                              style={{
                                maxHeight: '120px',
                                objectFit: 'contain',
                                backgroundColor: 'transparent',
                                imageRendering: 'pixelated'
                              }}
                            />
                          );
                        }

                        // Check if content contains ANSI escape codes
                        const hasAnsi = content.includes('\x1b[') || content.includes('\u001b[');

                        if (hasAnsi) {
                          // Convert ANSI codes to HTML with optimized font for wildlife conservation displays
                          const html = ansiConverter.toHtml(content);
                          return (
                            <div
                              className="ascii-laser-in"
                              dangerouslySetInnerHTML={{ __html: html }}
                              style={{
                                fontFamily: '"Courier New", "Consolas", "Monaco", "Lucida Console", monospace',
                                fontSize: '0.85rem',
                                lineHeight: '1.2',
                                letterSpacing: '0.05em'
                              }}
                            />
                          );
                        }

                        // Detect markdown image syntax: ![alt](url)
                        const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                        const parts: (string | JSX.Element)[] = [];
                        let lastIndex = 0;
                        let match;

                        while ((match = imageRegex.exec(content)) !== null) {
                          // Add text before the image
                          if (match.index > lastIndex) {
                            parts.push(content.substring(lastIndex, match.index));
                          }

                          // Add the image with laser-in animation (transparent background for sticker effect)
                          const alt = match[1];
                          const url = match[2];

                          // Check if this is a sprite sheet animation (8 frames horizontal)
                          const isSpriteSheet = url.includes('spritesheet');

                          if (isSpriteSheet) {
                            parts.push(
                              <div
                                key={`sprite-${match.index}`}
                                className="sprite-animation my-1"
                                style={{
                                  width: '120px',
                                  height: '120px',
                                  backgroundImage: `url(${url})`,
                                  backgroundSize: '800% 100%', // 8 frames horizontally
                                  backgroundRepeat: 'no-repeat',
                                  imageRendering: 'pixelated',
                                }}
                              />
                            );
                          } else {
                            parts.push(
                              <img
                                key={`img-${match.index}`}
                                src={url}
                                alt={alt}
                                className="max-w-full h-auto rounded-lg my-1"
                                style={{
                                  maxHeight: '120px',
                                  objectFit: 'contain',
                                  backgroundColor: 'transparent',
                                  imageRendering: 'pixelated'
                                }}
                              />
                            );
                          }

                          lastIndex = match.index + match[0].length;
                        }

                        // Add remaining text after the last image
                        if (lastIndex < content.length) {
                          parts.push(content.substring(lastIndex));
                        }

                        // Helper function to process markdown bold syntax **text** -> styled HTML
                        const processBoldMarkdown = (text: string) => {
                          const boldRegex = /\*\*([^*]+)\*\*/g;
                          const segments: (string | JSX.Element)[] = [];
                          let lastIdx = 0;
                          let boldMatch;

                          while ((boldMatch = boldRegex.exec(text)) !== null) {
                            // Add text before the bold
                            if (boldMatch.index > lastIdx) {
                              segments.push(text.substring(lastIdx, boldMatch.index));
                            }

                            // Add bold text with bright color styling
                            segments.push(
                              <span
                                key={`bold-${boldMatch.index}`}
                                style={{
                                  fontWeight: 'bold',
                                  color: '#10b981' // Bright green (emerald-500)
                                }}
                              >
                                {boldMatch[1]}
                              </span>
                            );

                            lastIdx = boldMatch.index + boldMatch[0].length;
                          }

                          // Add remaining text
                          if (lastIdx < text.length) {
                            segments.push(text.substring(lastIdx));
                          }

                          return segments.length > 0 ? segments : text;
                        };

                        // Process parts array to apply bold markdown to text strings
                        const processedParts = parts.map((part, idx) => {
                          if (typeof part === 'string') {
                            const processed = processBoldMarkdown(part);
                            return Array.isArray(processed) ? (
                              <span key={`text-${idx}`}>{processed}</span>
                            ) : processed;
                          }
                          return part;
                        });

                        // If no images found, process the original content for bold markdown
                        if (parts.length === 0) {
                          if (showSpinner && !message.content) {
                            return <span className="text-slate-500 italic">Processing...</span>;
                          }
                          const processed = processBoldMarkdown(content);
                          return Array.isArray(processed) ? <span>{processed}</span> : processed;
                        }

                        return processedParts;
                      })()}
                    </div>
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
              theme={currentTheme}
            />
          </div>
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar {
          --scrollbar-track: ${withAlpha(currentTheme.background, 0.4)};
          --scrollbar-thumb: ${withAlpha(currentTheme.primary, 0.3)};
          --scrollbar-thumb-hover: ${withAlpha(currentTheme.primary, 0.5)};
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--scrollbar-track);
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--scrollbar-thumb);
          border-radius: 3px;
          transition: all 0.3s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--scrollbar-thumb-hover);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
        }

        /* Laser-in animation for ASCII art and images - horizontal sweep from left to right */
        @keyframes laserIn {
          0% {
            clip-path: inset(0 100% 0 0);
            opacity: 0.5;
          }
          100% {
            clip-path: inset(0 0 0 0);
            opacity: 1;
          }
        }

        .ascii-laser-in {
          animation: laserIn 4s cubic-bezier(0.4, 0.0, 0.2, 1) forwards;
        }

        /* Sprite sheet animation - 8 frames horizontal, swings back and forth like a pendulum */
        @keyframes spriteSwing {
          0% { background-position: 0 0; }
          100% { background-position: -700% 0; }
        }

        .sprite-animation {
          animation: spriteSwing 1600ms steps(7) 2 alternate;
        }
      `}</style>
    </div>
  );
};

export default ChatHistory;
