# BRAND-WORLD-FINAL.md — the authoritative brand world

> **This document is the single source of truth for the design of The State of
> Independence.** It supersedes `docs/DESIGN-WORLD-V2.md` (now historical) wherever
> they conflict. It is derived directly from the FINAL deck components staged in
> `assets/brand-final/`, reconciled with the official VCCP Media 2026 brand system
> (`SEBSKILLS/skills/frontend-and-design/vccp-media-design/SKILL.md`) and held to the
> premium bar in `docs/ART-DIRECTION.md`.
>
> Where this doc and DESIGN-WORLD-V2 disagree, this doc wins. The headline reconciliation:
> the official VCCP system specifies Inter Tight + mustard/teal + the highlighter
> parallelogram. **For this flagship piece those three are overridden by the final deck
> components: Poppins, the warm-amber/cream world, navy+yellow flat icons, and NO
> parallelogram.** Everything else from the official system (the bear+girl silhouettes as
> the brand signature, square corners, sentence case, tabular numbers, flat editorial
> discipline, no red/green) is kept and is binding.

The assets that DICTATE this world (study them in `assets/brand-final/`):

| File | What it establishes |
|---|---|
| `challenger-series-lockup.png` | THE brand signature: bear + small girl silhouette + VCCP wordmark, a thin vertical divider, then **Challenger** (bold) **Series** (italic). Pure black. |
| `challenger-book-covers.png` | THE component language: cream editorial covers, BOLD BLACK Poppins titles, small navy+yellow flat icons, a tiny Challenger-Series mark top-right, on a warm amber ground. Square corners. |
| `ground-warm-gradient.png` | The signature warm ground — amber core, coral edges. |
| `ground-cream.png` | The editorial light ground — flat cream. |
| `maze-logo.gif` | The State of Independence MAZE motion logo — the hero logo-moment. |
| `bear-girl-tall.png` | The bear+girl as a tall vertical silhouette element. |

---

## 1. Palette — exact hexes (eyedropper-sampled from `assets/brand-final/`)

### Warm gradient ground (the dominant surface — 60–70% of the world)

Sampled from `ground-warm-gradient.png` (1920×1080): amber core, warming to gold/orange
at one edge and to coral/pink at the opposite corner.

| Token | Hex | Sampled at | Role |
|---|---|---|---|
| `--ground-amber` | `#FBC100` | centre | The core. The mustard everything sits on. |
| `--ground-gold` | `#FFC002` | top edge | Lightest warm tint, top of the gradient. |
| `--ground-orange` | `#FFA764` | left edge | The orange the amber warms into. |
| `--ground-coral` | `#FF8598` | bottom-right corner | The hottest corner glow. Keep to the final ~12% only — a glow, not a band. |

**Signature ground gradient** (heroes, world panels, chapter pivots):

```css
background: linear-gradient(135deg, #FFA764 0%, #FBC100 40%, #FFC002 70%, #FF8598 100%);
```

Angle 120–145°. The coral lives only in the far corner. Do not let it become a stripe.

### Cream — the editorial light ground

| Token | Hex | Sampled from | Role |
|---|---|---|---|
| `--cream` | `#F0EDE7` | `ground-cream.png` (flat) | The editorial light ground. The book-cover card fill. Warm off-white — **never pure white** on this world. |
| `--cream-shade` | `#E2E0D8` | book-cover edge/shadow | The card's own soft self-shadow / a faint divider tint on cream. |

### Navy + Yellow — the icon & accent system

Sampled from the flat icons on `challenger-book-covers.png` (brain, eye/moon, figure).

| Token | Hex | Role |
|---|---|---|
| `--navy` | `#041654` | The icon dark, the bold-stat accent on cream/warm, ink for fine furniture, the "serious data" colour. Deep, slightly indigo navy. |
| `--navy-bright` | `#0129A4` | The brighter blue inside the flat icons (highlights, the figure). Secondary icon tone only. |
| `--yellow` | `#F0CB08` | The icon accent yellow — the bright wedge in the brain/moon icons. The single warm accent that reads ON cream. (Slightly greener/brighter than the ground amber, so it pops on cream rather than vanishing.) |

### Black — type & silhouettes

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#000000` | **All display type and the bold black titles** (the book-cover voice). The lockup, the bear+girl silhouette, the maze line. |
| `--ink-soft` | `#1A1A1A` | Body copy where pure black is too hard at small size on cream. |

### Where each colour is used (the dominance rule)

- **Warm gradient ground** is the dominant surface (60–70%): heroes, pivots, dividers, the world moments.
- **Cream `#F0EDE7`** is the editorial / data-reading ground and the card fill: anywhere the user is reading numbers or longform.
- **Black `#000000`** carries ALL the bold titles and the silhouettes — this is the book-cover voice. Black titles on cream, black or navy titles on warm.
- **Navy `#041654`** is gravity: hero stat numbers, icons, fine furniture. **Yellow `#F0CB08`** is the one accent — icon wedges, a single highlight per screen. Navy+yellow always travel together as the icon pair.
- **Never** two similar warm values touching (amber text on amber). **Never** navy text on navy. On warm grounds, type is black or navy; on navy grounds, type is cream.

---

## 2. Type system — Poppins (self-hosted)

Poppins is already self-hosted in `assets/fonts/` (`poppins-{400,500,600,700,800,900}.woff2`
+ `poppins-400-italic`, `poppins-600-italic`). Do **not** add a CDN link; verify the local
faces render (no silent system fallback).

```css
--font: 'Poppins', system-ui, -apple-system, 'Segoe UI', sans-serif;
```

The book covers establish the voice: **BOLD BLACK Poppins titles, set tight, two lines,
sentence- or all-caps, on cream.** That is the display register for the whole site.

| Role | Spec |
|---|---|
| **Display** (one hero line per screen) | Poppins **900**, `clamp(3.5rem, 8vw, 8rem)`, letter-spacing **-0.03em**, line-height **0.92**. Black on cream/warm. One per screen, never two. The book-cover title voice. |
| **Card / section title** | Poppins **800**, `clamp(1.6rem, 2.6vw, 2.4rem)`, -0.02em, line-height 1.0. The book-cover title at card scale. |
| **Sub-head** | Poppins 600, `clamp(1.4rem, 2.2vw, 2rem)`, -0.01em, line-height 1.1. |
| **Body / standfirst** | Poppins **400** (500 for standfirst), 1.0–1.25rem, line-height **1.5**, measure 52–62ch. |
| **Eyebrow / kicker** | Poppins 600, 0.78rem, UPPERCASE, letter-spacing **+0.18em**, ~0.7 opacity, navy on cream / ink on warm. |
| **Italic accent** | Poppins 400/600 **italic** — the "*Series*" gesture. Used for the one accent word in a title, set in italic ONLY (see §3). |
| **Numbers** | `font-variant-numeric: tabular-nums` everywhere, always. Hero stats are display-scale — the number IS the headline (900, navy). |

**Rules.** Sentence case for narrative; UPPERCASE only for eyebrows and the five-move
divider titles (the book covers use all-caps titles — that energy is reserved for the
moves dividers and covers). Dramatic size contrast: nothing in the muddy middle. No
underlines, ever.

### The italic accent (replaces the parallelogram)

The official VCCP highlighter parallelogram is **retired for this piece** (it belongs to
the mustard/teal Inter Tight system, not this world; and parallelograms are a hard
no here). The lockup itself shows the correct device: **the accent word is set in
italic Poppins** — exactly as "*Series*" sits against the upright "Challenger".

- One accent word per headline, italic, same weight as the line (or one step lighter).
- No box, no skew, no underline, no highlight fill. The slant of the italic IS the accent.
- Optional: the accent word may take `--navy` while the rest stays black, OR a single
  `--yellow` understroke is **not** allowed (no underlines). Italic alone is the signature.

---

## 3. The editorial component language (derived from the book covers)

`challenger-book-covers.png` is the master component. Every content/data card on the site
is a descendant of it. Anatomy of the book-cover card:

1. **Cream ground** `#F0EDE7`, **square corners** (zero radius), filling its space edge-to-edge.
2. A **tiny Challenger-Series mark top-right** — the bear+girl+wordmark lockup, small, black, ~24–32px tall. Brand stamp, never large on a card.
3. The **content zone**: either a small **navy+yellow flat icon** (brain / eye-moon / figure) or a half-bleed photo, sitting in the upper/centre field with generous space.
4. A **BOLD BLACK Poppins title** anchored low-left (the book-cover signature: 2 lines, all-caps or sentence case, tight leading, `--ink`).
5. **No border, no drop-shadow as a crutch.** The cream card lifts off the warm ground by its own value contrast and at most a single soft self-shadow (`--cream-shade`). One lift device only.

```css
.soi-card {
  background: var(--cream);
  border-radius: 0;            /* square, always */
  padding: clamp(20px, 2.4vw, 36px);
  position: relative;
  /* ONE lift device — pick this OR a hairline, never both */
  box-shadow: 0 10px 30px rgba(4, 22, 84, 0.06);
}
.soi-card__mark {                /* tiny Challenger-Series lockup, top-right */
  position: absolute; top: clamp(16px,2vw,28px); right: clamp(16px,2vw,28px);
  height: 28px; width: auto; opacity: 0.9;
}
.soi-card__title {               /* the bold-black book-cover voice */
  font-weight: 800; color: var(--ink);
  font-size: clamp(1.6rem, 2.6vw, 2.4rem);
  letter-spacing: -0.02em; line-height: 1.0;
}
```

### How data / content cards should look

- **Backgroundless data, cream card chrome.** The chart/stat itself has no panel behind it
  — bars, dots, rings sit directly on the cream. The cream card is the editorial frame;
  the data floats inside it. (Per ART-DIRECTION §5: tracks are a faint ink tint, never a white box.)
- **Bold black title low-left**, eyebrow above it, the data-moment occupying the upper field.
- **Tabular navy numbers** as the hero of any stat card; one supporting line in `--ink-soft`.
- **Square corners, no underlines, no parallelogram, no gradient inside a data card** (the
  gradient is a ground, not a fill). Charts stay flat and legible — only the chrome changes.
- **One frame device per card** (the soft self-shadow OR a 1px navy-tint hairline, never both).
- **Photographic evidence** (ad mockups) follows the same card: half-bleed photo in the upper
  field, bold-black caption-title beneath, the tiny mark top-right. Photo edges never bleed
  onto the warm ground without the cream mat.

---

## 4. The lockup + bear/girl usage (from the official VCCP system)

`challenger-series-lockup.png` is **the brand signature**: bear + small girl on a baseline,
a thin vertical divider, then **Challenger** (Poppins-bold upright) / **Series** (italic).
Pure black silhouette. Governed by the official `vccp-media-design` skill — follow it exactly:

- **Black silhouette is the rule.** Never recolour on brand surfaces. On a warm or dark
  ground where black would crowd, place it on a small cream plate rather than recolouring.
- **Never stretch, skew, rotate, or distort.** Always proportional (`object-fit: contain`).
- **Never animate the silhouette** beyond a gentle fade / scroll-in. No shake, no rotation.
- **Don't re-trace or rebuild** — use the supplied PNG.
- **Clear space** ≈ the cap-height of the wordmark "C" on all sides (~15% of the longest edge). Never crowd.
- **Sizing:** journey nav / card stamp **24–32px** tall (top-right, the book-cover position);
  cover / hero **96–160px**; never in a body section's running furniture beyond the small mark.
- **`bear-girl-tall.png`** is the vertical-silhouette variant — for a tall edge column, a
  divider spacer, or the empowerment scale moment (the bear = the threat, the small figure =
  the agent, regarding each other). Cream or black per ground; large shape, read by mass, never clip-art.
- **Don't co-brand at the same hierarchy** — if another mark appears, a vertical hairline divider separates them.

---

## 5. The maze logo — the hero moment

`maze-logo.gif` is the State of Independence MAZE motion logo. Treat with reverence:

- **Once, big, on the cover (01).** It is the logo-moment, not a recurring decoration.
- Centred on the warm or cream ground with **vast negative space** around it — no bordered hero box.
- The **"you" dot** is born here and travels the whole journey (ART-DIRECTION §6) — the single thread.
- **Reduced-motion:** serve a static first frame (poster) instead of the GIF — never autoplay motion for users who opted out. Provide a `prefers-reduced-motion` still path.
- The maze line is `--ink` / navy on the warm ground; the orbit/you-dot accent may take `--yellow` (the single accent), echoing the icon wedges.

---

## 6. Icon style — flat, navy + yellow

Derived from the book-cover icons (brain, eye/moon, figure):

- **Flat, two-tone: `--navy` `#041654` body + `--yellow` `#F0CB08` wedge/highlight**, optional `--navy-bright` `#0129A4` for an inner accent. No gradients, no outlines, no drop-shadow, no 3D.
- **Geometric and simple** — a solid navy silhouette with one bright yellow cut/wedge (the "open" gesture: a slice of brain, a crescent of moon). Small — they sit in a card's upper field, not as page furniture.
- **Square / clean construction**, sitting on cream. Never on the warm ground without the cream card.
- Reuse the existing `js/lib` SVG primitives where an icon is really a data mark; author new flat icons in this navy+yellow language, sized to match the book-cover icons.

---

## 7. Per-screen expression (01–09)

The journey order is: **01-cover, 02-research, 03-baselines, 04-twists, 05-segments,
06-empowerment, 08-playground, 07-moves, 09-outro**. Keep every verified number (trace to
`data/*.json` / `docs/STORY.md`) and every loved interaction; reskin to this world.

**01 — Cover.** The `maze-logo.gif` hero moment, once and big, on a warm gradient ground.
The you-dot born. Huge black/navy Poppins-900 title with one italic accent word
("*Independence*"). The Challenger-Series lockup at hero scale. Vast space; no hero box.
Reduced-motion → static maze frame.

**02 — Research.** Cream editorial ground (reading register). Eyebrow → bold-black title.
The UK as a real place; the map is the hero, alone. Big navy tabular stats. Keep
drag-rank / guess interactions. Flowing rhythm, no stacked bordered boxes.

**03 — Baselines.** Cream ground. You guess, then the truth lands as a crowd of 100 with
your navy square in it — backgroundless dots on cream, tabular navy numbers. One bold-black
title low-left. Faint ink-tint track, never a white box.

**04 — Twists.** The earned punctuation moment: a warm gradient (or a single navy
full-bleed) pivot. `53% → 24%` and `6.42/10` as hero navy stats. The trust ladder is
tactile (drag); the holiday resists being cut. Audit the old "Retreaters" label so no
ink-on-dark survives — cream text on any dark ground.

**05 — Segments (the showpiece).** Cream ground. The nation resolves into four segment
**book-cover cards** — cream, square, bold-black title low-left, a flat navy+yellow icon
per segment top field, the tiny lockup mark top-right. Persistent four-segment legend.
Backgroundless segment-graph data; one frame device per card; every label clears its fill.

**06 — Empowerment (the turn).** Full-bleed warm gradient world moment using
`bear-girl-tall.png` / the bear+girl regarding each other, the orbit motif between them.
Then SAVE ME MONEY / TIME / STRESS as three needs you pull together until they meet —
tactile, elemental, flowing on the ground (not three bordered cards). Give it space.

**08 — Playground.** A calm, precise cream instrument. The data, beautifully, on demand —
backgroundless charts, tabular navy numbers, flat series, generous space. Filters as quiet
square controls. The "precise instrument" register: restraint is the luxury signal.

**07 — Moves (the payoff).** Big stage-number dividers `01`–`05` in the book-cover ALL-CAPS
bold-black voice on warm gradient dividers. Each move: the less→more comparison and a
photographic ad-mockup as a **book-cover evidence card** (half-bleed photo, bold-black
caption-title, tiny mark top-right, square, one frame device). Cinematic filmstrip; keep
playground filters working.

**09 — Outro.** Calm cream (or warm) ground. The nation disperses; one line remains. Team
credits grid with even spacing; the "making the most of the data" CTA as a single focal
element. `© VCCP MEDIA 2026` furniture small and low-emphasis. Yellow as the single accent;
the Challenger-Series lockup signs off.

---

## 8. Asset gaps to curate into `assets/brand-final/`

Present and sufficient: the lockup, book-cover component reference, both grounds, the maze
GIF, the tall bear+girl. Gaps to derive when a screen needs them (do not fabricate data; these are visual assets only):

- **`maze-logo-static.png`** — a still first frame of `maze-logo.gif` for the reduced-motion / poster path (01). **Required** before 01 ships with motion.
- **`lockup-mark.png`** (or SVG) — a tight square crop of just the bear+girl+wordmark stamp at ~32px for the card top-right position, separated from the wide "Challenger Series" lockup. Convenience crop; the full lockup works at hero scale.
- **Flat navy+yellow segment icons** (×4) and **move icons** (×5) — authored in the §6 icon language to match the book-cover icons. Author as needed; note as a gap until done.
- **`ground-cream.png`** is a flat fill — it can be reproduced as the CSS token `#F0EDE7` rather than shipping the image; keep the PNG only if a textured cream is wanted later.

Everything else (photographic evidence, world panels) can continue to come from
`assets/deck/` provided it is re-matted onto cream and re-cornered to square per §3.
