# Z-AXIS-JOURNEY.md — the scroll-through-depth transition model

The next evolution of the journey mechanic. Supersedes the click-Next gating with a
**scroll-driven, z-axis (depth) transition** between full-screen stages. Cinematic, like
flying forward through stacked planes. Build this with one workflow that maximises the transitions.

## 1. The mechanic — FLY THROUGH, never slide
- Scrolling (wheel / trackpad / touch / arrow / space) drives a single **journey progress** value.
- Stages live on a **3D stage** (`perspective` container, ~1000–1200px). At any moment one stage sits
  at `z=0` (focused, full-screen, crisp). As progress advances you FLY FORWARD THROUGH the content:
  - the **current** stage comes TOWARD the camera and you pass THROUGH it: `translateZ` goes
    **positive** (e.g. 0 → +600px), it scales **UP** past the frame, blurs and fades out — like
    flying into and through it. (Not receding small; coming at you and through.)
  - the **next** stage emerges from deep space: `translateZ` from far **negative** (e.g. -1400px) to
    0, scaling up + sharpening + fading in to meet you.
- CRITICAL — it must NOT read as a slide. **ZERO translateX / translateY** between stages; the motion
  is purely on Z (depth) + scale + blur + opacity. You should never see a flat "square" panel sliding
  in from a side; you should feel you are travelling forward through layers. Big perspective, strong Z
  travel and scale so the depth is unmistakable. (Current build reads as a slide — fix to true fly-through.)
- One stage fully resolves before the next; the pass-through is the spectacle.

## 2. Everything fits one screen — no internal scroll
- Each stage is **exactly one viewport** (100svw × 100svh), `overflow: hidden`. Content must FIT
  on the opening screen — no scrolling within a stage. If a stage is too dense to fit, SPLIT it
  into multiple z-stages (see §5) rather than letting it scroll.
- **FULL-BLEED, no edge bands.** The stage ground (warm gradient / cream / navy) fills the ENTIRE
  viewport, edge to edge — there must be NO strip of the cream page-background showing on the
  right, bottom, or any edge (the current empowerment stage leaks a cream band — that is a bug).
  No max-width container that letterboxes the ground; the ground is 100vw × 100vh; only the inner
  CONTENT respects a max-width, never the ground.
- The document does not scroll in the usual sense; scroll input is captured and mapped to journey
  progress (scroll-jacking done well: smooth, eased, never janky; or a tall scroll-spacer per stage
  with `position: sticky` stages + scroll-progress maths — choose the most robust approach).

## 2b. The opening screen tells you to scroll
Because scroll is now the mechanic, the cover must signal it. Replace the old "Begin" button with a
clear, on-brand **scroll cue** — copy like "Scroll to journey through" / "Scroll through the site" —
with a quiet animated indicator (a descending chevron / the orbit bead easing down). It invites the
depth-scroll; it is the only instruction the visitor needs. Keep it understated and premium.

## 3. Keep what works
- The **character-to-title text reveal** (text-scramble / per-glyph assemble) on each stage's title
  when it reaches focus — the client loves it; keep and make it the signature arrival.
- Numbers count up, key lines assemble, on focus. The persistent **you-dot** and the **orbit motif**
  carry through depth as connective tissue.

## 4. Navigation + accessibility
- Primary: scroll / trackpad / touch advances through depth. Also: ArrowDown/Space = forward,
  ArrowUp = back; a subtle progress indicator (the orbit arc) shows position. No top bar.
- Soft, not hard-gated: scrolling always advances (interactions are optional rewards, never trap).
- A stage can optionally "hold" briefly on an interaction (a gentle resistance) but never block.
- **prefers-reduced-motion:** no z-fly / no blur — cross-fade or instant cut between stages; scroll
  still advances stages one at a time. Keyboard fully works. Respect `scroll` accessibility.

## 5. More stages to maximise the experiential
Free to ADD stages/scenes so each beat gets one clean screen and the depth-travel has rhythm:
- Interstitial "depth" moments between chapters (a single line flying toward you, an orbit sweep, the
  maze receding) as palette cleansers — pure transition theatre.
- Split dense chapters into sequential z-stages (e.g. the four baseline stats become four screens you
  fly through; the three twists become three depth-beats; the five moves become five planes).
- The cover and outro can bookend with the strongest depth moments (maze approach in; nation disperses
  into depth out).
Target rhythm: a stage is digestible in one screen; the depth-travel between them is the spectacle.

## 6. Implementation notes (vanilla, performant)
- One `perspective` 3D stage; each stage absolutely positioned, transformed by its own
  `translateZ/scale/opacity/filter` driven by its distance from current progress (a pure function of
  progress → per-stage transform). `will-change: transform, opacity`; transform/opacity/filter only;
  rAF-smoothed scroll value. 60fps.
- Drive from a single scroll/wheel/touch controller OR a sticky-stage + scroll-spacer model — pick the
  one that is smoothest and most robust across trackpad + mouse-wheel + touch; debounce/normalise wheel.
- Re-uses the existing stage content (the brand-world chapters); this is a SHELL + per-stage-fit change,
  not a content rebuild. Each chapter must be made to fit one viewport (tighten where it overflowed).
- Keep js/lib primitives. The journey engine (js/main.js) becomes the z-axis controller.

## 6b. Composition: balance the frame — voids are failures, not "negative space"
A one-screen stage is not "done" just because nothing scrolls. It must be COMPOSED to balance the
whole canvas. The common failure (seen on the segments intro): a title cluster floating lower-right
while the entire top-left is empty ground — that is an accidental VOID, not negative space, and it
reads cheap.
- Use the full frame. Anchor the focal element to a strong grid position and SCALE IT to command the
  space (a hero title should be huge and span the canvas, not sit small in a corner).
- Counter-balance the focal point with the supporting content or a signature motif (the orbit ring,
  the you-dot, the maze, a bear/figure silhouette, a stat) occupying the opposite weight — nothing
  large is left empty by accident.
- Intentional negative space is tight and deliberate around a confident focal point; it is never a
  big blank quadrant. If a region is empty, it must be empty ON PURPOSE and feel composed.
- Eyebrow/standfirst/controls anchor to edges or the grid; the centre is not a dumping ground.
Test each stage: cover it in thirds — is any third doing nothing? If yes, rebalance (scale the focal
element up, move it, or bring a motif/supporting element into the empty weight).

## 7. The test
Does scrolling feel like flying forward through the story in depth? Does every stage sit complete on
one screen with nothing cut off and no scrollbar? Is the title character-reveal the arrival signature?
Is it smooth at 60fps and sane under reduced-motion? Does it feel like an experience, not a webpage?
