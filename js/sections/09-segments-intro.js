/**
 * 09-segments-intro.js — the segments opener: the 2x2 AGENCY COMPASS resolve.
 *
 * THE BEAT. The nation arrives as a diffuse cloud of dots, then — on
 * chapter:arrive — resolves into the four quadrants of the agency compass,
 * each cluster sized to its canonical deck share (17 / 28 / 27 / 28). A
 * keyboard-focusable legend lets the visitor isolate any one segment's
 * cluster; this is the marquee interaction that leads into the four
 * per-segment steps.
 *
 * Compass mapping (data/segments.json quadrant + dotField 0..1 space where
 * y=0 is the TOP of the field, so proactive sits high / low-y):
 *   architects  optimistic + proactive  -> top-right
 *   hustlers    pessimistic + proactive -> top-left
 *   coasters    optimistic + passive    -> bottom-right
 *   retreaters  pessimistic + passive   -> bottom-left
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 9-segments-intro.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="09-segments-intro">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival, prefersReducedMotion } from '../lib/experiential.js';
import { dotField, clusterPoints } from '../lib/charts.js';

/** Total dots in the field — one square per ~15 people, reading as a crowd. */
const DOT_COUNT = 100;

/** Per-quadrant placement rect in dotField 0..1 space (insets keep dots off
 *  the axis lines and the field edge so clusters read as four distinct masses). */
/* Clusters hug the INNER corner of each quadrant (toward the centre cross),
   leaving the OUTER corner of every cell free for its share label — so the
   dots can never sit under the "28% The Hustlers" text. */
const QUADRANTS = {
  hustlers:   { x: 0.15, y: 0.18, w: 0.31, h: 0.30 }, // top-left  (pessimistic, proactive)
  architects: { x: 0.54, y: 0.18, w: 0.31, h: 0.30 }, // top-right (optimistic, proactive)
  retreaters: { x: 0.15, y: 0.52, w: 0.31, h: 0.30 }, // bot-left  (pessimistic, passive)
  coasters:   { x: 0.54, y: 0.52, w: 0.31, h: 0.30 }, // bot-right (optimistic, passive)
};

