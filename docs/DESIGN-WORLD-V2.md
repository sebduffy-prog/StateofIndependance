# The State of Independence — Design World V2

The authoritative visual brief for this pass. Supersedes `docs/DECK-DESIGN-WORLD.md` (the OLD
brief) wherever they conflict. Source of truth: the new deck `STATE OF INDEPENDENCE.pptx`,
whose real assets are curated in `assets/deck/`. Foundation and chapter agents follow THIS doc.

The headline change: move OFF the flat mustard/teal-only look and adopt the richer
State-of-Independence world — **warm mustard→orange gradient grounds, cream/off-white bear +
small-figure silhouettes facing each other, thin white concentric orbit-circle line motifs and
pale seed dots, and photographic ad-mockup evidence cards.** Gradients are now ALLOWED on
grounds/heroes. The UI must feel seamless and modern, not linebreaky and blocky.

---

## 1. Palette (sampled from the real deck assets)

All hexes below were eyedropper-sampled from `assets/deck/` originals.

### Warm grounds (the signature world) — gradients now allowed

| Token | Hex | Sampled from | Use |
|---|---|---|---|
| `--soi-amber` | `#FBC100` | ground-gradient top/centre | The core mustard. Base of every warm ground. |
| `--soi-gold` | `#FCD407` | bear-figure panels, top edge | Lightest warm tint, top of gradient. |
| `--soi-orange` | `#FD8D20` | maze top face / ground lower-right | The orange the mustard warms INTO. |
| `--soi-coral` | `#FF8F79` | ground-gradient bottom-right corner | The hottest corner glow. Use sparingly, only as the far reach of a ground gradient. |

**Signature ground gradient** (use on heroes, world panels, chapter pivots):
```
background: linear-gradient(135deg, #FCD407 0%, #FBC100 42%, #FD8D20 88%, #FF8F79 100%);
```
This is the exact mustard→orange→coral fall the deck uses. Angle 120–145° (top-left light →
bottom-right warm). Keep the coral to the final ~12% only — it is a glow, not a band.

### Cream / silhouette tones

| Token | Hex | Sampled from | Use |
|---|---|---|---|
| `--soi-cream` | `#EEE9DD` | bear silhouette body | The bear + small-figure silhouette fill. Off-white with warmth — NEVER pure white on a warm ground. |
| `--soi-cream-warm` | `#FAE9C5` | figure silhouette | Warmer cream variant for figures / softer silhouettes. |
| `--soi-page` | `#F4F1EA` | light slide grounds | Warm off-white PAGE ground (warmer than pure white). Default light section background. |

### Navy / dark (the bear, serious data, dark slides)

| Token | Hex | Sampled from | Use |
|---|---|---|---|
| `--soi-navy` | `#0A1A5C` | maze bear / figure (deck) | Signature dark. The bear, "brand asks" bars, ink for headlines on light. |
| `--soi-blue` | `#0B3DB4` | ground-blue centre | Bright royal-blue gradient ground (dark-slide alternative to navy). |
| `--soi-blue-deep` | `#073AAC` | ground-blue top-left | Darker stop for the blue gradient. |
| `--soi-navy-velvet` | `#16194A`-ish | ground-navy-velvet | Textured deep-navy ground for quote / twist punctuation. Flat-navy fallback if texture image not used. |

**Blue gradient ground** (dark slide):
```
background: linear-gradient(135deg, #073AAC 0%, #0B3DB4 55%, #194DC8 100%);
```

### Orbit lines, dots, accents

| Token | Hex | Notes |
|---|---|---|
| `--soi-orbit` | `#FFFFFF` @ **18–35% opacity** | The thin concentric orbit-circle lines + looping coils. ALWAYS a low-opacity white stroke on a warm ground, never a solid line. Stroke width 1–1.5px. |
| `--soi-seed` | `#FCC107` | The small pale "seed" dots that sit on the orbit lines. A slightly lighter mustard than the ground, ~with a faint white core. |
| `--soi-teal` | `#2BB7E8` | The cover-maze orbit RING (the one solid bright accent). Also the appendix accent in ch.09. Use sparingly. |
| `--soi-teal-pale` | `#A6E1F8` | The figure's map/phone in the maze; lightest teal. |
| `--soi-spark` | `#F22DCB` | Magenta spark. ONE dot, hero only, optional. Effectively retired — prefer the teal ring as the cover's single bright accent. |

