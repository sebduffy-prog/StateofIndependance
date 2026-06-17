/**
 * Step 16 — The data explorer (TGI on demand). ONE instrument: the same data,
 * FIVE ways, on demand.
 *
 * THE FOCAL POINT — a single morphing chart on the open cream ground. THREE quiet
 * square controls drive it:
 *   1. THE QUESTION  — a survey/segment metric, OR a TGI cut (lifestyle / media /
 *                      demographics distinctiveness, from data/tgi.json).
 *   2. WHICH BRITAIN — All (national) or one of the four segments. TGI cuts are
 *                      segment-only, so the segment pills steer which Britain's
 *                      TGI fingerprint you read.
 *   3. THE VIEW      — FIVE ways to view the SAME numbers: Bars · Lollipop ·
 *                      Dot plot · Waffle · Venn. The chooser is the spectacle:
 *                      the data re-forms, buttery, into a new shape on demand.
 *
 * THE DISPLAY MOMENT — the live read-out FIGURE (the leading value of the current
 * cut) sits at display scale on the left rail and COUNTS to its new value on every
 * change. The number is the headline; the chart is its supporting form.
 *
 * HONEST LABELS — every figure traces to data/survey.json, data/segments.json or
 * data/tgi.json. Survey/segment metrics chart % (penetration). TGI cuts chart the
 * % of that segment giving the response, with the TGI index (vs UK average) named
 * in the read-out line so over-/under-indexing is never hidden. Deck segment sizes
 * (17/28/27/28) label the chips; nothing is typed by hand.
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
const MAX_ITEMS = 7; // keep every label legible — never overcrowd the cream

/* The five views — the chooser. Each renders the SAME resolved items.
 * `value` is the contract pillGroup reads (NOT `id`). */
const VIEWS = [
  { value: 'bars', label: 'Bars' },
  { value: 'lollipop', label: 'Lollipop' },
  { value: 'dotplot', label: 'Dot plot' },
  { value: 'waffle', label: 'Waffle' },
  { value: 'venn', label: 'Venn' },
];

/* Metric registry. No numbers live here — only the path into verified data.
 *  - 'segment' : segments.json metrics[<metricKey>]; national from metricsTotals.
 *  - 'survey'  : a national-only block in survey.json (no segment split).
 *  - 'tgi'     : data/tgi.json per-segment cut (lifestyle | media | demoSkews).
 *                Segment-only; carries an over-/under-index vs the UK average. */
const METRICS = [
  { id: 'finance', label: 'Financial position', kind: 'segment', metricKey: 'financialPosition', decimals: 1 },
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', decimals: 1 },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', decimals: 1 },
  { id: 'aiTasks', label: 'AI instead of a pro', kind: 'segment', metricKey: 'aiUseByTask', decimals: 1 },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', decimals: 1 },
  { id: 'moneyMoves', label: 'Money-saving moves', kind: 'survey', surveyKey: 'moneySavingMoves', decimals: 1 },
  { id: 'protected', label: 'Protected spend', kind: 'survey', surveyKey: 'protectedSpend', decimals: 1 },
  { id: 'confidence', label: 'Institutional confidence', kind: 'survey', surveyKey: 'institutionTrust', decimals: 1 },
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
  return s.length > 34 ? `${s.slice(0, 33).trimEnd()}…` : s;
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

