/**
 * Chapter 07 — moves. Five signature moves, each a full-bleed band that
 * alternates a warm mustard→orange ground and deep navy, carrying a deck
 * bear-world motif, the lesson/beats/quotes/ad-mockup evidence, and a
 * less→more flip table (shared flipReveal helper).
 *
 * Experiential motion (js/lib/experiential.js): chapterTransition supplies the
 * --enter entrance progress that eases each band up + in; observeParallax
 * drifts the bear-world panels, the maze hero and the ad-mockup evidence at
 * different speeds for depth; scrollScene reveals each shift card's rows in
 * sequence as the band scrolls through. All reduced-motion safe.
 *
 * No fabricated numbers — every stat/quote/shift is verbatim from STORY.md.
 *
 * Contract: docs/CONTRACT.md.
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { flipReveal } from '../lib/interactions.js';
import {
  chapterTransition,
  observeParallax,
  scrollScene,
} from '../lib/experiential.js';

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
 * Mount one flip table into its band's placeholder.
 * @param {HTMLElement} rootEl
 * @param {number} moveNumber
 * @returns {HTMLButtonElement[]} the flip-row buttons (for staged reveal)
 */
const mountFlipTable = (rootEl, moveNumber) => {
  const container = rootEl.querySelector(`[data-flip-${moveNumber}]`);
  if (!container) return [];
  const rows = FLIP_ROWS_BY_MOVE[moveNumber];
  if (!rows) return [];
  flipReveal(container, { rows, fromToLabels: FROM_TO_LABELS });
  return Array.from(container.querySelectorAll('.flip-row'));
};

/**
 * Stagger the flip-card rows into view as the band scrolls through, so the
 * shift reads as a build rather than a static list. Pure class toggle; CSS
 * owns the at-rest + revealed visuals, so this never clips or reflows text.
 * @param {HTMLElement} bandEl
 * @param {HTMLButtonElement[]} rows
 * @returns {() => void} cleanup
 */
const stageShiftRows = (bandEl, rows) => {
  if (!rows.length) return () => {};
  const steps = rows.map((row, i) => ({
    at: 0.22 + i * 0.1,
    onEnter: () => row.classList.add('is-shown'),
    onLeave: () => row.classList.remove('is-shown'),
  }));
  return scrollScene(bandEl, steps);
};

/**
 * @param {HTMLElement} rootEl - the <section class="chapter" id="07-moves"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
export default function init(rootEl, data) {
  if (!rootEl) return;

  const cleanups = [];

  Object.keys(FLIP_ROWS_BY_MOVE).forEach((key) => {
    const moveNumber = Number(key);
    const rows = mountFlipTable(rootEl, moveNumber);
    const band = rootEl.querySelector(`[aria-labelledby="mv-${moveNumber}-title"]`);
    if (band) cleanups.push(stageShiftRows(band, rows));
  });

  // Experiential: ease each band in on scroll, drift the deck world panels.
  const shell = rootEl.querySelector('.mv-shell');
  if (shell) {
    rootEl.querySelectorAll('.mv-move, .mv-hero, .mv-recap').forEach((band) => {
      cleanups.push(chapterTransition(band));
    });
    cleanups.push(observeParallax(shell, { maxShiftPx: 56 }));
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  return () => cleanups.forEach((fn) => fn && fn());
}
