/**
 * Step 16 — The data explorer. The explore-everything moment: the WHOLE survey,
 * richly browsable. Two controls drive one lollipop chart:
 *   1. THE QUESTION  — every survey block, every segment metric, every TGI cut.
 *   2. WHICH BRITAIN — All (national) or one of the four segments.
 * Every cut renders the SAME way: a lollipop (navy stem + navy marker), so the
 * read is consistent and the controls — not a view chooser — are the spectacle.
 *
 * THE DISPLAY MOMENT — the masthead FIGURE (the leading value of the current cut)
 * counts to its new value on every change. The number is the headline; the chart
 * is its supporting form.
 *
 * HONEST LABELS — every figure traces to data/survey.json, data/segments.json or
 * data/tgi.json. Survey/segment metrics chart % (penetration). TGI cuts chart the
 * % of that segment giving the response, with the index (vs UK average) named in
 * the read-out line. Deck segment sizes (17/28/27/28) label the chips.
 *
 * GATING: Next stays soft-hinted until the first change; that fires journey.ready()
 * once. Never traps (Next frees after dwell).
 *
 * @param {HTMLElement} rootEl - <section class="journey-step" id="16-data-explorer">
 * @param {{survey:object, segments:object, tgi:object, journey?:object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { lollipopChart } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';
import { countUp } from '../lib/counter.js';
import { arrival, prefersReducedMotion } from '../lib/experiential.js';

/* Deck-canonical segment sizes — always displayed, never derived. */
const SEGMENT_ORDER = [
  { id: 'architects', label: 'Architects', sharePct: 17 },
  { id: 'hustlers', label: 'Hustlers', sharePct: 28 },
  { id: 'coasters', label: 'Coasters', sharePct: 27 },
  { id: 'retreaters', label: 'Retreaters', sharePct: 28 },
];
const SEGMENT_BY_ID = Object.fromEntries(SEGMENT_ORDER.map((s) => [s.id, s]));

const ALL_SEGMENTS = 'all';
const COMPARE = 'compare'; // "All four" — the 4 segments plotted together
const NATIONAL_NOTE = 'National figure · all 1,504 respondents.';
const COMPARE_NOTE = 'All four segments compared · % giving each answer.';
const MAX_ITEMS = 8; // keep every label legible — never overcrowd the cream

/* Distinct marker colour per segment for the "All four" comparison plot. */
const SEG_COLORS = {
  architects: '#041654', // navy
  hustlers: '#FF8598',   // coral
  coasters: '#FFA764',   // orange
  retreaters: '#F0CB08', // yellow
};

/* Metric registry — the FULL survey, exposed. No numbers live here, only the
 * path into verified data:
 *  - 'segment' : segments.json metrics[<metricKey>]; national from metricsTotals.
 *  - 'survey'  : a national-only block in survey.json (no segment split).
 *  - 'tgi'     : data/tgi.json per-segment cut. Segment-only; carries an index.
 * `sortDesc` (segment/survey) ranks the chart largest-first so the eye lands on
 * the lead; TGI cuts keep their index sort (most distinctive first). */
