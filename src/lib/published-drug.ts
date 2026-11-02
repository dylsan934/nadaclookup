import { z } from 'zod';
export const publishedDrugSchema = z.object({
 id:z.string(), ndc:z.string().regex(/^\d{11}$/), drug_name:z.string(), nadac_per_unit:z.number(), effective_date:z.string(),
 pricing_unit:z.string(), pharmacy_type:z.string(), explanation:z.string().nullable(), created_at:z.string(), updated_at:z.string(),
 run_id:z.string(), publication_date:z.string(),
});
export type PublishedDrug = z.infer<typeof publishedDrugSchema>;