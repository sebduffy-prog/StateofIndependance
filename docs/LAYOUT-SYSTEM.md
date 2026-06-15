# LAYOUT-SYSTEM.md — art direction + shared layout contract

The single source of art direction for the redesign pass. Every chapter follows this.
Companion docs: DECK-DESIGN-WORLD.md (the deck's visual world), VOICE-AND-POLISH.md (WLV
copy + no em dashes), PORTED-COMPONENTS.md (venn + segment-graph), CONTRACT.md (file rules).

## 0. Design principles the client taught us (apply everywhere)

1. **Grounded, large imagery.** The bear/girl is not a logo in a box. It is a figure with
   physical presence that STANDS on the bottom edge of the surface. No decorative white
   plate behind it, no rounded frame. Illustrations are big, anchored to an edge, life-size
   in the composition. (Applies to the cover hero and the back cover.)
2. **No gratuitous boxes or borders.** Drop the page-edge frame on the cover. A border earns
   its place only as a deliberate device (a data card, an editorial frame moment), never as
   default chrome around everything.
3. **Gravitas in titles.** Titles must command the page: large, heavy, confident. Use the
   UPPERCASE DISPLAY treatment for hero / section / divider / move titles (this is how the
   deck does its dividers and section labels, and it reads with weight). Keep sentence case
   for narrative sub-headlines and body. Never timid type.
4. **Fill the frame. Kill the whitespace.** The current build feels "linebreaky" — stacked
   single-column blocks with dead air and hairline rules. Replace with composed editorial
   GRIDS: text and visual side by side, multiple density zones per screen, charts sized to
   fill their column. A chapter should feel art-directed, not like a document.
5. **Navy is the third colour.** The deck leans on navy for "the bear" and for serious data.
   Use it for dark moments, data emphasis, and the bear/figure silhouettes.
6. **Earned dark moments.** One or two deliberate navy/ink sections (the trust paradox, the
   hero, the outro) as punctuation, not the default.
7. **No em dashes** anywhere in copy (see VOICE-AND-POLISH.md). WLV voice throughout.

## 1. Tokens to add (css/vccp.css :root)

```
--navy:        #101F5B;   /* the bear, serious data, dark grounds */
--navy-soft:   #1E2E78;   /* hover/secondary navy */
--navy-pale:   #E7EAF4;   /* navy tint surface */
--azure:       #1E90FF;   /* deck data-series accent (use sparingly, coded) */
```
Keep mustard #FFC931 dominant (60 to 70 percent of visual weight). Teal stays appendix
(research surfaces 02 + 08). Navy is the new serious/dark accent. No gradients ever.

## 2. Type scale — give titles gravitas

Add a DISPLAY tier above the current scale:
```
--t-display: clamp(3.2rem, 7vw, 7.5rem);  /* hero + full-bleed divider titles */
--t-xl:      clamp(2.6rem, 4.8vw, 4.6rem);/* chapter headlines (bump up from before) */
```
- **Display / section / divider / move titles:** `.si-display` — weight 600, UPPERCASE,
  letter-spacing -0.01em, line-height 0.92. Big and grounded. (The cover wordmark, the five
  move titles, chapter section labels.)
- **Narrative sub-headlines:** sentence case, weight 500, `--t-lg`. The highlighter
  parallelogram still lands on ONE word here.
- **Eyebrow / kicker:** unchanged (600 uppercase, letter-spaced, --t-xs).
- **Big-number hero stat:** `.si-bignum` — weight 600, `clamp(4rem, 9vw, 9rem)`, tabular,
  line-height 0.9. The number IS the headline.

## 3. Layout utilities to add (css/vccp.css)

Build these as reusable classes so chapters compose dense screens:

- `.si-grid` — 12-col grid: `display:grid; grid-template-columns:repeat(12,1fr);
  gap:clamp(16px,2vw,32px);`. Children use `--span` via `grid-column: span N`. Helper
  classes `.col-3/.col-4/.col-5/.col-6/.col-7/.col-8/.col-12`. Collapse to 1col under 760px.
- `.si-split` — asymmetric two-pane (text + visual). Default `grid-template-columns: minmax(0,0.9fr) minmax(0,1.1fr)` so the VISUAL gets more room. A `.si-split--even` 1:1 variant. Vertically centre by default.
- `.si-stack-tight` — vertical rhythm at `gap: clamp(10px,1.2vw,16px)` (tighter than the
  airy defaults). Use for kicker+headline+standfirst clusters so they read as ONE block, not
  three line-broken rows.
- `.si-bignum-panel` — the big-number composition: a bordered (1.5px ink) panel split into a
  huge number/label on the left and its supporting chart on the right, filling the column.
  Square corners, mustard or paper fill, source line tucked bottom-left. Replaces the current
  "number floating left, small chart right with a hairline" pattern.
- `.si-datacard` — the deck's "AI & BRAND" card: paper fill, 1.5px ink border, bold UPPERCASE
  title with a full-width ink rule under it, then dense content. Square corners. The default
  container for a grouped data moment.
