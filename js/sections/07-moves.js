/**
 * Chapter 07 — moves. Five signature moves, each a full-width band with a
 * less -> more split-flap flip table (from the shared flipReveal helper).
 *
 * This is a layout/interaction chapter: all copy is static in the HTML
 * fragment; JS only wires up the five flip tables and scroll reveals.
 *
 * Contract: docs/CONTRACT.md.
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { flipReveal } from '../lib/interactions.js';

const FROM_TO_LABELS = ['Dependence', 'Agency'];

/** The five moves' less -> more rows, verbatim from STORY.md ch.07. */
const FLIP_ROWS_BY_MOVE = {
  1: [
    { less: 'Escalating charges', more: 'Hacking the system' },
    { less: 'Prison', more: 'Hotel' },
    { less: 'Reinforcing unfair', more: 'Fighting for change' },
  ],
  2: [
    { less: 'Treating pain', more: 'Diagnosing the problem' },
    { less: 'Lipstick on a pig', more: 'Backing it up' },
    { less: 'Opaque', more: 'Transparent' },
  ],
  3: [
    { less: 'Dependency', more: 'Independency' },
    { less: 'Dictation from the brand', more: 'Walk throughs on YT & TikTok' },
    { less: 'Broadcast to audiences', more: 'Self-help contexts' },
  ],
  4: [
    { less: 'Status as currency', more: 'Time as currency' },
    { less: 'Fragmentation', more: 'Ecosystems' },
    { less: 'Customer support', more: 'Life advisory' },
  ],
  5: [
    { less: 'Setting tasks', more: 'Gamifying goals' },
    { less: 'CRM modules', more: 'Habit forming' },
    { less: 'Random rewards', more: 'Meaningful rewards' },
  ],
};

/**
 * Mount one flip table into its band's placeholder, if present.
 * @param {HTMLElement} rootEl
 * @param {number} moveNumber
 */
const mountFlipTable = (rootEl, moveNumber) => {
  const container = rootEl.querySelector(`[data-flip-${moveNumber}]`);
  if (!container) return;
  const rows = FLIP_ROWS_BY_MOVE[moveNumber];
  if (!rows) return;
  flipReveal(container, { rows, fromToLabels: FROM_TO_LABELS });
};

/**
 * @param {HTMLElement} rootEl - the <section class="chapter" id="07-moves"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
export default function init(rootEl, data) {
  if (!rootEl) return;

  Object.keys(FLIP_ROWS_BY_MOVE).forEach((moveNumber) => {
    mountFlipTable(rootEl, Number(moveNumber));
  });

  observeReveals(rootEl);
  observeCounters(rootEl);
}
