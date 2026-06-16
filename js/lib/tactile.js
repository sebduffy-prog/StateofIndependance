/**
 * tactile.js — the Moooi-style tactile primitive: draggable "toys" with real
 * physics, contact shadows, and a keyboard path. Dependency-free.
 *
 * House rules honoured: transform-only motion (no layout thrash), rAF-batched,
 * pointer capture, prefers-reduced-motion safe (drags still work but snap to
 * their final state with no overshoot and no idle motion), no console.log.
 * Mirrors the factory(el|container, opts) -> { destroy, ... } contract used by
 * the other libs in js/lib/.
 *
 * Exports:
 *   spring(from, to, opts)     tiny critically-damped spring driver on rAF
 *   contactShadow(el)          lift/settle shadow + scale state helper
 *   draggable(el, opts)        pointer + keyboard drag with spring return/settle
 *
 * ── spring(from, to, opts) ───────────────────────────────────────────
 *   A minimal critically-damped spring integrator. Drives a scalar (or, when
 *   `from`/`to` are {x,y}, a 2-vector) from its current value toward a target,
 *   calling opts.onUpdate(value) every rAF frame and opts.onRest() once it
 *   settles within the rest threshold. Critically damped => no overshoot by
 *   default; raise `bounce` for a little overshoot ("settle"). Under reduced
 *   motion it jumps straight to `to` on the next frame.
 *   opts: {
 *     stiffness?: number,   // default 170 — higher = snappier
 *     damping?: number,     // default auto (critical) — lower = bouncier
 *     bounce?: number,      // default 0 — 0..1 convenience for overshoot
 *     precision?: number,   // default 0.05 — rest threshold (px / units)
 *     onUpdate: (value) => void,
 *     onRest?: () => void,
 *     reducedMotion?: boolean
 *   }
 *   Returns { stop(), setTarget(to), isVector }.
 *
 * ── contactShadow(el) ────────────────────────────────────────────────
 *   Applies the Moooi "thing on a table" treatment to `el`: a soft, square-
 *   corner-safe drop shadow (via filter: drop-shadow, so it hugs any shape and
 *   never rounds corners) plus a subtle scale. `lift()` raises the object (grows
 *   + softens/spreads the shadow as if lifted off the surface); `settle()`
 *   returns it to rest. State is expressed purely through CSS custom properties
 *   the element animates via transition, so motion stays on the compositor and
 *   reduced-motion users get instant state changes (transitions are disabled).
 *   Returns { lift(), settle(), destroy() }.
 *
 * ── draggable(el, opts) ──────────────────────────────────────────────
 *   Makes `el` a draggable toy. Pointer drag uses pointer capture and moves the
 *   element with transform only. On grab the contact shadow lifts; on release
 *   the element either springs back to origin (spring return) or settles where
 *   released, carrying a little release momentum first. Optional axis lock and
 *   bounds. Fully keyboard operable: the element is focusable, arrow keys nudge
 *   it (by keyboardStep), and Enter/Space toggle a "grabbed" mode (purely for
 *   affordance/announcement parity with pointer — nudging works regardless).
 *   opts: {
 *     axis?: 'x' | 'y' | null,          // lock movement to one axis (default null)
 *     bounds?: { minX?, maxX?, minY?, maxY? } | (state) => clampedXY,
 *                                        // clamp the position; function form for
 *                                        // custom shapes (path/lasso hit-tests)
 *     spring?: 'return' | 'settle' | false,
 *                                        // 'return' springs back to origin on
 *                                        // release; 'settle' stays put with a
 *                                        // soft settle; false = hard stop.
 *                                        // default 'return'
 *     springOpts?: object,               // forwarded to spring() (stiffness…)
 *     momentum?: number,                 // 0..1 release-velocity carry (default 0.12)
 *     keyboardStep?: number,             // px per arrow press (default 24)
 *     onMove?:    (state) => void,       // every move (pointer or keyboard)
 *     onRelease?: (state) => void,       // pointer up / keyboard release
 *     onSettle?:  () => void             // spring has come to rest
 *   }
 *   state = { x, y, dx, dy, vx, vy, grabbed }  (x/y = current offset from origin)
 *   Returns { destroy(), setPosition(x, y, { animate? }) }.
 */

