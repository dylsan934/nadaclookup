import { Database, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { formatSourceDateShort } from "@/lib/format-date";
import { drugNameToSlug } from "@/lib/drug-slug";

interface DataStatusProps {
  hasData: boolean;
  lastUpdate?: string | undefined;
  /** Distinct NDCs in the database. */
  totalRecords: number;
  lastSyncAt?: string | undefined;
  biggestMover?: { drugName: string; ndc: string; pctChange: number } | undefined;
  isLoading: boolean;
}

const formatSync = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" });

/** Live dataset proof strip: NDC count, last CMS sync, last week's biggest mover. */
export const DataStatus = ({ hasData, lastUpdate, totalRecords, lastSyncAt, biggestMover, isLoading }: DataStatusProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-busy="true" aria-label="Loading dataset stats">
        {[0, 1, 2].map((i) => <div key={i} className="h-[74px] rounded-xl border border-border/40 bg-muted/30 animate-pulse" />)}
      </div>
    );
  }

  if (!hasData) {
    return (
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Database className="h-4 w-4" /> Data syncs automatically every Wednesday
      </p>
    );
  }

  const up = (biggestMover?.pctChange ?? 0) >= 0;
  const Trend = up ? TrendingUp : TrendingDown;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Database className="h-3.5 w-3.5" aria-hidden="true" />NDCs in the database</dt>
        <dd className="text-xl font-bold text-foreground tabular-nums">{totalRecords.toLocaleString()}</dd>
      </div>
      <div className="rounded-xl border border-border/60 bg-card px-4 py-3">
        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" aria-hidden="true" />Last CMS sync</dt>
        <dd className="text-sm font-semibold text-foreground leading-tight mt-1">
          {lastSyncAt ? formatSync(lastSyncAt) : "Weekly, Wednesdays"}
          {lastUpdate && <span className="block text-xs font-normal text-muted-foreground">Prices effective {formatSourceDateShort(lastUpdate)}</span>}
        </dd>
      </div>
      <div className="rounded-xl border border-border/60 bg-card px-4 py-3 min-w-0">
        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Trend className="h-3.5 w-3.5" aria-hidden="true" />Last week's biggest mover</dt>
        {biggestMover ? (
          <dd className="text-sm leading-tight mt-1 min-w-0">
            <Link to={`/drug/${drugNameToSlug(biggestMover.drugName)}`} className="font-semibold text-foreground hover:text-primary hover:underline block truncate">
              {biggestMover.drugName}
            </Link>
            <span className={up ? "text-destructive font-semibold" : "text-primary font-semibold"}>
              {up ? "+" : ""}{biggestMover.pctChange.toFixed(1)}%
            </span>{" "}
            <Link to="/movers" className="text-xs text-muted-foreground hover:underline">See all movers</Link>
          </dd>
        ) : (
          <dd className="text-sm text-muted-foreground mt-1">No changes this week</dd>
        )}
      </div>
    </dl>
  );
};
