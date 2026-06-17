/**
 * Step 16 — The data explorer. The explore-everything moment: the WHOLE survey,
 * richly browsable. Three controls drive one morphing chart:
 *   1. THE QUESTION  — every survey block, every segment metric, every TGI cut.
 *   2. WHICH BRITAIN — All (national) or one of the four segments.
 *   3. VIEW IT AS    — the SAME numbers five ways: Bars · Lollipop · Dot · Waffle
 *                      · Venn. The chooser is the spectacle; the data re-forms.
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
import {
  horizontalBars, lollipopChart, dotPlot, waffleGrid,
} from '../lib/charts.js';
import { vennDiagram } from '../lib/venn.js';
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
const NATIONAL_NOTE = 'National figure · all 1,504 respondents.';
const MAX_ITEMS = 8; // keep every label legible — never overcrowd the cream

/* The five views — the chooser. Each renders the SAME resolved items.
 * `value` is the contract pillGroup reads (NOT `id`). */
const VIEWS = [
  { value: 'bars', label: 'Bars' },
  { value: 'lollipop', label: 'Lollipop' },
  { value: 'dotplot', label: 'Dot plot' },
  { value: 'waffle', label: 'Waffle' },
  { value: 'venn', label: 'Venn' },
];

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

/* ── waffle (all options) — small multiples: one N-in-100 grid per option ──
 * Most explorer questions are multi-select (options do NOT sum to 100), so a
 * single split 100-square waffle would be dishonest. We render a tile per
 * option: each its own 100-square grid filled to that option's %, figure +
 * label beneath. Reads as "x in 100" per answer, and fills the hero space. */
const drawWaffleAll = (host, metric, items) => {
  const rows = (items.length ? items : NO_DATA).slice(0, MAX_ITEMS);
  const wrap = document.createElement('div');
  wrap.className = 'pg-waffle-all';
  wrap.style.setProperty('--pg-waffle-count', String(rows.length));

  rows.forEach((item) => {
    const tile = document.createElement('figure');
    tile.className = 'pg-waffle-tile';

    const gridHost = document.createElement('div');
    gridHost.className = 'pg-waffle-grid';
    tile.append(gridHost);

    const grid = waffleGrid(gridHost, {
      value: item.pct,
      total: 100,
      accent: 'navy',
      // Tighter cells than the default (26/6): the small-multiple grid must
      // stay compact so the whole tile field fits the chart band height-wise.
      square: 16,
      gap: 3,
      ariaLabel: `${item.label}: ${Math.round(item.pct)} in 100`,
    });
    grid.setValue(item.pct);

    const cap = document.createElement('figcaption');
    cap.className = 'pg-waffle-tile-cap';
    const num = document.createElement('span');
    num.className = 'pg-waffle-tile-num';
    num.textContent = `${item.pct.toLocaleString('en-GB', {
      minimumFractionDigits: metric.decimals,
      maximumFractionDigits: metric.decimals,
    })}%`;
    const lab = document.createElement('span');
    lab.className = 'pg-waffle-tile-lab';
    lab.textContent = item.label;
    cap.append(num, lab);
    tile.append(cap);

    wrap.append(tile);
  });

  host.append(wrap);
};

/* ── view dispatch — render the SAME items five ways ─────────────────────── */

/* Tighten the axis to the data so bars/dots fill the track instead of leaving
 * a wide empty right margin. Round UP to a clean 10 above the largest value,
 * clamped to [40, 100], so dot-plot quarter ticks stay tidy. */
const axisMaxFor = (items) => {
  const top = items.reduce((m, i) => Math.max(m, i.pct || 0), 0);
  if (top >= 90) return 100;
  return Math.min(100, Math.max(40, Math.ceil((top + 6) / 10) * 10));
};

