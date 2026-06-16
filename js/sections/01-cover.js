/**
 * Chapter 01: cover — the journey's opening step (narrative, NOT gated).
 *
 * HERO: a warm yellow→orange gradient ground (CSS) carrying the signature deck
 * MAZE motion logo with a live SVG orbit ring, a huge Poppins Black wordmark,
 * and — behind it all — an ambient field of respondent dots tinted navy for
 * contrast on the amber. The maze + orbit drift on pointer (parallax).
 *
 * JOURNEY: this is a narrative step, so it does NOT call data.journey.gate();
 * Next default-unlocks after the engine's short dwell. The on-page "Begin"
 * button is a convenience that simply triggers the journey's own Next control.
 *
 * The dotField carries its own physics (mutual repulsion, momentum, cursor
 * force). One dot is the highlighted "you" (the 1,505th respondent), parked
 * near its caption in the lower-left clearing.
 *
 * Layering: decorative layers sit behind the copy via CSS z-index +
 * pointer-events:none, so nothing occludes the wordmark and the cursor reaches
 * the dot-field. (See css/sections/01-cover.css.)
 *
 * Reduced motion: the maze swaps to its static first-frame PNG, the orbit bead
 * stops, the field jump-cuts to its layout, and no parallax/pointer force runs
 * (the libs enforce reduced-motion too).
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="01-cover"> element
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeParallax } from '../lib/experiential.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 240; // dense enough to read as a lively field on the warm ground
const YOU_INDEX = 0; // the highlighted "you" dot
const DRIFT_AMP = 0.85; // livelier ambient brownian motion (reduced-motion safe)

/** Resolve a brand token to its hex, with a safe fallback. */
const token = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * Build the ambient layout: a calm scatter, with "you" parked in the
 * lower-left clearing near its caption. Returns normalised {x,y,colour}
 * targets in 0..1 space.
 * @param {number} count
 * @param {string} dotColour
 * @returns {{x:number,y:number,colour:string}[]}
 */
const buildTargets = (count, dotColour) =>
  Array.from({ length: count }, (_, i) => {
    if (i === YOU_INDEX) {
      return { x: 0.08, y: 0.84, colour: dotColour };
    }
    return { x: Math.random(), y: Math.random(), colour: dotColour };
  });

export default function init(rootEl) {
  observeReveals(rootEl);

  const hero = rootEl.querySelector('[data-cover-hero]');
  const dotsHost = rootEl.querySelector('[data-cover-dots]');
  const maze = rootEl.querySelector('[data-cover-maze]');
  const reduced = prefersReducedMotion();

  // Navy on the warm ground keeps the dots legible (contrast safety).
  const dotColour = token('--soi-navy', '#0A1A5C');
  const youColour = token('--soi-teal', '#2BB7E8'); // single bright accent

  // Under reduced motion, swap the animated maze GIF for its static frame.
  if (reduced && maze) {
    const still = maze.getAttribute('data-still');
    if (still) maze.setAttribute('src', still);
  }

  // "Begin" is a convenience that triggers the journey's own Next control.
  // This step is narrative (ungated), so Next default-unlocks after the dwell;
  // before then the click is a no-op (the disabled control simply ignores it).
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (cue) {
    cue.addEventListener('click', () => {
      const next = document.getElementById('journeyNext');
      if (next) next.click();
    });
  }

  // Experiential motion: subtle pointer parallax across the maze + orbit.
  // Reduced-motion safe inside the lib (jumps to rest, installs no work).
  observeParallax(rootEl, { maxShiftPx: 48 });

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

  // The journey mounts every step hidden, so this init() runs while the host
  // has zero size and the dotField canvas measures 1×1. Once the step is shown
  // and the host gains real dimensions, nudge the field to re-measure (it
  // re-sizes its canvas on a window 'resize'); otherwise the 1×1 canvas would
  // stretch a single navy pixel full-bleed over the warm ground.
  if (typeof ResizeObserver !== 'undefined') {
    let measured = false;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      if (measured) return;
      measured = true;
      ro.disconnect();
      window.dispatchEvent(new Event('resize'));
    });
    ro.observe(dotsHost);
  }

  if (reduced) return; // no pointer force under reduced motion
  if (!hero) return;

  // Subtle cursor repulsion across the WHOLE hero: track the pointer on the
  // hero and feed normalised coords to the field's built-in repulsion.
  let pending = false;
  let lastX = 0;
  let lastY = 0;

  const flush = () => {
    pending = false;
    field.setPointer(lastX, lastY);
  };

  const onPointerMove = (event) => {
    const rect = hero.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    lastX = (event.clientX - rect.left) / rect.width;
    lastY = (event.clientY - rect.top) / rect.height;
    if (pending) return;
    pending = true;
    requestAnimationFrame(flush);
  };

  const onPointerLeave = () => field.setPointer(null, null);

  hero.addEventListener('pointermove', onPointerMove);
  hero.addEventListener('pointerleave', onPointerLeave);
}
