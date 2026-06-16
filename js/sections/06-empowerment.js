/**
 * Chapter 06: empowerment. Design World V5 (TOP-TIER experiential pass).
 *
 * One continuous warm bear-figure world. NO blocks behind any text — every
 * navy band, scrim plate, cream pill, legend card and centre plate from the
 * prior pass is gone; copy now sits on the ground with colour + weight
 * emphasis only. Charts / venn / orbit ring float backgroundless.
 *
 * Three moments, all deck-lifted:
 *   1. The survival-mode -> active-agency REFRAME, told on the deck's
 *      bear-world panels (coil = survival, sphere = active agency). A range
 *      input cross-fades the two world panels; the COPY lives on the ground
 *      beside them (no scrim plate). scrollScene primes the wipe as the
 *      section enters so the turn feels alive. Keyboard operable via the range.
 *   2. A brand-ask read (Q14) with TWO interactive views the user toggles:
 *      a ranked lollipop and an orbit-ring (the deck's orbit motif). Both
 *      float on the warm ground — no navy band.
 *   3. The shared vennDiagram: three circles save me money / time / stress,
 *      centre word "empowerment". Backgroundless; the deck's overlapping-
 *      circles bear-world sits behind as the section motif.
 *
 * Experiential motion (js/lib/experiential.js): chapterTransition supplies the
 * --enter entrance progress; observeParallax drifts the world panels + orbit
 * rings; scrollScene primes the reframe wipe. All reduced-motion safe.
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 * No fabricated numbers (all from data). No console.log.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import vennDiagram from '../lib/venn.js';
import { lollipopChart, orbitRingChart } from '../lib/charts.js';
import {
  chapterTransition,
  observeParallax,
  scrollScene,
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
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    // pct 0 = all survival mode; 100 = all active agency. Cross-fade the two
    // world panels; the active-agency emphasis on the copy follows the same
    // value (colour/weight only — no block).
    const f = pct / 100;
    artAfter.style.opacity = String(f);
    artBefore.style.opacity = String(1 - f);
    const side = pct >= SNAP_THRESHOLD ? 'after' : 'before';
    stage.dataset.side = side;
    readout.dataset.side = side;
    mount.style.setProperty('--rf', f.toFixed(3));
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

  // View toggle — bars (ranked lollipop) vs orbit (deck orbit motif).
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

const buildVenn = (mount, brandAsks) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-venn-empty">Brand-ask data is not available.</p>';
    return;
  }
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) + '%' : '');

  // Distinct flat fills resolved from brand tokens — amber / royal-blue /
  // orange. Three clearly different hues so overlaps stay readable.
  const accents = {
    money: cssVar('--soi-amber', '#FBC100'),
    time: cssVar('--soi-blue', '#0B3DB4'),
    stress: cssVar('--soi-orange', '#FD8D20'),
  };

  vennDiagram(mount, {
    ariaLabel: 'Save me money, save me time and save me stress overlap at empowerment',
    centre: { label: 'They want', value: 'empowerment', sub: 'tools, not hand-holding' },
    sets: [
      {
        id: 'money', label: 'Save me money',
        value: fmt(brandAsks['Stretch my money further']),
        sub: 'the obvious ask', accent: accents.money,
      },
      {
        id: 'time', label: 'Save me time',
        value: fmt(brandAsks['Save me time']),
        sub: 'the premium ask', accent: accents.time,
      },
      {
        id: 'stress', label: 'Save me stress',
        value: fmt(brandAsks['Reduce stress']),
        sub: 'the premium ask', accent: accents.stress,
      },
    ],
  });
};

export default function init(rootEl, data) {
  const shell = rootEl.querySelector('[data-emp-root]');
  const reframeMount = rootEl.querySelector('[data-emp-reframe]');
  const reframeSection = rootEl.querySelector('[data-emp-reframe-section]');
  const asksMount = rootEl.querySelector('[data-emp-asks]');
  const vennMount = rootEl.querySelector('[data-emp-venn]');
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;

  let reframe = null;
  if (reframeMount) reframe = buildReframe(reframeMount);
  if (asksMount) buildAsks(asksMount, brandAsks, rootEl);
  if (vennMount) buildVenn(vennMount, brandAsks);

  observeReveals(rootEl);

  // ── Experiential motion (cleaned up on chapter teardown if the loader
  //    ever re-inits; helpers no-op under reduced motion). ──
  const cleanups = [];
  if (shell) cleanups.push(chapterTransition(shell));
  if (shell) cleanups.push(observeParallax(shell, { maxShiftPx: 48 }));

  // Prime the reframe wipe as the section scrolls in: nudge the data from
  // survival toward agency so the turn reads as motion (only when the user
  // hasn't already grabbed the slider, and never under reduced motion).
  if (reframe && reframeSection && !prefersReducedMotion()) {
    let touched = false;
    reframe.slider.addEventListener('pointerdown', () => { touched = true; });
    reframe.slider.addEventListener('keydown', () => { touched = true; });
    cleanups.push(
      scrollScene(reframeSection, [], {
        onProgress: (p) => {
          if (touched) return;
          // Map the section's mid-travel (0.25 -> 0.7) to the wipe 30 -> 78%.
          const t = Math.max(0, Math.min(1, (p - 0.25) / 0.45));
          const pct = START_PCT + t * (78 - START_PCT);
          reframe.slider.value = String(Math.round(pct));
          reframe.apply(pct);
        },
      })
    );
  }

  rootEl._empCleanup = () => cleanups.forEach((fn) => fn && fn());
}
