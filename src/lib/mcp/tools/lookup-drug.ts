import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { z } from 'zod';
import { supabaseForUser } from '../supabase';
import { currentDrugs } from '../current-drugs';
import { publishedDrugSchema } from '../../published-drug';

export default defineTool({
  name: 'lookup_drug', title: 'Look up exact NDC pricing',
  description: 'Read the latest stored NADAC price for an exact 11-digit package NDC, preserving leading zeros and pharmacy categories.',
  inputSchema: { ndc: z.string().regex(/^\d{11}$/).describe('Exact 11-digit NDC including leading zeros; no dashes.') },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ ndc }, ctx) => {
    const db = supabaseForUser(ctx);
    const { data, error } = await db.from('nadac_published_drugs').select('*').eq('ndc', ndc).order('effective_date', { ascending: false }).limit(100);
    if (error) throw new ToolError('Unable to read drug pricing.');
    const rows = z.array(publishedDrugSchema).parse(data ?? []);
    const drugs = currentDrugs(rows);
    return { content: [{ type: 'text', text: drugs.length ? JSON.stringify(drugs) : 'No pricing found for this exact NDC.' }], structuredContent: { drugs, runId:rows[0]?.run_id ?? null, publicationDate:rows[0]?.publication_date ?? null } };
  },
});