const METRICS = [
  // ── Segment metrics: sliceable by which Britain ──
  { id: 'finance', label: 'Financial position', kind: 'segment', metricKey: 'financialPosition', decimals: 1, sortDesc: true },
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', decimals: 1, sortDesc: true },
  { id: 'forward', label: 'Forward mindset', kind: 'segment', metricKey: 'forwardMindset', decimals: 1, sortDesc: true },
  { id: 'essentials', label: 'What counts as essential', kind: 'segment', metricKey: 'essentials', decimals: 1, sortDesc: true },
  { id: 'firstToCut', label: 'First to cut', kind: 'segment', metricKey: 'firstToCut', decimals: 1, sortDesc: true },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', decimals: 1, sortDesc: true },
  { id: 'control', label: 'Taking control', kind: 'segment', metricKey: 'personalControlBehaviours', decimals: 1, sortDesc: true },
  { id: 'selfManage', label: 'Self-managing life', kind: 'segment', metricKey: 'selfManagement', decimals: 1, sortDesc: true },
  { id: 'aiTasks', label: 'AI instead of a pro', kind: 'segment', metricKey: 'aiUseByTask', decimals: 1, sortDesc: true },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', decimals: 1, sortDesc: true },
  // ── Survey-only: national figures, no segment split ──
  { id: 'mood', label: 'How the nation feels', kind: 'survey', surveyKey: 'moodOfNation', decimals: 1, sortDesc: true },
  { id: 'moneyMoves', label: 'Money-saving moves', kind: 'survey', surveyKey: 'moneySavingMoves', decimals: 1, sortDesc: true },
  { id: 'tradeCat', label: 'Where Britain traded down', kind: 'survey', surveyKey: 'tradingDownByCategory', decimals: 1, sortDesc: true },
  { id: 'protected', label: 'Protected spend', kind: 'survey', surveyKey: 'protectedSpend', decimals: 1, sortDesc: true },
  { id: 'availability', label: 'Availability worries', kind: 'survey', surveyKey: 'availabilityConcerns', decimals: 1, sortDesc: true },
  { id: 'confidence', label: 'Institutional confidence', kind: 'survey', surveyKey: 'institutionTrust', decimals: 1, sortDesc: true },
  { id: 'decline', label: 'Seen as declining', kind: 'survey', surveyKey: 'institutionDecline', decimals: 1, sortDesc: true },
  { id: 'aiNational', label: 'AI by task (national)', kind: 'survey', surveyKey: 'aiTasks', decimals: 1, sortDesc: true },
  // ── TGI cuts: segment-only fingerprints, carry an index vs UK ──
  { id: 'tgiLifestyle', label: 'TGI · lifestyle', kind: 'tgi', tgiCut: 'lifestyle', decimals: 1 },
  { id: 'tgiMedia', label: 'TGI · media', kind: 'tgi', tgiCut: 'media', decimals: 1 },
  { id: 'tgiDemo', label: 'TGI · demographics', kind: 'tgi', tgiCut: 'demographics', decimals: 1 },
];

const NO_DATA = [{ id: 'none', label: 'No data', pct: 0 }];

/* DOCUMENTED CROSSTAB LABEL BUG (STORY.md): the mindsetNetAgree row stored as
 * "Optimistic about next decade" (77.3) is actually Q2r3 — "more careful with
 * money". Show the verified label; no value changed. */
const LABEL_FIX = {
  mindsetNetAgree: { 'Optimistic about next decade': 'More careful with money than 5 yrs ago' },
};
const fixLabel = (metricKey, label) => LABEL_FIX[metricKey]?.[label] || label;

/* Strip the deck's curly-quote wrapping from long TGI statements so labels
 * stay tight, and clamp to a legible length (no mid-word cut — append "…"). */
const tidyLabel = (label) => {
  const s = String(label).replace(/^[“"]|[”"]$/g, '').trim();
  return s.length > 38 ? `${s.slice(0, 37).trimEnd()}…` : s;
};

/* ── helpers: turn verified data into [{id,label,pct,index?}] ────────────── */

const toItems = (pairs, metricKey) =>
  pairs.map(([label, pct], i) => ({ id: `r${i}`, label: fixLabel(metricKey, label), pct }));

const nationalSegmentItems = (segments, metric) => {
  const totals = segments.meta?.metricsTotals?.[metric.metricKey];
  return totals ? toItems(Object.entries(totals), metric.metricKey) : [];
};

const oneSegmentItems = (segments, metric, segmentId) => {
  const seg = segments.segments?.find((s) => s.id === segmentId);
  const block = seg?.metrics?.[metric.metricKey];
  if (!block) return [];
  return toItems(
    Object.entries(block).map(([label, v]) => [label, typeof v === 'number' ? v : v.pct]),
    metric.metricKey,
  );
};

/* "All four" — align every segment's value to a shared, nationally-ordered set
 * of answer rows so the four markers sit on one comparable track per answer. */
