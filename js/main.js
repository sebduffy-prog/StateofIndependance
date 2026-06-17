/**
 * main.js — the Z-AXIS DEPTH-SCROLL journey engine for "The State of
 * Independence" (see docs/Z-AXIS-JOURNEY.md, docs/STRUCTURE-V2.md).
 *
 * THE MECHANIC
 *   The site is a guided journey of full-bleed STAGES living on one shared 3D
 *   stage (a `perspective` container). Scroll / trackpad / touch / ArrowDown /
 *   Space drive a single eased JOURNEY PROGRESS (0 .. stepCount-1). One stage
 *   sits at focus (z=0, full-screen, crisp); the stage being left recedes in Z
 *   (translateZ negative, scales down, blurs, fades — flies "past" the viewer)
 *   while the next advances from depth (far translateZ → 0, scales up, sharpens,
 *   fades in). It reads as flying FORWARD THROUGH the story in depth.
 *
 *   APPROACH: scroll-jacked eased progress (not a scroll-spacer). A normalised
 *   wheel/touch/key controller nudges a TARGET index; an rAF loop eases a smooth
 *   `progress` toward it; a PURE function maps each stage's distance from
 *   `progress` to transform/opacity/filter. Transform/opacity/filter only;
 *   `will-change` on the active neighbourhood; 60fps. This is the most robust
 *   path across mouse-wheel + trackpad + touch (we normalise wheel deltas and
 *   debounce discrete steps; momentum scroll cannot run away).
 *
 *   prefers-reduced-motion: NO z-fly / NO blur — a plain cross-fade between
 *   stages; scroll still steps exactly one stage at a time; keyboard works.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE STEP CONTRACT (what every section module receives + may declare)
 * ─────────────────────────────────────────────────────────────────────────
 *   • Each manifest entry: { id, title, ground?, transition?, placeholder? }.
 *       - ground   : "warm" | "cream" | "navy" — fills the FULL-BLEED stage
 *                    edge-to-edge (no cream page band; inner content is what
 *                    respects a max-width, never the ground).
 *       - transition: one of the named DEPTH PROFILES (see TRANSITIONS below).
 *                    Names the feel of flying THROUGH this stage as it is left
 *                    (and how it arrives). All profiles are PURE DEPTH — Z +
 *                    scale + blur + opacity (+ a small rotateZ/rotateX on the
 *                    orbit profile), ZERO translateX/translateY, never a slide.
 *                    Omitted → "flythrough" (the default pass-through). Under
 *                    reduced-motion every profile degrades to an opacity
 *                    cross-fade. Profiles are picked so consecutive steps differ.
 *       - placeholder: true → the engine renders a built-in "awaiting data"
 *                    stage (workflow-A structure); no fragment/module is fetched.
 *
 *   • A real section ships sections/{id}.html (a fragment) and optionally
 *     js/sections/{id}.js with a default export init(rootEl, data).
 *
 *   • data = { survey, segments, tgi, journey }  (immutable per-step `journey`).
 *       - journey.gate()  : ADVISORY only — declares this step has an
 *                           interaction; lights a gentle "try it" hint.
 *       - journey.ready() : the interaction was completed; clears the hint.
 *       SOFT GATING: scrolling/keys ALWAYS advance. gate()/ready() never trap.
 *
 *   • ARRIVAL signature: on reaching focus, the engine dispatches
 *     `chapter:arrive` (CustomEvent, detail:{ ritual }) on the section. Sections
 *     run experiential.arrival()/scrambleIn() to do the character→title reveal +
 *     count-up numbers. The persistent you-dot anchors to [data-youdot-anchor];
 *     the orbit progress arc advances. A failed section → inline error card.
 */

import { youDot, prefersReducedMotion, arrival } from './lib/experiential.js';

// ── Configuration ──────────────────────────────────────────────────────────

const DATA_FILES = {
  survey: 'data/survey.json',
  segments: 'data/segments.json',
  tgi: 'data/tgi.json',
};

/** A step's "try it" hint may appear after this dwell at focus (advisory only). */
const HINT_DWELL_MS = 1200;

/** Eased progress: how fast `progress` chases the target index per frame. */
const PROGRESS_EASE = 0.12;
/** Below this gap we snap progress to the target (kills sub-pixel drift). */
const SNAP_EPSILON = 0.0008;

