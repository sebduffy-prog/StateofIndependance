/**
 * Chapter 06 — the empowerment architecture.
 *
 * THE ONE MEMORABLE THING (ART-DIRECTION §7): three needs you pull together
 * until they meet on empowerment. Tactile, elemental, lots of space. The screen
 * has exactly ONE focal point — the marquee venn — and a quiet prelude:
 *
 *   PRELUDE (ungated, cinematic). A single thin strip wipes "survival mode" to
 *   "active agency". One word shows at a time (the off side is clipped, never
 *   stacked). A range input drives it; scroll primes the turn until touched.
 *   Keyboard operable. Narrative only — it does not gate.
 *
 *   THE MARQUEE (gated, the hero motion). "Bring the three together." Money /
 *   time / stress start as three flat brand circles held WIDE apart on the open
 *   ground. The visitor DRAGS them together (real physics + contact shadow via
 *   tactile.js); as they converge the shared overlap grows and the word
 *   "empowerment" assembles in the centre. The three verified Q14 brand-ask
 *   values read inline beneath each need — data as a reality, not a chart. When
 *   the three meet, journey.ready() fires (advisory — Next is never blocked).
 *   Fully keyboard operable (focus a need in the legend, Enter/arrows bring it
 *   in) and reduced-motion safe (circles start resolved). The "you" dot lands
 *   on the resolved core.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped #06-empowerment.
 * Verified Q14 values from segments.json meta.metricsTotals.brandAsks
 * (Stretch my money further 38.8 · Reduce stress 27.7 · Save me time 24).
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="06-empowerment">
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

/* ──────────── THE MARQUEE — the tactile three-needs venn ────────────────── */

// Verified Q14 brand-asks (national totals), inline at each need.
const NEED_KEYS = Object.freeze({
  money: 'Stretch my money further',
  time: 'Save me time',
  stress: 'Reduce stress',
});

// Three CLEARLY DISTINCT fills that all read against the warm ground — NO
// mustard-on-mustard, all from the navy icon system. Money (the loud ask) takes
// deep navy; time takes the brighter icon blue; stress takes the warm orange.
// All three stay legible apart and resolve to a deep navy core under multiply.
const NEED_META = Object.freeze({
  money: { label: 'Save me money', short: 'money', sub: 'the obvious ask', token: '--navy', fallback: '#041654' },
  time: { label: 'Save me time', short: 'time', sub: 'the premium ask', token: '--navy-bright', fallback: '#0129A4' },
  stress: { label: 'Save me stress', short: 'stress', sub: 'the premium ask', token: '--ground-orange', fallback: '#FFA764' },
});

// Home directions on a wide triangle: money top, time lower-left, stress lower-right.
const NEED_LAYOUT = [
  { id: 'money', ang: -90 },
  { id: 'time', ang: 150 },
  { id: 'stress', ang: 30 },
];

// Geometry as fractions of the stage's shorter side (responsive).
const VENN = Object.freeze({
  diamFrac: 0.42,    // circle diameter
  spreadFrac: 0.40,  // home distance of each centre from stage centre — held
                     // WIDE so the drag-to-overlap journey is a real, felt move
  lockFrac: 0.084,   // resolved (overlapping) distance from centre
  metFrac: 0.16,     // centre-distance under which a circle counts as "met"
});

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const dirXY = (ang) => ({
  x: Math.cos((ang * Math.PI) / 180),
  y: Math.sin((ang * Math.PI) / 180),
});

/**
 * Build the tactile venn. Calls onConverged() once the three needs fully meet.
 * Returns { destroy }.
 */
