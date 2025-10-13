import { MapPin, AlertTriangle, Leaf } from 'lucide-react';

interface ExpandedImageViewProps {
  imageUrl: string;
  type: 'threat' | 'ecosystem';
  context: string;
  title: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  externalMessage?: string;
  description?: string;
  location?: string;
  severity?: string;
  affectedSpecies?: number;
}

const ExpandedImageView = ({
  imageUrl,
  type,
  context,
  title,
  onClose,
  onNext,
  onPrevious,
  description,
  location,
  severity,
  affectedSpecies
}: ExpandedImageViewProps) => {

  const getTypeIcon = () => {
    if (type === 'threat') return '⚠️';
    return '🌿';
  };

  const getTypeLabel = () => {
    if (type === 'threat') return 'Environmental Threat';
    return 'Ecosystem Connection';
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden animate-fade-in">
      {/* Image */}
      <div className="w-full">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-64 object-cover"
        />
      </div>

      {/* Fast Facts */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-foreground mb-1">{title}</h3>
        <p className="text-sm text-primary mb-4">{getTypeLabel()}</p>

        <div className="mb-3">
          <p className="text-xs text-muted-foreground">Type</p>
          <p className="text-base font-semibold text-primary">
            {type === 'threat' ? 'Environmental Threat' : 'Ecosystem Element'}
          </p>
        </div>

        {severity && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Severity Level</p>
            <p className={`text-base font-semibold ${
              severity.toLowerCase().includes('critical') ? 'text-red-500' :
              severity.toLowerCase().includes('high') ? 'text-orange-500' :
              severity.toLowerCase().includes('moderate') ? 'text-yellow-500' :
              'text-green-500'
            }`}>
              {severity}
            </p>
          </div>
        )}

        {affectedSpecies !== undefined && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Affected Species</p>
            <p className="text-base font-semibold text-accent">
              {affectedSpecies} species impacted
            </p>
          </div>
        )}

        {location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandedImageView;