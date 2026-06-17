# EXPERIENTIAL-IDEATION — a marvellous menu for "The State of Independence"

A brainstorm for the client + build team. **Ideation only — no code is changed by this doc.**
The goal: a rich well of experiential components and interactions, in the calibre of the two
reference sites the client loves, every one derived from the deck's content and feasible in the
site's stack (static, vanilla ES modules, SVG/canvas/CSS, no framework).

The site is becoming a **gated full-screen journey**: click Next, ~15 minutes, ~16 interactions,
one chapter visible at a time (engine in `js/main.js`, gate/ready locking, per-step `data.journey`).

References studied:
- **Blue Marine — "The Sea We Breathe"** (`bluemarinefoundation.com/the-sea-we-breathe`) — cinematic immersive scrollytelling.
- **Moooi — "Paper Play"** (`moooi.com/eu/paper-play`) — playful, tactile, hover/drag interactive.

> Fetch note: both pages are heavy client-rendered apps and returned thin server-side HTML, so
> the DNA below is distilled from what did surface (staged "Connecting… / Searching…" reveals,
> opt-in ambient audio, breathe-with-the-waves pacing, "Scroll to see more", lamp on/off
> hover-state pairs, physics-grounded shadows, generous whitespace) plus their well-known character.

---

## 1 · Reference DNA — the craft principles to emulate

Distilled to concrete, copy-able rules. These are the bar every component below is judged against.

**From Blue Marine (cinematic, immersive, slow):**
1. **Anticipatory staging.** Nothing arrives instantly. A short "loading as ritual" sequence
   (Detail: connecting… / Location: searching…) primes attention before the payload. → Our chapter
   transitions should *arrive*, not cut.
2. **Embodied pacing.** "Breathe in time with the rolling waves" — the interface sets a slow,
   physiological tempo. One beat per idea. → Resist density; let a single stat own a full screen.
3. **Scroll/step is the storyteller.** Meaning *assembles* as you advance — type builds, numbers
   count, layers settle — rather than being shown pre-built. → Tie every reveal to the Next beat.
4. **Aggressive negative space.** Each idea stands isolated with breathing room; impact comes from
   restraint, then a single bold moment. → Full-bleed grounds, one hero element, vast margins.
5. **Data as concrete achievement, not abstract metric.** "444,916 km²" reads as a *place*, not a
   number. → Frame our stats as lived reality ("77 of every 100 people you pass today…").
6. **Opt-in ambient sound, never autoplay.** Sound is offered, curated, low, and dismissible. →
   A single global, off-by-default ambient/cue layer; respects the mute.

**From Moooi Paper Play (playful, tactile, rewarding):**
7. **Tactility is the reward.** Things want to be touched — drag, toggle, push — and respond with
   physics. → Draggable objects with weight, snap, and spring.
8. **Hover/active state PAIRS.** Lamp off ↔ lamp on; the delight is in the flip the visitor causes. →
   Build before/after into objects so the *visitor* triggers the change.
9. **Physics-grounded materiality.** Real shadows, real weight; digital objects feel like things on a
   table. → Soft contact shadows, inertia, settle — not linear CSS tweens.
10. **Discovery over instruction.** Little is labelled; exploration is rewarded. → Earn the reveal;
    minimal chrome; the interaction explains itself.
11. **Playful restraint.** Toy-like, but on a calm, sophisticated palette with quiet type. → Keep
    VCCP's flat/square, Poppins, mustard·teal·navy·cream — playfulness in *motion*, not decoration.

