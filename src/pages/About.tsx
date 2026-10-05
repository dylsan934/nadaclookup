import { Link } from "@/lib/router-compat";
import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FOUNDER } from "@/lib/founder";

const About = () => (
  <>
    <div className="min-h-screen flex flex-col bg-background">
      <SiteNavigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">About NADAC Lookup</h1>
        <div className="prose prose-lg max-w-none space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            NADAC Lookup was built with one goal: make it easy for independent pharmacy owners and pharmacists to access the drug pricing data that directly affects their business.
          </p>
          <h2 className="text-2xl font-semibold text-foreground">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            The National Average Drug Acquisition Cost data is public, but navigating raw CMS files is time-consuming and difficult. We built NADAC Lookup to provide a fast, searchable interface to the latest NADAC prices — updated weekly every Wednesday when CMS publishes new data.
          </p>
          {FOUNDER && (
            <div className="not-prose flex flex-col sm:flex-row gap-5 items-start rounded-xl border border-border bg-card p-5">
              {FOUNDER.photoUrl && <img src={FOUNDER.photoUrl} alt={`${FOUNDER.name}, ${FOUNDER.role}`} className="h-20 w-20 rounded-full object-cover" />}
              <div>
                <p className="font-semibold text-foreground"><Link to="/author/dylan-sanson" className="hover:underline">{FOUNDER.name}</Link></p>
                <p className="text-sm text-muted-foreground mb-2">{FOUNDER.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{FOUNDER.bio}</p>
                <p className="mt-2 flex gap-3 text-sm">{FOUNDER.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{l.label}</a>)}</p>
              </div>
            </div>
          )}
          <h2 className="text-2xl font-semibold text-foreground">Who We Serve</h2>
          <ul className="list-disc list-inside text-muted-foreground space-y-2">
            <li><strong className="text-foreground">Independent retail pharmacists</strong> who need quick access to current acquisition costs</li>
            <li><strong className="text-foreground">Pharmacy owners</strong> optimizing purchasing and managing margins</li>
            <li><strong className="text-foreground">Healthcare consultants</strong> analyzing drug pricing for clients</li>
            <li><strong className="text-foreground">Pharmacy students and educators</strong> learning about drug pricing benchmarks</li>
          </ul>
          <h2 className="text-2xl font-semibold text-foreground">Data Source</h2>
          <p className="text-muted-foreground leading-relaxed">
            All pricing data comes directly from the <a href="https://www.medicaid.gov/medicaid/nadac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Centers for Medicare & Medicaid Services (CMS) NADAC files</a>. We do not modify or adjust any pricing figures.
          </p>
        </div>
        <div className="mt-12 text-center py-10 bg-card border border-border rounded-xl">
          <h3 className="text-xl font-semibold text-foreground mb-2">Questions?</h3>
          <p className="text-sm text-muted-foreground mb-4">Reach us at <a href="mailto:info@nadaclookup.com" className="text-primary hover:underline">info@nadaclookup.com</a></p>
          <Button asChild><Link to="/">Search NADAC Prices <ArrowRight className="h-4 w-4 ml-1" /></Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  </>
);

export default About;
