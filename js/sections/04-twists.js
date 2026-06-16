/**
 * Chapter 04 — twists. "There are twists in the story."
 *
 * Three anomalies, each its own beat, composed from the shared lib
 * primitives (never reinvented):
 *
 *   Twist 01 — the institutional-trust paradox. The EARNED DARK moment
 *     (navy velvet, cream text). The MARQUEE interaction: dragRank the seven
 *     institutions into the order the visitor THINKS Britain trusts them, then
 *     snap to truth (Q7 confidence, NHS 52.8 -> Government 23.9). On reveal an
 *     aside lifts in: the 53% -> 24% spread (29-point), and the NHS paradox —
 *     a radialGauge of the 6.42/10 trust score beside a flipReveal that flips
 *     "most trusted institution" -> "yet 53% say it has declined". This is the
 *     gated beat: journey.gate() shows the hint, journey.ready() clears it on
 *     the rank reveal (Next is never blocked — soft gating only).
 *
 *   Twist 02 — protected joy. A TACTILE reward on the warm ground: the holiday
 *     tile is ring-fenced — dragging it RESISTS (clamped to the fence) and it
 *     springs back, while the flexible-spend tiles wobble loose. Reveals 40%
 *     (exact 39.6) protect the holiday at all costs, with a proportionStrip of
 *     what Britain defends (tactile.draggable + charts.proportionStrip).
 *
 *   Twist 03 — AI on tap. tugOfWar Human professional vs AI; a pillGroup
 *     toggles between ANY task (58%, exact 58.4) and HIGH-STAKES finance/health/
 *     legal (37%, exact 37.4) — the two are kept strictly distinct. A
 *     horizontalBars of tasks and the verbatim qual quote close it.
 *
 * House rules: backgroundless (charts float on grounds, faint tint tracks),
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
import { radialGauge, tugOfWar, horizontalBars, proportionStrip } from '../lib/charts.js';
import { dragRank, flipReveal, pillGroup } from '../lib/interactions.js';
import { draggable } from '../lib/tactile.js';

const NHS_TRUST_SCORE = 6.42; // Q7r1 mean
const HOLIDAY_PROTECT_PCT = 39.6; // Q5r3 exact (displayed as 40%)
const AI_ANY_PCT = 58.4; // Q11 any task (exact)
const AI_HIGH_STAKES_PCT = 37.4; // Q11 finance/health/legal (exact)
const FENCE_GIVE_PX = 18; // how far the ring-fenced holiday yields before resisting

/** Fisher–Yates shuffle into a NEW array (no mutation of the source). */
const shuffled = (arr) => {
  const next = arr.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

/* ───────────────────────── Twist 01 · trust ───────────────────────── */

const buildTrustParadox = (rootEl, survey, journey) => {
  const trust = survey.institutionTrust;
  if (!trust) return;

  const rankHost = rootEl.querySelector('[data-rank-trust]');
  const aside = rootEl.querySelector('[data-trust-aside]');
  const gaugeHost = rootEl.querySelector('[data-gauge-nhs]');
  const flipHost = rootEl.querySelector('[data-flip-nhs]');
  if (!rankHost) return;

  // True order = most -> least confident (Q7 pctConfident, descending).
  const ranked = trust.confidenceRanking.items
    .slice()
    .sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = ranked.map((i) => i.id);
  const items = shuffled(ranked.map((i) => ({ id: i.id, label: i.label })));

  if (journey) journey.gate();

  let revealed = false;
  const revealAside = () => {
    if (revealed || !aside) return;
    revealed = true;
    aside.hidden = false;
    aside.setAttribute('aria-hidden', 'false');
    aside.classList.add('is-live');
    observeCounters(aside); // count the 53% -> 24% spread numbers

    // NHS trust gauge (6.42 / 10) — cream arc on the dark ground.
    if (gaugeHost) {
      radialGauge(gaugeHost, {
        value: NHS_TRUST_SCORE,
        max: 10,
        label: 'NHS trust, out of 10',
        onNavy: true,
        ariaLabel: 'NHS trust score 6.42 out of 10 — the highest of any institution',
      });
    }
    // The paradox flip: most trusted <-> yet 53% say it has declined.
    if (flipHost) {
      flipReveal(flipHost, {
        fromToLabels: ['The regard', 'The reality'],
        rows: [{
          less: 'The single most trusted institution in Britain',
          more: 'Yet 53% say its performance has declined over the past decade',
        }],
      });
    }
  };

  dragRank(rankHost, {
    items,
    trueOrder,
    instructions:
      'Drag institutions into the order you think Britain trusts them — or focus a row and use the up and down arrow keys.',
    onReveal: () => {
      revealAside();
      if (journey) journey.ready();
    },
  });
};

/* ───────────────────── Twist 02 · ring-fence the holiday ───────────── */

/**
 * Build the tactile spend field. The "holiday" tile is ring-fenced: dragging
 * it only yields a few pixels before it resists and springs straight back
 * (spring:'return', tight bounds). The flexible-spend tiles wobble and CAN be
 * flung loose (spring:'settle'), making the contrast physical. Once the
 * visitor has wrestled the holiday and it sprang back, the 40% reveals.
 * @param {HTMLElement} fieldEl
 * @param {() => void} onResisted  fired the first time the holiday springs back
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

  // Flexible spend — these flex away. Light tiles, settle where flung.
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
        const strained = Math.abs(state.x) + Math.abs(state.y) > 6;
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

const buildProtectedJoy = (rootEl, survey) => {
  const protectedSpend = survey.protectedSpend;
  const fieldEl = rootEl.querySelector('[data-joy-field]');
  const stripHost = rootEl.querySelector('[data-strip-protected]');
  let destroyField = () => {};

  if (fieldEl) {
    destroyField = buildJoyField(fieldEl, () => {
      fieldEl.classList.add('is-defended');
    });
  }

  // The defended share, as a single proportion strip: holidays vs the rest.
  if (stripHost && protectedSpend) {
    const holiday = protectedSpend.items.find((i) => i.id === 'holidays');
    const family = protectedSpend.items.find((i) => i.id === 'familyExperiences');
    const streaming = protectedSpend.items.find((i) => i.id === 'streaming');
    const hobbies = protectedSpend.items.find((i) => i.id === 'hobbies');
    const segs = [holiday, family, streaming, hobbies]
      .filter(Boolean)
      .map((i, idx) => ({
        label: i.label,
        pct: i.pct,
        accent: idx === 0 ? 'navy' : 'teal',
      }));
    proportionStrip(stripHost, {
      segments: segs,
      ariaLabel:
        'Non-essentials Britain protects: holidays 40%, family experiences 39%, streaming 33%, hobbies 32%',
    });
  }

  return destroyField;
};

/* ───────────────────────── Twist 03 · AI on tap ───────────────────── */

const buildAiOnTap = (rootEl, survey) => {
  const ai = survey.aiTasks;
  if (!ai) return;

  const tugHost = rootEl.querySelector('[data-tug-ai]');
  const barsHost = rootEl.querySelector('[data-bars-ai]');
  const controlsHost = rootEl.querySelector('[data-ai-controls]');
  const capEl = rootEl.querySelector('[data-ai-tug-cap]');

  let tug;
  if (tugHost) {
    tug = tugOfWar(tugHost, {
      left: { label: 'Used AI', pct: AI_ANY_PCT },
      right: { label: 'A human professional', pct: 100 - AI_ANY_PCT },
      accent: 'navy',
      ariaLabel: '58% have used AI instead of a human professional for at least one task',
    });
  }

  // ANY task (58.4) vs HIGH-STAKES finance/health/legal (37.4) — distinct.
  const CAP_ANY = 'Used AI instead of a human professional for at least one task';
  const CAP_HIGH = 'Used AI for a high-stakes call — finance, health or legal advice';
  if (controlsHost && tug) {
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

  // Task breakdown, ranked. High-stakes tasks highlighted in ink.
  if (barsHost) {
    const items = ai.items
      .slice()
      .sort((a, b) => b.pct - a.pct)
      .map((i) => ({ id: i.id, label: i.label, pct: i.pct }));
    horizontalBars(barsHost, {
      items,
      decimals: 0,
      labelWidth: 190,
      ariaLabel: 'Tasks done with AI instead of a professional, by share',
    });
  }
};

/* ─────────────────────────────── init ─────────────────────────────── */

export default function init(rootEl, data) {
  const { survey, journey } = data || {};
  if (!survey) return; // fail soft — never throw on missing data

  observeReveals(rootEl);
  observeCounters(rootEl); // hero count-ups (the 40% etc.) on scroll-in

  // Re-assemble the heading on every arrival (idempotent). Not step 01, so no
  // ritual; the emphasis word ("twists") decrypts via data-arrival-scramble.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail || {}));

  buildTrustParadox(rootEl, survey, journey);
  const destroyJoyField = buildProtectedJoy(rootEl, survey);
  buildAiOnTap(rootEl, survey);

  // Tear down the tactile sim's listeners if the step is ever destroyed.
  rootEl.addEventListener('chapter:teardown', () => {
    if (typeof destroyJoyField === 'function') destroyJoyField();
  });
}
