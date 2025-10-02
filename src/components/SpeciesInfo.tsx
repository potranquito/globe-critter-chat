import { AlertCircle } from 'lucide-react';

interface SpeciesInfoProps {
  species: string;
  status: string;
  locations: number;
}

const SpeciesInfo = ({ species, status, locations }: SpeciesInfoProps) => {
  return (
    <div className="glass-panel rounded-2xl p-6 max-w-md animate-float">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-accent/20 rounded-lg">
          <AlertCircle className="h-6 w-6 text-accent" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-foreground mb-1">{species}</h3>
          <p className="text-sm text-muted-foreground mb-3">Endangered Species</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conservation Status:</span>
              <span className="text-accent font-medium">{status}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Known Habitats:</span>
              <span className="text-primary font-medium">{locations} locations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesInfo;
