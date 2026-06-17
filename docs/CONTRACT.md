# CONTRACT.md — the chapter builder's contract

Read this before building any chapter. This is the single source of truth for
**how** to build. It pairs with three content/world docs you must also obey:

- `docs/STORY.md` — your exact copy, verified stats, and quotes.
- `docs/DESIGN-WORLD-V2.md` — the visual world (palette, motifs, per-chapter look).
- `docs/EXPERIENTIAL-IDEATION.md` — the interaction ideas + Reference DNA (Blue
  Marine / Moooi). §3 of that doc is the per-chapter interaction spine (also
  summarised here under "Per-chapter marquee interaction").
- `docs/FEEDBACK-V4.md` — the hard rules (Poppins, no parallelogram, backgroundless,
  zero overlap, fill the screen, sources hidden).

Also read the design skill:
`/Users/seb.duffy/Documents/GitHub/SEBSKILLS/skills/frontend-and-design/frontend-design/SKILL.md`.

This is a **static** site: HTML fragments + vanilla ES modules + scoped per-chapter
CSS. **No build step.** No framework, no bundler, no npm. Everything runs in the
browser as-is.

---

## 1. The three files you write — and ONLY these

For chapter `{id}` (the nine ids are fixed: `01-cover`, `02-research`,
`03-baselines`, `04-twists`, `05-segments`, `06-empowerment`, `08-playground`,
`07-moves`, `09-outro` — note **moves before outro** in journey order):

1. **`sections/{id}.html`** — an HTML **fragment** (no `<html>`/`<head>`/`<body>`),
   with exactly **one root element**: `<div class="chapter-inner">…</div>`.
   This fragment is injected via `innerHTML` into the live step container (see §2).
   Put static markup here; build interactive/canvas/SVG nodes in JS.

2. **`js/sections/{id}.js`** — an ES module with a **default export**
   `init(rootEl, data)` (see §3). Import paths are **relative to `js/sections/`**,
   so libs are `../lib/x.js`.

3. **`css/sections/{id}.css`** — **every selector scoped to the chapter id** so
   styles never leak between chapters. The file is **already** `@import`-ed by
   `css/sections.css` (do not touch that file). **Escaped-id selector rule:** a CSS
   id selector cannot begin with a digit, so `#01-cover` is invalid and silently
   dropped. Use the **escaped form** `#\30 1-cover` — `\30 ` is the hex escape for
   the digit `0` **with a trailing space** (the space terminates the escape and is
   not a descendant combinator). One escape per leading digit:

   | id | escaped selector prefix |
   |----|------------------------|
   | `01-cover` | `#\30 1-cover` |
   | `02-research` | `#\30 2-research` |
   | `03-baselines` | `#\30 3-baselines` |
   | `04-twists` | `#\30 4-twists` |
   | `05-segments` | `#\30 5-segments` |
   | `06-empowerment` | `#\30 6-empowerment` |
   | `07-moves` | `#\30 7-moves` |
   | `08-playground` | `#\30 8-playground` |
   | `09-outro` | `#\30 9-outro` |

   Example: `#\30 3-baselines .stat-value { … }`. Anchors (`href="#03-baselines"`)
   and `getElementById('03-baselines')` are **unaffected** — only CSS selectors
   need the escape.

**DO NOT edit any shared file.** Off-limits: `index.html`, `css/vccp.css`,
`css/sections.css`, `js/main.js`, `js/lib/*`, `sections/manifest.json`,
`data/*.json`, anything in `assets/`. If you believe a shared file needs a change,
**note it in your report** instead of editing it.

---

## 2. How the shell mounts your chapter (the runtime contract)

`js/main.js` is the journey engine. Per chapter it:

1. Creates `<section class="journey-step" id="{id}" role="group" aria-label="{title}">`
   and appends it to `#app`. **`rootEl` passed to your `init` IS this `<section>`**,
   not the `.chapter-inner` div. (Your CSS scope `#\30 …` targets this section.)
