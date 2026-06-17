/**
 * Chapter 04 — twists. "There are twists in the story."
 *
 * The art-direction north star for this screen (§7): drag the trust ladder;
 * the holiday physically resists being cut. ONE twist commands the screen at a
 * time; navy gravity for the paradox. So each twist is its own focal beat,
 * composed from the shared lib primitives (never reinvented):
 *
 *   Twist 01 — THE MARQUEE. The earned dark moment (navy velvet, cream on
 *     navy). The reader drags the seven institutions into the order they THINK
 *     Britain trusts them, then it snaps to truth (Q7 confidence, NHS 52.8 ->
 *     Government 23.9). On reveal, ONE editorial reality lands: the 29-point
 *     spread (53% NHS -> 24% government) and the NHS paradox as a single line
 *     (6.42/10, the highest, yet 53% say it has declined). This is the gated
 *     beat: gate() shows the hint, ready() clears it on the reveal (soft only).
 *
 *   Twist 02 — TACTILE. On the warm ground the holiday tile is ring-fenced:
 *     dragging it RESISTS (clamped to the fence) and it springs straight back,
 *     while the flexible-spend tiles wobble and fling loose. The contrast is
 *     physical. Reveals 40% (exact 39.6) protect the holiday at all costs.
 *
 *   Twist 03 — AI on tap. ONE tugOfWar tension bar, Human professional vs AI;
 *     a pillGroup toggles ANY task (58%, exact 58.4) and HIGH-STAKES finance/
 *     health/legal (37%, exact 37.4) — the two are kept strictly distinct. The
 *     verbatim qual quote is the quiet supporting note.
 *
 * House rules: backgroundless (charts float on grounds, faint-tint tracks),
 * navy marks on warm / cream on dark, square corners, no underline, tabular
 * nums, reduced-motion safe (libs jump to rest), keyboard path on every
 * interaction (dragRank arrows, draggable arrows, pillGroup arrows). Sources
 * stay in data/survey.json, never rendered. No console.log.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="04-twists">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival, prefersReducedMotion } from '../lib/experiential.js';
import { tugOfWar } from '../lib/charts.js';
import { dragRank, pillGroup } from '../lib/interactions.js';
import { draggable } from '../lib/tactile.js';

const AI_ANY_PCT = 58.4; // Q11 any task (exact)
const AI_HIGH_STAKES_PCT = 37.4; // Q11 finance/health/legal (exact)
const FENCE_GIVE_PX = 18; // how far the ring-fenced holiday yields before resisting
const STRAIN_PX = 6; // drag distance past which the holiday reads "strained"

/** Fisher–Yates shuffle into a NEW array (no mutation of the source). */
const shuffled = (arr) => {
  const next = arr.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/* ───────────────────────── Twist 01 · trust (marquee) ─────────────────── */

const buildTrustLadder = (rootEl, survey, journey) => {
  const trust = survey.institutionTrust;
  if (!trust) return;

  const rankHost = rootEl.querySelector('[data-rank-trust]');
  const reveal = rootEl.querySelector('[data-trust-reveal]');
  if (!rankHost) return;

  // True order = most -> least confident (Q7 pctConfident, descending).
  const ranked = trust.confidenceRanking.items
    .slice()
    .sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = ranked.map((i) => i.id);
  const items = shuffled(ranked.map((i) => ({ id: i.id, label: i.label })));

  if (journey) journey.gate();

  let shown = false;
  const showReveal = () => {
    if (shown || !reveal) return;
    shown = true;
    reveal.hidden = false;
    reveal.setAttribute('aria-hidden', 'false');
    reveal.classList.add('is-live');
    observeCounters(reveal); // count the 53% -> 24% spread numbers
  };

  dragRank(rankHost, {
    items,
    trueOrder,
    instructions:
      'Drag institutions into the order you think Britain trusts them — or focus a row and use the up and down arrow keys.',
    onReveal: () => {
      showReveal();
      if (journey) journey.ready();
    },
  });
};

/* ───────────────────── Twist 02 · ring-fence the holiday ───────────────── */

/**
 * Build the tactile spend field. The "holiday" tile is ring-fenced: dragging it
 * only yields a few pixels before it resists and springs straight back
 * (spring:'return', tight bounds). The flexible-spend tiles wobble and CAN be
 * flung loose (spring:'settle'). Once the visitor has wrestled the holiday and
 * it sprang back, the fence glows defended.
 * @param {HTMLElement} fieldEl
 * @param {() => void} onResisted  fired the first time the holiday springs back
 * @returns {() => void} destroy
 */
const buildJoyField = (fieldEl, onResisted) => {
  const reduced = prefersReducedMotion();
  const flexible = [
    { label: 'Fashion', cls: 'a' },
    { label: 'Pub', cls: 'b' },
    { label: 'Beauty', cls: 'c' },
    { label: 'Gym', cls: 'd' },
  ];
  const handles = [];

  // Flexible spend — light tiles that wobble and settle where flung.
  flexible.forEach((item, i) => {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = `tw-joy-tile tw-joy-tile--flex tw-joy-tile--${item.cls}`;
    tile.textContent = item.label;
    tile.setAttribute('aria-label', `${item.label} — flexible spend, drag it loose`);
    if (!reduced) tile.style.setProperty('--wobble-delay', `${i * 0.4}s`);
    fieldEl.append(tile);
    handles.push(draggable(tile, { spring: 'settle', momentum: 0.18 }));
  });

  // The holiday — ring-fenced. A bordered "fence" wraps it; the tile resists.
  const fence = document.createElement('div');
  fence.className = 'tw-joy-fence';
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'tw-joy-tile tw-joy-tile--holiday';
  tile.innerHTML = '<span class="tw-joy-tile-lock" aria-hidden="true">&#9679;</span>Holiday';
  tile.setAttribute(
    'aria-label',
    'Holiday — ring-fenced and defended at all costs. It resists being moved.',
  );
  fence.append(tile);
  fieldEl.append(fence);

  let resistedOnce = false;
  const markResisted = () => {
    if (resistedOnce) return;
    resistedOnce = true;
    onResisted();
  };

  handles.push(
    draggable(tile, {
      spring: 'return', // always springs back to the fence
      momentum: 0,
      // It yields only a little before the fence holds it.
      bounds: { minX: -FENCE_GIVE_PX, maxX: FENCE_GIVE_PX, minY: -FENCE_GIVE_PX, maxY: FENCE_GIVE_PX },
      onMove: (state) => {
        const strained = Math.abs(state.x) + Math.abs(state.y) > STRAIN_PX;
        tile.classList.toggle('is-strained', strained && state.grabbed);
      },
      onSettle: () => {
        tile.classList.remove('is-strained');
        markResisted();
      },
    }),
  );

  return () => handles.forEach((h) => h.destroy());
};

const buildProtectedJoy = (rootEl) => {
  const fieldEl = rootEl.querySelector('[data-joy-field]');
  if (!fieldEl) return () => {};
  return buildJoyField(fieldEl, () => fieldEl.classList.add('is-defended'));
};

/* ───────────────────────── Twist 03 · AI on tap ───────────────────────── */

const buildAiOnTap = (rootEl, survey) => {
  const ai = survey.aiTasks;
  if (!ai) return;

  const tugHost = rootEl.querySelector('[data-tug-ai]');
  const controlsHost = rootEl.querySelector('[data-ai-controls]');
  const capEl = rootEl.querySelector('[data-ai-tug-cap]');
  if (!tugHost) return;

  const tug = tugOfWar(tugHost, {
    left: { label: 'Used AI', pct: AI_ANY_PCT },
    right: { label: 'A human professional', pct: 100 - AI_ANY_PCT },
    accent: 'navy',
    ariaLabel: '58% have used AI instead of a human professional for at least one task',
  });

  // ANY task (58.4) vs HIGH-STAKES finance/health/legal (37.4) — distinct.
  const CAP_ANY = 'Used AI instead of a human professional for at least one task';
  const CAP_HIGH = 'Used AI for a high-stakes call — finance, health or legal advice';
  if (controlsHost) {
    pillGroup(controlsHost, {
      ariaLabel: 'Show AI substitution for any task or only high-stakes calls',
      value: 'any',
      options: [
        { value: 'any', label: 'Any task' },
        { value: 'high', label: 'High-stakes' },
      ],
      onChange: (value) => {
        const left = value === 'high' ? AI_HIGH_STAKES_PCT : AI_ANY_PCT;
        tug.update({
          left: { label: 'Used AI', pct: left },
          right: { label: 'A human professional', pct: 100 - left },
        });
        if (capEl) capEl.textContent = value === 'high' ? CAP_HIGH : CAP_ANY;
      },
    });
  }
};

/* ─────────────────────────────── init ─────────────────────────────────── */

export default function init(rootEl, data) {
  const { survey, journey } = data || {};
  if (!survey) return; // fail soft — never throw on missing data

  observeReveals(rootEl);
  observeCounters(rootEl); // hero count-ups (the 40% etc.) on scroll-in

  // Re-assemble the heading on every arrival (idempotent). Not step 01, so no
  // ritual; the emphasis word ("twists") decrypts via data-arrival-scramble.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail || {}));

  buildTrustLadder(rootEl, survey, journey);
  const destroyJoyField = buildProtectedJoy(rootEl);
  buildAiOnTap(rootEl, survey);

  // Tear down the tactile sim's listeners if the step is ever destroyed.
  rootEl.addEventListener('chapter:teardown', () => {
    if (typeof destroyJoyField === 'function') destroyJoyField();
  });
}
