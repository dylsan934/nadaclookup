import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";

export const HomeProUpsell = () => {
  const { user, isSubscribed } = useAuth();
  const { start: handleStartTrial, isStarting } = useStartCheckout();

  if (isSubscribed) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          Pro · $29/mo
        </p>
        <p className="text-sm text-muted-foreground">
          Full price history, automated alerts, unlimited saves. 7-day free trial · Cancel anytime.{" "}
          <Link to="/pricing" className="text-primary hover:underline">
            See all features
          </Link>
        </p>
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
