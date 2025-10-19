import { Button } from '@/components/ui/button';

export interface QuickReply {
  id: string;
  label: string;
  emoji: string;
  action: 'answer' | 'trivia' | 'facts' | 'conservation' | 'explain' | 'hint' | 'help-find-species' | 'play-food-web-game';
  value?: string; // For A/B/C/D answers
}

interface ChatTheme {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent?: string;
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
  theme?: ChatTheme;
}

export const QuickReplies = ({ replies, onSelect, disabled = false, theme }: QuickRepliesProps) => {
  if (replies.length === 0) return null;

  // Default theme if none provided
  const currentTheme = theme || {
    primary: 'hsl(160, 84%, 39%)',
    secondary: 'hsl(158, 64%, 52%)',
    background: 'hsl(222, 47%, 11%)',
    text: 'hsl(152, 76%, 80%)',
    accent: 'hsl(160, 100%, 70%)'
  };

  // Helper to add alpha to HSL color
  const withAlpha = (hslColor: string, alpha: number) => {
    return hslColor.replace('hsl(', 'hsla(').replace(')', `, ${alpha})`);
  };

  const isHelpButton = (action: string) => action === 'help-find-species';

  return (
    <>
      <style>{`
        @keyframes throb-glow {
          0%, 100% {
            box-shadow: 0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.2)},
                        0 0 20px ${withAlpha(currentTheme.primary, 0.3)};
          }
          50% {
            box-shadow: 0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.4)},
                        0 0 40px ${withAlpha(currentTheme.primary, 0.6)};
          }
        }
        .throb-glow-effect {
          animation: throb-glow 2s ease-in-out infinite;
        }
      `}</style>
      <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
        {replies.map((reply) => (
          <Button
            key={reply.id}
            size="sm"
            variant="outline"
            onClick={() => onSelect(reply)}
            disabled={disabled}
            className={`
              group relative overflow-hidden
              backdrop-blur-sm
              font-medium
              transition-all duration-300
              hover:scale-105
              text-sm px-4 py-2.5 h-auto rounded-xl
              ${isHelpButton(reply.action) ? 'throb-glow-effect' : ''}
            `}
            style={{
              backgroundColor: withAlpha(currentTheme.background, 0.4),
              borderWidth: '2px',
              borderColor: withAlpha(currentTheme.primary, isHelpButton(reply.action) ? 0.6 : 0.4),
              color: withAlpha(currentTheme.text, 0.9),
              boxShadow: isHelpButton(reply.action)
                ? `0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.2)}, 0 0 20px ${withAlpha(currentTheme.primary, 0.3)}`
                : `0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.2)}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = withAlpha(currentTheme.primary, 0.1);
              e.currentTarget.style.borderColor = withAlpha(currentTheme.primary, 0.8);
              e.currentTarget.style.color = currentTheme.text;
              e.currentTarget.style.boxShadow = `0 20px 25px -5px ${withAlpha(currentTheme.primary, 0.3)}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = withAlpha(currentTheme.background, 0.4);
              e.currentTarget.style.borderColor = withAlpha(currentTheme.primary, isHelpButton(reply.action) ? 0.6 : 0.4);
              e.currentTarget.style.color = withAlpha(currentTheme.text, 0.9);
              e.currentTarget.style.boxShadow = isHelpButton(reply.action)
                ? `0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.2)}, 0 0 20px ${withAlpha(currentTheme.primary, 0.3)}`
                : `0 4px 6px -1px ${withAlpha(currentTheme.primary, 0.2)}`;
            }}
          >
            {/* Glow effect on hover */}
            <div
              className="absolute inset-0 bg-gradient-to-r -translate-x-full group-hover:translate-x-full transition-transform duration-700"
              style={{
                backgroundImage: `linear-gradient(to right, transparent, ${withAlpha(currentTheme.primary, 0.1)}, transparent)`
              }}
            />

            {/* Content */}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="text-base">{reply.emoji}</span>
              <span className="drop-shadow-sm">{reply.label}</span>
            </span>
          </Button>
        ))}
      </div>
    </>
  );
};

export default QuickReplies;
