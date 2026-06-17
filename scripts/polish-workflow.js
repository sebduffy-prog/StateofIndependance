export const meta = {
  name: 'soi-polish-pass',
  description: 'Fix SOI site: kill blue title boxes, harden scramble, smooth transitions/you-dot, per-step layout + interactions',
  phases: [
    { title: 'Shared core', detail: 'experiential.js scramble+youDot, main.js engine/transitions/scroll-cue' },
    { title: 'Per-step polish', detail: 'one agent per step: blue box, em dashes, dead space, overlaps, interactions' },
  ],
}

const REPORT = {
  type: 'object',
  additionalProperties: false,
  properties: {
    target: { type: 'string' },
    filesChanged: { type: 'array', items: { type: 'string' } },
    fixes: { type: 'array', items: { type: 'string' } },
    blocked: { type: 'array', items: { type: 'string' }, description: 'issues that can only be fixed in a shared file you do not own' },
  },
  required: ['target', 'filesChanged', 'fixes'],
}

const REPO = '/Users/seb.duffy/Documents/GitHub/StateofIndependance'

const SHARED_RULES = `
You are polishing "The State of Independence" — VCCP Challenger Series premium experiential scroll-site. The bar is Blue Marine "The Sea We Breathe" / Moooi: cinematic, tactile, restrained, unmistakably ONE brand world. "Clean" is not the goal, EXPENSIVE is. If a screen could sit in a generic template it has failed.

REPO: ${REPO} (static, NO build: HTML + vanilla ES modules + scoped CSS).

READ FIRST (authoritative, in repo/docs): BRAND-WORLD-FINAL.md, ART-DIRECTION.md, STORY.md (verbatim copy+stats), VOICE-AND-POLISH.md, and HANDOVER.md section 8 (hard rules). Cross-check every number against data/*.json + STORY.md. NEVER fabricate a stat.

BRAND: Poppins (Black/ExtraBold display). Grounds: warm amber->coral / cream / navy. Accents navy #041654 + yellow #F0CB08 / amber #FBC100. Italic accent word (the parallelogram is RETIRED — never use it). Square corners always. Tabular nums. The .soi-card editorial component.

THE CLIENT'S RECURRING COMPLAINTS — FIX THESE EVERYWHERE THEY APPEAR IN YOUR STEP:
1. NO em dashes in any VISIBLE copy. Rewrite them out per VOICE-AND-POLISH (use commas, full stops, "to", or restructure). Do NOT edit em dashes that are inside HTML comments — only rendered text.
2. REMOVE the blue/navy outline "frame" box around the title. It is an outline / border / ::before / ::after rectangle drawn around the headline block in this step CSS (often "outline: 2px solid var(--navy)" with an offset). The client said "these blue boxes have to go." Delete it cleanly — the title stands on its own.
3. Full-bleed 100vw x 100svh, ONE screen, NO internal scroll. NO dead space (fill the screen, one balanced focal composition), NO content cut off at any edge, NO overlap between text/elements/cards.
4. Title reveal assembles char-by-char / scrambles (data-arrival / data-arrival-scramble). The scramble library (js/lib/experiential.js) is being hardened by another agent — do NOT edit it. But make sure your title element textContent in the HTML is the LITERAL final words, and your step JS NEVER overwrites the title text after load (this is what leaves some titles stuck as garbage glyphs).
5. The persistent yellow "you-dot" must NOT sit on chart bars/data marks or float in empty space. If your [data-youdot-anchor] lands somewhere that reads as a stray dot, move it to a deliberate calm spot, or remove the anchor so the dot hides on this step.
6. Reduced-motion safe, keyboard usable, NO console.log, square corners, no underlines.

GROUND TRUTH: a rendered screenshot of your step (current state) is on disk — Read it to see exactly what the client sees. Path is given below.

FILE OWNERSHIP (STRICT): edit ONLY the files listed for you. Do NOT touch js/main.js, other js/lib/* files, sections/manifest.json, css/vccp.css, or any other step files. If a fix truly requires a shared file you do not own, put it in "blocked" in your report instead of editing it.

EFFICIENCY: build-only. Do NOT launch Playwright/servers/browsers — a single verification walk runs at the very end. Reason from the HTML/CSS/JS and your screenshot. Keep changes surgical and immutable-friendly.
`

// ---- PHASE 1: shared core (two isolated files, safe in parallel) ----
phase('Shared core')

