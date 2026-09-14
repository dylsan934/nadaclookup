import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";

export const HomePricing = () => {
  const { user, isSubscribed } = useAuth();
  const { start: handleStartTrial, isStarting } = useStartCheckout();


  if (isSubscribed) return null;

  return (
    <section className="py-12 md:py-16">
      {/* ROI Section */}
      <div className="max-w-2xl mx-auto mb-10 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
          Simple, Transparent Pricing for Pharmacies
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Start with free NADAC lookups. Upgrade to Pro when you need full price history, unlimited saves, and automated alerts — less than the cost of one mispriced prescription.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 text-sm text-muted-foreground mb-8">
          <span>✓ Spot price drops to improve buying decisions</span>
          <span>✓ Track trends for better PBM negotiations</span>
          <span>✓ Built for real retail pharmacists</span>
        </div>
        <p className="text-sm italic text-muted-foreground">
          Built by a retail pharmacist working 40 hours/week in independent pharmacy — just like you.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Free */}
        <div className="bg-card border border-border rounded-xl p-7">
          <h3 className="text-lg font-bold text-foreground mb-1">Free</h3>
          <p className="text-3xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">Perfect for occasional lookups</p>
          <ul className="space-y-2.5 text-sm mb-8">
            {["Unlimited NADAC price searches", "5 reimbursement calculations/month", "Search by drug name or NDC", "Side-by-side drug comparison", "Save up to 3 drugs", "Weekly updated CMS data"].map(f => (
              <li key={f} className="flex items-start gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}
              </li>
            ))}
          </ul>
          <Button asChild variant="outline" className="w-full">
            <Link to="/">Start Searching Free — No Card Required</Link>
          </Button>
        </div>

        {/* Pro */}
        <div className="bg-card border-2 border-primary rounded-xl p-7 relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
              Most Popular
            </span>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">Pro</h3>
          <p className="text-3xl font-bold text-foreground">$29<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="text-sm text-muted-foreground mt-2 mb-6">For serious pharmacy professionals</p>
          <ul className="space-y-2.5 text-sm mb-8">
            {["Unlimited use of reimbursement calculator", "Full NADAC price history charts", "Automated price change alerts", "Unlimited saved drugs", "Weekly Top 10 movers (increases & decreases)", "Weekly movers email digest", "Custom alert thresholds", "Drug categories & notes", "Priority support", "Everything in Free"].map(f => (
              <li key={f} className="flex items-start gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}
              </li>
            ))}
          </ul>
          {user ? (
            <>
              <Button className="w-full" onClick={handleStartTrial} disabled={isStarting}>
                Start 7-Day Free Trial
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                7-day free trial · No charge until day 8 · Cancel anytime
              </p>
            </>
          ) : (
            <>
              <Button asChild className="w-full">
                <Link to="/auth?mode=signup">Start 7-Day Free Trial</Link>
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                7-day free trial · No charge until day 8 · Cancel anytime
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