const surveyMetricItems = (survey, metric) => {
  const block = survey[metric.surveyKey];
  if (!block) return [];
  if (metric.surveyKey === 'institutionTrust') {
    const rows = block.confidenceRanking?.items || [];
    return rows.map((r) => ({ id: r.id, label: r.label, pct: r.pctConfident }));
  }
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

const resolveItems = (state, { survey, segments, tgi }) => {
  const { metric, segment } = state;
  if (metric.kind === 'survey') {
    return { items: surveyMetricItems(survey, metric), note: NATIONAL_NOTE };
  }
  if (metric.kind === 'tgi') {
    const seg = segment === ALL_SEGMENTS ? 'architects' : segment;
    const s = SEGMENT_BY_ID[seg];
    return {
      items: tgiItems(tgi, metric, seg),
      note: `${s.label} · TGI ${metric.tgiCut} · % of segment (index vs UK average).`,
    };
  }
  if (segment === ALL_SEGMENTS) {
    return { items: nationalSegmentItems(segments, metric), note: NATIONAL_NOTE };
  }
  const s = SEGMENT_BY_ID[segment];
  return {
    items: oneSegmentItems(segments, metric, segment),
    note: `${s.label} only · ${s.sharePct}% of the nation.`,
  };
};

/** The single defining figure for the chart on screen — the leading item.
 * TGI cuts are about DISTINCTIVENESS, so lead with the most-distinctive
 * (highest-index) statement, which is already first (items are index-sorted).
 * Everything else leads with the largest share. */
const readoutFor = (metric, items) => {
  if (!items.length) return { value: 0, label: '', index: null };
  const lead = metric.kind === 'tgi'
    ? items[0]
    : items.reduce((a, b) => (b.pct > a.pct ? b : a), items[0]);
  return { value: lead.pct, label: lead.label, index: lead.index ?? null };
};

/* ── view dispatch — render the SAME items five ways ─────────────────────── */

const drawView = (host, viewId, metric, items) => {
  const rows = (items.length ? items : NO_DATA).slice(0, MAX_ITEMS);
  const common = { accent: 'navy', decimals: metric.decimals, ariaLabel: metric.label };

  if (viewId === 'bars') {
    horizontalBars(host, { items: rows, max: 100, labelWidth: 248, ...common });
    return;
  }
  if (viewId === 'lollipop') {
    lollipopChart(host, { items: rows, max: 100, ...common });
    return;
  }
  if (viewId === 'dotplot') {
    dotPlot(host, { items: rows, max: 100, ...common });
    return;
  }
  if (viewId === 'waffle') {
    // The lead figure as N-in-100 — the same headline number, made tactile.
    const lead = readoutFor(metric, items);
    const grid = waffleGrid(host, { value: lead.value, total: 100, accent: 'navy', ariaLabel: `${lead.label}: ${lead.value} in 100` });
    grid.setValue(lead.value);
    const cap = document.createElement('p');
    cap.className = 'pg-waffle-cap';
    cap.textContent = lead.label ? `${lead.label} — ${Math.round(lead.value)} in 100` : '';
    host.append(cap);
    return;
  }
  // venn — the top up-to-four responses as overlap circles, sized by share.
  const sets = rows.slice(0, 4).map((r) => ({
    id: r.id,
    label: r.label,
    value: `${r.pct.toFixed(metric.decimals)}%`,
    sub: r.index != null ? `index ${r.index}` : '',
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

const FADE_MS = 240;

const initExplorer = (rootEl, dataSets, onChange) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const viewHost = rootEl.querySelector('[data-pg-view-pills]');
  const noteEl = rootEl.querySelector('[data-pg-note]');
  const numEl = rootEl.querySelector('[data-pg-readout-num]');
  const unitEl = rootEl.querySelector('[data-pg-readout-unit]');
  const lineEl = rootEl.querySelector('[data-pg-readout-line]');
  if (!chartHost || !metricHost || !segmentHost || !viewHost) return;

  const reduced = prefersReducedMotion();
  const state = { metric: METRICS[0], segment: ALL_SEGMENTS, view: VIEWS[0].value };
  let lastFigure = 0;
  let started = false; // first paint = jump-cut; later = count

  const paintReadout = (items, note) => {
    if (noteEl) noteEl.textContent = note;
    const { value, label, index } = readoutFor(state.metric, items);
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
    if (lineEl) {
      lineEl.textContent = index != null && label ? `${label} · index ${index}` : label;
    }
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

  // Segment pills: TGI cuts are segment-only, so "All" is invalid for them —
  // when a TGI metric is active, "All" is disabled and the cut defaults to the
  // current segment (or Architects). Non-segment surveys grey the whole group.
  const syncSegmentAvailability = (group) => {
    const isTgi = state.metric.kind === 'tgi';
    const isSurvey = state.metric.kind === 'survey';

    // Enable/disable FIRST — a disabled chip's click() is a no-op, so the
    // setValue() below would silently fail if we hadn't re-enabled the target.
    //   survey: national-only → keep "All" live, grey the four segments.
    //   tgi:    segment-only  → grey "All", keep the four segments live.
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
      paint();
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