/** Z-axis stage geometry — TRUE FLY-THROUGH model (Z-AXIS-JOURNEY.md §1).
 *
 *   LEAVING (current stage, d<0 as progress advances past it):
 *     translateZ 0 → +STAGE_Z_LEAVE  (comes TOWARD the camera)
 *     scale       1 → STAGE_SCALE_LEAVE  (grows past the frame — you fly THROUGH it)
 *     blur + fade out
 *
 *   ARRIVING (next stage, d>0, waiting in depth):
 *     translateZ -STAGE_Z_DEEP → 0  (emerges from deep space)
 *     scale      STAGE_SCALE_FAR → 1  (tiny in the distance, grows to fill)
 *     sharpens + fades in
 *
 *   ZERO translateX / translateY between stages — motion is purely on Z.
 *   (The constant -50%/-50% in the transform is the centering offset for
 *   top:50%;left:50% positioning; it never changes and is NOT a slide.) */
const STAGE_Z_LEAVE = 620;   // px: leaving stage flies this far TOWARD camera (+Z)
const STAGE_Z_DEEP  = 1400;  // px: arriving stage starts this far BEHIND the camera (−Z)
const STAGE_SCALE_LEAVE = 1.85; // scale of leaving stage at full fly-through (past the frame)
const STAGE_SCALE_FAR   = 0.40; // scale of arriving stage at its farthest depth
const STAGE_BLUR_MAX = 8;    // px blur on a fully-receded/approaching stage
/** Stages further than this many steps from focus are not rendered (perf). */
const RENDER_WINDOW = 2;

/** Input normalisation — one discrete step per gesture, never a runaway. */
const WHEEL_THRESHOLD = 36;    // accumulated |deltaY| to commit one step
const WHEEL_COOLDOWN_MS = 540; // min time between committed wheel steps
const WHEEL_IDLE_MS = 90;      // gap with no wheel events = one gesture has ended
const TOUCH_THRESHOLD = 56;    // px swipe to commit one step

// ── Fetch helpers ────────────────────────────────────────────────────────────

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const fetchText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** A visible inline error card so a failed step is obvious without blanking. */
const errorCard = (id, message) => {
  const div = document.createElement('div');
  div.className = 'chapter-inner';
  div.innerHTML = `
    <div class="section-error-card" role="alert">
      <h2 tabindex="-1">This step could not load</h2>
      <p>${id}: ${message}</p>
    </div>`;
  return div;
};

/**
 * Built-in "awaiting data" placeholder body for a structure-only step
 * (workflow A scaffolds; workflow B builds the content). It still uses the
 * character→title reveal markup so its arrival signature works.
 * @param {{id:string, title:string}} entry
 * @returns {string}
 */
const placeholderBody = (entry) => `
  <div class="chapter-inner stage-placeholder">
    <p class="vccp-eyebrow" data-arrival>The State of Independence</p>
    <h2 class="si-display si-display--black stage-placeholder__title"
        data-arrival data-arrival-scramble>${entry.title}</h2>
    <p class="si-measure stage-placeholder__note" data-arrival>
      This step is scaffolded — its content arrives in the next build.
    </p>
    <span class="stage-placeholder__dot" data-youdot-anchor aria-hidden="true"></span>
  </div>`;

/**
 * Load all datasets in parallel. A dataset that fails resolves to null rather
 * than aborting the whole journey — steps guard their own data access.
 * @returns {Promise<{survey:object|null, segments:object|null, tgi:object|null}>}
 */
const loadData = async () => {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      try {
        return [key, await fetchJson(url)];
      } catch {
        return [key, null];
      }
    }),
  );
  return Object.fromEntries(entries);
};

// ── Per-stage transform — the PURE depth PROFILES ─────────────────────────────

