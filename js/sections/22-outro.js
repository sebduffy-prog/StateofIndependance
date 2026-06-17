/**
 * 22-outro — The cinematic close.
 *
 * Beat sequence on every chapter:arrive (idempotent):
 *   0 — eyebrow / kicker settles (arrival cascade)
 *   1 — Institutions ▸▸▸▸ Individuals assembles (arrival cascade)
 *   2 — Martin Lewis quote line 1 arrives; line 2 scrambles in
 *   3 — "Thank you" lands
 *   4 — credits settle
 *   5 — you-dot disperses upward with the nation
 *
 * Under reduced-motion: arrival() jumps everything to its final state
 * immediately; the you-dot fade is instant.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section id="22-outro"> element
 * @param {{ survey, segments, tgi, journey }} data
 */
import { prefersReducedMotion } from '../lib/reveal.js';
import { arrival, scrambleIn, observeParallax } from '../lib/experiential.js';

/** Delay after the last arrival() cascade before the you-dot disperses. */
const DISPERSE_DELAY_MS = 2200;

/**
 * Fade the persistent you-dot upward so the visitor's marker leaves with
 * the nation. main.js re-anchors it on the next step that provides one.
 */
const disperseYouDot = () => {
  const dot = document.querySelector('.you-dot');
  if (!dot) return;
  dot.style.transition = 'opacity 1.8s ease, transform 1.8s ease';
  dot.style.opacity = '0';
  const current = dot.style.transform || '';
  dot.style.transform = current + ' translateY(-48px)';
};

const restoreYouDot = () => {
  const dot = document.querySelector('.you-dot');
  if (!dot) return;
  dot.style.transition = '';
  dot.style.opacity = '';
  dot.style.transform = '';
};

export default function init(rootEl, data) {
  observeParallax(rootEl, { maxShiftPx: 32 });

  const scrambleEl = rootEl.querySelector('[data-arrival-scramble]');

  let disperseTimer = null;

  const clearDisperse = () => {
    if (disperseTimer) {
      window.clearTimeout(disperseTimer);
      disperseTimer = null;
    }
  };

  const playClose = (detail = {}) => {
    clearDisperse();
    restoreYouDot();

    if (prefersReducedMotion()) {
      // Snap to final state — no animation, no disperse delay.
      arrival(rootEl, { ...detail });
      window.setTimeout(disperseYouDot, 300);
      return;
    }

    // arrival() cascades all [data-arrival] elements in document order,
    // then fires scrambleIn on [data-arrival-scramble]. The second line of
    // the Martin Lewis quote carries data-arrival-scramble so it decrypts
    // into place after the first line has settled.
    arrival(rootEl, { ...detail });

    // The you-dot disperses after the arrival cascade has played.
    disperseTimer = window.setTimeout(disperseYouDot, DISPERSE_DELAY_MS);
  };

  // Re-play on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => playClose(e.detail));
}