### Data / chart series (keep flat — clarity over decoration)

Charts NEVER use the ground gradient. Flat fills only. Consistent coding everywhere:

| Series | Hex | Meaning |
|---|---|---|
| AI-use | `#1E90FF` azure | |
| AI-attitude | `#F7941E` orange | |
| brand-asks | `#0A1A5C` navy | |
| empty bar track | `#FBEEE2` pale peach (or `--soi-page` tint on light grounds) | |

Keep the existing verified chart palette in `js/lib/charts.js` working. Only the *grounds and
chrome* around charts change to the new world — the data marks themselves stay flat and legible.

---

## 2. Type treatment

- **Inter Tight, self-hosted** (this pass). It was "not coming through" because it relied on the
  Google Fonts CDN; it is now served from local font files. Foundation agent wires
  `@font-face` to the self-hosted files and removes the CDN `<link>`. Verify it actually renders
  (weights 400/600/700/800/900). No silent fallback to system Inter.
- **Huge stat numbers are the hero element.** `77%`, `60%`, `53% → 24%`, `6.42/10` — the stat IS
  the headline. Weight 800–900, very large (clamp up to ~9rem on hero stats), tight tracking
  (`letter-spacing: -0.03em`). Pair with a short bold label and one supporting sentence.
- **Eyebrow / kicker** above each section: uppercase, letter-spaced (`0.12em`), 600 weight, small,
  in `--soi-navy` on light or `--soi-cream` on warm. One kicker per section, no rules under it.
- **Headlines** sentence-case, bold (700–800), with an optional emphasis word dropping to its own
  line. Generous line-height on body (1.55–1.65); tight on headlines (1.05–1.15).
- **Quotes** get real estate: large hanging quote mark in a tint, the quote in regular weight,
  attribution in a small grey/cream caps line beneath. Treat as evidence, not decoration.
- **Page furniture** stays minimal: chapter counter and `© VCCP MEDIA 2026` in small, low-emphasis
  type. Source lines in small grey at the foot of data sections.

Square corners hold for cards, chart frames, and chrome. The *gradient grounds* and *orbit
motifs* are where the warmth and softness live — not in rounded corners.

---

## 3. Motif system

Four layered motifs build the world. Compose them; do not stack all four at once.

1. **Gradient ground** — the mustard→orange→coral wash (§1). The base layer for heroes, world
   panels and chapter pivots. Light sections use `--soi-page` flat off-white instead.
2. **Cream silhouettes facing each other** — the large bear (head, facing right) and the small
   standing figure (facing left, toward the bear). They are the emotional anchor: the threat and
   the agent, regarding one another across the ground. Use the curated `bear-figure-*` panels, or
   reproduce as cream SVG shapes (`--soi-cream`) on a gradient.
3. **Orbit-circle lines + coils** — thin low-opacity white (`--soi-orbit`) concentric circles,
   spheres, coils or arches sweeping between bear and figure. This is the "system / agency"
   dimension. On the cover the orbit is the bright teal RING. Animate the orbit on load/scroll
   (slow rotation/draw) — reduced-motion users get the static composed state.
4. **Seed dots** — small pale mustard dots (`--soi-seed`) sitting ON the orbit lines, like points
   on a path. Sparse. Two or three per composition.

Photographic evidence is a SEPARATE register (§4): never blend it into the illustrated world.

---

## 4. Photographic evidence treatment

Real ad mockups and news clips (British Gas, O2, Vitality, M&S, Vinted, Re_Skinned, Deliveroo,
hackathon, storm photography) are the **proof layer**. Rules:

