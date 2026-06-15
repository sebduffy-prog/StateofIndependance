/**
 * Chapter 01: cover.
 *
 * Full-bleed mustard hero. No page frame, no plate: the Girl & Bear stands
 * flush on the bottom ground line as a large physical figure, the wordmark
 * commands the screen in the uppercase display treatment, and a calm,
 * well-spaced field of ink dots drifts behind the whole composition.
 *
 * The dotField lib now carries its own physics (mutual repulsion so dots
 * never crowd, momentum, cursor force). We keep the count modest, drift
 * gentle, and wire setPointer from the whole stage so the cursor subtly
 * pushes nearby dots. One dot is the highlighted "you" (the 1,505th
 * respondent), parked quietly near its caption.
 *
 * Reduced motion: the highlighter lands instantly, the field jump-cuts to
 * its layout, and no pointer force / drift runs (the lib enforces this too).
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="01-cover"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 220; // calm and well-spaced, not crowding
const YOU_INDEX = 0; // the highlighted "you" dot
const DRIFT_AMP = 0.5; // gentle ambient brownian motion

const mustard = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue('--mustard')
    .trim() || '#FFC931';

/**
 * Build the ambient layout: a calm scatter biased toward the edges so the
 * top-left copy and the grounded bear both stay clear. Returns normalised
 * {x,y} targets in 0..1 space.
 */
const buildTargets = (count) =>
  Array.from({ length: count }, (_, i) => {
    if (i === YOU_INDEX) {
      // Park "you" in the lower-left clearing near its caption.
      return { x: 0.1, y: 0.82 };
    }
    return { x: Math.random(), y: Math.random() };
  });

export default function init(rootEl) {
  observeReveals(rootEl);

  const stage = rootEl.querySelector('.cover-stage');
  const dotsHost = rootEl.querySelector('[data-cover-dots]');
  const hl = rootEl.querySelector('[data-cover-hl]');
  const reduced = prefersReducedMotion();

  // Scroll cue: a real <button> (keyboard-activatable via Enter/Space) that
  // smooth-scrolls to the research chapter, honouring reduced motion.
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (cue) {
    cue.addEventListener('click', () => {
      const research = document.getElementById('02-research');
      if (research) {
        research.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  // Trigger the highlighter wipe once the layout has painted.
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
    dotRadius: 2.2,
    ariaLabel:
      'A calm field of ink dots, one per survey respondent, drifting behind the cover.',
  });

  field.formation(buildTargets(DOT_COUNT));
  field.highlight(YOU_INDEX, mustard());
  field.drift(DRIFT_AMP);

  if (reduced) return; // no pointer force under reduced motion

  // Wire subtle cursor repulsion across the WHOLE hero, not just the canvas
  // box: track the pointer on the stage and feed normalised coords to the
  // field's built-in repulsion via setPointer.
  if (!stage) return;

  let pending = false;
  let lastX = 0;
  let lastY = 0;

  const flush = () => {
    pending = false;
    field.setPointer(lastX, lastY);
  };

  const onPointerMove = (event) => {
    const rect = stage.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    lastX = (event.clientX - rect.left) / rect.width;
    lastY = (event.clientY - rect.top) / rect.height;
    if (pending) return;
    pending = true;
    requestAnimationFrame(flush);
  };

  const onPointerLeave = () => field.setPointer(null, null);

  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerleave', onPointerLeave);
}