- `.si-dark` — dark section helper: `background:var(--navy); color:var(--paper);` (or ink).
  Eyebrows/sources shift to paper-on-navy. Use for earned dark moments. Highlighter switches
  to `.hl` mustard-light (still reads on navy).
- `.si-measure` — constrain prose to 56–66ch but place it INSIDE a grid column, never full
  page width (full-width text is the main cause of the linebreaky feel).
- `.si-ground` — for grounded imagery: an element anchored flush to the bottom of its
  section (`align-self:end; margin-bottom:0;`) so a silhouette "stands" on the bottom edge.

## 4. Reusable component patterns (chapters build these from the utilities)

- **Big-number stat:** `.si-bignum` number + bold label + one WLV sentence + `.vccp-source`,
  inside a `.si-bignum-panel` paired with its chart. Used in 03 and 04.
- **less → more table:** use `flipReveal` from interactions.js, styled as a 2-col evolution
  table inside a `.si-datacard`; consider the new `slopeChart` to visualise the shift too.
- **Agency 2×2:** the segment map (ch05) with ink hairline axes + quadrant labels in the
  DISPLAY treatment.
- **Segment data card:** ch05 profile uses `.si-datacard` with colour-coded mini-charts
  (lollipop/dotPlot, not just bars) for the segment's metrics.

## 5. New visualisation library (use these to reduce bar reliance)

From charts.js (already added): `slopeChart`, `lollipopChart`, `dotPlot`, `proportionStrip`,
`radialGauge` (all accept `accent:'mustard'|'teal'|'navy'`). Plus `dotField` now has real
physics (mutual repulsion so dots never crowd, cursor force, momentum, `setPointer`).
From new libs: `vennDiagram` (js/lib/venn.js) and `segmentGraph` (js/lib/segment-graph.js).
Guidance: keep at most ONE horizontal-bar chart per chapter; prefer lollipop/dotPlot/slope/
proportion/venn/graph/waffle for variety. Bars are fine where ranking magnitude matters.

## 6. Per-chapter direction (deltas on top of existing build — keep loved interactions)

- **01 cover:** Remove the page-edge frame AND the white plate/box around the logo. Place
  `Girl_and_Bear.png` LARGE, anchored flush to the bottom edge (`.si-ground`), centred or
  right, so the bear stands on the mustard floor. Headline in `.si-display` gravitas
  (UPPERCASE, huge) with the highlighter on "independence". Physics dots tuned so they're
  calm, not crowding. Keep the "1,505th respondent" idea but lighter.
- **02 research:** Teal surface. Tighten to a `.si-split`: counters + method left, GB map
  right, both filling the frame. Less vertical air.
- **03 baselines:** Replace the tall single-column list with `.si-bignum-panel`s in a grid;
  swap some bars for `lollipopChart`/`proportionStrip` (e.g. 54/46 trading-down split as a
  proportionStrip). Keep the guess interaction. Big numbers get `.si-bignum` gravitas.
- **04 twists:** Keep drag-rank + flip card + AI. Earn a `.si-dark` (navy) ground for the
  trust paradox. Use `radialGauge` for NHS 6.42/10. Denser grid, bear-silhouette stamp motif.
- **05 segments:** Keep the 2×2 dot map + quiz. ADD the `segmentGraph` GraphRAG explorer as a
  second way in. EXPAND the quiz to ~8 questions (see §7). Profiles become `.si-datacard`s
  with lollipop/dotPlot metrics. This is the showpiece: make it dense and rich.
- **06 empowerment:** Replace the bespoke pillars with the `vennDiagram` (money/time/stress,
  centre "empowerment"). FIX the reframe component: (a) remove the stray handle/divider bar
  showing INSIDE the box, (b) give the component a clear TITLE, (c) the slider gets a short
  plain label (e.g. "Slide"), not the long sentence. Use the bear-vs-figure world motif.
- **07 moves:** Five `.si-display` divider-style move titles (big, UPPERCASE, with the giant
  stage number). less→more as flipReveal + optional slopeChart. Denser bands, evidence cards.
- **08 playground:** Teal. Keep filters; vary the output (lollipop/dotPlot/proportion, not all
  bars). Tighten layout.
- **09 outro:** Dark ink/navy. Martin Lewis quote with deck hanging-quote gravitas. Back-cover
  band: `Girl_and_Bear` or `Logo` grounded (standing) on the mustard, NOT in a plate. No frame.

## 7. Quiz expansion (ch05)

Current quiz has 5 questions in data/segments.json `quiz.questions`. Expand to 8 by adding 3
more agree/disagree statements that score x (outlook: optimistic +1 / pessimistic -1) and y
(agency: proactive +1 / passive -1), consistent with the existing axis logic and the segment
definitions. Keep the scoring rules. Write the new questions in WLV voice, no em dashes. Add
them to segments.json (data edit is allowed for this).

## 8. Hard rules (unchanged)

Square corners (nav pill only round element). No gradients. No red/green (up=teal-deep,
down=mustard-dark). Tabular numbers. Source caption wherever data shows. Inter Tight only.
Every number traces to STORY.md / data. Digit-leading chapter CSS ids use the escaped
`#\30 5-segments` form. No console.log. Reduced-motion safe. Don't break loved interactions.