2. Sets `section.innerHTML = <your sections/{id}.html fragment>`.
3. Dynamic-imports `js/sections/{id}.js` and calls `module.default(section, data)`.
4. Shows exactly **one** step at a time via `section.hidden = true/false`. All nine
   sections are mounted up-front; navigation just toggles `hidden`.

A failed fragment or a thrown `init` is caught and replaced with a visible inline
error card — it never blanks the rest of the journey. **Do not let `init` throw**
on missing data; guard and fail soft.

### The `chapter:arrive` event (entrance choreography)

When a step becomes current, the shell dispatches on its section:

```js
rootEl.addEventListener('chapter:arrive', (e) => {
  const { ritual } = e.detail;      // ritual === true only on the FIRST visit to 01-cover
  arrival(rootEl, { ritual });      // re-assemble headlines / count numbers (see experiential.js)
});
```

Use this to (re)play your entrance each time the step is shown (assemble headlines,
count numbers, kick a canvas). It fires on every show, so make your handler
idempotent. `ritual: true` only ever fires once, for `01-cover`.

### The persistent "you" dot

The shell creates ONE global `youDot()` marker that eases toward each step's anchor.
Mark **one** element per chapter with `data-youdot-anchor` and the dot lands on its
centre when the step is shown. Optional — omit it and the dot rests where it was.

---

## 3. `init(rootEl, data)` signature

```js
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival } from '../lib/experiential.js';
import { orbitRingChart, tugOfWar } from '../lib/charts.js';
// …import only what you use

/**
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="{id}">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
export default function init(rootEl, data) {
  const { survey, segments, tgi, journey } = data;
  if (!survey) return;                      // ANY dataset may be null — guard it, fail soft

  // entrance: re-assemble on every arrival (idempotent)
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);                   // fades in .reveal descendants
  observeCounters(rootEl);                  // animates [data-count-to] descendants

  // build interactive nodes into rootEl.querySelector('[data-…]') targets
  // soft gating (optional): mark this step's marquee interaction
  journey.gate();                           // shows the gentle "try it" hint
  // …when the visitor completes it:
  // someWidget.onReveal = () => journey.ready();   // clears the hint
}
```

### Soft gating — `data.journey.gate()` / `data.journey.ready()`

**Next is ALWAYS unlocked after a ~1s dwell, on every step, regardless of these
calls.** They are advisory only: `gate()` turns on a gentle "Try the interaction
below" hint; `ready()` clears it. They do **not** lock or unlock Next. **Never trap
the visitor.** Use `gate()`/`ready()` only on the step's *one* marquee interaction;
do not gate ambient or cosmetic beats. Both are no-ops if you skip them.

---

## 4. Full lib API reference

All factories follow `factory(container|el, opts) -> { el, … }`. All read colour
tokens from CSS custom properties (brand sheet is the single source of truth) and
all respect `prefers-reduced-motion` (jump-cut to final state). Charts animate on
first scroll-into-view via IntersectionObserver. Import paths are `../lib/{file}.js`.

### `reveal.js`
- `observeReveals(rootEl, { staggerMs?=90, threshold?=0.1 }) -> cleanup()`
  Fades in every `.reveal` inside `rootEl` when it scrolls in. Put `data-stagger`
  (or `data-stagger="140"`) on a **parent** to stagger its direct `.reveal` children.
- `prefersReducedMotion() -> boolean`

### `counter.js`
- `countUp(el, { to, from?=0, durationMs?=1200, decimals?=0, prefix?='', suffix?='' }) -> void`
  Eased count-up of `el.textContent`. Locale-formatted (`en-GB`), tabular.
- `observeCounters(rootEl) -> cleanup()`
  Animates each declarative
  `<span data-count-to="77.3" data-count-from data-count-decimals data-count-prefix
  data-count-suffix data-count-duration>` the first time it scrolls into view.

### `charts.js` (pure SVG + one canvas factory; navy default on warm grounds)
Common opts: `accent?: 'navy'|'teal'|'mustard'|'cream'` (default `'navy'`),
`onNavy?: boolean` (flips marks + text to cream/teal for dark grounds),
`ariaLabel?`, `decimals?`. **Tracks are a faint ink/cream tint — never a white box.**
Avoid `accent:'mustard'` on warm grounds (mustard-on-mustard).

