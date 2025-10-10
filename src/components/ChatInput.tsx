import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  // Generate contextual placeholder based on what's showing on the right
  const getContextualPlaceholder = () => {
    if (placeholder) return placeholder; // Allow override

    if (!context || context.type === 'default') {
      return "Enter an animal species or location to begin";
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
    <form onSubmit={handleSubmit} className="flex flex-none justify-center">
      <div className="glass-panel rounded-2xl p-2 flex gap-2 items-center w-full" style={{ maxWidth: '712px' }}>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={getContextualPlaceholder()}
          className="border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="icon"
          className="bg-primary hover:bg-primary/90 glow-effect rounded-xl h-12 w-12 shrink-0"
          disabled={isLoading || !message.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </form>
  );
};

export default ChatInput;
