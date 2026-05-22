import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shared hook for the "Start Free Trial / Upgrade" flow.
 * - Prevents double-invoke while a request is in flight (in-flight guard + state).
 * - Handles the `alreadySubscribed` response from create-checkout with a friendly toast
 *   instead of opening another Stripe Checkout tab.
 */
export function useStartCheckout(opts?: { onSuccess?: () => void }) {
  const [isStarting, setIsStarting] = useState(false);
  const inFlightRef = useRef(false);

  const start = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;

      if (data?.alreadySubscribed) {
        const status = data.status as string | undefined;
        toast.info(
          status === "trialing"
            ? "You already have an active free trial."
            : "You already have an active Pro subscription."
        );
        return;
      }

      if (data?.url) {
        window.open(data.url, "_blank");
        opts?.onSuccess?.();
      }
    } catch (err) {
      console.error("Error creating checkout:", err);
      toast.error("Failed to start checkout");
    } finally {
      inFlightRef.current = false;
      setIsStarting(false);
    }
  };

  return { start, isStarting };
}
