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
 *   arrival(rootEl, opts?)              premium chapter-arrival (assemble + count)
 *   youDot(opts?)                       persistent fixed mustard marker (controller)
 *   magneticButton(el, opts?)           cursor-attracted button with spring follow
 *   magneticCursor(opts?)               custom blend-mode cursor dot (controller)
 *   scrambleIn(el, opts?)               decrypt-into-place text reveal for one el
 *
 * ── CONNECTIVE TISSUE (Blue-Marine feel) ────────────────────────────
 * These four ported/new helpers give the journey its premium connective
 * feel: chapters ARRIVE (assemble) rather than cut, a single "you" marker
 * persists across steps, and the finish is tactile (magnetic). They are
 * all dependency-free, transform/opacity only, rAF-batched, and jump to a
 * settled final state under prefers-reduced-motion.
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

/* ──────────────────────────────────────────────────────────────────
   CONNECTIVE TISSUE
   ────────────────────────────────────────────────────────────────── */

// Arrival timing — one slow embodied beat, not a flash.
const ARRIVAL_RITUAL_MS = 1500; // first-step "connecting" ritual length
const ARRIVAL_ASSEMBLE_STAGGER_MS = 90; // per-line cascade
// Narrow, even-width glyph set: no wide/zero-width chars that could force a
// re-wrap on big Poppins display headings. (No em dash, no braces.)
const SCRAMBLE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%';
// Not-yet-started positions emit one scramble glyph each (see run loop), so the
// string is CONSTANT-LENGTH every frame (zero reflow) and reads as encrypting
// noise rather than a blank gap; spaces in the target stay spaces.
const SCRAMBLE_FRAME_MS = 28;
// Hard cap so an interrupted/looping reveal can never run forever.
const SCRAMBLE_MAX_MS = 2200;
// Tracks active runs per element so re-invocation is idempotent (cancels the
// prior run and forces the true target before starting fresh).
const scrambleRuns = new WeakMap();

/**
 * Step ARRIVAL — the premium "this chapter is arriving" beat.
 *
 * Markup the step opts into (all optional):
 *   - [data-arrival]            assembling lines fade+lift in cascade
 *   - [data-arrival-scramble]   that line decrypts into place (one per step)
 *   - [data-arrival-count]      number counts up to its data-to / textContent
 *
 * On a NORMAL step: heading + key lines assemble, numbers count up.
 * On the FIRST step only (opts.ritual): a brief 1.5s connecting micro-ritual
 * plays before the assemble — skippable by any key/click, instant under
 * reduced motion.
 *
 * Reusable: every section calls `arrival(rootEl)` from its init(); main.js
 * re-fires it when a step becomes current via the `chapter:arrive` event.
 *
 * @param {HTMLElement} rootEl
 * @param {{ ritual?: boolean, onRitualDone?: () => void }} [opts]
 * @returns {() => void} cleanup
 */
export const arrival = (rootEl, opts = {}) => {
  const { ritual = false, onRitualDone } = opts;
  const reduced = prefersReducedMotion();

  const lines = Array.from(rootEl.querySelectorAll('[data-arrival]'));
  const counters = Array.from(rootEl.querySelectorAll('[data-arrival-count]'));

  // Run the assemble: cascade lines in, scramble the flagged line, count up.
  const assemble = () => {
    lines.forEach((el, i) => {
      el.classList.remove('is-arrived');
      if (reduced) {
        el.classList.add('is-arrived');
        return;
      }
      el.style.setProperty('--arrival-delay', `${i * ARRIVAL_ASSEMBLE_STAGGER_MS}ms`);
      // Force a reflow-free restart of the entrance by toggling on next frame.
      requestAnimationFrame(() => el.classList.add('is-arrived'));
    });

    rootEl.querySelectorAll('[data-arrival-scramble]').forEach((el) => {
      scrambleIn(el);
    });

    counters.forEach((el) => countUpArrival(el, reduced));
  };

  // First-step listening ritual: a brief staged "connecting" overlay.
  if (ritual && !reduced) {
    const overlay = buildRitualOverlay(rootEl);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      overlay.dismiss(() => {
        assemble();
        if (onRitualDone) onRitualDone();
      });
      window.removeEventListener('keydown', finish, true);
      overlay.el.removeEventListener('click', finish);
    };
    const timer = window.setTimeout(finish, ARRIVAL_RITUAL_MS);
    window.addEventListener('keydown', finish, true);
    overlay.el.addEventListener('click', finish);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', finish, true);
      overlay.remove();
    };
  }

  assemble();
  if (ritual && onRitualDone) onRitualDone();
  return () => {};
};

