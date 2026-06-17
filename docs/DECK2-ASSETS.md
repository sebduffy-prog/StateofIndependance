# DECK2-ASSETS — curated branding lifted from deck (2), slides 1-78

Source: `STATE OF INDEPENDENCE (2).pptx` media, staged at `assets/deck2-src/` (gitignored,
144 files). Curated into `assets/deck/` (committed). Semantic-named, overwriting/extending the
prior set. All paths below are inside `assets/deck/`.

## The motion maze logo (signature hero)
- **`maze-hero.gif`** (800x800, animated; 10.7MB) + **`maze-hero.png`** (static first frame) —
  the SIGNATURE composition: isometric ORANGE/yellow maze, navy bear cresting it, a small figure
  reading a phone/map at the entrance, and a light-blue ORBIT ring sweeping around the whole thing.
  This is the State of Independence brand-world animation. Use as the **cover hero** (or a strong
  chapter transition). Note: the prior `cover-maze-orbit.gif` / `cover-maze-static.png` remain in
  place; `maze-hero.*` is the cleaner same-family asset — prefer it for the hero.
  Full maze path: `/Users/seb.duffy/Documents/GitHub/StateofIndependance/assets/deck/maze-hero.gif`

## Bear / figure gradient WORLD panels (the deck's core motif)
A recurring bear-silhouette-faces-a-small-figure scene on a yellow gradient, each with a different
geometric "independence" motif between them. Backgroundless-friendly (flat gradient grounds).
High-res 2048px PNGs (sharper than the prior `bear-figure-*.jpg` set).
- **`bear-world-coil.png`** — coil/spring bouncing toward the figure → ch on momentum / habit loops.
- **`bear-world-sphere.png`** — wireframe sphere / globe of lines → ch on the wider world / systems.
- **`bear-world-circles.png`** — overlapping circles (venn-like) → ch on overlap / shared ground.
- **`bear-world-arches.png`** — receding arches/portals → ch on thresholds / the journey through.
- **`bear-world-cube.png`** — wireframe cube → ch on structure / "the box".
- **`bear-world-doors.png`** — door/threshold shapes → ch on choices / opting out.
  (Pick 4-6 across chapters as full-bleed section grounds; rotate the motif to suit the chapter.)
- **`bear-box-scene.png`** — photographic-style render: bear + tiny figure inside a floating
  open box on calm water at dusk (blue→sunset gradient inside). Strong, cinematic → cover alt or a
  pivotal chapter break.

## Isolated brand marks (transparent)
- **`figure-silhouette.png`** — the brand "person" mark on transparent bg. Reusable as a small
  motif/bullet glyph or beside titles.
- **`title-wordmark-raw.png`** — raw black "HACKING THE ATTENTION ECONOMY" wordmark on transparent
  bg. **Treatment reference**: confirms the deck's title font is heavy condensed (Anton-style).
  Keep for matching the title look; do NOT ship as a literal title.

## Title-lockup report covers (Anton title-on-photo / on-motif)
The deck's "image-TITLE lockup" style = a huge condensed all-caps title slammed over a photo or
brand motif, with a small VCCP "Challenger Series" / COLLABORATIVE mark. Use as section dividers
or recreate the treatment live (see notes below).
- **`title-rebound.png`** — "WINNING IN THE REBOUND" over a London street → chapter divider.
- **`title-hardtimes.png`** — "HARD TIMES STRONG BRANDS" over a domestic photo → divider.
- **`title-memorycode.png`** — "CRACKING THE MEMORY CODE" with brain/orbit motif → divider.
- **`title-attention.png`** — "HACKING THE ATTENTION ECONOMY" with the orbit-ring + figure motif
  (most on-brand of the four) → strong chapter opener.
- **`challenger-books.png`** — the four report covers laid out as physical books on yellow →
  use as a "the thinking behind this" / credibility band.

## Ad-mockup & evidence photography (real-world proof)
- **`admock-britishgas-fairness.png`** — British Gas "Fairness matters" billboard in situ.
- **`admock-britishgas-down.png`** — British Gas "Energy prices that can only go down" (Fix & Fall).
- **`admock-o2-game.png`** — O2 "Find the game here" beach billboard.
- **`evidence-nationwide.png`** — Nationwide "You are now leaving Windsor. Just like the big banks."
  roadside sign. → use across the trust / brand-action chapters as evidence (cut the source caption).

## Brand GROUNDS (backgroundless gradients / textures — for full-bleed section beds)
- **`ground-yellow.png`** — the core yellow→orange brand gradient. Warm chapter beds.
- **`ground-blue-orbit.png`** — royal-blue with a sweeping orbit line. Cool chapter beds / hero.
- **`ground-blue-coil.png`** — royal-blue soft 3D coil/tube forms. Texture bed.
- **`ground-navy-velvet.png`** — deep navy velvet (hi-res PNG twin of the prior jpg). Dark sections.
- **`ground-storm.png`** — moody storm-cloud texture. Tension / cost-of-living chapters.

## Exact palette (sampled hexes from the deck media)
Brand core:
- Brand Yellow (ground):        `#FDC602` / `#FEC60A`
- Brand Yellow-deep (coil):     `#FBC505`
- Brand Orange (fade / maze):   `#F89950` → maze body `#FCDE49`, maze accent `#FD8D20`
- Royal Blue (orbit ground):    `#0F41B3`
- Navy (velvet / bear / text):  `#1A1A3E` (mids) → `#090923` (deep)
Neutrals / figures:
- Cream-white (bear silhouette): `#F5F0E6`
- Warm cream (figure fill):      `#FAE8C5`
- True black (title wordmark, maze line work): `#000000`

Pairing guidance (honours FEEDBACK-V4 "no mustard-on-mustard"): on yellow/orange grounds set type
in NAVY `#1A1A3E` or cream `#F5F0E6`; on blue/navy grounds set type in cream. Reserve orange as an
accent, never as type colour on a yellow bed.

## Image-TITLE treatment (so chapters can match it in Poppins)
The deck's titles are **heavy CONDENSED all-caps** (Anton in the source — see `title-wordmark-raw.png`).
FEEDBACK-V4 instructs Poppins, so where a raster title isn't used, recreate the lockup feel in
**Poppins 900 (Black)**:
- All-caps, very tight tracking (`letter-spacing: -0.02em` to `-0.03em`), tight line-height (~0.92).
- Huge display scale; left-aligned; stacked across 2-4 short lines like the report covers.
- Colour: navy on yellow/cream grounds, cream on navy/blue grounds. NO skewed/parallelogram shapes
  (per brief) — emphasis via weight/colour or a STRAIGHT squared block only.
- Poppins Black is wider than Anton, so it will read less "condensed"; if the client wants the exact
  punch, Anton-for-headlines is the flagged alternative (do not switch unasked — see FEEDBACK-V4 §1).
- Optional: pair a title with `figure-silhouette.png` or a `bear-world-*` motif to the right, as the
  deck does, rather than a plain text band.