/* ───────────────────────── shared helpers ──────────────────────────── */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const isVectorTarget = (v) =>
  v && typeof v === 'object' && 'x' in v && 'y' in v;

/* ───────────────────────────── spring ──────────────────────────────── */

export const spring = (from, to, opts = {}) => {
  const {
    stiffness = 170,
    damping,
    bounce = 0,
    precision = 0.05,
    onUpdate,
    onRest,
    reducedMotion = prefersReducedMotion(),
  } = opts;

  if (typeof onUpdate !== 'function') {
    throw new Error('spring(): opts.onUpdate must be a function');
  }

  const isVector = isVectorTarget(from) || isVectorTarget(to);
  // Critical damping = 2*sqrt(stiffness); `bounce` (0..1) eases below critical.
  const critical = 2 * Math.sqrt(stiffness);
  const damp = typeof damping === 'number'
    ? damping
    : critical * (1 - Math.min(Math.max(bounce, 0), 0.95));

  // Internal state stored as a vector for uniformity.
  const target = isVector
    ? { x: (to && to.x) || 0, y: (to && to.y) || 0 }
    : { x: Number(to) || 0, y: 0 };
  let pos = isVector
    ? { x: (from && from.x) || 0, y: (from && from.y) || 0 }
    : { x: Number(from) || 0, y: 0 };
  let vel = { x: 0, y: 0 };

  let rafId = null;
  let lastTime = 0;
  let stopped = false;

  const emit = () => onUpdate(isVector ? { x: pos.x, y: pos.y } : pos.x);

  if (reducedMotion) {
    pos = { ...target };
    emit();
    if (typeof onRest === 'function') onRest();
    return { stop() {}, setTarget() {}, isVector };
  }

  const stepAxis = (axis, dt) => {
    const displacement = pos[axis] - target[axis];
    const accel = -stiffness * displacement - damp * vel[axis];
    vel[axis] += accel * dt;
    pos[axis] += vel[axis] * dt;
  };

  const atRest = () => {
    const dx = Math.abs(pos.x - target.x);
    const dy = isVector ? Math.abs(pos.y - target.y) : 0;
    const vMag = Math.abs(vel.x) + (isVector ? Math.abs(vel.y) : 0);
    return dx < precision && dy < precision && vMag < precision;
  };

  const frame = (t) => {
    if (stopped) return;
    if (!lastTime) lastTime = t;
    // Clamp dt for tab-switch / long-frame stability.
    const dt = Math.min((t - lastTime) / 1000, 1 / 30);
    lastTime = t;

    stepAxis('x', dt);
    if (isVector) stepAxis('y', dt);
    emit();

    if (atRest()) {
      pos = { ...target };
      emit();
      stopped = true;
      rafId = null;
      if (typeof onRest === 'function') onRest();
      return;
    }
    rafId = requestAnimationFrame(frame);
  };

  rafId = requestAnimationFrame(frame);

  return {
    stop() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    },
    setTarget(next) {
      if (isVector && isVectorTarget(next)) {
        target.x = next.x;
        target.y = next.y;
      } else {
        target.x = Number(next) || 0;
      }
      if (stopped) {
        stopped = false;
        lastTime = 0;
        rafId = requestAnimationFrame(frame);
      }
    },
    isVector,
  };
};

/* ─────────────────────────── contactShadow ─────────────────────────── */

const SHADOW_REST =
  'drop-shadow(0 2px 4px rgba(0,0,0,0.18)) drop-shadow(0 1px 1px rgba(0,0,0,0.12))';
const SHADOW_LIFT =
  'drop-shadow(0 14px 22px rgba(0,0,0,0.22)) drop-shadow(0 4px 6px rgba(0,0,0,0.14))';
const SCALE_REST = 1;
const SCALE_LIFT = 1.06;

