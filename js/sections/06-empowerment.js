/**
 * Chapter 06: empowerment. Design World V2.
 *
 * Two moments, on one continuous warm-gradient world ground:
 *   1. A survival-mode -> active-agency reframe. A range input wipes the
 *      "active agency" deck world (bear-figure-orbit.jpg — the figure opening
 *      up, orbit circles) over the "survival mode" world (bear-figure-coil.jpg —
 *      the tight coils). The wipe is a clean clip-path with NO stray divider bar
 *      drawn inside the stage. Both worlds are the deck's bear-vs-figure
 *      silhouettes on the warm ground, so the imagery itself IS the design world.
 *      Copy plates sit ABOVE the imagery with a guaranteed-legible scrim, never
 *      occluded by the art (art is pointer-events:none, behind via z-index).
 *      Keyboard operable via the native range input (short plain label "Drag").
 *   2. The shared vennDiagram (js/lib/venn.js): three circles save me money /
 *      time / stress, centre word "empowerment", values from segments.json
 *      meta.metricsTotals.brandAsks (38.8 / 24.0 / 27.7). Each circle gets a
 *      DISTINCT flat fill (amber / royal-blue / orange) so no two overlap into
 *      mud and none collides with the ink centre plate.
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 * No fabricated numbers (all from data). No console.log. Reduced-motion safe
 * (the wipe is a static clip; venn lib honours reduced motion itself).
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import vennDiagram from '../lib/venn.js';

const ASSET_BASE = 'assets/deck/';

const REFRAME = Object.freeze({
  before: {
    tag: 'Survival mode',
    lead: 'The old model',
    body: 'The consumer as a passive, bruised victim. Retracting, freezing, waiting to be saved.',
    art: 'bear-figure-coil.jpg',
    alt: ''
  },
  after: {
    tag: 'Active agency',
    lead: 'The true data',
    body: 'Resourceful, fiercely independent, stepping up to fix the systems themselves.',
    art: 'bear-figure-orbit.jpg',
    alt: ''
  }
});

const START_PCT = 35;
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
    </div>
    <label class="emp-rf-control">
      <span class="emp-rf-control-text">Drag the data toward agency</span>
      <input type="range" class="emp-rf-slider" min="0" max="100" value="${START_PCT}"
             aria-label="Reveal the active-agency reading of the data" />
    </label>`;

  const stage = mount.querySelector('.emp-rf-stage');
  const afterLayer = mount.querySelector('.emp-rf-layer-after');
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    // pct 0 = all survival mode; 100 = all active agency. The after layer is
    // clipped from its left edge. No handle/divider element is drawn inside
    // the stage, so the wipe stays clean per client feedback.
    afterLayer.style.clipPath = `inset(0 0 0 ${100 - pct}%)`;
    stage.dataset.side = pct >= SNAP_THRESHOLD ? 'after' : 'before';
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
};

// Resolve a CSS custom property to its concrete value so it can be used as an
// SVG `fill` presentation attribute (SVG fills do not accept `var()`).
const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const buildVenn = (mount, brandAsks) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-venn-empty">Brand-ask data is not available.</p>';
    return;
  }
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) + '%' : '');

  // Distinct flat fills resolved from the brand tokens — amber / royal-blue /
  // orange. Three clearly different hues so overlaps stay readable and none
  // muddies into the ink centre plate (no two same/similar colours overlapping).
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
  const vennMount = rootEl.querySelector('[data-emp-venn]');

  if (reframeMount) buildReframe(reframeMount);

  if (vennMount) {
    const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
    buildVenn(vennMount, brandAsks);
  }

  observeReveals(rootEl);
}
