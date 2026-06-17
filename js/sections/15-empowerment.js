/**
 * Chapter 06 — the empowerment architecture.
 *
 * THE ONE MEMORABLE THING (ART-DIRECTION §7): three needs you pull together
 * until they meet on empowerment. Tactile, elemental, expensive. The screen
 * has exactly ONE focal point — the venn centrepiece — and a quiet prelude:
 *
 *   PRELUDE (ungated, cinematic). A single thin strip wipes "survival mode" to
 *   "active agency". One word shows at a time (the off side is clipped, never
 *   stacked). A range input drives it; scroll primes the turn until touched.
 *   Keyboard operable. Narrative only — it does not gate.
 *
 *   THE CENTREPIECE (gated, the hero motion). Money / time / stress start as
 *   three large flat brand circles held WIDE apart on the open ground. Each
 *   carries its own verified Q14 brand-ask figure AS its label (the number IS
 *   the reading — 38.8 / 24.0 / 27.7, not a marooned chart below). They sweep
 *   together (auto on arrival; drag as an optional nudge) and the shared
 *   overlap blooms a luminous yellow core with "empowerment" assembling in the
 *   centre. When the three meet, journey.ready() fires (advisory — Next is
 *   never blocked). Fully keyboard operable (focus a need's stat, Enter/arrows
 *   bring it in) and reduced-motion safe (circles start resolved).
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

const PIVOT_START = 14;   // strip starts mostly on "survival"
const PIVOT_SNAP = 50;    // crossover point for which word shows

// The held beat (ms) on the wide spread before the needs auto-sweep into the
// shared core. Long enough to read three separate needs as three separate
// asks, short enough to feel like one continuous cinematic move on arrival.
const AUTO_CONVERGE_HOLD_MS = 820;

// The convergence sweep itself — one orchestrated, eased glide (all three
// circles on a SINGLE shared timeline so they arrive together and ignite
// "empowerment" as one payoff, not three springs racing to the centre).
const CONVERGE_DURATION_MS = 1180;

/**
 * Wire the thin pivot strip. Returns { slider, apply } so scrollScene can prime
 * it. Drives a single CSS var --pv 0..1 (fill width + which word is clipped).
 */