const compareGroups = (segments, metric) => {
  const order = sortItems(nationalSegmentItems(segments, metric), metric);
  const perSeg = Object.fromEntries(
    SEGMENT_ORDER.map((s) => [
      s.id,
      Object.fromEntries(oneSegmentItems(segments, metric, s.id).map((it) => [it.label, it.pct])),
    ]),
  );
  return order.map((row, i) => ({
    id: `c${i}`,
    label: row.label,
    values: SEGMENT_ORDER.map((s) => ({
      seg: s.id,
      segLabel: s.label,
      pct: perSeg[s.id]?.[row.label] ?? 0,
      color: SEG_COLORS[s.id],
    })),
  }));
};

/* Survey-only blocks. Most are { items:[{id,label,pct}] }; a few carry a
 * different value key (confidence ranking, performance decline), normalised
 * here so the chart always reads `pct`. */
const surveyMetricItems = (survey, metric) => {
  // Both confidence + decline live INSIDE the institutionTrust block.
  if (metric.surveyKey === 'institutionTrust') {
    const rows = survey.institutionTrust?.confidenceRanking?.items || [];
    return rows.map((r) => ({ id: r.id, label: r.label, pct: r.pctConfident }));
  }
  if (metric.surveyKey === 'institutionDecline') {
    const rows = survey.institutionTrust?.performanceChange?.items || [];
    return rows.map((r) => ({ id: r.id, label: r.label, pct: r.pctDeclined }));
  }
  const block = survey[metric.surveyKey];
  if (!block) return [];
  return (block.items || []).map((r) => ({ id: r.id, label: r.label, pct: r.pct }));
};

/* TGI cut for one segment: the distinctive statements (highest-indexing first).
 * pct = % of that segment giving the response; index = vs UK adults (100 = avg). */
const tgiItems = (tgi, metric, segmentId) => {
  const seg = tgi.segments?.[segmentId];
  if (!seg) return [];
  const rows = metric.tgiCut === 'demographics'
    ? (seg.demographics?.skews || [])
    : (seg[metric.tgiCut] || []);
  return rows
    .filter((r) => typeof r.pct === 'number')
    .map((r, i) => ({ id: `t${i}`, label: tidyLabel(r.label), pct: r.pct, index: r.index }))
    .sort((a, b) => (b.index || 0) - (a.index || 0));
};

/* ── view resolution — items + read-out figure + honest note ─────────────── */

const sortItems = (items, metric) => {
  if (metric.kind === 'tgi') return items; // already index-sorted
  return metric.sortDesc ? items.slice().sort((a, b) => b.pct - a.pct) : items;
};

const resolveItems = (state, { survey, segments, tgi }) => {
  const { metric, segment } = state;
  if (metric.kind === 'survey') {
    return { items: sortItems(surveyMetricItems(survey, metric), metric), note: NATIONAL_NOTE };
  }
  if (metric.kind === 'tgi') {
    const seg = segment === ALL_SEGMENTS ? 'architects' : segment;
    const s = SEGMENT_BY_ID[seg];
    return {
      items: tgiItems(tgi, metric, seg),
      note: `${s.label} · TGI ${metric.tgiCut} · % of segment, index vs UK average.`,
    };
  }
  if (segment === COMPARE) {
    return {
      groups: compareGroups(segments, metric),
      items: sortItems(nationalSegmentItems(segments, metric), metric), // drives the masthead readout
      note: COMPARE_NOTE,
    };
  }
  if (segment === ALL_SEGMENTS) {
    return { items: sortItems(nationalSegmentItems(segments, metric), metric), note: NATIONAL_NOTE };
  }
  const s = SEGMENT_BY_ID[segment];
  return {
    items: sortItems(oneSegmentItems(segments, metric, segment), metric),
    note: `${s.label} only · ${s.sharePct}% of the nation.`,
  };
};

/** The single defining figure for the chart on screen — the leading item.
 * TGI cuts lead with the most-distinctive (highest-index, already first);
 * everything else leads with the largest share (items are sorted desc). */
const readoutFor = (metric, items) => {
  if (!items.length) return { value: 0, label: '', index: null };
  const lead = items[0];
  return { value: lead.pct, label: lead.label, index: lead.index ?? null };
};

/* ── view — every cut rendered as ONE lollipop chart ─────────────────────── */

/* Tighten the axis to the data so the stems fill the track instead of leaving
 * a wide empty right margin. Round UP to a clean 10 above the largest value,
 * clamped to [40, 100]. */
