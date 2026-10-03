import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";
import { BillingToggle, type BillingPlan } from "@/components/BillingToggle";

export const HomeProUpsell = () => {
  const { user, isSubscribed } = useAuth();
  const { start: handleStartCheckout, isStarting } = useStartCheckout();
  const [plan, setPlan] = useState<BillingPlan>("monthly");

  const handleStartTrial = () => handleStartCheckout(plan);

  if (isSubscribed) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Pro · {plan === "annual" ? "$290/yr" : "$29/mo"}
        </p>
        {plan === "annual" && (
          <p className="text-xs font-medium text-primary mt-1">
            2 months free — save $58 vs. paying monthly ($348/yr)
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Less than the cost of one mispriced prescription. Unlimited reimbursement calculator, full price history, automated alerts, unlimited watchlist.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          7-day free trial · Card required, not charged until day 8 · Cancel anytime before then · 30-day money-back guarantee · Secure checkout by Stripe ·{" "}
          <Link to="/pricing" className="text-primary hover:underline">
            See all features
          </Link>
        </p>
        <div className="mt-3">
          <BillingToggle value={plan} onChange={setPlan} />
        </div>
      </div>
      {user ? (
        <Button onClick={handleStartTrial} disabled={isStarting} className="shrink-0">
          Start 7-day trial
        </Button>
      ) : (
        <Button asChild className="shrink-0">
          <Link to="/auth?mode=signup">Start 7-day trial</Link>
        </Button>
      )}
    </section>
  );
};
