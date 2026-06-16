/**
 * Chapter 03 — baselines. "The numbers you already know."
 *
 * Four squeeze hallmarks flow on the warm amber→orange ground (the
 * "operational floor"). Each beat is a huge Poppins-Black count-up number +
 * label + one sentence, paired with ONE backgroundless, non-bar chart that
 * sits directly on the ground (navy marks so nothing is mustard-on-mustard;
 * faint ink-tint tracks, never a white box).
 *
 *   01 · 77% careful   — MARQUEE: clickToGuess → a custom 100-in-100 waffle
 *                        where the visitor's own square is highlighted.
 *   02 · 55% deal-seek — lollipopChart (shoppedAround highlighted).
 *   03 · 60% anxious   — dotPlot of availability concerns.
 *   04 · 54% trade-down— tugOfWar 54/46 + dotPlot of traded-down categories.
 *
 * Soft gating: gate() lights the "try it" hint on the marquee guess; ready()
 * clears it when the visitor locks in. Next is never blocked.
 *
 * @param {HTMLElement} rootEl  <section class="chapter" id="03-baselines">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { lollipopChart, dotPlot, tugOfWar } from '../lib/charts.js';
import { clickToGuess } from '../lib/interactions.js';
import { arrival, observeParallax, prefersReducedMotion } from '../lib/experiential.js';

const CAREFUL_TRUE = 77.3;       // Q2r3 exact
const CAREFUL_FILL = 77;         // squares filled in the 100-grid
const CROWD_TOTAL = 100;
const CROWD_COUNT_MS = 1100;
const CROWD_STAGGER_MS = 14;     // per-square cascade
const YOU_INDEX = 44;            // a filled square near the crowd's middle
const YOU_POP_AFTER_MS = 320;    // beat after your square fills, then it pops proud
const TOP_N = 4;                 // beats 02–04 supporting charts
const SCALE_MAX = 60;            // shared chart axis (largest baseline ≈ 55)

/**
 * Build the 100-in-100 crowd: a 10×10 grid filling to `fill`, with ONE filled
 * square singled out as the visitor ("you"). Returns a `run(from)` that starts
 * the cascade + caption count from the visitor's own guess; reduced motion
 * paints the final state instantly. Backgroundless — squares carry the
 * contrast, no card.
 * @param {HTMLElement} gridEl
 * @param {number} fill
 * @param {HTMLElement|null} countEl
 * @param {(youCell: HTMLElement) => void} [onYouLand] handed the you-square once
 *        the cascade reaches it (used to travel the persistent you-dot there).
 * @returns {(from?: number) => void}
 */
const buildCrowd = (gridEl, fill, countEl, onYouLand) => {
  const reduced = prefersReducedMotion();
  const cells = [];
  for (let i = 0; i < CROWD_TOTAL; i += 1) {
    const cell = document.createElement('span');
    cell.className = 'bl-crowd-cell';
    if (i === YOU_INDEX) cell.classList.add('is-you');
    gridEl.append(cell);
    cells.push(cell);
  }
  const youCell = cells[YOU_INDEX];

  const paint = (cell, i) => {
    if (i < fill) cell.classList.add('is-on');
  };
  const landYou = () => {
    youCell.classList.add('is-landed');
    if (typeof onYouLand === 'function') onYouLand(youCell);
  };

  return (from = 0) => {
    if (reduced) {
      cells.forEach(paint);
      landYou();
      if (countEl) countEl.textContent = String(fill);
      return;
    }
    cells.forEach((cell, i) => {
      window.setTimeout(() => {
        paint(cell, i);
        if (i === YOU_INDEX) window.setTimeout(landYou, YOU_POP_AFTER_MS);
      }, i * CROWD_STAGGER_MS);
    });
    // The caption rolls from what the visitor guessed up to the truth, so the
    // gap between expectation and reality is felt as motion, not just stated.
    if (countEl) countUp(countEl, { from, to: fill, durationMs: CROWD_COUNT_MS });
  };
};

