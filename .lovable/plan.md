# Send accurate saved-drug alerts

## What the checks found
- The verified latest CMS comparison is **October 14 vs October 7: zero price changes**. There should be no price-change email for that release.
- Historical repair preparations are permanently preview-only and must never be sent.
- The old weekly email sender selects the last week with changes, so it can incorrectly email an older report as current. Its Wednesday email schedule is still active; nothing has been paused or sent during this check.
- The old saved-drug email sender does not enforce finalized weekly data, all alert preferences, Pro eligibility, suppression or reliable duplicate prevention.
- The previous statement that all notification work was repaired was too broad: publication was repaired, but actual email send paths still need this work.

## Scope
Enable only individual saved-drug price-change alerts triggered by a verified change to a drug that recipient saved. Free users keep in-app alerts; eligible Pro users can receive email alerts.

List-wide Weekly Movers digests are not supported by Lovable app emails. They require a dedicated email service; this plan will not enable them or send historical previews.

## Accuracy and delivery safeguards
1. Stop the unsafe legacy digest schedule as part of the approved safety work, preserving its configuration for reference. Do not activate another list-wide sender.
2. Use the current completed weekly publication and its exact immediately preceding CMS release for each saved-drug change. Block emails when any required stage fails, newer data is processing, a release is historical, or the comparison is incomplete.
3. Validate exact NDC, pricing unit and pharmacy type; skip missing, non-comparable and unchanged prices. Respect the saved drug's alert setting and configured threshold. Display the two release dates and unit prices, not inferred reimbursement or acquisition-cost claims.
4. Recheck recipient eligibility, preferences and suppression before queueing. Obtain addresses privately from account records; do not expose them in public data or logs.
5. Record one durable notification identity per release and saved-drug event. Queue through the shared sender with that same identity so retries cannot create duplicate notices. Keep in-app alert creation independent of successful email delivery.
6. Keep all existing historical preparations unsendable. Never resend October 7 changes as October 14 news, and do not send catch-up email on activation.

## Verification
- Add automated tests for zero changes, stale/pending/failed releases, historical runs, non-comparable records, preferences, free/Pro eligibility, configured thresholds and retry deduplication.
- Verify the supported alert flow using private previews and queue/read-back evidence before releasing a real message.
- Report exactly what was verified and any remaining delivery blocker. No real email is sent until all accuracy checks pass.

## Approval boundary
Approving this plan authorizes the email safeguards and pausing the unsafe legacy digest schedule. It does **not** authorize publishing, changes to searchable prices, Stripe or plan limits, or activation of a replacement weekly scheduler. Publishing and scheduler cutover still need separate permission; the shared backend makes schedule changes immediately effective.

## Technical details
- Implement new app-internal operations with authenticated TanStack server functions; external callbacks use secret-verified public server routes, never a browser-visible key as authorization.
- Use the finalized publication pointer and immutable release snapshots as notification sources, not latest effective-date rows or last-notified price as a weekly baseline.
- Use Lovable's built-in app-email infrastructure and React Email templates with the required suppression and unsubscribe behavior. Do not replace existing email files blindly.
- Add additive, access-controlled event records and an atomic idempotent queue handoff; keep privileged clients behind verified authorization and secrets server-only.