/**
 * Chapter 01: cover — Design World V5 (deck-faithful, top-tier, experiential).
 *
 * ACT 1 — HERO: a warm yellow→orange gradient ground (CSS) carrying the
 * signature deck MAZE motion logo with a live SVG orbit ring, a huge Poppins
 * Black wordmark whose "independence" underline accent wipes in on load, and —
 * behind it all — an ambient field of respondent dots tinted navy for contrast
 * on the amber. The maze, orbit and bear drift on scroll (parallax), and a thin
 * scroll-progress meter tracks the reader through the hero.
 *
 * ACT 2 — STATEMENT: a deep navy velvet ground carrying VCCP's brand image (a
 * girl standing up to a bear, cream-on-navy) beside the Challenger copy, then
 * the five signature moves as a hover-reactive index. Its entrance is driven by
 * scroll progress (chapterTransition → CSS --enter).
 *
 * The dotField carries its own physics (mutual repulsion, momentum, cursor
 * force). One dot is the highlighted "you" (the 1,505th respondent), parked
 * near its caption in the lower-left clearing.
 *
 * Layering: decorative layers sit behind the copy via CSS z-index +
 * pointer-events:none, so nothing occludes the wordmark and the cursor reaches
 * the dot-field. (See css/sections/01-cover.css.)
 *
 * Reduced motion: the underline lands instantly, the maze swaps to its static
 * first-frame PNG, the orbit bead stops, the field jump-cuts to its layout, no
 * parallax/pointer force runs, and the progress meter freezes at rest (the libs
 * enforce reduced-motion too).
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="01-cover"> element
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeParallax, chapterTransition, scrollScene } from '../lib/experiential.js';
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
  const hl = rootEl.querySelector('[data-cover-hl]');
  const maze = rootEl.querySelector('[data-cover-maze]');
  const statement = rootEl.querySelector('[data-cover-statement]');
  const progressBar = rootEl.querySelector('[data-cover-progress]');
  const reduced = prefersReducedMotion();

  // Navy on the warm ground keeps the dots legible (contrast safety).
  const dotColour = token('--soi-navy', '#0A1A5C');
  const youColour = token('--soi-teal', '#2BB7E8'); // single bright accent

  // Under reduced motion, swap the animated maze GIF for its static frame.
  if (reduced && maze) {
    const still = maze.getAttribute('data-still');
    if (still) maze.setAttribute('src', still);
  }

  // Scroll cue: a real <button> (keyboard-activatable) that smooth-scrolls to
  // the research chapter, honouring reduced motion.
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (cue) {
    cue.addEventListener('click', () => {
      const research = document.getElementById('02-research');
      if (research) {
        research.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      }
    });
  }

  // Trigger the underline wipe once the layout has painted.
  if (hl) {
    if (reduced) {
      hl.classList.add('is-wiped');
    } else {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => hl.classList.add('is-wiped'));
      });
    }
  }

  // Experiential motion: subtle parallax across the whole chapter (maze, orbit,
  // bear) and a scroll-progress entrance for the statement band. Both are
  // reduced-motion safe inside the lib (jump to rest, install no scroll work).
  observeParallax(rootEl, { maxShiftPx: 48 });
  if (statement) chapterTransition(statement);

  // Thin scroll-progress meter through the hero (continuous, rAF-batched).
  if (hero && progressBar) {
    scrollScene(hero, [], {
      onProgress: (p) => {
        progressBar.style.width = `${Math.round(p * 100)}%`;
      },
    });
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
