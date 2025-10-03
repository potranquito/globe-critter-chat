import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExpandedImageViewProps {
  imageUrl: string;
  type: 'threat' | 'ecosystem';
  context: string;
  onClose: () => void;
  onNext?: () => void;
}

const ExpandedImageView = ({ imageUrl, type, context, onClose, onNext }: ExpandedImageViewProps) => {
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  const playAudio = useCallback(async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text }
      });

      if (error) throw error;

      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }, []);

  const sendMessage = useCallback(async (messageText: string, isInitial = false) => {
    if (!messageText.trim() && !isInitial) return;

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('species-chat', {
        body: { 
          message: messageText,
          context,
          type: isInitial ? 'threat' : 'chat'
        }
      });

      if (error) throw error;

      const aiResponse = data.message;
      setMessages(prev => [
        ...prev,
        { role: 'user', content: messageText },
        { role: 'assistant', content: aiResponse }
      ]);

      // Auto-play TTS for AI responses
      await playAudio(aiResponse);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setInput('');
    }
  }, [context, playAudio, toast]);

  // Initialize with threat message
  useEffect(() => {
    if (!isInitialized && type === 'threat') {
      setIsInitialized(true);
      sendMessage(`Tell me about this threat to ${context}`, true);
    }
  }, [isInitialized, type, context, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  };

  return (
    <div className="absolute right-6 top-6 w-80 max-h-[calc(100vh-3rem)] glass-panel rounded-2xl p-4 animate-fade-in overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-foreground">Learn More</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 rounded-xl overflow-hidden">
        <img 
          src={imageUrl} 
          alt={type}
          className="w-full h-48 object-cover"
        />
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-lg ${
              msg.role === 'assistant' 
                ? 'bg-accent/20 text-foreground' 
                : 'bg-primary/20 text-foreground ml-8'
            }`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm">{msg.content}</p>
              {msg.role === 'assistant' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-2 shrink-0"
                  onClick={() => playAudio(msg.content)}
                >
                  <Volume2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="p-3 rounded-lg bg-accent/20 text-sm text-muted-foreground">
            Thinking...
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={isLoading || !input.trim()}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {onNext && (
        <Button 
          onClick={onNext}
          className="w-full mt-3"
          variant="secondary"
        >
          Next
        </Button>
      )}
    </div>
  );
};

export default ExpandedImageView;