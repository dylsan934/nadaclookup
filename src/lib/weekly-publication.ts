import Papa from 'papaparse';
import { z } from 'zod';

export const moverSchema = z.object({ ndc: z.string(), drugName: z.string(), oldPrice: z.number(), newPrice: z.number(), pctChange: z.number(), pricingUnit: z.string() });
export const publicationSchema = z.object({
  runId: z.string().nullable(), currentDate: z.string().nullable(), previousDate: z.string().nullable(), completedAt: z.string().nullable(), pendingDate: z.string().nullable(), totalRecords: z.number(),
  topIncreases: z.array(moverSchema), topDecreases: z.array(moverSchema), totalChanged: z.number().nullable(), added: z.number().nullable(), removed: z.number().nullable(), nonComparable: z.number().nullable(),
});
export type WeeklyPublication = z.infer<typeof publicationSchema>;
export const releaseRecordSchema = z.object({ ndc: z.string().regex(/^\d{11}$/), drug_name: z.string().min(1), nadac_per_unit: z.string().regex(/^\d+(\.\d+)?$/), effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), pricing_unit: z.string().min(1), pharmacy_type: z.string().min(1), explanation: z.string().nullable() });
export type ReleaseRecord = z.infer<typeof releaseRecordSchema>;
export function parseRelease(csv: string, sourceDate: string): ReleaseRecord[] {
  const parsed = Papa.parse<Record<string,string>>(csv, { header: true, skipEmptyLines: 'greedy', transformHeader: h => h.trim().toLowerCase().replaceAll(' ', '_') });
  if (parsed.errors.length || !parsed.data.length) throw new Error('Invalid or empty CMS CSV');
  const seen = new Set<string>();
  const isoDate = (s: string) => {
    const parts = s.split('/');
    const date = parts.length === 3 ? `${parts[2]}-${parts[0]?.padStart(2,'0')}-${parts[1]?.padStart(2,'0')}` : s;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) !== date) throw new Error('Invalid source date');
    return date;
  };
  return parsed.data.map(row => {
    if (isoDate(row['as_of_date'] ?? '') !== sourceDate) throw new Error('CSV contains a different publication date');
    const ndc = (row['ndc'] ?? '').replace(/^"+|"+$/g,'').trim().padStart(11,'0');
    if (seen.has(ndc)) throw new Error(`Duplicate NDC requires review: ${ndc}`);
    seen.add(ndc);
    const effective_date = isoDate(row['effective_date'] ?? '');
    if (effective_date > sourceDate) throw new Error('Price effective date exceeds publication date');
    return releaseRecordSchema.parse({ ndc, drug_name: row['ndc_description']?.trim(), nadac_per_unit: row['nadac_per_unit']?.trim(), effective_date,
      pricing_unit: row['pricing_unit']?.trim(), pharmacy_type: row['pharmacy_type_indicator'] === 'C/I' ? 'Community/Independent' : row['pharmacy_type_indicator'] === 'C/C' ? 'Chain' : row['pharmacy_type_indicator']?.trim(), explanation: row['explanation_code']?.trim() || null });
  });
}
export function visiblePublication(p: WeeklyPublication) {
  const current = !!p.runId && !p.pendingDate;
  const movers = current ? [...p.topIncreases,...p.topDecreases] : [];
  const biggestMover = movers.reduce<z.infer<typeof moverSchema> | undefined>((best,m) => !best || Math.abs(m.pctChange)>Math.abs(best.pctChange) ? m : best, undefined);
  return { current, date: p.currentDate, previousDate: p.previousDate, completedAt: p.completedAt, biggestMover };
}
