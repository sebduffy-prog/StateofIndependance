/**
 * 10-segment-architects.js — The Architects (17%) full-screen segment profile.
 *
 * Cream editorial stage. Left rail: eyebrow → bold-black "The Architects"
 * display title (scramble-in on arrive) → three-word descriptor → hero
 * quote → who/money/essentials/AI facts → 17% share stat.
 *
 * Right: a backgroundless horizontal-bar index chart with a square pill
 * control that swaps the lens: "What they value" (essentials over-index)
 * / "How they see themselves" (mindset + forward-mindset over-index)
 * / "What they index on" (TGI lifestyle statements). Bars morph in place;
 * the first lens-switch clears the interaction hint.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to
 * #\31 0-segment-architects.
 *
 * @param {HTMLElement} rootEl  the <section id="10-segment-architects">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const SEGMENT_ID = 'architects';
const TOP_N = 5;
const INDEX_MAX = 250; // architects lifestyle indices reach 236

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
 */
function topMetricLow(family, min) {
  return Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => row.pct >= min)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);
}

function topMetric(family) {
  return topMetricLow(family, 120);
}

/**
 * Tidy a long TGI label into a shorter, legible bar label.
 * Strips surrounding smart-quotes used in tgi.json and trims whitespace.
 */
function tidyLabel(label) {
  return label
    .replace(/^[""']/, '')
    .replace(/[""']$/, '')
    .replace(/I prefer to buy products from companies who sponsor TV programmes/i,
      'Buys from TV sponsors')
    .replace(/I prefer to buy products from companies who sponsor sports events and teams/i,
      'Buys from sports sponsors')
    .replace(/I prefer to buy products from companies who sponsor exhibitions or music events/i,
      'Buys from event sponsors')
    .replace(/I would be willing to pay for exclusive podcast content/i,
      'Pays for exclusive podcasts')
    .replace(/Celebrities influence my purchase decisions/i,
      'Celebrity-influenced buyer')
    .replace(/I use my credit card mostly for business/i,
      'Uses credit card for business')
    .replace(/Ads in podcasts improve my perception of the brand/i,
      'Podcast ads improve brand perception')
    .replace(/I am willing to pay to access content on magazine websites\/Apps/i,
      'Pays for magazine website content')
    .replace(/I cannot resist buying magazines/i,
      'Cannot resist buying magazines')
    .replace(/\s*\(\+?\d+\/?\d*\)\s*/g, '')
    .trim();
}

/**
 * Populate the two distinctive TGI fingerprint lines in the HTML.
 * Shows the top-2 lifestyle over-index statements from tgi.json.
 */
function populateTgiLines(rootEl, tgiSeg) {
  const lifestyle = tgiSeg?.lifestyle;
  if (!Array.isArray(lifestyle)) return;
  const top2 = lifestyle
    .filter((e) => e && typeof e.index === 'number' && e.index >= 120)
    .sort((a, b) => b.index - a.index)
    .slice(0, 2);

  const idx1 = rootEl.querySelector('[data-segment-tgi-idx-1]');
  const lbl1 = rootEl.querySelector('[data-segment-tgi-lbl-1]');
  const idx2 = rootEl.querySelector('[data-segment-tgi-idx-2]');
  const lbl2 = rootEl.querySelector('[data-segment-tgi-lbl-2]');

  if (top2[0] && idx1 && lbl1) {
    idx1.textContent = top2[0].index;
    lbl1.textContent = tidyLabel(top2[0].label || top2[0].statement || '');
  }
  if (top2[1] && idx2 && lbl2) {
    idx2.textContent = top2[1].index;
    lbl2.textContent = tidyLabel(top2[1].label || top2[1].statement || '');
  }
}

export default function init(rootEl, data) {
  // Arrival re-plays on every focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const chartHost = rootEl.querySelector('[data-segment-architects-chart]');
  const lensHost = rootEl.querySelector('[data-segment-architects-lens]');
  if (!chartHost || !lensHost) return; // fail soft — markup not found

  const seg =
    data?.segments?.segments?.find((s) => s.id === SEGMENT_ID) || null;
  const tgiSeg = data?.tgi?.segments?.[SEGMENT_ID] || null;

  // Build lenses only from verified data; omit any lens with no items.
  const lenses = [];

  // Lens 1: What they value — essentials over-index from segments.json.
  if (seg?.metrics?.essentials) {
    const items = topMetric(seg.metrics.essentials);
    if (items.length) {
      lenses.push({ value: 'value', label: 'What they value', items });
    }
  }

  // Lens 2: How they see themselves — combined mindset + financial over-index.
  if (seg?.metrics) {
    const combined = [
      ...topMetricLow(seg.metrics.mindsetNetAgree, 110),
      ...topMetricLow(seg.metrics.forwardMindset, 110),
      ...topMetricLow(seg.metrics.financialPosition, 110),
    ]
      .sort((a, b) => b.pct - a.pct)
      .slice(0, TOP_N);
    if (combined.length) {
      lenses.push({ value: 'mindset', label: 'How they see themselves', items: combined });
    }
  }

  // Lens 3: What they index on — TGI lifestyle statements (tgi.json).
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

  // Populate the two TGI fingerprint lines.
  populateTgiLines(rootEl, tgiSeg);

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
        ariaLabel: `Architects: ${lens.label}`,
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
    ariaLabel: 'Choose a lens on the Architects',
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
