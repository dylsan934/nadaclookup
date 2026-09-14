import { useState, useEffect } from "react";
import { format, subYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LineChart, TableIcon, AlertCircle, RefreshCw } from "lucide-react";
import { nadacApi, PriceHistoryResponse } from "@/lib/nadac-api";
import { PriceHistoryChart } from "./PriceHistoryChart";
import { cn } from "@/lib/utils";

interface PriceHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ndc: string;
  drugName: string;
}

// Session storage cache key prefix
const CACHE_PREFIX = "price_history_";
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedData {
  data: PriceHistoryResponse;
  timestamp: number;
}

type RangeMode = "preset" | "custom";

export const PriceHistoryModal = ({
  open,
  onOpenChange,
  ndc,
  drugName,
}: PriceHistoryModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyData, setHistoryData] = useState<PriceHistoryResponse | null>(null);
  const [years, setYears] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [rangeMode, setRangeMode] = useState<RangeMode>("preset");
  const [startDate, setStartDate] = useState<Date | undefined>(subYears(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  const getCacheKey = (ndc: string, years: number) => `${CACHE_PREFIX}${ndc}_${years}`;

  const getCachedData = (ndc: string, years: number): PriceHistoryResponse | null => {
    try {
      const cached = sessionStorage.getItem(getCacheKey(ndc, years));
      if (cached) {
        const parsed: CachedData = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
          return parsed.data;
        }
        sessionStorage.removeItem(getCacheKey(ndc, years));
      }
    } catch (e) {
      console.error("Cache read error:", e);
    }
    return null;
  };

  const setCachedData = (ndc: string, years: number, data: PriceHistoryResponse) => {
    try {
      const cacheEntry: CachedData = { data, timestamp: Date.now() };
      sessionStorage.setItem(getCacheKey(ndc, years), JSON.stringify(cacheEntry));
    } catch (e) {
      console.error("Cache write error:", e);
    }
  };

  const fetchHistory = async (forceRefresh = false) => {
    if (!open || !ndc) return;

    // For custom mode, we fetch max years and filter client-side
    const fetchYears = rangeMode === "custom" ? 5 : years;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && rangeMode === "preset") {
      const cached = getCachedData(ndc, fetchYears);
      if (cached) {
        setHistoryData(cached);
        setError(null);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await nadacApi.getPriceHistory(ndc, fetchYears);
      
      if (response.success) {
        if (rangeMode === "custom" && startDate && endDate) {
          // Filter history by custom date range
          const filteredHistory = response.history.filter((point) => {
            const pointDate = new Date(point.date);
            return pointDate >= startDate && pointDate <= endDate;
          });

          // Recalculate stats for filtered data
          const prices = filteredHistory.map((p) => p.price).filter((p) => p > 0);
          const filteredResponse: PriceHistoryResponse = {
            ...response,
            history: filteredHistory,
            stats: {
              currentPrice: prices.length > 0 ? prices[prices.length - 1]! : 0,
              highestPrice: prices.length > 0 ? Math.max(...prices) : 0,
              lowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
              percentChange:
                prices.length >= 2
                  ? ((prices[prices.length - 1]! - prices[0]!) / prices[0]!) * 100
                  : 0,
              dataPoints: filteredHistory.length,
            },
          };
          setHistoryData(filteredResponse);
        } else {
          setHistoryData(response);
          setCachedData(ndc, fetchYears, response);
        }
      } else {
        setError(response.error || "Failed to fetch price history");
      }
    } catch (err) {
      console.error("Price history fetch error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, ndc, years, rangeMode]);

  // Refetch when custom dates change
  useEffect(() => {
    if (open && rangeMode === "custom" && startDate && endDate) {
      fetchHistory(true);
    }
  }, [startDate, endDate]);

  const handlePresetClick = (y: number) => {
    setRangeMode("preset");
    setYears(y);
  };

  const handleCustomClick = () => {
    setRangeMode("custom");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(price);
  };

  const formatDateDisplay = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Minimum date for calendar (5 years ago)
  const minDate = subYears(new Date(), 5);
  const maxDate = new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold pr-8">
            Price History
          </DialogTitle>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {drugName}
          </p>
        </DialogHeader>

        {/* Time range selector */}
        <div className="flex flex-col gap-2 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Time range:</span>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 5].map((y) => (
                <Button
                  key={y}
                  variant={rangeMode === "preset" && years === y ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetClick(y)}
                  className="h-7 px-3 text-xs"
                >
                  {y} year{y > 1 ? "s" : ""}
                </Button>
              ))}
              <Button
                variant={rangeMode === "custom" ? "default" : "outline"}
                size="sm"
                onClick={handleCustomClick}
                className="h-7 px-3 text-xs"
              >
                Custom
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchHistory(true)}
              disabled={loading}
              className="h-7 px-2 ml-auto"
              title="Refresh data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Custom date range pickers */}
          {rangeMode === "custom" && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">From:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs justify-start font-normal min-w-[120px]",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date > (endDate || maxDate) || date < minDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">To:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 px-2 text-xs justify-start font-normal min-w-[120px]",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {endDate ? format(endDate, "MMM d, yyyy") : "End date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || minDate) || date > maxDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-[280px] rounded-lg" />
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-destructive/10 mb-4">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Unable to load price history
              </p>
              <p className="text-xs text-muted-foreground mb-4 max-w-xs">
                {error}
              </p>
              <Button variant="outline" size="sm" onClick={() => fetchHistory(true)}>
                <RefreshCw className="h-3.5 w-3.5 mr-2" />
                Try again
              </Button>
            </div>
          )}

          {!loading && !error && historyData && (
            <>
              {historyData.history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No historical price data available for this drug
                    {rangeMode === "custom" && " in the selected date range"}.
                  </p>
                </div>
              ) : (
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "chart" | "table")}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="chart" className="gap-1.5">
                      <LineChart className="h-3.5 w-3.5" />
                      Chart
                    </TabsTrigger>
                    <TabsTrigger value="table" className="gap-1.5">
                      <TableIcon className="h-3.5 w-3.5" />
                      Table
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="chart" className="mt-0">
                    <PriceHistoryChart
                      history={historyData.history}
                      stats={historyData.stats}
                      drugName={drugName}
                    />
                  </TabsContent>

                  <TabsContent value="table" className="mt-0">
                    <ScrollArea className="h-[380px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 bg-background">Date</TableHead>
                            <TableHead className="sticky top-0 bg-background text-right">Price</TableHead>
                            <TableHead className="sticky top-0 bg-background text-right">Unit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[...historyData.history].reverse().map((point, idx) => (
                            <TableRow key={`${point.date}-${idx}`}>
                              <TableCell className="font-medium">
                                {formatDateDisplay(point.date)}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatPrice(point.price)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {point.pricingUnit}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
