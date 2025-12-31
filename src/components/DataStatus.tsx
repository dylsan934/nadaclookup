import { RefreshCw, Database, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DataStatusProps {
  hasData: boolean;
  lastUpdate?: string;
  totalRecords: number;
  isLoading: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export const DataStatus = ({ 
  hasData, 
  lastUpdate, 
  totalRecords, 
  isLoading, 
  isSyncing, 
  onSync 
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
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking data status...</span>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-5 bg-amber-50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-800/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">No Data Available</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sync the NADAC database to enable drug pricing searches.
              </p>
            </div>
          </div>
          <Button 
            onClick={onSync} 
            disabled={isSyncing}
            size="sm"
            className="shrink-0"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-muted/30 border-border/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
          </div>
        </div>
        <Button 
          onClick={onSync} 
          disabled={isSyncing}
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