- `horizontalBars(container, { items:[{id?,label,pct}], max?=100, accent?, onNavy?, decimals?=0, highlightId?, animate?=true, barHeight?=30, gap?=12, labelWidth?=200, ariaLabel? }) -> { el, update(newItems, { resort?=false }) }`
  Inline value labels at the bar end (no boxed legend). `update` morphs/re-sorts.
- `waffleGrid(container, { value, total?=100, accent?, onNavy?, square?=26, gap?=6, ariaLabel? }) -> { el, setValue(v, { animate?=true }) }`
  10×10 isotype grid; each square = 1 in 100. Staggered fill on view.
- `barGauge(container, { value, max?=10, accent?, onNavy?, ariaLabel? }) -> { el }`
  Single flat horizontal score gauge (e.g. NHS 6.42/10), unit ticks.
- `slopeChart(container, { items:[{label, from, to}], max?=100, accent?, onNavy?, ariaLabel? }) -> { el }`
  Two-axis slope lines for before/after movement.
- `lollipopChart(container, { items:[{id?,label,pct}], max?=100, accent?, onNavy?, highlightId?, ariaLabel? }) -> { el }`
  Stem + dot per item (lighter than a bar).
- `dotPlot(container, { items:[{label,pct}], max?=100, accent?, onNavy?, ariaLabel? }) -> { el }`
  Cleveland-style shared-axis dots; good for compact rankings / the 29-pt spread.
- `proportionStrip(container, { segments:[{label, pct, accent?}], onNavy?, ariaLabel? }) -> { el, update(newSegments) }`
  One 100% strip of proportional cells, inline labels. NOTE: for binary splits
  prefer **`tugOfWar`** (its labels can never collide — see FEEDBACK-V4 §4).
- `radialGauge(container, { value, max?=10, label?, accent?, onNavy?, ariaLabel? }) -> { el }`
  Flat semicircle arc gauge (square caps); alternative to `barGauge`.
- `orbitRingChart(container, { items:[{label, pct? | value?}], max?=100, accent?, onNavy?, centreLabel?, decimals?, ariaLabel? }) -> { el }`
  **The signature motif as a chart.** Items become points on thin concentric orbit
  rings (biggest value → outermost). Hover/focus enlarges a point. Keyboard-focusable.
  Use this to replace a plain bar chart with something ownable.
- `tugOfWar(container, { left:{label,pct}, right:{label,pct}, accent?, onNavy?, ariaLabel? }) -> { el, update({left,right}) }`
  Single tension bar for a binary split; divider **springs** to the true position
  on reveal. Left labels above, right labels below — they can never overlap.
- `dotField(container, { count, dotRadius?=2.6, onNavy?, ariaLabel? }) -> { el, formation(targets, behaviour?), highlight(index, colour?), drift(amplitude?), setPointer(xNorm, yNorm | null), destroy() }`
  Canvas-2D particle field with spring/repulsion/inertia physics. `formation(targets)`
  takes `[{x,y,colour?}]` in **0..1 normalised** space (dots past the list scatter to a
  faint cloud); optional `behaviour:{spring?,jostle?}`. `highlight(i,colour)` paints the
  "you" dot. `drift(amp)` = ambient life. Pointer force auto-tracks the container; or
  drive it with `setPointer`. Pauses off-screen. **Container needs an explicit CSS height.**
  **Call `destroy()` on step-leave** (one canvas/sim per visible step max).
- `clusterPoints(n, { x, y, w, h }) -> [{x,y}]`
  `n` jittered points (0..1) filling a rect; use to place a segment cluster on a 2×2 map.

### `venn.js`
- `vennDiagram(container, { sets:[{ id, label, value?, sub?, accent? }] (2–4), orbit?=120, radius?=150, centre?:{label,value,sub?}, onSelect?, ariaLabel? }) -> { el, focus(id), clear(), destroy() }`
  Orbit-placed flat-fill circles, leader-line labels, centre stat plate, square-corner
  focusable legend. Hover/focus a set or its legend card isolates it. CSS hooks:
  `.venn-wrap .venn-stage .venn-svg .venn-petal .venn-leader .venn-ltext .venn-lmeta
  .venn-centre .venn-legend .venn-leg`, plus `.is-focus` / `.is-on`. `default` export too.

