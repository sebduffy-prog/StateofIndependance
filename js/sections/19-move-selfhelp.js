/**
 * 19-move-selfhelp.js — Move 03: Ride the social self-help wave.
 *
 * Warm gradient ground. Black on warm. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — move header + WLV lesson + quote card
 *   RIGHT — lead label + flipReveal less→more + media shift table
 *
 * Less→More rows (STORY.md §07 Move 03 slide 59, verbatim):
 *   Demographics & locations  → Context long-lists
 *   Look-a-likes              → Creative as targeting
 *   Off-the-shelf audiences   → Mimicking content behaviours
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\31 9-move-selfhelp.
 *
 * @param {HTMLElement} rootEl  the <section id="19-move-selfhelp">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { flipReveal } from '../lib/interactions.js';

// Less→More pairs verbatim from STORY.md §07 Move 03 slide 59
const FLIP_ROWS = [
  { less: 'Demographics & locations', more: 'Context long-lists' },
  { less: 'Look-a-likes',             more: 'Creative as targeting' },
  { less: 'Off-the-shelf audiences',  more: 'Mimicking content behaviours' },
];

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
  });

  const flipHost = rootEl.querySelector('[data-flip]');
  if (!flipHost) return;

  let flippedCount = 0;

  flipReveal(flipHost, {
    rows: FLIP_ROWS,
    fromToLabels: ['Less', 'More'],
    onFlip: (_index, flipped) => {
      if (flipped) {
        flippedCount += 1;
      } else {
        flippedCount = Math.max(0, flippedCount - 1);
      }
      // Mark complete once all rows are flipped.
      if (flippedCount >= FLIP_ROWS.length) {
        data && data.journey && data.journey.ready();
      }
    },
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  data && data.journey && data.journey.gate();
}
