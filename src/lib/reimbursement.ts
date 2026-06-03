export type CostBasis = "nadac" | "nadac_adjusted" | "manual";
export type AdjustmentType = "plus_pct" | "minus_pct" | "none";

export interface ReimbursementRule {
  id: string;
  name: string;
  cost_basis: CostBasis;
  adjustment_type: AdjustmentType;
  percentage_value: number;
  multiplier: number;
  dispensing_fee: number;
  flat_adjustment: number;
  minimum_reimbursement: number | null;
  maximum_reimbursement: number | null;
  notes: string | null;
  is_default: boolean;
}

export interface CalcInput {
  unitPrice: number;
  quantity: number;
  manualIngredientCost?: number | null;
  actualReimbursement?: number | null;
  rule: Pick<
    ReimbursementRule,
    | "cost_basis"
    | "adjustment_type"
    | "multiplier"
    | "dispensing_fee"
    | "flat_adjustment"
    | "minimum_reimbursement"
    | "maximum_reimbursement"
  >;
}

export interface CalcResult {
  ingredientCost: number;
  baseAfterMultiplier: number;
  rawReimbursement: number;
  estimatedReimbursement: number;
  appliedFloor: boolean;
  appliedCap: boolean;
  difference: number | null;
  grossMargin: number | null;
  marginPercentage: number | null;
}

export function multiplierFromPercent(adjustment: AdjustmentType, pct: number): number {
  if (adjustment === "none") return 1;
  if (adjustment === "plus_pct") return 1 + pct / 100;
  return 1 - pct / 100;
}

export function calculate(input: CalcInput): CalcResult {
  const { unitPrice, quantity, manualIngredientCost, actualReimbursement, rule } = input;

  const ingredientCost =
    rule.cost_basis === "manual" && manualIngredientCost != null
      ? manualIngredientCost
      : unitPrice * quantity;

  const multiplier = rule.adjustment_type === "none" ? 1 : rule.multiplier;
  const baseAfterMultiplier = ingredientCost * multiplier;
  const rawReimbursement = baseAfterMultiplier + (rule.dispensing_fee || 0) + (rule.flat_adjustment || 0);

  let estimated = rawReimbursement;
  let appliedFloor = false;
  let appliedCap = false;
  if (rule.minimum_reimbursement != null && estimated < rule.minimum_reimbursement) {
    estimated = rule.minimum_reimbursement;
    appliedFloor = true;
  }
  if (rule.maximum_reimbursement != null && estimated > rule.maximum_reimbursement) {
    estimated = rule.maximum_reimbursement;
    appliedCap = true;
  }

  let difference: number | null = null;
  let grossMargin: number | null = null;
  let marginPercentage: number | null = null;
  if (actualReimbursement != null && !Number.isNaN(actualReimbursement)) {
    difference = actualReimbursement - estimated;
    grossMargin = actualReimbursement - ingredientCost;
    marginPercentage = actualReimbursement !== 0 ? (grossMargin / actualReimbursement) * 100 : null;
  }

  return {
    ingredientCost,
    baseAfterMultiplier,
    rawReimbursement,
    estimatedReimbursement: estimated,
    appliedFloor,
    appliedCap,
    difference,
    grossMargin,
    marginPercentage,
  };
}

export function formatFormula(rule: Pick<ReimbursementRule, "cost_basis" | "adjustment_type" | "percentage_value" | "dispensing_fee" | "flat_adjustment">): string {
  const parts: string[] = [];
  const base = rule.cost_basis === "manual" ? "Manual cost" : "NADAC";
  if (rule.adjustment_type === "plus_pct" && rule.percentage_value) parts.push(`${base} + ${rule.percentage_value}%`);
  else if (rule.adjustment_type === "minus_pct" && rule.percentage_value) parts.push(`${base} - ${rule.percentage_value}%`);
  else parts.push(base);
  if (rule.dispensing_fee) parts.push(`+ $${rule.dispensing_fee.toFixed(2)} fee`);
  if (rule.flat_adjustment) parts.push(`+ $${rule.flat_adjustment.toFixed(2)}`);
  return parts.join(" ");
}

export const formatCurrency = (n: number, decimals = 2) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;

export const formatUnitPrice = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;

export const RULE_TEMPLATES: Array<Omit<ReimbursementRule, "id" | "is_default">> = [
  { name: "NADAC + dispensing fee only", cost_basis: "nadac", adjustment_type: "none", percentage_value: 0, multiplier: 1, dispensing_fee: 10.65, flat_adjustment: 0, minimum_reimbursement: null, maximum_reimbursement: null, notes: "Example template" },
  { name: "NADAC + 10% + $10.65 fee", cost_basis: "nadac", adjustment_type: "plus_pct", percentage_value: 10, multiplier: 1.1, dispensing_fee: 10.65, flat_adjustment: 0, minimum_reimbursement: null, maximum_reimbursement: null, notes: "Example template" },
  { name: "NADAC - 2% + $8.00 fee", cost_basis: "nadac", adjustment_type: "minus_pct", percentage_value: 2, multiplier: 0.98, dispensing_fee: 8.0, flat_adjustment: 0, minimum_reimbursement: null, maximum_reimbursement: null, notes: "Example template" },
  { name: "Manual cost + 10% + $10.65 fee", cost_basis: "manual", adjustment_type: "plus_pct", percentage_value: 10, multiplier: 1.1, dispensing_fee: 10.65, flat_adjustment: 0, minimum_reimbursement: null, maximum_reimbursement: null, notes: "Example template" },
];
