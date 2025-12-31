import { useState } from "react";
import { Bell, TrendingUp, TrendingDown, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LockedNotificationDropdownProps {
  onUpgradeClick: () => void;
}

const placeholderAlerts = [
  { drug: "LISINOPRIL 10MG TABLETS", change: "+12.3%", isIncrease: true, time: "2 hours ago" },
  { drug: "METFORMIN HCL 500MG", change: "-5.8%", isIncrease: false, time: "1 day ago" },
  { drug: "AMLODIPINE 5MG TABLETS", change: "+8.2%", isIncrease: true, time: "3 days ago" },
];

export const LockedNotificationDropdown = ({ onUpgradeClick }: LockedNotificationDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 relative"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 bg-popover border border-border shadow-lg z-50 p-0 overflow-hidden"
      >
        {/* Blurred placeholder notifications */}
        <div className="relative">
          <div className="blur-[2px] opacity-50 pointer-events-none select-none">
            {placeholderAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 border-b border-border last:border-b-0"
              >
                <div className={`mt-0.5 p-1 rounded ${alert.isIncrease ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  {alert.isIncrease ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-foreground">
                    {alert.drug}
                  </p>
                  <p className={`text-xs ${alert.isIncrease ? 'text-destructive' : 'text-emerald-600'}`}>
                    NADAC {alert.isIncrease ? 'increased' : 'decreased'} by {alert.change}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Overlay with upgrade CTA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-popover/80 backdrop-blur-[1px] p-4">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h4 className="font-semibold text-sm text-foreground text-center mb-1">
              Price Change Alerts
            </h4>
            <p className="text-xs text-muted-foreground text-center mb-4 max-w-[200px]">
              Get notified instantly when drug prices change. Never miss a cost increase again.
            </p>
            <Button 
              size="sm"
              onClick={() => {
                setIsOpen(false);
                onUpgradeClick();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-amber-950 shadow-sm gap-1.5"
            >
              <Crown className="h-3.5 w-3.5" />
              <span>Upgrade to Pro</span>
            </Button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
