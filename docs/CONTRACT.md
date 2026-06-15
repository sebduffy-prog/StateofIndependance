# CONTRACT.md — how to build a chapter

Read this before building any chapter. Also read `docs/DESIGN.md` (the
per-chapter spec) and `docs/STORY.md` (your exact copy + verified stats).

## The three files you write — and ONLY these

For chapter `{id}` (e.g. `05-segments`):

1. `sections/{id}.html` — an HTML **fragment** (no `<html>`/`<body>`),
   with exactly **one root element**: `<div class="chapter-inner">…</div>`.
   Put static markup here; build interactive nodes in JS.
2. `js/sections/{id}.js` — ES module, **default export**
   `init(rootEl, data)`. `rootEl` is `<section class="chapter" id="{id}">`.
3. `css/sections/{id}.css` — **every selector scoped to the chapter id** so
   styles never leak between chapters. (The file is already imported by
   `css/sections.css`.) NOTE: chapter ids start with a digit, and a CSS id
   selector cannot start with a digit — `#01-cover` is invalid and silently
   dropped. Use the escaped form `#\30 1-cover` (`\30 ` = the digit `0`, with
   the trailing space) which keeps id-specificity and matches every existing
   chapter. (Anchors/`href="#01-cover"` and `getElementById` are unaffected —
   only CSS selectors need the escape.)

**Do not edit** any shared file: `index.html`, `css/vccp.css`,
`css/sections.css`, `js/main.js`, `js/lib/*`, `sections/manifest.json`,
`data/*.json`. If you think a shared file needs a change, note it in your
report instead.

## init signature

```js
import { observeReveals } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { horizontalBars, waffleGrid, barGauge, dotField, clusterPoints } from '../lib/charts.js';
import { flipReveal, clickToGuess, dragRank, quiz, pillGroup } from '../lib/interactions.js';

/** @param {HTMLElement} rootEl  @param {{survey,segments,tgi}} data */
export default function init(rootEl, data) {
  const { survey, segments, tgi } = data;          // any may be null — guard it
  if (!survey) return;                              // fail soft
  observeReveals(rootEl);                           // animate .reveal children
  observeCounters(rootEl);                          // animate [data-count-to]
  // build your interactive nodes into rootEl.querySelector(...) targets
}
```

Import paths are **relative to `js/sections/`** → libs are `../lib/x.js`.

## Shared lib API (signatures)

### reveal.js
- `observeReveals(rootEl, { staggerMs?, threshold? })` — fades in every
  `.reveal` inside `rootEl`. Put `data-stagger` on a parent to stagger its
  direct `.reveal` children.
- `prefersReducedMotion()` → boolean.

### counter.js
- `countUp(el, { to, from?, durationMs?, decimals?, prefix?, suffix? })`.
- `observeCounters(rootEl)` — animates declarative
  `<span data-count-to="77" data-count-decimals="1" data-count-suffix="%">`
  the first time each scrolls into view.

### charts.js
- `horizontalBars(container, { items:[{id?,label,pct}], max?=100, accent?:'mustard'|'teal', decimals?=0, highlightId?, animate?=true, labelWidth?=200, ariaLabel? })`
  → `{ el, update(newItems, {resort}) }`. Bars animate on first view; `update` morphs/re-sorts. Value labels render inline at the bar end.
- `waffleGrid(container, { value, total?=100, accent?, ariaLabel? })`
  → `{ el, setValue(v, {animate}) }`. 10×10, each square = 1 in 100.
- `barGauge(container, { value, max?=10, accent?, ariaLabel? })` → `{ el }`. Single score (e.g. NHS 6.42/10).
- `dotField(container, { count, dotRadius?, ariaLabel? })`
  → `{ el, formation(targets), highlight(i, colour), drift(amp), destroy() }`.
  `targets` = array of `{x,y,colour?}` in **0..1** normalised space; dots past the
  list scatter to a faint cloud. Container needs an explicit height (CSS).
- `clusterPoints(n, { x, y, w, h })` → `n` jittered points (0..1) filling a rect; use to place a segment cluster on the 2×2 map.

