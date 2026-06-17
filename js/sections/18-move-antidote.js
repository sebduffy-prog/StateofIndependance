/**
 * 18-move-antidote.js — Move 02: Be the trusted antidote.
 *
 * Warm gradient ground. Black on warm. Full-bleed one screen.
 *
 * THE STAGE:
 *   LEFT  — move header + WLV lesson + quote card
 *   RIGHT — 29-pt trust spread stat + move-02.svg + flipReveal less→more
 *           + M&S / Boots brand evidence cards
 *
 * Stat (STORY.md §07 Move 02 / survey.json institutionTrust.headline):
 *   29-point trust spread — NHS 52.8% confident at top, Government 23.9% at bottom.
 *   Displayed as 29 pts (rounded from 52.8 − 23.9 = 28.9 ≈ 29).
 *
 * Less→More rows (STORY.md §07 Move 02 slide 49, verbatim):
 *   Treating pain         → Diagnosing the problem
 *   Lipstick on a pig     → Backing it up
 *   Opaque                → Transparent
 *
 * Lesson (STORY.md §07 Move 02 slide 44, verbatim):
 *   Earn people's trust by being the honest, transparent alternative
 *   when they feel let down by everyone else.
 *
 * Brand examples: M&S and Boots ONLY (Nationwide removed per STRUCTURE-V2.md).
 *
 * Contract: docs/CONTRACT.md. CSS scoped to #\31 8-move-antidote.
 *
 * @param {HTMLElement} rootEl  the <section id="18-move-antidote">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { flipReveal } from '../lib/interactions.js';
import { countUp } from '../lib/counter.js';

// Verified from survey.json institutionTrust.headline:
// NHS pctConfident 52.8 − Government pctConfident 23.9 = 28.9 → displayed as 29
const STAT_VALUE = 29;

// Less→More pairs verbatim from STORY.md §07 Move 02 slide 49
const FLIP_ROWS = [
  { less: 'Treating pain',      more: 'Diagnosing the problem' },
  { less: 'Lipstick on a pig',  more: 'Backing it up' },
  { less: 'Opaque',             more: 'Transparent' },
];

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit — idempotent.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);

    // Count up the trust-spread stat hero on every arrival.
    const statEl = rootEl.querySelector('[data-count-to]');
    if (statEl) {
      countUp(statEl, {
        to: STAT_VALUE,
        from: 0,
        durationMs: 1100,
        decimals: 0,
        suffix: ' pts',
      });
    }
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
      // Mark complete once all three rows are flipped.
      if (flippedCount >= FLIP_ROWS.length) {
        data && data.journey && data.journey.ready();
      }
    },
  });

  // Advisory hint: tell the visitor there is an interaction to try.
  data && data.journey && data.journey.gate();
}