### `segment-graph.js`
- `segmentGraph(container, { segments:[…], facets?=['interests','channels','aiAttitude','demographics'], width?=920, height?=600, onSelectSegment?, onSelectAttribute?, ariaLabel? }) -> { el, selectSegment(id), selectAttribute(key), clear(), destroy() }`
  Circular force-physics network: segment hubs (per-segment brand accent) + attribute
  satellites, live charge/spring/collision so labels never overlap; backgroundless.
  Drag a node to nudge; click/Enter selects; a detail panel + keyboard fallback list are
  built in. Pass the `segments[]` array straight from `data/segments.json`. CSS hooks:
  `.sg-wrap .sg-stage .sg-svg .sg-edge .sg-hub .sg-attr .sg-label .sg-panel .sg-fallback`,
  plus `.sg-svg.is-focus .is-on .is-dim`. **Call `destroy()` on step-leave.** `default` export too.

### `interactions.js` (every pointer path also has a keyboard path)
- `flipReveal(container, { rows:[{less, more}], fromToLabels?=['Less','More'], onFlip? }) -> { el, flipAll(flipped?=true) }`
  Less→More rows that toggle on click/Enter/Space. CSS hooks: `.flip-rows .flip-head
  .flip-row .flip-less .flip-arrow .flip-more`, `.is-flipped`, `aria-pressed`.
- `clickToGuess(container, { trueValue, max?=100, unit?='%', label, prompt?, onReveal? }) -> { el, reveal() }`
  Guess-a-number slider → "Lock in" → truth + delta. CSS hooks: `.guess .guess-prompt
  .guess-label .guess-control .guess-range .guess-output .guess-submit .guess-reveal
  .guess-actual .guess-delta`.
- `dragRank(container, { items:[{id,label}], trueOrder:[id,…], instructions?, onReveal? }) -> { el, reveal() }`
  Reorder tiles (HTML5 drag **and** ArrowUp/Down keyboard) then reveal "spot on / N off".
  CSS hooks: `.rank .rank-help .rank-list .rank-item .rank-pos .rank-label .rank-grip
  .rank-submit .rank-delta`, `.is-dragging`.
- `quiz(container, { questions:[{id, statement, agree:{x,y}, disagree:{x,y}}], onAnswer?(x,y,index), onComplete?(x,y) }) -> { el, reset() }`
  Agree/Disagree flow accumulating an x/y score (the agency compass). CSS hooks:
  `.quiz .quiz-progress .quiz-card .quiz-statement .quiz-actions`.
- `pillGroup(container, { options:[{value,label}], value?, ariaLabel, onChange(value) }) -> { el, setValue(v) }`
  Single-select control (radio semantics, arrow-key nav). SQUARE chips (not rounded).
  CSS hooks: `.pillgroup .pillgroup-chip`, `.is-active`, `aria-checked`.

Interaction helpers ship **behaviour, not final styling** — style their class names
inside your `#\30 …` scope.

### `tactile.js` (Moooi-style draggable physics — for the NEW tactile beats)
- `spring(from, to, { stiffness?=170, damping?, bounce?=0, precision?=0.05, onUpdate, onRest?, reducedMotion? }) -> { stop(), setTarget(to), isVector }`
  Critically-damped spring driver on rAF. `from`/`to` may be scalars or `{x,y}` vectors.
- `contactShadow(el) -> { lift(), settle(), destroy() }`
  Moooi "thing on a table" drop-shadow + scale (drives `--tactile-scale`). Square-safe.
- `draggable(el, { axis?:'x'|'y'|null, bounds?:{minX,maxX,minY,maxY} | (state)=>clampedXY, spring?:'return'|'settle'|false, springOpts?, momentum?=0.12, keyboardStep?=24, onMove?(state), onRelease?(state), onSettle?() }) -> { destroy(), setPosition(x, y, { animate? }) }`
  Pointer + **keyboard** (arrows nudge, Enter/Space toggles grab) drag with contact
  shadow lift, release momentum, and spring-return/settle. `state = {x,y,dx,dy,vx,vy,grabbed}`.

