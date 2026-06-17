/**
 * 13-segment-retreaters.js - The Retreaters (28%) full-screen segment profile.
 *
 * ONE SHARED TEMPLATE. This module is identical to the other three segment
 * modules except the SEGMENT_ID constant below - same skeleton, same lenses,
 * same chart, same interactions. Only the per-segment data and the single
 * accent colour (set in CSS) change, so the four pages read as one system.
 *
 * Cream editorial stage. Left rail: eyebrow, bold-black "The Retreaters" display
 * title (scramble-in on arrive), three-word descriptor, hero quote,
 * who/money/protects/AI facts, the audience share.
 *
 * Right: a backgroundless horizontal-bar index chart (text labels, NO sizing
 * numbers) with a square pill control swapping the lens. Bars morph in place;
 * the first lens switch clears the advisory hint. Plus a rich TGI statement
 * cloud (text only). Every value traces to data/segments.json + data/tgi.json.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl  the <section id="13-segment-retreaters">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

// THE ONLY PER-SEGMENT LINE. Everything below is shared, identical logic.
const SEGMENT_ID = 'retreaters';

const TOP_N = 5;
const INDEX_BASELINE = 100; // 100 = the UK average, the scale's anchor.
const SCALE_HEADROOM = 1.08; // a touch of air past the longest bar.

/** A short one-line explanation shown for the active lens. */
const LENS_HINTS = {
  value: 'What this segment treats as essential, indexed against the nation.',
  mindset: 'How they describe their own outlook and finances, versus average.',
  control: 'The active steps they take to stay in control of their lives.',
  brand: 'What they most want brands to do for them.',
  tgi: 'The lifestyle attitudes they over-index on in the TGI survey.',
  ai: 'The tasks they hand to AI instead of a human professional.',
};

/** Tight per-lens max so the longest bar nearly fills the track. */
function lensMax(items) {
  const top = items.reduce((m, it) => Math.max(m, it.pct || 0), 0);
  const raw = Math.max(INDEX_BASELINE + 20, top * SCALE_HEADROOM);
  return Math.ceil(raw / 10) * 10;
}

/** Top-N over-indexing rows from a segment metric family {label:{pct,index}}. */
function topMetricLow(family, min) {
  return Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => typeof row.pct === 'number' && row.pct >= min)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);
}

function topMetric(family) {
  return topMetricLow(family, 120);
}

/**
 * Top-N rows of a family by index with NO threshold - the segment's hardest
 * leanings even when none clear the over-index floor. Used as a graceful
 * fallback so every segment fills the same lens set (the caption frames the
 * bars relative to the 100 = UK-average baseline either way).
 */
function topMetricAny(family) {
  return Object.entries(family || {})
    .map(([label, v]) => ({ label, pct: v.index }))
    .filter((row) => typeof row.pct === 'number')
    .sort((a, b) => b.pct - a.pct)
    .slice(0, TOP_N);
}

/**
 * Top-N TGI lifestyle statements by index. Prefers the clear over-indexes
 * (>=120); if a segment has none that high (e.g. a passive, low-index
 * segment), it falls back to that segment's HIGHEST-indexing statements so the
 * lens still fills with its most distinctive leanings. The caption frames the
 * bars as "where this Britain leans hardest", which is true either way.
 */
function topIndexedTgi(entries) {
  if (!Array.isArray(entries)) return [];
  const sorted = entries
    .filter((e) => e && typeof e.index === 'number')
    .sort((a, b) => b.index - a.index);
  const over = sorted.filter((e) => e.index >= 120);
  const chosen = over.length ? over : sorted;
  return chosen
    .slice(0, TOP_N)
    .map((e) => ({ label: tidyTag(e.label || e.statement || ''), pct: e.index }))
    .filter((e) => e.label);
}

// Fingerprint cloud sizing: a tight set that always fits one screen.
const FP_TARGET = 7;
const FP_MAX = 8;
const FP_MIN = 5;
const FP_THRESHOLDS = [120, 110, 100];

/**
 * Tidy any TGI label (lifestyle quote OR media descriptor) into a short,
 * legible tag. Strips smart-quotes and trailing index notations and rewrites
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
    [/Apps For Smartphones & Tablets: Yes/i, 'Uses smartphone & tablet apps'],
    [/At leisure centres.*$/i, 'Goes to gyms / leisure centres'],
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

/** Pick a rich set of distinctive statement labels (text only, no numbers). */
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

