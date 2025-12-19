import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface InteractionItem {
  id: string;
  name: string;
  icon: string;
  isCorrect: boolean;
  feedback: string;
}

interface LessonCheckpoint {
  time: number; // Seconds to pause at
  question: string;
  items: InteractionItem[];
}

interface LessonData {
  id: string;
  title: string;
  videoSrc: string;
  checkpoint: LessonCheckpoint;
}

const LESSON_REGISTRY: Record<string, LessonData> = {
  'mara-fence-1': {
    id: 'mara-fence-1',
    title: 'Mara Elephant Project: Safe Migration',
    videoSrc: '/videos/mara/elephant_fence_scenario.mp4',
    checkpoint: {
      time: 5,
      question: "⚠️ The elephant is approaching the farm fence! What allows it to pass safely without breaking it?",
      items: [
        { id: 'chili', name: 'Chili Fence', icon: '🌶️', isCorrect: false, feedback: "Chili fences repel elephants, but we want to let them migrate safely!" },
        { id: 'firework', name: 'Noise Maker', icon: '🎆', isCorrect: false, feedback: "Loud noises scare elephants away, but don't help them cross safely." },
        { id: 'corridor', name: 'Wildlife Corridor', icon: '🛣️', isCorrect: true, feedback: "Correct! Corridors let elephants migrate safely between protected areas." },
        { id: 'drone', name: 'Drone', icon: '🛸', isCorrect: false, feedback: "Drones are used for monitoring, not for letting elephants pass." }
      ]
    }
  },
  'mara-drone-1': {
    id: 'mara-drone-1',
    title: 'Mara Elephant Project: Night Patrol',
    videoSrc: '/videos/mara/elephant_drone_night.mp4',
    checkpoint: {
      time: 5,
      question: "🚁 This thermal drone is tracking elephants at night. What is its primary mission?",
      items: [
        { id: 'warm', name: 'Keep Them Warm', icon: '🌡️', isCorrect: false, feedback: "The camera sees heat, but the drone doesn't produce it!" },
        { id: 'monitor', name: 'Monitor Safety', icon: '🛡️', isCorrect: true, feedback: "Correct! Rangers use thermal drones to ensure elephants stay safe from poachers and conflict." },
        { id: 'photos', name: 'Take Photos', icon: '📸', isCorrect: false, feedback: "While the footage is cool, the goal is protection, not photography." },
        { id: 'scare', name: 'Scare Lions', icon: '🦁', isCorrect: false, feedback: "The drone flies high and quiet to observe without disturbing wildlife." }
      ]
    }
  }
};

const InteractiveVideoLesson = () => {
  // Check URL params for lesson ID, default to fence lesson
  const searchParams = new URLSearchParams(window.location.search);
  const lessonId = searchParams.get('lessonId') || 'mara-fence-1';
  const lesson = LESSON_REGISTRY[lessonId] || LESSON_REGISTRY['mara-fence-1'];

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPausedForInteraction, setIsPausedForInteraction] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | null }>({ msg: '', type: null });
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Check if we hit the checkpoint
    if (!completed && Math.abs(time - lesson.checkpoint.time) < 0.5 && !isPausedForInteraction) {
      videoRef.current.pause();
      setIsPlaying(false);
      setIsPausedForInteraction(true);
    }
  };

  const handleInteraction = (item: InteractionItem) => {
    if (item.isCorrect) {
      setFeedback({ msg: item.feedback, type: 'success' });
      toast({
        title: "✅ Correct!",
        description: item.feedback,
        variant: "default",
        className: "bg-green-600 text-white"
      });
      
      // Resume video after short delay
      setTimeout(() => {
        setCompleted(true);
        setIsPausedForInteraction(false);
        setFeedback({ msg: '', type: null });
        videoRef.current?.play();
        setIsPlaying(true);
      }, 2000);
    } else {
      setFeedback({ msg: item.feedback, type: 'error' });
      toast({
        title: "❌ Try Again",
        description: item.feedback,
        variant: "destructive"
      });
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const resetLesson = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    setCompleted(false);
    setIsPausedForInteraction(false);
    setFeedback({ msg: '', type: null });
    videoRef.current.play();
    setIsPlaying(true);
  };

  if (!lesson) return <div>Lesson not found</div>;

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Top Header */}
      <div className="h-16 flex items-center justify-between px-6 bg-zinc-900 border-b border-zinc-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          🐘 {lesson.title}
        </h1>
        <Button variant="outline" size="sm" onClick={resetLesson} className="gap-2">
          <RefreshCw size={16} /> Restart
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-4 bg-zinc-950 overflow-hidden">
        
        {/* Video Container - Height Constrained */}
        <div className="relative h-auto max-h-[45vh] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <video
            ref={videoRef}
            src={lesson.videoSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onClick={togglePlay}
          />
          
          {/* Play/Pause Overlay */}
          {!isPlaying && !isPausedForInteraction && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer" onClick={togglePlay}>
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:scale-110 transition-transform shadow-lg border border-white/10">
                <Play size={32} fill="white" className="ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Interaction Section - Ultra Compact */}
        {isPausedForInteraction && (
          <div className="w-full max-w-3xl mt-2 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-center shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-base font-bold mb-2 text-white drop-shadow-md">{lesson.checkpoint.question}</h2>
            
            <div className="flex flex-wrap justify-center gap-2">
              {lesson.checkpoint.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleInteraction(item)}
                  className="flex flex-col items-center justify-center p-1.5 w-24 rounded bg-zinc-800/80 hover:bg-zinc-700 hover:scale-105 border border-white/10 hover:border-green-500/50 transition-all group backdrop-blur-md"
                >
                  <span className="text-lg leading-none group-hover:scale-110 transition-transform filter drop-shadow-lg">{item.icon}</span>
                  <span className="font-normal text-[0.6rem] text-zinc-100 leading-tight mt-1">{item.name}</span>
                </button>
              ))}
            </div>

            {feedback.msg && (
              <div className={`mt-2 p-1.5 rounded flex items-center justify-center gap-2 font-medium text-xs animate-in fade-in duration-300 ${feedback.type === 'success' ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-red-500/20 text-red-200 border border-red-500/30'}`}>
                {feedback.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {feedback.msg}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveVideoLesson;
