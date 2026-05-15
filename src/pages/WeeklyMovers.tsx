import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, Loader2, Info, Lock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drugNameToSlug } from "@/lib/drug-slug";
import { useAuth } from "@/contexts/AuthContext";

interface Mover {
  ndc: string;
  drugName: string;
  oldPrice: number;
  newPrice: number;
  pctChange: number;
  pricingUnit: string;
}

interface MoversData {
  success: boolean;
  currentDate: string;
  previousDate: string;
  topIncreases: Mover[];
  topDecreases: Mover[];
  totalChanged: number;
  error?: string;
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4 }).format(n);

const formatDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const MoverRow = ({ mover, rank, type }: { mover: Mover; rank: number; type: "increase" | "decrease" }) => {
  const isUp = type === "increase";
  const slug = drugNameToSlug(mover.drugName);

  return (
    <Link to={`/drug/${slug}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0">
        <span className="text-lg font-bold text-muted-foreground w-7 text-center">{rank}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground truncate">{mover.drugName}</p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(mover.oldPrice)} → {formatPrice(mover.newPrice)} / {mover.pricingUnit}
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            isUp
              ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 shrink-0"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
          }
        >
          {isUp ? "+" : ""}{mover.pctChange}%
        </Badge>
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
    </Link>
  );
};

export default function WeeklyMovers() {
  const { user, isSubscribed } = useAuth();
  const [data, setData] = useState<MoversData | null>(null);
  const [latestDataDate, setLatestDataDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: row, error }, { data: latest }] = await Promise.all([
          supabase
            .from("weekly_movers")
            .select("*")
            .gt("total_changed", 0)
            .order("effective_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("nadac_drugs")
            .select("effective_date")
            .order("effective_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (error) throw error;
        if (latest?.effective_date) setLatestDataDate(latest.effective_date);
        if (row) {
          setData({
            success: true,
            currentDate: row.effective_date,
            previousDate: row.previous_date,
            topIncreases: row.top_increases as unknown as Mover[],
            topDecreases: row.top_decreases as unknown as Mover[],
            totalChanged: row.total_changed,
          });
        } else {
          setData({ success: false, currentDate: "", previousDate: "", topIncreases: [], topDecreases: [], totalChanged: 0, error: "No data yet" });
        }
      } catch (e) {
        console.error("Failed to load movers:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const showStaleBanner =
    !!data?.success && !!latestDataDate && latestDataDate !== data.currentDate;

  const weekLabel = data?.currentDate ? formatDate(data.currentDate) : "This Week";

  return (
    <>
      <SEOHead
        title="NADAC Weekly Price Movers — Biggest Drug Price Changes"
        description="See the top 5 NADAC drug price increases and decreases this week. Track pharmacy acquisition cost changes updated every Wednesday."
        canonical="https://nadaclookup.com/movers"
      />

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <SiteNavigation />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Weekly NADAC Price Movers
            </h1>
            <p className="text-muted-foreground">
              Top 5 biggest price increases and decreases — week of {weekLabel}
            </p>
            {data && (
              <p className="text-xs text-muted-foreground mt-1">
                Comparing {formatDate(data.previousDate)} → {formatDate(data.currentDate)} · {data.totalChanged.toLocaleString()} drugs changed
              </p>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !data?.success ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                {data?.error || "Unable to load weekly movers. Check back after the next data sync."}
              </p>
            </Card>
          ) : (
            <>
            {showStaleBanner && (
              <Card className="p-4 mb-6 bg-primary/5 border-primary/20 flex gap-3 items-start">
                <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">
                  New NADAC data was published on <strong>{formatDate(latestDataDate!)}</strong>, but it was a small incremental update with too few rows for week-over-week comparison. The movers below reflect the most recent full weekly snapshot ({formatDate(data.previousDate)} → {formatDate(data.currentDate)}). They'll refresh when CMS releases the next full snapshot.
                </p>
              </Card>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Increases */}
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/40 bg-red-500/5">
                  <TrendingUp className="h-5 w-5 text-red-500" />
                  <h2 className="font-semibold text-foreground">Top 5 Increases</h2>
                </div>
                <div className="divide-y-0">
                  {data.topIncreases.map((m, i) => (
                    <MoverRow key={m.ndc} mover={m} rank={i + 1} type="increase" />
                  ))}
                </div>
              </Card>

              {/* Decreases */}
              <Card className="overflow-hidden">
                <div className="flex items-center gap-2 p-4 border-b border-border/40 bg-emerald-500/5">
                  <TrendingDown className="h-5 w-5 text-emerald-500" />
                  <h2 className="font-semibold text-foreground">Top 5 Decreases</h2>
                </div>
                <div className="divide-y-0">
                  {data.topDecreases.map((m, i) => (
                    <MoverRow key={m.ndc} mover={m} rank={i + 1} type="decrease" />
                  ))}
                </div>
              </Card>
            </div>
            </>
          )}

          {/* SEO Content */}
          <section className="mt-12 prose prose-sm dark:prose-invert max-w-none">
            <h2>Understanding NADAC Price Changes</h2>
            <p>
              The National Average Drug Acquisition Cost (NADAC) is updated weekly by CMS, typically every Wednesday. 
              These price changes reflect shifts in what pharmacies actually pay to acquire medications from wholesalers 
              and manufacturers. Monitoring the biggest movers each week helps independent pharmacies stay ahead of 
              cost fluctuations that directly impact margins.
            </p>
            <h3>Why Do NADAC Prices Change?</h3>
            <p>
              Price swings can result from manufacturer price adjustments, supply chain disruptions, generic competition 
              entering the market, or changes in wholesale acquisition costs reported by pharmacies in the NADAC survey. 
              Large increases may signal supply shortages, while significant decreases often indicate new generic 
              alternatives becoming available.
            </p>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
