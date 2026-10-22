import { defineTool, ToolError } from '@lovable.dev/mcp-js';
import { supabaseForUser } from '../supabase';
export default defineTool({
  name: 'list_watchlist', title: 'Read your watchlist',
  description: 'List up to 100 drugs saved by the connected account, with NDC and in-app alert setting; this does not send emails or change saves.',
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_, ctx) => {
    const db = supabaseForUser(ctx);
    const owner = ctx.getUserId();
    if (!owner) throw new ToolError('Sign in to read your watchlist.');
    const { data, error } = await db.from('saved_drugs').select('id,ndc,drug_name,alerts_enabled').eq('user_id', owner).order('created_at', { ascending: false }).limit(100);
    if (error) throw new ToolError('Unable to read your watchlist.');
    const drugs = (data ?? []).map(d => ({ id: d.id, ndc: d.ndc, drugName: d.drug_name, alertsEnabled: d.alerts_enabled }));
    return { content: [{ type: 'text', text: drugs.length ? JSON.stringify(drugs) : 'Your watchlist is empty.' }], structuredContent: { drugs } };
  },
});