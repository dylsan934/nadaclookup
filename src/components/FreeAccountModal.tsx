import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, Bell, Bookmark, Calculator, Crown, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface FreeAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const freeFeatures = [
  { icon: Heart, label: "Save up to 3 drugs" },
  { icon: Bell, label: "Get alerted when prices change" },
];

const proFeatures = [
  { icon: Bookmark, label: "Unlimited saved drugs" },
  { icon: Calculator, label: "Pricing calculator tools" },
  { icon: Bell, label: "Unlimited price alerts" },
];

export const FreeAccountModal = ({ open, onOpenChange }: FreeAccountModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-3 pb-2">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Heart className="h-7 w-7 text-primary" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              Create a Free Account
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Save up to 3 drugs and get alerted when prices change
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Free features */}
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
              Free Account Includes
            </p>
            {freeFeatures.map((feature, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50"
              >
                <div className="p-1.5 rounded-md bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-foreground flex-1">{feature.label}</span>
                <Check className="h-4 w-4 text-primary" />
              </div>
            ))}
          </div>

          {/* CTA for free account */}
          <Link to="/auth" className="w-full block" onClick={() => onOpenChange(false)}>
            <Button size="lg" className="w-full font-semibold">
              Create Free Account
            </Button>
          </Link>

          {/* Pro plan section */}
          <div className="border-t border-border pt-5 space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold text-foreground">
                Want more? Go Pro
              </p>
            </div>
            
            <div className="space-y-2">
              {proFeatures.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20"
                >
                  <div className="p-1 rounded-md bg-amber-100 dark:bg-amber-900/50">
                    <feature.icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="text-sm text-foreground">{feature.label}</span>
                </div>
              ))}
            </div>

            <div className="text-center pt-1">
              <p className="text-lg font-bold text-foreground">
                $29<span className="text-sm font-normal text-muted-foreground">/month</span>
              </p>
            </div>

            <Link to="/auth" className="w-full block" onClick={() => onOpenChange(false)}>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full font-medium border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/30"
              >
                <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                Get Started with Pro
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground pt-1">
          <span>Already have an account?</span>
          <Link 
            to="/auth" 
            onClick={() => onOpenChange(false)}
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
