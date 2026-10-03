import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () =>
    pageHead({
      title: "Privacy Policy — NADAC Lookup",
      description: "What NADAC Lookup stores about you, why, who processes it, and how to delete it.",
      path: "/privacy",
    }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="October 3, 2026">
      <p>NADAC Lookup is a drug-pricing reference tool. You can search NADAC prices without an account. This page explains what we store when you do create one.</p>
      <h2>What we store</h2>
      <ul>
        <li>Your email address and sign-in details, so you can log in.</li>
        <li>Drugs on your watchlist, notes and categories you add.</li>
        <li>Contract rules and reimbursement calculations you save, plus a monthly count of calculations used.</li>
        <li>Your alert and email preferences, and in-app notifications.</li>
      </ul>
      <p>We do not collect patient information. Please don't enter any into notes or rule names.</p>
      <h2>Payments</h2>
      <p>Pro subscriptions are processed by Stripe. Your card number goes to Stripe and is never stored on our servers. We keep your subscription status so we know which features to unlock.</p>
      <h2>Email</h2>
      <p>We send account emails (sign-in, password reset) and, if you turn them on, price-change alerts and the weekly movers digest. Every alert email has an unsubscribe link.</p>
      <h2>Who can see your data</h2>
      <p>Your watchlist, rules and calculations are private to your account. We don't sell your data or share it with advertisers.</p>
      <h2>Deleting your data</h2>
      <p>Email <a className="text-primary hover:underline" href="mailto:info@nadaclookup.com">info@nadaclookup.com</a> from your account address and we'll delete your account and everything tied to it.</p>
    </LegalPage>
  );
}