/** Render the fingerprint cloud (text only, NO sizing numbers). */
function populateFingerprint(rootEl, tgiSeg) {
  const host = rootEl.querySelector('[data-seg-fingerprint]');
  if (!host) return;
  const labels = fingerprintLabels(tgiSeg);
  if (!labels.length) {
    host.closest('.seg-fingerprint')?.remove();
    return;
  }
  host.innerHTML = '';
  labels.forEach((text) => {
    const li = document.createElement('li');
    li.className = 'seg-fingerprint-tag';
    li.textContent = text;
    host.appendChild(li);
  });
}

/**
 * Build the shared set of lenses from verified data. Identical logic across
 * all four segments, so the COMPONENT is the same everywhere and only the
 * CONTENT differs - the four pages read as one system.
 *
 * Each lens prefers the clear over-indexes (>=120) and relaxes toward the
 * 100 = average baseline, falling back to a segment's hardest leanings when it
 * over-indexes on none (e.g. a passive, trading-down segment). The chart
 * caption frames every bar relative to the 100 baseline, so the reading stays
 * honest whichever set is shown.
 */
function buildLenses(seg, tgiSeg) {
  const lenses = [];

  // Lens 1 - What they value: essentials. Prefer the over-indexes; if a
  // trading-down segment over-indexes on none, fall back to its hardest
  // leanings so the lens still fills.
  if (seg?.metrics?.essentials) {
    const over = topMetricLow(seg.metrics.essentials, 105);
    const items = over.length ? over : topMetricAny(seg.metrics.essentials);
    if (items.length) lenses.push({ value: 'value', label: 'What they value', items });
  }

  // Lens 2 - How they see themselves: outlook + finances over-index.
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

  // Lens 3 - How they take control: proactive control behaviours over-index.
  if (seg?.metrics?.personalControlBehaviours) {
    const items = topMetricLow(seg.metrics.personalControlBehaviours, 100);
    if (items.length) lenses.push({ value: 'control', label: 'How they take control', items });
  }

  // Lens 4 - What they ask of brands: brandAsks over-index.
  if (seg?.metrics?.brandAsks) {
    const items = topMetricLow(seg.metrics.brandAsks, 100);
    if (items.length) lenses.push({ value: 'brand', label: 'What they ask of brands', items });
  }

  // Lens 5 - What they index on: TGI lifestyle statements.
  if (tgiSeg?.lifestyle?.length) {
    const items = topIndexedTgi(tgiSeg.lifestyle);
    if (items.length) lenses.push({ value: 'tgi', label: 'What they index on', items });
  }

  // Fallback - AI use by task, only if nothing else populated.
  if (!lenses.length && seg?.metrics?.aiUseByTask) {
    const items = topMetric(seg.metrics.aiUseByTask);
    if (items.length) lenses.push({ value: 'ai', label: 'AI use', items });
  }

  return lenses;
}

export default function init(rootEl, data) {
  // Arrival re-plays on every focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const chartHost = rootEl.querySelector('[data-seg-chart]');
  const lensHost = rootEl.querySelector('[data-seg-lens]');
  const hintEl = rootEl.querySelector('[data-seg-lens-hint]');
  if (!chartHost || !lensHost) return; // fail soft - markup not found

  const seg = data?.segments?.segments?.find((s) => s.id === SEGMENT_ID) || null;
  const tgiSeg = data?.tgi?.segments?.[SEGMENT_ID] || null;

  // Populate the rich TGI fingerprint cloud (text only, no numbers).
  populateFingerprint(rootEl, tgiSeg);

  const lenses = buildLenses(seg, tgiSeg);
  if (!lenses.length) return; // no verified data - leave the identity card visible

  // One reusable chart; lens changes morph bars in place.
  let bars = null;

  const drawLens = (value) => {
    const lens = lenses.find((l) => l.value === value) || lenses[0];
    if (hintEl) hintEl.textContent = LENS_HINTS[lens.value] || hintEl.textContent;
    if (!bars) {
      bars = horizontalBars(chartHost, {
        showValues: false,  // index sizing numbers are never displayed
        items: lens.items,
        max: lensMax(lens.items),
        accent: 'navy',
        decimals: 0,
        barHeight: 34,
        gap: 16,
        labelWidth: 220,
        ariaLabel: `Retreaters: ${lens.label}`,
      });
    } else {
      bars.update(lens.items, { resort: true, max: lensMax(lens.items) });
    }
  };

  // Wire the marquee interaction - gate() advises the hint; first switch
  // clears it. Never blocks Next.
  data?.journey?.gate?.();
  let explored = false;

  pillGroup(lensHost, {
    options: lenses.map((l) => ({ value: l.value, label: l.label })),
    value: lenses[0].value,
    ariaLabel: `Choose a lens on the Retreaters`,
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
