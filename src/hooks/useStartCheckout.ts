import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { proPlan } from "@/lib/pro-checkout";
import { trackConversion } from "@/lib/conversion-events";

/**
 * Shared hook for the "Start Free Trial / Upgrade" flow.
 * - Prevents double-invoke while a request is in flight (in-flight guard + state).
 * - Handles the `alreadySubscribed` response from create-checkout with a friendly toast
 *   instead of creating another subscription.
 */
export function useStartCheckout(opts?: { onSuccess?: () => void }) {
  const [isStarting, setIsStarting] = useState(false);
  const inFlightRef = useRef(false);

  // Accepts a plan, or ignores a click event when used directly as onClick.
  const start = async (plan?: "monthly" | "annual" | unknown) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsStarting(true);
    const selectedPlan = proPlan(plan);
    trackConversion("checkout_started", selectedPlan);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: selectedPlan },
      });
      if (error) throw error;

      if (data?.alreadySubscribed) {
        const status = data.status as string | undefined;
        trackConversion("checkout_existing_subscription", selectedPlan);
        toast.info(
          status === "trialing"
            ? "You already have an active free trial."
            : status === "active"
              ? "You already have an active Pro subscription."
              : "Your existing subscription needs attention. Open Manage Subscription from your account to update billing."
        );
        return;
      }

      if (typeof data?.url !== "string" || !data.url) {
        throw new Error("Checkout did not return a payment URL");
      }
      const checkoutUrl = new URL(data.url);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "checkout.stripe.com") {
        throw new Error("Checkout returned an unexpected payment URL");
      }
      trackConversion("checkout_redirected", selectedPlan);
      // Same-tab navigation works after an async request without popup permission.
      window.location.assign(checkoutUrl.href);
      opts?.onSuccess?.();
    } catch (err) {
      trackConversion("checkout_failed", selectedPlan);
      console.error("Error creating checkout:", err);
      toast.error("Checkout couldn't open. Please try again. If it keeps failing, contact info@nadaclookup.com.");
    } finally {
      inFlightRef.current = false;
      setIsStarting(false);
    }
  };

  return { start, isStarting };
}