const sharedExperiential = agent(`${SHARED_RULES}

YOUR FILE (edit ONLY this): js/lib/experiential.js
Reference screenshots showing the bugs: ${REPO}/docs/qa/walk/09-settled.png , 10-settled.png , 11-settled.png , 12-settled.png , 13-settled.png (segment titles render as PERMANENT garbage glyphs e.g. "The _/_ =__<c/s"); and 05-mid.png / 14-mid.png (title scramble overlaps body text mid-transition).

Harden TWO functions ONLY; PRESERVE their public signatures/exports (every step imports arrival, scrambleIn, youDot — do not break the API):

A) scrambleIn(el, opts) — currently buggy in three ways the client hates:
   - JOLT: each frame returns empty string for not-yet-started chars, so the string length grows as it resolves -> the title box reflows/jumps and (on big Poppins-900 headings) re-wraps, making glyphs look "massive" and overlap neighbours. FIX: emit a CONSTANT-LENGTH string every frame (render not-yet-started positions as a stable filler glyph or fixed-width placeholder) so the element footprint never changes during the reveal. Zero reflow.
   - STUCK GARBAGE: if the reveal is interrupted (section transitions away mid-run, or the section re-arrives and re-invokes it) the element is left showing scramble characters forever. FIX: make it bulletproof — capture the resolved target text robustly (never capture an already-scrambled value as dataset.scrambleText), make re-invocation idempotent, add a hard max-duration cap, and on the returned cleanup() force el.textContent back to the true target. The element MUST always end as the literal final words.
   - Keep the SCRAMBLE_CHARS set simple/narrow so no unusually wide glyph forces a wrap. Do not change font-size anywhere.
   - prefers-reduced-motion path stays instant (final text, no animation).

B) youDot(opts) — the persistent yellow marker reads as a "random dot" to the client.
   - It must ease smoothly with NO jitter, and HIDE (opacity 0 / not visible) whenever the current scope has no [data-youdot-anchor] or the anchor measures zero size. Fade in only when it has a real anchor. Do NOT change anchorTo/destroy/el API (main.js drives per-step usage separately).

Read HANDOVER.md first. Build-only, no browser.`, { label: 'shared:experiential.js', phase: 'Shared core', model: 'opus', schema: REPORT })

const sharedEngine = agent(`${SHARED_RULES}

YOUR FILE (edit ONLY this): js/main.js (the Z-axis depth-scroll engine).
Reference: docs/Z-AXIS-JOURNEY.md, and screenshots docs/qa/walk/05-mid.png, 14-mid.png, 15-mid.png (transitions), 00-cover-settled.png (scroll cue).

Make these engine fixes (PRESERVE the manifest contract + the section init(rootEl,data) API + the chapter:arrive event):
1. SCROLL CUE TEXT: the cover cue currently says "Scroll to journey through" (around line ~808). Change it to exactly: "Scroll to navigate the site".
2. SMOOTH SCROLL / TRANSITIONS: the client wants ONE smooth, continuous scroll feel both FORWARDS and BACK — not a PowerPoint slide change (worst between step 14 navy graphrag and step 15 warm empowerment). Keep the depth fly-through (Z + scale + blur + opacity, ZERO X/Y translation, never a slide) but make it buttery: smoothly eased progress, a soft CROSSFADE of the stage ground colour between steps (no hard cut, no flash), no jolt/jump at the moment a step commits, fully reversible. Eliminate any loading/placeholder flash. One gesture still = one step, but the eased tween should feel like a single continuous smooth scroll in either direction.
3. YOU-DOT usage: ensure the engine hides the dot on any step with no [data-youdot-anchor] and re-anchors it smoothly on arrival. The youDot function itself is hardened by another agent (do NOT edit js/lib/experiential.js) — just drive it correctly here. The dot must never read as a stray data point.
4. BOTTOM CHROME: make sure no global chrome (the progress counter / lockup / hint) overlaps step content at the bottom edge of the viewport.

Build-only, no browser.`, { label: 'shared:main.js', phase: 'Shared core', model: 'opus', schema: REPORT })

const sharedReports = (await parallel([() => sharedExperiential, () => sharedEngine])).filter(Boolean)
log(`Shared core done: ${sharedReports.map(r => r.target).join(', ')}`)

// ---- PHASE 2: per-step polish (each agent owns only its 3 files) ----
phase('Per-step polish')

