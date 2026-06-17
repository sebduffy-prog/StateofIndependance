/**
 * 13-segment-retreaters.js — The Retreaters (28%) full-screen segment profile.
 *
 * A book-cover identity card (left) beside one backgroundless INDEX chart
 * (right). The marquee interaction: a square pill control swaps the lens on
 * the same audience — who they are (TGI demographics), what they index on
 * (TGI lifestyle), how they behave (segment metric indices) — re-drawing the
 * bars each time. Every value is an index vs the UK average (100 = average)
 * and traces to data/segments.json or data/tgi.json.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 3-segment-retreaters.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="13-segment-retreaters">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'retreaters';
const TOP_N = 5; // bars per lens — fills the column without crowding
const INDEX_MAX = 250; // chart scale: retreaters top out around 211 (cannot afford basics)

/** Tidy a long TGI statement into a short, legible bar label. */
const tidyLabel = (statement) =>
  statement
    .replace(/^"/, '').replace(/"$/, '')
    .replace(/^“/, '').replace(/”$/, '')
    .replace(/\s*\(\+\d+\/\d+\)\s*/g, '')
    .replace(/I am very good at managing money/i, 'Good at managing money')
    .replace(/I get a good deal of pleasure from my garden/i, 'Garden is a pleasure')
    .replace(/I never click on online ads/i, 'Never clicks online ads')
    .replace(/I would never pay to access content online/i, 'Would never pay for online content')
    .replace(/I don.t normally eat between meals/i, "Doesn't snack between meals")
    .replace(/Financial security after retirement is your own responsibility/i,
      'Owns retirement planning')
    .replace(/I prefer to spend a quiet evening at home than go out/i,
      'Prefers quiet evenings at home')
    .replace(/I buy clothes for comfort, not for style/i, 'Buys for comfort, not style')
    .replace(/Owning stocks and shares is too risky an investment for me/i,
      'Stocks and shares too risky')
    .trim();

/** Top-N over-indexing entries from a [{label|statement,index,pct}] list. */
const topIndexed = (entries) =>
  entries
    .filter((e) => e.index >= 110)
    .sort((a, b) => b.index - a.index)
    .slice(0, TOP_N)
    .map((e) => ({ label: tidyLabel(e.label || e.statement || ''), pct: e.index }));

/** Top-N over-indexing rows from a segment metric family {label:{pct,index}}. */
const topMetric = (family) =>
  Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => row.pct >= 110)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);

export default function init(rootEl, data) {
  // Re-play the arrival each time this stage reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const segments = data?.segments;
  const tgi = data?.tgi;
  const chartHost = rootEl.querySelector('[data-segment-retreaters-chart]');
  const lensHost = rootEl.querySelector('[data-segment-retreaters-lens]');
  if (!chartHost || !lensHost) return; // fail soft if markup is missing

  // Assemble each lens from verified data; only keep lenses that have data.
  const seg = segments?.segments?.find((s) => s.id === SEGMENT_ID);
  const tgiSeg = tgi?.segments?.[SEGMENT_ID];

  const lenses = [];

  if (Array.isArray(tgiSeg?.demographics?.skews) && tgiSeg.demographics.skews.length) {
    lenses.push({
      value: 'who',
      label: 'Who they are',
      items: topIndexed(tgiSeg.demographics.skews),
    });
  }

  if (Array.isArray(tgiSeg?.lifestyle) && tgiSeg.lifestyle.length) {
    // Lifestyle has low-indexing items only for retreaters; grab the highest ones regardless
    const lifestyleItems = tgiSeg.lifestyle
      .sort((a, b) => b.index - a.index)
      .slice(0, TOP_N)
      .map((e) => ({ label: tidyLabel(e.label || ''), pct: e.index }));
    if (lifestyleItems.length) {
      lenses.push({
        value: 'index',
        label: 'What they index on',
        items: lifestyleItems,
      });
    }
  }

  if (seg?.metrics) {
    const behaviour = [
      ...topMetric(seg.metrics.financialPosition),
      ...topMetric(seg.metrics.forwardMindset),
      ...topMetric(seg.metrics.firstToCut),
      ...topMetric(seg.metrics.brandAsks),
    ]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, TOP_N);
    if (behaviour.length) {
      lenses.push({ value: 'behave', label: 'How they behave', items: behaviour });
    }
  }

  if (!lenses.length) return; // no verified data — identity card still stands

  // One reusable chart; lens changes morph the bars in place.
  let bars = null;
  const drawLens = (value) => {
    const lens = lenses.find((l) => l.value === value) || lenses[0];
    if (!bars) {
      bars = horizontalBars(chartHost, {
        items: lens.items,
        max: INDEX_MAX,
        accent: 'navy',
        decimals: 0,
        barHeight: 26,
        gap: 16,
        labelWidth: 248,
        ariaLabel: 'Retreaters index against the UK average',
      });
    } else {
      bars.update(lens.items, { resort: true });
    }
  };

  // Square pill control — the marquee interaction.
  data?.journey?.gate?.();
  let explored = false;
  pillGroup(lensHost, {
    options: lenses.map((l) => ({ value: l.value, label: l.label })),
    value: lenses[0].value,
    ariaLabel: 'Choose a lens on the Retreaters',
    onChange: (value) => {
      drawLens(value);
      if (!explored) {
        explored = true;
        data?.journey?.ready?.();
      }
    },
  });

  drawLens(lenses[0].value);
}
