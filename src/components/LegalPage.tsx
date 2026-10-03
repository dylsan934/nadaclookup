import { SiteNavigation } from "@/components/SiteNavigation";
import { Footer } from "@/components/Footer";

export const LegalPage = ({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <SiteNavigation />
    <main className="flex-1 container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated {updated}</p>
      <div className="space-y-6 text-muted-foreground leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">
        {children}
      </div>
    </main>
    <Footer />
  </div>
);
