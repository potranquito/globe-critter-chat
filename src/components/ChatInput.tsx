import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const ChatInput = ({ onSubmit, isLoading = false, placeholder }: ChatInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSubmit(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 flex justify-center">
      <div className="glass-panel rounded-2xl p-2 flex gap-2 items-center w-full" style={{ maxWidth: '1150px' }}>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder || "Enter an animal species or location to begin"}
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