export const contactShadow = (el) => {
  if (!el) throw new Error('contactShadow(): el is required');
  const reduced = prefersReducedMotion();

  const prevWillChange = el.style.willChange;
  const prevTransition = el.style.transition;

  // filter drives the shadow (hugs any shape, square-corner safe);
  // the element's own transform is owned by draggable, so we expose the
  // lift scale as a CSS variable callers compose into their transform.
  el.style.setProperty('--tactile-scale', String(SCALE_REST));
  el.style.filter = SHADOW_REST;
  el.style.willChange = 'filter, transform';
  if (!reduced) {
    el.style.transition =
      'filter 220ms cubic-bezier(0.22,1,0.36,1), ' +
      'transform 220ms cubic-bezier(0.22,1,0.36,1)';
  }

  const lift = () => {
    el.style.filter = SHADOW_LIFT;
    el.style.setProperty('--tactile-scale', String(SCALE_LIFT));
    el.classList.add('is-lifted');
  };
  const settle = () => {
    el.style.filter = SHADOW_REST;
    el.style.setProperty('--tactile-scale', String(SCALE_REST));
    el.classList.remove('is-lifted');
  };
  const destroy = () => {
    el.style.filter = '';
    el.style.willChange = prevWillChange;
    el.style.transition = prevTransition;
    el.style.removeProperty('--tactile-scale');
    el.classList.remove('is-lifted');
  };

  return { lift, settle, destroy };
};

/* ──────────────────────────── draggable ────────────────────────────── */

const DEFAULT_KEYBOARD_STEP = 24;
const DEFAULT_MOMENTUM = 0.12;

const clampPosition = (x, y, bounds) => {
  if (!bounds) return { x, y };
  if (typeof bounds === 'function') {
    const out = bounds({ x, y });
    return { x: out && 'x' in out ? out.x : x, y: out && 'y' in out ? out.y : y };
  }
  const { minX, maxX, minY, maxY } = bounds;
  return {
    x: Math.min(maxX ?? Infinity, Math.max(minX ?? -Infinity, x)),
    y: Math.min(maxY ?? Infinity, Math.max(minY ?? -Infinity, y)),
  };
};

