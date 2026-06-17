/**
 * 01-cover — the hero. The signature maze illustration (the amber isometric
 * maze, the navy bear, the figure at the entrance) is the focal point, used
 * once, big, on a vast warm field. The maze artwork is clean: the stray orbit
 * ring and the figure's map ("box") are removed, and there is no trace/handle
 * overlay — the maze simply reads as the brand moment.
 *
 * Composes existing primitives only (does not reinvent them):
 *   - arrival         (experiential.js)  assembling entrance + scramble (ritual 1st)
 *   - magneticButton  (experiential.js)  the Begin cue leans to the cursor
 *
 * Navigation is engine-owned (scroll + the global Next): the cover never gates
 * the journey.
 */

import { arrival, magneticButton, prefersReducedMotion } from '../lib/experiential.js';

/**
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="01-cover">
 */
export default function init(rootEl) {
  const reduced = prefersReducedMotion();
  const cleanups = [];

  /* ── maze poster ─────────────────────────────────────────────────
     The maze is served as a clean still image (its only original motion was
     the orbiting ring/ball, removed at the client's request; the gentle
     ambient float is CSS-owned and reduced-motion safe). The poster swap is
     kept defensively so an animated source would still fall back to its still
     under reduced motion. */
  const maze = rootEl.querySelector('[data-cover-maze]');
  if (maze && reduced) {
    const still = maze.getAttribute('data-still');
    if (still) maze.setAttribute('src', still);
  }

  /* ── the Begin cue: magnetic, and it advances the journey ────────── */
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (cue) {
    cleanups.push(magneticButton(cue, { strength: 0.3, radius: 120 }));
    cue.addEventListener('click', advanceJourney);
  }

  /* ── the assembling entrance (idempotent per arrival) ────────────── */
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e && e.detail ? e.detail : {});
  });

  /* ── tidy if the step is ever fully torn down ────────────────────── */
  rootEl.addEventListener(
    'chapter:destroy',
    () => cleanups.forEach((fn) => typeof fn === 'function' && fn()),
    { once: true },
  );
}

/* ─────────────────────────────── helpers ───────────────────────────── */

/** Click the journey's global Next, advancing past the cover. */
function advanceJourney() {
  const next = document.getElementById('journeyNext');
  if (next && !next.disabled) next.click();
}
