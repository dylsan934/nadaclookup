/**
 * Shared parsing/serialization for the drug → calculator handoff.
 *
 * Query strings are always built with URLSearchParams and never JSON-encoded,
 * so an NDC stays a plain string with its leading zeros intact.
 */

/** Strip at most one pair of surrounding double quotes (legacy links / CMS rows). */
export const stripWrappingQuotes = (raw: string): string => {
  const v = raw.trim();
  const m = /^"([^"]*)"$/.exec(v);
  return m ? (m[1] ?? "").trim() : v;
};

/**
 * Validate an NDC from a URL. Digits and dashes only, at least 5 characters.
 * Returns null for malformed input rather than guessing at a drug.
 */
export const parseNdcParam = (raw: string | null | undefined): string | null => {
  if (!raw) return null;
  const v = stripWrappingQuotes(raw);
  if (!/^\d[\d-]{4,}$/.test(v)) return null;
  return v;
};

/** Validate a quantity from a URL: a finite number greater than zero (decimals allowed). */
export const parseQtyParam = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined) return null;
  const v = stripWrappingQuotes(String(raw));
  if (!/^\d*\.?\d+$/.test(v)) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

/** Build the calculator deep link. Quantity is only included when it is valid. */
export const buildCalculatorHref = (opts: {
  ndc?: string | null;
  drugName?: string | null;
  quantity?: number | string | null;
}): string => {
  const params = new URLSearchParams();
  const ndc = opts.ndc ? stripWrappingQuotes(opts.ndc) : "";
  if (ndc) params.set("ndc", ndc);
  const drug = opts.drugName ? stripWrappingQuotes(opts.drugName) : "";
  if (drug) params.set("drug", drug);
  const qty = parseQtyParam(opts.quantity == null ? null : String(opts.quantity));
  if (qty !== null) params.set("qty", String(qty));
  const qs = params.toString();
  return qs ? `/reimbursement-calculator?${qs}` : "/reimbursement-calculator";
};
