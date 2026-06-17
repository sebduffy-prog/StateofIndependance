/**
 * 01-cover — the hero. The signature maze illustration (its own orbit ring, the
 * navy bear, the figure at the maze mouth) is the focal point, used once, big,
 * on a vast warm field. The one hero motion is the marquee: the cream "you" dot
 * is born at the maze mouth and the visitor traces it into the maze's heart.
 *
 * Composes existing primitives only (does not reinvent them):
 *   - draggable       (tactile.js)       the trace handle, snapped to the SVG path
 *   - arrival         (experiential.js)  assembling entrance + scramble (ritual 1st)
 *   - magneticButton  (experiential.js)  the Begin cue leans to the cursor
 *
 * Soft gating: journey.gate() lights the gentle "try it" hint; finishing the
 * trace calls journey.ready() to clear it. Next is NEVER blocked by this.
 */

import { draggable } from '../lib/tactile.js';
import { arrival, magneticButton, prefersReducedMotion } from '../lib/experiential.js';

const PATH_SAMPLES = 220;   // resolution for the nearest-point snap
const COMPLETE_AT = 0.92;   // trace progress that counts as "arrived"

/**
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="01-cover">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
export default function init(rootEl, data) {
  const { journey } = data || {};
  const reduced = prefersReducedMotion();
  const cleanups = [];

  /* ── reduced-motion poster swap for the maze ────────────────────── */
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

  /* ── the assembling entrance (idempotent per arrival) + the one-time
       "you" dot birth bloom at the maze mouth ───────────────────────── */
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e && e.detail ? e.detail : {});
    if (!reduced) {
      const handle = rootEl.querySelector('[data-cover-handle]');
      if (handle) {
        handle.classList.remove('is-born');
        requestAnimationFrame(() => handle.classList.add('is-born'));
      }
    }
  });

  /* ── the trace-into-the-maze tactile reward (the marquee) ────────── */
  wireTrace(rootEl, journey, reduced, cleanups);

  /* ── tidy if the step is ever fully torn down ────────────────────── */
  rootEl.addEventListener(
    'chapter:destroy',
    () => cleanups.forEach((fn) => typeof fn === 'function' && fn()),
    { once: true },
  );
}

/* ─────────────────────────── trace-the-maze ────────────────────────── */

/**
 * Wire the draggable "you" dot to follow the SVG guide path: the handle snaps
 * to the nearest point on the path, the ink draws in to match progress, and on
 * reaching the maze's heart the trail completes and the Begin cue wakes.
 * Keyboard arrows nudge the handle (draggable ships the keyboard path).
 */
function wireTrace(rootEl, journey, reduced, cleanups) {
  const stage = rootEl.querySelector('[data-cover-stage]');
  const guide = rootEl.querySelector('[data-cover-path]');
  const ink = rootEl.querySelector('[data-cover-ink]');
  const handle = rootEl.querySelector('[data-cover-handle]');
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (!stage || !guide || !ink || !handle) return;

  if (journey && typeof journey.gate === 'function') journey.gate();

  // Pre-set the ink as a fully-hidden dash so progress just reveals it.
  const pathLen = guide.getTotalLength();
  ink.style.strokeDasharray = String(pathLen);
  ink.style.strokeDashoffset = String(pathLen);

  // Sample the path once in the SVG's own 800×800 user space.
  const samples = samplePath(guide, pathLen, PATH_SAMPLES);

  // Map an SVG user-space point to a pixel offset within the stage (the SVG and
  // the square image both use xMidYMid meet → letterboxed into a centred square).
  const userToStagePx = (ux, uy) => {
    const rect = stage.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const offX = (rect.width - size) / 2;
    const offY = (rect.height - size) / 2;
    return { x: offX + (ux / 800) * size, y: offY + (uy / 800) * size };
  };
  const originPx = () => userToStagePx(samples[0].x, samples[0].y);

  let completed = false;
  const setProgress = (t) => {
    ink.style.strokeDashoffset = String(pathLen * (1 - t));
    stage.style.setProperty('--trace', t.toFixed(3));
    if (!completed && t >= COMPLETE_AT) {
      completed = true;
      handle.classList.add('is-home');
      handle.setAttribute('aria-label', 'You traced a path into the maze — you have control');
      stage.classList.add('is-traced');
      if (cue) {
        cue.classList.add('is-awake');
        if (!reduced) {
          cue.classList.remove('is-pulsing');
          requestAnimationFrame(() => cue.classList.add('is-pulsing'));
        }
      }
      if (journey && typeof journey.ready === 'function') journey.ready();
    }
  };

  // Snap an attempted pixel offset (from origin) to the nearest path sample,
  // returning the clamped offset AND advancing the ink to that arc length.
  const snap = ({ x, y }) => {
    const origin = originPx();
    const px = origin.x + x;
    const py = origin.y + y;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < samples.length; i += 1) {
      const sp = userToStagePx(samples[i].x, samples[i].y);
      const d = (sp.x - px) ** 2 + (sp.y - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    const target = userToStagePx(samples[best].x, samples[best].y);
    setProgress(best / (samples.length - 1));
    return { x: target.x - origin.x, y: target.y - origin.y };
  };

  // Anchor the handle's resting origin to the path's start (the maze mouth) so
  // the transform-based drag offsets line up with the snapped samples.
  const placeHandle = () => {
    const o = originPx();
    handle.style.left = `${o.x}px`;
    handle.style.top = `${o.y}px`;
  };
  placeHandle();
  const onResize = () => placeHandle();
  window.addEventListener('resize', onResize, { passive: true });
  rootEl.addEventListener('chapter:arrive', placeHandle);
  cleanups.push(() => window.removeEventListener('resize', onResize));

  const handles = draggable(handle, {
    spring: false,        // stay on the path where released
    momentum: 0,          // no fling — the path is the constraint
    keyboardStep: 24,
    bounds: snap,         // every move is projected onto the path
  });
  cleanups.push(() => handles.destroy());

  // Reduced motion: pre-complete the inked path so the still hero reads done.
  if (reduced) setProgress(1);
}

/* ─────────────────────────────── helpers ───────────────────────────── */

/** Click the journey's global Next, advancing past the cover. */
function advanceJourney() {
  const next = document.getElementById('journeyNext');
  if (next && !next.disabled) next.click();
}

/** Evenly sample an SVG path into [{x,y}] points in its own user space. */
function samplePath(pathEl, length, count) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const p = pathEl.getPointAtLength((length * i) / (count - 1));
    out.push({ x: p.x, y: p.y });
  }
  return out;
}