- Always inside a **square-cornered card** with a generous flat `--soi-page` or white mat, clearly
  framed as "evidence" and visually distinct from the brand world.
- Square corners only — re-crop any rounded billboard frames.
- A thin (1px) low-contrast hairline OR a soft shadow to lift the card off the ground — pick ONE
  per chapter, do not double up frame + shadow + border.
- Caption beneath in small type (brand + claim), never overlaid on the photo unless the deck
  itself overlaid it (British Gas "down" headline is type-as-image and stays).
- Do not place a photographic card directly on a gradient ground without a mat — the photo edges
  must not bleed into the warm wash.

---

## 5. Seamless, modern UI — how to de-block the current build

The current build feels "linebreaky and blocky": a stack of bordered panels with hard rules.
De-block as follows.

- **Soften the boxes.** Remove most hairline borders and box outlines. Where separation is needed,
  use negative space, a tint shift, or a very soft shadow — not a 1px rule. Keep borders only on
  evidence cards and data/chart frames where they aid clarity.
- **Flowing sections, not stacked panels.** Let warm grounds run full-bleed and bleed between
  sections with gradient transitions, instead of each section being a discrete bordered box on
  off-white. A chapter can fade its ground from `--soi-page` into a gradient and back.
- **Gradient grounds replace flat panels.** Hero / pivot / divider sections take the signature
  gradient ground (§1) rather than a flat mustard fill.
- **Consistent spacing rhythm.** One spacing scale (e.g. 8px base: 8/16/24/40/64/96/128). Section
  vertical padding generous and uniform (clamp ~`5rem`–`9rem`). No ad-hoc margins.
- **Refined type hierarchy.** Eyebrow → stat/headline → support → source, with consistent size
  steps. Let the big number carry the section; trim redundant labels.
- **Graceful transitions.** Scroll-reveal with stagger (respecting reduced-motion), the orbit
  animation on the hero, slow ground-gradient drift at most. High-impact moments, not scattered
  micro-interactions.
- **Generous, intentional negative space.** Especially around stats and quotes. Premium = room to
  breathe, not density.

---

## 6. Anti-overlap / anti-double-layer / contrast-safety rules (MANDATORY)

Audit every section against these. Each is a blocker.

- **No accidental overlap.** No element may unintentionally occlude another. Overlap is only
  permitted when it is a deliberate composed effect (e.g. a stat number overlapping a cream
  silhouette) AND both remain legible. Verify at the breakpoints actually used.
- **No double layering / z-index stacking bugs.** One element per stacking context where possible.
  Do not place two grounds, two cards, or a card on a card without a clear, intended depth. Audit
  `position`/`z-index` for stale layers left over from the old build.
- **No same/similar colour on colour.** Every text/shape must clear contrast against what is
  DIRECTLY behind it:
  - Ink on ink (navy text on navy ground) — FORBIDDEN. Use `--soi-cream` on dark.
  - Cream on mustard without enough contrast — FORBIDDEN as body text. Cream silhouettes are fine
    as large shapes (they read by mass), but cream *text* needs `--soi-navy` or a dark ground.
  - On warm gradient grounds, body/label text must be `--soi-navy` (high contrast against amber).
  - On blue/navy dark grounds, text must be `--soi-cream` or white.
  - The known offender: the segment-graph **"Retreaters" ink label on dark** — must be flipped to
    cream/light. Re-check ALL segment-graph and segment-map labels against their quadrant fill.
  - Target WCAG AA (4.5:1 body, 3:1 large) for all real text. Decorative orbit lines are exempt
    (they are intentionally low-opacity), but no actual content may be low-contrast.
- **Orbit lines never carry meaning.** They are decoration at 18–35% white; never put a number or
  label only on an orbit line.

---

## 7. Per-chapter recommendations (01–09)

Apply the world while keeping every loved interaction and every verified number working. Never
fabricate a stat; all numbers trace to `data/*.json` and `docs/STORY.md`.

