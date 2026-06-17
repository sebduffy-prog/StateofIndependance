/**
 * Chapter 06 — the empowerment architecture. Clean rebuild.
 *
 * One continuous warm bear-figure world, backgroundless throughout. Three
 * orchestrated beats, all deck-lifted, no fabricated numbers:
 *
 *   1. THE PIVOT WIPE (ungated, cinematic). Survival mode -> active agency.
 *      A reframe slider clips the world + copy so only ONE side is ever visible
 *      (no stacked text); two cross-fading deck bear-world panels (coil =
 *      survival, sphere = agency). scrollScene primes the turn as the section
 *      enters so it arrives rather than cuts. Keyboard operable (the range
 *      input). NARRATIVE beat — it does not gate.
 *
 *   2. THE PREMIUM. Three verified Q14 brand-asks count up on the ground:
 *      money is the loud ask, time + stress the premium ones brands undervalue.
 *
 *   3. THE MARQUEE (gated). "Three needs, one overlap." Money / time / stress
 *      start as three flat circles held APART; the visitor DRAGS them together
 *      (real physics + contact shadow via tactile.js). As they converge the
 *      shared overlap grows and the word "empowerment" assembles in the centre.
 *      When all three meet, journey.ready() fires (advisory — Next is never
 *      blocked). Fully keyboard operable (focus a need, arrows/Enter bring it
 *      in) and reduced-motion safe (circles start resolved). The "you" dot
 *      lands on this mount.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped #06-empowerment.
 * Verified Q14 values from segments.json meta.metricsTotals.brandAsks.
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

const ASSET_BASE = 'assets/deck/';

/* ───────────────────────── BEAT 1 — the pivot wipe ─────────────────────── */

const PIVOT = Object.freeze({
  before: {
    tag: 'Survival mode',
    lead: 'The old model',
    body: 'The consumer as a passive, bruised victim — retracting, freezing, waiting to be saved.',
    art: 'bear-world-coil.png',
  },
  after: {
    tag: 'Active agency',
    lead: 'The true data',
    body: 'Resourceful, fiercely independent, stepping up to fix the systems themselves.',
    art: 'bear-world-sphere.png',
  },
});

const PIVOT_START = 18;   // slider starts mostly on "survival"
const PIVOT_SNAP = 50;    // crossover point for which side's copy shows

/**
 * Build the reframe. The stage holds two cross-fading panels; the readout shows
 * exactly ONE side's copy (the other is clipped out — never stacked). A range
 * input drives both. Returns { slider, apply } so scrollScene can prime it.
 */