const buildVenn = (mount, brandAsks, onConverged) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-tv-empty">Brand-ask data is not available.</p>';
    return { destroy() {} };
  }

  const reduced = prefersReducedMotion();
  const accent = (id) => cssVar(NEED_META[id].token, NEED_META[id].fallback);

  mount.innerHTML = `
    <div class="emp-tv-stage" role="group"
         aria-label="Drag save me money, save me time and save me stress together until they meet on empowerment">
      <div class="emp-tv-field" data-emp-tv-field data-youdot-anchor>
        <div class="emp-tv-overlap" aria-hidden="true"></div>
        <div class="emp-tv-centre" aria-hidden="true">
          <span class="emp-tv-centre-word">empowerment</span>
        </div>
      </div>
      <p class="emp-tv-hint" data-emp-tv-hint aria-live="polite">Drag the three circles together</p>
    </div>
    <div class="emp-tv-legend"></div>`;

  const stage = mount.querySelector('.emp-tv-stage');
  const field = mount.querySelector('[data-emp-tv-field]');
  const overlap = mount.querySelector('.emp-tv-overlap');
  const centre = mount.querySelector('.emp-tv-centre');
  const hint = mount.querySelector('[data-emp-tv-hint]');
  const legend = mount.querySelector('.emp-tv-legend');

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

  // The three need circles — absolutely positioned; tactile transforms them in
  // real px on top of their CSS home left/top.
  const needs = NEED_LAYOUT.map(({ id, ang }) => {
    const el = document.createElement('div');
    el.className = 'emp-tv-need';
    el.dataset.need = id;
    el.style.setProperty('--accent', accent(id));
    el.innerHTML = `<span class="emp-tv-need-lbl">${NEED_META[id].short}</span>`;
    field.appendChild(el);
    return { id, el, dir: dirXY(ang), homeX: 0, homeY: 0 };
  });

  // Legend rows — backgroundless, focusable; the keyboard path AND the inline
  // data reality (each verified Q14 value reads at its need).
  const legRows = needs.map(({ id }) => {
    const row = document.createElement('div');
    row.className = 'emp-tv-leg';
    row.dataset.need = id;
    row.tabIndex = 0;
    row.style.setProperty('--accent', accent(id));
    const v = brandAsks[NEED_KEYS[id]];
    const numAttrs =
      typeof v === 'number'
        ? `data-count-to="${v}" data-count-suffix="%" data-count-decimals="1"`
        : '';
    row.innerHTML =
      `<span class="emp-tv-leg-n num" ${numAttrs}>0</span>` +
      `<span class="emp-tv-leg-name">${NEED_META[id].label}</span>` +
      `<span class="emp-tv-leg-sub">${NEED_META[id].sub}</span>`;
    legend.appendChild(row);
    return { id, row };
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
      if (hint) hint.textContent = 'They all resolve to one thing: empowerment.';
      onConverged();
      lockToCentre();
    }
  };

  const lockToCentre = () => {
    const g = geom();
    needs.forEach((n) => {
      const ctrl = drags.get(n.id);
      if (!ctrl) return;
      const { dx, dy } = resolvedOffset(n, g);
      ctrl.setPosition(dx, dy, { animate: true });
    });
  };

  // Snap a single need into the resolved triangle (keyboard path).
  const bringIn = (id) => {
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
  });

  // Legend rows = keyboard path: Enter/Space/arrows bring that need in.
  legRows.forEach(({ id, row }) => {
    row.addEventListener('keydown', (e) => {
      const keys = ['Enter', ' ', 'Spacebar', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (keys.includes(e.key)) {
        e.preventDefault();
        bringIn(id);
      }
    });
    const on = () => { stage.dataset.focus = id; };
    const off = () => { delete stage.dataset.focus; };
    row.addEventListener('mouseenter', on);
    row.addEventListener('mouseleave', off);
    row.addEventListener('focus', on);
    row.addEventListener('blur', off);
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
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
  const journey = data?.journey ?? null;

  // PRELUDE — pivot wipe (ungated).
  const pivot = pivotMount ? buildPivot(pivotMount) : null;

  // THE MARQUEE — venn (advisory gate via journey.ready()).
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  let venn = null;
  if (vennMount) {
    venn = buildVenn(vennMount, brandAsks, unlock);
    if (journey) journey.gate();
    if (!brandAsks) unlock(); // fail soft: never trap the visitor
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Re-assemble headlines on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  // Experiential motion — everything but the marquee stays quiet.
  const cleanups = [];
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
