/**
 * Centralized SEO head builder for all public routes.
 *
 * Every route file passes its page identity through pageHead() so the initial
 * server-rendered HTML carries the correct title, meta description,
 * self-referencing canonical, robots directive, Open Graph / Twitter tags and
 * page-level JSON-LD — no client-side JavaScript required.
 */

export const SITE_URL = "https://nadaclookup.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export interface PageHeadOptions {
  /** Full document title (keep under ~60 chars). */
  title: string;
  /** Meta description (keep under ~160 chars). */
  description: string;
  /** Path beginning with "/" — canonical and og:url become SITE_URL + path. */
  path: string;
  /** Robots directive; defaults to "index, follow". */
  robots?: string;
  /** og:type; defaults to "website". */
  ogType?: string;
  /** One or more JSON-LD objects rendered as application/ld+json scripts. */
  jsonLd?: object | object[];
}

export function pageHead(opts: PageHeadOptions) {
  const canonical = `${SITE_URL}${opts.path}`;
  const robots = opts.robots ?? "index, follow";
  const jsonLdList = opts.jsonLd ? (Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]) : [];

  return {
    meta: [
      { title: opts.title },
      { name: "description", content: opts.description },
      { name: "robots", content: robots },
      { property: "og:title", content: opts.title },
      { property: "og:description", content: opts.description },
      { property: "og:type", content: opts.ogType ?? "website" },
      { property: "og:url", content: canonical },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: opts.title },
      { name: "twitter:description", content: opts.description },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: canonical }],
    scripts: jsonLdList.map((obj) => ({
      type: "application/ld+json",
      children: JSON.stringify(obj),
    })),
  };
}
