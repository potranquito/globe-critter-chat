interface QuestionDisplayProps {
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionNumber: number;
  totalQuestions: number;
}

export const QuestionDisplay = ({
  question,
  difficulty,
  questionNumber,
  totalQuestions
}: QuestionDisplayProps) => {
  const difficultyColors = {
    easy: 'from-green-500/30 to-green-600/30 border-green-500/50',
    medium: 'from-yellow-500/30 to-yellow-600/30 border-yellow-500/50',
    hard: 'from-red-500/30 to-red-600/30 border-red-500/50'
  };

  const difficultyLabels = {
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard'
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-[800px] px-4">
      <div
        className={`
          glass-panel rounded-2xl p-6
          bg-gradient-to-r ${difficultyColors[difficulty]}
          border-2
          shadow-2xl
          animate-fade-in
        `}
      >
        {/* Header - Question Number & Difficulty */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-white/80 font-semibold">
            Question {questionNumber} of {totalQuestions}
          </div>
          <div className="text-white/90 font-bold">
            {difficultyLabels[difficulty]}
          </div>
        </div>

        {/* Question Text */}
        <div className="text-center">
          <p className="text-white text-2xl font-bold drop-shadow-lg">
            {question}
          </p>
        </div>

        {/* Hint for multi-select */}
        {difficulty === 'hard' && (
          <div className="mt-4 text-center text-white/70 text-sm italic">
            💡 Tip: You may need to select more than one species!
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionDisplay;
