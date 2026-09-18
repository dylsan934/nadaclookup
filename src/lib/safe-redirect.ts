/**
 * Restrict post-authentication return destinations to internal app routes.
 * Rejects absolute URLs, protocol-relative URLs, and control characters.
 */
export function sanitizeInternalPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (/[\r\n\t\\]/.test(value)) return null;
  if (/^\/+\w+:/.test(value)) return null;
  return value;
}
