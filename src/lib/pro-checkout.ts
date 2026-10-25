export type ProPlan = "monthly" | "annual";

export function proPlan(value: unknown): ProPlan {
  return value === "annual" ? "annual" : "monthly";
}

/** Keep the selected offer through password, email-confirmation and OAuth flows. */
export function proAuthPath(plan: ProPlan = "monthly", mode = "signup") {
  const redirect = `/pricing?plan=${plan}&checkout=1`;
  return `/auth?${new URLSearchParams({ mode, redirect })}`;
}
