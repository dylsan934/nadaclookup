import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@/lib/router-compat";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { blogPosts } from "@/pages/Blog";
import { FOUNDER } from "@/lib/founder";
import { AUTHOR_PATH, SITE_URL, authorPersonJsonLd, pageHead } from "@/lib/seo";

export const Route = createFileRoute("/author/dylan-sanson")({
  head: () =>
    pageHead({
      title: "Dylan Sanson, Pharmacist — Author | NADAC Lookup",
      description:
        "Dylan Sanson is a pharmacist and pharmacy manager who built NADAC Lookup to compare NADAC prices with what PBMs actually reimburse.",
      path: AUTHOR_PATH,
      ogType: "profile",
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "ProfilePage",
        url: `${SITE_URL}${AUTHOR_PATH}`,
        mainEntity: FOUNDER
          ? authorPersonJsonLd({ name: FOUNDER.name, role: FOUNDER.role, sameAs: FOUNDER.links.map((l) => l.href) })
          : undefined,
      },
    }),
  component: AuthorPage,
});

function AuthorPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <nav className="text-xs text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link> /{" "}
          <Link to="/about" className="hover:text-foreground">About</Link> / <span className="text-foreground">Dylan Sanson</span>
        </nav>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Dylan Sanson</h1>
        <p className="text-muted-foreground mb-6">Pharmacist &amp; Pharmacy Manager · Founder of NADAC Lookup</p>
        <section className="space-y-4 mb-10">
          <h2 className="text-xl font-semibold text-foreground">Who is Dylan Sanson?</h2>
          <p className="text-muted-foreground leading-relaxed">
            Dylan is a licensed pharmacist who manages a pharmacy. Day to day he deals with the gap between what a drug costs the
            pharmacy and what a PBM pays on the claim.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            He built NADAC Lookup because he wanted an easy and efficient way to search NADAC prices and compare them to what PBMs
            were actually reimbursing. Every price on the site comes from the weekly CMS NADAC file.
          </p>
          {FOUNDER && FOUNDER.links.length > 0 && (
            <p className="flex gap-3 text-sm">
              {FOUNDER.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{l.label}</a>
              ))}
            </p>
          )}
        </section>
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-4">Articles by Dylan Sanson</h2>
          <ul className="space-y-3">
            {blogPosts.map((p) => (
              <li key={p.slug}>
                <Link to={`/blog/${p.slug}`} className="text-primary hover:underline font-medium">{p.title}</Link>
                <span className="block text-xs text-muted-foreground"><time dateTime={p.date}>{p.date}</time></span>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
