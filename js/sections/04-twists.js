/**
 * Chapter 04 — twists.
 *
 * Three exhibits, all commit-then-reveal where it counts:
 *   (a) The trust paradox — an EARNED DARK (navy) moment. dragRank the
 *       seven institutions, reveal the true confidence bars + the
 *       53% to 24% / 29-point spread, then a flip card pairing NHS 6.42/10
 *       ("most trusted") with "53% say it has declined".
 *   (b) Protected joy — 40% holiday hero + a ring-fenced proportionStrip,
 *       protected-spend shown as a lollipopChart (fewer bars).
 *   (c) AI on tap — 58% (any task) vs a separate 37% (high-stakes),
 *       per-task bars (high-stakes framed), and the verbatim AI quote.
 *
 * Contract: docs/CONTRACT.md. Every number traces to data/survey.json.
 *
 * @param {HTMLElement} rootEl  the <section class="chapter" id="04-twists">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { horizontalBars, lollipopChart, proportionStrip } from '../lib/charts.js';
import { dragRank } from '../lib/interactions.js';

const BEAR_SILHOUETTE = 'assets/deck/bear-child-stamp.png';
const VELVET_GROUND = 'assets/deck/ground-navy-velvet.jpg';

/** Deterministic shuffle so tiles never start in rank order. */
const shuffleStable = (items) => {
  const order = [3, 0, 6, 2, 5, 1, 4]; // fixed scramble of 7 indices
  return order.filter((i) => i < items.length).map((i) => items[i]);
};

/** Faint cream bear+child watermark behind the twists intro (decorative,
 *  sits behind the header copy via CSS z-index, never occludes content). */
const placeBearStamp = (rootEl) => {
  const host = rootEl.querySelector('[data-host="bear-stamp"]');
  if (!host) return;
  host.style.backgroundImage = `url("${BEAR_SILHOUETTE}")`;
};

/** Textured deep-navy velvet ground for the earned-dark trust exhibit
 *  (decorative wash beneath the navy fallback; content sits above via CSS). */
const placeVelvetGround = (rootEl) => {
  const dark = rootEl.querySelector('.tw-exhibit--dark');
  if (!dark) return;
  dark.style.backgroundImage = `url("${VELVET_GROUND}")`;
};

const buildTrustParadox = (rootEl, institutionTrust) => {
  const ranking = institutionTrust?.confidenceRanking?.items;
  if (!Array.isArray(ranking) || ranking.length === 0) return;

  // True order: ids sorted by pctConfident descending (NHS -> Government).
  const byConfidence = ranking.slice().sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = byConfidence.map((it) => it.id);
  const top = byConfidence[0];
  const bottom = byConfidence[byConfidence.length - 1];

  const rankHost = rootEl.querySelector('[data-host="rank"]');
  const truthFig = rootEl.querySelector('[data-host="trust-truth"]');
  const barsHost = rootEl.querySelector('[data-host="trust-bars"]');
  const spreadEl = rootEl.querySelector('[data-host="spread"]');
  if (!rankHost || !truthFig || !barsHost || !spreadEl) return;

  const tiles = shuffleStable(ranking).map((it) => ({ id: it.id, label: it.label }));

  const revealTruth = () => {
    truthFig.hidden = false;
    // EARNED-DARK navy ground: cream-on-navy components + text (onNavy path),
    // never mustard (vanishes) and never a white box behind the chart.
    horizontalBars(barsHost, {
      items: byConfidence.map((it) => ({ id: it.id, label: it.label, pct: it.pctConfident })),
      max: 100,
      onNavy: true,
      decimals: 1,
      highlightId: top.id,
      labelWidth: 150,
      ariaLabel: 'Confidence each institution will reliably support them, by share rating 7 to 10 out of 10',
    });
    const spread = Math.round(top.pctConfident - bottom.pctConfident);
    spreadEl.innerHTML =
      `From ${Math.round(top.pctConfident)}% to ${Math.round(bottom.pctConfident)}%: ` +
      `${top.label} at the top, ${bottom.label} at the bottom. A ` +
      `<strong>${spread}-point spread</strong> in who Britain trusts to be there.`;
  };

  dragRank(rankHost, {
    items: tiles,
    trueOrder,
    instructions:
      'Drag to reorder, or focus a row and use the up and down arrow keys. Most trusted at the top.',
    onReveal: revealTruth,
  });

  // The paradox flip card: 6.42/10 "most trusted" <-> "53% say it declined".
  const flip = rootEl.querySelector('[data-host="paradox"]');
  if (flip) {
    flip.addEventListener('click', () => {
      const flipped = flip.getAttribute('aria-pressed') !== 'true';
      flip.setAttribute('aria-pressed', String(flipped));
      flip.classList.toggle('is-flipped', flipped);
    });
  }
};

