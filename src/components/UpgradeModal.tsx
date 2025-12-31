import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, BookmarkCheck, Bell, Tag, Calculator, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureHighlight?: string;
}

const features = [
  { icon: Calculator, label: "Calculate true acquisition cost for any quantity instantly" },
  { icon: Bell, label: "Avoid surprise cost increases with automatic price alerts" },
  { icon: BookmarkCheck, label: "Build a personalized formulary of your most-used drugs" },
  { icon: Tag, label: "Stay organized with custom categories and notes" },
];

export const UpgradeModal = ({ open, onOpenChange, featureHighlight }: UpgradeModalProps) => {
  const { user } = useAuth();

  const handleUpgrade = async () => {
    if (!user) {
      // Close modal - they'll be redirected to sign in
      onOpenChange(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <Crown className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Upgrade to Pro</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {featureHighlight && (
            <p className="text-center text-sm text-muted-foreground">
              {featureHighlight}
            </p>
          )}

          <div className="space-y-2">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50"
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground">{feature.label}</span>
                <Check className="h-4 w-4 text-emerald-500 ml-auto" />
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <p className="text-3xl font-bold text-foreground">
              $25<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cancel anytime</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {user ? (
            <Button size="lg" onClick={handleUpgrade} className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          ) : (
            <>
              <Link to="/auth" className="w-full">
                <Button size="lg" className="w-full">
                  Sign Up to Get Pro
                </Button>
              </Link>
              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