const STEPS = [
  { id: '01-cover', model: 'sonnet', issues: 'Remove the blue title-frame box. Check balance: the maze/orbit sits right, the left feels sparse — make the composition intentional and full, no dead void. Em dashes out of visible copy. (The scroll cue text is fixed in the engine — do not add one.)' },
  { id: '02-research', model: 'sonnet', issues: 'Remove the blue title-frame box. Kill the stray stuck scramble-glyph cluster near the bottom (the "_<[<" mess under the May 26 / FIELDWORK WINDOW label) — make that label resolve to its real text or remove the scramble flag. Em dashes out.' },
  { id: '03-baselines', model: 'sonnet', issues: 'Remove the blue title-frame box. Em dashes out. Otherwise keep the balanced layout.' },
  { id: '04-baselines-rest', model: 'sonnet', issues: 'Remove the blue title-frame box. FIX TITLE LINE BREAKS: "The squeeze / is the table / they eat at" breaks badly and "they eat at" dangles — re-break so each line is a clean phrase and the italic accent word reads well, nothing orphaned. Em dashes out (there are many).' },
  { id: '05-twists-intro', model: 'sonnet', issues: 'Ensure the title (now resolving cleanly via the hardened lib) sits CLEAR of the standfirst beneath it — currently the big glyphs overlap the body text; reserve the title space so there is no overlap. FILL the empty right half (dead space) — balance the composition (extend the ambient field or lift the three numbered cards). Em dashes out.' },
  { id: '06-twist-trust', model: 'sonnet', issues: 'Remove the blue title-frame box. Make the faded "??" / "%" ghost marks on the right read as a deliberate pre-reveal (not broken). Em dashes out (many).' },
  { id: '07-twist-joy', model: 'sonnet', issues: 'Em dashes out. The you-dot floats near the Holidays row — anchor it deliberately or remove the anchor. Fill the lower-left dead space; balance the composition.' },
  { id: '08-twist-ai', model: 'sonnet', issues: 'The body paragraph overlaps / sits under the title block — separate them cleanly so the standfirst is fully clear of the headline. Em dashes out. Balance the composition.' },
  { id: '09-segments-intro', model: 'opus', issues: 'SHOWPIECE. (a) FILL THE SCREEN — there is dead space at the top and the composition floats; make it full and balanced. (b) The blue segment dots must ANIMATE IN — they should move/settle into their four quadrant positions on arrival (chapter:arrive), not appear static. (c) Dots must NOT overlap the title or the legend text. (d) Title resolves to "Britain resolves into four". Em dashes out. IMPORTANT: animate the dots within THIS step own JS — do NOT edit js/lib/charts.js (you may import from it but not modify it).' },
  { id: '10-segment-architects', model: 'sonnet', issues: 'Title must resolve to "The Architects" (currently stuck garbage) — ensure the scramble element literal text in the HTML is the real word and your JS never overwrites it. Remove the blue title box. Ensure the bottom faded TGI stats and the big "17%" block are not cut off. Keep the you-dot off the chart bars. Em dashes out.' },
  { id: '11-segment-hustlers', model: 'sonnet', issues: 'Title resolves to "The Hustlers". Remove the blue title box. FIX BOTTOM OVERFLOW: the "214 index on feeling in control... twice the national average" block is cut off at the bottom edge — bring it fully on-screen. Keep you-dot off the data. Em dashes out.' },
  { id: '12-segment-coasters', model: 'sonnet', issues: 'Title resolves to "The Coasters". Remove the blue title box. FIX CHART DEAD SPACE: the "Where the Coasters over-index against Britain" panel has a large empty area to the right of the bars — make the chart fill its panel or rebalance the layout so there is no dead space. Em dashes out.' },
  { id: '13-segment-retreaters', model: 'sonnet', issues: 'Title resolves to "The Retreaters". Remove the blue title box. VERIFY THE HEADLINE %: the screen shows "27%" but the Retreaters are 28% per data/segments.json + STORY.md — fix if wrong. Ensure the bottom block is not cut off. Em dashes out.' },
  { id: '14-graphrag', model: 'opus', extraFiles: ['js/lib/segment-graph.js'], issues: 'SHOWPIECE. You ALSO own js/lib/segment-graph.js (this step is its only consumer). (a) PHYSICS ARE JOLTY/JITTERY — make the force-graph drift smoothly and settle calmly: gentle continuous motion, no jitter, no jumpy ticks. (b) AUTO-SHOW: on arrival it must AUTOMATICALLY reveal the data so the user SEES the answers without tapping — auto-cycle through the segments/attributes so ALL question-answers are surfaced ("we need to be able to see all question answers and it should auto show the user"). Keep tap/hover as optional manual control. (c) Title resolves to "Explore the segments"; standfirst not overlapped. (d) Fill any dead space. Em dashes out.' },
  { id: '15-empowerment', model: 'opus', issues: 'SHOWPIECE. The money/time/stress circles must START spread ACROSS the screen and AUTO-CONVERGE into the centre (forming the overlap / venn) on arrival — it auto-fills into the middle, it must NOT require the user to drag. Keep drag as an optional nudge if trivial, but the default is an automatic cinematic convergence. Remove the blue title box. Ensure the right-edge silhouette is intentional, not awkwardly cut. Em dashes out.' },
  { id: '16-data-explorer', model: 'opus', issues: 'SHOWPIECE. Client: "boring and does not fill the space." Make it FILL the screen and feel alive — the chart area is small with a big empty bottom-right; enlarge/centre the visualisation, animate transitions when the view changes (bars/lollipop/dot/waffle/venn) and when filters change, make selecting a filter feel tactile. Remove the blue title box. Em dashes out.' },
  { id: '17-move-unplug', model: 'opus', issues: 'THE MOVES NEED GRAVITAS. Client: "no real reveal or design in the animation, it feels generic." Give this move a genuine, designed, weighty reveal on arrival (the move number 01, the less->more shift). The faint low-contrast less->more table must be legible and intentionally designed (not ghosted into the background). Fix the white quote card overlapping the bottom edge. Remove any title box. Em dashes out.' },
  { id: '18-move-antidote', model: 'sonnet', issues: 'Remove any title-frame box. Check the big "29 pts" stat and ALL line breaks read cleanly. Fix the white quote card AND the M&S/Boots cards overlapping the bottom edge. Give the move gravitas, consistent with move 01. Em dashes out (many).' },
  { id: '19-move-selfhelp', model: 'sonnet', issues: 'Remove the blue title box. FIX the bad title line break. Fix the white quote card overlapping the bottom edge. Give the move gravitas. Em dashes out.' },
  { id: '20-move-mentalload', model: 'sonnet', issues: 'Title resolves to "Kill the mental load" (currently stuck scramble glyphs). Fix the white quote card overlapping the bottom edge. Give the move gravitas. Em dashes out.' },
  { id: '21-move-behaviours', model: 'sonnet', issues: 'Give the move a designed, weighty reveal consistent with the other moves (gravitas). Fix any quote-card / bottom-edge overlap. Em dashes out.' },
  { id: '22-outro', model: 'opus', issues: 'FIX THE MISSING WORD: "They want brands to hand them the ." is missing the word "tools" (a scramble likely resolving to empty) — it must read "...hand them the tools." Fill the dead space and give "Thank you" real gravitas. Ensure the silhouette and the credits block are clean and not cut off. Em dashes out (many).' },
]

