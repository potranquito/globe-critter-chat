import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';

interface ChatWithMeCardProps {
  avatarUrl: string;
  animalName: string;
  onChatClick: () => void;
}

const ChatWithMeCard = ({ avatarUrl, animalName, onChatClick }: ChatWithMeCardProps) => {
  return (
    <div className="glass-panel rounded-2xl p-6 animate-fade-in">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <img 
            src={avatarUrl} 
            alt={`${animalName} avatar`}
            className="w-32 h-32 object-contain animate-float"
          />
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            Hi! I'm {animalName}
          </h3>
          <p className="text-sm text-muted-foreground">
            Want to learn more about me and my habitat?
          </p>
        </div>

        <Button 
          onClick={onChatClick}
          className="w-full bg-accent hover:bg-accent/90 glow-effect"
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat with me
        </Button>
      </div>
    </div>
  );
};

export default ChatWithMeCard;