### 01 — Cover / hero
- **Assets:** `cover-maze-orbit.gif` (animated maze + navy bear + figure-with-map + orbiting teal
  ring) as the money-shot hero; `cover-maze-static.png` as the reduced-motion / poster frame.
- **Treatment:** Warm `--soi-page` ground, maze centred, the teal orbit ring as the single bright
  accent. Self-hosted Inter Tight title. Optional one `--soi-spark` dot, or drop it.
- **De-block:** No bordered hero box — let the maze float on the off-white ground with generous
  space. Title and kicker hang in clear negative space, not in a panel.

### 02 — The numbers you already know
- **Assets:** none required (typographic). Optional faint `ground-gradient.jpg` wash behind the
  hero stat.
- **Treatment:** Big-number stat layout — oversized `%` in `--soi-navy`, bold kicker, one support
  line, grey source. Keep drag-rank / guess-slider interactions.
- **De-block:** Replace stacked bordered stat boxes with a flowing stat rhythm on generous space;
  remove hairline rules between stats — use spacing.

### 03 — The twists in the story
- **Assets:** `bear-child-stamp.png` (watercolour bear+child) as a large low-emphasis watermark;
  `ground-navy-velvet.jpg` OR `ground-blue.jpg` for an EARNED dark section behind the trust
  paradox; `photo-storm-window.jpg` for the "head in the sand / battening down" mood.
- **Treatment:** `53% → 24%` spread and `6.42/10` gauge as hero stats. The dark ground is the
  deliberate punctuation here — cream text on it (contrast rule §6). Keep flip-rows working.
- **De-block:** One dark full-bleed moment, not a row of dark boxes. Watermark sits BEHIND content
  at low opacity with no border.

### 04 — Dig deeper / the agency 2×2
- **Assets:** none required (vector). Optional seed-dot/orbit motif in the quadrant gutters.
- **Treatment:** The agency 2×2 segment map (PESSIMISTIC↔OPTIMISTIC × PASSIVE↔PROACTIVE), four
  labelled quadrants with %. Keep the segment-map interaction.
- **De-block + contrast:** This is where the **"Retreaters" ink-on-dark label** lives — flip it to
  cream. Soften quadrant cell borders to tint shifts; ensure each quadrant label clears its fill.

### 05 — Four segments
- **Assets:** none required (the segment cards are vector + charts). Keep the persistent
  four-segment legend.
- **Treatment:** Segment profile cards + the "AI & BRAND" bar card — square corners, flat data
  series (§1 chart palette), bold underlined section title. Keep the segment-graph interaction.
- **De-block + contrast:** Audit every segment label against its card/quadrant colour (segment-
  graph offender). Reduce card borders to one device (border OR shadow). Even spacing between
  cards; no double-stacked panels.

### 06 — Survival mode → active agency / empowerment architecture
- **Assets:** the **bear-figure world panels** as the emotional pivot — `bear-figure-coil.jpg`
  (survival, tight coils), `bear-figure-orbit.jpg` / `bear-figure-sphere.jpg` (opening up),
  resolving toward `ground-gradient.jpg`; `photo-walking-storm.jpg` (woman walking into the storm
  = active agency). `bear-box-scene.jpg` optional cinematic variant.
- **Treatment:** Full-bleed gradient world moment — cream silhouettes facing each other, orbit
  lines between. Then the SAVE ME MONEY / TIME / STRESS three-pillar block. This is THE turn —
  give it space.
- **De-block:** Full-bleed gradient panel instead of a flat mustard box; pillars flow on the
  ground with spacing, not three bordered cards.

### 07 — Five signature moves
- **Assets (evidence layer):** `admock-britishgas-down.jpg` ("Energy prices that can only go
  down"), `admock-britishgas-fairness.jpg`, `admock-o2.jpg`, `admock-vinted.jpg`,
  `admock-reskinned.jpg`, `admock-vitality.jpg`, `admock-mands-kidswear.jpg`. Stage-number
  dividers `01`–`05`.
- **Treatment:** Big stage-number dividers + the less→more comparison table per move. Photographic
  ad mockups framed as square evidence cards (§4) — one frame device, captioned beneath.
- **De-block:** Let the big stage number breathe on a gradient divider; evidence cards in a clean
  grid with consistent gutters, not a dense bordered stack. Keep playground filters working.

### 08 — Recap / hand them the tools
- **Assets:** `challenger-books.jpg` (Challenger Series covers) as a brand artefact; optional faint
  gradient wash.
- **Treatment:** Five-move recap list + the Martin Lewis "hand them the tools" pull-quote in the
  large hanging-quote style (real estate, hanging mark, cream/grey attribution).
- **De-block:** Recap as a clean flowing list with rhythm, not five bordered rows. Quote gets a
  full calm section.

### 09 — Outro / appendix
- **Assets:** none required. `--soi-teal` is the correct appendix accent here.
- **Treatment:** Team credits grid; "making the most of the data" CTA; `© VCCP MEDIA 2026` page
  furniture. Teal accent permitted.
- **De-block:** Generous credits grid with even spacing; CTA as a single clear focal element on
  calm ground, not a boxed button row.

---

## 8. Curated asset index (`assets/deck/`)

| File | What it is |
|---|---|
| `cover-maze-orbit.gif` | Animated cover: iso mustard/orange maze, navy bear inside, navy figure-with-map at entrance, orbiting teal ring. The hero money-shot. |
| `cover-maze-static.png` | Static first frame of the maze (reduced-motion / poster). |
| `bear-figure-coil.jpg` | Gradient world panel — cream bear + figure, tight looping coil orbit (survival mode). |
| `bear-figure-orbit.jpg` | Gradient world panel — concentric overlapping orbit circles between bear and figure. |
| `bear-figure-sphere.jpg` | Gradient world panel — orbit lines tightened into a globe/sphere of lines. |
| `bear-figure-cube.jpg` | Gradient world panel — wireframe cube orbit motif variant. |
| `bear-figure-maze.jpg` | Gradient world panel — maze-door / arch orbit motif variant. |
| `bear-box-scene.jpg` | Cinematic bear + small figure inside a glowing mustard box on water (dusk). Optional pivot visual. |
| `ground-gradient.jpg` | Clean mustard→orange→coral gradient ground, no silhouettes. Base warm ground. |
| `ground-blue.jpg` | Royal-blue gradient ground for dark slides. |
| `ground-navy-velvet.jpg` | Textured deep-navy velvet ground for quote / twist punctuation. |
| `bear-child-stamp.png` | The VCCP watercolour bear-and-child logo stamp (black). Editorial watermark device. |
| `bear-child-stamp-red.png` | Red-lettered VCCP bear-and-child variant. |
| `challenger-books.jpg` | Challenger Series book covers (brand artefact for the recap). |
| `photo-storm-window.jpg` | Man watching a storm through a rain-lashed window (head-in-sand / battening down). |
| `photo-walking-storm.jpg` | Woman walking purposefully into a coastal storm (active agency). |
| `photo-hackathon.jpg` | Great British Hackathon hall (innovation / agency evidence). |
| `admock-britishgas-fairness.jpg` | British Gas "Fairness matters" billboard mockup (the brief's named example). |
| `admock-britishgas-down.jpg` | British Gas "Energy prices that can only go down" billboard (type-as-image). |
| `admock-o2.jpg` | O2 "Find the game here" billboard mockup. |
| `admock-vitality.jpg` | Vitality "Stay alive for another five" tube poster. |
| `admock-mands-kidswear.jpg` | M&S kidswear one-year-guarantee news mockup. |
| `admock-vinted.jpg` | M&S / Oxfam / eBay "Give your clothes another life" resale mockup. |
| `admock-reskinned.jpg` | Re_Skinned resale-rewards mockup. |

23 assets. Photographic and gradient-world panels are web-optimized JPG (≤1600px); flat stamps
and the static maze frame are PNG; the animated cover is the only large file (GIF, ~11MB).
