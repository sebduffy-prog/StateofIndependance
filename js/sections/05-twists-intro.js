/**
 * 05-twists-intro.js — the twists opener (Z-AXIS depth stage).
 *
 * One full-bleed navy pivot: "There are *twists* in the story" display title
 * + three anomaly one-liners that set up the next three stages. Each card
 * holds a reframe line revealed on hover/focus — the marquee beat. Revealing
 * any card clears the gate hint. Copy traces to docs/STORY.md ch04.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 5-twists-intro.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="05-twists-intro">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';

export default function init(rootEl, data) {
  const journey = data && data.journey;

  // Entrance: re-play the character->title reveal on every chapter:arrive.
  // arrival() handles [data-arrival], [data-arrival-scramble], [data-arrival-count].
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e && e.detail);
  });

  const cards = Array.from(rootEl.querySelectorAll('[data-twist]'));
  if (!cards.length) return;

  let gateDone = false;

  const onReveal = (card) => {
    card.classList.add('is-open');
    if (!gateDone) {
      gateDone = true;
      if (journey && typeof journey.ready === 'function') journey.ready();
    }
  };

  cards.forEach((card) => {
    // Pointer path — hover opens the reframe.
    card.addEventListener('mouseenter', () => onReveal(card));
    // Focus path — Tab reaches each card (tabindex=0) and opens same line.
    card.addEventListener('focus', () => onReveal(card));
    // Keyboard pin — Enter/Space toggles so user can dwell without holding focus.
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onReveal(card);
        card.classList.toggle('is-pinned');
      }
    });
  });

  // Advisory gate hint only — Next is NEVER trapped.
  if (journey && typeof journey.gate === 'function') journey.gate();
}