/**
 * NAMED DEPTH TRANSITION PROFILES.
 *
 * Each profile is a PURE function of `d = stageIndex - progress` → the stage's
 * 3D transform, opacity and blur. d<0 = LEAVING (flying through it toward the
 * camera); d>0 = ARRIVING (emerging from deep space). All profiles share the
 * same skeleton — the fly-through is always the base feel — and vary only the
 * geometry constants and (for "orbit") add a tiny rotateZ/rotateX swirl.
 *
 * INVARIANT (client requirement): every profile is PURE DEPTH. The only
 * translate is the static -50%/-50% centering offset (it never changes); there
 * is ZERO inter-stage translateX/translateY — nothing ever slides in from a
 * side. Motion lives entirely on Z + scale + blur + opacity (+ rotate on orbit).
 *
 *   flythrough      default pass-through (Z-AXIS-JOURNEY.md §1 geometry).
 *   dissolve-through softer + slower: shorter Z travel, gentle scale, LONG fade
 *                   and heavier blur — a stage that melts into depth.
 *   zoom-resolve    dramatic deep zoom: big +Z punch-through leaving, arrives
 *                   from very far and very small — for the segments compass.
 *   orbit-tilt      a subtle swirl as it recedes: the base fly-through plus a
 *                   small rotateZ + rotateX that eases back to flat at focus.
 *   disperse        the outro: stage scatters apart into depth — extreme +Z and
 *                   scale on leave, very fast fade — the nation flies past.
 *
 * Reduced motion: handled by stageStyleFor before any profile runs — every
 * profile degrades to a plain opacity cross-fade (no Z, scale, blur, rotate).
 */

/** easeOutQuad on |d| clamped 0→1: smooth start at focus, quick departure. */
const easeDepth = (ad) => 1 - Math.pow(1 - clamp(ad, 0, 1), 2);

/**
 * Build a depth profile from tunable geometry. Keeps all five profiles DRY:
 * they differ only by these numbers (+ an optional rotate term).
 * @param {{zLeave:number, zDeep:number, scaleLeave:number, scaleFar:number,
 *          blur:number, fadeLeave:number, fadeArrive:number,
 *          rotZ?:number, rotX?:number}} cfg
 * @returns {(d:number)=>{transform:string, opacity:number, blur:number}}
 */
const makeProfile = (cfg) => (d) => {
  const ad = Math.abs(d);
  const t = easeDepth(ad);
  let z;
  let scale;
  let opacity;

  if (d <= 0) {
    // LEAVING: comes TOWARD the camera, grows past the frame, fades + blurs.
    z = cfg.zLeave * t;
    scale = 1 + (cfg.scaleLeave - 1) * t;
    opacity = clamp(1 - ad * cfg.fadeLeave, 0, 1);
  } else {
    // ARRIVING: emerges from deep −Z, grows small→full, sharpens + fades in.
    z = -cfg.zDeep * t;
    scale = cfg.scaleFar + (1 - cfg.scaleFar) * (1 - t);
    opacity = clamp(1 - d * cfg.fadeArrive, 0, 1);
  }

  let rotate = '';
  if (cfg.rotZ || cfg.rotX) {
    // Swirl is strongest at depth, eases to flat (0) at focus. Leaving stage
    // swirls one way, arriving the other, for a gentle orbital hand-off.
    const dir = d <= 0 ? 1 : -1;
    const rz = (cfg.rotZ || 0) * t * dir;
    const rx = (cfg.rotX || 0) * t * dir;
    rotate = ` rotateZ(${rz.toFixed(2)}deg) rotateX(${rx.toFixed(2)}deg)`;
  }

  return {
    transform: `translate3d(-50%, -50%, ${z.toFixed(1)}px) scale(${scale.toFixed(4)})${rotate}`,
    opacity,
    blur: cfg.blur * t,
  };
};

/** The registry of named depth profiles. "flythrough" is the default/base. */
const TRANSITIONS = {
  flythrough: makeProfile({
    zLeave: STAGE_Z_LEAVE, zDeep: STAGE_Z_DEEP,
    scaleLeave: STAGE_SCALE_LEAVE, scaleFar: STAGE_SCALE_FAR,
    blur: STAGE_BLUR_MAX, fadeLeave: 1.6, fadeArrive: 1.4,
  }),
  'dissolve-through': makeProfile({
    zLeave: 420, zDeep: 1100,
    scaleLeave: 1.45, scaleFar: 0.55,
    blur: 13, fadeLeave: 1.05, fadeArrive: 0.95, // long, soft fade
  }),
  'zoom-resolve': makeProfile({
    zLeave: 900, zDeep: 2100,
    scaleLeave: 2.6, scaleFar: 0.22, // dramatic deep zoom
    blur: 10, fadeLeave: 1.7, fadeArrive: 1.3,
  }),
  'orbit-tilt': makeProfile({
    zLeave: 640, zDeep: 1400,
    scaleLeave: 1.8, scaleFar: 0.42,
    blur: 9, fadeLeave: 1.5, fadeArrive: 1.35,
    rotZ: 7, rotX: 5, // subtle swirl, eases to flat at focus
  }),
  disperse: makeProfile({
    zLeave: 1150, zDeep: 1600,
    scaleLeave: 3.2, scaleFar: 0.5, // stage scatters apart into depth
    blur: 14, fadeLeave: 2.4, fadeArrive: 1.2, // very fast scatter-fade
  }),
};

