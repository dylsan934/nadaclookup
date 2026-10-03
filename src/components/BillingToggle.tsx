export type BillingPlan = "monthly" | "annual";

export const BillingToggle = ({ value, onChange }: { value: BillingPlan; onChange: (p: BillingPlan) => void }) => (
  <div role="radiogroup" aria-label="Billing period" className="inline-flex rounded-full border border-border bg-muted p-1 text-sm">
    {(["monthly", "annual"] as const).map((p) => (
      <button
        key={p}
        type="button"
        role="radio"
        aria-checked={value === p}
        onClick={() => onChange(p)}
        className={`px-4 py-1.5 rounded-full transition-colors ${value === p ? "bg-background text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}
      >
        {p === "monthly" ? "Monthly" : "Annual · 2 months free"}
      </button>
    ))}
  </div>
);
