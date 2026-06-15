# FEEDBACK-V4 — "make it professional" master brief (2026-06-15, latest)

Supersedes/extends FEEDBACK-V3.md (still valid for the unfinished items: a prior workflow hit a
session limit, so V3's graph-rewrite, source-hiding, chapter backgroundless + overlap + map +
contrast fixes did NOT all land — they are folded in here). New deck source for branding:
`/Users/seb.duffy/Downloads/STATE OF INDEPENDENCE (2).pptx` (slides 1-78 are the design/brand to
lift biblically). Its media is staged at `assets/deck2-src/` (gitignored). Goal: a PROFESSIONAL,
deck-faithful interactive piece. No overlaps, no dead space, bigger bolder type, more interactivity.

## 1. FONT → POPPINS (explicit client instruction: "the font is poppins")
- Switch the site font to POPPINS. Self-hosted woff2 already in `assets/fonts/` (poppins-400/500/
  600/700/800/900 + 400/600 italic). Add @font-face for all; set `--font-sans: 'Poppins', system-ui,
  ...`. Keep the existing Inter Tight @font-face/files in place but Poppins is now primary.
- Display titles use Poppins 800/900 (Black), tight tracking, big. Body Poppins 400/500.
- NOTE for the client (do not block): deck (2) actually embeds **Anton** (heavy condensed) for its
  big titles, not Poppins. We are following the explicit "Poppins" instruction. If the punchy deck
  titles are wanted exactly, Anton-for-headlines is the alternative — flag it, don't switch unasked.

## 2. REMOVE THE PARALLELOGRAM (client: "get rid of parrallelogram")
- Kill the skewed highlighter parallelogram (the `skewX(-12deg)` `.hl` box). Replace emphasis with a
  CLEAN, professional treatment: a STRAIGHT (no skew) squared highlight block in mustard-light, OR
  coloured/weighted word — pick one and apply consistently. No skewed shapes anywhere.

## 3. LIFT DECK (2) BRANDING + IMAGES BIBLICALLY (slides 1-78)
- Curate the strongest assets from `assets/deck2-src/` into `assets/deck/` with semantic names and
  USE them: the bear/figure world panels, the maze, the image-title lockups, ad-mockup evidence.
- "Some text needs to be State of Independence designed brand world": key section/chapter titles
  should match the deck's title treatment (use the deck's title-image style, or recreate it in
  Poppins Black to match). Lift the deck's layout/colour/composition faithfully.
- Bring in the STATE OF INDEPENDENCE **motion maze logo** (`assets/deck/cover-maze-orbit.gif`,
  static fallback `cover-maze-static.png`) somewhere strong (cover hero, or a chapter transition).
- Crop the TOP-LEFT NAV LOGO: use the cropped `assets/brand/Logo-crop.png` (padding removed) in the
  nav so it aligns properly.

## 4. PROFESSIONAL UI + LAYOUT (the recurring asks, now non-negotiable)
- BACKGROUNDLESS components: no white/cream boxes, no white chart tracks (faint tint only). Charts/
  venn/graph float on the ground.
- ZERO OVERLAP, all text legible: fix the proportion-strip label collision (use the new `tugOfWar`),
  the ch06 reframe stacked old/new copy (clip fully), segment-graph label overlaps, any text-on-text.
- NO DEAD SPACE; FILL the laptop/monitor screen. A LONGER SCROLL is fine/wanted — give chapters more
  depth and content rather than empty bands; every screen earns its space.
- BIGGER, BOLDER TEXT throughout (Poppins weights), strong hierarchy.
- No mustard-on-mustard (drop any `accent:'mustard'` on warm grounds → navy / cream-on-navy).

## 5. MORE CREATIVE DATA + INTERACTIVITY
- Use the richer viz already built: `orbitRingChart` (orbit motif), `tugOfWar` (binary splits),
  lollipop/dotPlot/slope, the venn, and the REWRITTEN circular force-physics `segmentGraph`.
- Rewrite `js/lib/segment-graph.js` to circular cells + live force-physics + no label overlap +
  backgroundless (this did NOT land last pass).
- Real GREAT BRITAIN map silhouette in ch02 (current shape is a blob).
- Add interactivity where chapters are static; make data exploration delightful.

## 6. CUT SOURCES (still): hide all `.vccp-source` / source captions site-wide; strings stay in data.

## 7. COMPREHENSIVE FLAW AUDIT (client: "find every visual and technical flaw then fix")
- After the build, audit every chapter for: overlaps, dead space, white boxes, low contrast,
  broken/clipped layout, console/JS errors, font not applied (Poppins must render), broken
  interactions, non-filling sections. Fix all CRITICAL/HIGH. Deck branding applied biblically.

## Keep
Verified data + interactions intact, no fabricated numbers, square corners (charts box-less),
reduced-motion safe, no console.log. Deck move titles: Unplug them from the grid / Be the trusted
antidote / Ride the social self-help wave / Kill the mental load / Boost good behaviours.
