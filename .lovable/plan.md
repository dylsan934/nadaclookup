## Goal

When the weekly movers digest runs, send a single copy to every user with the `admin` role — in addition to the existing Pro recipients. Pro-only behavior for regular users stays unchanged.

## Changes

**`supabase/functions/send-movers-digest/index.ts`**

After building the Pro `recipients` list and before the send loop:

1. Query `public.user_roles` for all rows with `role = 'admin'` to get admin `user_id`s.
2. Resolve each admin's email from the already-paged `userEmails` map (re-uses the existing `auth.admin.listUsers` paging — no extra calls).
3. For each admin email not already in `recipients`, push a single entry with a distinct idempotency key prefix (`movers-digest-admin-<date>-<userId>`) so admins always receive the digest even if they're not Pro and even if they previously opted out via `notify_weekly_movers`.
4. Existing send loop handles delivery; admins get exactly one email per digest run.

No DB migration, no template change, no UI change. The digest is already triggered weekly by the existing cron, so admins start receiving it on the next run. Manual test: invoke `send-movers-digest` with the service role and confirm admins appear in the recipients count and in `email_send_log`.

## Out of scope

- Sending the digest to free users (explicitly declined).
- A separate "admin summary" template — admins get the same email Pros get.
- BCC mechanics (we send a separate email per admin so each lands in their own inbox with a working unsubscribe footer scoped to them).
