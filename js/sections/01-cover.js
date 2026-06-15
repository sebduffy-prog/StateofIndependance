/**
 * Chapter 01 — cover.
 *
 * Full-bleed mustard cover: an ambient field of ~300 ink dots drifts behind
 * an ink frame, the cursor gently repels nearby dots, and one dot is the
 * highlighted "you" (the 1,505th respondent). The highlighter wipe on the word
 * "independence" is triggered on load. All motion is reduced-motion safe — the
 * dotField lib jump-cuts internally and we skip the wipe / repulsion handler.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="01-cover"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 300;
const YOU_INDEX = 0; // the highlighted "you" dot
const REPEL_RADIUS = 0.16; // normalised distance within which dots are pushed
const REPEL_STRENGTH = 0.07; // how far (normalised) a dot is nudged at the centre

const mustard = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--mustard')
    .trim() || '#FFC931';

/** Build the ambient base layout: a calm scatter biased to the edges so the
 *  central copy stays readable. Returns normalised {x,y} targets. */
const buildBaseTargets = (count) =>
  Array.from({ length: count }, (_, i) => {
    if (i === YOU_INDEX) {
      // Park "you" in the lower-left clearing near its caption.
      return { x: 0.12, y: 0.74 };
    }
    return { x: Math.random(), y: Math.random() };
  });

/** Repel base targets away from the pointer, returning a new target array
 *  (immutable — never mutates the base). */
const repelFrom = (base, px, py) =>
  base.map((t, i) => {
    if (i === YOU_INDEX) return t; // "you" stays put
    const dx = t.x - px;
    const dy = t.y - py;
    const dist = Math.hypot(dx, dy);
    if (dist >= REPEL_RADIUS || dist === 0) return t;
    const push = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
    return {
      x: Math.min(1, Math.max(0, t.x + (dx / dist) * push)),
      y: Math.min(1, Math.max(0, t.y + (dy / dist) * push)),
    };
  });

export default function init(rootEl, data) {
  observeReveals(rootEl);

  const dotsHost = rootEl.querySelector('[data-cover-dots]');
  const hl = rootEl.querySelector('[data-cover-hl]');
  const reduced = prefersReducedMotion();

  // Trigger the highlighter wipe once the frame has painted.
  if (hl) {
    if (reduced) {
      hl.classList.add('is-wiped');
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => hl.classList.add('is-wiped'));
      });
    }
  }

  if (!dotsHost) return;

  const field = dotField(dotsHost, {
    count: DOT_COUNT,
    dotRadius: 2.4,
    ariaLabel: 'A field of ink dots — one per survey respondent — drifting behind the cover.',
  });

  const baseTargets = buildBaseTargets(DOT_COUNT);
  field.formation(baseTargets);
  field.highlight(YOU_INDEX, mustard());
  field.drift(1); // ambient brownian motion (the must-have)

  if (reduced) return; // no pointer repulsion under reduced motion

  // Cursor gently repels nearby dots by re-issuing shifted targets. Throttled
  // to one update per animation frame; reverts to the base layout on leave.
  let pending = false;
  let lastX = 0;
  let lastY = 0;

  const applyRepel = () => {
    pending = false;
    field.formation(repelFrom(baseTargets, lastX, lastY));
  };

  const onPointerMove = (event) => {
    const rect = dotsHost.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    lastX = (event.clientX - rect.left) / rect.width;
    lastY = (event.clientY - rect.top) / rect.height;
    if (pending) return;
    pending = true;
    requestAnimationFrame(applyRepel);
  };

  const onPointerLeave = () => {
    field.formation(baseTargets);
  };

  dotsHost.addEventListener('pointermove', onPointerMove);
  dotsHost.addEventListener('pointerleave', onPointerLeave);
}
