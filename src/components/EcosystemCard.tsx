import { Network } from 'lucide-react';

interface EcosystemSpecies {
  name: string;
  role: string;
  icon: string;
}

interface EcosystemCardProps {
  species: EcosystemSpecies[];
  mainSpecies: string;
}

const EcosystemCard = ({ species, mainSpecies }: EcosystemCardProps) => {
  return (
    <div className="glass-panel rounded-2xl p-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2.5">
        <Network className="h-4 w-4 text-accent" />
        <h3 className="text-base font-bold text-foreground">Ecosystem Connections</h3>
      </div>
      
      <p className="text-xs text-muted-foreground mb-3">
        Species connected to {mainSpecies} survival
      </p>

      <div className="space-y-2">
        {species.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-background/50 rounded-lg">
            <span className="text-lg">{item.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EcosystemCard;