/** Build the brief first-step connecting overlay (returns a small controller). */
const buildRitualOverlay = (rootEl) => {
  const el = document.createElement('div');
  el.className = 'arrival-ritual';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML =
    '<div class="arrival-ritual__inner">' +
    '<span class="arrival-ritual__line">Listening to 1,504 people…</span>' +
    '<span class="arrival-ritual__bar"><span class="arrival-ritual__fill"></span></span>' +
    '</div>';
  rootEl.appendChild(el);
  // Kick the fill on the next frame so the transition runs.
  requestAnimationFrame(() => el.classList.add('is-live'));
  return {
    el,
    dismiss(after) {
      el.classList.add('is-leaving');
      const remove = () => {
        el.remove();
        if (after) after();
      };
      el.addEventListener('transitionend', remove, { once: true });
      // Fallback in case transitionend never fires.
      window.setTimeout(remove, 600);
    },
    remove() {
      el.remove();
    },
  };
};

/** Count a [data-arrival-count] element up to its target (eased, tabular). */
const countUpArrival = (el, reduced) => {
  const target = Number(el.dataset.to ?? parseFloat(el.textContent)) || 0;
  const decimals = Number(el.dataset.decimals) || 0;
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const format = (v) => prefix + v.toFixed(decimals) + suffix;
  if (reduced) {
    el.textContent = format(target);
    return;
  }
  const duration = 900;
  const start = performance.now();
  const tick = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    el.textContent = format(target * eased);
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = format(target);
  };
  requestAnimationFrame(tick);
};

/**
 * scrambleIn — decrypt one element's text into place (ported text-scramble).
 * The final string is the element's current textContent. Reduced motion =
 * instant (no scramble). Stores the resolved text so a re-run still resolves.
 * @param {HTMLElement} el
 * @param {{ speedMs?: number, chars?: string }} [opts]
 * @returns {() => void} cleanup
 */
export const scrambleIn = (el, opts = {}) => {
  if (!el) return () => {};
  const { speedMs = SCRAMBLE_FRAME_MS, chars = SCRAMBLE_CHARS } = opts;

  // Cancel any in-flight run on this element FIRST, and restore the true
  // target, so we never capture an already-scrambled value as the target and
  // re-invocation is fully idempotent.
  const prior = scrambleRuns.get(el);
  if (prior) prior.cancel();

  // The resolved target is captured once (first ever call) into the dataset.
  // After that we always trust the dataset, never the live (possibly garbled)
  // textContent — this is what kept titles stuck as glyphs forever.
  // Collapse whitespace/newlines so a scramble target taken from an indented
  // element's textContent can never balloon into a wall of extra glyphs.
  const text = (el.dataset.scrambleText ?? el.textContent ?? '').replace(/\s+/g, ' ').trim();
  el.dataset.scrambleText = text;

  if (prefersReducedMotion() || text.length === 0) {
    el.textContent = text;
    return () => {};
  }

  const queue = Array.from(text, (to) => {
    const start = Math.floor(Math.random() * 12);
    return { to, start, end: start + 14 + Math.floor(Math.random() * 14), char: '' };
  });

  let frame = 0;
  let timer = 0;
  let cancelled = false;
  const startedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());

  // Force the element to its literal final words and clear all run state.
  const settle = () => {
    if (timer) {
      clearTimeout(timer);
      timer = 0;
    }
    el.textContent = el.dataset.scrambleText ?? text;
    if (scrambleRuns.get(el) === handle) scrambleRuns.delete(el);
  };

  const cancel = () => {
    if (cancelled) return;
    cancelled = true;
    settle();
  };

  const handle = { cancel };
  scrambleRuns.set(el, handle);

  const run = () => {
    if (cancelled) return;
    // Hard max-duration cap: never leave the element mid-scramble.
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (now - startedAt >= SCRAMBLE_MAX_MS) {
      cancel();
      return;
    }
    let complete = 0;
    // CONSTANT-LENGTH output: every position emits exactly one character every
    // frame (filler before it starts), so the element footprint never changes
    // and big display headings cannot re-wrap mid-reveal.
    const out = queue.map((q) => {
      if (frame >= q.end) {
        complete += 1;
        return q.to;
      }
      if (frame >= q.start) {
        if (!q.char || Math.random() < 0.28) {
          q.char = chars[Math.floor(Math.random() * chars.length)];
        }
        return q.char;
      }
      // Not started yet: keep real spaces as spaces; everything else shows
      // scrambling noise (never blank) so the line reads as "encrypting", not
      // as a missing word. Same char count = constant footprint, no reflow.
      return q.to === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)];
    });
    el.textContent = out.join('');
    if (complete === queue.length) {
      cancel();
      return;
    }
    frame += 1;
    timer = window.setTimeout(run, speedMs);
  };
  run();
  return cancel;
};

