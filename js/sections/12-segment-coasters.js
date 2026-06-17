/**
 * 12-segment-coasters.js — The Coasters (27%) full-screen segment profile.
 *
 * A book-cover identity card (left) beside one backgroundless INDEX chart
 * (right). The marquee interaction: a square pill control swaps the lens on
 * the same audience — who they are (TGI demographics), what they index on
 * (TGI lifestyle), how they behave (segment metric indices) — re-drawing the
 * bars each time. Every value is an index vs the UK average (100 = average)
 * and traces to data/segments.json or data/tgi.json.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 2-segment-coasters.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="12-segment-coasters">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'coasters';
const TOP_N = 5; // bars per lens — fills the column without crowding
const INDEX_MAX = 200; // chart scale: coasters top out ~192; 200 fills the track

/** Tidy a long TGI statement into a short, legible bar label. */
const tidyLabel = (statement) =>
  statement
    .replace(/^"/, '').replace(/"$/, '')
    .replace(/\s*\(\+\d+\/\d+\)\s*/g, '')
    .replace(/I am very good at managing money/i, 'Good at managing money')
    .replace(/I get a good deal of pleasure from my garden/i, 'Garden is a pleasure')
    .replace(/I never click on online ads/i, 'Never clicks online ads')
    .replace(/I would never pay to access content online/i, 'Never pays for online content')
    .replace(/I don.t normally eat between meals/i, "Doesn't snack between meals")
    .replace(/Financial security after retirement is your own responsibility/i,
      'Owns retirement planning')
    .replace(/I always make sure I eat the recommended.*fruit and vegetables everyday/i,
      'Eats 5-a-day fruit & veg')
    .replace(/I prefer to buy products from companies who sponsor sports events and teams/i,
      'Buys from sports sponsors')
    .replace(/I would be willing to pay for exclusive podcast content/i,
      'Pays for exclusive podcasts')
    .replace(/Advertising within video or computer gameplay enhances the realism/i,
      'Engaged by in-game ads')
    .trim();

/** Top-N over-indexing entries from a [{label|statement,index,pct}] list.
 *  Uses a relaxed threshold to ensure at least TOP_N bars fill the chart. */
const topIndexed = (entries, minIndex = 100) =>
  entries
    .filter((e) => e.index >= minIndex)
    .sort((a, b) => b.index - a.index)
    .slice(0, TOP_N)
    .map((e) => ({ label: tidyLabel(e.label || e.statement || ''), pct: e.index }));

/** Top-N over-indexing rows from a segment metric family {label:{pct,index}}. */
const topMetric = (family) =>
  Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => row.pct >= 100)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);

export default function init(rootEl, data) {
  // Re-play the arrival each time this stage reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const segments = data?.segments;
  const tgi = data?.tgi;
  const chartHost = rootEl.querySelector('[data-segment-coasters-chart]');
  const lensHost = rootEl.querySelector('[data-segment-coasters-lens]');
  if (!chartHost || !lensHost) return; // fail soft if markup is missing

  // Assemble each lens from verified data; only keep lenses that have data.
  const seg = segments?.segments?.find((s) => s.id === SEGMENT_ID);
  const tgiSeg = tgi?.segments?.[SEGMENT_ID];

  const lenses = [];

  if (Array.isArray(tgiSeg?.demographics?.skews) && tgiSeg.demographics.skews.length) {
    // Coasters have a strong age skew — use all skews above 100 so chart fills
    lenses.push({
      value: 'who',
      label: 'Who they are',
      items: topIndexed(tgiSeg.demographics.skews, 100),
    });
  }

  if (Array.isArray(tgiSeg?.lifestyle) && tgiSeg.lifestyle.length) {
    lenses.push({
      value: 'index',
      label: 'What they index on',
      items: topIndexed(tgiSeg.lifestyle, 100),
    });
  }

  if (seg?.metrics) {
    const behaviour = [
      ...topMetric(seg.metrics.firstToCut),
      ...topMetric(seg.metrics.financialPosition),
      ...topMetric(seg.metrics.mindsetNetAgree),
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
        barHeight: 28,
        gap: 16,
        labelWidth: 160,
        ariaLabel: 'Coasters index against the UK average',
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
    ariaLabel: 'Choose a lens on the Coasters',
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
