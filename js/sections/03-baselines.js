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
 *   ANTI-VOID · The waffle is live from first render: it fills to the slider
 *       value in real time as the visitor drags. No empty grid, no dead space.
 *       The you-square is built ONLY after reveal — no data-youdot-anchor
 *       in the static HTML, so the shell does not park its dot in empty space.
 *
 *   Floor stats — 55 / 60 / 54 rendered in the left rail so the crowd
 *       on the right remains the uncontested focal point.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="03-baselines">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { waffleGrid } from '../lib/charts.js';
import { arrival } from '../lib/experiential.js';

const CAREFUL_TRUE  = 77.3;   // Q2r3 exact — survey.moodOfNation careful
const CAREFUL_FILL  = 77;     // squares lit in the 100-grid (deck-rounded)
const COUNT_MS      = 1400;
const SLIDER_START  = 50;     // default slider position

/** Default waffleGrid geometry (matches the lib defaults when no square/gap passed). */
const WAFFLE_SQUARE = 26;
const WAFFLE_GAP    = 6;

/** Index of the "you" cell inside the waffle (0-based, row-major).
 *  Cell 44 = row 4, col 4 — sits comfortably inside the lit 77 squares. */
const YOU_INDEX     = 44;
const YOU_POP_DELAY = 320; // ms after the fill wave before you pop

/**
 * Overlay a single "you" square on top of the SVG waffle cell at `index`.
 * Built ONLY after reveal — keeps the pre-reveal grid clean (no floating dot).
 * Adds data-youdot-anchor so the shell's you-dot locks here post-reveal.
 *
 * @param {SVGElement} svgEl   The waffle <svg> element
 * @param {number}     index   Cell index (0-based, row-major in a 10×10 grid)
 * @param {number}     square  Cell size (px) used when the waffle was built
 * @param {number}     gap     Gap (px) used when the waffle was built
 * @returns {{ el: HTMLElement, land: () => void, destroy: () => void }}
 */
const buildYouSquare = (svgEl, index, square, gap) => {
  const cols  = 10;
  const col   = index % cols;
  const row   = Math.floor(index / cols);
  const total = cols * square + (cols - 1) * gap;
  const xFrac = (col * (square + gap)) / total;
  const yFrac = (row * (square + gap)) / total;
  const wFrac = square / total;

  const wrapper = svgEl.parentElement;
  if (getComputedStyle(wrapper).position === 'static') {
    wrapper.style.position = 'relative';
  }

  const dot = document.createElement('span');
  dot.className = 'bl-you-square';
  dot.setAttribute('aria-hidden', 'true');

  dot.style.cssText = [
    'position:absolute',
    `left:${(xFrac * 100).toFixed(3)}%`,
    `width:${(wFrac * 100).toFixed(3)}%`,
    'aspect-ratio:1/1',
    'pointer-events:none',
    'z-index:3',
    'background:transparent',
  ].join(';');

  const alignTop = () => {
    const svgRect = svgEl.getBoundingClientRect();
    const wrapRect = wrapper.getBoundingClientRect();
    if (svgRect.height > 0) {
      const topOffset = svgRect.top - wrapRect.top;
      dot.style.top = `${topOffset + yFrac * svgRect.height}px`;
    }
  };

  wrapper.appendChild(dot);

  const ro = new ResizeObserver(alignTop);
  ro.observe(svgEl);
  alignTop();

  const land = () => {
    // Only add the youdot-anchor when we're about to make it visible —
    // the shell reads this attribute on chapter:arrive; by reveal time
    // the step is already focused so the dot snaps to the new anchor.
    dot.setAttribute('data-youdot-anchor', '');
    dot.classList.add('is-landed');
  };

  const destroy = () => { ro.disconnect(); dot.remove(); };
  return { el: dot, land, destroy };
};

/**
 * Build the clickToGuess UI manually (no lib import) so we can wire
 * a live `input` event to the waffle. Returns { el, reveal }.
 */
