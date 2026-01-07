import { Database, Calendar, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DataStatusProps {
  hasData: boolean;
  lastUpdate?: string;
  totalRecords: number;
  isLoading: boolean;
}

export const DataStatus = ({ 
  hasData, 
  lastUpdate, 
  totalRecords, 
  isLoading, 
}: DataStatusProps) => {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/30 border-border/40">
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <div className="h-4 w-4 animate-pulse rounded-full bg-muted-foreground/30" />
          <span className="text-sm">Checking data status...</span>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-4 bg-muted/30 border-border/40">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="h-4 w-4" />
          <span>Data syncs automatically every Wednesday</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-muted/30 border-border/40">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">{totalRecords.toLocaleString()}</span> drugs
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            Updated <span className="font-medium text-foreground">{formatDate(lastUpdate)}</span>
          </span>
          <span className="text-xs">• Auto-syncs weekly</span>
        </div>
      </div>
    </Card>
  );
};
