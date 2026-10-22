import { describe, it, expect } from 'vitest';
import { oauthReturnPath } from '@/lib/oauth-return-path';
import { currentDrugs } from '@/lib/mcp/current-drugs';
import type { Database } from '@/integrations/supabase/types';
type Drug = Database['public']['Tables']['nadac_drugs']['Row'];
const row = (date: string, price: number, pharmacy = 'C'): Drug => ({ id: date + pharmacy, ndc: '00093721201', drug_name: 'METFORMIN', effective_date: date, nadac_per_unit: price, pharmacy_type: pharmacy, pricing_unit: 'EA', created_at: date, updated_at: date, explanation: null });
describe('MCP boundaries', () => {
  it('preserves the full consent return URL', () => expect(oauthReturnPath('/.lovable/oauth/consent?authorization_id=abc#review')).toBe('/.lovable/oauth/consent?authorization_id=abc#review'));
  it('rejects external redirects and control characters', () => {
    for (const path of ['//outside.invalid', '/\\outside.invalid', '/\u0000bad', 'https://outside.invalid']) expect(oauthReturnPath(path)).toBe('/');
  });
  it('returns latest per NDC/category without altering NADAC or leading zeros', () => {
    expect(currentDrugs([row('2026-10-07', 0.22), row('2026-10-14', 0.24), row('2026-10-07', 0.29, 'M')])).toEqual([
      { ndc: '00093721201', drugName: 'METFORMIN', effectiveDate: '2026-10-14', nadacPerUnit: 0.24, pharmacyType: 'C', pricingUnit: 'EA' },
      { ndc: '00093721201', drugName: 'METFORMIN', effectiveDate: '2026-10-07', nadacPerUnit: 0.29, pharmacyType: 'M', pricingUnit: 'EA' },
    ]);
  });
});