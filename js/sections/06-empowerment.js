/**
 * Chapter 06: empowerment. EXPERIENTIAL-2 pass — the tactile three-needs venn.
 *
 * One continuous warm bear-figure world. NO blocks behind any text — copy sits
 * on the ground with colour + weight emphasis only. Charts / venn / orbit ring
 * float backgroundless. Three beats, all deck-lifted:
 *
 *   1. The survival-mode -> active-agency REFRAME (the cinematic pivot wipe).
 *      Two cross-fading deck bear-world panels (coil = survival, sphere = active
 *      agency); a range input drives the wipe and scrollScene primes it as the
 *      section enters so the turn arrives rather than cuts. Keyboard operable.
 *      This is a NARRATIVE beat — it no longer gates.
 *
 *   2. A brand-ask read (Q14) with TWO interactive views the user toggles:
 *      a ranked lollipop and an orbit-ring (the deck's orbit motif).
 *
 *   3. THE MARQUEE INTERACTION — "Three needs, one overlap." Money / time /
 *      stress begin as three flat circles held APART on the warm ground. The
 *      visitor DRAGS them together (real physics, contact shadow, settle from
 *      tactile.js); as they converge the shared overlap region GROWS and the
 *      word "empowerment" assembles in the centre. When all three meet, the
 *      turn completes — this is the step's gate: journey.ready() fires the
 *      first time the three needs fully overlap. Fully keyboard operable
 *      (arrow-nudge each circle) and reduced-motion safe (circles start met).
 *
 * Experiential motion (js/lib/experiential.js): chapterTransition supplies the
 * --enter entrance progress; observeParallax drifts the world panels + orbit
 * rings; arrival() assembles the headings; scrollScene primes the reframe wipe.
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 * No fabricated numbers (all from data). No console.log.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object, journey: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { lollipopChart, orbitRingChart } from '../lib/charts.js';
import { draggable } from '../lib/tactile.js';
import {
  chapterTransition,
  observeParallax,
  scrollScene,
  arrival,
  prefersReducedMotion,
} from '../lib/experiential.js';

const ASSET_BASE = 'assets/deck/';

const REFRAME = Object.freeze({
  before: {
    tag: 'Survival mode',
    lead: 'The old model',
    body: 'The consumer as a passive, bruised victim. Retracting, freezing, waiting to be saved.',
    art: 'bear-world-coil.png',
  },
  after: {
    tag: 'Active agency',
    lead: 'The true data',
    body: 'Resourceful, fiercely independent, stepping up to fix the systems themselves.',
    art: 'bear-world-sphere.png',
  },
});

const START_PCT = 30;
const SNAP_THRESHOLD = 50;

const buildReframe = (mount) => {
  // Two cross-fading world panels (deck bear-world). The copy sits on the
  // ground BELOW the imagery — no scrim plate, no pill, no block behind text.
  mount.innerHTML = `
    <div class="emp-rf-stage" data-side="before">
      <img class="emp-rf-art emp-rf-art-before" src="${ASSET_BASE}${REFRAME.before.art}"
           alt="" aria-hidden="true" draggable="false" />
      <img class="emp-rf-art emp-rf-art-after" src="${ASSET_BASE}${REFRAME.after.art}"
           alt="" aria-hidden="true" draggable="false" />
      <span class="emp-rf-state" aria-hidden="true"></span>
    </div>
    <div class="emp-rf-readout" data-side="before">
      <div class="emp-rf-side emp-rf-side-before">
        <span class="emp-rf-tag emp-rf-tag-before">${REFRAME.before.tag}</span>
        <span class="emp-rf-lead">${REFRAME.before.lead}</span>
        <p class="emp-rf-body">${REFRAME.before.body}</p>
      </div>
      <div class="emp-rf-side emp-rf-side-after">
        <span class="emp-rf-tag emp-rf-tag-after">${REFRAME.after.tag}</span>
        <span class="emp-rf-lead">${REFRAME.after.lead}</span>
        <p class="emp-rf-body">${REFRAME.after.body}</p>
      </div>
    </div>
    <label class="emp-rf-control">
      <span class="emp-rf-control-text">Drag the data toward agency</span>
      <input type="range" class="emp-rf-slider" min="0" max="100" value="${START_PCT}"
             aria-label="Reveal the active-agency reading of the data" />
    </label>`;

  const stage = mount.querySelector('.emp-rf-stage');
  const readout = mount.querySelector('.emp-rf-readout');
  const artBefore = mount.querySelector('.emp-rf-art-before');
  const artAfter = mount.querySelector('.emp-rf-art-after');
  const state = mount.querySelector('.emp-rf-state');
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    const f = pct / 100;
    artAfter.style.opacity = String(f);
    artBefore.style.opacity = String(1 - f);
    const side = pct >= SNAP_THRESHOLD ? 'after' : 'before';
    stage.dataset.side = side;
    readout.dataset.side = side;
    mount.style.setProperty('--rf', f.toFixed(3));
    if (state) state.textContent = side === 'after' ? REFRAME.after.tag : REFRAME.before.tag;
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
  return { slider, apply };
};

// Resolve a CSS custom property to a concrete value (SVG fills reject var()).
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

// What Britain asks of brands (Q14). Verified values from segments.json
// meta.metricsTotals.brandAsks — no fabricated numbers.
const ASK_ROWS = [
  { id: 'money', key: 'Stretch my money further', label: 'Stretch my money' },
  { id: 'loyalty', key: 'Reward my loyalty', label: 'Reward my loyalty' },
  { id: 'stress', key: 'Reduce stress', label: 'Reduce my stress' },
  { id: 'honest', key: 'Be transparent and honest', label: 'Be transparent' },
  { id: 'time', key: 'Save me time', label: 'Save me time' },
];

const askItems = (brandAsks) =>
  ASK_ROWS
    .map((r) => ({ id: r.id, label: r.label, pct: brandAsks[r.key] }))
    .filter((r) => typeof r.pct === 'number');

const buildAsks = (mount, brandAsks, rootEl) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-asks-empty">Brand-ask data is not available.</p>';
    return;
  }
  const items = askItems(brandAsks);
  if (!items.length) {
    mount.innerHTML = '<p class="emp-asks-empty">Brand-ask data is not available.</p>';
    return;
  }

  const renderBars = () => {
    mount.innerHTML = '';
    lollipopChart(mount, {
      items,
      max: 50,
      accent: 'navy',
      highlightId: 'money',
      ariaLabel: 'What Britain asks of brands, percent selecting each, Q14',
    });
  };

  const renderOrbit = () => {
    mount.innerHTML = '';
    orbitRingChart(mount, {
      items,
      max: 50,
      accent: 'navy',
      centreLabel: 'Q14',
      decimals: 0,
      ariaLabel: 'What Britain asks of brands, as an orbit ring, Q14',
    });
  };

  const views = { bars: renderBars, orbit: renderOrbit };
  renderBars();

  const buttons = Array.from(rootEl.querySelectorAll('[data-asks-view]'));
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.asksView;
      if (!views[view] || btn.classList.contains('is-on')) return;
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      views[view]();
    });
  });
};

/* ─────────────────── THE MARQUEE: tactile three-needs venn ───────────────── */

// The three needs, with their verified Q14 values. The colours are three
// clearly distinct flat brand hues so overlaps stay legible.
const NEED_KEYS = Object.freeze({
  money: 'Stretch my money further',
  time: 'Save me time',
  stress: 'Reduce stress',
});

// Geometry as FRACTIONS of the stage box (responsive). The three need circles
// are HTML elements dragged in real screen px by tactile.js; their HOME centres
// sit on a wide triangle (held apart) and converge to a tight triangle around
// the stage centre as the visitor drags them together.
const VENN = Object.freeze({
  diamFrac: 0.42, // circle diameter as a fraction of the stage's shorter side
  spreadFrac: 0.27, // home distance of each centre from the stage centre (frac of short side)
  lockFrac: 0.085, // resolved distance of each centre from the centre (the tight triangle)
  metFrac: 0.16, // centre-distance (frac) under which a circle counts as "met"
});

// Home directions on a triangle: money top, time lower-left, stress lower-right.
const NEED_LAYOUT = [
  { id: 'money', ang: -90 },
  { id: 'time', ang: 150 },
  { id: 'stress', ang: 30 },
];

const dirXY = (ang) => ({
  x: Math.cos((ang * Math.PI) / 180),
  y: Math.sin((ang * Math.PI) / 180),
});

