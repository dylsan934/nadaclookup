import { z } from 'zod';

export const savedAlertSchema = z.object({
 reason:z.string().nullable(), runId:z.string().uuid().nullable(), savedDrugId:z.string().uuid(), userId:z.string().uuid(),
 ndc:z.string().regex(/^\d{11}$/), drugName:z.string().nullable(), pricingUnit:z.string().nullable(), pharmacyType:z.string().nullable(),
 previousDate:z.string().nullable(),currentDate:z.string().nullable(),oldPrice:z.string().nullable(),newPrice:z.string().nullable(),changePercent:z.string().nullable(),emailPreference:z.boolean().nullable(),
});
export type SavedAlert = z.infer<typeof savedAlertSchema>;
export function emailAlertAllowed(v:SavedAlert,pro:boolean,suppressed:boolean) {
 return v.reason===null && v.emailPreference===true && pro && !suppressed;
}