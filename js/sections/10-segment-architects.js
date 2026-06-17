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
// Scale baseline: 100 = the UK average, always shown for context. The real
// chart max is computed per-lens from the data (see lensMax) so bars fill the
// track instead of stranding dead space on the right of a fixed wide scale.
const INDEX_BASELINE = 100;
const SCALE_HEADROOM = 1.08; // a touch of air past the longest bar

/** Tight per-lens max so the longest bar nearly fills the track. */
function lensMax(items) {
  const top = items.reduce((m, it) => Math.max(m, it.pct || 0), 0);
  // Never compress below the 100 baseline; round up to a clean step.
  const raw = Math.max(INDEX_BASELINE + 20, top * SCALE_HEADROOM);
  return Math.ceil(raw / 10) * 10;
}

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

// Fingerprint cloud sizing: aim for a rich, space-filling set.
const FP_TARGET = 12;       // ideal number of statements
const FP_MAX = 14;          // hard cap
const FP_MIN = 8;           // never show fewer than this if data allows
const FP_THRESHOLDS = [120, 110, 100]; // relax until we reach the target

/**
 * Tidy any TGI label (lifestyle quote OR media descriptor) into a short,
 * legible tag. Strips smart-quotes, trailing index notations, and rewrites
 * the long survey statements into plain audience-portrait phrases. Never
 * contains a number.
 */
function tidyTag(raw) {
  let s = (raw || '')
    .replace(/^[“"‘']\s*/, '')
    .replace(/\s*[”"’']$/, '')
    .replace(/\s*\(\+?\d+\/?\d*\)\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const map = [
    [/I prefer to buy products from companies who sponsor TV programmes/i, 'Buys from TV sponsors'],
    [/I prefer to buy products from companies who sponsor sports events and teams/i, 'Buys from sports sponsors'],
    [/I prefer to buy products from companies who sponsor exhibitions or music events/i, 'Buys from event sponsors'],
    [/I would be willing to pay for exclusive podcast content/i, 'Pays for exclusive podcasts'],
    [/Celebrities influence my purchase decisions/i, 'Swayed by celebrities'],
    [/I use my credit card mostly for business/i, 'Credit card mostly for business'],
    [/Ads in podcasts improve my perception of the brand/i, 'Warms to brands via podcast ads'],
    [/I am willing to pay to access content on magazine websites\/Apps/i, 'Pays for magazine content'],
    [/I cannot resist buying magazines/i, 'Cannot resist magazines'],
    [/I never click on online ads/i, 'Never clicks online ads'],
    [/I worry about work during my leisure time/i, 'Work follows them into leisure'],
    [/I am no good at saving money/i, 'No good at saving'],
    [/I find it difficult to find new podcasts.*/i, 'Struggles to find new podcasts'],
    [/The point of drinking is to get drunk/i, 'Drinks to get drunk'],
    [/New content and updates keep me playing the same video games/i, 'Stays loyal to live-service games'],
    [/My favourite pastime is playing video games/i, 'Gaming is their pastime'],
    [/I am often tempted to buy products\/Brands advertised by influencers\/Content creators/i, 'Tempted by influencer brands'],
    [/I am very good at managing money/i, 'Good at managing money'],
    [/I don.?t normally eat between meals/i, "Doesn't snack between meals"],
    [/I would never pay to access content online/i, 'Never pays for online content'],
    [/I get a good deal of pleasure from my garden/i, 'Finds pleasure in the garden'],
    [/Financial security after retirement is your own responsibility/i, 'Owns their retirement security'],
    [/I always make sure I eat the recommended.*fruit and vegetables everyday/i, 'Eats their five-a-day'],
    [/Owning stocks and shares is too risky an investment for me/i, 'Shares feel too risky'],
    [/I buy clothes for comfort, not for style/i, 'Dresses for comfort, not style'],
    [/I prefer to spend a quiet evening at home than go out/i, 'Prefers a quiet night in'],
    [/Always watches video podcasts/i, 'Watches video podcasts'],
    [/Reads a regional daily paper/i, 'Reads the regional daily'],
    [/Reads Daily Mail \(print\)/i, 'Reads the Daily Mail in print'],
    [/News\/Current Affairs radio shows/i, 'Tunes into news radio'],
    [/Watches live TV every day/i, 'Watches live TV daily'],
    [/Mail Online online/i, 'Reads Mail Online'],
    [/Metro online/i, 'Reads Metro online'],
    [/Business podcasts/i, 'Listens to business podcasts'],
    [/Educational podcasts/i, 'Listens to educational podcasts'],
    [/Society & Culture podcasts/i, 'Listens to culture podcasts'],
    [/Music podcasts/i, 'Listens to music podcasts'],
    [/Britbox in household/i, 'Has Britbox at home'],
    [/Dazn in household/i, 'Has DAZN at home'],
    [/Hayu in household/i, 'Has Hayu at home'],
    [/Has 5 \(My5\)/i, 'Streams on My5'],
    [/Has BBC iPlayer/i, 'Streams BBC iPlayer'],
    [/Has Channel 4/i, 'Watches Channel 4'],
    [/Has ITVX/i, 'Streams ITVX'],
    [/Uses Snapchat/i, 'Uses Snapchat'],
    [/Uses TikTok/i, 'Uses TikTok'],
    [/Uses Facebook/i, 'Uses Facebook'],
    [/Uses LinkedIn/i, 'Uses LinkedIn'],
  ];
  for (const [re, rep] of map) {
    if (re.test(s)) return rep;
  }
  return s;
}

/**
 * Pick a rich set of distinctive statement labels from a segment's TGI
 * lifestyle + media arrays. Relaxes the index threshold only as far as
 * needed to reach the target count; never returns numbers.
 *
 * @param {{ lifestyle?:Array, media?:Array }|null} tgiSeg
 * @returns {string[]}
 */
function fingerprintLabels(tgiSeg) {
  const pool = []
    .concat(Array.isArray(tgiSeg?.lifestyle) ? tgiSeg.lifestyle : [])
    .concat(Array.isArray(tgiSeg?.media) ? tgiSeg.media : [])
    .filter((e) => e && typeof e.index === 'number')
    .sort((a, b) => b.index - a.index);
  if (!pool.length) return [];

  let chosen = [];
  for (const threshold of FP_THRESHOLDS) {
    chosen = pool.filter((e) => e.index >= threshold);
    if (chosen.length >= FP_TARGET) break;
  }
  // If still short of the floor, take the highest-indexing entries we have.
  if (chosen.length < FP_MIN) chosen = pool.slice(0, FP_MIN);

  const seen = new Set();
  const labels = [];
  for (const e of chosen.slice(0, FP_MAX)) {
    const text = tidyTag(e.label || e.statement || '');
    if (text && !seen.has(text.toLowerCase())) {
      seen.add(text.toLowerCase());
      labels.push(text);
    }
  }
  return labels;
}

/**
 * Build a rich TGI "fingerprint" cloud of distinctive over-indexing
 * statements (TEXT ONLY — no index / sizing numbers ever rendered).
 *
 * Pulls from the segment's lifestyle + media TGI arrays. Prefers the
 * distinctive entries (index >= 120); if a segment has fewer than the
 * target, the threshold relaxes so every segment fills its space with a
 * confident set (~8-14 statements).
 *
 * @param {HTMLElement} rootEl
 * @param {{ lifestyle?:Array, media?:Array }|null} tgiSeg
 */
function populateFingerprint(rootEl, tgiSeg) {
  const host = rootEl.querySelector('[data-segment-fingerprint]');
  if (!host) return;
  const labels = fingerprintLabels(tgiSeg);
  if (!labels.length) {
    host.closest('.segment-fingerprint')?.remove();
    return;
  }
  host.innerHTML = '';
  labels.forEach((text) => {
    const li = document.createElement('li');
    li.className = 'segment-fingerprint-tag';
    li.textContent = text;
    host.appendChild(li);
  });
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

  // Populate the rich TGI fingerprint cloud (text only, no numbers).
  populateFingerprint(rootEl, tgiSeg);

  if (!lenses.length) return; // no verified data — leave the identity card visible

  // One reusable chart; lens changes morph bars in place.
  let bars = null;

  const drawLens = (value) => {
    const lens = lenses.find((l) => l.value === value) || lenses[0];
    if (!bars) {
      bars = horizontalBars(chartHost, {
      showValues: false,  // TGI/index sizing numbers are never displayed
        items: lens.items,
        max: lensMax(lens.items),
        accent: 'navy',
        decimals: 0,
        barHeight: 50,
        gap: 26,
        labelWidth: 200,
        ariaLabel: `Architects: ${lens.label}`,
      });
    } else {
      bars.update(lens.items, { resort: true, max: lensMax(lens.items) });
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
