/**
 * Chapter 06: empowerment. Design World V2 (V4 pro pass).
 *
 * Three moments on one continuous warm-gradient world ground:
 *   1. A survival-mode -> active-agency reframe. A range input wipes the
 *      "active agency" deck world (bear-figure-orbit.jpg) over the
 *      "survival mode" world (bear-figure-coil.jpg). BOTH layers are clipped
 *      at the divide (before from the right, after from the left) so exactly
 *      ONE copy plate is ever visible — the old/new copy never stack. A clean
 *      SQUARED divider line marks the seam (no parallelogram). The warm
 *      imagery sits on a deep navy bed for real contrast (no cream-on-cream).
 *      Keyboard operable via the native range input.
 *   2. A brand-ask lollipop (charts.lollipopChart) — what Britain wants brands
 *      to help with (Q14), on a navy band. Adds depth + cool/warm contrast.
 *   3. The shared vennDiagram (js/lib/venn.js): three circles save me money /
 *      time / stress, centre word "empowerment". Backgroundless — the circles
 *      float on the warm world; a single navy centre plate (no double-layer).
 *      Each circle gets a DISTINCT flat fill (amber / royal-blue / orange).
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 * No fabricated numbers (all from data). No console.log. Reduced-motion safe.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import vennDiagram from '../lib/venn.js';
import { lollipopChart } from '../lib/charts.js';

const ASSET_BASE = 'assets/deck/';

const REFRAME = Object.freeze({
  before: {
    tag: 'Survival mode',
    lead: 'The old model',
    body: 'The consumer as a passive, bruised victim. Retracting, freezing, waiting to be saved.',
    art: 'bear-figure-coil.jpg'
  },
  after: {
    tag: 'Active agency',
    lead: 'The true data',
    body: 'Resourceful, fiercely independent, stepping up to fix the systems themselves.',
    art: 'bear-figure-orbit.jpg'
  }
});

const START_PCT = 38;
const SNAP_THRESHOLD = 50;

const reframeLayer = (state, side) => `
  <div class="emp-rf-layer emp-rf-layer-${side}">
    <img class="emp-rf-art" src="${ASSET_BASE}${state.art}" alt="" aria-hidden="true" draggable="false" />
    <div class="emp-rf-scrim"></div>
    <div class="emp-rf-copy">
      <span class="emp-rf-tag emp-rf-tag-${side}">${state.tag}</span>
      <span class="emp-rf-lead">${state.lead}</span>
      <p class="emp-rf-body">${state.body}</p>
    </div>
  </div>`;

const buildReframe = (mount) => {
  mount.innerHTML = `
    <div class="emp-rf-stage" data-side="before">
      ${reframeLayer(REFRAME.before, 'before')}
      ${reframeLayer(REFRAME.after, 'after')}
      <span class="emp-rf-divider" aria-hidden="true"></span>
    </div>
    <label class="emp-rf-control">
      <span class="emp-rf-control-text">Drag the data toward agency</span>
      <input type="range" class="emp-rf-slider" min="0" max="100" value="${START_PCT}"
             aria-label="Reveal the active-agency reading of the data" />
    </label>`;

  const stage = mount.querySelector('.emp-rf-stage');
  const beforeLayer = mount.querySelector('.emp-rf-layer-before');
  const afterLayer = mount.querySelector('.emp-rf-layer-after');
  const divider = mount.querySelector('.emp-rf-divider');
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    // pct 0 = all survival mode; 100 = all active agency.
    // Clip BOTH layers at the seam so only ONE copy plate ever shows:
    //   before keeps its LEFT (1-pct), after keeps its RIGHT (pct).
    // This is the fix for the stacked old/new copy.
    beforeLayer.style.clipPath = `inset(0 ${pct}% 0 0)`;
    afterLayer.style.clipPath = `inset(0 0 0 ${100 - pct}%)`;
    divider.style.left = `${100 - pct}%`;
    stage.dataset.side = pct >= SNAP_THRESHOLD ? 'after' : 'before';
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
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
  { id: 'time', key: 'Save me time', label: 'Save me time' }
];

const buildAsks = (mount, brandAsks) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-asks-empty">Brand-ask data is not available.</p>';
    return;
  }
  const items = ASK_ROWS
    .map((r) => ({ id: r.id, label: r.label, pct: brandAsks[r.key] }))
    .filter((r) => typeof r.pct === 'number');

  if (!items.length) {
    mount.innerHTML = '<p class="emp-asks-empty">Brand-ask data is not available.</p>';
    return;
  }

  lollipopChart(mount, {
    items,
    max: 50,
    accent: 'cream',
    onNavy: true,
    highlightId: 'money',
    ariaLabel: 'What Britain asks of brands, percent selecting each, Q14'
  });
};

const buildVenn = (mount, brandAsks) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-venn-empty">Brand-ask data is not available.</p>';
    return;
  }
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) + '%' : '');

  // Distinct flat fills resolved from brand tokens — amber / royal-blue /
  // orange. Three clearly different hues so overlaps stay readable and none
  // muddies into the ink centre plate.
  const accents = {
    money: cssVar('--soi-amber', '#FBC100'),
    time: cssVar('--soi-blue', '#0B3DB4'),
    stress: cssVar('--soi-orange', '#FD8D20')
  };

  vennDiagram(mount, {
    ariaLabel: 'Save me money, save me time and save me stress overlap at empowerment',
    centre: { label: 'They want', value: 'empowerment', sub: 'tools, not hand-holding' },
    sets: [
      {
        id: 'money', label: 'Save me money',
        value: fmt(brandAsks['Stretch my money further']),
        sub: 'the obvious ask', accent: accents.money
      },
      {
        id: 'time', label: 'Save me time',
        value: fmt(brandAsks['Save me time']),
        sub: 'the premium ask', accent: accents.time
      },
      {
        id: 'stress', label: 'Save me stress',
        value: fmt(brandAsks['Reduce stress']),
        sub: 'the premium ask', accent: accents.stress
      }
    ]
  });
};

export default function init(rootEl, data) {
  const reframeMount = rootEl.querySelector('[data-emp-reframe]');
  const asksMount = rootEl.querySelector('[data-emp-asks]');
  const vennMount = rootEl.querySelector('[data-emp-venn]');
  const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;

  if (reframeMount) buildReframe(reframeMount);
  if (asksMount) buildAsks(asksMount, brandAsks);
  if (vennMount) buildVenn(vennMount, brandAsks);

  observeReveals(rootEl);
}
