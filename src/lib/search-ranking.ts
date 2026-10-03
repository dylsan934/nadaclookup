/**
 * Pure search relevance + grouping helpers for NADAC drug-name results.
 * Never alters prices; only orders and groups rows.
 */
export interface RankableDrug {
  ndc: string;
  drugName: string;
  nadacPerUnit: number;
  effectiveDate: string;
  pricingUnit: string;
  pharmacyType: string;
}

export const normalizeName = (s: string) =>
  s.toUpperCase().replace(/^"+|"+$/g, "").replace(/\s+/g, " ").trim();

export const digitsOnly = (s: string) => s.replace(/[-\s]/g, "");

/** True when the query is an exact 11-digit NDC (dashes allowed). */
export const isExactNdcQuery = (q: string) => /^\d{11}$/.test(digitsOnly(q.trim()));

export const isNdcQuery = (q: string) => /^[\d-]+$/.test(q.trim());

/** Base ingredient portion of a name: everything before the first digit. */
export const baseName = (name: string) => normalizeName(name).split(/\d/)[0]!.trim();

/** Combination product, e.g. "GLIPIZIDE-METFORMIN" or "AMLODIPINE/BENAZEPRIL". */
export const isCombination = (name: string) => /[A-Z]{2,}\s*[-/]\s*[A-Z]{2,}/.test(baseName(name));

export const extractStrength = (drugName: string): string => {
  const m = drugName.match(/(\d+(?:\.\d+)?(?:\s*[-/]\s*\d+(?:\.\d+)?)*)\s*(MG|MCG|ML|G|%|UNIT|IU)/i);
  return m ? `${m[1]!.replace(/\s+/g, "")} ${m[2]!.toUpperCase()}` : "";
};

export type DosageForm = "tablet" | "capsule" | "solution" | "injection" | "cream" | "other";
export const detectDosageForm = (drugName: string): DosageForm => {
  const n = drugName.toUpperCase();
  if (n.includes("TABLET") || /\bTAB\b/.test(n)) return "tablet";
  if (n.includes("CAPSULE") || /\bCAP\b/.test(n)) return "capsule";
  if (/SOLUTION|SOLN|SYRUP|SUSPENSION|ORAL LIQUID/.test(n)) return "solution";
  if (/INJECTION|\bINJ\b|VIAL|SYRINGE/.test(n)) return "injection";
  if (/CREAM|OINTMENT|\bGEL\b|TOPICAL/.test(n)) return "cream";
  return "other";
};

/** 0 exact, 1 starts-with, 2 standalone contains, 3 combination, 4 no match. */
export const relevanceTier = (drugName: string, query: string): number => {
  const q = normalizeName(query);
  const name = normalizeName(drugName);
  if (!q) return 4;
  if (isCombination(drugName)) return name.includes(q) ? 3 : 4;
  if (name === q || baseName(drugName) === q) return 0;
  if (name.startsWith(q)) return 1;
  if (name.includes(q)) return 2;
  return 4;
};

/** Stable relevance ordering. NDC queries put the exact package first. */
export function rankDrugs<T extends RankableDrug>(drugs: T[], query: string): T[] {
  const q = query.trim();
  if (isNdcQuery(q)) {
    const target = digitsOnly(q);
    const score = (d: T) => (digitsOnly(d.ndc) === target ? 0 : 1);
    return drugs.map((d, i) => ({ d, i })).sort((a, b) => score(a.d) - score(b.d) || a.i - b.i).map((x) => x.d);
  }
  return drugs
    .map((d, i) => ({ d, i, t: relevanceTier(d.drugName, q) }))
    .sort((a, b) => a.t - b.t || normalizeName(a.d.drugName).localeCompare(normalizeName(b.d.drugName)) || a.i - b.i)
    .map((x) => x.d);
}

export interface DrugGroup<T extends RankableDrug> {
  key: string;
  representative: T;
  ndcs: string[];
}

export const groupKey = (d: RankableDrug) =>
  [normalizeName(d.drugName), extractStrength(d.drugName), detectDosageForm(d.drugName), d.nadacPerUnit,
    (d.pricingUnit ?? "").toUpperCase(), d.effectiveDate, d.pharmacyType ?? ""].join("|");

/** Groups package NDCs that are identical in every other priced attribute. Order preserved. */
export function groupDrugs<T extends RankableDrug>(drugs: T[]): DrugGroup<T>[] {
  const map = new Map<string, DrugGroup<T>>();
  for (const d of drugs) {
    const k = groupKey(d);
    const g = map.get(k);
    if (g) { if (!g.ndcs.includes(d.ndc)) g.ndcs.push(d.ndc); }
    else map.set(k, { key: k, representative: d, ndcs: [d.ndc] });
  }
  return [...map.values()];
}

/** No grouping for exact NDC queries — each package is its own card. */
export function toResultGroups<T extends RankableDrug>(drugs: T[], query: string): DrugGroup<T>[] {
  const ranked = rankDrugs(drugs, query);
  if (isNdcQuery(query)) return ranked.map((d) => ({ key: `${d.ndc}|${d.pharmacyType}`, representative: d, ndcs: [d.ndc] }));
  return groupDrugs(ranked);
}
