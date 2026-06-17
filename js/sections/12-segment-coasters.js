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
// 100 = the UK average. The chart max is computed per-lens from the data so
// bars fill the track instead of stranding right-side dead space.
const INDEX_BASELINE = 100;
const SCALE_HEADROOM = 1.08;

/** Tight per-lens max so the longest bar nearly fills the track. */
function lensMax(items) {
  const top = items.reduce((m, it) => Math.max(m, it.pct || 0), 0);
  const raw = Math.max(INDEX_BASELINE + 20, top * SCALE_HEADROOM);
  return Math.ceil(raw / 10) * 10;
}

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

// Fingerprint cloud sizing: aim for a rich, space-filling set.
const FP_TARGET = 12;
const FP_MAX = 14;
const FP_MIN = 8;
const FP_THRESHOLDS = [120, 110, 100];

/**
 * Tidy any TGI label (lifestyle quote OR media descriptor) into a short,
 * legible tag with no numbers.
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

/** Render the fingerprint cloud (text only, no sizing numbers). */
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

  // Populate the rich TGI fingerprint cloud (text only, no numbers).
  populateFingerprint(rootEl, tgiSeg);

  if (!lenses.length) return; // no verified data — identity card still stands

  // One reusable chart; lens changes morph the bars in place.
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
        labelWidth: 220,
        ariaLabel: 'Coasters index against the UK average',
      });
    } else {
      bars.update(lens.items, { resort: true, max: lensMax(lens.items) });
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
