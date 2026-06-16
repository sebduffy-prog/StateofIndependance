/**
 * experiential.js — premium scroll-driven motion helpers chapters opt into.
 *
 * Dependency-free. Pure transform/opacity, rAF-batched, IntersectionObserver
 * gated, and prefers-reduced-motion safe (every helper jumps straight to its
 * final/at-rest state and installs no scroll work when motion is reduced).
 * No layout-affecting properties are animated (only transform + opacity), so
 * these never trigger reflow or cause text clipping.
 *
 * Exports:
 *   prefersReducedMotion()              -> boolean
 *   observeParallax(rootEl, opts?)      subtle parallax for [data-parallax]
 *   chapterTransition(rootEl, opts?)    scroll-progress reveal/mask for a section
 *   scrollScene(rootEl, steps, opts?)   ties scroll progress to step callbacks
 *
 * Every helper returns a cleanup function () => void that detaches all
 * listeners/observers it created.
 *
 * ── observeParallax(rootEl, opts?) ───────────────────────────────────
 *   Markup: any descendant with `data-parallax` is translated on the Y axis
 *   as it travels through the viewport. The attribute value is the speed
 *   factor (e.g. data-parallax="0.2"); positive drifts slower than scroll
 *   (recedes), negative drifts faster (advances). Optional data-parallax-x
 *   adds a horizontal factor. Movement is clamped to ±maxShiftPx so nothing
 *   ever escapes its container or covers adjacent text.
 *   opts: { maxShiftPx?: number }   (default 60)
 *
 * ── chapterTransition(rootEl, opts?) ─────────────────────────────────
 *   Drives a section's entrance as a scroll-progress reveal. As rootEl
 *   scrolls from just-below the viewport to its resting position, progress
 *   runs 0->1 and is exposed as the CSS custom property `--enter` on rootEl
 *   (chapters style opacity / transform / clip-path masks off it). A
 *   `.is-entering` class is toggled while 0<progress<1 and `.is-entered`
 *   latches once progress reaches 1. CSS owns the visual treatment; this only
 *   supplies the normalised number.
 *   opts: { property?: string, startClass?: string, endClass?: string }
 *
 * ── scrollScene(rootEl, steps, opts?) ────────────────────────────────
 *   Pins a scene to scroll progress for scroll-driven data builds. Progress
 *   0->1 maps to rootEl entering and leaving the viewport. `steps` is an
 *   array of { at: number 0..1, onEnter?(p), onLeave?(p) }; onEnter fires
 *   when scroll progress crosses `at` going forward, onLeave when it crosses
 *   back. A single `onProgress?(p)` (in opts) fires every frame with the raw
 *   clamped progress for continuous builds. Steps are sorted by `at`.
 *   opts: { onProgress?: (p:number)=>void }
 */

const DEFAULT_MAX_SHIFT_PX = 60;
const DEFAULT_ENTER_PROPERTY = '--enter';
const ENTERING_CLASS = 'is-entering';
const ENTERED_CLASS = 'is-entered';

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Shared rAF scheduler so multiple helpers coalesce into one frame.
 * @param {() => void} update
 * @returns {{ request: () => void, cancel: () => void }}
 */
