# How-to video: "Search an NDC / drug lookup"

A 20-second, 1920x1080 animated walkthrough with on-brand UI mockups, kinetic captions, and an ElevenLabs voiceover. Rendered to MP4 via Remotion in the sandbox, then embedded on the site.

## Creative direction

- **Style:** Stylized UI mockup walkthrough — recreated NADAC search bar, results card, and drug detail page (not live screenshots). Brand blue + white, white pill-capsule logo motif.
- **Tone:** Confident, clinical, helpful (matches site voice). Editorial pacing, snappy callout springs.
- **Type:** Inter (body) + a single display weight for callouts. No serif.
- **Motion:** Soft spring entrances, blur-to-sharp text reveals, animated cursor that taps/types, callout chips that highlight each step.

## Scene plan (20s / 600 frames @ 30fps)

```text
Scene 1  0.0s - 3.5s   Hook: "Look up any drug's NADAC price in seconds"
Scene 2  3.5s - 8.0s   Type "Lipitor" in search bar, results dropdown appears
Scene 3  8.0s -13.0s   Click result -> drug detail page with current NADAC price
Scene 4 13.0s -17.0s   Highlight price history chart + NDC variants
Scene 5 17.0s -20.0s   Outro: logo + URL nadaclookup.com
```

## Voiceover script (~45 words, ~20s)

> "Need a drug's NADAC price? Head to NADAC Lookup. Type any drug name or NDC — Lipitor, for example. Pick your result. Instantly see the current NADAC price, five years of pricing history, and every NDC variant. NADAC Lookup — pricing clarity, one search away."

- Voice: George (`JBFqnCBsd6RMkjVDRZzb`) — warm, confident, professional.
- Captions burned in (silent autoplay friendly).

## Embed plan

- Save final MP4 to `public/videos/how-to-search.mp4` plus a poster frame `public/videos/how-to-search-poster.jpg`.
- Add a new `HowToVideo` component (`<video>` with `controls`, `playsInline`, `preload="metadata"`, poster).
- Embed location: **Homepage**, in a new "How it works" section directly below the NADAC search bar. Also reusable on `/features`.

## Technical steps

1. Confirm/link the ElevenLabs standard connector (for the voiceover generation step only).
2. Scaffold a `remotion/` project (Bun + Remotion + transitions + google-fonts), with the NixOS compositor fix and ffmpeg symlinks.
3. Build 5 scene components under `remotion/src/scenes/` with frame-based motion only.
4. Generate the voiceover MP3 via a one-off script using the ElevenLabs API, save to `remotion/public/audio/vo.mp3`, and mount with `<Audio>`.
5. Render with the programmatic render script (`scripts/render-remotion.mjs`, `chromeMode: "chrome-for-testing"`, `concurrency: 1`).
6. Copy the resulting MP4 into the app at `public/videos/how-to-search.mp4`, extract a poster frame with ffmpeg.
7. Add `<HowToVideo />` and place it on the homepage; keep the existing search bar above the fold on mobile.

## Out of scope (intentionally)

- Real screen recording of the live app (Remotion renders from code).
- More than one video this round — once you approve this one, I can clone the pipeline for the calculator and the price-alerts flows.

## Open question

Where exactly on the homepage? Default plan is a new "How it works" section directly below the hero search bar. Say the word if you'd rather place it on `/features` only, or in both spots.