const buildPivot = (mount) => {
  mount.innerHTML = `
    <div class="emp-pv-stage" data-side="before">
      <img class="emp-pv-art emp-pv-art--before" src="${ASSET_BASE}${PIVOT.before.art}"
           alt="" aria-hidden="true" draggable="false" />
      <img class="emp-pv-art emp-pv-art--after" src="${ASSET_BASE}${PIVOT.after.art}"
           alt="" aria-hidden="true" draggable="false" />
    </div>
    <div class="emp-pv-readout" data-side="before" aria-live="polite">
      <div class="emp-pv-side emp-pv-side--before">
        <span class="emp-pv-tag emp-pv-tag--before">${PIVOT.before.tag}</span>
        <span class="emp-pv-lead">${PIVOT.before.lead}</span>
        <p class="emp-pv-body">${PIVOT.before.body}</p>
      </div>
      <div class="emp-pv-side emp-pv-side--after">
        <span class="emp-pv-tag emp-pv-tag--after">${PIVOT.after.tag}</span>
        <span class="emp-pv-lead">${PIVOT.after.lead}</span>
        <p class="emp-pv-body">${PIVOT.after.body}</p>
      </div>
    </div>
    <label class="emp-pv-control">
      <span class="emp-pv-control-text">Make the turn</span>
      <input type="range" class="emp-pv-slider" min="0" max="100" value="${PIVOT_START}"
             aria-label="Reveal the active-agency reading of the data" />
    </label>`;

  const stage = mount.querySelector('.emp-pv-stage');
  const readout = mount.querySelector('.emp-pv-readout');
  const artBefore = mount.querySelector('.emp-pv-art--before');
  const artAfter = mount.querySelector('.emp-pv-art--after');
  const slider = mount.querySelector('.emp-pv-slider');

  const apply = (pct) => {
    const f = Math.max(0, Math.min(1, pct / 100));
    artAfter.style.opacity = String(f);
    artBefore.style.opacity = String(1 - f);
    const side = pct >= PIVOT_SNAP ? 'after' : 'before';
    stage.dataset.side = side;
    readout.dataset.side = side;       // CSS clips the off side — one set of copy
    mount.style.setProperty('--pv', f.toFixed(3));
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
  return { slider, apply };
};

/* ───────────────────────── BEAT 2 — the premium ───────────────────────── */

// Verified Q14 brand-asks (national totals). Money is the loud ask; time +
// stress sit just behind — the premium the deck argues brands undervalue.
const PREMIUM_KEYS = Object.freeze({
  money: 'Stretch my money further',
  stress: 'Reduce stress',
  time: 'Save me time',
});

const fillPremium = (rootEl, brandAsks) => {
  if (!brandAsks) return;
  rootEl.querySelectorAll('[data-emp-stat]').forEach((el) => {
    const v = brandAsks[PREMIUM_KEYS[el.dataset.empStat]];
    if (typeof v === 'number') el.setAttribute('data-count-to', String(v));
  });
};

/* ──────────────── BEAT 3 — the marquee: tactile three-needs venn ─────────── */

const NEED_KEYS = Object.freeze({
  money: 'Stretch my money further',
  time: 'Save me time',
  stress: 'Reduce stress',
});

// Three CLEARLY DISTINCT fills that all read against the mustard ground — NO
// mustard-on-mustard. Money (the loud ask) takes deep navy; time + stress (the
// premium asks) take royal-blue + orange, so all three stay legible apart and
// resolve to a deep navy core. Each disc also carries a cream ink ring (CSS).
const NEED_META = Object.freeze({
  money: { label: 'Save me money', short: 'money', sub: 'the obvious ask', token: '--soi-navy', fallback: '#0A1A5C' },
  time: { label: 'Save me time', short: 'time', sub: 'the premium ask', token: '--soi-blue', fallback: '#0B3DB4' },
  stress: { label: 'Save me stress', short: 'stress', sub: 'the premium ask', token: '--soi-orange', fallback: '#FD8D20' },
});

// Home directions on a wide triangle: money top, time lower-left, stress lower-right.
const NEED_LAYOUT = [
  { id: 'money', ang: -90 },
  { id: 'time', ang: 150 },
  { id: 'stress', ang: 30 },
];

// Geometry as fractions of the stage's shorter side (responsive).
const VENN = Object.freeze({
  diamFrac: 0.40,    // circle diameter
  spreadFrac: 0.42,  // home distance of each centre from stage centre — held
                     // WIDE so the drag-to-overlap journey is a real, felt move
                     // (they start clearly apart, not pre-resolved)
  lockFrac: 0.082,   // resolved (overlapping) distance from centre
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
         aria-label="Drag save me money, save me time and save me stress together until they overlap on empowerment">
      <div class="emp-tv-field" data-emp-tv-field>
        <div class="emp-tv-overlap" aria-hidden="true"></div>
        <div class="emp-tv-centre" aria-hidden="true">
          <span class="emp-tv-centre-lbl">They want</span>
          <span class="emp-tv-centre-word">empowerment</span>
          <span class="emp-tv-centre-sub">tools, not hand-holding</span>
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

  // Live geometry in px, computed ONCE per render from the field box.
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

  // The three need circles — absolutely positioned HTML; tactile transforms
  // them in real px on top of their CSS home left/top.
  const needs = NEED_LAYOUT.map(({ id, ang }) => {
    const el = document.createElement('div');
    el.className = 'emp-tv-need';
    el.dataset.need = id;
    el.style.setProperty('--accent', accent(id));
    el.innerHTML = `<span class="emp-tv-need-lbl">${NEED_META[id].short}</span>`;
    field.appendChild(el);
    return { id, el, dir: dirXY(ang), homeX: 0, homeY: 0 };
  });

  // Legend rows — backgroundless, focusable; also the keyboard path.
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
      `<span class="emp-tv-leg-name">${NEED_META[id].label}</span>` +
      `<span class="emp-tv-leg-n num" ${numAttrs}>0</span>` +
      `<span class="emp-tv-leg-sub">${NEED_META[id].sub}</span>`;
    legend.appendChild(row);
    return { id, row };
  });

  const offsets = new Map(needs.map((n) => [n.id, { dx: 0, dy: 0 }]));
  const drags = new Map();
  let converged = false;

  // Place each circle's HOME (the wide triangle) and size it; tracks resize.
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

  // Resolved target offset (relative to home) so a circle sits on the tight
  // triangle around the centre — a shared core, not a single stack.
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

    const od = t * g.diam * 0.9;
    overlap.style.width = `${od}px`;
    overlap.style.height = `${od}px`;
    overlap.style.opacity = (0.08 + t * 0.5).toFixed(3);
    centre.style.setProperty('--tv', t.toFixed(3));
    // Glow blooms only in the back half of the journey so it reads as a reward,
    // not an ambient haze — eased from 0 at t=0.45 to full at t=1.
    field.style.setProperty('--tvg', Math.max(0, (t - 0.45) / 0.55).toFixed(3));
    stage.classList.toggle('is-converging', t > 0.15);

    const allMet = dists.every((d) => d <= g.met);
    if (allMet && !converged) {
      converged = true;
      stage.classList.add('is-converged');
      centre.classList.add('is-on');
      // One-shot reward pulse on the resolved core (CSS animates the halo; the
      // class is re-armed by a reflow so a resize re-settle can replay it).
      stage.classList.remove('is-pulse');
      void stage.offsetWidth;
      stage.classList.add('is-pulse');
      if (hint) hint.textContent = 'They all resolve to one thing: empowerment.';
      onConverged();
      lockToCentre();
    }
  };

  // Settle all three onto the resolved triangle and hold there.
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

  // Reduced motion: snap every circle onto the resolved triangle immediately
  // (no drag required) so the overlap reads at rest.
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
      // Keep each circle centre inside the field.
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
  const pivotMount = rootEl.querySelector('[data-emp-pivot-mount]');
  const pivotSection = rootEl.querySelector('[data-emp-pivot]');
  const vennMount = rootEl.querySelector('[data-emp-venn]');
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
  const journey = data?.journey ?? null;

  // BEAT 2 first (pure data injection, no DOM build).
  fillPremium(rootEl, brandAsks);

  // BEAT 1 — pivot wipe (ungated).
  const pivot = pivotMount ? buildPivot(pivotMount) : null;

  // BEAT 3 — marquee venn (advisory gate via journey.ready()).
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
    // Fail soft: if the venn could not build (no data), never trap the visitor.
    if (!brandAsks) unlock();
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Re-assemble headlines on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  // Experiential motion.
  const cleanups = [];
  cleanups.push(chapterTransition(root));
  cleanups.push(observeParallax(root, { maxShiftPx: 44 }));

  // Prime the pivot wipe as the section scrolls in — until the visitor touches
  // it, scroll progress nudges the slider from survival toward agency.
  if (pivot && pivotSection && !prefersReducedMotion()) {
    let touched = false;
    const markTouched = () => { touched = true; };
    pivot.slider.addEventListener('pointerdown', markTouched);
    pivot.slider.addEventListener('keydown', markTouched);
    cleanups.push(
      scrollScene(pivotSection, [], {
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

  // Teardown handle (no teardown event is dispatched by the shell, but expose
  // it for safety; steps stay mounted so this is rarely needed).
  rootEl._empCleanup = () => {
    cleanups.forEach((fn) => fn && fn());
    if (venn) venn.destroy();
  };
}
