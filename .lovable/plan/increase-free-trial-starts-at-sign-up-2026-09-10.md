# Increase Free Trial Starts at Sign-Up

## Problem

Right now, signing up never leads to a trial offer. The sign-up page (`Auth.tsx`) says "Create your free account" and drops new users on the homepage. To start a 7-day trial, a user must separately find a "Start 7-Day Free Trial" button and click it. Every step between sign-up and that button is lost conversions.

## What We'll Build

### 1. Post-sign-up trial offer (the big win)
- After a successful sign-up (email or Google), show a one-time welcome screen/modal: "Start your 7-day free Pro trial" with the top 3 Pro features (reimbursement calculator, price history, alerts) and two buttons: **Start Free Trial** (primary, goes straight to Stripe checkout) and a quiet "Maybe later".
- Triggered by a `?welcome=1` redirect after sign-up or a first-login flag, so existing users signing in never see it.

### 2. Trial-first sign-up page
- On the sign-up (not login) view, change the headline/copy to lead with the trial: "Start your 7-day free Pro trial" with "No charge until day 8 · Cancel anytime" subtext.
- After account creation, auto-open the Stripe trial checkout (user already confirmed card-entry-at-trial is desired) instead of dumping them on the homepage.
- Keep a visible "Skip — continue with free plan" link so it never feels forced.

### 3. Context-aware trial prompts elsewhere
- When a guest finishes their one free calculator run, the sign-up gate modal copy changes to "Create a free account to keep calculating — and unlock 7 days of Pro free" instead of a generic sign-in prompt.
- Same treatment on the `FreeAccountModal`: primary CTA becomes trial-start, free account becomes secondary.

### 4. Small trust boosters
- Add "7-day free trial · Cancel anytime" microcopy under every trial button (homepage upsell, upgrade modal, pricing).
- Remind on the checkout success return that the trial is active and when it ends.

## Technical Details

- **Files touched:** `src/pages/Auth.tsx` (trial-first signup view + post-signup checkout redirect), `src/components/FreeAccountModal.tsx` (CTA swap), `src/components/HomeProUpsell.tsx` and `src/components/UpgradeModal.tsx` (microcopy), new small `WelcomeTrialModal` component, guest-gate modal copy in `ReimbursementCalculator.tsx`.
- **No backend changes needed** — `create-checkout` already supports trials with card collection; we just route new sign-ups into it via the existing `useStartCheckout` hook.
- Trial-start is tracked via the existing Stripe flow; a "dismissed welcome offer" flag goes in `localStorage` so it shows once.

## Out of Scope

- Changing trial length or pricing.
- Auto-starting trials without the user clicking through Stripe checkout.
