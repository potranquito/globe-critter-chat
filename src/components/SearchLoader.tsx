import { Loader2 } from "lucide-react";

interface SearchLoaderProps {
  isLoading: boolean;
  message?: string;
}

export const SearchLoader = ({ isLoading, message = "Searching..." }: SearchLoaderProps) => {
  if (!isLoading) return null;

  return (
    <div className="glass-panel px-6 py-4 rounded-2xl flex items-center gap-3 animate-fade-in shadow-lg">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <div className="flex flex-col">
        <span className="text-sm font-medium">{message}</span>
        <span className="text-xs text-muted-foreground">
          Analyzing habitat data and wildlife observations...
        </span>
      </div>
    </div>
  );
};
