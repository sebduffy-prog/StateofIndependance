/**
 * 05-twists-intro.js — the twists chapter divider (full-bleed navy pivot).
 *
 * "There are *twists* in the story": a huge display title plus the three
 * anomalies set as one full-height editorial INDEX — a meridian thread with
 * three numbered rows (01/02/03) that set up the next three stages
 * (06 trust · 07 joy · 08 AI). Hovering or focusing a row slides its reframe
 * open and glides a marker down the meridian to it — the tactile reveal.
 * Revealing any row clears the advisory gate hint. Copy traces to STORY.md ch04.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 5-twists-intro.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="05-twists-intro">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival, prefersReducedMotion } from '../lib/experiential.js';

export default function init(rootEl, data) {
  const journey = data && data.journey;
  const root = rootEl.querySelector('[data-twists-intro-root]');
  const list = rootEl.querySelector('.twists-intro-index-list');
  const marker = rootEl.querySelector('[data-meridian-marker]');
  const reduced = prefersReducedMotion();

  // Entrance: re-play the assemble + draw the meridian on every chapter:arrive.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e && e.detail);
    if (root) {
      // Force a restart of the meridian draw on each arrival.
      root.classList.remove('is-threaded');
      requestAnimationFrame(() => root.classList.add('is-threaded'));
    }
  });
  // Thread immediately too, in case arrival fires before this listener binds.
  if (root) root.classList.add('is-threaded');

  const cards = Array.from(rootEl.querySelectorAll('[data-twist]'));
  if (!cards.length) return;

  let gateDone = false;

  // Glide the meridian marker to a row's vertical centre (relative to the list).
  const moveMarkerTo = (card) => {
    if (!root || !list || !marker) return;
    const node = card.querySelector('.twists-intro-node');
    const ref = node || card;
    const listRect = list.getBoundingClientRect();
    const refRect = ref.getBoundingClientRect();
    if (!listRect.height) return;
    const y = ((refRect.top + refRect.height / 2) - listRect.top) / listRect.height * 100;
    root.classList.add('is-marker-live');
    list.style.setProperty('--marker-y', `${y.toFixed(2)}%`);
  };

  const onReveal = (card) => {
    card.classList.add('is-open');
    moveMarkerTo(card);
    if (!gateDone) {
      gateDone = true;
      if (journey && typeof journey.ready === 'function') journey.ready();
    }
  };

  cards.forEach((card) => {
    // Pointer path — hover opens the reframe + moves the marker.
    card.addEventListener('mouseenter', () => onReveal(card));
    // Focus path — Tab reaches each row (tabindex=0) and opens the same line.
    card.addEventListener('focus', () => onReveal(card));
    // Keyboard pin — Enter/Space toggles so the user can dwell without holding.
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onReveal(card);
        card.classList.toggle('is-pinned');
      }
    });
  });

  // Under reduced motion the reframes are open from the start; show the marker
  // resting on the first row so the meridian never reads as inert.
  if (reduced && cards[0]) {
    requestAnimationFrame(() => moveMarkerTo(cards[0]));
  }

  // Advisory gate hint only — Next is NEVER trapped.
  if (journey && typeof journey.gate === 'function') journey.gate();
}