export const draggable = (el, opts = {}) => {
  if (!el) throw new Error('draggable(): el is required');
  const {
    axis = null,
    bounds = null,
    spring: springMode = 'return',
    springOpts = {},
    momentum = DEFAULT_MOMENTUM,
    keyboardStep = DEFAULT_KEYBOARD_STEP,
    onMove,
    onRelease,
    onSettle,
  } = opts;

  const reduced = prefersReducedMotion();
  const shadow = contactShadow(el);

  // Current offset from the element's origin (origin = 0,0 transform).
  let x = 0;
  let y = 0;
  // Velocity tracking for release momentum.
  let lastX = 0;
  let lastY = 0;
  let lastMoveTime = 0;
  let vx = 0;
  let vy = 0;
  let grabbed = false;
  let activeSpring = null;
  let pointerId = null;
  let startPointer = null;
  let startOffset = null;

  // Compose drag transform with the lift scale variable from contactShadow.
  const render = () => {
    el.style.transform =
      `translate3d(${x}px, ${y}px, 0) scale(var(--tactile-scale, 1))`;
  };

  const buildState = () => ({ x, y, dx: x, dy: y, vx, vy, grabbed });

  const applyAxis = (nx, ny) => {
    if (axis === 'x') return { x: nx, y: 0 };
    if (axis === 'y') return { x: 0, y: ny };
    return { x: nx, y: ny };
  };

  const setTo = (nx, ny, { emit = true } = {}) => {
    const axed = applyAxis(nx, ny);
    const clamped = clampPosition(axed.x, axed.y, bounds);
    x = clamped.x;
    y = clamped.y;
    render();
    if (emit && typeof onMove === 'function') onMove(buildState());
  };

  const stopSpring = () => {
    if (activeSpring) {
      activeSpring.stop();
      activeSpring = null;
    }
  };

  /* ── spring after release ── */
  const releaseSpring = () => {
    if (springMode === false) {
      if (typeof onSettle === 'function') onSettle();
      return;
    }
    const target = springMode === 'return' ? { x: 0, y: 0 } : { x, y };
    // 'settle' with no overshoot under reduced motion is a no-op move.
    stopSpring();
    activeSpring = spring(
      { x, y },
      target,
      {
        bounce: springMode === 'settle' ? 0.18 : 0,
        ...springOpts,
        reducedMotion: reduced,
        onUpdate: ({ x: sx, y: sy }) => {
          const clamped = clampPosition(sx, sy, bounds);
          x = clamped.x;
          y = clamped.y;
          render();
          if (typeof onMove === 'function') onMove(buildState());
        },
        onRest: () => {
          activeSpring = null;
          vx = 0;
          vy = 0;
          if (typeof onSettle === 'function') onSettle();
        },
      },
    );
  };

  /* ── pointer handlers ── */
  const onPointerDown = (e) => {
    if (pointerId !== null) return;
    stopSpring();
    pointerId = e.pointerId;
    grabbed = true;
    startPointer = { x: e.clientX, y: e.clientY };
    startOffset = { x, y };
    lastX = e.clientX;
    lastY = e.clientY;
    lastMoveTime = e.timeStamp;
    vx = 0;
    vy = 0;
    shadow.lift();
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (e.pointerId !== pointerId) return;
    const dt = Math.max(e.timeStamp - lastMoveTime, 1);
    vx = (e.clientX - lastX) / dt;
    vy = (e.clientY - lastY) / dt;
    lastX = e.clientX;
    lastY = e.clientY;
    lastMoveTime = e.timeStamp;
    setTo(
      startOffset.x + (e.clientX - startPointer.x),
      startOffset.y + (e.clientY - startPointer.y),
    );
  };

  const endPointer = (e) => {
    if (e.pointerId !== pointerId) return;
    grabbed = false;
    pointerId = null;
    shadow.settle();
    el.classList.remove('is-dragging');
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      /* capture may already be gone */
    }
    // Carry a little release momentum, then spring/settle.
    if (!reduced && momentum > 0) {
      const carry = momentum * 16; // velocity is px/ms; scale to a frame's worth
      setTo(x + vx * carry, y + vy * carry);
    }
    if (typeof onRelease === 'function') onRelease(buildState());
    releaseSpring();
  };

  /* ── keyboard handlers ── */
  const nudge = (dxStep, dyStep) => {
    stopSpring();
    setTo(x + dxStep, y + dyStep);
    if (typeof onRelease === 'function') onRelease(buildState());
  };

  const onKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowLeft':
        if (axis === 'y') return;
        e.preventDefault();
        nudge(-keyboardStep, 0);
        break;
      case 'ArrowRight':
        if (axis === 'y') return;
        e.preventDefault();
        nudge(keyboardStep, 0);
        break;
      case 'ArrowUp':
        if (axis === 'x') return;
        e.preventDefault();
        nudge(0, -keyboardStep);
        break;
      case 'ArrowDown':
        if (axis === 'x') return;
        e.preventDefault();
        nudge(0, keyboardStep);
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        e.preventDefault();
        grabbed = !grabbed;
        if (grabbed) {
          shadow.lift();
          el.classList.add('is-dragging');
        } else {
          shadow.settle();
          el.classList.remove('is-dragging');
          if (typeof onRelease === 'function') onRelease(buildState());
          releaseSpring();
        }
        break;
      default:
        break;
    }
  };

  /* ── mount ── */
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
  el.style.touchAction = 'none';
  el.style.cursor = 'grab';
  render();

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('keydown', onKeyDown);

  return {
    setPosition(nx, ny, { animate = false } = {}) {
      stopSpring();
      if (animate && !reduced) {
        activeSpring = spring(
          { x, y },
          { x: nx, y: ny },
          {
            ...springOpts,
            reducedMotion: reduced,
            onUpdate: ({ x: sx, y: sy }) => {
              const c = clampPosition(sx, sy, bounds);
              x = c.x;
              y = c.y;
              render();
              if (typeof onMove === 'function') onMove(buildState());
            },
            onRest: () => {
              activeSpring = null;
              if (typeof onSettle === 'function') onSettle();
            },
          },
        );
      } else {
        setTo(nx, ny);
        if (typeof onSettle === 'function') onSettle();
      }
    },
    destroy() {
      stopSpring();
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endPointer);
      el.removeEventListener('pointercancel', endPointer);
      el.removeEventListener('keydown', onKeyDown);
      shadow.destroy();
      el.style.transform = '';
      el.style.touchAction = '';
      el.style.cursor = '';
    },
  };
};
