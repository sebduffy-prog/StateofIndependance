/**
 * 05-twists-intro.js — the twists opener (Z-AXIS depth stage).
 *
 * One full-bleed navy pivot: the bold-black title "There are *twists* in the
 * story" + three anomaly one-liners that set up the next three stages
 * (06 trust paradox, 07 protected joy, 08 AI on tap). Each anomaly card holds a
 * reframe line that is revealed on hover/focus — the marquee beat. Revealing any
 * one card clears the gate hint. All copy traces to docs/STORY.md ch04.
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

  // Entrance: re-play the character->title reveal on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e && e.detail));

  const cards = Array.from(rootEl.querySelectorAll('[data-twist]'));
  if (!cards.length) return;

  let firstReveal = true;
  const onReveal = (card) => {
    card.classList.add('is-open');
    if (firstReveal) {
      firstReveal = false;
      if (journey && typeof journey.ready === 'function') journey.ready();
    }
  };

  cards.forEach((card) => {
    // Pointer + focus both open the reframe (focus covers the keyboard path:
    // each card is tabindex=0, so Tab reaches it and opens the same line).
    card.addEventListener('mouseenter', () => onReveal(card));
    card.addEventListener('focus', () => onReveal(card));
    // Enter/Space pin it open so a keyboard user can dwell without holding focus.
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-pinned');
        onReveal(card);
      }
    });
  });

  // Advisory hint only — Next is never trapped.
  if (journey && typeof journey.gate === 'function') journey.gate();
}