const DEFAULT_TRANSITION = 'flythrough';

/** Resolve a manifest transition name to a profile, falling back to default. */
const profileFor = (name) => TRANSITIONS[name] || TRANSITIONS[DEFAULT_TRANSITION];

/**
 * Pure function: a stage's distance from progress → its 3D transform, opacity
 * and blur, using the stage's own depth PROFILE. `d = stageIndex - progress`.
 *
 * Which profile applies on a given pass-through is the LEAVING stage's profile
 * (it owns the feel of being flown through); an arriving stage uses its own
 * profile too, so the hand-off blends the two — both are pure depth so it
 * always reads as fly-through, never a slide.
 *
 * Reduced motion: NO z-fly / scale / blur / rotate — plain opacity cross-fade.
 *
 * @param {number} d   stageIndex − progress
 * @param {(d:number)=>{transform:string,opacity:number,blur:number}} profile
 * @param {boolean} reduced
 * @returns {{transform:string, opacity:number, blur:number, visible:boolean}}
 */
const stageStyleFor = (d, profile, reduced) => {
  const ad = Math.abs(d);
  const visible = ad <= RENDER_WINDOW;

  if (reduced) {
    const opacity = ad >= 1 ? 0 : 1 - ad;
    return { transform: 'translate3d(-50%, -50%, 0)', opacity, blur: 0, visible };
  }

  const s = profile(d);
  return { transform: s.transform, opacity: s.opacity, blur: s.blur, visible };
};

// ── Section mounting ──────────────────────────────────────────────────────────

/** Move focus to a stage's heading for keyboard / screen-reader orientation. */
const focusHeading = (section) => {
  const heading = section.querySelector('h1, h2, [role="heading"]') || section;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  try {
    heading.focus({ preventScroll: true });
  } catch {
    heading.focus();
  }
};

/**
 * Mount one manifest entry as a full-bleed stage inside the 3D stage container.
 * Placeholder entries get the built-in body and no module. Real entries fetch
 * their fragment + dynamic-import their module; both fail into an error card.
 * @param {{id:string, title:string, ground?:string, placeholder?:boolean}} entry
 * @param {object} data { survey, segments, tgi, journey }
 * @param {HTMLElement} stageRoot
 * @returns {Promise<HTMLElement>}
 */
const mountSection = async (entry, data, stageRoot) => {
  const section = document.createElement('section');
  section.className = 'journey-stage';
  if (entry.ground) section.classList.add(`si-ground-${entry.ground}`);
  if (entry.placeholder) section.classList.add('journey-stage--placeholder');
  section.id = entry.id;
  section.setAttribute('aria-label', entry.title);
  section.setAttribute('role', 'group');
  section.setAttribute('aria-hidden', 'true');
  stageRoot.append(section);

  if (entry.placeholder) {
    section.innerHTML = placeholderBody(entry);
    return section;
  }

  try {
    section.innerHTML = await fetchText(`sections/${entry.id}.html`);
  } catch (err) {
    section.innerHTML = '';
    section.append(errorCard(entry.id, `fragment ${err.message}`));
    return section;
  }

  try {
    const module = await import(`./sections/${entry.id}.js`);
    if (typeof module.default === 'function') module.default(section, data);
  } catch (err) {
    section.append(errorCard(entry.id, `module ${err.message}`));
  }
  return section;
};

// ── Progress arc (orbit completion ring) ──────────────────────────────────────

const ARC_SIZE = 30;
const ARC_RADIUS = 12;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