const buildGuessWidget = (container, opts) => {
  const { trueValue, max = 100, unit = '%', label, prompt, onInput, onReveal } = opts;
  const uid = `guess-bl-${Math.round(trueValue * 100)}`;

  const wrap = document.createElement('div');
  wrap.className = 'guess';
  wrap.innerHTML = `
    <p class="guess-prompt">${prompt || 'Your guess'}</p>
    <label class="guess-label" for="${uid}">${label}</label>
    <div class="guess-control">
      <input id="${uid}" class="guess-range" type="range" min="0" max="${max}"
             value="${SLIDER_START}" step="1"
             aria-describedby="${uid}-out"/>
      <output id="${uid}-out" class="guess-output">${SLIDER_START}${unit}</output>
    </div>
    <button type="button" class="vccp-btn guess-submit">Lock in my guess</button>
    <div class="guess-reveal" hidden></div>`;

  const range  = wrap.querySelector('.guess-range');
  const output = wrap.querySelector('.guess-output');
  const submit = wrap.querySelector('.guess-submit');

  range.addEventListener('input', () => {
    output.textContent = `${range.value}${unit}`;
    onInput && onInput(Number(range.value));
  });

  let revealed = false;
  const reveal = () => {
    if (revealed) return;
    revealed = true;
    range.disabled = true;
    submit.hidden = true;
    onReveal && onReveal(Number(range.value));
  };

  submit.addEventListener('click', reveal);
  container.append(wrap);
  return { el: wrap, reveal };
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
  const crowdCount  = rootEl.querySelector('[data-crowd-count]');
  const crowdOf     = rootEl.querySelector('[data-crowd-of]');
  const crowdLabel  = rootEl.querySelector('[data-crowd-label]');
  const crowdKicker = rootEl.querySelector('[data-crowd-kicker]');
  const crowdCap    = rootEl.querySelector('[data-crowd-cap]');
  const carefulNum = rootEl.querySelector('[data-careful-num]');

  if (!guessHost || !crowdGrid) return;

  // Build the waffle immediately at SLIDER_START (not 0) so the right
  // column has visual weight from frame one — no void, no dead space.
  const waffle = waffleGrid(crowdGrid, {
    value: SLIDER_START,
    total: 100,
    accent: 'navy',
    square: WAFFLE_SQUARE,
    gap: WAFFLE_GAP,
    ariaLabel: 'A crowd of a hundred: move the slider to guess.',
  });
  const svgEl = waffle.el;

  // Show the initial count in the caption.
  if (crowdCount) crowdCount.textContent = String(SLIDER_START);

  // youSquare is built ONLY on reveal — no floating dot in the guess grid.
  let youSquare = null;

  // Build the bespoke guess widget so we can wire the slider to the waffle.
  buildGuessWidget(guessHost, {
    trueValue: CAREFUL_TRUE,
    max: 100,
    unit: '%',
    label: 'How many in every 100 are more careful with money than five years ago?',
    prompt: 'Before the truth: take a guess',

    // Live: slider → waffle fills to match the current guess.
    onInput: (guessValue) => {
      const n = Math.round(guessValue);
      waffle.setValue(n, { animate: false });
      if (crowdCount) crowdCount.textContent = String(n);
    },

    onReveal: (guess) => {
      const from = Number.isFinite(guess) ? Math.round(guess) : SLIDER_START;

      // Swap guess cell for the truth display (no layout jump).
      if (claim) claim.classList.add('is-revealed');
      if (truth) truth.hidden = false;

      // Caption shifts from guess to truth — structure holds, words change.
      if (crowdLabel)  crowdLabel.textContent  = '77 in 100 are more careful. One square is you.';
      if (crowdCap)    crowdCap.classList.add('is-truth');
      if (crowdKicker) crowdKicker.textContent = 'The truth';
      if (crowdOf)     crowdOf.textContent     = 'in 100 are more careful. One of them is\u00A0you.';

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
        youSquare = buildYouSquare(svgEl, YOU_INDEX, WAFFLE_SQUARE, WAFFLE_GAP);
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
