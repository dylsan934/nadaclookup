import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NotificationSettingsProps {
  userId: string;
}

interface Preferences {
  notify_saved_drugs: boolean;
  notify_large_changes_only: boolean;
}

export const NotificationSettings = ({ userId }: NotificationSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    notify_saved_drugs: true,
    notify_large_changes_only: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('notify_saved_drugs, notify_large_changes_only')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setPreferences({
          notify_saved_drugs: data.notify_saved_drugs ?? true,
          notify_large_changes_only: data.notify_large_changes_only ?? false,
        });
      }
    };

    if (isOpen) {
      fetchPreferences();
    }
  }, [isOpen, userId]);

  const updatePreference = async (key: keyof Preferences, value: boolean) => {
    setIsLoading(true);
    setPreferences(prev => ({ ...prev, [key]: value }));

    const { error } = await supabase
      .from('profiles')
      .update({ [key]: value } as never)
      .eq('user_id', userId);

    setIsLoading(false);

    if (error) {
      // Revert on error
      setPreferences(prev => ({ ...prev, [key]: !value }));
      toast.error("Failed to update preference");
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 p-0"
        >
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-72 bg-popover border border-border shadow-lg z-50"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-foreground">Alert Preferences</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Customize how you receive price alerts
            </p>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="notify-saved" className="text-sm font-medium">
                  Saved drug alerts
                </Label>
                <p className="text-xs text-muted-foreground">
                  Get notified when prices change for your saved drugs
                </p>
              </div>
              <Switch
                id="notify-saved"
                checked={preferences.notify_saved_drugs}
                onCheckedChange={(checked) => updatePreference('notify_saved_drugs', checked)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <Label htmlFor="large-changes" className="text-sm font-medium">
                  Large changes only
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only notify for price changes greater than 5%
                </p>
              </div>
              <Switch
                id="large-changes"
                checked={preferences.notify_large_changes_only}
                onCheckedChange={(checked) => updatePreference('notify_large_changes_only', checked)}
                disabled={isLoading || !preferences.notify_saved_drugs}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
