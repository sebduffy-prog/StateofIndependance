/**
 * Chapter 01: cover — the journey's opening step (narrative, NOT gated).
 *
 * HERO: a warm yellow→orange gradient ground (CSS) carrying the signature deck
 * MAZE motion logo with a live SVG orbit ring, a huge Poppins Black wordmark,
 * and — behind it all — an ambient field of respondent dots tinted navy for
 * contrast on the amber.
 *
 * MARQUEE INTERACTION — TRACE-THE-MAZE (B1):
 * A cream "you" dot is BORN at the maze entrance; the visitor drags it along a
 * winding SVG path through the maze to the centre. The handle is snapped onto
 * the path (closest-point projection via draggable's `bounds` function), so the
 * trace always reads as threading the maze — control, felt with the finger.
 * As progress runs 0→1 the ink line draws in behind the dot, the orbit ring
 * brightens + accelerates, the control gauge fills, and on COMPLETION the
 * headline's highlighter word lands and the "you are here" marker settles —
 * the thesis (starting = taking control) is the first thing your hand does.
 *
 * JOURNEY: this is a narrative step, so it does NOT call data.journey.gate();
 * Next default-unlocks after the engine's short dwell. The trace is the REWARD,
 * not a hard gate. (Were this step gated, completion would call journey.ready().)
 * The on-page "Begin" button triggers the journey's own Next control.
 *
 * Keyboard: the handle is focusable; arrow keys advance/retreat along the path
 * (handled here, overriding draggable's free-axis nudge). Reduced motion: the
 * trace pre-completes to its final inked state, the maze swaps to its static
 * frame, no parallax/pointer force runs, the field jump-cuts to layout.
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="01-cover"> element
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeParallax, arrival } from '../lib/experiential.js';
import { draggable } from '../lib/tactile.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 240; // dense enough to read as a lively field on the warm ground
const YOU_INDEX = 0; // the highlighted "you" dot in the ambient field
const DRIFT_AMP = 0.85; // livelier ambient brownian motion (reduced-motion safe)

const TRACE_SAMPLES = 240; // path samples for closest-point projection (smooth snap)
const TRACE_COMPLETE = 0.985; // progress at/after which the trace counts as done
const TRACE_KEY_STEP = 0.07; // fraction of path advanced per arrow press

/** Resolve a brand token to its hex, with a safe fallback. */
const token = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * Build the ambient layout: a calm scatter, with "you" parked in the
 * lower-left clearing. Returns normalised {x,y,colour} targets in 0..1 space.
 * @param {number} count
 * @param {string} dotColour
 * @returns {{x:number,y:number,colour:string}[]}
 */
const buildTargets = (count, dotColour) =>
  Array.from({ length: count }, (_, i) => {
    if (i === YOU_INDEX) return { x: 0.08, y: 0.84, colour: dotColour };
    return { x: Math.random(), y: Math.random(), colour: dotColour };
  });

/**
 * Sample an SVGPathElement into an array of {x,y,len} points in path (viewBox)
 * units, so we can project a dragged offset onto the nearest point of the path.
 * @param {SVGPathElement} path
 * @param {number} samples
 * @returns {{x:number,y:number}[]}
 */
const samplePath = (path, samples) => {
  const total = path.getTotalLength();
  return Array.from({ length: samples + 1 }, (_, i) => {
    const p = path.getPointAtLength((i / samples) * total);
    return { x: p.x, y: p.y };
  });
};

/**
 * Find the nearest sample index to a point within a FORWARD window of the
 * current index. Windowing makes the trace monotonic and deliberate (you can't
 * jump the maze or snap backward across a self-adjacent curve): the handle only
 * advances when the cursor is near the next stretch of the path. A small
 * backward tolerance lets the visitor ease off without the trace fighting them.
 * @param {{x:number,y:number}[]} pts
 * @param {number} px
 * @param {number} py
 * @param {number} curIdx          current index along the path
 * @param {number} lookahead       how far forward the cursor can reach
 * @param {number} lookback        how far backward it may retreat
 * @returns {number} the chosen sample index
 */
