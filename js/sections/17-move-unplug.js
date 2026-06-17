/**
 * 17-move-unplug.js — Move 01: Unplug them from the grid.
 *
 * Warm gradient ground. Black on warm. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — move header + WLV lesson + quote card
 *   RIGHT — 34% hero stat + move-01.svg + flipReveal less→more interaction
 *
 * Stat (STORY.md §07 Move 01): 34% using tools to fix practical home/financial
 * problems themselves. Data anchor: Q9 "Budgeting/comparison tools" 34.0%.
 *
 * Less→More rows (STORY.md §07 Move 01 slide 38, verbatim):
 *   Escalating charges  → Hacking the system
 *   Prison              → Hotel
 *   Reinforcing unfair  → Fighting for change
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\31 7-move-unplug.
 *
 * @param {HTMLElement} rootEl  the <section id="17-move-unplug">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { flipReveal } from '../lib/interactions.js';
import { countUp } from '../lib/counter.js';

// Verified from STORY.md §07 Move 01 — Q9 budgeting/comparison tools 34.0%
const STAT_VALUE = 34;

// Less→More pairs verbatim from STORY.md §07 Move 01 slide 38
const FLIP_ROWS = [
  { less: 'Escalating charges', more: 'Hacking the system' },
  { less: 'Prison',             more: 'Hotel' },
  { less: 'Reinforcing unfair', more: 'Fighting for change' },
];

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);

    // Count up the stat hero on every arrival.
    const statEl = rootEl.querySelector('[data-count-to]');
    if (statEl) {
      countUp(statEl, {
        to: STAT_VALUE,
        from: 0,
        durationMs: 1100,
        decimals: 0,
        suffix: '%',
      });
    }
  });

  const flipHost = rootEl.querySelector('[data-flip]');
  if (!flipHost) return;

  let flippedCount = 0;

  const { flipAll } = flipReveal(flipHost, {
    rows: FLIP_ROWS,
    fromToLabels: ['Less', 'More'],
    onFlip: (_index, flipped) => {
      if (flipped) {
        flippedCount += 1;
      } else {
        flippedCount = Math.max(0, flippedCount - 1);
      }
      // Mark complete once all three rows are flipped.
      if (flippedCount >= FLIP_ROWS.length) {
        data && data.journey && data.journey.ready();
      }
    },
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  data && data.journey && data.journey.gate();
}