### `experiential.js` (scroll-driven + connective-tissue helpers)
Every helper returns a `cleanup() => void` (except `prefersReducedMotion`). All
transform/opacity only, rAF-batched, IO-gated, reduced-motion safe.
- `prefersReducedMotion() -> boolean`
- `observeParallax(rootEl, { maxShiftPx?=60 }) -> cleanup()` — translates `[data-parallax]`
  (value = speed factor; optional `data-parallax-x`) on scroll; clamped so nothing escapes.
- `chapterTransition(rootEl, { property?='--enter', startClass?='is-entering', endClass?='is-entered' }) -> cleanup()`
  Exposes scroll-entrance progress 0→1 as a CSS var (`--enter`) on `rootEl`; CSS owns the mask/clip.
- `scrollScene(rootEl, steps:[{at, onEnter?(p), onLeave?(p)}], { onProgress?(p) }) -> cleanup()`
  Ties scroll progress to step callbacks (scroll-driven builds).
- `arrival(rootEl, { ritual?=false, onRitualDone? }) -> cleanup()`
  The premium chapter-arrival beat. `[data-arrival]` lines cascade in; the one
  `[data-arrival-scramble]` line decrypts into place; `[data-arrival-count]` numbers
  count up (reads `data-to`/`data-decimals`/`data-prefix`/`data-suffix`). `ritual:true`
  plays the one-time "Listening to 1,504 people…" overlay (only on first 01-cover).
  Wire this to `chapter:arrive` (see §2).
