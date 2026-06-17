/**
 * Chapter 06 — the empowerment architecture.
 *
 * THE ONE MEMORABLE THING (ART-DIRECTION §7): three needs you pull together
 * until they meet on empowerment. Tactile, elemental, expensive. The screen
 * has exactly ONE focal point — the venn centrepiece — driven by ONE control:
 *
 *   THE PIVOT SLIDER (the control). A single thin strip runs from "the old
 *   model" to "the new model", wiping "survival mode" to "active agency". One
 *   word shows at a time (the off side is clipped, never stacked). Its 0..1
 *   value is the master control for the whole turn. Scroll primes it part-way
 *   until touched; the visitor finishes (or reverses) the turn. Keyboard
 *   operable by arrows.
 *
 *   THE CENTREPIECE (the hero motion). Money / time / stress are three large
 *   flat brand circles. Each carries its own verified Q14 brand-ask figure AS
 *   its label (the number IS the reading — 38.8 / 24.0 / 27.7, not a marooned
 *   chart below). The slider's value maps continuously to their spread: far
 *   LEFT holds them WIDE apart with "empowerment" hidden; dragging RIGHT draws
 *   them together proportionally until, at full right, they MEET on the shared
 *   core, the overlap blooms a luminous yellow centre and "empowerment" ignites
 *   in. When the three first meet, journey.ready() fires (advisory — Next is
 *   never blocked). A direct drag of a circle stays available as an optional
 *   nudge. Reduced-motion safe: the venn shows the resolved (converged +
 *   revealed) state with no animation.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped #15-empowerment.
 * Verified Q14 values from segments.json meta.metricsTotals.brandAsks
 * (Stretch my money further 38.8 · Reduce stress 27.7 · Save me time 24).
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="15-empowerment">
 * @param {{survey:object|null, segments:object|null, tgi:object|null,
 *          journey:{gate():void, ready():void}}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { draggable } from '../lib/tactile.js';
import {
  chapterTransition,
  observeParallax,
  scrollScene,
  arrival,
  prefersReducedMotion,
} from '../lib/experiential.js';

/* ───────────────────── PRELUDE — the pivot wipe ────────────────────────── */

const PIVOT_SNAP = 50;    // crossover point for which word shows

// Easing for the slider->convergence map. A slow-in / decisive-pull / soft-
// settle curve so the three needs hesitate at the spread, are drawn together
// as if by gravity, then ease onto the shared core. Applied to the raw 0..1
// slider value so the whole convergence feels eased even though the control
// (the slider) is linear.
const easeConverge = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/**
 * Wire the pivot slider. Returns { slider, apply } so init can drive the venn
 * convergence from it and scrollScene can prime it. `apply` reports the eased
 * 0..1 value to an optional onConverge sink (init wires it to the venn) and
 * still drives the wipe's CSS var --pv (fill width + which word is clipped).
 */