/** Visual order for the legend / quadrant labels (matches the 2x2 grid rows). */
const GRID_ORDER = ['hustlers', 'architects', 'retreaters', 'coasters'];

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export default function init(rootEl, data) {
  // Always wire the arrival signature so the title/cluster re-assemble on
  // every visit, even if data is unexpectedly missing (fail soft).
  let resolveField = () => {};
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail);
    resolveField();
  });

  const segments = data && data.segments;
  if (!segments || !Array.isArray(segments.segments)) return;

  const byId = new Map(segments.segments.map((s) => [s.id, s]));
  const navy = cssVar('--navy', '#041654');
  const yellow = cssVar('--yellow', '#F0CB08');

  // Allocate dots to each quadrant proportional to its canonical share.
  // Largest remainder so the four counts sum to exactly DOT_COUNT.
  const shares = GRID_ORDER.map((id) => ({ id, share: byId.get(id)?.sharePct ?? 0 }));
  const totalShare = shares.reduce((sum, s) => sum + s.share, 0) || 100;
  const raw = shares.map((s) => ({ id: s.id, exact: (s.share / totalShare) * DOT_COUNT }));
  const counts = raw.map((r) => ({ id: r.id, n: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
  let assigned = counts.reduce((sum, c) => sum + c.n, 0);
  counts.sort((a, b) => b.frac - a.frac);
  for (let i = 0; assigned < DOT_COUNT; i += 1, assigned += 1) counts[i % counts.length].n += 1;
  const countById = new Map(counts.map((c) => [c.id, c.n]));

  // Build the per-dot target list: a jittered cluster per quadrant, navy by
  // default. We record each dot's owning segment so the legend can isolate it.
  const targets = [];
  const ownerOf = []; // segment id per dot index
  GRID_ORDER.forEach((id) => {
    const pts = clusterPoints(countById.get(id) || 0, QUADRANTS[id]);
    pts.forEach((p) => {
      targets.push({ x: p.x, y: p.y, colour: navy });
      ownerOf.push(id);
    });
  });

  const fieldHost = rootEl.querySelector('[data-segments-field]');
  if (!fieldHost) return;

  const field = dotField(fieldHost, {
    count: DOT_COUNT,
    dotRadius: 5,
    ariaLabel: 'One hundred squares resolving into four segment clusters',
  });

  // Diffuse cloud until the resolve fires (cinematic on-arrival).
  field.drift(0.6);

  let resolved = false;
  resolveField = () => {
    if (resolved) return;
    resolved = true;
    // A gentle spring so the four clusters glide (not snap) into formation.
    field.formation(targets, { spring: 0.018, jostle: 0.00004 });
  };
  // Reduced motion: the field jump-cuts to the formation immediately.
  if (prefersReducedMotion()) resolveField();

  // Re-tint the field to spotlight one segment's dots (others fade back).
  const DIMMED = 'rgba(4,22,84,0.16)';
  const colourFor = (owner, focusId) => {
    if (!focusId) return navy;          // no focus -> all navy
    if (owner === focusId) return yellow; // the chosen segment glows
    return DIMMED;                       // the rest recede
  };
  const spotlight = (focusId) => {
    const tinted = targets.map((t, i) => ({
      x: t.x, y: t.y, colour: colourFor(ownerOf[i], focusId),
    }));
    field.formation(tinted, { spring: 0.022, jostle: 0.00004 });
  };

  // Quadrant labels on the compass — segment name + share, low in each cell.
  const quadHost = rootEl.querySelector('[data-segments-quads]');
  if (quadHost) {
    GRID_ORDER.forEach((id) => {
      const seg = byId.get(id);
      if (!seg) return;
      const cell = document.createElement('div');
      cell.className = `segments-intro-quad segments-intro-quad--${id}`;
      cell.innerHTML =
        `<span class="segments-intro-quad-share num">${seg.sharePct}%</span>` +
        `<span class="segments-intro-quad-name">${seg.name}</span>`;
      quadHost.append(cell);
    });
  }

  // Keyboard-focusable legend — hover/focus isolates a cluster, leave restores.
  const legendHost = rootEl.querySelector('[data-segments-legend]');
  if (legendHost) {
    GRID_ORDER.forEach((id) => {
      const seg = byId.get(id);
      if (!seg) return;
      const li = document.createElement('li');
      li.className = `segments-intro-leg segments-intro-leg--${id}`;
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.setAttribute('aria-label',
        `${seg.name}: ${seg.sharePct} per cent. ${seg.threeWordDescriptor}`);
      li.innerHTML =
        `<span class="segments-intro-leg-swatch" aria-hidden="true"></span>` +
        `<span class="segments-intro-leg-body">` +
          `<span class="segments-intro-leg-name">${seg.name}` +
            `<span class="segments-intro-leg-share num">${seg.sharePct}%</span></span>` +
          `<span class="segments-intro-leg-desc">${seg.threeWordDescriptor}</span>` +
        `</span>`;
      const on = () => { if (resolved) spotlight(id); };
      const off = () => { if (resolved) spotlight(null); };
      li.addEventListener('pointerenter', on);
      li.addEventListener('pointerleave', off);
      li.addEventListener('focus', on);
      li.addEventListener('blur', off);
      legendHost.append(li);
    });
  }

  // Advisory hint on this step's marquee interaction; never blocks Next.
  if (data.journey) data.journey.gate();
  const markReady = () => { if (data.journey) data.journey.ready(); };
  legendHost?.addEventListener('pointerenter', markReady, { once: true });
  legendHost?.addEventListener('focusin', markReady, { once: true });

  // The shell dispatches only chapter:arrive; the field's own
  // IntersectionObserver pauses the sim whenever this stage is off-screen, so
  // no destroy hook is needed (one running canvas at the focused step max).
}
