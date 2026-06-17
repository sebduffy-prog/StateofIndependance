/**
 * 20-move-mentalload.js — Move 04: Kill the mental load.
 *
 * Warm gradient ground. Black on warm. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — move header + WLV lesson + sandwich-generation stat strip
 *           (87/58/31/12 from Killik & Co 2025) + new-premium quote card
 *   RIGHT — move-04.svg icon + death-to beats + flipReveal less→more
 *
 * Sandwich data (STORY.md §07 Move 04, slide 62 / Killik & Co 2025):
 *   87% have children they support financially
 *   58% support their partners
 *   31% support their parents financially
 *   12% support younger extended family members
 *
 * Less→More rows (STORY.md §07 Move 04 slide 67, verbatim):
 *   Status as currency  → Time as currency
 *   Fragmentation       → Ecosystems
 *   Customer support    → Life advisory
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\32 0-move-mentalload.
 *
 * @param {HTMLElement} rootEl  the <section id="20-move-mentalload">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { flipReveal } from '../lib/interactions.js';
import { countUp } from '../lib/counter.js';

// Sandwich generation — Killik & Co poll, 2025 (STORY.md §07 Move 04)
const SANDWICH = [
  { pct: 87, selector: '[data-count-to="87"]' },
  { pct: 58, selector: '[data-count-to="58"]' },
  { pct: 31, selector: '[data-count-to="31"]' },
  { pct: 12, selector: '[data-count-to="12"]' },
];

// Less→More pairs verbatim from STORY.md §07 Move 04 slide 67
const FLIP_ROWS = [
  { less: 'Status as currency', more: 'Time as currency' },
  { less: 'Fragmentation',      more: 'Ecosystems' },
  { less: 'Customer support',   more: 'Life advisory' },
];

export default function init(rootEl, data) {
  // Animate sandwich-bar fills on arrival
  const animateBars = () => {
    rootEl.querySelectorAll('.mml-sbar__fill').forEach((fill) => {
      const pct = Number(fill.dataset.pct) || 0;
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fill.style.width = pct + '%';
        });
      });
    });
  };

  // Count-up all sandwich numbers on arrival
  const animateCounts = () => {
    SANDWICH.forEach(({ pct, selector }) => {
      const el = rootEl.querySelector(selector);
      if (!el) return;
      countUp(el, { to: pct, from: 0, durationMs: 1000, decimals: 0, suffix: '%' });
    });
  };

  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
    animateCounts();
    animateBars();
  });

  const flipHost = rootEl.querySelector('[data-flip]');
  if (!flipHost) return;

  let flippedCount = 0;

  flipReveal(flipHost, {
    rows: FLIP_ROWS,
    fromToLabels: ['Less', 'More'],
    onFlip: (_index, flipped) => {
      flippedCount = flipped
        ? flippedCount + 1
        : Math.max(0, flippedCount - 1);
      if (flippedCount >= FLIP_ROWS.length) {
        data && data.journey && data.journey.ready();
      }
    },
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  data && data.journey && data.journey.gate();
}
