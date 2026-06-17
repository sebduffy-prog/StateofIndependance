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

/**
 * TIME-BASED TRANSITION TWEEN (replaces the old frame-rate-dependent fractional
 * ease). A gesture commits ONE discrete `target` step; the engine then tweens
 * `progress` from where it was to that single target over a fixed DURATION with
 * a profile-specific easing curve. Because the tween interpolates between a fixed
 * `from` and a fixed `to` (one step apart, never re-aimed mid-flight), the eased
 * progress is monotonic and CANNOT overshoot a step — the double-jump is
 * structurally impossible regardless of frame rate or trackpad momentum.
 *
 * Durations are LONG and CINEMATIC (client priority): each profile owns its own
 * duration in the 1.0–1.6s band so the depth-travel reads as a slow, deliberate
 * fly-through, not a snap.
 */
const TRANSITION_DURATION_DEFAULT_MS = 1200;

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

/** Input normalisation — one discrete step per gesture, never a runaway.
 *  Cooldown is held to roughly the transition length so a step always fully
 *  resolves before the next is allowed to commit (smooth, deterministic). */
const WHEEL_THRESHOLD = 40;     // accumulated |deltaY| to commit one step
const WHEEL_COOLDOWN_MS = 760;  // min time between committed wheel steps (~transition length)
const WHEEL_IDLE_MS = 110;      // gap with no wheel events = one gesture has ended
const TOUCH_THRESHOLD = 56;     // px swipe to commit one step
const KEY_COOLDOWN_MS = 520;    // min time between key-driven steps (debounce held keys)

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

/**
 * SPATIAL EASING — how a stage's distance |d| maps to its depth "phase" t∈0→1.
 * This shapes the SHAPE of the fly-through (where the stage spends its time in
 * Z), distinct from the temporal tween easing (which shapes the speed over the
 * 1.0–1.6s). Each profile picks one so the profiles genuinely DIFFER in feel.
 */
const spatialEases = {
  // easeOutQuad — leaves focus crisply, decelerates into deep space.
  outQuad: (ad) => 1 - Math.pow(1 - ad, 2),
  // easeInOutCubic — slow at focus AND at depth; the long, melting dissolve.
  inOutCubic: (ad) => (ad < 0.5 ? 4 * ad * ad * ad : 1 - Math.pow(-2 * ad + 2, 3) / 2),
  // easeInCubic — clings to focus then accelerates hard away: the dramatic punch.
  inCubic: (ad) => ad * ad * ad,
  // easeOutBack-ish — overshoots subtly at depth for the orbital swirl settle.
  outBack: (ad) => {
    const c = 1.18;
    const p = ad - 1;
    return 1 + (c + 1) * p * p * p + c * p * p;
  },
  // easeInExpo — sits still then scatters violently outward: the outro disperse.
  inExpo: (ad) => (ad <= 0 ? 0 : Math.pow(2, 8 * ad - 8)),
};

/**
 * Build a depth profile from tunable geometry + its own spatial easing.
 * Keeps all five profiles DRY: they differ by these numbers, the spatial
 * easing curve, an optional rotate term, AND a per-profile transition duration.
 * @param {{zLeave:number, zDeep:number, scaleLeave:number, scaleFar:number,
 *          blur:number, fadeLeave:number, fadeArrive:number,
 *          ease?:(ad:number)=>number, rotZ:number, rotX:number,
 *          durationMs:number}} cfg
 * @returns {((d:number)=>{transform:string, opacity:number, blur:number})
 *           & { durationMs:number }}
 */
const makeProfile = (cfg) => {
  const ease = cfg.ease || spatialEases.outQuad;
  const fn = (d) => {
    const ad = clamp(Math.abs(d), 0, 1);
    const t = clamp(ease(ad), 0, 1.25); // outBack may exceed 1 briefly (overshoot)
    let z;
    let scale;
    let opacity;

    if (d <= 0) {
      // LEAVING: comes TOWARD the camera, grows past the frame, fades + blurs.
      z = cfg.zLeave * t;
      scale = 1 + (cfg.scaleLeave - 1) * t;
      opacity = clamp(1 - Math.abs(d) * cfg.fadeLeave, 0, 1);
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
      transform: `translate3d(-50%, -50%, ${z.toFixed(1)}px) scale(${Math.max(scale, 0.01).toFixed(4)})${rotate}`,
      opacity,
      blur: cfg.blur * Math.min(t, 1),
    };
  };
  fn.durationMs = cfg.durationMs;
  return fn;
};

