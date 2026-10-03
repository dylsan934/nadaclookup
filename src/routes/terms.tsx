import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () =>
    pageHead({
      title: "Terms of Service — NADAC Lookup",
      description: "The terms for using NADAC Lookup, including the Pro trial, billing, cancellation and data accuracy.",
      path: "/terms",
    }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage title="Terms of Service" updated="October 3, 2026">
      <h2>What the service is</h2>
      <p>NADAC Lookup shows National Average Drug Acquisition Cost data published by CMS, plus tools to estimate reimbursement. Prices come straight from the CMS NADAC files and are not modified.</p>
      <h2>Informational use only</h2>
      <p>Estimates are not billing, legal or clinical advice. Check your actual contracts and invoices before making purchasing or claim decisions. CMS data can change or be corrected after publication.</p>
      <h2>Pro trial and billing</h2>
      <ul>
        <li>The Pro trial lasts 7 days and requires a card.</li>
        <li>You are not charged during the trial. If you don't cancel before it ends, Pro renews at $29/month until you cancel.</li>
        <li>You can cancel anytime from your account's plan settings; Pro stays active until the end of the paid period.</li>
        <li>Payments are processed by Stripe.</li>
      </ul>
      <h2>Your account</h2>
      <p>Keep your sign-in details private. Don't scrape the site in bulk, resell the data as your own service, or try to get around plan limits.</p>
      <h2>Contact</h2>
      <p>Questions: <a className="text-primary hover:underline" href="mailto:info@nadaclookup.com">info@nadaclookup.com</a></p>
    </LegalPage>
  );
}
