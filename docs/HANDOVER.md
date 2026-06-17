# HANDOVER — the complete brief. Read this, then continue.

If context maxed out or you are a fresh session: this is the one doc that catches you up fully —
what this is, the vision, the content, where we are, where we are going, what you can/need to do,
and the hard-won rules. Then carry on.

═══════════════════════════════════════════════════════════════════════════
## 1. WHAT THIS IS — the vision
═══════════════════════════════════════════════════════════════════════════
"The State of Independence" is VCCP's flagship **Challenger Series** research piece. We are turning
it from a deck into a **premium, experiential, interactive website** — the calibre of Blue Marine
"The Sea We Breathe" and Moooi "Paper Play" (the client's reference bar; a "£100k experiential
website", their words). Not a webpage with charts — an *experience*.

The signature experience: a **guided Z-axis depth-scroll JOURNEY**. You scroll and FLY FORWARD
THROUGH full-screen stages in 3D depth (the current stage comes toward you and you pass through it;
the next emerges from deep space). One full-screen stage at a time, ~22 stages, ~15 minutes. Every
beat is one cinematic, tactile, marvellously-designed moment. A persistent "you" dot is born on the
cover and travels the whole journey as connective thread. Titles assemble character-by-character on
arrival (the client loves this — keep it).

The feeling we are chasing: confident, restrained, cinematic, tactile, unmistakably ONE brand world.
"Clean" is not the goal — **expensive** is. If a screen could sit in any generic template, it has failed.

═══════════════════════════════════════════════════════════════════════════
## 2. THE CONTENT / STORY (so you know what we are visualising)
═══════════════════════════════════════════════════════════════════════════
Research: VCCP x Watermelon Research COCL survey, 1,504 UK adults 18+, nat rep, May 2026, + week-long
video diaries in 8 cities (Cardiff, Bury, Watford, Southampton, Glasgow, Bristol, Wigan, London) + TGI.
The arc:
1. **The numbers you already know** — 77% more careful with money, 55% deal-hunting routine, 60%
   anxious about the months ahead, 54% trading down on groceries. (Table stakes, not the strategy.)
2. **The twists** — (a) trust paradox: NHS most trusted (6.42/10) yet 53% say it declined; trust
   ranking NHS 53% confident down to Government 24%. (b) protected joy: 40% ring-fence the holiday
   budget at all costs (the lipstick effect). (c) AI on tap: 58% used AI instead of a professional for
   some task, 37% for high-stakes (finance/health/legal). NEVER conflate 58% with high-stakes.
3. **Britain resolves into four** — a new "agency to act" dimension (outlook × agency) splits the
   nation: **Architects 17%** (optimistic+proactive, organised/positive/in control), **Hustlers 28%**
   (pessimistic+proactive, self-sufficient/savvy/sceptical), **Coasters 27%** (optimistic+passive,
   easygoing/careful/open), **Retreaters 28%** (pessimistic+passive, overwhelmed/stretched/support-
   seeking). Per-segment quotes, demographics, AI attitudes, and distinctive TGI statements.
4. **The empowerment architecture** — one need unifies all four: control. Save me MONEY (obvious) /
   TIME / STRESS (the hidden premium).
5. **Five signature moves** (the playbook, the payoff): 01 Unplug them from the grid · 02 Be the
   trusted antidote · 03 Ride the social self-help wave · 04 Kill the mental load · 05 Boost good
   behaviours. Each with a less→more shift, a verbatim quote, brand examples (M&S, Boots, Vinted —
   Nationwide REMOVED per client).
6. **Close** — Martin Lewis: "They do not want brands to hold their hands. They want brands to hand
   them the tools." + a clear Thank you.
All stats are VERIFIED in `data/*.json` + `docs/STORY.md`. NEVER fabricate a number.

═══════════════════════════════════════════════════════════════════════════
## 3. ARCHITECTURE (where everything lives)
═══════════════════════════════════════════════════════════════════════════
Repo `/Users/seb.duffy/Documents/GitHub/StateofIndependance`. Static, NO build (HTML + vanilla ES
modules + scoped CSS). GitHub `sebduffy-prog/StateofIndependance`; Vercel production = `main`
(`stateof-independance-three.vercel.app`). An external auto-commit/push process moves HEAD on its own.
- **Engine:** `js/main.js` — the Z-axis depth-scroll controller. Reads `sections/manifest.json` (22
  steps). Shows one full-bleed 100vw×100svh stage; scroll/keys fly through in Z.
- **Each step:** `sections/{id}.html` (one root div) + `js/sections/{id}.js`
  (`export default init(rootEl,data)`) + `css/sections/{id}.css` (ESCAPED digit selectors `#\30 1-cover`).
  `data={survey,segments,tgi,journey}`; `journey.gate()/ready()` advisory (never block); `chapter:arrive`
  event on focus; you-dot anchors `[data-youdot-anchor]`; title reveal via `experiential.arrival/scrambleIn`.
- **Shared libs (REUSE, don't rewrite):** `js/lib/` charts, venn, segment-graph, interactions, tactile,
  experiential, counter, reveal.
- **Design system:** `css/vccp.css`. **Data:** `data/` survey/segments/tgi/tgi-statements.json.
  **Fonts:** self-hosted Poppins `assets/fonts/`. **Assets:** `assets/brand-final/` (lockup, book-covers,
  warm-gradient, cream, maze-logo.gif, bear-girl) + `assets/deck/` (uk-map.svg, move-0N.svg icons).

THE 22 STEPS (manifest order): 01-cover · 02-research(UK map) · 03-baselines(77%) · 04-baselines-rest ·
05-twists-intro · 06-twist-trust · 07-twist-joy(ring-fence) · 08-twist-ai · 09-segments-intro(2×2 compass
resolve) · 10/11/12/13-segment-architects/hustlers/coasters/retreaters · 14-graphrag(TGI explorer) ·
15-empowerment(money/time/stress venn) · 16-data-explorer(5 viz) · 17-21 move-unplug/antidote/selfhelp/
mentalload/behaviours · 22-outro(Thank you).

═══════════════════════════════════════════════════════════════════════════
## 4. SOURCE-OF-TRUTH DOCS (read before building anything)
═══════════════════════════════════════════════════════════════════════════
- `BRAND-WORLD-FINAL.md` — AUTHORITATIVE brand (from the final deck components). Poppins (Black/ExtraBold
  display); warm amber→coral / cream grounds; navy+yellow icon system; italic accent word (the
  parallelogram is RETIRED); the `.soi-card` editorial component. Hexes: amber #FBC100, orange #FFA764,
  coral #FF8598, cream #F0EDE7, navy #041654, yellow #F0CB08.
- `ART-DIRECTION.md` — the premium bar + cheap-tells hit-list + the "Blue Marine/Moooi?" test.
- `Z-AXIS-JOURNEY.md` — the depth-scroll mechanic; transitions FLY THROUGH (pure Z+scale+blur, ZERO X/Y,
  never slide), slow + artistic + VARIED per step; full-bleed; no voids; scroll cue.
- `STRUCTURE-V2.md` — the 22-step structure, content notes, and the FINAL POLISH items.
- `CONTRACT.md` — build contract + full lib API + data shapes. `STORY.md` — copy/stats/quotes verbatim.
- `VOICE-AND-POLISH.md` — WLV copy voice + NO em dashes. `EXPERIENTIAL-IDEATION.md` — the interaction menu.
- `DESIGN-WORLD-V2.md` — superseded by BRAND-WORLD-FINAL (kept for reference).

═══════════════════════════════════════════════════════════════════════════
## 5. WHERE WE ARE (state as of 2026-06-17)
═══════════════════════════════════════════════════════════════════════════
- Live/committed `main` had: the Z-axis engine + the TRUE fly-through transition (commit ~`42414a0`) but
  MOST steps were empty placeholders (the "loading screen mess").
- RUNNING NOW: massive fix-all workflow — task `wn0dl5tqg`, run id `wf_38f301ce-87e`. It POPULATES all 21
  steps to the brand world with their interactions (Opus on 09-segments-intro, 14-graphrag,
  16-data-explorer; Sonnet on the rest), fixes the double-jump + builds longer/changing/ARTISTIC depth
  transitions + hides the floating you-dot + kills the loading flash (engine, Opus), removes Nationwide,
  replaces the janky drag-to-cut, then a Sonnet verify walks all 22 fixing glitches. Screenshots →
  `docs/qa/fa-*.png` and `fa-walk-*.png`. (It is slow + token-heavy because each agent self-verifies in
  Playwright.) The script path is in the launch result; resume with
  `Workflow({scriptPath:"<that path>", resumeFromRunId:"wf_38f301ce-87e"})` if it fails partway.

═══════════════════════════════════════════════════════════════════════════
## 6. WHERE WE ARE GOING / WHAT WE NEED TO DO (roadmap)
═══════════════════════════════════════════════════════════════════════════
NEXT, in order, one workflow at a time:
1. Let `wn0dl5tqg` land → review `docs/qa/fa-walk-*.png` → commit + push to `main`.
2. CLEANUPS (if the run missed them): map dots accurate + no blob; remove stray dots around the step-2
   map; hide the floating you-dot anywhere it lacks an anchor; ZERO dead space / full-bleed everywhere;
   no overlap; no leftover placeholder text.
3. FINAL POLISH PASS (client said do last): make transitions slower + more ARTISTIC + varied per step;
   rework/remove the "drag-left-to-cut" beat (rubbish). (Some of this is in the current run.)
4. A full art-direction CRITIC walk against ART-DIRECTION.md (the "would this sit on Blue Marine/Moooi?"
   test) — fix anything cheap or inconsistent.
LATER / OPEN (raised by client, not yet built):
- A ~1-minute walkthrough VIDEO of the journey (a prior one exists at `docs/SOI-walkthrough.mp4`; re-record
  once the build is final). 
- "MoltBook" — live, low-cost agent-to-agent interactions between the 4 segment personas (BRAINSTORM
  ONLY so far; concept in `docs/IDEAS-live-segment-agents.md`; recommended: pre-generated bank replayed
  client-side, ~£0, upgradeable to a cheap daily cron). Do NOT build without the go-ahead.
- Reach ~16 marvellous interactions (the spine is in EXPERIENTIAL-IDEATION.md; most are built).

═══════════════════════════════════════════════════════════════════════════
## 7. WHAT YOU CAN DO (tools + how we work)
═══════════════════════════════════════════════════════════════════════════
- **Dynamic Workflows** are the engine of this build (the user expects them). Structure: parallel
  per-step agents (resilient), bounded serial phases. RESUMABLE via scriptPath + resumeFromRunId.
- **Model triage** (user has 20x usage): Opus for the engine + bespoke showpieces + quality-critical;
  Sonnet for standard content steps (it is the best coding model — fine for most); Haiku for trivial/
  verify. Set per-agent `model` in `agent(prompt,{model})`. Don't blanket-Opus (cost) or downgrade where
  quality shows.
- **Verify** with Playwright (read `/Users/seb.duffy/.claude/skills/webapp-testing/SKILL.md`); use
  ATTRIBUTE selectors `[id="05-segments"]` (digit-leading `#id` is invalid). Per-agent Playwright verify
  is the main token/time cost — for cheap fast runs, build-only + ONE verify at the end.
- **SEBSKILLS** (`/Users/seb.duffy/Documents/GitHub/SEBSKILLS/skills/`): frontend-design, vccp-media-design,
  strategy/WLV (copy), audience-segmentation + data-analysis (the graphrag/explorer interface), ui-effects.
- Git: commit + push `git push origin HEAD:main` when work lands (worked recently; the classifier
  sometimes guards `main` — push to a branch if blocked). Co-author attribution is DISABLED — omit it.

═══════════════════════════════════════════════════════════════════════════
## 8. HARD RULES (non-negotiable)
═══════════════════════════════════════════════════════════════════════════
- NEVER run two workflows concurrently — they collide on the same files and corrupted the repo before.
  One at a time; resume rather than relaunch.
- Every step: full-bleed 100vw×100svh (NO cream edge band), ONE screen (no internal scroll), BALANCED
  (one focal point, NO dead space, no overlap), brand world, character→title reveal, WLV copy (NO em
  dashes), no underlines, NO parallelogram, square corners, navy+yellow accents, Poppins, tabular nums,
  reduced-motion safe, keyboard, no console.log, verified data only.
- Transitions: pure depth (Z+scale+blur+opacity, ZERO X/Y, NEVER a slide), slow + artistic + VARIED per
  step. One gesture = one step (no double-jump).
- Each step builder edits ONLY its three files; never the shared engine/css/manifest/libs/data unless
  that is the explicit task.

═══════════════════════════════════════════════════════════════════════════
## 9. PITFALLS / HISTORY (so you don't repeat them)
═══════════════════════════════════════════════════════════════════════════
- Infra has repeatedly killed big workflows: session/usage limits, server rate-limiting, socket drops,
  classifier (Opus) outages. Workflows are RESUMABLE — lean on that.
- Two concurrent workflows once corrupted the working tree (files written by both). Never again.
- A serial single-agent "engine" phase before the steps becomes a bottleneck if it stalls — run engine
  IN the parallel batch with the steps (different files, safe).
- The look went through many iterations (mustard/teal → warm-gradient/navy → Poppins → the final deck
  components). BRAND-WORLD-FINAL.md is now authoritative; ignore earlier palette assumptions.
- Recurring client pain points, now rules: dead space / not filling the screen; transitions reading as
  slides; cheap/generic feel; em dashes; the parallelogram; placeholder "loading" screens.
