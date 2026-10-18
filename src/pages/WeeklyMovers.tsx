import { useSuspenseQuery } from "@tanstack/react-query";
import { weeklyPublicationQuery } from "@/lib/weekly-publication.query";
import { Link } from "@/lib/router-compat";
import { TrendingUp, TrendingDown, ArrowRight, Loader2, Info, Lock, Sparkles } from "lucide-react";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { drugNameToSlug } from "@/lib/drug-slug";
import { useAuth } from "@/contexts/AuthContext";
import { formatSourceDate } from "@/lib/format-date";

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
  formatSourceDate(d, { month: "long", day: "numeric", year: "numeric" });

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

const MoversCard = ({
  title,
  type,
  movers,
  isSubscribed,
}: {
  title: string;
  type: "increase" | "decrease";
  movers: Mover[];
  isSubscribed: boolean;
}) => {
  const isUp = type === "increase";
  // Free users see only the #1 (biggest) mover; ranks 2+ are locked.
  const lockedCount = isSubscribed ? 0 : Math.max(0, movers.length - 1);

  return (
    <Card className="overflow-hidden">
      <div
        className={`flex items-center gap-2 p-4 border-b border-border/40 ${
          isUp ? "bg-red-500/5" : "bg-emerald-500/5"
        }`}
      >
        {isUp ? (
          <TrendingUp className="h-5 w-5 text-red-500" />
        ) : (
          <TrendingDown className="h-5 w-5 text-emerald-500" />
        )}
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <div className="relative">
        {movers.map((m, i) => {
          const rank = i + 1;
          // Free: rank 1 visible, ranks 2..N blurred
          const locked = !isSubscribed && rank > 1;
          return (
            <div key={m.ndc} className={locked ? "pointer-events-none select-none blur-sm" : ""} aria-hidden={locked}>
              <MoverRow mover={m} rank={rank} type={type} />
            </div>
          );
        })}
        {!isSubscribed && lockedCount > 0 && (
          <div className="absolute inset-0 top-[64px] flex items-start justify-center bg-gradient-to-b from-background/60 via-background/90 to-background/95 backdrop-blur-[1px] pt-8">
            <div className="text-center px-4 py-6 max-w-xs">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {lockedCount} more locked
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Upgrade to Pro to see the full top {movers.length} {isUp ? "increases" : "decreases"} this week and get them emailed each Wednesday.
              </p>
              <Button asChild size="sm">
                <Link to="/pricing">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Pro
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default function WeeklyMovers() {
  const { user, isSubscribed } = useAuth();
  const {data:publication} = useSuspenseQuery(weeklyPublicationQuery);
  const loading = false;
  const data: MoversData = {success:!!publication.runId && !publication.pendingDate,currentDate:publication.currentDate ?? "",previousDate:publication.previousDate ?? "",topIncreases:publication.topIncreases,topDecreases:publication.topDecreases,totalChanged:publication.totalChanged ?? 0};

  return (
    <>

      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <SiteNavigation />

        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Weekly NADAC Price Movers
            </h1>
            <p className="text-muted-foreground">
              Top 10 biggest NADAC price increases and decreases, ranked by percent change.
            </p>
            {data?.success && (
              <p className="text-xs text-muted-foreground mt-1">
                Latest changes: {formatDate(data.currentDate)} vs {formatDate(data.previousDate)}
              </p>
            )}
            {publication?.currentDate && <p className="text-xs text-muted-foreground mt-1">Newest CMS data: {formatDate(publication.currentDate)}</p>}
            {publication?.pendingDate && <p role="status" className="text-sm text-muted-foreground mt-3">{formatSourceDate(publication.pendingDate, {month:"long",day:"numeric"})} pricing is available; weekly Movers are still processing.</p>}
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
            {data.totalChanged === 0 ? (
              <section className="border-y border-border py-6 space-y-2">
                <p>No comparable NADAC prices changed between {formatDate(data.previousDate)} and {formatDate(data.currentDate)}.</p>
                <p className="text-sm text-muted-foreground">{publication?.added ?? 0} NDCs added · {publication?.removed ?? 0} NDCs removed · {publication?.nonComparable ?? 0} non-comparable NDCs</p>
              </section>
            ) : !user ? (
              <Card className="p-10 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <Lock className="h-10 w-10 text-primary mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Sign up to see the biggest NADAC movers
                </h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create a free account to preview the top mover in each list. Upgrade to Pro to unlock all 10.
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Button asChild size="lg">
                    <Link to="/auth">Create free account</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link to="/auth">Sign in</Link>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                <MoversCard
                  title={`Top ${data.topIncreases.length} Increases · ${formatDate(data.currentDate)}`}
                  type="increase"
                  movers={data.topIncreases}
                  isSubscribed={isSubscribed}
                />
                <MoversCard
                  title={`Top ${data.topDecreases.length} Decreases · ${formatDate(data.currentDate)}`}
                  type="decrease"
                  movers={data.topDecreases}
                  isSubscribed={isSubscribed}
                />
              </div>
            )}
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
