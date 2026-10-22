import type { Database } from '@/integrations/supabase/types';
type Drug = Database['public']['Tables']['nadac_drugs']['Row'];
export function currentDrugs(rows: Drug[]) {
  const current = new Map<string, Drug>();
  for (const row of rows) {
    const key = `${row.ndc}|${row.pharmacy_type ?? ''}`;
    const existing = current.get(key);
    if (!existing || row.effective_date > existing.effective_date) current.set(key, row);
  }
  return [...current.values()].map(row => ({
    ndc: row.ndc, drugName: row.drug_name, nadacPerUnit: row.nadac_per_unit,
    effectiveDate: row.effective_date, pricingUnit: row.pricing_unit, pharmacyType: row.pharmacy_type,
  }));
}