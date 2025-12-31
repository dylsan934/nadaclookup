import { useState, useEffect } from "react";
import { Bell, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface PriceAlert {
  id: string;
  drug_name: string;
  ndc: string;
  old_price: number;
  new_price: number;
  price_change_percent: number;
  sent_at: string;
  read_at: string | null;
}

interface NotificationDropdownProps {
  userId: string;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationDropdown = ({ 
  userId, 
  unreadCount,
  onUnreadCountChange 
}: NotificationDropdownProps) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setAlerts(data);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, userId]);

  const markAsRead = async (alertId: string) => {
    await supabase
      .from('price_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId);
    
    onUnreadCountChange(Math.max(0, unreadCount - 1));
  };

  const markAllAsRead = async () => {
    await supabase
      .from('price_alerts')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);
    
    setAlerts(prev => prev.map(a => ({ ...a, read_at: new Date().toISOString() })));
    onUnreadCountChange(0);
  };

  const handleNotificationClick = async (alert: PriceAlert) => {
    if (!alert.read_at) {
      await markAsRead(alert.id);
    }
    setIsOpen(false);
    // Navigate to home with search query for the drug
    navigate(`/?search=${encodeURIComponent(alert.drug_name.split(' ')[0])}`);
  };

  const formatPriceChange = (alert: PriceAlert) => {
    const changePercent = Math.abs(alert.price_change_percent).toFixed(1);
    const isIncrease = alert.new_price > alert.old_price;
    return {
      text: `NADAC ${isIncrease ? 'increased' : 'decreased'} by ${changePercent}%`,
      isIncrease,
    };
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10 relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-semibold text-amber-950 px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-popover border border-border shadow-lg z-50"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Price Alerts</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto py-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {alerts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No price alerts yet. Save drugs and enable alerts to get notified of price changes.
            </div>
          ) : (
            alerts.map((alert) => {
              const { text, isIncrease } = formatPriceChange(alert);
              return (
                <DropdownMenuItem
                  key={alert.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer focus:bg-accent ${
                    !alert.read_at ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(alert)}
                >
                  <div className="flex items-start gap-2 w-full">
                    <div className={`mt-0.5 p-1 rounded ${isIncrease ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                      {isIncrease ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">
                        {alert.drug_name}
                      </p>
                      <p className={`text-xs ${isIncrease ? 'text-destructive' : 'text-emerald-600'}`}>
                        {text}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistanceToNow(new Date(alert.sent_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!alert.read_at && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
