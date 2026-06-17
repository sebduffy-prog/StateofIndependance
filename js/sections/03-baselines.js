/**
 * Chapter 03 — baselines. "The numbers you already know."
 *
 * THE ONE MEMORABLE THING: you guess how many in every 100 are more careful
 * with money — then the truth lands as a crowd of 100 squares with YOUR own
 * square singled out among them. The number is display-scale; the crowd is the
 * form. Everything else on the screen stays quiet.
 *
 *   THE MARQUEE · 77% careful — clickToGuess → a 100-in-100 crowd where the
 *       visitor's own square is born inside it. The display number is the
 *       headline; it rolls from the guess to the truth as the crowd fills.
 *
 *   The floor — 55 / 60 / 54 demoted to one quiet line of small tabular
 *       figures (no charts, no boxes) so the crowd is the sole focal point.
 *
 * Soft gating: gate() lights the advisory "try it" hint on the guess; ready()
 * clears it when the visitor locks in. Next is NEVER blocked.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="03-baselines">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { clickToGuess } from '../lib/interactions.js';
import { arrival } from '../lib/experiential.js';

const CAREFUL_TRUE = 77.3;     // Q2r3 exact
const CAREFUL_FILL = 77;       // squares lit in the 100-grid (deck-rounded)
const CROWD_TOTAL = 100;
const COUNT_MS = 1400;
const STAGGER_MS = 13;         // per-square cascade
const YOU_INDEX = 44;          // a lit square near the crowd's heart = "you"
const YOU_POP_MS = 320;        // beat after your square lights, then it stands proud

/**
 * Build the 100-in-100 crowd grid into `gridEl`: 100 squares, `CAREFUL_FILL`
 * of them lit, with ONE lit square singled out as the visitor. Returns
 * `run(from)` which cascades the fill and rolls the caption count from the
 * visitor's guess up to the truth. Reduced motion paints the final state
 * instantly.
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

  /* ── THE MARQUEE — guess, then the 100-in-100 crowd ──────────────── */
  const guessHost = rootEl.querySelector('[data-guess]');
  const claim = rootEl.querySelector('[data-claim]');
  const truth = rootEl.querySelector('[data-truth]');
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
      prompt: 'Before the truth — take a guess',
      onReveal: (guess) => {
        const from = Number.isFinite(guess) ? guess : 0;

        // The guess gives way to the display number: it IS the headline now.
        if (claim) claim.classList.add('is-revealed');
        if (truth) truth.hidden = false;
        if (carefulNum) {
          carefulNum.textContent = '';
          countUp(carefulNum, { from, to: CAREFUL_FILL, suffix: '%', durationMs: COUNT_MS });
        }

        // The reality the number describes, born to its right.
        crowdFig.hidden = false;
        runCrowd(from);
        journey.ready();
      },
    });
    // Advisory "try it" hint only (Next still unlocks after the dwell).
    journey.gate();
  }
}
