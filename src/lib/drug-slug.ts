/**
 * Convert a drug name to a URL-safe slug for SEO drug pages.
 * Example: "AMOXICILLIN 500 MG CAPSULE" -> "amoxicillin-500-mg-capsule-nadac-price"
 */
export const drugNameToSlug = (name: string): string => {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base}-nadac-price`;
};

/**
 * Convert a slug back into a search-friendly drug name (best-effort).
 * The page uses this to query nadac_drugs by ilike match.
 */
export const slugToSearchTerm = (slug: string): string => {
  // Replace dashes with wildcard % so ilike matches drug names that had
  // special characters (e.g. "/" or ".") which were stripped during slug creation.
  return slug
    .replace(/-nadac-price$/, "")
    .replace(/-/g, "%")
    .trim();
};

/**
 * Extract the first significant token of a drug name for related-drug lookup.
 * E.g. "AMOXICILLIN 500 MG CAPSULE" -> "amoxicillin"
 */
export const drugNameRoot = (name: string): string => {
  const cleaned = name.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();
  const first = cleaned.split(/\s+/)[0] || "";
  return first;
};