const frameFor = (id) => {
  const n = parseInt(id.slice(0, 2), 10) - 1
  const f = String(n).padStart(2, '0')
  return n === 0 ? '00-cover-settled.png' : `${f}-settled.png`
}

const stepReports = await parallel(STEPS.map((s) => () => {
  const owned = [`sections/${s.id}.html`, `js/sections/${s.id}.js`, `css/sections/${s.id}.css`, ...(s.extraFiles || [])]
  const prompt = `${SHARED_RULES}

YOUR STEP: ${s.id}
FILES YOU OWN (edit ONLY these): ${owned.join(', ')}
YOUR SCREENSHOT (Read it for ground truth): ${REPO}/docs/qa/walk/${frameFor(s.id)}

STEP-SPECIFIC FIXES (in addition to the universal complaints above):
${s.issues}

Make the changes, then report. Build-only, no browser.`
  return agent(prompt, { label: `step:${s.id}`, phase: 'Per-step polish', model: s.model, schema: REPORT })
}))

const ok = stepReports.filter(Boolean)
const blocked = ok.flatMap((r) => (r.blocked || []).map((b) => `${r.target}: ${b}`))
return {
  shared: sharedReports,
  steps: ok.map((r) => ({ target: r.target, files: r.filesChanged, fixes: r.fixes })),
  blockedItems: blocked,
  totalAgents: sharedReports.length + ok.length,
}
