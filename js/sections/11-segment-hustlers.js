/**
 * 11-segment-hustlers.js — The Hustlers (28%) full-screen segment profile.
 *
 * A book-cover identity card (left) beside one backgroundless INDEX chart
 * (right). The marquee interaction: a square pill control swaps the lens on
 * the same audience — who they are (TGI demographics), what they index on
 * (TGI lifestyle), how they behave (segment metric indices) — re-drawing the
 * bars each time. Every value is an index vs the UK average (100 = average)
 * and traces to data/segments.json or data/tgi-statements.json.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 1-segment-hustlers.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="11-segment-hustlers">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'hustlers';
const TOP_N = 5; // bars per lens — fills the column without crowding
const INDEX_MAX = 200; // chart scale: indices here top out near 175–196

/** Tidy a long TGI statement into a short, legible bar label. */
const tidyLabel = (statement) =>
  statement
    .replace(/\s*\(\+\d+\/\d+\)\s*/g, '')
    .replace(/Apps For Smartphones & Tablets: Yes/i, 'Smartphone & tablet apps')
    .replace(/At leisure centres.*$/i, 'Sees ads at the gym')
    .trim();

/** Top-N over-indexing entries from a [{statement,index,pct}] list. */
const topIndexed = (entries) =>
  entries
    .filter((e) => e.index >= 120)
    .sort((a, b) => b.index - a.index)
    .slice(0, TOP_N)
    .map((e) => ({ label: tidyLabel(e.statement), pct: e.index }));

/** Top-N over-indexing rows from a segment metric family {label:{pct,index}}. */
const topMetric = (family) =>
  Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => row.pct >= 120)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);

export default function init(rootEl, data) {
  // Re-play the arrival each time this stage reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const segments = data?.segments;
  const tgi = data?.tgi;
  const chartHost = rootEl.querySelector('[data-segment-hustlers-chart]');
  const lensHost = rootEl.querySelector('[data-segment-hustlers-lens]');
  if (!chartHost || !lensHost) return; // fail soft if markup is missing

  // Assemble each lens from verified data; only keep lenses that have data.
  const seg = segments?.segments?.find((s) => s.id === SEGMENT_ID);
  const tgiSeg = tgi?.segments?.[SEGMENT_ID];

  const lenses = [];
  if (tgiSeg?.demographics?.length) {
    lenses.push({
      value: 'who',
      label: 'Who they are',
      items: topIndexed(tgiSeg.demographics),
    });
  }
  if (tgiSeg?.lifestyle?.length) {
    lenses.push({
      value: 'index',
      label: 'What they index on',
      items: topIndexed(tgiSeg.lifestyle),
    });
  }
  if (seg?.metrics) {
    const behaviour = [
      ...topMetric(seg.metrics.essentials),
      ...topMetric(seg.metrics.financialPosition),
      ...topMetric(seg.metrics.mindsetNetAgree),
    ]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, TOP_N);
    if (behaviour.length) {
      lenses.push({ value: 'behave', label: 'How they behave', items: behaviour });
    }
  }

  if (!lenses.length) return; // no verified data — leave the identity card standing

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
        ariaLabel: 'Hustlers index against the UK average',
      });
    } else {
      bars.update(lens.items, { resort: true });
    }
  };

  // The square pill control — the marquee interaction. Switching a lens is the
  // gated beat; the first switch clears the hint.
  data?.journey?.gate?.();
  let explored = false;
  pillGroup(lensHost, {
    options: lenses.map((l) => ({ value: l.value, label: l.label })),
    value: lenses[0].value,
    ariaLabel: 'Choose a lens on the Hustlers',
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
