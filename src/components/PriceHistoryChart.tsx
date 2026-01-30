import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface PriceHistoryPoint {
  date: string;
  price: number;
  pricingUnit: string;
}

export interface PriceHistoryStats {
  currentPrice: number;
  highestPrice: number;
  lowestPrice: number;
  percentChange: number;
  dataPoints: number;
}

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
  stats: PriceHistoryStats;
  drugName: string;
}

export const PriceHistoryChart = ({ history, stats, drugName }: PriceHistoryChartProps) => {
  const chartData = useMemo(() => {
    return history.map((point) => ({
      date: point.date,
      price: point.price,
      formattedDate: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
    }));
  }, [history]);

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const formatTooltipPrice = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(value);
  };

  const getTrendIcon = () => {
    if (stats.percentChange > 1) return <TrendingUp className="h-4 w-4 text-destructive" />;
    if (stats.percentChange < -1) return <TrendingDown className="h-4 w-4 text-green-600" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = () => {
    if (stats.percentChange > 1) return "text-destructive";
    if (stats.percentChange < -1) return "text-green-600";
    return "text-muted-foreground";
  };

  const averagePrice = useMemo(() => {
    if (history.length === 0) return 0;
    return history.reduce((sum, p) => sum + p.price, 0) / history.length;
  }, [history]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground">
            {new Date(dataPoint.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
          <p className="text-lg font-bold text-primary mt-1">
            {formatTooltipPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Current Price</p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(stats.currentPrice)}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Price Change</p>
          <div className="flex items-center gap-1.5">
            {getTrendIcon()}
            <p className={`text-lg font-bold tabular-nums ${getTrendColor()}`}>
              {stats.percentChange > 0 ? "+" : ""}
              {stats.percentChange.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowUp className="h-3 w-3 text-destructive" /> Highest
          </p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(stats.highestPrice)}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <ArrowDown className="h-3 w-3 text-green-600" /> Lowest
          </p>
          <p className="text-lg font-bold text-foreground tabular-nums">
            {formatPrice(stats.lowestPrice)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              tickFormatter={(value) => `$${value.toFixed(2)}`}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="fill-muted-foreground"
              width={60}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={averagePrice}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "hsl(var(--primary))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {stats.dataPoints} data points • Dashed line shows average price
        </span>
        <Badge variant="outline" className="text-xs font-normal">
          {history[0]?.pricingUnit || "EA"}
        </Badge>
      </div>
    </div>
  );
};