/**
 * The registry of named depth PROFILES — five genuinely-distinct fly-throughs.
 * Each owns geometry + a spatial easing curve + a duration, so consecutive
 * steps (assigned alternating profiles in the manifest) read differently.
 *
 *   flythrough        the default pass-through — brisk, crisp, outQuad. 1.10s.
 *   dissolve-through  soft + slow: short Z, gentle scale, LONG inOutCubic fade,
 *                     heavy blur — a stage that melts into depth. 1.50s.
 *   zoom-resolve      dramatic deep zoom (the segments compass): big +Z punch on
 *                     leave (inCubic clings then accelerates), arrives from very
 *                     far and very small. 1.60s.
 *   orbit-tilt        a subtle swirl: base fly-through + rotateZ/rotateX with an
 *                     outBack settle so it overshoots and eases to flat. 1.40s.
 *   disperse          the outro: extreme +Z + scale, inExpo so it sits still then
 *                     scatters violently apart into depth. 1.50s.
 */
const TRANSITIONS = {
  flythrough: makeProfile({
    zLeave: STAGE_Z_LEAVE, zDeep: STAGE_Z_DEEP,
    scaleLeave: STAGE_SCALE_LEAVE, scaleFar: STAGE_SCALE_FAR,
    blur: STAGE_BLUR_MAX, fadeLeave: 1.6, fadeArrive: 1.4,
    ease: spatialEases.outQuad, rotZ: 0, rotX: 0,
    durationMs: 1100,
  }),
  'dissolve-through': makeProfile({
    zLeave: 420, zDeep: 1100,
    scaleLeave: 1.42, scaleFar: 0.56,
    blur: 15, fadeLeave: 1.0, fadeArrive: 0.92, // long, soft fade
    ease: spatialEases.inOutCubic, rotZ: 0, rotX: 0,
    durationMs: 1500,
  }),
  'zoom-resolve': makeProfile({
    zLeave: 980, zDeep: 2200,
    scaleLeave: 2.7, scaleFar: 0.20, // dramatic deep zoom
    blur: 11, fadeLeave: 1.7, fadeArrive: 1.3,
    ease: spatialEases.inCubic, rotZ: 0, rotX: 0,
    durationMs: 1600,
  }),
  'orbit-tilt': makeProfile({
    zLeave: 660, zDeep: 1400,
    scaleLeave: 1.78, scaleFar: 0.42,
    blur: 9, fadeLeave: 1.5, fadeArrive: 1.35,
    ease: spatialEases.outBack, rotZ: 8, rotX: 5, // swirl, overshoots to flat
    durationMs: 1400,
  }),
  disperse: makeProfile({
    zLeave: 1200, zDeep: 1650,
    scaleLeave: 3.3, scaleFar: 0.5, // stage scatters apart into depth
    blur: 16, fadeLeave: 2.3, fadeArrive: 1.2, // violent scatter-fade
    ease: spatialEases.inExpo, rotZ: 0, rotX: 0,
    durationMs: 1500,
  }),
};

const DEFAULT_TRANSITION = 'flythrough';

/**
 * GROUND CROSSFADE — the continuous backdrop wash behind the depth stage.
 *
 * Each stage carries its own si-ground-* background, so between two steps the
 * only thing visible "through" the fading stages is the .journey-3d backdrop.
 * If that backdrop is a fixed colour (it was cream) a navy→warm hand-off reads
 * as a hard PowerPoint cut and a pale flash. Instead the engine paints the
 * backdrop with a colour LERPED between the leaving step's ground and the
 * arriving step's ground, weighted by the fractional part of `progress`. The
 * world colour glides continuously in both directions — no cut, no flash.
 *
 * Each entry is the DOMINANT solid tone of that ground (not the gradient) so
 * the wash unmistakably reads as that world while the stages cross-dissolve.
 */
const GROUND_COLORS = {
  warm: [251, 193, 0],    // --ground-amber #FBC100
  cream: [240, 237, 231], // --cream #F0EDE7
  navy: [4, 22, 84],      // --navy #041654
  blue: [4, 22, 84],      // legacy alias → navy world
};
const DEFAULT_GROUND_COLOR = GROUND_COLORS.warm;

/** Resolve a manifest ground name to its representative backdrop colour. */
const groundColorFor = (name) => GROUND_COLORS[name] || DEFAULT_GROUND_COLOR;

/** Linear interpolate two [r,g,b] triples → a CSS rgb() string. t∈0..1. */
const lerpColor = (a, b, t) => {
  const k = clamp(t, 0, 1);
  const r = Math.round(a[0] + (b[0] - a[0]) * k);
  const g = Math.round(a[1] + (b[1] - a[1]) * k);
  const bl = Math.round(a[2] + (b[2] - a[2]) * k);
  return `rgb(${r}, ${g}, ${bl})`;
};

/** Resolve a manifest transition name to a profile, falling back to default. */
const profileFor = (name) => TRANSITIONS[name] || TRANSITIONS[DEFAULT_TRANSITION];

/** Cubic-bezier-ish TEMPORAL easing for the tween clock (speed over time).
 *  easeInOutCubic: a slow, cinematic ramp-in and settle — never a linear slide. */