const axisMaxFor = (items) => {
  const top = items.reduce((m, i) => Math.max(m, i.pct || 0), 0);
  if (top >= 90) return 100;
  return Math.min(100, Math.max(40, Math.ceil((top + 6) / 10) * 10));
};

const drawView = (host, metric, items) => {
  const rows = (items.length ? items : NO_DATA).slice(0, MAX_ITEMS);
  lollipopChart(host, {
    items: rows,
    max: axisMaxFor(rows),
    accent: 'navy',
    decimals: metric.decimals,
    ariaLabel: metric.label,
  });
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* "All four" — a connected dot plot: one row per answer, the four segments as
 * colour-coded markers on a shared track with a thin line linking lowest to
 * highest, so the eye reads both each segment's level AND the spread between
 * them. A legend maps colour to segment. All lollipop heads, no bars/venn. */
const drawCompareView = (host, metric, groups) => {
  const rows = (groups.length ? groups : []).slice(0, MAX_ITEMS);
  const max = axisMaxFor(rows.flatMap((r) => r.values));

  // Legend — colour key for the four segments.
  const legend = document.createElement('div');
  legend.className = 'pg-compare-legend';
  SEGMENT_ORDER.forEach((s) => {
    const item = document.createElement('span');
    item.className = 'pg-compare-legend__item';
    item.innerHTML =
      `<span class="pg-compare-legend__dot" style="background:${SEG_COLORS[s.id]}"></span>` +
      `${s.label}`;
    legend.appendChild(item);
  });
  host.appendChild(legend);

  const rowH = 46;
  const padL = 250;
  const padR = 56;
  const padT = 6;
  const w = 960;
  const h = Math.max(1, rows.length) * rowH + padT;
  const xMax = w - padR;
  const x = (p) => padL + (xMax - padL) * (Math.max(0, Math.min(p, max)) / max);

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('class', 'pg-compare');
  svg.setAttribute('role', 'img');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('aria-label', `${metric.label} compared across the four segments`);

  const mk = (tag, attrs) => {
    const el = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    return el;
  };

  rows.forEach((row, i) => {
    const cy = padT + i * rowH + rowH / 2;
    const lab = mk('text', { x: padL - 16, y: cy, class: 'pg-compare__label', 'text-anchor': 'end', 'dominant-baseline': 'middle' });
    lab.textContent = tidyLabel(row.label);
    svg.appendChild(lab);
    svg.appendChild(mk('line', { x1: padL, x2: xMax, y1: cy, y2: cy, class: 'pg-compare__track' }));
    const xs = row.values.map((v) => x(v.pct));
    svg.appendChild(mk('line', { x1: Math.min(...xs), x2: Math.max(...xs), y1: cy, y2: cy, class: 'pg-compare__conn' }));
    row.values.forEach((v) => {
      const dot = mk('circle', { cx: x(v.pct), cy, r: 7.5, fill: v.color, class: 'pg-compare__dot' });
      const t = document.createElementNS(SVG_NS, 'title');
      t.textContent = `${v.segLabel}: ${v.pct}%`;
      dot.appendChild(t);
      svg.appendChild(dot);
    });
  });
  host.appendChild(svg);
};

/* ── The explorer (the whole step) ───────────────────────────────────────── */

const FADE_MS = 220;

const initExplorer = (rootEl, dataSets, onChange) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const noteEl = rootEl.querySelector('[data-pg-note]');
  const numEl = rootEl.querySelector('[data-pg-readout-num]');
  const unitEl = rootEl.querySelector('[data-pg-readout-unit]');
  const lineEl = rootEl.querySelector('[data-pg-readout-line]');
  const kickerEl = rootEl.querySelector('[data-pg-readout-kicker]');
  if (!chartHost || !metricHost || !segmentHost) return;

  const reduced = prefersReducedMotion();
  const state = { metric: METRICS[0], segment: ALL_SEGMENTS };
  let lastFigure = 0;
  let started = false; // first paint = jump-cut; later = count

  const paintReadout = (items, note) => {
    if (noteEl) noteEl.textContent = note;
    const { value, label } = readoutFor(state.metric, items);
    if (kickerEl) {
      kickerEl.textContent = state.metric.kind === 'tgi' ? 'Most distinctive' : 'The leading answer';
    }
    if (numEl) {
      if (started && !reduced) {
        countUp(numEl, { from: lastFigure, to: value, decimals: state.metric.decimals, durationMs: 700 });
      } else {
        numEl.textContent = value.toLocaleString('en-GB', {
          minimumFractionDigits: state.metric.decimals,
          maximumFractionDigits: state.metric.decimals,
        });
      }
    }
    if (unitEl) unitEl.textContent = '%';
    // Brand: name the answer only; no TGI index numbers in the read line.
    if (lineEl) lineEl.textContent = label;
    lastFigure = value;
  };

  const paint = ({ crossfade = false } = {}) => {
    const { items, note, groups } = resolveItems(state, dataSets);
    const build = () => {
      chartHost.replaceChildren();
      if (groups) drawCompareView(chartHost, state.metric, groups);
      else drawView(chartHost, state.metric, items);
    };
    if (crossfade && !reduced) {
      chartHost.classList.add('is-fading');
      window.setTimeout(() => {
        build();
        requestAnimationFrame(() => chartHost.classList.remove('is-fading'));
      }, FADE_MS);
    } else {
      build();
    }
    paintReadout(items, note);
  };

  // First paint (jump-cut), then enable counting.
  paint();
  started = true;

  // Segment pills: TGI cuts are segment-only, so "All" is invalid for them.
  // Non-segment surveys grey the four segment chips (national-only).
  const syncSegmentAvailability = (group) => {
    const isTgi = state.metric.kind === 'tgi';
    const isSurvey = state.metric.kind === 'survey';

    // Enable/disable FIRST — a disabled chip's click() is a no-op.
    group.el.querySelectorAll('.pillgroup-chip').forEach((chip) => {
      const isAll = chip.dataset.value === ALL_SEGMENTS;
      const isCompare = chip.dataset.value === COMPARE;
      // Compare + per-segment cuts need a segment split: invalid for national-only
      // survey blocks and for TGI (its statements differ per segment, so they do
      // not align into one comparison).
      const disabled = (isSurvey && !isAll) || (isTgi && (isAll || isCompare));
      chip.disabled = disabled;
      chip.setAttribute('aria-disabled', String(disabled));
    });

    // Then move the selection to a valid value for the new metric kind.
    if (isSurvey && state.segment !== ALL_SEGMENTS) {
      state.segment = ALL_SEGMENTS;
      group.setValue(ALL_SEGMENTS);
    }
    if (isTgi && (state.segment === ALL_SEGMENTS || state.segment === COMPARE)) {
      state.segment = 'architects';
      group.setValue('architects');
    }
  };

  const segmentGroup = pillGroup(segmentHost, {
    options: [
      { value: ALL_SEGMENTS, label: 'All' },
      ...SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
      { value: COMPARE, label: 'All four' },
    ],
    value: ALL_SEGMENTS,
    ariaLabel: 'Filter by which Britain',
    onChange: (value) => {
      state.segment = value;
      paint({ crossfade: true });
      onChange?.();
    },
  });

  pillGroup(metricHost, {
    options: METRICS.map((m) => ({ value: m.id, label: m.label })),
    value: state.metric.id,
    ariaLabel: 'Choose a question or TGI cut',
    onChange: (value) => {
      state.metric = METRICS.find((m) => m.id === value) || METRICS[0];
      syncSegmentAvailability(segmentGroup);
      paint({ crossfade: true });
      onChange?.();
    },
  });

  syncSegmentAvailability(segmentGroup);
};

export default function init(rootEl, data) {
  const { survey, segments, tgi, journey } = data || {};
  if (!survey || !segments || !tgi) return; // fail soft — the explorer needs all three.
  observeReveals(rootEl);

  arrival(rootEl);
  rootEl.addEventListener('chapter:arrive', () => arrival(rootEl));

  journey?.gate?.();
  let hasInteracted = false;
  const onChange = () => {
    if (hasInteracted) return;
    hasInteracted = true;
    journey?.ready?.();
  };

  initExplorer(rootEl, { survey, segments, tgi }, onChange);
}
