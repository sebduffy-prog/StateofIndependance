# STRUCTURE-V2.md — the expanded journey (from client review 2026-06-17)

The journey grows from 9 chapters to ~16+ STEPS, each a full-screen, full-bleed Z-axis stage
(see Z-AXIS-JOURNEY.md). Every step: fills the viewport, NO dead space, NO cream edge band,
deck design components (assets/brand-final/ per BRAND-WORLD-FINAL.md), a sexy depth transition
between steps, the character→title reveal, and an interaction. WLV-voice copy (SEBSKILLS
strategy/WLV). Verified data only.

## FINAL POLISH PASS (do LAST — after all step content + cleanups land)
- "DRAG LEFT TO CUT" interaction is RUBBISH — rework or remove it (likely the budget-cut / ring-fence
  drag on the protected-joy twist, or wherever a drag-to-cut appears). Replace with a cleaner beat.
- TRANSITIONS: slow them down and make them more ARTISTIC / cinematic (longer durations, refined
  easing, more crafted depth choreography per Z-AXIS-JOURNEY.md §timing). Not abrupt.
- Sequence: this pass runs AFTER the content build (w7662o00e) + the you-dot/step-2/map-dot cleanups.

## Content + transition notes (2026-06-17 review)
- THE "YOU" DOT must NOT float randomly in dead space (e.g. the lone yellow dot on step 3). Engine:
  show the you-dot ONLY on steps that provide a meaningful [data-youdot-anchor]; on steps without one
  it is hidden (display:none / opacity 0), never parked in empty grid.
- STEP 2 (research map): remove the scattered/ambient dots around the UK map — the navy map + its 8
  city markers are the ONLY elements; no stray dot-field/orbit-seed clutter around it.
- REMOVE the **Nationwide** case study/example from the trusted-antidote move (keep M&S / Boots).
- Transitions must be a true **fly-THROUGH depth** (Z + scale + blur only, zero X/Y) — they currently
  read as slides. See Z-AXIS-JOURNEY.md §1.
- Maximise the experiential feel; every step fits one page, no overlaps, no white space.

## Global fixes (apply everywhere)
- FULL-BLEED: ground fills 100vw×100vh, no cream/page band on right/bottom (current bug). No
  "page grid"/orbit artifact left floating in empty space.
- NO DEAD SPACE / balanced composition (Z-AXIS §6b): focal element scaled to command, counter-
  weighted; no empty quadrants. The "cover-it-in-thirds" test.
- NO yellow-on-yellow / low-contrast: navy on warm, cream on navy; never amber-on-amber.
- One screen per step; split anything that overflows.
- Transitions between every step (Z-axis depth); the character→title reveal on arrival.

## The step list (target order, ~16+)
1. **Cover** — maze + orbit + you-dot born; scroll cue ("Scroll to journey through").
2. **Research** — UK map. FIX: city dots must sit ACCURATELY on their cities (recalibrate), and
   the active/"you" marker must not overlap a city dot into a blob. Connecting ritual; city → quote.
3. **Baselines: careful (77%)** — guess-then-reveal; FIX the right-hand dead space + orbit-grid void.
4. **Baselines: the rest** (deal-seeking / anxiety / trading-down) — split so each fits one screen
   (or a tight set), no overflow.
5. **Twists intro** — "There are twists in the story" must be ONE page (currently the intro + first
   twist overflow into a split). Fit the intro + the 3 anomaly headlines on one screen.
6. **Twist 1 — trust paradox** (drag-rank, own screen). 7. **Twist 2 — protected joy** (ring-fence).
   8. **Twist 3 — AI on tap**. Each its own full screen + interaction.
9. **Segments intro** — "Britain resolves into four": the 2×2 agency compass resolve as the intro,
   with a SEXY transition animation. FIX the yellow-on-yellow + the dead space.
10–13. **One step PER SEGMENT** (Architects / Hustlers / Coasters / Retreaters) — each its own
   full-screen profile (descriptor, quote, who/money/AI, deck components), a transition between them.
14. **GraphRAG explorer — its OWN step.** The segment force-graph (js/lib/segment-graph.js), designed
   per SEBSKILLS audience-segmentation + data-analysis (no literal "graphrag" skill exists). Make it
   genuinely explorable: bring in the TGI STATEMENTS (extract from the three Desktop TGI xlsx:
   Lifestyle, Media_Consumption, Demographics) so the visitor explores each segment by its
   distinctive TGI statements (indexed). Multiple ways to explore.
15. **Empowerment** — money/time/stress tactile venn. FIX the massive RHS dead space; add a
   transition; rewrite the copy in WLV voice. Pivot wipe survival→agency.
16. **Data explorer (TGI on demand)** — fill the screen; full TGI data viewability with **5 ways to
   view the same data**: bar, lollipop/dot, venn, and 2 more (e.g. waffle, orbit-ring, proportion,
   slope) — a chooser to switch viz. Metric + segment filters. Deck components.
17–21. **The five MOVES — one step EACH** (Unplug / Be the trusted antidote / Ride the self-help
   wave / Kill the mental load / Boost good behaviours). Each: deck design components (move icons +
   bold Poppins title + cream editorial cards), a transition between them, AND an interaction per
   move (e.g. flip the less→more, pull the plug, ring-fence, toolkit pick-up).
22. **Outro** — the close + the Martin Lewis line + a clear **"Thank you"** + credits + grounded
   back-cover.

(Exact numbering flexes; the point: segments → per-segment steps, graphrag own step, moves → 5 steps,
plus a Thank You. ~16-22 steps total.)

## TGI explorability (steps 14 + 16)
Extract the distinctive TGI statements per segment from the three Desktop xlsx (Lifestyle, Media,
Demographics) into a data file (e.g. data/tgi-statements.json): per segment, the top over-/under-
indexing statements (statement + index). Use them in the graphrag explorer (explore a segment by what
it over-indexes on) and the data explorer (view TGI by segment, 5 viz options).

## Skills to use
- SEBSKILLS strategy/WLV — all copy voice (esp. empowerment rewrite).
- SEBSKILLS strategy/audience-segmentation + data-analysis — the graphrag/explorer interface + TGI cuts.
- SEBSKILLS frontend-and-design/frontend-design + vccp-media-design — craft + brand.
- BRAND-WORLD-FINAL.md, ART-DIRECTION.md, Z-AXIS-JOURNEY.md — the bars.

## Build approach (resilient — infra has been rate-limiting)
This is large. Build in SEQUENTIAL workflows, never concurrent: (A) data + shell — extract TGI
statements + build the Z-axis depth-scroll engine + expand the manifest to the new step list;
(B) the new/split steps in parallel (segments per-segment, twists split, moves per-move, graphrag,
data explorer); (C) the elevation/critic + map-dot fix + full-bleed/no-deadspace sweep. Each step
gets the full bar.
