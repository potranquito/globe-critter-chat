import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ChatWithMeCardProps {
  avatarUrl: string;
  animalName: string;
  onChatClick: () => void;
}

const ChatWithMeCard = ({ avatarUrl, animalName, onChatClick }: ChatWithMeCardProps) => {
  return (
    <div className="glass-panel rounded-2xl p-3 animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-2">
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={`${animalName} avatar`}
            className="w-16 h-16 object-contain animate-float"
          />
        </div>
        
        <div>
          <h3 className="text-base font-bold text-foreground mb-1">
            Hi! I'm {animalName}
          </h3>
          <p className="text-xs text-muted-foreground">
            Want to learn more about me and my habitat?
          </p>
        </div>

        <Button 
          size="sm"
          onClick={onChatClick}
          className="w-full bg-accent hover:bg-accent/90 glow-effect"
        >
          <MessageCircle className="h-3 w-3 mr-2" />
          Chat with me
        </Button>
      </div>
    </div>
  );
};

export default ChatWithMeCard;
