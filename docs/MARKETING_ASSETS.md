# Marketing assets

Every visual slot the landing page expects, with paths, dimensions, and fallback behavior.

The landing page (`app/(marketing)/page.tsx`) is built so every video and image slot has a graceful fallback (a designed glass mockup built from Tailwind + framer-motion). The `VideoSlot` component in `components/marketing/video-primitives.tsx` HEAD-probes each asset URL on mount; if the asset returns 404 or the network fails, the fallback renders in its place — same dimensions, same styling. The swap is invisible to the user.

You can ship the landing page today with no assets. When you drop each file in at the path below, the corresponding fallback disappears automatically — no code change needed.

## Folder layout

```
public/
  marketing/
    hero-vsl.mp4                  ← cinematic VSL (16:9, 40s)
    hero-vsl-poster.jpg           ← VSL poster frame (16:9)
    solution-demo.mp4             ← screen recording of a real scan (16:9 or 16:10, 15-30s)
    feature-scoring.mp4           ← loop of scoring panel (4:5, 10-20s)  — OPTIONAL
    feature-angles.mp4            ← loop of angle cards opening (4:5)    — OPTIONAL
    feature-pdf.mp4               ← PDF flipping pages (4:5)             — OPTIONAL
    og-image.png                  ← social share image (1200×630)
    logos/
      {brand-slug}.svg            ← customer/partner wordmarks           — OPTIONAL
    avatars/
      {first-last}.jpg            ← testimonial headshots (h-40 w-40, round-friendly) — OPTIONAL
```

## Videos

### `hero-vsl.mp4` (required for full impact)

- **Slot:** right column of the hero, opened by the "Watch the 40-second story" button
- **Dimensions:** 16:9 aspect ratio
- **Duration:** ~40 seconds
- **Content:** The "cinematic VSL" — the page's primary conversion video. Should show the product in action: an operator pasting a link, picking a country, the live research feed streaming, the verdict landing, then closing with the headline + CTA from the hero
- **Audio:** include a voiceover or just an evocative track — the modal player is unmuted
- **Encoding:** H.264 MP4, 5-8 Mbps, max 30 MB. Generate a poster frame at the 1-second mark and save as `hero-vsl-poster.jpg`
- **Fallback:** `FallbackHeroVisual` — a designed glass card mockup of a Wynner scan result (score ring at 87, "TEST IT" verdict pill, 5 pillar bars, "Grounded · 42 sources" chip). Floats gently.

### `hero-vsl-poster.jpg`

- **Slot:** poster attribute on the hero video, shown before autoplay starts
- **Dimensions:** 16:9, matches video resolution
- **Why it matters:** prevents a black flash before the video starts

### `solution-demo.mp4` (high-impact)

- **Slot:** the big visual under the "Solution" section
- **Dimensions:** 16:9 or 16:10
- **Duration:** 15-30 seconds, loops silently
- **Content:** Screen recording of a real Wynner scan — depth selection → product input → live scan UI with sources streaming → results page. Speed up so it fits in 20s without losing the "wow" beats (source feed, orb activity, verdict landing)
- **Encoding:** H.264 MP4, ~3 Mbps, max 15 MB
- **Audio:** none (silent loop)
- **Fallback:** `FallbackDemoVideo` — a designed composite of the live scan UI: mini source feed on the left, AI orb in the center (gradient sphere + pulse ring), mini stage timeline on the right.

### `feature-scoring.mp4` (optional)

- **Slot:** Pillar 01 (Intelligent Scoring)
- **Dimensions:** 4:5 portrait
- **Duration:** 10-20s loop
- **Content:** A close-up of the scoring panel — score ring animating from 0 to 87, pillar bars filling in order, verdict pill landing
- **Fallback:** `FallbackFeatureCard type="scoring"` — score ring at 87 + verdict pill + 5 gradient pillar bars

### `feature-angles.mp4` (optional)

- **Slot:** Pillar 02 (Hook Angles)
- **Dimensions:** 4:5 portrait
- **Duration:** 10-20s loop
- **Content:** Three hook angle cards stacking + their disclosures expanding to show script structures
- **Fallback:** `FallbackFeatureCard type="angles"` — 3 angle cards stacked at slight rotations, hooks visible, platform-fit bars

### `feature-pdf.mp4` (optional)

- **Slot:** Pillar 03 (PDF Reports)
- **Dimensions:** 4:5 portrait
- **Duration:** 10-20s loop
- **Content:** PDF pages flipping — cover → executive summary → personas → angles → playbook → sources. ~1.5s per page
- **Fallback:** `FallbackFeatureCard type="pdf"` — single static PDF cover mock with title, country, score, "TEST IT" pill, page metadata footer

## Images

### `og-image.png` (required for social shares)

- **Slot:** Open Graph + Twitter Card meta tags
- **Dimensions:** 1200 × 630
- **Content:** Wynner wordmark + the hero headline ("Know before you launch.") + a fragment of the hero scan-result mockup, all on the aurora gradient background. Match the brand exactly — Instrument Serif for the headline, JetBrains Mono for the small label
- **Format:** PNG (preserves text sharpness better than JPG at this size)
- **Fallback:** none — without this, social shares will use the default Next favicon or no preview at all. Worth designing this even if other assets are still in progress.

### `logos/{brand-slug}.svg` (optional)

- **Slot:** social proof strip after the hero (when re-enabled — currently the strip shows counted-up stats instead)
- **Dimensions:** SVG, vector — designed to render at ~32px height
- **Content:** Real customer or partner wordmarks
- **Fallback:** the social proof strip currently uses 4 stat counters instead of logos, so no fallback is needed yet. When you add logos, swap the stats strip for a logo marquee.

### `avatars/{first-last}.jpg` (optional)

- **Slot:** testimonial cards
- **Dimensions:** square, ≥128×128 (rendered at 40×40 round)
- **Content:** real customer headshots
- **Fallback:** `FallbackAvatar` — an aurora-tinted circle with the customer's first initial. Looks intentional, not like a placeholder. Use the customer's accent color for visual variety
- **How to wire:** when you upload a real avatar, replace the `<FallbackAvatar />` call in `TestimonialMeta` with a `<Image src="/marketing/avatars/{slug}.jpg" alt="{name}" width={40} height={40} className="rounded-full" />`

## How to verify a new asset works

1. Drop the file at the documented path (e.g. `public/marketing/hero-vsl.mp4`)
2. Restart `next dev` (Next caches static assets in dev)
3. Hard-refresh the landing page (Cmd+Shift+R)
4. The fallback should be gone and the real video should be playing
5. Check the network panel — there should be a 200 on the asset URL

If the fallback is still showing:
- Confirm the file path matches exactly (case-sensitive)
- Confirm the file is in `public/` (not `app/` or anywhere else)
- Check the browser console for errors — `VideoSlot` logs nothing on success, but a 404 from the HEAD probe will appear in the network panel

## Asset budget guideline

The full landing page should stay under 2 seconds on first paint and 1.5 seconds with optimized assets. Keep the total weight in check:

- `hero-vsl.mp4`: 5-8 MB
- `solution-demo.mp4`: 10-15 MB
- 3× feature videos (optional): 4-6 MB each, ~15 MB combined
- `og-image.png`: under 200 KB

Total optional video budget: ~50 MB across all 5 videos. If you want a tighter cap, skip the 3 feature-pillar videos entirely — the fallbacks for those are visually rich enough that most visitors won't notice.
