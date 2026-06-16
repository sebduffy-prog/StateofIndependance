# ART-DIRECTION.md — the premium north star

This is the bar. The State of Independence is a flagship research piece for a major agency.
It must feel like a £100k, art-directed, experiential website — confident, restrained,
cinematic, tactile. Every decision is made deliberately and held to this document. "Clean"
is not the goal; **expensive** is. If a screen could appear in any generic template, it has failed.

## 0. The cheap tells — eliminate every one
These are why work reads cheap. Audit every screen against this list and remove all of them.
- Centred body text, centred everything. (Editorial work is left-aligned, asymmetric, gridded.)
- Uniform even spacing — equal gaps everywhere. (Premium = deliberate spatial hierarchy; big jumps between groups, tight within them.)
- Default/linear easing and arbitrary durations. (Use one considered easing system.)
- Too many elements competing; no single focal point per screen.
- Weak type hierarchy — sizes/weights too close together. (Premium = dramatic contrast: one huge thing, one small thing, nothing in the muddy middle.)
- Charts that look like a default charting library; gridlines, legends, axis clutter, tiny labels.
- Decorative motion that means nothing; motion on everything; bounce/spring used as garnish.
- Low-contrast grey-on-grey, muddy colour, two similar colours touching.
- Cramped margins; content touching edges; no breathing room.
- Filling space for the sake of it. Negative space is a feature, not a vacancy.
- Inconsistent corners, shadows, button styles, label casing across screens.
- Emoji, stock-photo energy, gradients used as "pop", drop-shadows as depth crutch.

## 1. Typographic system (Poppins) — exact
Poppins is geometric and friendly; discipline makes it expensive.
- **Display (the one hero line per screen):** Poppins **900**, size `clamp(3.5rem, 8vw, 8rem)`,
  letter-spacing **-0.03em**, line-height **0.92**, navy on warm. Sentence case for narrative;
  UPPERCASE only for the five-move divider titles and eyebrows. One per screen — never two.
- **Sub-head:** Poppins 600, `clamp(1.5rem, 2.6vw, 2.4rem)`, -0.01em, line-height 1.05.
- **Body / standfirst:** Poppins **400** (500 for standfirst), 1.0–1.25rem, line-height **1.5**,
  measure **52–62ch**, never full width.
- **Eyebrow/kicker:** Poppins 600, 0.78rem, UPPERCASE, letter-spacing **+0.18em**, 0.7 opacity.
- **Numbers:** tabular always. Hero stats are display-scale (the number IS the headline).
- **Rule:** dramatic size contrast. If two text elements are within ~1.4× of each other in size,
  one is wrong. Nothing in the muddy middle.

## 2. Spacing & composition
- 8px base. Vertical rhythm: **tight within a group (8–16px), large between groups (64–128px)**.
  The jump is what reads considered.
- **Asymmetric editorial grid.** Content hangs on a left axis or a clear 2-pane split; never a
  centred column of stacked blocks. One focal point per screen; everything else supports it.
- **Generous, intentional negative space.** Let the warm ground breathe. A screen with one huge
  number, one line, and a lot of space beats a screen full of cards.
- Full-bleed gradient grounds; content held in a max-width inner with real margins
  (`clamp(24px, 5vw, 96px)`). Nothing touches the viewport edge except the ground itself.

## 3. Colour — restraint
- Warm mustard→orange gradient ground dominates (60–70%). Navy = gravity (text, data, the bear).
  Cream = silhouettes. Teal = a single sparing accent (the orbit ring). That is the whole palette.
- **One accent moment per screen.** Never decorate with colour.
- Contrast is non-negotiable: navy on warm, cream on navy. Never two similar values touching,
  never mustard-on-mustard, never grey-on-grey.

## 4. Motion — principled, cinematic
- **One easing system:** entrances `cubic-bezier(0.2, 0.8, 0.2, 1)`; exits `cubic-bezier(0.4, 0, 1, 1)`;
  tactile springs critically damped (no cartoon bounce). Micro-interactions ~180ms; reveals
  600–900ms; nothing snappy-cheap, nothing sluggish.
- **Meaning assembles.** Headlines build, numbers count, the data resolves. Motion carries the idea.
- **One hero motion per screen** (the marquee). Everything else is quiet — subtle parallax, a soft
  arrival, hover/focus that acknowledges. Restraint is the luxury signal.
- 60fps: transform/opacity only. Always a `prefers-reduced-motion` final-state path.

## 5. Data as the hero (not chart-junk)
- No gridlines, no boxed legends, no axis clutter, no chart-library look. Label inline at the point.
- A stat is a moment: huge tabular number + one line + the supporting form, on the open ground.
- Backgroundless. Tracks are a faint ink tint, never a white box. Bars are a last resort — prefer
  the orbit-ring, lollipop, dot, tug-of-war, waffle-of-100, the dot-field, the force-graph.
- The data should feel like a *reality* (a crowd, a place, a person), not a percentage on a chart.

## 6. The signature world (cohesion = expensive)
- The **orbit-circle motif** is the connective signature — a thin teal/cream ring recurs as
  ambient geometry and as the progress meridian. Consistent everywhere.
- The **"you" dot** is born on the cover and travels the whole journey — the single thread that
  makes it one experience, not nine pages.
- The **bear & figure** silhouettes are the emotional motif (scale, agency). Cream, never cheap clip-art.
- The **maze** is the hero logo-moment. Use it with reverence, once, big.
- Every screen must feel unmistakably part of ONE designed system: same corners (square), same
  type rhythm, same motion language, same restraint.

## 7. Per-screen: the one memorable thing
Each step earns its place with a single, considered, marvellous moment — not a busy collage.
- 01 Cover: the maze + orbit + the you-dot born. Quiet, cinematic, huge wordmark, vast space.
- 02 Research: the UK as a real place; cities surface as memories. The map is the hero, alone.
- 03 Baselines: you guess, then the truth lands as a crowd of 100 with your square in it.
- 04 Twists: drag the trust ladder; the holiday physically resists being cut. Tactile.
- 05 Segments: the nation resolves into four; you find yourself among them. The showpiece.
- 06 Empowerment: three needs you pull together until they meet. Tactile, elemental.
- 08 Playground: a calm, precise instrument — the data, beautifully, on demand.
- 07 Moves: a cinematic filmstrip; the five tools you pick up. The payoff.
- 09 Outro: the nation disperses; one line remains. Silence and weight.

## 8. The test
Before any screen is "done": Would this sit on Blue Marine "The Sea We Breathe" or Moooi "Paper
Play"? Is there exactly one focal point? Is the type hierarchy dramatic? Is the spacing deliberate?
Is there breathing room? Is the motion meaningful and singular? Does it look like *only this brand*
could have made it? If any answer is no, it is not done.