const buildPivot = (mount) => {
  const slider = mount.querySelector('.emp-pivot-slider');
  const fill = mount.querySelector('[data-emp-pivot-fill]');
  const readout = mount.querySelector('.emp-pivot-readout');
  if (!slider || !fill || !readout) return null;

  const apply = (pct) => {
    const f = Math.max(0, Math.min(1, pct / 100));
    mount.style.setProperty('--pv', f.toFixed(3));
    fill.style.width = `${(f * 100).toFixed(2)}%`;
    readout.dataset.side = pct >= PIVOT_SNAP ? 'after' : 'before';
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
 * Build the tactile venn. Calls onConverged() once the three needs fully meet.
 * Returns { autoConverge, destroy }.
 */
const buildVenn = (mount, statRow, brandAsks, onConverged) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-tv-empty">Brand-ask data is awaiting the survey file.</p>';
    return { autoConverge() {}, destroy() {} };
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
  const fmtPct = (v) => (typeof v === 'number' ? v.toFixed(1) : '—');
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
      `<span class="emp-tv-stat-dot" aria-hidden="true"></span>` +
      `<span class="emp-tv-stat-n num" ${numAttrs}>${fmtPct(v)}%</span>` +
      `<span class="emp-tv-stat-name">${NEED_META[id].label}</span>` +
      `<span class="emp-tv-stat-sub">${NEED_META[id].sub}</span>`;
    if (statRow) statRow.appendChild(stat);

    return { id, el, stat, dir: dirXY(ang), homeX: 0, homeY: 0 };
  });

  const offsets = new Map(needs.map((n) => [n.id, { dx: 0, dy: 0 }]));
  const drags = new Map();
  let converged = false;

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
      converged = true;
      stage.classList.add('is-converged');
      centre.classList.add('is-on');
      stage.classList.remove('is-pulse');
      void stage.offsetWidth;
      stage.classList.add('is-pulse');
      onConverged();
      lockToCentre();
    }
  };

  // Premium ease — a slow-in / decisive-pull / soft-settle curve. The needs
  // hesitate at the spread, then are drawn together as if by gravity, then
  // ease to rest exactly as they meet on the shared core.
  const easeConverge = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  let sweepRaf = 0;
  const cancelSweep = () => {
    if (sweepRaf) {
      cancelAnimationFrame(sweepRaf);
      sweepRaf = 0;
    }
  };

  // Snap (no animation) every need onto the resolved triangle — used for the
  // keyboard "bring all in", resize-while-converged, and reduced motion.
  const snapToCentre = () => {
    cancelSweep();
    const g = geom();
    needs.forEach((n) => {
      const ctrl = drags.get(n.id);
      if (!ctrl) return;
      const { dx, dy } = resolvedOffset(n, g);
      ctrl.setPosition(dx, dy, { animate: false });
    });
  };

  // THE CONVERGENCE — one orchestrated, eased sweep. All three circles ride a
  // SINGLE shared timeline from their wide home (progress 0) to the shared core
  // (progress 1), so they glide inward together and meet on the same frame. The
  // overlap deepening to navy, the centre word and the yellow ignition all fall
  // out of render() as the mean distance shrinks — the payoff is automatic.
  const sweepToCentre = () => {
    cancelSweep();
    const g = geom();
    // Capture each circle's start + end offset once, then interpolate on one t.
    const lanes = needs
      .map((n) => {
        const ctrl = drags.get(n.id);
        if (!ctrl) return null;
        const o = offsets.get(n.id);
        const end = resolvedOffset(n, g);
        return { ctrl, fromX: o.dx, fromY: o.dy, toX: end.dx, toY: end.dy };
      })
      .filter(Boolean);

    const start = performance.now();
    const tick = (now) => {
      const raw = Math.min(1, (now - start) / CONVERGE_DURATION_MS);
      const e = easeConverge(raw);
      lanes.forEach((l) => {
        l.ctrl.setPosition(
          l.fromX + (l.toX - l.fromX) * e,
          l.fromY + (l.toY - l.fromY) * e,
          { animate: false },
        );
      });
      if (raw < 1) {
        sweepRaf = requestAnimationFrame(tick);
      } else {
        sweepRaf = 0;
      }
    };
    sweepRaf = requestAnimationFrame(tick);
  };

  // Keep the resolved end-state honoured on resize without re-animating.
  const lockToCentre = snapToCentre;

  // Reset every need back to its WIDE home (offset 0,0) so the convergence can
  // replay from spread on a fresh arrival. No-op under reduced motion.
  const spreadOut = () => {
    if (reduced) return;
    cancelSweep();
    converged = false;
    stage.classList.remove('is-converged', 'is-converging');
    centre.classList.remove('is-on');
    needs.forEach((n) => {
      const ctrl = drags.get(n.id);
      if (ctrl) ctrl.setPosition(0, 0, { animate: false });
    });
    render();
  };

  // AUTO-CONVERGE — the cinematic default. After a short held beat on the wide
  // spread, the three needs sweep into the shared core on their own. Drag stays
  // available as an optional nudge; reduced motion is already resolved at rest.
  let autoTimer = 0;
  const autoConverge = () => {
    if (reduced) return;          // resolved at rest under reduced motion
    window.clearTimeout(autoTimer);
    spreadOut();                  // back to wide spread (resets converged)
    autoTimer = window.setTimeout(sweepToCentre, AUTO_CONVERGE_HOLD_MS);
  };

  // Snap a single need into the resolved triangle (keyboard path). Springs in
  // with the settle reward so a single Enter feels tactile, not teleported.
  const bringIn = (id) => {
    cancelSweep();
    const g = geom();
    const n = needs.find((x) => x.id === id);
    const { dx, dy } = resolvedOffset(n, g);
    drags.get(id).setPosition(dx, dy, { animate: true });
  };

  // Reduced motion: snap every circle onto the resolved triangle immediately.
  const snapResolved = () => {
    const g = geom();
    needs.forEach((n) => {
      const o = offsets.get(n.id);
      const r = resolvedOffset(n, g);
      o.dx = r.dx;
      o.dy = r.dy;
      n.el.style.transform = `translate3d(${o.dx}px, ${o.dy}px, 0) scale(var(--tactile-scale, 1))`;
    });
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

    // A real grab takes over from the auto-sweep so the user can nudge the
    // needs themselves mid-flight (drag stays an optional, always-live affordance).
    n.el.addEventListener('pointerdown', cancelSweep);

    // Stat label = keyboard path: Enter/Space/arrows bring that need in.
    n.stat.addEventListener('keydown', (e) => {
      const keys = ['Enter', ' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (keys.includes(e.key)) {
        e.preventDefault();
        bringIn(n.id);
      }
    });
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
    if (reduced) snapResolved();
    else if (converged) lockToCentre();
    render();
  };
  const ro = new ResizeObserver(onLayout);
  ro.observe(field);
  window.addEventListener('resize', onLayout, { passive: true });

  return {
    autoConverge,
    destroy() {
      window.clearTimeout(autoTimer);
      cancelSweep();
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

  // PRELUDE — pivot wipe (ungated).
  const pivot = pivotMount ? buildPivot(pivotMount) : null;

  // THE CENTREPIECE — venn (advisory gate via journey.ready()).
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

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Teardown handles collected across the init (steps stay mounted).
  const cleanups = [];

  // Re-assemble headlines AND auto-converge the venn on every arrival. The
  // circles start wide then sweep into the shared core on their own — no drag
  // required (drag stays as an optional nudge). A double rAF lets the section's
  // show + first real layout settle so the sweep runs from a measured spread.
  const fireConverge = () => {
    if (!venn) return;
    requestAnimationFrame(() => requestAnimationFrame(() => venn.autoConverge?.()));
  };
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
    fireConverge();
  });

  // Belt-and-braces scroll-in trigger: the moment the venn enters the viewport
  // (e.g. a direct scroll into the step that does not change journey focus), the
  // converge sweep still fires automatically. Reduced motion is already resolved
  // at rest, so autoConverge() is a no-op there.
  if (vennMount && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) fireConverge();
      },
      { threshold: 0.4 },
    );
    io.observe(vennMount);
    cleanups.push(() => io.disconnect());
  }

  // Experiential motion — everything but the centrepiece stays quiet.
  cleanups.push(chapterTransition(root));
  cleanups.push(observeParallax(root, { maxShiftPx: 40 }));

  // Prime the pivot wipe as the section scrolls in — until the visitor touches
  // it, scroll progress nudges the strip from survival toward agency.
  if (pivot && pivotMount && !prefersReducedMotion()) {
    let touched = false;
    const markTouched = () => { touched = true; };
    pivot.slider.addEventListener('pointerdown', markTouched);
    pivot.slider.addEventListener('keydown', markTouched);
    cleanups.push(
      scrollScene(pivotMount, [], {
        onProgress: (p) => {
          if (touched) return;
          const t = Math.max(0, Math.min(1, (p - 0.2) / 0.5));
          const pct = PIVOT_START + t * (76 - PIVOT_START);
          pivot.slider.value = String(Math.round(pct));
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