/**
 * A thin SVG ring whose stroke fills with journey progress. Returns a setter
 * taking 0..1. Lives in the minimal bottom meta block.
 * @param {HTMLElement} mountEl
 * @returns {(p:number)=>void}
 */
const createProgressArc = (mountEl) => {
  const ns = 'http://www.w3.org/2000/svg';
  const c = ARC_SIZE / 2;
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'journey-meridian');
  svg.setAttribute('viewBox', `0 0 ${ARC_SIZE} ${ARC_SIZE}`);
  svg.setAttribute('width', String(ARC_SIZE));
  svg.setAttribute('height', String(ARC_SIZE));
  svg.setAttribute('aria-hidden', 'true');

  const track = document.createElementNS(ns, 'circle');
  const fill = document.createElementNS(ns, 'circle');
  [track, fill].forEach((el) => {
    el.setAttribute('cx', String(c));
    el.setAttribute('cy', String(c));
    el.setAttribute('r', String(ARC_RADIUS));
    el.setAttribute('fill', 'none');
  });
  track.setAttribute('class', 'journey-meridian__track');
  fill.setAttribute('class', 'journey-meridian__fill');
  fill.setAttribute('transform', `rotate(-90 ${c} ${c})`);
  fill.style.strokeDasharray = String(ARC_CIRCUMFERENCE);
  fill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE);

  svg.append(track, fill);
  mountEl.prepend(svg);

  return (p) => {
    const clamped = clamp(p, 0, 1);
    fill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE * (1 - clamped));
  };
};

// ── The Z-axis controller ─────────────────────────────────────────────────────

/**
 * The depth-scroll controller. Owns: the eased `progress`, the discrete
 * `target` index, normalised input, the per-stage transform write, the arrival
 * dispatch on focus change, the you-dot anchor, and the advisory hint.
 * @param {{id:string,title:string}[]} manifest
 * @returns {{ makeJourneyApi:(i:number)=>object, setSections:(s:HTMLElement[])=>void, start:()=>void }}
 */
