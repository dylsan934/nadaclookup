import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History, Bookmark, Bell, Check, Crown, TrendingUp, Calculator } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureHighlight?: string;
}

const proFeatures = [
  {
    icon: Calculator,
    label: "Unlimited Reimbursement Calculator",
    description: "Run unlimited reimbursement calculations with your contract formulas to spot underwater claims"
  },
  {
    icon: History,
    label: "Full NADAC Price History",
    description: "View years of pricing data to spot trends and predict changes"
  },
  {
    icon: Bell,
    label: "Automated Price Change Alerts",
    description: "Get notified via email and in-app when weekly NADAC prices change"
  },
  {
    icon: Bookmark,
    label: "Unlimited Saved Drugs",
    description: "Save and organize as many drugs as you need"
  },
  {
    icon: TrendingUp,
    label: "Weekly Top 10 Movers",
    description: "See the full top 10 NADAC increases and decreases every week"
  },
];

const freeFeatures = [
  "Unlimited NADAC drug price search",
  "5 reimbursement calculations per month (resets on the 1st)",
  "1 saved contract rule",
  "Save up to 3 drugs",
];

export const UpgradeModal = ({ open, onOpenChange, featureHighlight }: UpgradeModalProps) => {
  const { user } = useAuth();
  const { start: handleUpgrade, isStarting } = useStartCheckout({
    onSuccess: () => onOpenChange(false),
  });


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Upgrade to Pro
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Unlock powerful tools to track pricing changes and protect your margins
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {featureHighlight && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-center text-sm text-amber-700 dark:text-amber-300 font-medium">
                {featureHighlight}
              </p>
            </div>
          )}

          {/* Pro Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-semibold text-foreground">Pro Features</span>
            </div>
            <div className="space-y-2">
              {proFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 dark:to-transparent border border-amber-100 dark:border-amber-900/50"
                >
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/50 shrink-0 mt-0.5">
                    <feature.icon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{feature.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{feature.description}</p>
                  </div>
                  <Check className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
          </div>

          {/* Free Features */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Also includes free features</span>
            <div className="flex flex-wrap gap-2">
              {freeFeatures.map((feature, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-xs text-muted-foreground"
                >
                  <Check className="h-3 w-3 text-emerald-500" />
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center pt-2 pb-1 border-t border-border/50">
            <p className="text-3xl font-bold text-foreground pt-4">
              $29<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              7-day free trial · No charge until day 8 · Cancel anytime
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {user ? (
            <>
              <Button 
                size="lg" 
                onClick={handleUpgrade}
                disabled={isStarting}
                className="w-full font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
              >
                <Crown className="h-4 w-4 mr-2" />
                Start 7-Day Free Trial
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                Continue with free plan
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth?mode=signup" className="w-full" onClick={() => onOpenChange(false)}>
                <Button 
                  size="lg" 
                  className="w-full font-semibold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-md"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Start 7-Day Free Trial
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <span>Already have an account?</span>
                <Link 
                  to="/auth" 
                  onClick={() => onOpenChange(false)}
                  className="text-primary hover:underline font-medium"
                >
                  Sign in
                </Link>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                Continue with free plan
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
