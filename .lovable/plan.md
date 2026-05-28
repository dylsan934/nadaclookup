## Goal

Send this week's movers digest to dylsan934@gmail.com as a one-off.

## Approach

Invoke `send-transactional-email` directly via the curl_edge_functions tool with the service-role authorization, using the latest `weekly_movers` row's data:

1. Read latest `weekly_movers` row (highest `effective_date` where `total_changed > 0`).
2. Call `send-transactional-email` with:
   - `templateName: 'weekly-movers-digest'`
   - `recipientEmail: 'dylsan934@gmail.com'`
   - `idempotencyKey: 'movers-digest-manual-<effective_date>-<timestamp>'` (unique so it isn't deduped against any prior send)
   - `templateData: { weekLabel, previousLabel, totalChanged, topIncreases, topDecreases }`

No code changes, no deploys. Confirm send by checking `email_send_log` for the new row.
