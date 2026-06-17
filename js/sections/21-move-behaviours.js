/**
 * 21-move-behaviours.js — Move 05: Boost good behaviours.
 *
 * Warm gradient ground. Black on warm. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — move header + WLV lesson + Vinted brand note + quote card
 *   RIGHT — move-05.svg medal icon + gamified flipReveal less→more interaction
 *
 * Less→More rows (deck "BOOST GOOD BEHAVIOURS" shift slide, verbatim):
 *   Setting tasks   → Gamifying goals
 *   Reactive        → Real time
 *   Random rewards  → Meaningful rewards
 *
 * Gamified reward: when all three rows are flipped the reward badge pulses to
 * signal completion — positive reinforcement mirroring the move itself.
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\32 1-move-behaviours.
 *
 * @param {HTMLElement} rootEl  the <section id="21-move-behaviours">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { flipReveal } from '../lib/interactions.js';

// Less→More pairs verbatim from deck "BOOST GOOD BEHAVIOURS" shift slide
const FLIP_ROWS = [
  { less: 'Setting tasks',  more: 'Gamifying goals' },
  { less: 'Reactive',       more: 'Real time' },
  { less: 'Random rewards', more: 'Meaningful rewards' },
];

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
    // Reset the reward badge state on each re-visit so the interaction is fresh.
    _resetBadge(rootEl);
  });

  const flipHost = rootEl.querySelector('[data-flip]');
  if (!flipHost) return;

  let flippedCount = 0;

  flipReveal(flipHost, {
    rows: FLIP_ROWS,
    fromToLabels: ['Less', 'More'],
    onFlip: (_index, flipped) => {
      if (flipped) {
        flippedCount = Math.min(FLIP_ROWS.length, flippedCount + 1);
      } else {
        flippedCount = Math.max(0, flippedCount - 1);
      }

      // Gamified reward: badge fires when all three rows are flipped.
      if (flippedCount >= FLIP_ROWS.length) {
        _unlockBadge(rootEl);
        if (data && data.journey) data.journey.ready();
      } else {
        _resetBadge(rootEl);
      }
    },
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  if (data && data.journey) data.journey.gate();
}

/**
 * Show the reward badge with a pulse animation — mirrors the "boost good behaviours"
 * gamified-reward concept. Reduced-motion: instant show, no pulse.
 * @param {HTMLElement} rootEl
 */
function _unlockBadge(rootEl) {
  const badge = rootEl.querySelector('.mb-reward-badge');
  if (!badge) return;
  badge.setAttribute('aria-hidden', 'false');
  badge.classList.add('is-unlocked');
}

/**
 * Hide the reward badge (called on re-arrival so the interaction is repeatable).
 * @param {HTMLElement} rootEl
 */
function _resetBadge(rootEl) {
  const badge = rootEl.querySelector('.mb-reward-badge');
  if (!badge) return;
  badge.setAttribute('aria-hidden', 'true');
  badge.classList.remove('is-unlocked');
}
