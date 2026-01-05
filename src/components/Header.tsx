import { useState, useEffect } from "react";
import { Pill, LogIn, LogOut, User, BookmarkCheck, Crown, Heart, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UpgradeModal } from "@/components/UpgradeModal";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { LockedNotificationDropdown } from "@/components/LockedNotificationDropdown";

export const Header = () => {
  const { user, isSubscribed, signOut } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadAlerts = async () => {
      if (!user || !isSubscribed) {
        setUnreadCount(0);
        return;
      }

      const { count, error } = await supabase
        .from('price_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadAlerts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('price_alerts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_alerts',
        },
        () => fetchUnreadAlerts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isSubscribed]);

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
    <header className="gradient-hero text-primary-foreground relative overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      
      {/* Navigation bar */}
      <nav className="relative z-10 border-b border-primary-foreground/10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-primary-foreground hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center">
                <Pill className="h-4 w-4" />
              </div>
              <span className="font-semibold hidden sm:inline">NADAC Pricing</span>
            </Link>

            {/* Auth actions */}
            <div className="flex items-center gap-2">
              <TooltipProvider>
              {user ? (
                <>
                  {/* Notification bell for premium users */}
                  {isSubscribed ? (
                    <NotificationDropdown 
                      userId={user.id}
                      unreadCount={unreadCount}
                      onUnreadCountChange={setUnreadCount}
                    />
                  ) : (
                    <LockedNotificationDropdown onUpgradeClick={() => setShowUpgradeModal(true)} />
                  )}

                  {/* Always show Saved link - paywall is on the page */}
                  <Link to="/saved-drugs">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      {isSubscribed ? (
                        <BookmarkCheck className="h-4 w-4" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline ml-1">Saved</span>
                    </Button>
                  </Link>
                  
                  {isSubscribed ? (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleManageSubscription}
                      className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Crown className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Plan</span>
                    </Button>
                  ) : (
                    <Button 
                      size="sm"
                      onClick={() => setShowUpgradeModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-sm gap-1.5"
                    >
                      <Crown className="h-3.5 w-3.5" />
                      <span>Pro</span>
                      <Badge variant="secondary" className="ml-0.5 bg-amber-300/30 text-amber-950 border-0 text-[10px] px-1.5 py-0">
                        $29/mo
                      </Badge>
                    </Button>
                  )}
                  <div className="hidden md:flex items-center gap-2 px-2 text-primary-foreground/70 text-sm">
                    <User className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{user.email}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={signOut}
                    className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Sign Out</span>
                  </Button>
                </>
              ) : (
                <>
                  {/* Notification bell for non-logged-in users */}
                  <LockedNotificationDropdown onUpgradeClick={() => setShowUpgradeModal(true)} />

                  {/* Saved link for non-logged-in users */}
                  <Link to="/saved-drugs">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="hidden sm:inline ml-1">Saved</span>
                    </Button>
                  </Link>
                  {/* Upgrade CTA for non-logged-in users */}
                  <Button 
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowUpgradeModal(true)}
                    className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Pro</span>
                  </Button>
                  <Link to="/auth">
                    <Button 
                      size="sm"
                      className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-sm"
                    >
                      <LogIn className="h-4 w-4" />
                      <span className="ml-1">Sign In</span>
                    </Button>
                  </Link>
                </>
              )}
              </TooltipProvider>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 text-sm text-primary-foreground/90 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Updated weekly with official CMS data
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 text-balance">
            NADAC Drug Pricing Database
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/85 max-w-xl mx-auto leading-relaxed">
            Search the National Average Drug Acquisition Cost database for current pharmaceutical pricing information.
          </p>
        </div>
      </div>

      <UpgradeModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} />
    </header>
  );
};