const rafScheduler = (update) => {
  let frame = 0;
  const run = () => {
    frame = 0;
    update();
  };
  return {
    request() {
      if (frame) return;
      frame = requestAnimationFrame(run);
    },
    cancel() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
};

/**
 * Normalised scroll progress of an element through the viewport.
 * 0 when the element's top first enters from the bottom edge, 1 once its
 * bottom has passed the top edge. Clamped to [0, 1].
 * @param {DOMRect} rect
 * @param {number} viewportH
 * @returns {number}
 */
const viewportProgress = (rect, viewportH) => {
  const travel = viewportH + rect.height;
  const scrolled = viewportH - rect.top;
  return clamp(scrolled / travel, 0, 1);
};

/**
 * Observe [data-parallax] descendants and translate them on scroll.
 * @param {HTMLElement} rootEl
 * @param {{ maxShiftPx?: number }} [opts]
 * @returns {() => void} cleanup
 */
export const observeParallax = (rootEl, opts = {}) => {
  const { maxShiftPx = DEFAULT_MAX_SHIFT_PX } = opts;
  const targets = Array.from(rootEl.querySelectorAll('[data-parallax]'));
  if (!targets.length) return () => {};

  if (prefersReducedMotion()) {
    targets.forEach((el) => {
      el.style.transform = '';
    });
    return () => {};
  }

  const items = targets.map((el) => ({
    el,
    speed: Number(el.dataset.parallax) || 0,
    speedX: Number(el.dataset.parallaxX) || 0,
    inView: false,
  }));

  const update = () => {
    const viewportH = window.innerHeight;
    const mid = viewportH / 2;
    items.forEach((item) => {
      if (!item.inView) return;
      const rect = item.el.getBoundingClientRect();
      const fromCentre = rect.top + rect.height / 2 - mid;
      const y = clamp(fromCentre * item.speed * -1, -maxShiftPx, maxShiftPx);
      const x = clamp(fromCentre * item.speedX * -1, -maxShiftPx, maxShiftPx);
      item.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  };

  const scheduler = rafScheduler(update);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const item = items.find((i) => i.el === entry.target);
      if (item) item.inView = entry.isIntersecting;
    });
    scheduler.request();
  });
  items.forEach((item) => io.observe(item.el));

  const onScroll = () => scheduler.request();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  scheduler.request();

  return () => {
    io.disconnect();
    scheduler.cancel();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    items.forEach((item) => {
      item.el.style.transform = '';
    });
  };
};

/**
 * Drive a section entrance from scroll progress via a CSS custom property.
 * @param {HTMLElement} rootEl
 * @param {{ property?: string, startClass?: string, endClass?: string }} [opts]
 * @returns {() => void} cleanup
 */
export const chapterTransition = (rootEl, opts = {}) => {
  const {
    property = DEFAULT_ENTER_PROPERTY,
    startClass = ENTERING_CLASS,
    endClass = ENTERED_CLASS,
  } = opts;

  if (prefersReducedMotion()) {
    rootEl.style.setProperty(property, '1');
    rootEl.classList.add(endClass);
    return () => {};
  }

  let entered = false;

  const update = () => {
    const rect = rootEl.getBoundingClientRect();
    const progress = viewportProgress(rect, window.innerHeight);
    rootEl.style.setProperty(property, progress.toFixed(4));
    rootEl.classList.toggle(startClass, progress > 0 && progress < 1);
    if (progress >= 1 && !entered) {
      entered = true;
      rootEl.classList.add(endClass);
    }
  };

  const scheduler = rafScheduler(update);
  const onScroll = () => scheduler.request();

  const io = new IntersectionObserver((entries) => {
    const visible = entries.some((e) => e.isIntersecting);
    if (visible) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      scheduler.request();
    } else {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  });
  io.observe(rootEl);
  scheduler.request();

  return () => {
    io.disconnect();
    scheduler.cancel();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
};

/**
 * @typedef {Object} ScrollStep
 * @property {number} at            progress threshold 0..1
 * @property {(p:number)=>void} [onEnter]  crossed `at` going forward
 * @property {(p:number)=>void} [onLeave]  crossed `at` going backward
 */

/**
 * Tie scroll progress through rootEl to step callbacks (scroll-driven builds).
 * @param {HTMLElement} rootEl
 * @param {ScrollStep[]} steps
 * @param {{ onProgress?: (p:number)=>void }} [opts]
 * @returns {() => void} cleanup
 */
export const scrollScene = (rootEl, steps = [], opts = {}) => {
  const { onProgress } = opts;
  const ordered = [...steps].sort((a, b) => a.at - b.at);

  if (prefersReducedMotion()) {
    ordered.forEach((step) => step.onEnter && step.onEnter(1));
    if (onProgress) onProgress(1);
    return () => {};
  }

  const active = new Set();

  const update = () => {
    const rect = rootEl.getBoundingClientRect();
    const progress = viewportProgress(rect, window.innerHeight);
    if (onProgress) onProgress(progress);
    ordered.forEach((step, index) => {
      const isPast = progress >= step.at;
      const wasPast = active.has(index);
      if (isPast && !wasPast) {
        active.add(index);
        if (step.onEnter) step.onEnter(progress);
      } else if (!isPast && wasPast) {
        active.delete(index);
        if (step.onLeave) step.onLeave(progress);
      }
    });
  };

  const scheduler = rafScheduler(update);
  const onScroll = () => scheduler.request();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  scheduler.request();

  return () => {
    scheduler.cancel();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
};
