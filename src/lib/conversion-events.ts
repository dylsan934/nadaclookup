import { analytics } from "@heycatch/sdk";

/** Existing analytics only; no drug, search, email or payment details. */
export function trackConversion(event: string, plan: "monthly" | "annual") {
  try {
    analytics.trackEvent(event, { plan });
  } catch {
    // Analytics must never prevent a customer reaching checkout.
  }
}