const buildProtectedJoy = (rootEl, protectedSpend) => {
  const lolliHost = rootEl.querySelector('[data-host="joy-lolli"]');
  const stripHost = rootEl.querySelector('[data-host="ringfence"]');
  const items = protectedSpend?.items;
  if (!Array.isArray(items)) return;

  // The eight named non-essentials, in deck order (drop "none"/"brands").
  const named = items.filter((it) => it.id !== 'noneOfThese' && it.id !== 'specificBrands');

  if (lolliHost) {
    // Warm off-white page ground: navy components (charts default) read
    // high-contrast; mustard would vanish. Holiday highlighted in ink.
    lollipopChart(lolliHost, {
      items: named.map((it) => ({ id: it.id, label: it.label, pct: it.pct })),
      max: 100,
      highlightId: 'holidays',
      ariaLabel: 'Non-essentials Britain is actively protecting, by share protecting each',
    });
  }

  // Ring-fenced holiday framed against the flexible rest, as a proportion strip.
  if (stripHost) {
    const holidays = named.find((it) => it.id === 'holidays');
    const protect = holidays ? Math.round(holidays.pct) : 40;
    // On the warm gradient hero, ring-fenced share is high-contrast NAVY
    // (mustard-on-mustard would vanish); flexible spend stays teal.
    proportionStrip(stripHost, {
      segments: [
        { label: 'Ring-fenced holiday', pct: protect, accent: 'navy' },
        { label: 'Flexible spend', pct: 100 - protect, accent: 'teal' },
      ],
      ariaLabel: 'Holiday budget ring-fenced versus flexible spend',
    });
  }
};

const buildAiOnTap = (rootEl, aiTasks) => {
  const host = rootEl.querySelector('[data-host="ai-bars"]');
  const items = aiTasks?.items;
  if (!host || !Array.isArray(items)) return;

  // Warm off-white page ground: navy bars (charts default) read high-contrast.
  const chart = horizontalBars(host, {
    items: items.map((it) => ({ id: it.id, label: it.label, pct: it.pct })),
    max: 100,
    decimals: 1,
    labelWidth: 190,
    ariaLabel: 'Tasks done with AI instead of a professional, by share for each task',
  });
  const highStakesIds = items.filter((it) => it.isHighStakes).map((it) => it.id);
  frameRows(chart.el, items, highStakesIds, 190);
};

// Geometry mirrored from charts.js horizontalBars (the only knobs that move).
const BAR_HEIGHT = 30;
const BAR_GAP = 12;
const CHART_WIDTH = 720;
const CHART_RIGHT_PAD = 56;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draw a 1.5px ink frame around the full track of named rows so a subset
 * reads as ring-fenced against flexible neighbours. Pure SVG, square corners,
 * positioned from the lib's known row geometry (no mutation of lib rows).
 *
 * @param {SVGElement} svg     the chart's <svg> (chart.el)
 * @param {Array<{id:string}>} rowItems  items in render order
 * @param {string[]} ids       ids of rows to frame
 * @param {number} labelWidth  must match the labelWidth passed to the chart
 */
const frameRows = (svg, rowItems, ids, labelWidth) => {
  if (!svg || !Array.isArray(rowItems) || !Array.isArray(ids) || ids.length === 0) return;
  const valueX = labelWidth + 12;
  const trackWidth = CHART_WIDTH - valueX - CHART_RIGHT_PAD;
  const wanted = new Set(ids);
  rowItems.forEach((item, index) => {
    if (!wanted.has(item.id)) return;
    const y = index * (BAR_HEIGHT + BAR_GAP);
    const frame = document.createElementNS(SVG_NS, 'rect');
    const inset = 2;
    frame.setAttribute('x', String(valueX - inset));
    frame.setAttribute('y', String(y - inset));
    frame.setAttribute('width', String(trackWidth + inset * 2));
    frame.setAttribute('height', String(BAR_HEIGHT + inset * 2));
    frame.setAttribute('fill', 'none');
    frame.setAttribute('stroke', '#000');
    frame.setAttribute('stroke-width', '1.5');
    frame.setAttribute('class', 'tw-ringfence');
    svg.append(frame);
  });
};

export default function init(rootEl, data) {
  const { survey } = data || {};
  if (!survey) return;

  observeReveals(rootEl);
  observeCounters(rootEl);

  placeBearStamp(rootEl);
  placeVelvetGround(rootEl);
  buildTrustParadox(rootEl, survey.institutionTrust);
  buildProtectedJoy(rootEl, survey.protectedSpend);
  buildAiOnTap(rootEl, survey.aiTasks);
}
