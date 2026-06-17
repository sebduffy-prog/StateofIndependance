/**
 * 10-segment-architects.js — The Architects (17%) full-screen segment profile.
 *
 * The first of four segment book-cover profiles; the template the other three
 * follow. A cream editorial stage: an editorial rail (descriptor + hero quote +
 * a distinctive TGI statement) counter-weighted by a book-cover profile card
 * carrying who/money/essentials/AI and a togglable over-index chart.
 *
 * Marquee interaction: a square pillGroup toggle flips the backgroundless
 * over-index bars between two facets of the type — what they treat as
 * essential, and how they put AI to work. gate()/ready() advise the hint only.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 0-segment-architects.
 *
 * @param {HTMLElement} rootEl  the <section id="10-segment-architects">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'architects';

// The facets the toggle switches between. Each charts the within-segment
// penetration (a genuine %) for a handful of labels; the index is surfaced as
// an "over-index" badge so the distinctiveness reads without misusing the %.
const FACETS = [
  {
    value: 'essentials',
    label: 'Essentials',
    metric: 'essentials',
    title: 'What they treat as essential',
    rows: ['Beauty', 'Holidays', 'Eating out', 'Clothing', 'Subscriptions'],
  },
  {
    value: 'ai',
    label: 'AI use',
    metric: 'aiUseByTask',
    title: 'How they put AI to work',
    rows: ['Creative work', 'Health information', 'Education/learning', 'Financial advice', 'Technical support'],
  },
];

/** Build chart items [{id,label,pct}] from a facet, charting penetration pct. */
function itemsFor(metrics, facet) {
  const family = metrics[facet.metric] || {};
  return facet.rows
    .map((label) => {
      const entry = family[label];
      if (!entry || typeof entry.pct !== 'number') return null;
      return { id: label, label, pct: entry.pct };
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
      `<span class="segment-architects-tgi-index">${top.index}</span>` +
      `<span class="segment-architects-tgi-text">They are ` +
      `<strong>${top.index / 100 >= 2 ? 'more than twice' : 'far more'} as likely</strong> to say: ` +
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
        max: 100,
        accent: 'navy',
        labelWidth: 132,
        barHeight: 22,
        gap: 12,
        ariaLabel: facet.title,
      });
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