const createJourney = (manifest) => {
  const stepCount = manifest.length;
  const reduced = prefersReducedMotion();

  // Resolve each step's depth profile once (pure functions; reused per frame).
  const profiles = manifest.map((entry) => profileFor(entry.transition));

  const indicator = document.getElementById('journeyIndicator');
  const hint = document.getElementById('journeyHint');
  const meta = document.querySelector('.journey-meta');
  const setArc = meta ? createProgressArc(meta) : () => {};

  const marker = youDot();

  /** @type {HTMLElement[]} */
  let sections = [];
  /** Advisory per-step affordance state (never blocks). */
  const states = Array.from({ length: stepCount }, () => ({ gated: false, ready: false }));

  let progress = 0; // eased, fractional
  let target = 0; // discrete index we ease toward
  let focused = -1; // last index that received chapter:arrive
  let raf = 0;
  let running = false;
  let hintTimer = null;
  let firstArrivalDone = false;
  let cueUpdate = null; // set once the cover scroll cue is mounted

  // ── Advisory hint ────────────────────────────────────────────────────────
  const refreshMeta = () => {
    indicator.textContent = `${target + 1} / ${stepCount}`;
    const s = states[target];
    const show = s.gated && !s.ready && target !== stepCount - 1;
    if (hint) hint.hidden = !show;
  };

  const scheduleHint = () => {
    if (hintTimer) clearTimeout(hintTimer);
    if (hint) hint.hidden = true;
    hintTimer = window.setTimeout(refreshMeta, HINT_DWELL_MS);
  };

  /**
   * Per-step API (immutable). gate()/ready() are ADVISORY — they toggle the
   * optional hint only; they never lock or unlock advancement.
   * @param {number} index
   */
  const makeJourneyApi = (index) =>
    Object.freeze({
      gate() {
        states[index] = { ...states[index], gated: true };
        if (index === target) refreshMeta();
      },
      ready() {
        states[index] = { ...states[index], ready: true };
        if (index === target) refreshMeta();
      },
    });

  // ── Arrival on focus change ────────────────────────────────────────────────
  const dispatchArrival = (index) => {
    if (index === focused) return;
    focused = index;
    const section = sections[index];
    if (!section) return;

    sections.forEach((s, i) => s.setAttribute('aria-hidden', i === index ? 'false' : 'true'));

    // The you-dot is connective tissue ONLY where a step declares an anchor.
    // Steps without [data-youdot-anchor] must NOT show a dot floating in empty
    // ground — hide it (toggle .is-live) and only anchor + reveal when present.
    const hasAnchor = !!section.querySelector('[data-youdot-anchor]');
    marker.el.classList.toggle('is-live', hasAnchor);
    if (hasAnchor) marker.anchorTo(section);

    const ritual = index === 0 && !firstArrivalDone;
    if (ritual) firstArrivalDone = true;
    section.dispatchEvent(new CustomEvent('chapter:arrive', { detail: { ritual } }));
    // Placeholder stages have no module to run the arrival; the engine runs it
    // so their character→title reveal still fires (real sections self-handle).
    if (section.classList.contains('journey-stage--placeholder')) {
      arrival(section, { ritual: false });
    }
    focusHeading(section);
    refreshMeta();
    scheduleHint();
  };

  // ── Render the depth field for the current `progress` ──────────────────────
  const render = () => {
    for (let i = 0; i < stepCount; i += 1) {
      const section = sections[i];
      if (!section) continue;
      const style = stageStyleFor(i - progress, profiles[i], reduced);
      if (!style.visible) {
        if (section.style.visibility !== 'hidden') {
          section.style.visibility = 'hidden';
          section.style.willChange = 'auto';
        }
        continue;
      }
      section.style.visibility = 'visible';
      section.style.opacity = style.opacity.toFixed(3);
      section.style.transform = style.transform;
      section.style.filter = style.blur > 0.05 ? `blur(${style.blur.toFixed(2)}px)` : 'none';
      section.style.zIndex = String(1000 - Math.round(Math.abs(i - progress) * 10));
      section.style.willChange = Math.abs(i - progress) < 1.2 ? 'transform, opacity, filter' : 'auto';
    }
    setArc(stepCount > 1 ? progress / (stepCount - 1) : 1);
    if (cueUpdate) cueUpdate();
  };

  // ── rAF ease loop ──────────────────────────────────────────────────────────
  const loop = () => {
    const gap = target - progress;
    if (Math.abs(gap) < SNAP_EPSILON) {
      progress = target;
      render();
      dispatchArrival(target);
      running = false;
      raf = 0;
      return;
    }
    progress += gap * PROGRESS_EASE;
    render();
    // Fire arrival as soon as we settle near the target stage.
    if (Math.abs(gap) < 0.5) dispatchArrival(target);
    raf = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };

  // ── Discrete navigation (soft — always advances) ───────────────────────────
  const goTo = (index) => {
    const next = clamp(index, 0, stepCount - 1);
    if (next === target) return;
    target = next;
    refreshMeta();
    scheduleHint();
    kick();
  };
  const goNext = () => goTo(target + 1);
  const goBack = () => goTo(target - 1);

  // ── Input: normalise wheel / touch / keys to discrete steps ────────────────
  const bindInput = () => {
    // WHEEL / TRACKPAD — ONE gesture = ONE step, deterministically.
    //
    // The old double-jump came from trackpad MOMENTUM: a single physical swipe
    // emits a long tail of wheel events that can outlast a fixed cooldown, so a
    // second step committed off the leftover momentum. The fix is a MOMENTUM
    // LOCK: once a step commits we (1) zero the accumulator, (2) hold a cooldown,
    // and (3) refuse to commit the NEXT step until the wheel has gone idle for
    // WHEEL_IDLE_MS — i.e. the previous gesture has actually ended. A continuous
    // momentum stream can never trip a second step; you must lift and swipe again.
    let wheelAccum = 0;
    let lastWheelStep = 0;   // when the last step committed
    let lastWheelEvent = 0;  // when the last wheel event arrived (idle detection)
    let gestureLocked = false; // true between a commit and the next idle gap
    window.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const now = performance.now();
        const sinceLastEvent = now - lastWheelEvent;
        lastWheelEvent = now;

        // A gap in the event stream means the previous gesture ended: release
        // the lock and start a fresh accumulation for the new gesture.
        if (sinceLastEvent > WHEEL_IDLE_MS) {
          gestureLocked = false;
          wheelAccum = 0;
        }

        // Still inside the committed gesture (momentum tail) — swallow it.
        if (gestureLocked) {
          wheelAccum = 0;
          return;
        }
        // Cooldown guards the minimum cadence between deliberate steps.
        if (now - lastWheelStep < WHEEL_COOLDOWN_MS) {
          wheelAccum = 0;
          return;
        }

        wheelAccum += e.deltaY;
        if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return;

        if (wheelAccum > 0) goNext();
        else goBack();

        wheelAccum = 0;
        lastWheelStep = now;
        gestureLocked = true; // hold until the wheel goes idle (gesture ends)
      },
      { passive: false },
    );

    // TOUCH — ONE swipe = ONE step. A single touch can commit at most once
    // (touchCommitted); it only re-arms on touchend, so dragging further within
    // the same contact never advances a second step.
    let touchStartY = null;
    let touchCommitted = false;
    window.addEventListener(
      'touchstart',
      (e) => {
        touchStartY = e.touches[0]?.clientY ?? null;
        touchCommitted = false;
      },
      { passive: true },
    );
    window.addEventListener(
      'touchmove',
      (e) => {
        if (touchStartY === null || touchCommitted) return;
        const dy = touchStartY - (e.touches[0]?.clientY ?? touchStartY);
        if (Math.abs(dy) < TOUCH_THRESHOLD) return;
        if (dy > 0) goNext();
        else goBack();
        touchCommitted = true; // one step per contact; re-arms on touchend
      },
      { passive: true },
    );
    window.addEventListener(
      'touchend',
      () => {
        touchStartY = null;
        touchCommitted = false;
      },
      { passive: true },
    );

    // KEYS — ArrowDown / Space / PageDown forward; ArrowUp / PageUp back.
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented) return;
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          goBack();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(stepCount - 1);
          break;
        default:
          break;
      }
    });

    window.addEventListener('resize', () => marker.anchorTo(sections[focused] || sections[0]), {
      passive: true,
    });
  };

  /**
   * The opening scroll cue — replaces the old "Begin" button. An understated
   * "Scroll to journey through" line + a quiet descending indicator. Mounted on
   * the cover stage; fades out the moment the journey advances past the cover.
   */
  const mountScrollCue = () => {
    const cover = sections[0];
    if (!cover) return;
    const cue = document.createElement('div');
    cue.className = 'journey-scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML =
      '<span class="journey-scroll-cue__label">Scroll to journey through</span>' +
      '<span class="journey-scroll-cue__bead" aria-hidden="true"></span>';
    cover.appendChild(cue);
    const update = () => {
      cue.classList.toggle('is-gone', progress > 0.04);
    };
    update();
    cover.addEventListener('chapter:arrive', update);
    // Keep it in sync as progress moves (cheap: a class toggle inside render).
    cueUpdate = update;
  };

  return {
    makeJourneyApi,
    setSections: (list) => {
      sections = list;
    },
    start: () => {
      bindInput();
      mountScrollCue();
      render();
      dispatchArrival(0);
      refreshMeta();
    },
  };
};

// ── Bootstrap ────────────────────────────────────────────────────────────────

const init = async () => {
  const app = document.getElementById('app');

  // The 3D stage: a perspective container holding every absolutely-positioned
  // stage. Built here so index.html stays declarative.
  const stageRoot = document.createElement('div');
  stageRoot.className = 'journey-3d';
  app.append(stageRoot);

  let manifest;
  try {
    manifest = await fetchJson('sections/manifest.json');
  } catch (err) {
    stageRoot.append(errorCard('manifest', err.message));
    return;
  }

  const data = await loadData();
  const journey = createJourney(manifest);

  // Mount in manifest order, swapping data.journey to that step's own API
  // immediately before its init() runs.
  const sections = [];
  for (let i = 0; i < manifest.length; i += 1) {
    data.journey = journey.makeJourneyApi(i);
    // eslint-disable-next-line no-await-in-loop -- ordered mount is intentional
    sections.push(await mountSection(manifest[i], data, stageRoot));
  }

  journey.setSections(sections);
  journey.start();

  // Reveal the minimal bottom meta once the journey is live.
  const controls = document.getElementById('journeyControls');
  if (controls) controls.hidden = false;
};

init();
