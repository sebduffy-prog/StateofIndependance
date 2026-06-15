/**
 * Chapter 01: cover — Design World V2.
 *
 * The State-of-Independence hero: a warm mustard→orange gradient ground (set
 * in CSS) carrying thin orbit-circle line motifs, two pale seed dots, a cream
 * bear+figure silhouette grounded on the bottom edge, and — behind it all —
 * an ambient field of respondent dots. Over the top, a huge Inter Tight
 * display wordmark with the highlighter wiping in on INDEPENDENCE.
 *
 * The dotField carries its own physics (mutual repulsion, momentum, cursor
 * force). On the warm ground the dots are tinted NAVY so they keep deliberate
 * contrast against the amber (never the old ink-on-anything default); one dot
 * is the highlighted "you" (the 1,505th respondent), parked near its caption.
 *
 * Layering: every decorative layer sits behind the copy via CSS z-index +
 * pointer-events:none, so nothing occludes the wordmark and the cursor still
 * reaches the dot-field. (See css/sections/01-cover.css §LAYERING.)
 *
 * Reduced motion: the highlighter lands instantly, the field jump-cuts to its
 * layout, the orbit stops spinning (shared guard), and no pointer force / drift
 * runs (the lib enforces this too).
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="01-cover"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 240; // dense enough to read as a lively field on the warm ground
const YOU_INDEX = 0; // the highlighted "you" dot
const DRIFT_AMP = 0.85; // livelier ambient brownian motion (still calm, reduced-motion safe)

/** Resolve a brand token to its hex, with a safe fallback. */
const token = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * Build the ambient layout: a calm scatter biased away from the top-left copy
 * and the grounded silhouette, every dot tinted navy so it reads on the warm
 * ground. Returns normalised {x,y,colour} targets in 0..1 space.
 */
const buildTargets = (count, dotColour) =>
  Array.from({ length: count }, (_, i) => {
    if (i === YOU_INDEX) {
      // Park "you" in the lower-left clearing near its caption.
      return { x: 0.1, y: 0.82, colour: dotColour };
    }
    return { x: Math.random(), y: Math.random(), colour: dotColour };
  });

export default function init(rootEl) {
  observeReveals(rootEl);

  const stage = rootEl.querySelector('.cover-stage');
  const dotsHost = rootEl.querySelector('[data-cover-dots]');
  const hl = rootEl.querySelector('[data-cover-hl]');
  const reduced = prefersReducedMotion();

  // Navy on the warm ground keeps the dots legible (contrast safety §6).
  const dotColour = token('--soi-navy', '#0A1A5C');
  const youColour = token('--soi-teal', '#2BB7E8'); // single bright accent

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
    dotRadius: 3.1, // bigger marks → clearly visible navy dots on the warm ground
    ariaLabel:
      'A lively field of dots, one per survey respondent, drifting behind the cover.',
  });

  field.formation(buildTargets(DOT_COUNT, dotColour));
  field.highlight(YOU_INDEX, youColour);
  field.drift(DRIFT_AMP);

  if (reduced) return; // no pointer force under reduced motion
  if (!stage) return;

  // Wire subtle cursor repulsion across the WHOLE hero (not just the canvas
  // box): track the pointer on the stage and feed normalised coords to the
  // field's built-in repulsion via setPointer.
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
