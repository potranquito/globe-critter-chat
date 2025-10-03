import { Activity } from "lucide-react";

interface UsageIndicatorProps {
  daily: number;
  monthly: number;
  dailyLimit: number;
  monthlyLimit: number;
}

const UsageIndicator = ({ daily, monthly, dailyLimit, monthlyLimit }: UsageIndicatorProps) => {
  const dailyPercent = (daily / dailyLimit) * 100;
  const monthlyPercent = (monthly / monthlyLimit) * 100;

  const getColor = (percent: number) => {
    if (percent >= 90) return 'text-destructive';
    if (percent >= 80) return 'text-amber-500';
    return 'text-primary';
  };

  return (
    <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
      <div className="glass-panel rounded-lg px-3 py-2 pointer-events-auto">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">API Usage</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Today:</span>
            <span className={`text-xs font-semibold ${getColor(dailyPercent)}`}>
              {daily}/{dailyLimit}
            </span>
          </div>
          
          <div className="flex justify-between items-center gap-4">
            <span className="text-xs text-muted-foreground">Month:</span>
            <span className={`text-xs font-semibold ${getColor(monthlyPercent)}`}>
              {monthly}/{monthlyLimit}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageIndicator;
