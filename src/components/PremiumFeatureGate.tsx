import { Link } from "react-router-dom";
import { Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";

interface PremiumFeatureGateProps {
  children: React.ReactNode;
  featureName?: string;
  compact?: boolean;
}

export const PremiumFeatureGate = ({ 
  children, 
  featureName = "this feature",
  compact = false 
}: PremiumFeatureGateProps) => {
  const { user, isSubscribed } = useAuth();
  const { start: handleSubscribe, isStarting } = useStartCheckout();


  // If user is subscribed, show the feature
  if (isSubscribed) {
    return <>{children}</>;
  }

  // If user is not logged in, show sign in prompt
  if (!user) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground flex-1">
            Sign in to access {featureName}
          </span>
          <Link to="/auth">
            <Button size="sm" variant="secondary" className="h-7 text-xs">
              Sign In
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="p-3 rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Sign in to access {featureName}
        </p>
        <Link to="/auth">
          <Button size="sm">Sign In</Button>
        </Link>
      </div>
    );
  }

  // User is logged in but not subscribed - show upgrade prompt
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200/50 dark:border-amber-800/30">
        <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span className="text-xs text-muted-foreground flex-1">
          Upgrade to Pro to access {featureName}
        </span>
        <Button 
          size="sm" 
          variant="secondary" 
          className="h-7 text-xs"
          onClick={handleSubscribe}
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
        <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Pro Feature</p>
        <p className="text-xs text-muted-foreground mt-1">
          Upgrade to Pro to access {featureName}
        </p>
      </div>
      <Button size="sm" onClick={handleSubscribe}>
        <Crown className="h-4 w-4 mr-1.5" />
        Upgrade to Pro
      </Button>
    </div>
  );
};
