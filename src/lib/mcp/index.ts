import { auth, defineMcp } from '@lovable.dev/mcp-js';
import lookupDrug from './tools/lookup-drug';
import listWatchlist from './tools/list-watchlist';
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? 'project-ref-unset';
export default defineMcp({
  name: 'nadac-price-finder', title: 'NADAC Price Finder', version: '0.1.0',
  instructions: 'Read exact-NDC NADAC benchmarks and the connected user’s watchlist. Prices are stored CMS benchmarks, not actual PBM reimbursement. Always report effective date, unit and pharmacy type. Never infer missing prices or email delivery status. Tools cannot send emails, calculate reimbursement, or change saved drugs.',
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: 'authenticated', requireOAuthClientClaim: true }),
  tools: [lookupDrug, listWatchlist],
});