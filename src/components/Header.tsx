import { Pill, LogIn, LogOut, User, BookmarkCheck, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Header = () => {
  const { user, isSubscribed, signOut } = useAuth();

  const handleSubscribe = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to start checkout');
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening portal:', error);
      toast.error('Failed to open subscription management');
    }
  };

  return (
    <header className="gradient-hero text-primary-foreground py-16 md:py-24 relative">
      {/* Auth buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <>
                <Link to="/saved-drugs">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <BookmarkCheck className="h-4 w-4 mr-1" />
                    Saved Drugs
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleManageSubscription}
                  className="text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Crown className="h-4 w-4 mr-1" />
                  Manage Plan
                </Button>
              </>
            ) : (
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleSubscribe}
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Crown className="h-4 w-4 mr-1" />
                Upgrade to Pro
              </Button>
            )}
            <span className="text-sm text-primary-foreground/80 hidden sm:inline">
              <User className="h-4 w-4 inline mr-1" />
              {user.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Sign Out
            </Button>
          </div>
        ) : (
          <Link to="/auth">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Button>
          </Link>
        )}
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center animate-fade-in">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-6 shadow-glow">
            <Pill className="h-8 w-8 md:h-10 md:w-10" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            NADAC Drug Pricing
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl">
            Search the National Average Drug Acquisition Cost database for current pharmaceutical pricing information.
          </p>
        </div>
      </div>
    </header>
  );
};