/**
 * youDot — a single persistent fixed-position mustard marker that eases toward
 * a per-step anchor. Connective tissue: born on the cover, persists across
 * every step behind the controls. pointer-events:none; reduced motion = static
 * (it snaps to each anchor with no travel).
 *
 * Steps set the anchor by marking ONE element [data-youdot-anchor]; the
 * controller reads its centre. main.js calls .anchorTo(section) on each step.
 *
 * @param {{ size?: number, stiffness?: number, damping?: number }} [opts]
 * @returns {{ anchorTo:(scope:HTMLElement)=>void, destroy:()=>void, el:HTMLElement }}
 */
export const youDot = (opts = {}) => {
  const { size = 12, stiffness = 0.08, damping = 0.82 } = opts;
  const reduced = prefersReducedMotion();

  const el = document.createElement('div');
  el.className = 'you-dot';
  el.setAttribute('aria-hidden', 'true');
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  document.body.appendChild(el);

  const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
  const cur = { x: target.x, y: target.y, vx: 0, vy: 0 };
  let raf = 0;
  let scope = null;
  let hasAnchor = false; // true only when a real, non-zero-size anchor exists

  // Show only when there's a real anchor — never a stray dot in empty ground.
  const setVisible = (visible) => {
    el.classList.toggle('is-live', visible);
  };

  // Returns true if the current scope has a real, measurable anchor; updates
  // the target to its centre and toggles visibility accordingly.
  const measure = () => {
    const a = scope ? scope.querySelector('[data-youdot-anchor]') : null;
    const r = a ? a.getBoundingClientRect() : null;
    const valid = !!r && (r.width > 0 || r.height > 0);
    hasAnchor = valid;
    setVisible(valid);
    if (!valid) return false;
    target.x = r.left + r.width / 2;
    target.y = r.top + r.height / 2;
    if (reduced) {
      cur.x = target.x;
      cur.y = target.y;
      cur.vx = 0;
      cur.vy = 0;
      el.style.transform = `translate3d(${cur.x - size / 2}px, ${cur.y - size / 2}px, 0)`;
    }
    return true;
  };

  const SETTLE_PX = 0.15; // below this distance + velocity we snap (no jitter)

  const tick = () => {
    if (hasAnchor) {
      const dx = target.x - cur.x;
      const dy = target.y - cur.y;
      const speed = Math.hypot(cur.vx, cur.vy);
      // Snap to rest once close + slow so the dot never micro-jitters at anchor.
      if (Math.hypot(dx, dy) < SETTLE_PX && speed < SETTLE_PX) {
        cur.x = target.x;
        cur.y = target.y;
        cur.vx = 0;
        cur.vy = 0;
      } else {
        cur.vx = (cur.vx + dx * stiffness) * damping;
        cur.vy = (cur.vy + dy * stiffness) * damping;
        cur.x += cur.vx;
        cur.y += cur.vy;
      }
      el.style.transform = `translate3d(${(cur.x - size / 2).toFixed(2)}px, ${(cur.y - size / 2).toFixed(2)}px, 0)`;
    } else {
      // No anchor: freeze in place (hidden via opacity) so it can't drift.
      cur.vx = 0;
      cur.vy = 0;
    }
    raf = requestAnimationFrame(tick);
  };

  const onResize = () => measure();
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('scroll', onResize, { passive: true });

  if (!reduced) {
    raf = requestAnimationFrame(tick);
  }

  return {
    el,
    anchorTo(nextScope) {
      scope = nextScope;
      // Re-measure across a few frames; the step may still be settling in.
      // measure() owns visibility, so a scope with no/zero-size anchor hides it.
      measure();
      requestAnimationFrame(measure);
      window.setTimeout(measure, 120);
      window.setTimeout(measure, 480);
    },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize);
      el.remove();
    },
  };
};