const drawView = (host, viewId, metric, items) => {
  const rows = (items.length ? items : NO_DATA).slice(0, MAX_ITEMS);
  const common = { accent: 'navy', decimals: metric.decimals, ariaLabel: metric.label };
  const axisMax = axisMaxFor(rows);

  if (viewId === 'bars') {
    // Commanding HERO bars: the viewBox height is items × (barHeight + gap), so
    // taller rows make the SVG's natural aspect ratio tall enough to fill the
    // hero band at full width (the SVG renders at width:100%). Row height scales
    // DOWN as the item count grows so a long list still fits the band cleanly.
    const n = rows.length;
    const barHeight = n <= 4 ? 104 : n <= 6 ? 78 : 60;
    const gap = n <= 4 ? 52 : n <= 6 ? 40 : 30;
    horizontalBars(host, {
      items: rows, max: axisMax, labelWidth: 272, barHeight, gap, ...common,
    });
    return;
  }
  if (viewId === 'lollipop') {
    lollipopChart(host, { items: rows, max: axisMax, ...common });
    return;
  }
  if (viewId === 'dotplot') {
    dotPlot(host, { items: rows, max: axisMax, ...common });
    return;
  }
  if (viewId === 'waffle') {
    // ALL options as small-multiple waffles — every answer as N-in-100.
    drawWaffleAll(host, metric, items);
    return;
  }
  // venn — the top up-to-four responses as overlap circles, sized by share.
  // Brand: show the % of segment only; no TGI index numbers.
  const sets = rows.slice(0, 4).map((r) => ({
    id: r.id,
    label: r.label,
    value: `${r.pct.toFixed(metric.decimals)}%`,
    sub: '',
  }));
  if (sets.length < 2) {
    const p = document.createElement('p');
    p.className = 'pg-waffle-cap';
    p.textContent = 'Not enough responses to overlap.';
    host.append(p);
    return;
  }
  const lead = readoutFor(metric, items);
  vennDiagram(host, {
    sets,
    orbit: 118,
    radius: 150,
    centre: { label: 'leads', value: `${lead.value.toFixed(metric.decimals)}%`, sub: tidyLabel(lead.label) },
    ariaLabel: `${metric.label}: top responses as overlapping shares`,
  });
};

/* ── The explorer (the whole step) ───────────────────────────────────────── */

const FADE_MS = 220;

const initExplorer = (rootEl, dataSets, onChange) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const viewHost = rootEl.querySelector('[data-pg-view-pills]');
  const noteEl = rootEl.querySelector('[data-pg-note]');
  const numEl = rootEl.querySelector('[data-pg-readout-num]');
  const unitEl = rootEl.querySelector('[data-pg-readout-unit]');
  const lineEl = rootEl.querySelector('[data-pg-readout-line]');
  const kickerEl = rootEl.querySelector('[data-pg-readout-kicker]');
  if (!chartHost || !metricHost || !segmentHost || !viewHost) return;

  const reduced = prefersReducedMotion();
  const state = { metric: METRICS[0], segment: ALL_SEGMENTS, view: VIEWS[0].value };
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
    const { items, note } = resolveItems(state, dataSets);
    const build = () => {
      chartHost.replaceChildren();
      drawView(chartHost, state.view, state.metric, items);
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
      const disabled = (isSurvey && !isAll) || (isTgi && isAll);
      chip.disabled = disabled;
      chip.setAttribute('aria-disabled', String(disabled));
    });

    // Then move the selection to a valid value for the new metric kind.
    if (isSurvey && state.segment !== ALL_SEGMENTS) {
      state.segment = ALL_SEGMENTS;
      group.setValue(ALL_SEGMENTS);
    }
    if (isTgi && state.segment === ALL_SEGMENTS) {
      state.segment = 'architects';
      group.setValue('architects');
    }
  };

  const segmentGroup = pillGroup(segmentHost, {
    options: [
      { value: ALL_SEGMENTS, label: 'All' },
      ...SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
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

  pillGroup(viewHost, {
    options: VIEWS,
    value: state.view,
    ariaLabel: 'Choose how to view the data',
    onChange: (value) => {
      state.view = value;
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