const nearestInWindow = (pts, px, py, curIdx, lookahead, lookback) => {
  const lo = Math.max(0, curIdx - lookback);
  const hi = Math.min(pts.length - 1, curIdx + lookahead);
  let best = curIdx;
  let bestDist = Infinity;
  for (let i = lo; i <= hi; i += 1) {
    const dx = pts[i].x - px;
    const dy = pts[i].y - py;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
};

export default function init(rootEl) {
  observeReveals(rootEl);

  const reduced = prefersReducedMotion();
  const hero = rootEl.querySelector('[data-cover-hero]');
  const dotsHost = rootEl.querySelector('[data-cover-dots]');
  const maze = rootEl.querySelector('[data-cover-maze]');

  // Chapter arrival: the journey fires `chapter:arrive` when this step becomes
  // current. The cover is FIRST, so it gets the connecting micro-ritual once,
  // then the headline assembles + the highlighter word decrypts into place.
  rootEl.addEventListener('chapter:arrive', (event) => {
    arrival(rootEl, { ritual: Boolean(event.detail?.ritual) });
  });

  // Under reduced motion, swap the animated maze GIF for its static frame.
  if (reduced && maze) {
    const still = maze.getAttribute('data-still');
    if (still) maze.setAttribute('src', still);
  }

  // "Begin" triggers the journey's own Next control (narrative step → Next
  // default-unlocks after the dwell; before then the disabled control no-ops).
  const cue = rootEl.querySelector('[data-cover-cue]');
  if (cue) {
    cue.addEventListener('click', () => {
      const next = document.getElementById('journeyNext');
      if (next) next.click();
    });
  }

  // Subtle pointer parallax across the maze + orbit (reduced-motion safe in lib).
  observeParallax(rootEl, { maxShiftPx: 48 });

  setupTrace(rootEl, reduced);
  setupField(rootEl, hero, dotsHost, reduced);
}

/* ───────────────────────── TRACE-THE-MAZE ──────────────────────────── */

/**
 * Wire the marquee interaction: drag the cream handle along the maze path.
 * @param {HTMLElement} rootEl
 * @param {boolean} reduced
 */
const setupTrace = (rootEl, reduced) => {
  const stage = rootEl.querySelector('[data-cover-stage]');
  const traceSvg = rootEl.querySelector('[data-cover-trace]');
  const guide = rootEl.querySelector('[data-cover-path]');
  const ink = rootEl.querySelector('[data-cover-ink]');
  const handle = rootEl.querySelector('[data-cover-handle]');
  const prompt = rootEl.querySelector('[data-cover-prompt]');
  if (!stage || !traceSvg || !guide || !ink || !handle) return;

  const pts = samplePath(guide, TRACE_SAMPLES);
  const inkLen = ink.getTotalLength();
  ink.style.strokeDasharray = String(inkLen);

  // Map between path-units and handle pixel offsets. The handle is CSS-anchored
  // at the path's start point and draggable() moves it by transform, so the px
  // offset must match the path AS RENDERED — which is governed by the trace
  // SVG's box (inset within the stage), not the stage itself. We read the SVG's
  // own rect so the scale is correct regardless of the inset.
  const VB = 600; // square viewBox 0..600 (preserveAspectRatio meet, no letterbox)
  const start = pts[0];
  const scale = () => {
    const r = traceSvg.getBoundingClientRect();
    return { sx: (r.width / VB) || 1, sy: (r.height / VB) || 1 };
  };
  const pathToOffset = (pt) => {
    const { sx, sy } = scale();
    return { x: (pt.x - start.x) * sx, y: (pt.y - start.y) * sy };
  };
  const offsetToPath = (ox, oy) => {
    const { sx, sy } = scale();
    return { x: start.x + ox / sx, y: start.y + oy / sy };
  };

  const lastIdx = pts.length - 1;
  let curIdx = 0; // single source of truth: handle's index along the path
  let completed = false;

  // Reflect the current index into all visual state: ink dash, the orbit/gauge
  // custom property, optionally the handle position, and the completion reward.
  const applyIndex = (idx, { moveHandle = false } = {}) => {
    curIdx = Math.min(Math.max(idx, 0), lastIdx);
    const progress = curIdx / lastIdx;
    ink.style.strokeDashoffset = String(inkLen * (1 - progress));
    stage.style.setProperty('--trace', progress.toFixed(4));
    if (moveHandle) {
      const off = pathToOffset(pts[curIdx]);
      drag.setPosition(off.x, off.y);
    }
    if (progress >= TRACE_COMPLETE && !completed) complete();
  };

  // Completion reward: the "you" dot is fully born, the headline highlighter
  // lands, the prompt resolves to "You have control", the orbit settles bright.
  const complete = () => {
    completed = true;
    curIdx = lastIdx;
    ink.style.strokeDashoffset = '0';
    stage.style.setProperty('--trace', '1');
    rootEl.classList.add('cover-trace-done');
    handle.setAttribute('aria-label', 'You traced a path through the maze — you have control');
    if (prompt) {
      const label = prompt.querySelector('[data-cover-prompt-label]');
      if (label) label.textContent = 'You have control';
    }
  };

  // How far the cursor may reach forward / back per move, in samples. The
  // generous lookahead lets a confident sweep advance smoothly; the small
  // lookback keeps the trace feeling committed (you take control, you don't
  // un-take it) while still allowing a little give if the cursor eases off.
  const LOOKAHEAD = Math.max(12, Math.round(pts.length * 0.12));
  const LOOKBACK = Math.max(2, Math.round(pts.length * 0.015));

  // draggable: free 2-axis drag, but `bounds` snaps the point onto the nearest
  // path sample within a forward window of the current index, so the handle
  // rides the maze line monotonically (you thread it; you can't skip ahead or
  // snap backward across a near-touching curve). spring:false — it stays put.
  const drag = draggable(handle, {
    spring: false,
    momentum: 0,
    bounds: (state) => {
      const p = offsetToPath(state.x, state.y);
      const idx = nearestInWindow(pts, p.x, p.y, curIdx, LOOKAHEAD, LOOKBACK);
      return pathToOffset(pts[idx]);
    },
    onMove: (state) => {
      const p = offsetToPath(state.x, state.y);
      const idx = nearestInWindow(pts, p.x, p.y, curIdx, LOOKAHEAD, LOOKBACK);
      applyIndex(idx);
    },
  });

  // Keyboard path: arrow keys advance/retreat ALONG the path (override the
  // lib's free-axis nudge so keys thread the maze, not wander the plane).
  const keyStepIdx = Math.max(1, Math.round(lastIdx * TRACE_KEY_STEP));
  const onKey = (e) => {
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowUp';
    const back = e.key === 'ArrowLeft' || e.key === 'ArrowDown';
    if (!fwd && !back) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    applyIndex(curIdx + (fwd ? keyStepIdx : -keyStepIdx), { moveHandle: true });
  };
  // Capture phase so this runs before draggable's own keydown handler.
  handle.addEventListener('keydown', onKey, true);

  // Re-project the handle to its current index once the stage has size (the
  // step mounts hidden at 0×0, and a viewport resize changes the px mapping).
  const placeHandle = () => {
    if (completed) return;
    const off = pathToOffset(pts[curIdx]);
    drag.setPosition(off.x, off.y);
    applyIndex(curIdx);
  };

  if (reduced) {
    // Reduced motion: pre-complete to the final inked state (no drag required).
    complete();
    return;
  }

  // The journey mounts steps hidden (zero-size); place the handle once the
  // stage gains real dimensions so the path projection is correct.
  if (typeof ResizeObserver !== 'undefined') {
    // Re-project on every size change (keep observing so a viewport resize
    // re-maps the resting handle); zero-size frames are ignored.
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      placeHandle();
    });
    ro.observe(stage);
  } else {
    placeHandle();
  }
};

/* ──────────────────────── ambient dot-field ────────────────────────── */

/**
 * Build the ambient respondent dot-field behind the hero (decorative).
 * @param {HTMLElement} rootEl
 * @param {HTMLElement|null} hero
 * @param {HTMLElement|null} dotsHost
 * @param {boolean} reduced
 */
const setupField = (rootEl, hero, dotsHost, reduced) => {
  if (!dotsHost) return;

  const dotColour = token('--soi-navy', '#0A1A5C');
  const youColour = token('--soi-teal', '#2BB7E8');

  const field = dotField(dotsHost, {
    count: DOT_COUNT,
    dotRadius: 3.1,
    ariaLabel:
      'A lively field of dots, one per survey respondent, drifting behind the cover.',
  });

  field.formation(buildTargets(DOT_COUNT, dotColour));
  field.highlight(YOU_INDEX, youColour);
  field.drift(DRIFT_AMP);

  // The step mounts hidden (canvas measures 1×1); nudge a re-measure once the
  // host gains real dimensions, otherwise a single pixel stretches full-bleed.
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

  if (reduced || !hero) return; // no pointer force under reduced motion

  // Subtle cursor repulsion across the whole hero.
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
};
