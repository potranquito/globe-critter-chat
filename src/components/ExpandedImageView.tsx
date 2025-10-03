import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExpandedImageViewProps {
  imageUrl: string;
  type: 'threat' | 'ecosystem';
  context: string;
  title: string;
  onClose: () => void;
  onNext?: () => void;
  externalMessage?: string;
}

const ExpandedImageView = ({ imageUrl, type, context, title, onClose, onNext, externalMessage }: ExpandedImageViewProps) => {
  const [messages, setMessages] = useState<Array<{role: string; content: string; isStreaming?: boolean}>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const { toast } = useToast();

  const streamTextWithTyping = useCallback((text: string, index: number) => {
    let currentIndex = 0;
    const words = text.split(' ');
    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setMessages(prev => prev.map((msg, i) => 
          i === index ? { ...msg, content: words.slice(0, currentIndex + 1).join(' ') } : msg
        ));
        currentIndex++;
      } else {
        clearInterval(interval);
        setMessages(prev => prev.map((msg, i) => 
          i === index ? { ...msg, isStreaming: false } : msg
        ));
      }
    }, 100);
  }, []);

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
      const newMessages = [
        ...messages,
        { role: 'user', content: messageText },
        { role: 'assistant', content: '', isStreaming: true }
      ];
      setMessages(newMessages);
      
      const assistantIndex = newMessages.length - 1;
      
      // Start text streaming and audio simultaneously
      streamTextWithTyping(aiResponse, assistantIndex);
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
    }
  }, [context, playAudio, toast]);

  // Initialize with threat message
  useEffect(() => {
    if (!isInitialized && type === 'threat') {
      setIsInitialized(true);
      sendMessage(`Tell me about this threat to ${context}`, true);
    }
  }, [isInitialized, type, context, sendMessage]);

  // Handle external messages from bottom input
  useEffect(() => {
    if (externalMessage) {
      sendMessage(externalMessage);
    }
  }, [externalMessage, sendMessage]);

  return (
    <div className="absolute right-6 top-6 w-80 max-h-[calc(100vh-10rem)] glass-panel rounded-2xl p-4 animate-fade-in overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-3">
        <div className="mb-4">
          <div className="rounded-xl overflow-hidden mb-2">
            <img 
              src={imageUrl} 
              alt={type}
              className="w-full h-48 object-cover"
            />
          </div>
          <h3 className="text-base font-bold text-foreground">{title}</h3>
        </div>
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
              <p className="text-sm">
                {msg.content}
                {msg.isStreaming && <span className="inline-block w-1 h-4 bg-foreground ml-1 animate-pulse" />}
              </p>
              {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
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

      {onNext && (
        <Button 
          onClick={onNext}
          className="w-full mt-2"
          variant="secondary"
        >
          Next
        </Button>
      )}
    </div>
  );
};

export default ExpandedImageView;