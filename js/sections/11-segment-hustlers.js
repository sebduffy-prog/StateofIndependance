/**
 * 11-segment-hustlers.js — The Hustlers (28%) full-screen segment profile.
 *
 * Cream editorial stage. Left rail: eyebrow → bold-black "The Hustlers"
 * display title (scramble-in on arrive) → three-word descriptor → hero
 * quote → who/money/essentials/AI facts → 28% share stat.
 *
 * Right: a backgroundless horizontal-bar index chart with a square pill
 * control that swaps the lens: "What they value" (essentials over-index)
 * / "How they think" (mindset over-index) / "What they index on" (TGI
 * lifestyle statements). Bars morph in place; the first lens-switch clears
 * the interaction hint.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to
 * #\31 1-segment-hustlers.
 *
 * @param {HTMLElement} rootEl  the <section id="11-segment-hustlers">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'hustlers';
const TOP_N = 6;
const INDEX_MAX = 200;

/**
 * Top-N over-indexing entries from a TGI array.
 * Entries may use either .label or .statement (handles both data files).
 */
function topIndexedTgi(entries) {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter((e) => e && typeof e.index === 'number' && e.index >= 120)
    .sort((a, b) => b.index - a.index)
    .slice(0, TOP_N)
    .map((e) => ({
      label: tidyLabel(e.label || e.statement || ''),
      pct: e.index,
    }))
    .filter((e) => e.label);
}

/**
 * Top-N over-indexing rows from a segment metric family {label:{pct,index}}.
 * Default threshold: 120 (≥120 = over-index per CONTRACT.md).
 */
function topMetric(family) {
  return topMetricLow(family, 120);
}

/**
 * Same as topMetric but with a configurable minimum index threshold.
 * Used when a family has fewer entries above 120.
 */
function topMetricLow(family, min) {
  return Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => row.pct >= min)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);
}

/**
 * Tidy a long TGI label into a shorter, legible bar label.
 * Strips surrounding quotes and trims whitespace.
 */
function tidyLabel(label) {
  return label
    .replace(/^["“‘]/, '')
    .replace(/["”’]$/, '')
    .replace(/Apps For Smartphones & Tablets: Yes/i, 'Uses smartphone & tablet apps')
    .replace(/At leisure centres.*$/i, 'Goes to gyms / leisure centres')
    .replace(/\s*\(\+?\d+\/?\d*\)\s*/g, '')
    .trim();
}

export default function init(rootEl, data) {
  // Arrival re-plays on every focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const chartHost = rootEl.querySelector('[data-segment-hustlers-chart]');
  const lensHost = rootEl.querySelector('[data-segment-hustlers-lens]');
  if (!chartHost || !lensHost) return; // fail soft — markup not found

  const seg =
    data?.segments?.segments?.find((s) => s.id === SEGMENT_ID) || null;
  const tgiSeg = data?.tgi?.segments?.[SEGMENT_ID] || null;

  // Build lenses only from verified data; omit any lens with no items.
  const lenses = [];

  // Lens 1: What they value — essentials over-index from segments.json.
  // Use 115 as threshold to include Beauty (119) alongside the clear over-indexes.
  if (seg?.metrics?.essentials) {
    const items = topMetricLow(seg.metrics.essentials, 115);
    if (items.length) {
      lenses.push({ value: 'value', label: 'What they value', items });
    }
  }

  // Lens 2: How they see themselves — combined outlook + financial position.
  // Threshold 100 (average) to surface the distinctive self-image of the Hustlers.
  if (seg?.metrics) {
    const combined = [
      ...topMetricLow(seg.metrics.mindsetNetAgree, 100),
      ...topMetricLow(seg.metrics.forwardMindset, 100),
      ...topMetricLow(seg.metrics.financialPosition, 100),
    ]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, TOP_N);
    if (combined.length) {
      lenses.push({ value: 'mindset', label: 'How they see themselves', items: combined });
    }
  }

  // Lens 3: What they index on — TGI lifestyle statements.
  if (tgiSeg?.lifestyle?.length) {
    const items = topIndexedTgi(tgiSeg.lifestyle);
    if (items.length) {
      lenses.push({ value: 'tgi', label: 'What they index on', items });
    }
  }

  // Fallback: AI use by task if nothing else populated.
  if (!lenses.length && seg?.metrics?.aiUseByTask) {
    const items = topMetric(seg.metrics.aiUseByTask);
    if (items.length) {
      lenses.push({ value: 'ai', label: 'AI use', items });
    }
  }

  if (!lenses.length) return; // no verified data — leave the identity card visible

  // One reusable chart; lens changes morph bars in place.
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
        gap: 14,
        labelWidth: 220,
        ariaLabel: `Hustlers: ${lens.label}`,
      });
    } else {
      bars.update(lens.items, { resort: true });
    }
  };

  // Wire the marquee interaction — gate() advises the hint; first switch
  // clears it. Never blocks Next.
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