const buildPivot = (mount, onConverge) => {
  const slider = mount.querySelector('.emp-pivot-slider');
  const fill = mount.querySelector('[data-emp-pivot-fill]');
  const readout = mount.querySelector('.emp-pivot-readout');
  if (!slider || !fill || !readout) return null;

  const apply = (pct) => {
    const f = Math.max(0, Math.min(1, pct / 100));
    mount.style.setProperty('--pv', f.toFixed(3));
    fill.style.width = `${(f * 100).toFixed(2)}%`;
    readout.dataset.side = pct >= PIVOT_SNAP ? 'after' : 'before';
    // The slider IS the convergence control: far left (old model) = spread,
    // far right (new model) = met on empowerment. Eased so the glide feels
    // weighted even though the input is linear.
    if (typeof onConverge === 'function') onConverge(easeConverge(f));
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
  return { slider, apply };
};

/* ──────────── THE CENTREPIECE — the tactile three-needs venn ─────────────── */

// Verified Q14 brand-asks (national totals), read AS each need's own label.
const NEED_KEYS = Object.freeze({
  money: 'Stretch my money further',
  time: 'Save me time',
  stress: 'Reduce stress',
});

// Three CLEARLY DISTINCT fills, all from the navy icon system so none reads as
// mustard-on-mustard, and all resolve to a deep navy core under multiply.
// Money (the loud, obvious ask) takes deep navy; time the brighter icon blue;
// stress the warm coral — the two "premium" asks lean warm, money leans deep.
const NEED_META = Object.freeze({
  money: { label: 'Save me money', short: 'money', sub: 'the obvious ask', token: '--navy', fallback: '#041654' },
  time: { label: 'Save me time', short: 'time', sub: 'the premium ask', token: '--navy-bright', fallback: '#0129A4' },
  stress: { label: 'Save me stress', short: 'stress', sub: 'the premium ask', token: '--ground-coral', fallback: '#FF8598' },
});

// Real design-team need icons (dark art on the warm ground): piggy bank /
// stopwatch / brain. Wired as <img> so the supplied PNGs render exactly.
const ICON_SVG = Object.freeze({
  money: '<img class="emp-tv-stat-icon__img" src="assets/logos/need-money.png" alt="" />',
  time: '<img class="emp-tv-stat-icon__img" src="assets/logos/need-time.png" alt="" />',
  stress: '<img class="emp-tv-stat-icon__img" src="assets/logos/need-stress.png" alt="" />',
});

// Home directions on a wide triangle: money top, time lower-left, stress lower-right.
const NEED_LAYOUT = [
  { id: 'money', ang: -90 },
  { id: 'time', ang: 150 },
  { id: 'stress', ang: 30 },
];

// Geometry as fractions of the stage's shorter side (responsive). Tuned bigger
// than before so the venn FILLS the pane — the centrepiece, not a motif.
// The spread is held WIDE enough that at rest the three circles read as three
// DISTINCT needs (only just kissing, not pre-merged), so the convergence into
// one shared core is a real, felt resolution rather than a small nudge.
const VENN = Object.freeze({
  diamFrac: 0.50,    // circle diameter — large, the screen's focal mass
  spreadFrac: 0.46,  // home distance of each centre from stage centre — pushed
                     // wider than before so the three needs start clearly apart
  lockFrac: 0.115,   // resolved (overlapping) distance from centre — the venn
                     // core: deep three-way overlap, none fully concentric
  metFrac: 0.20,     // centre-distance under which a circle counts as "met"
});

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const dirXY = (ang) => ({
  x: Math.cos((ang * Math.PI) / 180),
  y: Math.sin((ang * Math.PI) / 180),
});

/**
 * Build the tactile venn. The pivot slider drives setConvergence(0..1); render()
 * derives the overlap, glow and "empowerment" reveal from the resulting spread,
 * and onConverged() fires (advisory) the first time the needs fully meet.
 * Returns { setConvergence, destroy }.
 */
const buildVenn = (mount, statRow, brandAsks, onConverged) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-tv-empty">Brand-ask data is awaiting the survey file.</p>';
    return { setConvergence() {}, destroy() {} };
  }

  const reduced = prefersReducedMotion();
  const accent = (id) => cssVar(NEED_META[id].token, NEED_META[id].fallback);

  mount.innerHTML = `
    <div class="emp-tv-stage" role="group"
         aria-label="Bring save me money, save me time and save me stress together until they meet on empowerment">
      <div class="emp-tv-field" data-emp-tv-field>
        <div class="emp-tv-overlap" aria-hidden="true"></div>
        <div class="emp-tv-centre" aria-hidden="true">
          <span class="emp-tv-centre-word">empowerment</span>
        </div>
      </div>
    </div>`;

  const stage = mount.querySelector('.emp-tv-stage');
  const field = mount.querySelector('[data-emp-tv-field]');
  const overlap = mount.querySelector('.emp-tv-overlap');
  const centre = mount.querySelector('.emp-tv-centre');

  // Live geometry in px, computed per render from the field box.
  const geom = () => {
    const r = field.getBoundingClientRect();
    const short = Math.min(r.width, r.height);
    return {
      w: r.width,
      h: r.height,
      cx: r.width / 2,
      cy: r.height / 2,
      diam: short * VENN.diamFrac,
      spread: short * VENN.spreadFrac,
      lock: short * VENN.lockFrac,
      met: short * VENN.metFrac,
    };
  };

  // Each need = a draggable circle in the field PLUS a stat tile in a clean
  // horizontal row BENEATH the venn. The figure is the reading; the row is
  // pinned safely inside the pane so no label can ever run off-screen.
  const fmtPct = (v) => (typeof v === 'number' ? v.toFixed(1) : 'n/a');
  if (statRow) statRow.innerHTML = '';
  const needs = NEED_LAYOUT.map(({ id, ang }) => {
    const el = document.createElement('div');
    el.className = 'emp-tv-need';
    el.dataset.need = id;
    el.style.setProperty('--accent', accent(id));
    el.innerHTML = `<span class="emp-tv-need-lbl">${NEED_META[id].short}</span>`;
    field.appendChild(el);

    // Stat tile — the verified Q14 figure, focusable (keyboard path). Lives in
    // the horizontal row, never positioned at the circle's off-screen edge.
    const stat = document.createElement('div');
    stat.className = 'emp-tv-stat';
    stat.dataset.need = id;
    stat.tabIndex = 0;
    stat.style.setProperty('--accent', accent(id));
    const v = brandAsks[NEED_KEYS[id]];
    const numAttrs =
      typeof v === 'number'
        ? `data-count-to="${v}" data-count-suffix="%" data-count-decimals="1"`
        : '';
    stat.innerHTML =
      `<span class="emp-tv-stat-icon" aria-hidden="true">${ICON_SVG[id] || ''}</span>` +
      `<span class="emp-tv-stat-n num" ${numAttrs}>${fmtPct(v)}%</span>` +
      `<span class="emp-tv-stat-name">${NEED_META[id].label}</span>` +
      `<span class="emp-tv-stat-sub">${NEED_META[id].sub}</span>`;
    if (statRow) statRow.appendChild(stat);

    return { id, el, stat, dir: dirXY(ang), homeX: 0, homeY: 0 };
  });

  const offsets = new Map(needs.map((n) => [n.id, { dx: 0, dy: 0 }]));
  const drags = new Map();
  let converged = false;
  // The last slider-driven convergence value (0 spread .. 1 met). Held so a
  // resize can re-apply the same convergence against the new geometry, and so
  // a manual drag can hand control back to the slider cleanly.
  let conv = 0;

  const placeHome = () => {
    const g = geom();
    needs.forEach((n) => {
      n.el.style.width = `${g.diam}px`;
      n.el.style.height = `${g.diam}px`;
      n.homeX = g.cx + n.dir.x * g.spread;
      n.homeY = g.cy + n.dir.y * g.spread;
      n.el.style.left = `${n.homeX - g.diam / 2}px`;
      n.el.style.top = `${n.homeY - g.diam / 2}px`;
    });
  };

  // Resolved target offset so a circle sits on the tight triangle around centre.
  const resolvedOffset = (n, g) => ({
    dx: g.cx + n.dir.x * g.lock - n.homeX,
    dy: g.cy + n.dir.y * g.lock - n.homeY,
  });

  const render = () => {
    const g = geom();
    if (g.spread < 1) return; // hidden / not yet laid out — skip (avoids false "met")

    const dists = needs.map((n) => {
      const o = offsets.get(n.id);
      return Math.hypot(n.homeX + o.dx - g.cx, n.homeY + o.dy - g.cy);
    });
    const meanDist = dists.reduce((a, b) => a + b, 0) / dists.length;
    const t = Math.max(0, Math.min(1, 1 - meanDist / g.spread));

    const od = t * g.diam * 0.95;
    overlap.style.width = `${od}px`;
    overlap.style.height = `${od}px`;
    overlap.style.opacity = (0.08 + t * 0.55).toFixed(3);
    centre.style.setProperty('--tv', t.toFixed(3));
    // Glow blooms only in the back half so it reads as a reward, not an ambient
    // haze — eased from 0 at t=0.45 to full at t=1.
    field.style.setProperty('--tvg', Math.max(0, (t - 0.45) / 0.55).toFixed(3));
    stage.classList.toggle('is-converging', t > 0.15);

    const allMet = dists.every((d) => d <= g.met);
    if (allMet && !converged) {
      // The slider has driven the three needs onto the shared core: ignite.
      converged = true;
      stage.classList.add('is-converged');
      centre.classList.add('is-on');
      stage.classList.remove('is-pulse');
      void stage.offsetWidth;
      stage.classList.add('is-pulse');
      onConverged();
    } else if (!allMet && converged) {
      // Pulled back toward the old model: release so the reveal can re-ignite
      // next time the slider reaches the meeting point.
      converged = false;
      stage.classList.remove('is-converged', 'is-pulse');
      centre.classList.remove('is-on');
    }
  };

  // THE CONVERGENCE — driven directly by the pivot slider. setConvergence(t)
  // places every circle on the line between its WIDE home (t=0, the old model:
  // three distinct asks spread apart) and the shared core (t=1, the new model:
  // met on empowerment). Each frame is positioned with no per-circle spring so
  // all three track the slider together; render() then derives the overlap
  // wash, the yellow core glow and the assembling "empowerment" word from the
  // resulting mean distance, so the reveal is bound continuously to t.
  const setConvergence = (t) => {
    conv = Math.max(0, Math.min(1, t));
    const g = geom();
    needs.forEach((n) => {
      const ctrl = drags.get(n.id);
      if (!ctrl) return;
      const end = resolvedOffset(n, g);
      ctrl.setPosition(end.dx * conv, end.dy * conv, { animate: false });
    });
  };

  // Keep the slider-driven convergence honoured on resize without re-animating.
  const lockToCentre = () => setConvergence(conv);

  // Reduced motion: place every circle on the resolved triangle immediately so
  // the venn shows a sensible, converged-and-revealed state without animation.
  const snapResolved = () => {
    const g = geom();
    needs.forEach((n) => {
      const o = offsets.get(n.id);
      const r = resolvedOffset(n, g);
      o.dx = r.dx;
      o.dy = r.dy;
      n.el.style.transform = `translate3d(${o.dx}px, ${o.dy}px, 0) scale(var(--tactile-scale, 1))`;
    });
    conv = 1;
  };

  placeHome();

  needs.forEach((n) => {
    const o = offsets.get(n.id);
    const ctrl = draggable(n.el, {
      spring: 'settle',
      // A touch of overshoot so a released / brought-in need springs home with
      // weight — the Moooi "settle" reward, not a linear glide.
      springOpts: { stiffness: 170, bounce: 0.28 },
      momentum: 0,
      keyboardStep: 22,
      bounds: ({ x, y }) => {
        const g = geom();
        const half = g.diam / 2;
        const cx = n.homeX + x;
        const cy = n.homeY + y;
        const clampedCx = Math.min(g.w - half, Math.max(half, cx));
        const clampedCy = Math.min(g.h - half, Math.max(half, cy));
        return { x: clampedCx - n.homeX, y: clampedCy - n.homeY };
      },
      onMove: ({ x, y }) => {
        o.dx = x;
        o.dy = y;
        render();
      },
    });
    drags.set(n.id, ctrl);

    // The slider is the convergence control; a direct drag stays available as an
    // optional, always-live nudge (it springs/settles on release and the slider
    // re-asserts the convergence on its next move). Stat tiles stay focusable
    // purely for the colour-keyed reading + focus highlight.
    const on = () => { stage.dataset.focus = n.id; };
    const off = () => { delete stage.dataset.focus; };
    n.stat.addEventListener('mouseenter', on);
    n.stat.addEventListener('mouseleave', off);
    n.stat.addEventListener('focus', on);
    n.stat.addEventListener('blur', off);
  });

  if (reduced) snapResolved();
  render();

  // First real layout fires here (the step mounts hidden, so the initial
  // placeHome() ran against a zero box). Re-place + re-render on resize/show.
  const onLayout = () => {
    placeHome();
    // Re-apply the current slider-driven convergence against the new geometry
    // (the step mounts hidden, so the first layout is the first real box).
    if (reduced) snapResolved();
    else lockToCentre();
    render();
  };
  const ro = new ResizeObserver(onLayout);
  ro.observe(field);
  window.addEventListener('resize', onLayout, { passive: true });

  return {
    setConvergence,
    destroy() {
      ro.disconnect();
      window.removeEventListener('resize', onLayout);
      drags.forEach((d) => d.destroy());
    },
  };
};

