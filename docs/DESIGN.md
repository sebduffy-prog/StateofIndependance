# DESIGN.md — The State of Independence interactive site

One spec, no options. Synthesized from three concept pitches (editorial scrollytelling / maximum-play / gallery). Section builders follow this plus docs/STORY.md (copy + verified stats) and docs/CONTRACT.md (file + lib contract).

## 1. The big idea

**One nation, 1,504 dots — and you are the 1,505th.** The report practises what it preaches: the finding is "they don't want brands to hold their hands, they want brands to hand them the tools", so the site hands the reader the controls — key numbers are guessed, dragged or ranked *before* they're revealed, and a field of 1,504 ink dots (one per respondent) recurs through the chapters, finally resolving into the agency-to-act 2×2 where a quiz drops the reader's own mustard dot among them.

## 2. Global decisions

- **Rhythm**: nine full-viewport chapters (`.chapter`, min-height 100vh), vertical scroll, generous paper between moments. `scroll-margin-top` for the 57px nav. No scroll-snap (free scroll; snap fights long chapters).
- **Progress rail** (left, fixed): girl silhouette static at top, bear static at bottom, nine clickable 01–09 stage chips between them; a flat mustard fill grows top-to-bottom with scroll progress. Marks never animate (brand rule). On <1024px the rail hides; nav pills remain.
- **Surface plan (mustard holds 60–70% site-wide)**: 01 mustard full-bleed · 02 teal research surface (the brand's appendix half, used here and in 08 only) · 03 paper · 04 paper with mustard-pale editorial moments · 05 paper with mustard quadrant accents · 06 mustard-pale · 07 paper with mustard chips/bands · 08 teal-pale research surface · 09 ink full-bleed closing to a mustard back-cover band.
- **Type**: Inter Tight only. Headlines weight 500, sentence case, ending in a period, exactly one `.hl` highlighter word each (from STORY.md). Eyebrows 600 caps letter-spaced. Tabular numbers on every stat.
- **The dot motif**: per-chapter via the shared `dotField`/chart lib — ambient drift on the cover, 100-square waffle in 03, quadrant clusters in 05, quiet disperse in 09. (A single persistent cross-chapter canvas is a stretch goal — do NOT block integration on it; per-chapter instances are the contract.)
- **Guess-before-reveal** is the house interaction grammar: commit first (drag, slider, rank), then the true value animates in; deltas in teal-deep (up/close) and mustard-dark (down/off) — never red/green.
- **Motion**: IntersectionObserver reveals + rAF tweens only. Every animation jump-cuts to its final state under `prefers-reduced-motion`. Every pointer interaction has a keyboard path.

## 3. Per chapter

**01-cover** — Mustard full-bleed, ink frame inset 5%. Eyebrow "VCCP Challenger Series". Headline "The state of *independence*." — highlighter wipes in (scaleX, matching -12deg skew). Ink dots drift at low opacity behind the frame; cursor gently repels them. One dot detaches with caption "This one is you — the 1,505th respondent." Girl_and_Bear.png static on a paper plate, bottom-right inside frame. Square scroll cue button.

**02-research** — Teal surface. Left: counters step up — 1,504 respondents · nat rep · UK adults 18+ · mid-May 2026; plus the qual method (week-long video diaries, early June). Right: flat ink SVG Great Britain silhouette; the 8 cities pin in sequence as square ink markers; click/focus a pin → rail card slides out with city + verbatim diary quote (STORY.md). Teal-deep pulse on the active pin only.

**03-baselines** — "The numbers confirm what you probably already know." One sticky 10×10 waffle (each square = 1 in 100 UK adults — the deck's own device) re-fills across four steps with eased counters: 77 careful → 55 deal-hunting → 60 anxious → 54 trading down. Each step pairs the waffle with its supporting horizontal bars (mood-of-nation % agree; money-saving moves; availability concerns; trading-down categories) from data/survey.json. Before each big number fills, the reader commits a guess on a square-thumb slider; their guess stays as an ink tick beside the truth.

**04-twists** — "There are also some twists in the story." Three exhibits: (a) **Drag-to-rank trust ladder** — seven institution tiles (NHS, banks, public transport, employers, energy, education, government) reordered by drag *or* keyboard (select + arrow keys); on commit, FLIP-animate to the true order with bars 53% → 24% and the 29-point spread annotated; kicker card flips between "most trusted: NHS 6.42/10" and "53% say it has declined" (trust paradox). (b) **The unsqueezable holiday** — a budget-squeeze slider compresses every non-essential block except the 40% ring-fenced holiday block inside a 1.5px ink frame, which resists and snaps back. (c) **AI on tap** — 58% counter (any task) vs 37% (high-stakes), per-task bars, click-to-reveal diary quote cards. Never claim 58% is high-stakes.

**05-segments** — THE SHOWPIECE. "Beyond how they're feeling, into what they're doing about it." Axes draw in as ink hairlines (pessimistic↔optimistic × passive↔proactive); the dot field migrates into four proportional clusters — Architects 17 / Hustlers 28 / Coasters 27 / Retreaters 28 — percentages counting up as dots land. Click/arrow into a quadrant → others dim, full profile rail card (descriptor, hero quote, who/money/essentials, interests, channels, AI attitude from data/segments.json). Then the **"Which segment are you?" quiz** (5 questions from segments.json): each answer visibly nudges a live mustard dot across the map; result lands the dot in a quadrant with your segment card vs the nation's 17/28/27/28.

**06-empowerment** — "The empowerment architecture." Three giant sheared panels (skewX -12deg — the highlighter motif at architectural scale) labelled save me MONEY / save me TIME / save me STRESS, overlapping venn-style at centre where *empowerment* sits highlighted. Hover/arrow expands one panel (~60% width, flex transition) revealing its argument line; the deck's hidden truth: money is obvious — time and stress carry more premium value. Above: survival-mode → active-agency reframe as a two-panel before/after with draggable divider.

**07-moves** — "Five signature moves." Sticky left rail of mustard stage chips 01–05; each move a full-width band: chip + title + lesson sentence + the less→more table as **split-flap flip rows** (click or space: grey struck-through "less" flips to mustard ink-bordered "more", staggered like a departure board) + deck quote + brand examples (02: Nationwide, M&S, Boots; 05: Vinted; 04: sandwich-generation stats 87/58/31/12, Killik & Co 2025).

**08-playground** — Teal-pale surface, "Make your own cut." Two-pane vccp-shell: left rail picks a metric battery (mood / money-saving moves / trading down / protected spend / institutional confidence / AI tasks) and a segment filter (All + 4 segments where splits exist in segments.json metrics — label honestly when a view is national-only). Right canvas: one horizontal bar chart that MORPHS between cuts (bars re-sort, grow, relabel). Second panel: TGI media-channel indexes per segment with an index-100 reference line (data/tgi.json). Source captions mandatory.

**09-outro** — Ink full-bleed (paper-on-ink). Dots disperse upward and off; the Martin Lewis quote builds word-by-word: "They do not want brands to hold their hands. They want brands to hand them the *tools*." (BBC Sounds, February 2026). Five-moves recap as clickable index jumping to 07. Team credits (Michael Lee, Stefan Siedentopf, Jenny Nichols, Will Parrish, Ellie Gauci). "Making the most of the data" CTA card. Mustard back-cover band: ink frame, Logo.png on paper plate, © VCCP Media 2026.

## 4. Interaction inventory (shared lib)

- `counter` — eased count-up, tabular-nums, reduced-motion safe.
- `reveal` — IntersectionObserver entrance + stagger.
- `waffle` — 10×10 grid, animated re-fill between values.
- `barChart` — horizontal SVG bars, mustard fill, ink stroke, value labels at bar end, morph/re-sort on data swap.
- `dotField` — canvas-2D particle field: ambient drift, target-formation tween (clusters, quadrants, disperse), single highlight dot.
- `flipReveal` — split-flap less→more rows; also the trust-paradox card flip.
- `clickToGuess` / `dragRank` — commit-then-reveal slider + rankable tile list (keyboard path required).
- `sliderFilter` — pill/slider control wiring for the playground morphs.
- `quiz` — 5-question flow scoring x/y, emits position for the segment map.

## 5. Hard don'ts (from the brand skill)

Title Case anywhere · gradients · border-radius outside the nav pill · red/green semantics · any font but Inter Tight · logo recoloured, animated, or on mustard · highlighter on >1 word per phrase or >2 per surface · pie/donut charts · boxed chart legends (label inline) · mustard text on teal or vice versa · missing source captions · non-tabular stat digits · fabricated numbers (everything traces to STORY.md / data/*.json; deck wins conflicts; 58% AI = any task, 37% = high-stakes).
