import { Button } from '@/components/ui/button';

export interface QuickReply {
  id: string;
  label: string;
  emoji: string;
  action: 'answer' | 'trivia' | 'facts' | 'conservation' | 'explain' | 'hint';
  value?: string; // For A/B/C/D answers
}

interface QuickRepliesProps {
  replies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  disabled?: boolean;
}

export const QuickReplies = ({ replies, onSelect, disabled = false }: QuickRepliesProps) => {
  if (replies.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center animate-fade-in">
      {replies.map((reply) => (
        <Button
          key={reply.id}
          size="sm"
          variant="outline"
          onClick={() => onSelect(reply)}
          disabled={disabled}
          className="
            group relative overflow-hidden
            backdrop-blur-sm bg-slate-900/40
            hover:bg-emerald-500/10
            border-2 border-emerald-400/40 hover:border-emerald-300/80
            text-emerald-100 hover:text-emerald-50 font-medium
            transition-all duration-300
            shadow-lg shadow-emerald-900/20
            hover:shadow-xl hover:shadow-emerald-500/30
            hover:scale-105
            text-sm px-4 py-2.5 h-auto rounded-xl
          "
        >
          {/* Glow effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {/* Content */}
          <span className="relative z-10 flex items-center gap-1.5">
            <span className="text-base">{reply.emoji}</span>
            <span className="drop-shadow-sm">{reply.label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
};

export default QuickReplies;