### interactions.js
- `flipReveal(container, { rows:[{less,more}], fromToLabels?, onFlip? })` → `{ el, flipAll(flipped) }`.
- `clickToGuess(container, { trueValue, max?=100, unit?='%', label, prompt?, onReveal? })` → `{ el, reveal() }`.
- `dragRank(container, { items:[{id,label}], trueOrder:[id...], instructions?, onReveal? })` → `{ el, reveal() }`. Pointer drag + ArrowUp/Down keyboard.
- `quiz(container, { questions:[{id,statement,agree:{x,y},disagree:{x,y}}], onAnswer?, onComplete? })` → `{ el, reset() }`.
- `pillGroup(container, { options:[{value,label}], value?, ariaLabel, onChange })` → `{ el, setValue(v) }`. Radio semantics + arrow keys.

Interaction helpers create their own DOM with class names like `.flip-row`,
`.guess`, `.rank-item`, `.quiz-card`, `.pillgroup-chip`. Style these inside
your `#{id} …` scope. They ship behaviour, not final styling.

## Data shapes (real keys — read the files to confirm)

`data/survey.json` (national): `meta`, `moodOfNation.items[{id,code,label,pct}]`,
`moneySavingMoves.items`, `tradingDownByCategory.items`, `protectedSpend.items`,
`availabilityConcerns.items`, `institutionTrust.{headline,confidenceRanking.items[{id,label,pctConfident,meanScore}],performanceChange.items[{id,label,pctDeclined}]}`,
`aiTasks.{anyTaskPct,highStakesPct,items[{id,label,pct,isHighStakes}]}`.
Every block carries a `source` string — render it as the footnote.

`data/segments.json`: `meta`, `segments[]` each
`{id,name,sharePct,quadrant:{x,y},threeWordDescriptor,heroQuote,longQuote,who,money,spendPriorities,interests[],channels[],aiAttitude,metrics{…}}`,
and `quiz{title,intro,axes:{x:{positive,negative},y:{positive,negative}},questions[{id,statement,agree:{x,y},disagree:{x,y}}],scoring:{quadrantToSegment}}`.
Quadrants: architects = optimistic+proactive, hustlers = pessimistic+proactive,
coasters = optimistic+passive, retreaters = pessimistic+passive. Always display
deck sizes 17/28/27/28.

`data/tgi.json`: `source`, `segments.{architects|hustlers|coasters|retreaters}.{media:[{label,index,pct}],lifestyle:[{label,index,pct}],demographics}`.
Index 100 = UK-adult average; ≥120 over-indexes, ≤80 under-indexes.

## Brand cheat-sheet (full system in css/vccp.css)

- Classes ready to use: `.vccp-card`, `.vccp-rail`, `.vccp-frame`,
  `.vccp-stage-num`, `.vccp-eyebrow`, `.vccp-source`, `.vccp-btn`(`-primary`/`-quiet`),
  `.vccp-table`, `.vccp-stat`(`-label`/`-value`/`-sub`), `.vccp-delta-up`/`-down`,
  `.hl` (highlighter — wrap **one** word: `<em class="hl">independence</em>`;
  `.hl-teal` variant on teal surfaces), `.reveal`.
- Headlines: sentence case, weight 500, **one** `.hl` word (max two per surface).
- Square corners everywhere (nav pill is the only round element — don't add radius).
- No gradients. Up = `--teal-deep`, down = `--mustard-dark` — never red/green.
- Tabular numbers on every stat (`font-variant-numeric: tabular-nums` or `.num`).
- Source caption (`.vccp-source`) bottom-left wherever data shows.
- Mustard is the default surface; teal only on 02-research and 08-playground.
- Logos: `assets/brand/Logo.png`, `Girl_and_Bear.png` — black silhouettes, never
  on mustard (put a paper plate behind), never animated/distorted.

## Hard rules

- Never invent a number. Every value traces to STORY.md or data/*.json.
  58% AI = **any** task; 37% = high-stakes. Don't conflate them.
- Guard for null datasets and empty containers.
- No `console.log` left in. Respect `prefers-reduced-motion` (the libs do).
- Keep each file focused (< ~400 lines). Immutable patterns; descriptive names.