/**
 * magneticButton — el is pulled toward the cursor within `radius`, spring-damped,
 * elastic snap-back on exit (ported from SEBSKILLS MagneticButton). Wraps the
 * element's children in a span so the label can sit pointer-events:none.
 * Reduced motion = no follow (a no-op). Returns a cleanup function.
 * @param {HTMLElement} el
 * @param {{ strength?:number, radius?:number, stiffness?:number, damping?:number }} [opts]
 * @returns {() => void} cleanup
 */
export const magneticButton = (el, opts = {}) => {
  const { strength = 0.32, radius = 110, stiffness = 0.12, damping = 0.72 } = opts;
  if (!el || prefersReducedMotion()) return () => {};
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};

  el.classList.add('is-magnetic');
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0, vx: 0, vy: 0 };
  let raf = 0;

  const onMove = (e) => {
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    if (Math.hypot(dx, dy) < radius) {
      target.x = dx * strength;
      target.y = dy * strength;
    } else {
      target.x = 0;
      target.y = 0;
    }
  };
  const onLeave = () => {
    target.x = 0;
    target.y = 0;
  };
  const tick = () => {
    cur.vx = (cur.vx + (target.x - cur.x) * stiffness) * damping;
    cur.vy = (cur.vy + (target.y - cur.y) * stiffness) * damping;
    cur.x += cur.vx;
    cur.y += cur.vy;
    el.style.transform = `translate3d(${cur.x.toFixed(2)}px, ${cur.y.toFixed(2)}px, 0)`;
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', onMove);
  el.addEventListener('mouseleave', onLeave);
  raf = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener('mousemove', onMove);
    el.removeEventListener('mouseleave', onLeave);
    if (raf) cancelAnimationFrame(raf);
    el.style.transform = '';
    el.classList.remove('is-magnetic');
  };
};

/**
 * magneticCursor — custom cursor dot with spring lag that grows over
 * interactive elements (ported from SEBSKILLS MagneticCursor). Disabled on
 * coarse pointers and under reduced motion. Returns a cleanup function.
 * @param {{ size?:number, hoverScale?:number, hoverSelector?:string }} [opts]
 * @returns {() => void} cleanup
 */
export const magneticCursor = (opts = {}) => {
  const {
    size = 16,
    hoverScale = 2.6,
    hoverSelector = 'a, button, [data-cursor]',
  } = opts;
  if (prefersReducedMotion()) return () => {};
  if (window.matchMedia('(pointer: coarse)').matches) return () => {};

  const dot = document.createElement('div');
  dot.className = 'magnetic-cursor';
  dot.setAttribute('aria-hidden', 'true');
  dot.style.width = `${size}px`;
  dot.style.height = `${size}px`;
  document.body.appendChild(dot);

  const pos = { x: -100, y: -100 };
  const cur = { x: -100, y: -100, vx: 0, vy: 0 };
  let scale = 1;
  let targetScale = 1;
  let hovering = false;
  let raf = 0;

  const onMove = (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
  };
  const onDown = () => {
    targetScale = 0.8;
  };
  const onUp = () => {
    targetScale = hovering ? hoverScale : 1;
  };
  const onOver = (e) => {
    if (e.target?.closest?.(hoverSelector)) {
      hovering = true;
      targetScale = hoverScale;
    }
  };
  const onOut = (e) => {
    if (e.target?.closest?.(hoverSelector)) {
      hovering = false;
      targetScale = 1;
    }
  };
  const tick = () => {
    cur.vx = (cur.vx + (pos.x - cur.x) * 0.18) * 0.75;
    cur.vy = (cur.vy + (pos.y - cur.y) * 0.18) * 0.75;
    cur.x += cur.vx;
    cur.y += cur.vy;
    scale += (targetScale - scale) * 0.15;
    dot.style.transform = `translate3d(${(cur.x - size / 2).toFixed(2)}px, ${(cur.y - size / 2).toFixed(2)}px, 0) scale(${scale.toFixed(3)})`;
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mousedown', onDown);
  window.addEventListener('mouseup', onUp);
  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);
  raf = requestAnimationFrame(tick);

  return () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mousedown', onDown);
    window.removeEventListener('mouseup', onUp);
    document.removeEventListener('mouseover', onOver);
    document.removeEventListener('mouseout', onOut);
    if (raf) cancelAnimationFrame(raf);
    dot.remove();
  };
};
