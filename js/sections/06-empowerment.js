/**
 * Chapter 06: empowerment.
 *
 * Two moments:
 *   1. A survival-mode -> active-agency reframe. A short range input wipes the
 *      "active agency" world over the "survival mode" world. The wipe edge is a
 *      clean clip with NO stray divider bar inside the box. Keyboard operable via
 *      the native range input (short plain label "Drag"). The reframe carries a
 *      clear display heading (from the HTML fragment) and the deck's bear-vs-figure
 *      world feel (cream silhouettes on a flat mustard / navy ground).
 *   2. The ported vennDiagram (js/lib/venn.js): three circles save me money / time
 *      / stress, centre word "empowerment", values from segments.json
 *      meta.metricsTotals.brandAsks (38.8 / 24.0 / 27.7) shown on hover/focus.
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import vennDiagram from '../lib/venn.js';

const REFRAME = Object.freeze({
  before: {
    tag: 'Survival mode',
    lead: 'The old model',
    body: 'The consumer as a passive, bruised victim. Retracting, freezing, waiting to be saved.'
  },
  after: {
    tag: 'Active agency',
    lead: 'The true data',
    body: 'Resourceful, fiercely independent, stepping up to fix the systems themselves.'
  }
});

// Flat cream silhouettes (the deck "bear vs figure" world). Inline SVG so they
// stay sharp, recolour from one fill, and add no asset request.
const bearMark = (cls) => `
  <svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
    <path d="M22 30a11 11 0 0 1 17-9 30 30 0 0 1 22 0 11 11 0 0 1 17 9c0 4-2 7-5 9 4 6 6 13 6 21 0 17-13 28-39 28S11 77 11 60c0-8 2-15 6-21-3-2-5-5-5-9zm22 28a6 6 0 1 0 0-1zm24 0a6 6 0 1 0 0-1zM50 70c-6 0-10 3-10 7h20c0-4-4-7-10-7z"/>
  </svg>`;

const figureMark = (cls) => `
  <svg class="${cls}" viewBox="0 0 60 100" aria-hidden="true" focusable="false">
    <circle cx="30" cy="16" r="11"/>
    <path d="M30 29c-9 0-16 6-16 15v22h7l2 26h14l2-26h7V44c0-9-7-15-16-15z"/>
  </svg>`;

const reframePanel = (state, side, art) => `
  <div class="emp-rf-panel emp-rf-${side}">
    <div class="emp-rf-copy">
      <span class="emp-rf-tag">${state.tag}</span>
      <span class="emp-rf-lead">${state.lead}</span>
      <p class="emp-rf-body">${state.body}</p>
    </div>
    <div class="emp-rf-art">${art}</div>
  </div>`;

const buildReframe = (mount) => {
  mount.innerHTML = `
    <div class="emp-rf-stage">
      <div class="emp-rf-layer emp-rf-layer-before">
        ${reframePanel(REFRAME.before, 'before', bearMark('emp-rf-bear'))}
      </div>
      <div class="emp-rf-layer emp-rf-layer-after">
        ${reframePanel(REFRAME.after, 'after', figureMark('emp-rf-figure'))}
      </div>
    </div>
    <label class="emp-rf-control">
      <span class="emp-rf-control-text">Drag</span>
      <input type="range" class="emp-rf-slider" min="0" max="100" value="35"
             aria-label="Reveal the active-agency reading of the data" />
    </label>`;

  const stage = mount.querySelector('.emp-rf-stage');
  const afterLayer = mount.querySelector('.emp-rf-layer-after');
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    // pct 0 = all survival mode; 100 = all active agency. The after layer is
    // clipped from its left edge. No handle/divider element is drawn inside
    // the box, so it stays clean per client feedback.
    afterLayer.style.clipPath = `inset(0 0 0 ${100 - pct}%)`;
    stage.dataset.side = pct >= 50 ? 'after' : 'before';
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
};

const buildVenn = (mount, brandAsks) => {
  if (!brandAsks) {
    mount.innerHTML = '<p class="emp-venn-empty">Brand-ask data is not available.</p>';
    return;
  }
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(1) + '%' : '');

  vennDiagram(mount, {
    ariaLabel: 'Save me money, save me time and save me stress overlap at empowerment',
    centre: { label: 'They want', value: 'empowerment', sub: 'tools, not hand-holding' },
    sets: [
      {
        id: 'money', label: 'Save me money',
        value: fmt(brandAsks['Stretch my money further']),
        sub: 'the obvious ask', accent: 'mustard'
      },
      {
        id: 'time', label: 'Save me time',
        value: fmt(brandAsks['Save me time']),
        sub: 'the premium ask', accent: 'teal'
      },
      {
        id: 'stress', label: 'Save me stress',
        value: fmt(brandAsks['Reduce stress']),
        sub: 'the premium ask', accent: 'ink'
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
