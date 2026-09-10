import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Calculator, History, Bell, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useStartCheckout } from "@/hooks/useStartCheckout";

const DISMISSED_KEY = "welcome_trial_dismissed_v1";

const highlights = [
  { icon: Calculator, label: "Unlimited reimbursement calculator" },
  { icon: History, label: "Full NADAC price history" },
  { icon: Bell, label: "Automated price change alerts" },
];

/**
 * One-time post-sign-up trial offer. Shown on the homepage when the URL has
 * ?welcome=1, the user is not subscribed, and the offer hasn't been dismissed.
 */
export const WelcomeTrialModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isSubscribed } = useAuth();
  const [open, setOpen] = useState(false);
  const { start, isStarting } = useStartCheckout({
    onSuccess: () => dismiss(),
  });

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // ignore
    }
    const next = new URLSearchParams(searchParams);
    next.delete("welcome");
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (searchParams.get("welcome") !== "1") return;
    if (isSubscribed) return;
    try {
      if (localStorage.getItem(DISMISSED_KEY) === "1") return;
    } catch {
      // ignore
    }
    // Only show to brand-new accounts (created in the last 15 minutes)
    if (user?.created_at) {
      const ageMs = Date.now() - new Date(user.created_at).getTime();
      if (ageMs > 15 * 60 * 1000) return;
    }
    setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isSubscribed, user?.created_at]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg">
              <Crown className="h-7 w-7 text-white" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Welcome! Start your 7-day free Pro trial
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account is ready. Unlock everything free for 7 days.
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {highlights.map((h) => (
            <div key={h.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
              <div className="p-1.5 rounded-md bg-primary/10">
                <h.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-foreground flex-1">{h.label}</span>
              <Check className="h-4 w-4 text-primary" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            size="lg"
            onClick={start}
            disabled={isStarting}
            className="w-full font-semibold"
          >
            <Crown className="h-4 w-4 mr-2" />
            Start 7-Day Free Trial
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            7-day free trial · No charge until day 8 · Cancel anytime
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
