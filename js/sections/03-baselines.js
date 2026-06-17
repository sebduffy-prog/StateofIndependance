/**
 * Chapter 03 — baselines. "The numbers you already know."
 *
 * Four classic squeeze hallmarks flow on the warm amber→orange ground — the
 * "operational floor". Each beat is a huge Poppins-Black number + a short bold
 * label + one sentence, paired with ONE backgroundless, non-bar chart that sits
 * directly on the ground (navy marks, faint ink-tint tracks — never a box).
 *
 *   01 · 77% careful   — MARQUEE: clickToGuess → a 100-in-100 crowd waffle
 *                        where the visitor's own square is singled out.
 *   02 · 55% deal-seek — lollipopChart (shoppedAround highlighted).
 *   03 · 60% anxious   — dotPlot of availability concerns.
 *   04 · 54% trade-down— tugOfWar 54 / 46 (trading down vs holding the basket).
 *
 * Soft gating: gate() lights the advisory "try it" hint on the marquee guess;
 * ready() clears it when the visitor locks in. Next is NEVER blocked.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="03-baselines">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { lollipopChart, dotPlot, tugOfWar } from '../lib/charts.js';
import { clickToGuess } from '../lib/interactions.js';
import { arrival } from '../lib/experiential.js';

const CAREFUL_TRUE = 77.3;     // Q2r3 exact
const CAREFUL_FILL = 77;       // squares lit in the 100-grid (deck-rounded)
const CROWD_TOTAL = 100;
const COUNT_MS = 1200;
const STAGGER_MS = 11;         // per-square cascade
const YOU_INDEX = 44;          // a lit square near the crowd's heart = "you"
const YOU_POP_MS = 280;        // beat after your square lights, then it stands proud
const SCALE_MAX = 60;          // shared axis for beats 02–03 (largest baseline ≈ 55)

/**
 * Build the 100-in-100 crowd grid into `gridEl`: 100 squares, `fill` of them
 * lit, with ONE lit square singled out as the visitor. Returns `run(from)`
 * which cascades the fill and rolls the caption count from the visitor's guess
 * up to the truth. Reduced motion paints the final state instantly.
 * @param {HTMLElement} gridEl
 * @param {HTMLElement|null} countEl
 * @returns {(from?: number) => void}
 */
const buildCrowd = (gridEl, countEl) => {
  const reduced = prefersReducedMotion();
  const cells = [];
  for (let i = 0; i < CROWD_TOTAL; i += 1) {
    const cell = document.createElement('span');
    cell.className = 'bl-cell';
    if (i === YOU_INDEX) cell.classList.add('is-you');
    gridEl.append(cell);
    cells.push(cell);
  }

  const light = (cell, i) => { if (i < CAREFUL_FILL) cell.classList.add('is-on'); };
  const landYou = () => cells[YOU_INDEX].classList.add('is-landed');

  return (from = 0) => {
    if (reduced) {
      cells.forEach(light);
      landYou();
      if (countEl) countEl.textContent = String(CAREFUL_FILL);
      return;
    }
    cells.forEach((cell, i) => {
      window.setTimeout(() => {
        light(cell, i);
        if (i === YOU_INDEX) window.setTimeout(landYou, YOU_POP_MS);
      }, i * STAGGER_MS);
    });
    if (countEl) countUp(countEl, { from, to: CAREFUL_FILL, durationMs: COUNT_MS });
  };
};

export default function init(rootEl, data) {
  const { survey, journey } = data;
  if (!survey) return; // fail soft — any dataset may be null

  // Entrance: re-assemble headline + count numbers on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);
  observeCounters(rootEl);

  /* ── Beat 01 · the marquee — guess, then the 100-in-100 crowd ─────── */
  const guessHost = rootEl.querySelector('[data-guess]');
  const crowdFig = rootEl.querySelector('[data-crowd]');
  const crowdGrid = rootEl.querySelector('[data-crowd-grid]');
  const crowdCount = rootEl.querySelector('[data-crowd-count]');
  const carefulNum = rootEl.querySelector('[data-careful-num]');

  if (guessHost && crowdFig && crowdGrid) {
    const runCrowd = buildCrowd(crowdGrid, crowdCount);

    clickToGuess(guessHost, {
      trueValue: CAREFUL_TRUE,
      max: 100,
      unit: '%',
      label: 'How many in every 100 are more careful with money than five years ago?',
      prompt: 'Take a guess',
      onReveal: (guess) => {
        const from = Number.isFinite(guess) ? guess : 0;
        if (carefulNum) {
          // Roll the hero number from the visitor's guess to the truth; keep the
          // small "%" glyph that the markup carries.
          carefulNum.textContent = '';
          countUp(carefulNum, { from, to: CAREFUL_FILL, suffix: '%' });
        }
        crowdFig.hidden = false;
        runCrowd(from);
        journey.ready();
      },
    });
    // Advisory "try it" hint only (Next still unlocks after the dwell).
    journey.gate();
  }

  /* ── Beat 02 · 55% deal-seeking — lollipop ───────────────────────── */
  const moneyHost = rootEl.querySelector('[data-lollipop-money]');
  if (moneyHost && Array.isArray(survey.moneySavingMoves?.items)) {
    lollipopChart(moneyHost, {
      items: survey.moneySavingMoves.items.map((d) => ({ id: d.id, label: d.label, pct: d.pct })),
      max: SCALE_MAX,
      highlightId: 'shoppedAround',
      ariaLabel: 'Money-saving moves in the last three months, percent who did each.',
    });
  }

  /* ── Beat 03 · 60% anxious — dot plot of availability concerns ───── */
  const availHost = rootEl.querySelector('[data-dotplot-avail]');
  if (availHost && Array.isArray(survey.availabilityConcerns?.items)) {
    dotPlot(availHost, {
      items: survey.availabilityConcerns.items.map((d) => ({ label: d.label, pct: d.pct })),
      max: SCALE_MAX,
      ariaLabel: 'Very or extremely concerned about availability, by category.',
    });
  }

  /* ── Beat 04 · 54% trading down — tug-of-war 54 / 46 ─────────────── */
  const tugHost = rootEl.querySelector('[data-tug-grocery]');
  if (tugHost) {
    tugOfWar(tugHost, {
      left: { label: 'Trading down', pct: 54 },
      right: { label: 'Holding their basket', pct: 46 },
      ariaLabel: 'Fifty-four percent trading down, forty-six percent holding their basket.',
    });
  }
}
