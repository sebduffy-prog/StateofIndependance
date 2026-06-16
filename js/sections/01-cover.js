/**
 * 01-cover — the hero. Warm gradient ground, the maze motion logo with a live
 * teal orbit ring, an ambient navy respondent dot-field, the assembling
 * wordmark, and the tactile "trace the maze" reward where the "you" dot is born.
 *
 * Composes existing primitives only (does not reinvent them):
 *   - dotField        (charts.js)        ambient 1,504 field + the cream "you" dot
 *   - draggable       (tactile.js)       the trace handle, snapped to the SVG path
 *   - arrival         (experiential.js)  assembling entrance + count-up (ritual 1st)
 *   - magneticButton  (experiential.js)  the Begin cue leans to the cursor
 *
 * Soft gating: journey.gate() lights the gentle "try it" hint; finishing the
 * trace calls journey.ready() to clear it. Next is NEVER blocked by this.
 */

import { dotField } from '../lib/charts.js';
import { draggable } from '../lib/tactile.js';
import { arrival, magneticButton, prefersReducedMotion } from '../lib/experiential.js';

const FIELD_DOTS = 150;     // ambient respondents (a calm field, not a crowd)
const PATH_SAMPLES = 220;   // resolution for the nearest-point snap
const COMPLETE_AT = 0.94;   // trace progress that counts as "arrived"

/**
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="01-cover">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
export default function init(rootEl, data) {
  const { journey } = data || {};
  const reduced = prefersReducedMotion();
  const cleanups = [];

  /* ── ambient respondent dot-field (the 1,504) ───────────────────── */
  const fieldEl = rootEl.querySelector('[data-cover-dots]');
  let field = null;
  if (fieldEl) {
    field = dotField(fieldEl, {
      count: FIELD_DOTS,
      dotRadius: 2.4,
      ariaLabel: 'A field of the 1,504 people surveyed across Britain',
    });
    field.formation([], { spring: 0.012, jostle: 0.5 }); // calm drifting cloud
    field.drift(0.5);
    field.highlight(0, getCssColour(rootEl, '--soi-cream', '#EEE9DD')); // the "you" dot
  }

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

  /* ── the assembling entrance (re-run idempotently per arrival) + the
       one-time "you" dot birth bloom ─────────────────────────────────── */
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

  /* ── the trace-the-maze tactile reward ──────────────────────────── */
  wireTrace(rootEl, journey, reduced, cleanups);

  /* ── tidy if the step is ever fully torn down ────────────────────── */
  rootEl.addEventListener(
    'chapter:destroy',
    () => {
      if (field) field.destroy();
      cleanups.forEach((fn) => typeof fn === 'function' && fn());
    },
    { once: true },
  );
}

/* ─────────────────────────── trace-the-maze ────────────────────────── */

/**
 * Wire the draggable "you" dot to follow the SVG guide path: the handle snaps
 * to the nearest point on the path, the ink draws in to match progress, the
 * orbit ring tightens via the --trace custom property, and on reaching the
 * centre the copy + Begin cue settle. Keyboard arrows nudge the handle
 * (draggable ships the keyboard path); reaching the end completes it.
 */
function wireTrace(rootEl, journey, reduced, cleanups) {
  const stage = rootEl.querySelector('[data-cover-stage]');
  const guide = rootEl.querySelector('[data-cover-path]');
  const ink = rootEl.querySelector('[data-cover-ink]');
  const handle = rootEl.querySelector('[data-cover-handle]');
  const prompt = rootEl.querySelector('[data-cover-prompt]');
  const promptLabel = rootEl.querySelector('[data-cover-prompt-label]');
  const youCopy = rootEl.querySelector('[data-cover-you]');
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (!stage || !guide || !ink || !handle) return;

  if (journey && typeof journey.gate === 'function') journey.gate();

  // Pre-set the ink as a fully-hidden dash so progress just reveals it.
  const pathLen = guide.getTotalLength();
  ink.style.strokeDasharray = String(pathLen);
  ink.style.strokeDashoffset = String(pathLen);

  // Sample the path once in the SVG's own 600x600 user space.
  const samples = samplePath(guide, pathLen, PATH_SAMPLES);

  // Map an SVG user-space point to a pixel offset within the stage (the SVG
  // uses preserveAspectRatio xMidYMid meet → letterboxed into a centred square).
  const userToStagePx = (ux, uy) => {
    const rect = stage.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const offX = (rect.width - size) / 2;
    const offY = (rect.height - size) / 2;
    return { x: offX + (ux / 600) * size, y: offY + (uy / 600) * size };
  };
  const originPx = () => userToStagePx(samples[0].x, samples[0].y);

  let completed = false;
  const setProgress = (t) => {
    ink.style.strokeDashoffset = String(pathLen * (1 - t));
    stage.style.setProperty('--trace', t.toFixed(3));
    if (prompt) prompt.style.setProperty('--trace', t.toFixed(3));
    if (!completed && t >= COMPLETE_AT) {
      completed = true;
      handle.classList.add('is-home');
      handle.setAttribute(
        'aria-label',
        'You traced a path through the maze — you have control',
      );
      if (stage) stage.classList.add('is-traced');
      if (youCopy) youCopy.classList.add('is-home');
      // Resolve the quiet control gauge from instruction to confirmation;
      // the respondent count in the marker is left intact (it already settled).
      if (promptLabel) promptLabel.textContent = 'You have control';
      // The first commit wakes the Begin CTA with a soft pulse (CSS keyframe).
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

  // Anchor the handle's resting origin to the path's start so the transform-
  // based drag offsets line up with the snapped samples. Re-run on resize.
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
    keyboardStep: 22,
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

/** Read a CSS custom property off an element, with a literal fallback. */
function getCssColour(el, varName, fallback) {
  const v = getComputedStyle(el).getPropertyValue(varName).trim();
  return v || fallback;
}