/**
 * Build the tactile venn. Returns { onConverged } registration so the caller
 * can gate on the three needs fully overlapping.
 */
const buildVenn = (mount, brandAsks, onConverged) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-venn-empty">Brand-ask data is not available.</p>';
    return { destroy() {} };
  }

  const reduced = prefersReducedMotion();
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) + '%' : '');

  const accents = {
    money: cssVar('--soi-amber', '#FBC100'),
    time: cssVar('--soi-blue', '#0B3DB4'),
    stress: cssVar('--soi-orange', '#FD8D20'),
  };
  const META = {
    money: { label: 'Save me money', short: 'money', sub: 'the obvious ask' },
    time: { label: 'Save me time', short: 'time', sub: 'the premium ask' },
    stress: { label: 'Save me stress', short: 'stress', sub: 'the premium ask' },
  };

  // ── DOM scaffold. HTML circles (tactile drags them in real px); the overlap
  //    wash + centre word are HTML too, so everything stays in one px space. ──
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

  // Live geometry in px, recomputed from the field box (responsive). Returns
  // centre + radius + the home/lock distances, all in px.
  const geom = () => {
    const r = field.getBoundingClientRect();
    const short = Math.min(r.width, r.height);
    return {
      w: r.width, h: r.height,
      cx: r.width / 2, cy: r.height / 2,
      diam: short * VENN.diamFrac,
      spread: short * VENN.spreadFrac,
      lock: short * VENN.lockFrac,
      met: short * VENN.metFrac,
    };
  };

  // The three need circles — absolutely-positioned HTML, centred via a base
  // left/top then translated by tactile (real px). fill via flat brand colour
  // with a touch of transparency so overlaps read as colour mixes.
  const needs = NEED_LAYOUT.map(({ id, ang }) => {
    const el = document.createElement('div');
    el.className = 'emp-tv-need';
    el.dataset.need = id;
    el.style.setProperty('--accent', accents[id]);
    el.innerHTML = `<span class="emp-tv-need-lbl">${META[id].short}</span>`;
    field.appendChild(el);
    return { id, el, dir: dirXY(ang) };
  });

  // Place each circle's HOME (the wide triangle) and size it. Called on layout
  // + resize so positions track the responsive field. Home is the circle's
  // resting CSS position; tactile's transform is the live drag offset on top.
  const placeHome = () => {
    const g = geom();
    needs.forEach((n) => {
      n.el.style.width = `${g.diam}px`;
      n.el.style.height = `${g.diam}px`;
      const hx = g.cx + n.dir.x * g.spread;
      const hy = g.cy + n.dir.y * g.spread;
      n.el.style.left = `${hx - g.diam / 2}px`;
      n.el.style.top = `${hy - g.diam / 2}px`;
      n.homeX = hx;
      n.homeY = hy;
    });
  };
  placeHome();

  // Legend — backgroundless focusable rows; each is also the KEYBOARD path.
  const legRows = needs.map(({ id }) => {
    const row = document.createElement('div');
    row.className = 'emp-tv-leg';
    row.dataset.need = id;
    row.style.setProperty('--accent', accents[id]);
    row.innerHTML =
      `<span class="emp-tv-leg-name">${META[id].label}</span>` +
      `<span class="emp-tv-leg-n num">${fmt(brandAsks[NEED_KEYS[id]])}</span>` +
      `<span class="emp-tv-leg-sub">${META[id].sub}</span>`;
    legend.appendChild(row);
    return { id, row };
  });

  // ── Convergence model (all px) ──
  // Each circle's live offset {dx,dy} is its tactile drag transform (px). Its
  // centre = home + offset. Togetherness t in [0,1]: 1 = all on the centre.
  const offsets = new Map(needs.map((n) => [n.id, { dx: 0, dy: 0 }]));
  let converged = false;

  const centreDist = (n) => {
    const o = offsets.get(n.id);
    return Math.hypot(n.homeX + o.dx - geom().cx, n.homeY + o.dy - geom().cy);
  };

  const render = () => {
    const g = geom();
    // Guard: while the step is hidden the field has no size, so every distance
    // collapses to ~0 and would falsely read as "met". Skip until laid out.
    if (g.spread < 1) return;
    const dists = needs.map(centreDist);
    const meanDist = dists.reduce((a, b) => a + b, 0) / dists.length;
    const t = Math.max(0, Math.min(1, 1 - meanDist / g.spread));
    // Overlap wash grows with togetherness; flat navy, opacity rises with t so
    // the "empowerment" core resolves as the three needs meet.
    const od = t * g.diam * 0.86;
    overlap.style.width = `${od}px`;
    overlap.style.height = `${od}px`;
    overlap.style.opacity = (0.1 + t * 0.5).toFixed(3);
    centre.style.setProperty('--tv', t.toFixed(3));
    stage.classList.toggle('is-converging', t > 0.15);

    const allMet = dists.every((d) => d <= g.met);
    if (allMet && !converged) {
      converged = true;
      stage.classList.add('is-converged');
      centre.classList.add('is-on');
      if (hint) hint.textContent = 'They all resolve to one thing: empowerment.';
      onConverged();
      lockToCentre();
    } else if (!allMet && !converged && hint) {
      hint.textContent = 'Drag the three circles together';
    }
  };

  // Settle all three onto the resolved TIGHT triangle (a shared core, not a
  // single stack) and hold there so the overlap is stable. Drives each
  // controller via setPosition so pointer + keyboard share one source of truth.
  const drags = new Map();
  const lockToCentre = () => {
    const g = geom();
    needs.forEach((n) => {
      const ctrl = drags.get(n.id);
      if (!ctrl) return;
      const tx = g.cx + n.dir.x * g.lock - n.homeX;
      const ty = g.cy + n.dir.y * g.lock - n.homeY;
      ctrl.setPosition(tx, ty, { animate: true });
    });
  };

  needs.forEach((n) => {
    const o = offsets.get(n.id);
    const ctrl = draggable(n.el, {
      spring: 'settle',
      springOpts: { stiffness: 150, bounce: 0.16 },
      momentum: 0, // settle exactly where dropped — no drift past the centre
      keyboardStep: 22,
      // Keep the circle centre inside the field.
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

  // Legend rows = KEYBOARD path: focus a row, press Enter/Space/arrow to bring
  // that need into the resolved triangle. Three presses resolve the overlap.
  legRows.forEach(({ id, row }) => {
    row.tabIndex = 0;
    const n = needs.find((x) => x.id === id);
    const bringIn = () => {
      const g = geom();
      const tx = g.cx + n.dir.x * g.lock - n.homeX;
      const ty = g.cy + n.dir.y * g.lock - n.homeY;
      drags.get(id).setPosition(tx, ty, { animate: true });
    };
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar' ||
          e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
          e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        bringIn();
      }
    });
    row.addEventListener('mouseenter', () => { stage.dataset.focus = id; });
    row.addEventListener('mouseleave', () => { delete stage.dataset.focus; });
    row.addEventListener('focus', () => { stage.dataset.focus = id; });
    row.addEventListener('blur', () => { delete stage.dataset.focus; });
  });

  render();

  // Reduced motion: satisfy the gate without interaction by snapping every
  // circle onto the resolved triangle (done in onLayout once it has a real box).
  const snapResolved = () => {
    const g = geom();
    needs.forEach((n) => {
      const o = offsets.get(n.id);
      o.dx = g.cx + n.dir.x * g.lock - n.homeX;
      o.dy = g.cy + n.dir.y * g.lock - n.homeY;
      n.el.style.transform = `translate3d(${o.dx}px, ${o.dy}px, 0) scale(var(--tactile-scale, 1))`;
    });
  };

  // Re-place homes + re-render whenever the field gains/changes size. This also
  // covers the first real layout: the step mounts HIDDEN (field box = 0), so the
  // initial placeHome() is a no-op; the ResizeObserver fires once the step is
  // shown and lays the circles out for real. Under reduced motion it snaps the
  // resolved overlap; if already converged it re-settles the tight triangle.
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

// Inject verified Q14 values onto the premium count-up stats.
const PREMIUM_KEYS = Object.freeze({
  money: 'Stretch my money further',
  time: 'Save me time',
  stress: 'Reduce stress',
});
const fillPremium = (rootEl, brandAsks) => {
  if (!brandAsks) return;
  rootEl.querySelectorAll('[data-emp-stat]').forEach((el) => {
    const v = brandAsks[PREMIUM_KEYS[el.dataset.empStat]];
    if (typeof v === 'number') el.setAttribute('data-count-to', String(v));
  });
};

export default function init(rootEl, data) {
  const shell = rootEl.querySelector('[data-emp-root]');
  const reframeMount = rootEl.querySelector('[data-emp-reframe]');
  const reframeSection = rootEl.querySelector('[data-emp-reframe-section]');
  const asksMount = rootEl.querySelector('[data-emp-asks]');
  const vennMount = rootEl.querySelector('[data-emp-venn]');
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
  const journey = data?.journey ?? null;

  // Journey gating: the MARQUEE interaction is the gate. The three needs must
  // be dragged together into overlap (empowerment) before Next unlocks. If the
  // venn fails to build, fall back to ungated so the journey can't dead-end.
  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  const reframe = reframeMount ? buildReframe(reframeMount) : null;
  if (asksMount) buildAsks(asksMount, brandAsks, rootEl);
  fillPremium(rootEl, brandAsks);

  let venn = null;
  if (vennMount) {
    venn = buildVenn(vennMount, brandAsks, unlock);
    if (journey) journey.gate();
    // Defensive: if the venn couldn't build (no data), don't trap the visitor.
    if (!brandAsks && journey) unlock();
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Chapter arrival: assemble the headings each time this step becomes current.
  rootEl.addEventListener('chapter:arrive', () => arrival(rootEl));

  // ── Experiential motion ──
  const cleanups = [];
  if (shell) cleanups.push(chapterTransition(shell));
  if (shell) cleanups.push(observeParallax(shell, { maxShiftPx: 48 }));

  // Prime the reframe wipe as the section scrolls in (cinematic pivot, ungated).
  if (reframe && reframeSection && !prefersReducedMotion()) {
    let touched = false;
    reframe.slider.addEventListener('pointerdown', () => { touched = true; });
    reframe.slider.addEventListener('keydown', () => { touched = true; });
    cleanups.push(
      scrollScene(reframeSection, [], {
        onProgress: (p) => {
          if (touched) return;
          const t = Math.max(0, Math.min(1, (p - 0.25) / 0.45));
          const pct = START_PCT + t * (78 - START_PCT);
          reframe.slider.value = String(Math.round(pct));
          reframe.apply(pct);
        },
      }),
    );
  }

  // Teardown is idempotent (it may be reached via either entry point).
  let torndown = false;
  const teardown = () => {
    if (torndown) return;
    torndown = true;
    cleanups.forEach((fn) => fn && fn());
    if (venn) venn.destroy();
  };
  rootEl.addEventListener('chapter:teardown', teardown);
  rootEl._empCleanup = teardown;
}