export default function init(rootEl, data) {
  const { survey, journey } = data;
  if (!survey) return; // fail soft — every dataset may be null

  // Entrance: re-assemble headline + count numbers on every arrival.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);
  observeCounters(rootEl);
  observeParallax(rootEl, { maxShiftPx: 48 });

  /* ── Beat 01 · the marquee — guess, then the 100-in-100 crowd ─────── */
  const guessHost = rootEl.querySelector('[data-guess]');
  const crowdFig = rootEl.querySelector('[data-crowd]');
  const crowdGrid = rootEl.querySelector('[data-crowd-grid]');
  const crowdCount = rootEl.querySelector('[data-crowd-count]');
  const carefulNum = rootEl.querySelector('[data-careful-num]');

  // The you-dot anchor starts on the headline's "baseline" word; on reveal it
  // travels to the visitor's own square in the crowd — meaningful continuity,
  // never parked in dead space.
  const headlineAnchor = rootEl.querySelector('[data-youdot-anchor]');
  const handYouDotToCrowd = (youCell) => {
    if (headlineAnchor) headlineAnchor.removeAttribute('data-youdot-anchor');
    youCell.setAttribute('data-youdot-anchor', '');
    // Nudge the persistent you-dot (it re-measures its anchor on scroll).
    window.dispatchEvent(new Event('scroll'));
  };

  if (guessHost && crowdFig && crowdGrid) {
    guessHost.hidden = false;
    const runCrowd = buildCrowd(crowdGrid, CAREFUL_FILL, crowdCount, handYouDotToCrowd);

    clickToGuess(guessHost, {
      trueValue: CAREFUL_TRUE,
      max: 100,
      unit: '%',
      label: 'How many in every 100 are more careful with money than five years ago?',
      prompt: 'Take a guess',
      onReveal: (guess) => {
        const from = Number.isFinite(guess) ? guess : 0;
        // The hero number rolls up from the visitor's own guess to the truth.
        if (carefulNum) {
          countUp(carefulNum, { from, to: CAREFUL_TRUE, decimals: 0, suffix: '%' });
        }
        crowdFig.hidden = false;
        runCrowd(from);
        journey.ready();
      },
    });
    // Advisory "try it" hint (Next still unlocks after the dwell).
    journey.gate();
  }

  /* ── Beat 02 · 55% deal-seeking — lollipop ───────────────────────── */
  const moneyHost = rootEl.querySelector('[data-lollipop-money]');
  if (moneyHost && Array.isArray(survey.moneySavingMoves?.items)) {
    lollipopChart(moneyHost, {
      items: survey.moneySavingMoves.items.map((d) => ({
        id: d.id, label: d.label, pct: d.pct,
      })),
      max: SCALE_MAX,
      highlightId: 'shoppedAround',
      ariaLabel: 'Money-saving moves in the last three months, percent who did each.',
    });
  }

  /* ── Beat 03 · 60% anxious — dot plot of availability concerns ───── */
  const availHost = rootEl.querySelector('[data-dotplot-avail]');
  if (availHost && Array.isArray(survey.availabilityConcerns?.items)) {
    dotPlot(availHost, {
      items: survey.availabilityConcerns.items.map((d) => ({
        label: d.label, pct: d.pct,
      })),
      max: SCALE_MAX,
      ariaLabel: 'Very or extremely concerned about availability, by category.',
    });
  }

  /* ── Beat 04 · 54% trading down — tug-of-war + traded-down dot plot ─ */
  const tugHost = rootEl.querySelector('[data-tug-grocery]');
  if (tugHost) {
    tugOfWar(tugHost, {
      left: { label: 'Trading down', pct: 54 },
      right: { label: 'Holding their basket', pct: 46 },
      ariaLabel: 'Fifty-four percent trading down, forty-six percent holding their basket.',
    });
  }

  const tradedHost = rootEl.querySelector('[data-dotplot-traded]');
  if (tradedHost && Array.isArray(survey.tradingDownByCategory?.items)) {
    dotPlot(tradedHost, {
      items: survey.tradingDownByCategory.items.slice(0, TOP_N).map((d) => ({
        label: d.label, pct: d.pct,
      })),
      max: SCALE_MAX,
      ariaLabel: 'Where Britain has traded down, top categories.',
    });
  }
}