const easeTween = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

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
  // Each step's transition duration (ms) — owned by its profile. When stepping
  // we use the duration of the profile that owns the MOVE (the higher-index of
  // the two stages, i.e. the one being revealed / the direction we travel into).
  const durations = profiles.map((p) => p.durationMs || TRANSITION_DURATION_DEFAULT_MS);
  // Each step's representative backdrop colour for the continuous ground wash.
  const groundColors = manifest.map((entry) => groundColorFor(entry.ground));

  // The depth-stage backdrop. Painting THIS each frame (lerped between the two
  // bracketing steps' grounds) gives one smooth colour glide behind the stages,
  // so there is never a flash of the static container colour at a hand-off.
  const backdrop = document.querySelector('.journey-3d');
  // Paint the cover's ground immediately, before sections mount, so the screen
  // opens ON the cover world — never a flash of the static container fill while
  // the (initially hidden) stages are still fetching.
  if (backdrop && groundColors.length) {
    backdrop.style.backgroundColor = lerpColor(groundColors[0], groundColors[0], 0);
  }

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

  // Time-based tween state: a step tweens `progress` from `tweenFrom` to
  // `target` (exactly one index away) over `tweenDur` ms with eased timing.
  let tweenFrom = 0;
  let tweenStart = 0;
  let tweenDur = TRANSITION_DURATION_DEFAULT_MS;

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

  // Paint the backdrop with the world colour LERPED between the two steps that
  // bracket `progress`. The wash glides continuously and reversibly, so a step
  // hand-off (worst case navy→warm) cross-dissolves through one smooth colour
  // instead of cutting through the static container fill.
  const paintBackdrop = () => {
    if (!backdrop) return;
    const lo = clamp(Math.floor(progress), 0, stepCount - 1);
    const hi = clamp(Math.ceil(progress), 0, stepCount - 1);
    backdrop.style.backgroundColor = lerpColor(groundColors[lo], groundColors[hi], progress - lo);
  };

  // ── Render the depth field for the current `progress` ──────────────────────
  const render = () => {
    paintBackdrop();
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

  // ── rAF TIME-BASED tween loop ──────────────────────────────────────────────
  // Eased interpolation from `tweenFrom` → `target` over `tweenDur`. Because
  // both ends are fixed (and one step apart) and the clock is monotonic, the
  // eased `progress` is monotonic too and CANNOT overshoot the target step —
  // no frame-rate or momentum effect can produce a double-jump.
  const loop = (nowArg) => {
    const now = nowArg || performance.now();
    const elapsed = now - tweenStart;
    const p = tweenDur > 0 ? clamp(elapsed / tweenDur, 0, 1) : 1;
    const eased = easeTween(p);
    progress = tweenFrom + (target - tweenFrom) * eased;
    render();

    if (p >= 1) {
      progress = target;
      render();
      dispatchArrival(target);
      running = false;
      raf = 0;
      return;
    }
    // Fire arrival once the focused stage is essentially resolved (last ~15%).
    if (p > 0.85) dispatchArrival(target);
    raf = requestAnimationFrame(loop);
  };

  const kick = () => {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(loop);
  };

  // ── Discrete navigation (soft — always advances) ───────────────────────────
  // One call = one committed step. Re-aims the tween from the CURRENT eased
  // `progress` to the new `target`, so a mid-flight input retargets smoothly
  // without ever skipping past a step.
  const goTo = (index) => {
    const next = clamp(index, 0, stepCount - 1);
    if (next === target) return;
    target = next;
    tweenFrom = progress;
    tweenStart = performance.now();
    // The MOVE's feel/duration belongs to the stage we are travelling into.
    // Reduced motion: a brief cross-fade, never a long cinematic tween.
    tweenDur = reduced ? 260 : (durations[next] || TRANSITION_DURATION_DEFAULT_MS);
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
    // A cooldown debounces auto-repeat from a held key to one step per cadence,
    // so the keyboard matches the one-gesture-one-step contract of wheel/touch.
    let lastKeyStep = 0;
    const keyStep = (fn) => {
      const now = performance.now();
      if (now - lastKeyStep < KEY_COOLDOWN_MS) return;
      lastKeyStep = now;
      fn();
    };
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
          keyStep(goNext);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          keyStep(goBack);
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

    // Re-anchor on resize ONLY for a focused step that actually declares an
    // anchor — never reposition the hidden dot onto a stray spot on a step that
    // has none (it must stay hidden, not lurk somewhere ready to flash).
    window.addEventListener(
      'resize',
      () => {
        const section = sections[focused] || sections[0];
        if (section && section.querySelector('[data-youdot-anchor]')) {
          marker.anchorTo(section);
        }
      },
      { passive: true },
    );
  };

  /**
   * The opening scroll cue — replaces the old "Begin" button. An understated
   * "Scroll to navigate the site" line + a quiet descending indicator. Mounted
   * on the cover stage; fades out the moment the journey advances past the cover.
   */
  const mountScrollCue = () => {
    const cover = sections[0];
    if (!cover) return;
    const cue = document.createElement('div');
    cue.className = 'journey-scroll-cue';
    cue.setAttribute('aria-hidden', 'true');
    cue.innerHTML =
      '<span class="journey-scroll-cue__label">Scroll to navigate the site</span>' +
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