**Shared, and non-negotiable for us:**
12. **One unforgettable moment per chapter.** Not scattered micro-interactions — a single
    well-orchestrated beat (frontend-design skill: "one well-orchestrated page load beats scattered
    micro-interactions").
13. **Premium = restraint + finish.** Square corners (only the nav pill rounds), no pie/donut, no
    mustard-on-mustard, tabular numerics, flat colour, generous space. Motion does the luxe work.

---

## 2 · The menu — categorised components (NEW vs ELEVATE)

~30 ideas. Each: **what deck moment/stat · what the visitor does · why it's marvellous · feasibility.**
Feasibility notes name the existing lib that already does ~80% of the work where possible
(`charts.js`, `segment-graph.js`, `venn.js`, `counter.js`, `reveal.js`, `experiential.js`,
`interactions.js`) or the SEBSKILLS effect to port.

### (a) Hero · ambient · connective tissue

**A1 — The persistent "you" dot** *(NEW)*
Deck: the whole "Active Agency" thesis — *you* are one of the 1,504. Visitor: a single cream dot
(their avatar) is born on the cover from the dot-field, and travels with them between chapters,
landing into each data field as "you are here." Marvellous: turns an abstract survey into a personal
journey; the Blue Marine "embodied" principle made literal. Feasibility: reuse `dotField` +
`clusterPoints`; one shared `<svg>` dot positioned per chapter via `experiential.js` progress. Medium.

**A2 — Cursor-reactive orbit field** *(ELEVATE — orbit-ring already exists)*
Deck: the brand orbit ring (maze-hero, ground-blue-orbit). Visitor: ambient particles/ring on hero +
chapter beds gently lean toward the cursor (desktop) or device tilt (mobile). Marvellous: the world
feels alive and aware, Moooi-style, without a single label. Feasibility: extend `orbitRingChart` /
`dotField.setPointer` (pointer hook already exists); pure transform, rAF-batched. Low–medium.

**A3 — Chapter "arrival" transition** *(ELEVATE — `chapterTransition` exists)*
Deck: the maze-hero + bear-world motif set. Visitor: each Next triggers a brief staged arrival —
ground wipes in, a bear-world motif settles, the headline assembles — Blue Marine's "connecting…"
ritual. Marvellous: makes 16 steps feel like chapters of a film, not slides. Feasibility:
`chapterTransition` supplies `--enter`; CSS owns clip-path/mask reveal per chapter ground. Low.

**A4 — Title that assembles** *(NEW — port `text-scramble`)*
Deck: every chapter headline (sentence-case, one highlighter word). Visitor: on arrival the headline
decrypts/settles into place; the highlighter word lands last. Marvellous: type *becomes* meaning
(Blue Marine). Feasibility: port SEBSKILLS `text-scramble` to vanilla; gate to one headline per
chapter, reduced-motion = instant. Low.

**A5 — The orbit progress meridian** *(NEW)*
Deck: orbit ring as brand spine. Visitor: instead of "Step 4 of 16", a thin orbit arc fills around a
corner as the journey advances — a quiet completion ring. Marvellous: replaces utilitarian chrome with
brand-world finish. Feasibility: one SVG arc driven by journey index in `main.js`. Low.

**A6 — Ambient sound + cue layer** *(NEW)*
Deck: tonal shift survival-mode → active-agency. Visitor: opt-in (off by default) low ambient bed that
warms from tense (storm) to open (orbit) across the journey; soft tick on commit/reveal. Marvellous:
Blue Marine's signature embodiment. Feasibility: tiny WebAudio module, single mute control, localStorage,
honour reduced-motion/`prefers-reduced-transparency`. Medium (taste-sensitive — ship last).

### (b) Tactile · draggable (Moooi-style)

**B1 — Trace-the-maze cover** *(ELEVATE — cover maze exists)*
Deck: maze-hero signature (figure at entrance, bear cresting, orbit). Visitor: drag the cream figure
to *trace a path* through the maze to begin — the act of starting = taking control. Marvellous: the
thesis is the first thing your finger does. Feasibility: SVG path + pointer drag with snap-to-path;
keyboard = arrow-to-advance. Medium.

**B2 — Ring-fence the holiday** *(NEW)*
Deck ch04.2 — **40%** protect the holiday budget "at all costs" (slide 85: FLEXIBLE SPEND ↔ RING-FENCED
HOLIDAY). Visitor: drag a lasso/fence around the "holiday" object among wobbling spend items; once
ring-fenced it stops shaking while the rest keep trembling. Marvellous: literal "sacrosanct"; pure
Moooi tactility. Feasibility: draggable SVG loop + hit-test; `proportionStrip` for the 40/60 reveal. Medium.

**B3 — Shrinking basket** *(NEW)*
Deck ch03.4 — **54%** trade down groceries (TRADING DOWN 54 / HOLDING BASKET 46). Visitor: a basket of
branded items; drag items out / swap to own-label and watch the total drop; release to reveal the 54%.
Marvellous: "intent becomes action" enacted by hand. Feasibility: draggable tiles + live total; reveal
via `proportionStrip` / `horizontalBars`. Medium.

**B4 — Pull the plug** *(NEW)*
Deck Move 01 "Unplug them from the grid" — **34%** use tools to fix problems themselves; "at the mercy
of inflation/energy/policy". Visitor: drag a plug out of a socket wired to "broken systems"; it
disconnects with a satisfying snap and the "self-reliance" meter rises. Marvellous: the move's verb,
felt. Feasibility: draggable plug + spring snap-back if not pulled far enough; `barGauge` for the meter. Medium.

**B5 — Drag-rank who shows up** *(ELEVATE — `dragRank` exists)*
Deck ch04.1 — trust spread **53% → 24%**, NHS top, Government bottom. Visitor: drag institutions into
the order they *think* Britain trusts, then tiles snap to truth with "spot on / N off." Marvellous:
commit-then-reveal; humbling. Feasibility: `interactions.dragRank` already built — wire Q7 data. Low.

**B6 — Tug-of-war: survival vs agency** *(ELEVATE — `tugOfWar` exists)*
Deck slide 25 hinge — Survival mode ↔ Active agency. Visitor: drag the rope; the data resists and pulls
back toward "active agency" (the true story), landing on the pivot copy. Marvellous: the deck's central
reframe as a physical contest. Feasibility: `charts.tugOfWar` exists; add pointer drag + spring. Medium.

**B7 — Weigh the three needs** *(NEW)*
Deck ch06 — Save me MONEY · TIME · STRESS (premium truth: time/stress > money). Visitor: drop the three
onto a balance; money feels light, time/stress drop heavy — the scale tips against expectation.
Marvellous: makes the counter-intuitive insight *physical*. Feasibility: SVG seesaw + weighted settle;
Q14 support data (38.8/24/27.7). Medium.

**B8 — Sticky note declutter (mental load)** *(NEW)*
Deck Move 04 "Kill the mental load"; sandwich gen **87/58/31/12**; "really overwhelming." Visitor: a
cluttered board of life-admin sticky notes; sweep/drag them away to clear the head; the board lightens
and breathes. Marvellous: catharsis you cause. Feasibility: draggable notes + inertia fling; reduced-motion
= fade. Medium.

### (c) Data-as-experience

**C1 — Guess-the-number, then reveal** *(ELEVATE — `clickToGuess` exists)*
Deck ch03 baselines — **77%** careful / **60%** anxious / **55%** deal-seek. Visitor: slider guess →
lock in → truth + delta. Marvellous: makes the "numbers you already know" land by testing the visitor's
intuition first. Feasibility: `interactions.clickToGuess` built. Low.

**C2 — 100-in-100 (isotype waffle)** *(ELEVATE — `waffleGrid` exists)*
Deck slide 81 — "each square = 1 in 100 UK adults," **55%**. Visitor: a 10×10 grid fills to the stat as
they advance; their "you" dot (A1) is one square. Marvellous: Blue Marine "concrete not abstract" — a
crowd, not a percentage. Feasibility: `charts.waffleGrid.setValue` built; tie to scroll/Next. Low.

**C3 — The agency compass (2×2)** *(ELEVATE — quiz + compass)*
Deck ch05 — Architects 17 / Hustlers 28 / Coasters 27 / Retreaters 28 on pessimistic↔optimistic ×
passive↔proactive. Visitor: answer a few agree/disagree statements; their dot lands in a quadrant and
the matching segment lights. Marvellous: "which Britain are you?" — personal stake in the data.
Feasibility: `interactions.quiz` (x/y accumulator) + SVG quadrant; built pattern. Low–medium.

**C4 — Living segment force-graph** *(ELEVATE — `segment-graph` exists)*
Deck ch05/ch08 — four segments × attributes/indices. Visitor: pick a segment hub; satellites of
behaviours/AI-use spring out, over/under-index sized live. Marvellous: GraphRAG-style breathing network,
premium and exploratory. Feasibility: `segmentGraph` factory built with force physics. Low.

**C5 — Slope of slipping trust** *(ELEVATE — `slopeChart` exists)*
Deck ch04.1 — NHS most-trusted (6.42/10) yet **53%** say it declined; Government bottom on both.
Visitor: hover/step an institution; a slope connects "trusted to show up" → "say it's got worse," the
paradox drawn as a falling line. Marvellous: two truths side by side in one gesture. Feasibility:
`charts.slopeChart` + `dotPlot`; Q7/Q8C data. Low.

**C6 — Human ↔ AI substitution strip** *(NEW — `proportionStrip` exists)*
Deck ch04.3 — **58%** used AI instead of a professional (37% high-stakes). Visitor: a HUMAN/AI bar; toggle
finance·health·legal and watch the AI share advance, gatekept expertise dissolving. Marvellous: "a prompt
away," shown shifting. Feasibility: `charts.proportionStrip.update` + `pillGroup` toggles. Low.

**C7 — The 29-point spread** *(NEW — `lollipopChart`/`dotPlot` exist)*
Deck slide 15 — **53% → 24%**, "29-point spread in who Britain trusts." Visitor: a single horizontal
gap visibly stretches from NHS to Government as the chapter arrives. Marvellous: one number (29) made
spatial. Feasibility: `charts.dotPlot`/`lollipopChart`; animate the gap on `--enter`. Low.

**C8 — Count-ups as count-downs** *(ELEVATE — `counter.js` exists)*
Deck Move 04 — telephone 71 yrs / electricity 62 yrs vs ChatGPT **2 months** to 100M. Visitor: three
counters race; ChatGPT's finishes almost instantly while the others crawl — the velocity is the point.
Marvellous: pacing carries the meaning. Feasibility: `countUp` with staggered durations. Low.

**C9 — Availability anxiety heat** *(NEW — `horizontalBars` exists)*
Deck ch03.3 — concern about fuel 44.8 / food 36.8 / medicine 33.4 / tech 13.9. Visitor: bars warm from
calm to storm intensity by value (using `ground-storm`). Marvellous: anxiety you can feel, not just read.
Feasibility: `horizontalBars` + per-bar warmth class. Low.

### (d) Narrative reveals (Blue Marine cinematic)

**D1 — "Connecting to Britain…" intro ritual** *(NEW)*
Deck ch02 — 1,504 respondents, 8 cities, week-long diaries. Visitor: a brief staged boot — *Sampling
1,504 voices… · Eight cities… · Listening…* — dots converging into the field. Marvellous: Blue Marine's
anticipatory staging; sets the meditative tempo. Feasibility: scripted text + `dotField.formation`;
skippable, reduced-motion instant. Low–medium.

**D2 — The pivot wipe (survival → agency)** *(NEW)*
Deck slide 25 — "battening down hatches" → "opening the door, walking into the storm." Visitor: as they
advance, a storm ground (`ground-storm`) wipes away to an open orbit ground; copy reframes the whole
thesis. Marvellous: the deck's emotional hinge as a single cinematic beat. Feasibility: `chapterTransition`
+ clip-path crossfade between two grounds; `bear-box-scene`/`ground-blue-orbit` assets exist. Medium.

**D3 — Quote-as-spotlight** *(NEW)*
Deck — the verbatim qual quotes (Southampton 63; London 42; Bury 39…). Visitor: on a near-black navy
ground (`ground-navy-velvet`) a quote types/fades in, attribution last, everything else dimmed. Marvellous:
the "why" gets full cinematic space — restraint as luxury. Feasibility: `reveal.js` + optional
`text-scramble`; CSS spotlight vignette. Low.

**D4 — Stat that fills the screen** *(NEW)*
Deck — hero stats (77 / 60 / 54 / 40 / 58). Visitor: one giant Poppins-900 number count-ups full-bleed,
standfirst beneath, nothing else. Marvellous: Blue Marine "one idea per screen" at maximum scale.
Feasibility: `countUp` + type scale; pure CSS. Low.

**D5 — Five-move filmstrip build** *(ELEVATE — `flipReveal` exists)*
Deck ch07 — five moves, each a Less→More table (Escalating charges→Hacking the system, etc.). Visitor:
advance through five beats; each move's rows flip Less→More on commit, building the playbook. Marvellous:
the strategy *constructs* itself. Feasibility: `interactions.flipReveal` per move; `scrollScene` to
sequence. Low.

**D6 — Map of the eight cities** *(ELEVATE — UK map exists)*
Deck ch02 — Cardiff, Bury, Watford, Southampton, Glasgow, Bristol, Wigan, London. Visitor: pins light in
sequence; hover a city → its qual quote. Marvellous: grounds the national claim in real places (Blue
Marine "concrete geography"). Feasibility: extend existing UK map SVG + quote tooltips. Low–medium.

**D7 — Institutions ▸▸▸ Individuals** *(NEW)*
Deck slide 75 / outro — "Institutions >>>> Individuals"; Martin Lewis "hand them the tools." Visitor: the
arrow motif animates power flowing from institution blocks to a field of individual dots (incl. their
"you" dot). Marvellous: the thesis resolved in one closing image. Feasibility: SVG flow + `dotField`. Medium.

### (e) Micro-interactions & finish

**E1 — Magnetic Next / CTA buttons** *(NEW — port `magnetic-button`)*
Visitor: Next and key CTAs lean toward the cursor and snap back. Marvellous: Awwwards-grade tactility on
the one control they use 16 times. Feasibility: port SEBSKILLS `magnetic-button` to vanilla; desktop only,
reduced-motion off. Low.

**E2 — Custom blend cursor** *(NEW — port `magnetic-cursor`)*
Visitor: a cream dot cursor (sibling to the "you" dot) grows over interactive things, shrinks on press,
inverts via mix-blend-mode. Marvellous: signals "this whole thing is touchable" (Moooi). Feasibility:
port `magnetic-cursor`; pointer-fine only; never hides native cursor for a11y fallback. Low–medium.

**E3 — Commit haptic-feel motion** *(NEW)*
Visitor: every "lock in / reveal / flip" gets a tiny spring overshoot + soft contact-shadow press +
(opt-in) tick. Marvellous: rewards the act of deciding — Moooi's physics reward. Feasibility: shared CSS
keyframe utility + optional `navigator.vibrate` on touch. Low.

**E4 — Step transition choreography** *(ELEVATE)*
Visitor: outgoing chapter recedes/dims as incoming arrives (not a hard hide-swap). Marvellous: filmic
continuity between the 16 beats. Feasibility: small crossfade in `main.js showStep` + CSS; respect
reduced-motion. Low.

**E5 — Hover-state PAIRS on data marks** *(NEW)*
Deck — any segment chip / institution / item. Visitor: hovering a mark reveals its "other state"
(off↔on, before↔after) — the Moooi lamp principle. Marvellous: discovery is rewarded everywhere quietly.
Feasibility: CSS `:hover`/`:focus-visible` paired states; data already in libs. Low.

**E6 — Highlighter word draw-on** *(ELEVATE)*
Deck — STORY.md's one-highlighter-word-per-headline rule. Visitor: the highlighter fill *paints* across
the key word as the headline settles. Marvellous: brand signature, animated with restraint. Feasibility:
CSS `background-size` transition on `--mustard-light`/`--teal-light`; reduced-motion = static. Low.

### (f) The five actions as objects/toys (the toolkit close)

**F1 — The toolkit wall** *(NEW)*
Deck ch07/outro — five moves; "hand them the tools." Visitor: a pegboard of five tool-objects (plug-puller,
trust-badge, self-help-compass, mental-load-broom, habit-streak); pick one up to flip its Less→More.
Marvellous: the strategy literally becomes a set of tools you can hold (Moooi tactility + Martin Lewis line).
Feasibility: draggable/clickable tiles + `flipReveal`; one shared object component. Medium.

**F2 — Hack-the-system dial** *(NEW)*
Deck Move 01 — Less "Escalating charges / Prison / Reinforcing unfair" → More "Hacking the system / Hotel /
Fighting for change." Visitor: turn a dial from dependence to agency; the three rows flip together at the
threshold. Marvellous: one gesture commits the whole move. Feasibility: draggable rotary or slider →
`flipReveal.flipAll`. Medium.

**F3 — Trusted-alternative badge flip** *(NEW)*
Deck Move 02 — Nationwide / M&S / Boots; Opaque→Transparent. Visitor: flip brand cards from "opaque" to
"transparent" (the card literally goes see-through to show the honest version). Marvellous: the value made
material. Feasibility: CSS 3D flip + backdrop-filter; `evidence-nationwide` asset exists. Low–medium.

**F4 — Self-help feed scrubber** *(NEW)*
Deck Move 03 — "self-help manuals live on platforms where context is king"; YT/TikTok/MSE walk-throughs.
Visitor: scrub a faux feed from "broadcast to audiences" to "self-help contexts"; the content morphs.
Marvellous: the media shift, shown. Feasibility: horizontal scrub + crossfading cards; `pillGroup` fallback.
Medium.

**F5 — Habit streak ring** *(NEW)*
Deck Move 05 "Boost good behaviours" — Vinted; gamify goals, meaningful rewards. Visitor: complete a tiny
streak (tap three days); a reward ring fills and a meaningful reward (not random) lands. Marvellous: the
move demonstrated by doing it. Feasibility: SVG ring + `countUp`; small state machine. Low–medium.

**F6 — Build-your-own-brief export** *(NEW — stretch)*
Deck slides 76–77 — "making the most of the data," dashboard/custom report CTA. Visitor: the choices they
made through the journey (their segment, their guesses, the moves they flipped) compose a one-screen
"your brief" to screenshot/share. Marvellous: the journey pays off with something personal to take away.
Feasibility: collect journey state in `main.js`; render a summary card. Medium (data already in-session).

---

## 3 · Recommended FINAL 16 — the journey's interaction spine

Ordered to the chapter flow, each carrying its deck stat. Chosen for *most marvellous × most feasible*,
and for variety of register (tactile / data / cinematic) so no two consecutive beats feel the same.

| # | Chapter | Component | Carries |
|---|---------|-----------|---------|
| 1 | 01 Cover | **B1 Trace-the-maze cover** (+ A1 "you" dot born here) | The thesis: starting = taking control |
| 2 | 02 Research | **D1 "Connecting to Britain…" ritual** → **D6 eight-city map** | 1,504 respondents · 8 cities · 1-week diaries |
| 3 | 03 Baselines | **C1 Guess-the-number** | 77% more careful with money |
| 4 | 03 Baselines | **C2 100-in-100 waffle** (your dot is one square) | 55% shop around / deal-seek |
| 5 | 03 Baselines | **B3 Shrinking basket** | 54% trading down groceries |
| 6 | 04 Twists | **B5 Drag-rank who shows up** | Trust spread 53% → 24% (NHS → Gov) |
| 7 | 04 Twists | **C5 Slope of slipping trust** | NHS 6.42/10 yet 53% say it declined |
| 8 | 04 Twists | **B2 Ring-fence the holiday** | 40% protect the holiday "at all costs" |
| 9 | 04 Twists | **C6 Human↔AI substitution strip** | 58% used AI instead of a professional |
| 10 | 05 Segments | **C3 Agency compass quiz** (which Britain are you?) | 17 / 28 / 27 / 28 across the 2×2 |
| 11 | 05 Segments | **C4 Living segment force-graph** | Per-segment behaviours & indices |
| 12 | 05→06 Pivot | **D2 The pivot wipe** (+ **B6 tug-of-war**) | Survival mode → Active Agency |
| 13 | 06 Empower | **B7 Weigh the three needs** | Save me money / time / stress (time+stress > money) |
| 14 | 07 Moves | **D5 Five-move filmstrip** (flip Less→More) | The five signature moves |
| 15 | 07 Moves | **F1 Toolkit wall** (pick up a tool) | "Hand them the tools" — 34% already self-fixing |
| 16 | 09 Outro | **D7 Institutions ▸▸▸ Individuals** (+ D3 Martin Lewis quote) | "They want brands to hand them the tools" |

Threaded throughout (connective tissue, not counted as steps): **A1** persistent you-dot, **A3/E4**
chapter arrivals, **A4/E6** assembling headlines + highlighter draw-on, **A5** orbit progress meridian,
**E1/E2/E3** magnetic buttons + cursor + commit feel, **A6** opt-in ambient sound.

*(Chapter 08 Playground stays the explorable data appendix outside the 16-step spine — it reuses C4 + C6
+ the chart factories.)*

---

## 4 · Production notes

**Reuse existing libs (already ~built — wire data + polish):**
- `interactions.js` → C1 (clickToGuess), B5 (dragRank), C3 (quiz), D5/F-flips (flipReveal), pillGroup toggles.
- `charts.js` → C2 (waffleGrid), C5 (slopeChart/dotPlot), C6 (proportionStrip), C7 (lollipop/dotPlot),
  C8 (counter), C9/D4 (horizontalBars/counter), B6 (tugOfWar), A2 (orbitRingChart/dotField), A1 (dotField).
- `segment-graph.js` → C4 (force-graph) — done, just select wiring.
- `counter.js` → C8, D4, F5. `reveal.js` → D3, all entrance staggers.
- `experiential.js` → A3, D2, E4 (chapterTransition); D1/D5 sequencing (scrollScene); A2 (parallax/pointer).

**Needs a new small shared lib (`js/lib/tactile.js` proposed — one cohesive draggable/physics helper):**
- B1 trace-path, B2 ring-fence, B3 basket, B4 plug, B7 balance, B8 sticky notes, F1 toolkit, F2 dial.
- DRY: one `draggable(el, {onMove, onDrop, snap, spring})` primitive with pointer + **keyboard** paths and
  a shared spring/settle + contact-shadow. KISS: physics = light spring + inertia, not a physics engine.
  Mirror the `factory(container, opts) -> { el, …, destroy() }` contract the other libs use.

**Port from SEBSKILLS (vanilla-ise; they ship as React):**
- `magnetic-button` → E1, `magnetic-cursor` → E2, `text-scramble` → A4/D3.
- *Skip* the WebGL effects (`liquid-image`, `interactive-distortion`, `image-shatter`, `spectra-noise`) —
  too heavy / off-brand for this calm, flat system, and a perf/a11y risk. Tasteful restraint over spectacle.

**New non-lib module:**
- A6 ambient sound → `js/lib/ambient.js` (WebAudio, single global, off by default, mute persisted).
- F6 brief export → journey-state collector in `main.js` + a summary render.

**Performance / reduced-motion / accessibility caveats:**
- All motion already follows the house rule: transform/opacity only, rAF-batched, IntersectionObserver-gated,
  `prefers-reduced-motion` jumps to final state (see `experiential.js` header). Every NEW tactile component
  **must** keep this and ship a **keyboard path** (the engine and `dragRank`/`quiz` already model it).
- Gate discipline: any interaction that's the *point* of a step calls `journey.gate()`/`ready()`; ambient
  and cosmetic beats must NOT gate (don't trap the visitor). ~16 gated beats over ~15 min is the target.
- Pointer-fine only for E1/E2 (`@media (hover:hover) and (pointer:fine)`); touch gets tap-equivalents.
- Sound and custom cursor are always opt-in / dismissible; never autoplay, never hide the native cursor
  without a fallback. Honour `prefers-reduced-transparency` for F3 backdrop-filter.
- Budget: one canvas/force-sim per visible step max (only one chapter is mounted-visible at a time, so this
  is naturally bounded); destroy on step-leave via each factory's `destroy()`.

**Recommended build order — first 6–8 to the highest finish (prove the calibre, lowest risk):**
1. **A3 + E4 chapter arrivals** and **A4/E6 assembling headline + highlighter** — establishes the cinematic
   tempo across *every* step at once; pure CSS + existing `chapterTransition`. (DNA 1, 3, 12)
2. **C1 Guess-the-number** (ch03) — `clickToGuess` is built; instantly demonstrates commit-then-reveal. 
3. **C2 100-in-100 waffle + A1 "you" dot** — `waffleGrid` built; lands the embodied/concrete principle.
4. **B5 Drag-rank trust** (ch04) — `dragRank` built; the first big tactile "wow," near-zero new code.
5. **C3 Agency compass quiz** (ch05) — `quiz` built; the personal hook ("which Britain are you?").
6. **B2 Ring-fence the holiday** — the flagship NEW tactile beat; also the first build of `tactile.js`
   (its `draggable` primitive then unlocks B1/B3/B4/B7/B8/F1 cheaply).
7. **E1 magnetic Next + E3 commit feel** — finish layer that makes all of the above feel premium.
8. **D2 pivot wipe** — the single most cinematic beat (survival→agency); proves the Blue Marine register.

Build these eight, screenshot/preview for client sign-off (per design-approval gate), then expand into the
remaining tactile toys (B3/B4/B7/B8, F1–F5), the data set-pieces (C4–C9), and finally the taste-sensitive
ambient sound (A6) last.