- `youDot({ size?=12, stiffness?=0.08, damping?=0.82 }) -> { el, anchorTo(scope), destroy() }`
  **The shell already creates the single global instance** — you only mark one
  `[data-youdot-anchor]` element. (Don't create your own youDot.)
- `magneticButton(el, { strength?=0.32, radius?=110, stiffness?=0.12, damping?=0.72 }) -> cleanup()`
  Cursor-attracted button. Pointer-fine only; no-op under reduced motion / coarse pointer.
- `magneticCursor({ size?=16, hoverScale?=2.6, hoverSelector?='a, button, [data-cursor]' }) -> cleanup()`
  Custom blend cursor dot. Pointer-fine only.
- `scrambleIn(el, { speedMs?=28, chars? }) -> cleanup()` — decrypt one element's text into
  place (final string = its current `textContent`). Reduced motion = instant.

---

## 5. Data shapes (read the files to confirm — never fabricate)

Every value you display must trace to `data/*.json` or `docs/STORY.md`. **Each survey
block carries a `source` string** — but per FEEDBACK-V4 §6 **all source captions are
hidden site-wide** (keep the strings in data, don't render `.vccp-source`).

### `data/survey.json` (national, n=1,504)
Top-level keys, each with `source` + an `items[]` (unless noted):
- `meta` — `{ sampleSize:1504, fieldwork, weighting, marginOfError, … }`
- `moodOfNation.items[]` — `{ id, code, label, pct }` (Q2 net agree). Headlines:
  careful 77.3, anxious 60.2, exhausted 54.8, selfReliant 54.3, enjoyNow 51.2, inControl 46.7.
- `moneySavingMoves.items[]` — `{ id, code, label, pct }` (Q6A; shoppedAround 54.5 …).
- `tradingDownByCategory.items[]` — `{ id, label, pct }` (Q6B; groceries 53.6 …).
- `protectedSpend.items[]` — `{ id, code, label, pct }` (Q5; holidays 39.6, familyExperiences 39.2 …).
- `availabilityConcerns.items[]` — `{ id, code, label, pct }` (Q8A; fuel 44.8, freshFood 36.8 …).
- `institutionTrust` —
  `headline:{ nhsMeanScore:6.42, nhsDeclinedPct:52.6, trustSpread:"NHS 53% … Government 24% … 29-point spread" }`,
  `confidenceRanking.items[]` = `{ id, code, label, pctConfident, meanScore }` (Q7; NHS 52.8 → Government 23.9),
  `performanceChange.items[]` = `{ id, code, label, pctDeclined, pctImproved }` (Q8C; Government 64.0 declined worst).
- `aiTasks` — `{ anyTaskPct:58.4, highStakesPct:37.4, notUsedPct:41.6, items[]:{ id, code, label, pct, isHighStakes } }`
  (Q11). **58.4% = used AI for ANY task; 37.4% = high-stakes. Never conflate them.**

### `data/segments.json`
- `meta` — `{ title, framework, sources[], sampleNote, caveats[], metricsTotals{…} }`.
  `metricsTotals` holds the national average for each metric family (used as the 100 baseline).
- `segments[]` (four, in order architects/hustlers/coasters/retreaters), each:
  `{ id, name, sharePct, quadrant:{x:'optimistic'|'pessimistic', y:'proactive'|'passive'},
    threeWordDescriptor, heroQuote, longQuote, who, money, spendPriorities,
    interests[], channels[], aiAttitude,
    metrics:{ <family>:{ <label>:{ pct, index } } } }`.
  Metric families: `mindsetNetAgree, financialPosition, forwardMindset, essentials,
  firstToCut, tradedDown12Months, personalControlBehaviours, selfManagement,
  aiUseByTask, brandAsks`. **`pct` = penetration within the segment; `index` = vs sample
  average (100 = average; >120 over-indexes, <80 under-indexes).**
- `quiz` — `{ title, intro, axes:{x:{dimension,positive,negative}, y:{…}},
    questions[]:{ id, statement, agree:{x,y}, disagree:{x,y} },
    scoring:{ method, xRule, yRule, quadrantToSegment } }`. Feed `questions` straight
  to `interactions.quiz`. Map the resulting x/y to a quadrant, then `quadrantToSegment`:
  `optimistic+proactive→architects, pessimistic+proactive→hustlers,
  optimistic+passive→coasters, pessimistic+passive→retreaters`.

**Always display the canonical deck shares 17 / 28 / 27 / 28** (`sharePct`), not the
TGI/crosstab audience sizes (see `meta.caveats`).

### `data/tgi.json`
- `source`, `sourceDetail`, `indexNote`.
- `segments.{architects|hustlers|coasters|retreaters}` each:
  `{ media:[{label, index, pct}], lifestyle:[{label, index, pct}],
    demographics:{ tgiAudienceThousands, tgiShareOfAdultsPct, deckSharePct, skews:[{label, index, pct}] } }`.
  `index` = segment % ÷ all-GB-adults % × 100. ≥120 over-indexes, ≤80 under-indexes.
  TGI names "Adapters/Strivers" map to Architects/Hustlers. **The deck is canonical on
  sizing** (use `deckSharePct`, not the TGI share).

---

## 6. Design world + hard-rules cheat-sheet

Full system in `css/vccp.css` (read it) + `docs/DESIGN-WORLD-V2.md`. Highlights:

### Font — POPPINS (already wired as `--font-sans` in vccp.css)
Display titles Poppins 800/900, tight tracking, big. Body Poppins 400/500. The big
**stat number is the hero element** (weight 800–900, clamp up to ~9rem,
`letter-spacing:-0.03em`), paired with a short bold label + one sentence.

### Palette tokens (CSS custom properties — use the var, never a hex literal)
Warm world: `--soi-amber #FBC100`, `--soi-gold #FCD407`, `--soi-orange #FD8D20`,
`--soi-coral #FF8F79`. Signature ground gradient:
`linear-gradient(135deg, #FCD407 0%, #FBC100 42%, #FD8D20 88%, #FF8F79 100%)` (coral
in the final ~12% only). Cream/silhouette: `--soi-cream #EEE9DD`, `--soi-cream-warm
#FAE9C5`, `--soi-page #F4F1EA`. Dark: `--soi-navy #0A1A5C`, `--soi-blue #0B3DB4`,
`--soi-navy-velvet`. Orbit decoration: `--soi-orbit` (white @ 18–35% opacity),
`--soi-seed #FCC107`. Accent: `--soi-teal #2BB7E8` (the ONE bright accent — cover
orbit ring + ch09 appendix; use sparingly). Also legacy `--mustard`, `--teal`,
`--teal-deep`, `--ink` exist and the charts read them.

### Ready-made classes (defined in vccp.css)
`.chapter-inner` (your fragment root), `.vccp-eyebrow` (kicker), `.vccp-stat`
(`-label`/`-value`/`-sub`), `.vccp-card` (`-head`/`-title`/`-sub`), `.vccp-frame`,
`.vccp-rail`, `.vccp-stage-num`, `.vccp-table`, `.vccp-btn` (`-primary`/`-quiet`),
`.vccp-delta-up` (teal) / `.vccp-delta-down` (mustard-dark), `.vccp-source` (hidden),
`.reveal`, `.num` (tabular nums), `.hl` (emphasis) / `.hl-teal`.

### HARD RULES (FEEDBACK-V4 + DESIGN-WORLD-V2 §6 — each is a blocker)
- **Backgroundless components.** No white/cream boxes, no white chart tracks (faint
  tint only). Charts/venn/graph float directly on the ground.
- **ZERO overlap, nothing cut off, no dead space.** Fill the laptop/monitor screen;
  a longer scroll is fine — give chapters depth, not empty bands. Verify at real
  breakpoints. (Use `tugOfWar` for binary splits — its labels never collide.)
- **NO underlines. NO parallelogram / skew** (no `skewX`). Emphasis = navy weight or a
  clean STRAIGHT highlight, applied consistently. **Square corners everywhere** (the
  nav pill is the only rounded element — add no radius).
- **No mustard-on-mustard.** On warm grounds use navy marks/text; flip to cream/teal
  on dark grounds (`onNavy:true`). No `accent:'mustard'` on a warm ground.
- **Contrast (WCAG AA: 4.5:1 body, 3:1 large).** Navy text on warm; cream/white text on
  dark. No ink-on-ink, no low-contrast cream text on mustard. Orbit lines are decoration
  only — never put a number/label on an orbit line.
- **No gradients on charts** (flat fills only); gradients are for grounds/heroes.
- **Tabular numbers** on every stat. **Sources hidden** (strings stay in data).
- **Reduced-motion safe** (the libs handle it — keep your own motion the same).
  **Keyboard path** for every interaction. **No `console.log`.**
- **Logos:** `assets/brand/Logo-crop.png` (nav), `Girl_and_Bear*.png` — silhouettes,
  never on mustard without a paper mat, never animated/distorted.

### Curated assets (`assets/deck/`)
Cover: `cover-maze-orbit.gif` (+ `cover-maze-static.png` poster). World panels:
`bear-figure-coil/orbit/sphere/cube/maze.jpg`, `bear-box-scene.jpg`. Grounds:
`ground-gradient.jpg`, `ground-blue.jpg`, `ground-navy-velvet.jpg`, `ground-storm.png`.
Watermark: `bear-child-stamp.png`. Evidence (ch07): `admock-*.jpg`,
`photo-storm-window.jpg`, `photo-walking-storm.jpg`, `photo-hackathon.jpg`,
`challenger-books.jpg`. Map: `uk-map.svg`. Titles: `title-*.png`. (Full index in
DESIGN-WORLD-V2 §8.) Photographic evidence = a SEPARATE register: square card on a flat
`--soi-page`/white mat, ONE frame device (border OR shadow, not both), caption beneath.

---

## 7. Per-chapter marquee interaction (the spine, from EXPERIENTIAL-IDEATION §3)

One unforgettable, well-orchestrated beat per chapter (not scattered micro-interactions).
Each carries its deck stat; gate the marquee beat with `journey.gate()`/`ready()`.

| Chapter | Marquee interaction | Carries | Build from |
|---|---|---|---|
| **01-cover** | Trace-the-maze cover; the "you" dot is born here | Starting = taking control | `tactile.draggable` on an SVG path + snap-to-path; `dotField`; mark `[data-youdot-anchor]`. `ritual:true` arrival. |
| **02-research** | "Connecting to Britain…" ritual → eight-city UK map | 1,504 respondents · 8 cities · 1-wk diaries | `dotField.formation` for the converging dots; `uk-map.svg` + pin/quote reveals; `reveal`. Teal accent allowed here. |
| **03-baselines** | Guess-the-number → 100-in-100 waffle → shrinking basket | 77% careful · 55% deal-seek · 54% trading down | `clickToGuess` (trueValue 77.3); `waffleGrid` (your dot = one square); `tactile.draggable` basket + `tugOfWar` 54/46 reveal. |
| **04-twists** | Drag-rank who Britain trusts → slope of slipping trust → AI substitution | Trust 53→24 spread · NHS 6.42/10 yet 53% declined · 58% used AI | `dragRank` (Q7 `confidenceRanking`, trueOrder by `pctConfident`); `slopeChart`/`dotPlot` (Q7→Q8C); `proportionStrip`/`tugOfWar` + `pillGroup` over `aiTasks`. |
| **05-segments** | Agency compass quiz ("which Britain are you?") → living segment force-graph | 17/28/27/28 across the 2×2 · per-segment behaviours & indices | `quiz` (`segments.quiz`) → quadrant → `quadrantToSegment`; `segmentGraph(segments)`; persistent 4-segment legend. |
| **06-empowerment** | The pivot wipe (survival→agency) + tug-of-war → weigh the three needs | Survival mode → Active Agency · save me money/time/stress (time+stress > money) | `chapterTransition`/`scrollScene` ground wipe (`ground-storm`→`ground-gradient`); `tugOfWar`; `tactile.draggable` balance over `brandAsks` (38.8/24/27.7). |
| **08-playground** | Explorable data appendix (outside the 16-step spine) | Per-segment exploration | Reuse `segmentGraph` + `proportionStrip`/`pillGroup` + the chart factories. Teal accent allowed. |
| **07-moves** | Five-move filmstrip (flip Less→More) → toolkit wall (pick up a tool) | The five signature moves · "hand them the tools", 34% self-fixing | `flipReveal` per move + `scrollScene` to sequence; `tactile.draggable`/click tiles; `admock-*` evidence cards (§4). Move titles below. |
| **09-outro** | Institutions ▸▸▸ Individuals + Martin Lewis quote | "They want brands to hand them the tools" | SVG flow + `dotField` (incl. the "you" dot); `reveal`/`scrambleIn` quote on `ground-navy-velvet` (cream text). Teal accent allowed. |

**The five move titles (07-moves, verbatim):** Unplug them from the grid · Be the
trusted antidote · Ride the social self-help wave · Kill the mental load · Boost good behaviours.

**Connective tissue (threaded, NOT counted as gated steps):** the persistent you-dot
(shell), chapter arrivals + assembling headlines (`arrival` on `chapter:arrive`), the
orbit progress meridian (shell), magnetic Next (shell). Ambient/cosmetic beats must NOT gate.

---

## 8. Pre-flight checklist (before you call a chapter done)

- [ ] Three files only, named `{id}`; fragment has a single `.chapter-inner` root.
- [ ] CSS fully scoped with the escaped `#\30 …` id selector; nothing leaks.
- [ ] `init` guards null `survey`/`segments`/`tgi`; never throws; fails soft.
- [ ] Every number traces to `data/*.json` or STORY.md (58% any-task vs 37% high-stakes
      kept distinct; shares shown as 17/28/27/28).
- [ ] Backgroundless, zero overlap, no cutoff, no dead space, fills the screen.
- [ ] No underline, no skew/parallelogram, square corners, no mustard-on-mustard, tabular nums.
- [ ] Contrast AA; navy-on-warm / cream-on-dark; sources hidden.
- [ ] Keyboard path for the interaction; reduced-motion safe; canvas/graph `destroy()`d on leave.
- [ ] One marquee beat per §7; `gate()`/`ready()` wired on it (optional, never blocks Next).
- [ ] `chapter:arrive` handler re-assembles the entrance idempotently. No `console.log`.
