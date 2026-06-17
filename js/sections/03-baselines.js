/**
 * Chapter 03 — baselines. "The numbers you already know."
 *
 * THE ONE MEMORABLE THING: guess how many in every 100 are more careful
 * with money — then the truth lands as a crowd of 100 (waffle grid) where
 * YOUR own square pops yellow among them.
 *
 *   THE MARQUEE · 77% careful — clickToGuess → waffleGrid crowd-of-100
 *       where the visitor's square highlights inside it. The display number
 *       rolls from guess to truth; the crowd fills navy; one square pops yellow.
 *
 *   ANTI-VOID · The waffle shows all 100 faint squares immediately.
 *       The you-square is built and placed ONLY after reveal — no random
 *       floating dot in an empty grid before the guess is locked.
 *
 *   The floor — 55 / 60 / 54 kept as one quiet tabular line so the crowd
 *       is the sole focal point.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="03-baselines">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { clickToGuess } from '../lib/interactions.js';
import { waffleGrid } from '../lib/charts.js';
import { arrival } from '../lib/experiential.js';

const CAREFUL_TRUE  = 77.3;   // Q2r3 exact — survey.moodOfNation careful
const CAREFUL_FILL  = 77;     // squares lit in the 100-grid (deck-rounded)
const COUNT_MS      = 1400;
/** Index of the "you" cell inside the waffle (0-based, row-major). */
const YOU_INDEX     = 44;     // near the centre of the lit crowd
const YOU_POP_DELAY = 280;    // ms after the fill wave before you pop

/**
 * Overlay a single "you" square on top of the SVG waffle cell at `index`.
 * Built ONLY after reveal — keeps the pre-reveal grid clean (no floating dot).
 * Returns a cleanup function that removes the overlay.
 * @param {SVGElement} svgEl   The waffle <svg> element
 * @param {number}     index   Cell index (0-based, row-major in a 10×10 grid)
 * @param {number}     square  Cell size (px) used when the waffle was built
 * @param {number}     gap     Gap (px) used when the waffle was built
 * @returns {{ el: HTMLElement, land: () => void, destroy: () => void }}
 */
const buildYouSquare = (svgEl, index, square, gap) => {
  const cols   = 10;
  const col    = index % cols;
  const row    = Math.floor(index / cols);
  const total  = cols * square + (cols - 1) * gap;
  const xFrac  = (col * (square + gap)) / total;
  const yFrac  = (row * (square + gap)) / total;
  const wFrac  = square / total;

  const wrapper = svgEl.parentElement;
  if (getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }

  const dot = document.createElement('span');
  dot.className = 'bl-you-square';
  dot.setAttribute('data-youdot-anchor', '');
  dot.setAttribute('aria-hidden', 'true');

  dot.style.cssText = `
    position: absolute;
    left:   ${(xFrac * 100).toFixed(3)}%;
    width:  ${(wFrac * 100).toFixed(3)}%;
    aspect-ratio: 1 / 1;
    pointer-events: none;
    z-index: 3;
    background: transparent;
  `;

  const align = () => {
    const svgH = svgEl.getBoundingClientRect().height;
    if (svgH > 0) dot.style.top = `${yFrac * svgH}px`;
  };

  wrapper.appendChild(dot);
  const ro = new ResizeObserver(align);
  ro.observe(svgEl);
  align();

  const land = () => dot.classList.add('is-landed');
  const destroy = () => { ro.disconnect(); dot.remove(); };
  return { el: dot, land, destroy };
};

export default function init(rootEl, data) {
  const { survey, journey } = data;
  if (!survey) return; // fail soft — any dataset may be null

  // Entrance: re-assemble headline on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);
  observeCounters(rootEl);

  /* ── THE MARQUEE — guess, then the 100-in-100 waffle crowd ─────── */
  const guessHost  = rootEl.querySelector('[data-guess]');
  const claim      = rootEl.querySelector('[data-claim]');
  const truth      = rootEl.querySelector('[data-truth]');
  const crowdGrid  = rootEl.querySelector('[data-crowd-grid]');
  const crowdCount = rootEl.querySelector('[data-crowd-count]');
  const crowdOf    = rootEl.querySelector('[data-crowd-of]');
  const crowdLabel = rootEl.querySelector('[data-crowd-label]');
  const carefulNum = rootEl.querySelector('[data-careful-num]');

  if (!guessHost || !crowdGrid) return;

  const SQUARE = 26;
  const GAP    = 6;

  // Build the waffle immediately: all 100 faint empty squares visible from
  // the first frame so the right pane is never a void.
  const waffle = waffleGrid(crowdGrid, {
    value: 0,
    total: 100,
    accent: 'navy',
    square: SQUARE,
    gap: GAP,
    ariaLabel: 'A crowd of a hundred: seventy-seven are more careful with money.',
  });
  const svgEl = waffle.el;

  // youSquare is built ONLY on reveal — no floating dot in the empty grid.
  let youSquare = null;

  clickToGuess(guessHost, {
    trueValue: CAREFUL_TRUE,
    max: 100,
    unit: '%',
    label: 'How many in every 100 are more careful with money than five years ago?',
    prompt: 'Before the truth — take a guess',
    onReveal: (guess) => {
      const from = Number.isFinite(guess) ? Math.round(guess) : 0;

      // Swap guess cell for the truth display (no layout jump).
      if (claim) claim.classList.add('is-revealed');
      if (truth) truth.hidden = false;

      // Update the crowd label now the crowd has meaning.
      if (crowdLabel) crowdLabel.textContent = '77 in 100 are more careful. One square is you.';
      if (crowdOf) crowdOf.textContent = 'of every 100 people you pass today — one of them is you.';
      if (crowdCount) {
        countUp(crowdCount, { from, to: CAREFUL_FILL, durationMs: COUNT_MS });
      }

      if (carefulNum) {
        carefulNum.textContent = '';
        countUp(carefulNum, {
          from,
          to: CAREFUL_FILL,
          suffix: '%',
          durationMs: COUNT_MS,
        });
      }

      // Fill 77 squares navy; after the wave pop the you-square yellow.
      waffle.setValue(CAREFUL_FILL, { animate: !prefersReducedMotion() });

      // Build the you-square now (first time only) and pop it.
      if (!youSquare) {
        youSquare = buildYouSquare(svgEl, YOU_INDEX, SQUARE, GAP);
      }
      if (prefersReducedMotion()) {
        youSquare.land();
      } else {
        window.setTimeout(() => youSquare.land(), COUNT_MS - YOU_POP_DELAY);
      }

      journey.ready();
    },
  });

  // Advisory "try it" hint only — Next still unlocks after the dwell.
  journey.gate();
}
