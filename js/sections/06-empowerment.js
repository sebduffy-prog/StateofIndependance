/**
 * Chapter 06 — empowerment.
 *
 * Builds two interactive moments:
 *   1. A survival-mode -> active-agency before/after with a draggable
 *      (range-input) divider that wipes between the two states. Keyboard
 *      operable via the native range input.
 *   2. Three overlapping sheared pillars (save me money / time / stress)
 *      forming a venn-like arrangement; the centre reveals "empowerment".
 *      Each pillar is a real <button> — hover, focus or click reveals its
 *      supporting line plus (where present in the data) its Q14 stat chip.
 *
 * Contract: docs/CONTRACT.md. Every selector is scoped #06-empowerment.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="06-empowerment">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';

const REFRAME = Object.freeze({
  before: {
    tag: 'Survival mode',
    label: 'The old model',
    body: 'The old model viewed the consumer as a passive, bruised victim — retracting, freezing, and waiting to be saved.'
  },
  after: {
    tag: 'Active agency',
    label: 'The true data',
    body: 'The British consumer has pivoted to an Active Agency Model. They are highly resourceful, fiercely independent, and stepping up to fix systems themselves.'
  }
});

// Pillars. `askKey` maps to data.segments.meta.metricsTotals.brandAsks; the
// stat chip is only rendered when that key exists (no fabricated numbers).
const PILLARS = Object.freeze([
  {
    id: 'money',
    word: 'money',
    line: 'The obvious ask. Stretching money further is the loudest, most expected request — table stakes, not the strategy.',
    askKey: 'Stretch my money further'
  },
  {
    id: 'time',
    word: 'time',
    line: 'The hidden premium. Giving people their hours back reads as a luxury — and brands consistently under-price it.',
    askKey: 'Save me time'
  },
  {
    id: 'stress',
    word: 'stress',
    line: 'The deeper premium. Reducing the mental load carries far more value than the money ask, and almost no one is buying it.',
    askKey: 'Reduce stress'
  }
]);

const reframePanel = (state, side) => `
  <div class="emp-rf-panel emp-rf-${side}">
    <span class="emp-rf-tag">${state.tag}</span>
    <span class="emp-rf-lead">${state.label}</span>
    <p class="emp-rf-body">${state.body}</p>
  </div>`;

const buildReframe = (mount) => {
  mount.innerHTML = `
    <div class="emp-rf-stage">
      <div class="emp-rf-layer emp-rf-layer-before">${reframePanel(REFRAME.before, 'before')}</div>
      <div class="emp-rf-layer emp-rf-layer-after">${reframePanel(REFRAME.after, 'after')}</div>
      <div class="emp-rf-handle" aria-hidden="true"></div>
    </div>
    <label class="emp-rf-control">
      <span class="emp-rf-control-text">Drag to wipe from survival mode to active agency</span>
      <input type="range" class="emp-rf-slider" min="0" max="100" value="50"
             aria-label="Reveal balance between the old survival-mode model and the active-agency model" />
    </label>`;

  const stage = mount.querySelector('.emp-rf-stage');
  const afterLayer = mount.querySelector('.emp-rf-layer-after');
  const handle = mount.querySelector('.emp-rf-handle');
  const slider = mount.querySelector('.emp-rf-slider');

  const apply = (pct) => {
    // pct 0 = all survival mode; 100 = all active agency.
    afterLayer.style.clipPath = `inset(0 0 0 ${100 - pct}%)`;
    handle.style.left = `${pct}%`;
    stage.dataset.side = pct >= 50 ? 'after' : 'before';
  };

  slider.addEventListener('input', () => apply(Number(slider.value)));
  apply(Number(slider.value));
};

const statChip = (pillar, brandAsks) => {
  if (!brandAsks) return '';
  const value = brandAsks[pillar.askKey];
  if (typeof value !== 'number') return '';
  const label = pillar.askKey.toLowerCase();
  return `<span class="emp-chip"><span class="emp-chip-val num">${value}%</span><span class="emp-chip-label">${label}</span></span>`;
};

const buildPillars = (mount, detailEl, brandAsks) => {
  mount.innerHTML = `
    <div class="emp-venn" role="group" aria-label="Three overlapping needs that meet at empowerment">
      ${PILLARS.map((p) => `
        <button type="button" class="emp-pillar emp-pillar-${p.id}" data-pillar="${p.id}"
                aria-pressed="false">
          <span class="emp-pillar-kicker">save me</span>
          <span class="emp-pillar-word">${p.word}</span>
        </button>`).join('')}
      <span class="emp-venn-core" aria-hidden="true">empowerment</span>
    </div>`;

  const buttons = Array.from(mount.querySelectorAll('.emp-pillar'));

  const renderDetail = (pillar) => {
    detailEl.innerHTML = `
      <div class="emp-detail-inner emp-detail-${pillar.id}">
        <span class="emp-detail-label">save me <strong>${pillar.word}</strong></span>
        <p class="emp-detail-line">${pillar.line}</p>
        ${statChip(pillar, brandAsks)}
      </div>`;
  };

  const setActive = (pillar) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pillar === pillar.id)));
    mount.querySelector('.emp-venn').dataset.active = pillar.id;
    renderDetail(pillar);
  };

  const findPillar = (id) => PILLARS.find((p) => p.id === id);

  buttons.forEach((btn) => {
    const pillar = findPillar(btn.dataset.pillar);
    btn.addEventListener('click', () => setActive(pillar));
    btn.addEventListener('mouseenter', () => setActive(pillar));
    btn.addEventListener('focus', () => setActive(pillar));
  });

  // Prime with the money pillar (the obvious ask) so the panel is never empty.
  setActive(PILLARS[0]);
};

export default function init(rootEl, data) {
  const reframeMount = rootEl.querySelector('[data-emp-reframe]');
  const pillarsMount = rootEl.querySelector('[data-emp-pillars]');
  const detailEl = rootEl.querySelector('[data-emp-detail]');

  if (reframeMount) buildReframe(reframeMount);

  if (pillarsMount && detailEl) {
    const brandAsks = data?.segments?.meta?.metricsTotals?.brandAsks ?? null;
    buildPillars(pillarsMount, detailEl, brandAsks);
  }

  observeReveals(rootEl);
}
