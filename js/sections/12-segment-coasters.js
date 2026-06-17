/**
 * 12-segment-coasters.js — The Coasters (27%) full-screen segment profile.
 *
 * The third of four segment book-cover profiles; same template as the
 * Architects. A cream editorial stage: an editorial rail (descriptor + hero
 * quote + a distinctive TGI statement) counter-weighted by a book-cover
 * profile card carrying who/money/cutting-back/AI and a togglable over-index
 * chart.
 *
 * Marquee interaction: a square pillGroup toggle flips the backgroundless
 * over-index bars between two facets of the type — what they cut back first,
 * and the quiet ways they take control themselves. gate()/ready() advise the
 * hint only; Next is never trapped.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 2-segment-coasters.
 *
 * @param {HTMLElement} rootEl  the <section id="12-segment-coasters">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'coasters';
const INDEX_MAX = 200; // 100 (the national average) sits mid-track.

// The facets the toggle switches between. Labels + ids come straight from the
// segment's metric families; values are the per-label `index` (vs national 100).
const FACETS = [
  {
    value: 'cut',
    label: 'First to cut',
    metric: 'firstToCut',
    title: 'What they trim back first',
    rows: ['Clothing', 'Subscriptions', 'Holidays', 'Eating out', 'Energy'],
  },
  {
    value: 'control',
    label: 'Quiet control',
    metric: 'personalControlBehaviours',
    title: 'The quiet ways they take control',
    rows: ['Managed energy proactively', 'Budgeting/comparison tools', 'YouTube/online guides', 'Self-diagnosed health', 'Vitamins/preventative'],
  },
];

// Tidy the longer metric labels so the chart rail stays legible.
const SHORT_LABELS = {
  'Managed energy proactively': 'Managed energy',
  'Budgeting/comparison tools': 'Budgeting tools',
  'YouTube/online guides': 'YouTube guides',
  'Self-diagnosed health': 'Self-diagnose',
  'Vitamins/preventative': 'Vitamins',
};

/** Build chart items [{id,label,pct}] from a facet, reading the index value. */
function itemsFor(metrics, facet) {
  const family = metrics[facet.metric] || {};
  return facet.rows
    .map((label) => {
      const entry = family[label];
      if (!entry || typeof entry.index !== 'number') return null;
      return { id: label, label: SHORT_LABELS[label] || label, pct: entry.index };
    })
    .filter(Boolean)
    .sort((a, b) => b.pct - a.pct);
}

/** Pick the single most distinctive TGI lifestyle statement (highest index). */
function distinctiveTgi(tgi) {
  const block = tgi && tgi.segments && tgi.segments[SEGMENT_ID];
  const lifestyle = block && Array.isArray(block.lifestyle) ? block.lifestyle : [];
  let top = null;
  for (const s of lifestyle) {
    if (s && typeof s.index === 'number' && (!top || s.index > top.index)) top = s;
  }
  return top;
}

export default function init(rootEl, data) {
  const { segments, tgi, journey } = data || {};

  // Arrival signature re-plays on every focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const segment =
    segments && Array.isArray(segments.segments)
      ? segments.segments.find((s) => s.id === SEGMENT_ID)
      : null;
  if (!segment || !segment.metrics) return; // fail soft — data may be null

  // The distinctive TGI line, woven into the rail.
  const tgiEl = rootEl.querySelector('[data-segment-tgi]');
  const top = distinctiveTgi(tgi);
  if (tgiEl && top) {
    tgiEl.innerHTML =
      `<span class="segment-coasters-tgi-index">${top.index}</span>` +
      `<span class="segment-coasters-tgi-text">They are ` +
      `<strong>${top.index / 100 >= 2 ? 'more than twice' : 'far more'} as likely</strong> to be ` +
      `&ldquo;${top.statement}&rdquo;</span>`;
  } else if (tgiEl) {
    tgiEl.remove();
  }

  // The over-index chart + its toggle (the marquee interaction).
  const chartHost = rootEl.querySelector('[data-segment-chart]');
  const labelEl = rootEl.querySelector('[data-segment-chart-label]');
  const toggleHost = rootEl.querySelector('[data-segment-toggle]');
  if (!chartHost || !toggleHost) return;

  let chart = null;
  const render = (facet) => {
    const items = itemsFor(segment.metrics, facet);
    if (labelEl) labelEl.textContent = facet.title;
    if (!chart) {
      chart = horizontalBars(chartHost, {
        items,
        max: INDEX_MAX,
        accent: 'navy',
        labelWidth: 150,
        barHeight: 22,
        gap: 12,
        ariaLabel: 'Over-index versus the national average',
      });
      chartHost.appendChild(chart.el);
    } else {
      chart.update(items, { resort: true });
    }
  };

  render(FACETS[0]);

  journey.gate();
  let switched = false;
  pillGroup(toggleHost, {
    options: FACETS.map((f) => ({ value: f.value, label: f.label })),
    value: FACETS[0].value,
    ariaLabel: 'Switch the over-index view',
    onChange: (value) => {
      const facet = FACETS.find((f) => f.value === value) || FACETS[0];
      render(facet);
      if (!switched) {
        switched = true;
        journey.ready();
      }
    },
  });
}
