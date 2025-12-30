import { RefreshCw, Database, Calendar, AlertCircle } from "lucide-react";
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
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4 bg-muted/50 border-border/50">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Checking data status...</span>
        </div>
      </Card>
    );
  }

  if (!hasData) {
    return (
      <Card className="p-6 bg-accent/30 border-accent">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-accent-foreground mt-0.5" />
            <div>
              <h3 className="font-medium text-foreground">No Data Available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Sync the NADAC database to enable drug pricing searches.
              </p>
            </div>
          </div>
          <Button 
            onClick={onSync} 
            disabled={isSyncing}
            variant="default"
            className="shrink-0"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-card border-border/50">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 sm:gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 shrink-0" />
            <span>
              <span className="font-medium text-foreground">{totalRecords.toLocaleString()}</span> drugs
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 shrink-0" />
            <span className="break-words">
              Updated: <span className="font-medium text-foreground">{formatDate(lastUpdate)}</span>
            </span>
          </div>
        </div>
        <Button 
          onClick={onSync} 
          disabled={isSyncing}
          variant="ghost"
          size="sm"
          className="w-full sm:w-auto"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};