/* ─────────────────────────────── init ──────────────────────────────────── */

export default function init(rootEl, data) {
  const root = rootEl.querySelector('[data-emp-root]') || rootEl;
  const pivotMount = rootEl.querySelector('[data-emp-pivot]');
  const vennMount = rootEl.querySelector('[data-emp-venn]');
  const statRow = rootEl.querySelector('[data-emp-stat-row]');
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
  const journey = data?.journey ?? null;

  // THE CENTREPIECE — venn (advisory gate via journey.ready()). Built first so
  // the pivot slider can drive its convergence directly.
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  let venn = null;
  if (vennMount) {
    venn = buildVenn(vennMount, statRow, brandAsks, unlock);
    if (journey) journey.gate();
    if (!brandAsks) unlock(); // fail soft: never trap the visitor
  }

  // PRELUDE + CONTROL — the pivot slider IS the convergence control. Its 0..1
  // value (old model -> new model) is fed straight into the venn: far left =
  // circles spread, "empowerment" hidden; far right = circles meet on the
  // shared core, "empowerment" revealed. The wipe word + fill ride along.
  const pivot = pivotMount
    ? buildPivot(pivotMount, (t) => venn && venn.setConvergence(t))
    : null;

  // Reduced motion: present the resolved state up front (no animation). The
  // venn is already snapped converged in buildVenn; reflect that on the slider
  // + wipe so the whole turn reads as completed rather than half-told.
  if (pivot && prefersReducedMotion()) {
    pivot.slider.value = '100';
    pivot.apply(100);
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Teardown handles collected across the init (steps stay mounted).
  const cleanups = [];

  // Re-assemble headlines on arrival. The convergence is no longer auto-fired:
  // it is bound to the slider, so the visitor drives the turn themselves.
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
  });

  // Experiential motion — everything but the centrepiece stays quiet.
  cleanups.push(chapterTransition(root));
  cleanups.push(observeParallax(root, { maxShiftPx: 40 }));

  // Prime the pivot as the section scrolls in — until the visitor touches it,
  // scroll progress nudges the slider from the old model toward the new one,
  // teasing the convergence. Once touched, the visitor is in full control and
  // finishes (or reverses) the turn. Reduced motion shows the resolved state
  // and installs no scroll work.
  if (pivot && pivotMount && !prefersReducedMotion()) {
    let touched = false;
    const markTouched = () => { touched = true; };
    pivot.slider.addEventListener('pointerdown', markTouched);
    pivot.slider.addEventListener('keydown', markTouched);
    cleanups.push(
      scrollScene(pivotMount, [], {
        onProgress: (p) => {
          if (touched) return;
          // Tease only partway in (a hint, not a full reveal): scroll nudges
          // the slider from the old model toward — but not all the way to —
          // the new one, leaving the payoff for the visitor to complete.
          const t = Math.max(0, Math.min(1, (p - 0.2) / 0.5));
          const pct = Math.round(t * 55);
          pivot.slider.value = String(pct);
          pivot.apply(pct);
        },
      }),
    );
  }

  // Teardown handle (steps stay mounted; expose for safety).
  rootEl._empCleanup = () => {
    cleanups.forEach((fn) => fn && fn());
    if (venn) venn.destroy();
  };
}
