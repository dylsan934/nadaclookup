import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, Bookmark, Bell, Check } from "lucide-react";
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
  { icon: Calculator, label: "Quantity-based pricing calculations" },
  { icon: Bookmark, label: "Save and organize frequently used drugs" },
  { icon: Bell, label: "In-app alerts for NADAC price changes" },
];

export const UpgradeModal = ({ open, onOpenChange, featureHighlight }: UpgradeModalProps) => {
  const { user } = useAuth();

  const handleUpgrade = async () => {
    if (!user) {
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
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Calculator className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Know Your True Drug Costs
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Track pricing changes, calculate acquisition cost, and avoid margin surprises
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {featureHighlight && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-center text-sm text-primary font-medium">
                {featureHighlight}
              </p>
            </div>
          )}

          <div className="space-y-2.5">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50"
              >
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <feature.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-foreground flex-1">{feature.label}</span>
                <Check className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>

          <div className="text-center pt-2 pb-1">
            <p className="text-3xl font-bold text-foreground">
              $29<span className="text-base font-normal text-muted-foreground">/month</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Less than the cost of one mispriced prescription
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          {user ? (
            <>
              <Button size="lg" onClick={handleUpgrade} className="w-full font-semibold">
                Upgrade to Premium
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                className="text-muted-foreground hover:text-foreground"
              >
                Continue with free search
              </Button>
            </>
          ) : (
            <>
              <Link to="/auth" className="w-full" onClick={() => onOpenChange(false)}>
                <Button size="lg" className="w-full font-semibold">
                  Get Started with Premium
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
                Continue with free search
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
