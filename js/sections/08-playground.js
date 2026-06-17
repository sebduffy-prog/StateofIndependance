/**
 * Chapter 08 — playground. ONE instrument: the data, beautifully, on demand.
 *
 * THE FOCAL POINT — "the divergence dial". A pillGroup of survey questions and a
 * second of segments drive ONE morphing chart. The viz TYPE is chosen by the
 * question so the picture is always the honest shape for the data:
 *   - binary split      -> tugOfWar      (groceries: traded vs held; divider SPRINGS)
 *   - composition split -> horizontalBars (financial position, trading down)
 *   - rankings / scores -> dotPlot        (mood, protected spend, trust)
 *   - magnitude ranking -> lollipopChart  (AI tasks, money moves)
 *   - signature ranking -> orbitRingChart (what people want from brands — the
 *                                          deck's "independence" orbit, as a chart)
 *
 * THE DISPLAY MOMENT — the live read-out FIGURE. The headline number for the
 * current cut (the defining figure of the chart on screen) sits at display
 * scale on the left rail and COUNTS to its new value on every filter change.
 * The number is the headline; the chart is its supporting form. This is the
 * step's "one memorable thing": the data resolving, beautifully, on demand.
 *
 * Everything that competed for the eye (a TGI panel, a segment portrait) is
 * cut. One instrument, one focal point, generous space.
 *
 * GATING: Next stays soft-locked until the first filter change in the dial;
 * that change fires journey.ready() once. Never traps (Next frees after dwell).
 *
 * Every number traces to data/survey.json or data/segments.json. Nothing typed
 * by hand. Deck segment sizes (17/28/27/28) label the chips.
 *
 * @param {HTMLElement} rootEl - <section class="journey-step" id="08-playground">
 * @param {{survey: object, segments: object, journey?: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import {
  horizontalBars, lollipopChart, dotPlot, tugOfWar, orbitRingChart,
} from '../lib/charts.js';
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

const ALL_SEGMENTS = 'all';
const NATIONAL_NOTE = 'National figure · all 1,504 respondents · no segment split for this question.';

/* Metric registry. No numbers live here — only the path into the verified data.
 *  - kind 'segment': segments.json metrics[<metricKey>]; national from metricsTotals.
 *  - kind 'binary' : one row shown as a two-way split (held = 100 - traded).
 *  - kind 'survey' : a national-only block in survey.json (no segment split).
 *  - readout       : how the live headline FIGURE is read from the resolved view.
 *      'binaryTraded' = the traded side; 'lead' = the leading item's pct. */
const METRICS = [
  { id: 'groceries', label: 'Trading down: groceries', kind: 'binary', metricKey: 'tradedDown12Months', row: 'Groceries', leftLabel: 'Traded down', rightLabel: 'Held basket', viz: 'tug', decimals: 0, max: 100, readout: 'binaryTraded' },
  { id: 'finance', label: 'Financial position', kind: 'segment', metricKey: 'financialPosition', viz: 'bars', decimals: 1, max: 100, readout: 'lead' },
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', viz: 'dotplot', decimals: 1, max: 100, readout: 'lead' },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', viz: 'bars', decimals: 1, max: 100, readout: 'lead' },
  { id: 'aiTasks', label: 'AI instead of a professional', kind: 'segment', metricKey: 'aiUseByTask', viz: 'lollipop', decimals: 1, max: 100, readout: 'lead' },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', viz: 'orbit', decimals: 1, max: 100, readout: 'lead' },
  { id: 'moneyMoves', label: 'Money-saving moves', kind: 'survey', surveyKey: 'moneySavingMoves', viz: 'lollipop', decimals: 1, max: 100, readout: 'lead' },
  { id: 'protected', label: 'Protected spend', kind: 'survey', surveyKey: 'protectedSpend', viz: 'dotplot', decimals: 1, max: 100, readout: 'lead' },
  { id: 'confidence', label: 'Institutional confidence', kind: 'survey', surveyKey: 'institutionTrust', viz: 'dotplot', decimals: 1, max: 100, readout: 'lead' },
];

const NO_DATA = [{ id: 'none', label: 'No data', pct: 0 }];

/* DOCUMENTED CROSSTAB LABEL BUG (STORY.md data notes): the mindsetNetAgree row
 * stored as "Optimistic about next decade" (77.3) is actually Q2r3 — "more
 * careful with money". STORY.md says do NOT render the stored label; show the
 * verified one. Correction only, no value changed. */
const LABEL_FIX = {
  mindsetNetAgree: { 'Optimistic about next decade': 'More careful with money than 5 yrs ago' },
};
const fixLabel = (metricKey, label) => LABEL_FIX[metricKey]?.[label] || label;

/* ── helpers: turn verified data into [{id,label,pct}] for the chart libs ── */

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

const binaryTradedPct = (segments, metric, segmentId) => {
  if (segmentId === ALL_SEGMENTS) {
    const totals = segments.meta?.metricsTotals?.[metric.metricKey];
    return Number(totals?.[metric.row]) || 0;
  }
  const seg = segments.segments?.find((s) => s.id === segmentId);
  const v = seg?.metrics?.[metric.metricKey]?.[metric.row];
  return Number(typeof v === 'number' ? v : v?.pct) || 0;
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

/** The single defining figure for the chart on screen (always traces to a row). */
const readoutFor = (metric, view) => {
  if (metric.readout === 'binaryTraded') {
    return { value: view.binary.traded, label: metric.leftLabel };
  }
  if (!view.items.length) return { value: 0, label: '' };
  const lead = view.items.reduce((a, b) => (b.pct > a.pct ? b : a), view.items[0]);
  return { value: lead.pct, label: lead.label };
};

/* ── chart dispatch — a uniform handle { redraw(view) } over every factory ── */
const makeChart = (host, metric, view) => {
  const common = { accent: 'navy', decimals: metric.decimals, ariaLabel: metric.label };

  if (metric.viz === 'tug') {
    const chart = tugOfWar(host, {
      left: { label: metric.leftLabel, pct: view.binary.traded },
      right: { label: metric.rightLabel, pct: view.binary.held },
      accent: 'navy',
      ariaLabel: `${metric.label}: ${metric.leftLabel} versus ${metric.rightLabel}`,
    });
    return {
      redraw: (next) => chart.update({
        left: { label: metric.leftLabel, pct: next.binary.traded },
        right: { label: metric.rightLabel, pct: next.binary.held },
      }),
    };
  }

  const safe = view.items.length ? view.items : NO_DATA;

  if (metric.viz === 'bars') {
    // labelWidth sized so the longest verified row label ("Comfortable, can
    // afford luxuries") sits fully inside the chart's 0-origin viewBox and is
    // never clipped on the left (HARD RULE: no cutoff).
    const chart = horizontalBars(host, { items: safe, max: metric.max, labelWidth: 286, ...common });
    return { redraw: (next) => chart.update(next.items.length ? next.items : NO_DATA, { resort: true }) };
  }

  const factory = metric.viz === 'lollipop'
    ? lollipopChart
    : metric.viz === 'orbit' ? orbitRingChart : dotPlot;
  const draw = (rows) => factory(host, { items: rows.length ? rows : NO_DATA, max: metric.max, ...common });
  draw(safe);
  return {
    redraw: (next) => {
      host.replaceChildren();
      draw(next.items.length ? next.items : NO_DATA);
    },
  };
};

/* ── The divergence dial (the whole step) ─────────────────────────────── */

const FADE_MS = 240;

const initDial = (rootEl, survey, segments, onFilterChange) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const noteEl = rootEl.querySelector('[data-pg-note]');
  const numEl = rootEl.querySelector('[data-pg-readout-num]');
  const unitEl = rootEl.querySelector('[data-pg-readout-unit]');
  const lineEl = rootEl.querySelector('[data-pg-readout-line]');
  if (!chartHost || !metricHost || !segmentHost) return;

  const reduced = prefersReducedMotion();
  let currentMetric = METRICS[0];
  let currentSegment = ALL_SEGMENTS;
  let chart = null;
  let chartViz = null;
  let lastFigure = 0;
  let started = false; // first paint = jump-cut; later changes = count

  const resolveView = () => {
    if (currentMetric.kind === 'binary') {
      const traded = binaryTradedPct(segments, currentMetric, currentSegment);
      const held = Math.max(0, 100 - traded);
      const note = currentSegment === ALL_SEGMENTS
        ? 'National figure · all 1,504 respondents.'
        : `${SEGMENT_ORDER.find((s) => s.id === currentSegment).label} only.`;
      return { items: [], binary: { traded, held }, note };
    }
    if (currentMetric.kind === 'survey') {
      return { items: surveyMetricItems(survey, currentMetric), note: NATIONAL_NOTE };
    }
    if (currentSegment === ALL_SEGMENTS) {
      return {
        items: nationalSegmentItems(segments, currentMetric),
        note: 'National figure · all 1,504 respondents.',
      };
    }
    const seg = SEGMENT_ORDER.find((s) => s.id === currentSegment);
    return {
      items: oneSegmentItems(segments, currentMetric, currentSegment),
      note: `${seg.label} only · ${seg.sharePct}% of the nation.`,
    };
  };

  // Paint the live read-out: the headline figure counts to its new value; the
  // line names exactly what it is. The number is the display moment.
  const paintMeta = (view) => {
    if (noteEl) noteEl.textContent = view.note;
    const { value, label } = readoutFor(currentMetric, view);
    if (numEl) {
      if (started && !reduced) {
        countUp(numEl, { from: lastFigure, to: value, decimals: currentMetric.decimals, durationMs: 700 });
      } else {
        numEl.textContent = value.toLocaleString('en-GB', {
          minimumFractionDigits: currentMetric.decimals,
          maximumFractionDigits: currentMetric.decimals,
        });
      }
    }
    if (unitEl) unitEl.textContent = '%';
    if (lineEl) lineEl.textContent = label;
    lastFigure = value;
  };

  const buildChart = (view) => {
    chartHost.replaceChildren();
    chart = makeChart(chartHost, currentMetric, view);
    chartViz = currentMetric.viz;
  };

  const first = resolveView();
  buildChart(first);
  paintMeta(first);
  started = true;

  const render = ({ crossfade = false } = {}) => {
    const view = resolveView();
    const sameViz = chartViz === currentMetric.viz && chart;
    if (sameViz) {
      chart.redraw(view);
      paintMeta(view);
      return;
    }
    if (crossfade && !reduced) {
      chartHost.classList.add('is-fading');
      window.setTimeout(() => {
        buildChart(view);
        requestAnimationFrame(() => chartHost.classList.remove('is-fading'));
      }, FADE_MS);
    } else {
      buildChart(view);
    }
    paintMeta(view);
  };

  // Segment filter greys out + resets to All when the metric has no split.
  const syncSegmentAvailability = (group) => {
    const hasSplit = currentMetric.kind === 'segment' || currentMetric.kind === 'binary';
    if (!hasSplit && currentSegment !== ALL_SEGMENTS) {
      currentSegment = ALL_SEGMENTS;
      group.setValue(ALL_SEGMENTS);
    }
    group.el.classList.toggle('is-disabled', !hasSplit);
    group.el.querySelectorAll('.pillgroup-chip').forEach((chip) => {
      chip.disabled = !hasSplit;
      chip.setAttribute('aria-disabled', String(!hasSplit));
    });
  };

  const segmentGroup = pillGroup(segmentHost, {
    options: [
      { value: ALL_SEGMENTS, label: 'All' },
      ...SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
    ],
    value: ALL_SEGMENTS,
    ariaLabel: 'Filter the question by Britain',
    onChange: (value) => {
      currentSegment = value;
      render(); // same viz -> the divergence springs in place; the figure counts
      onFilterChange?.();
    },
  });

  pillGroup(metricHost, {
    options: METRICS.map((m) => ({ value: m.id, label: m.label })),
    value: currentMetric.id,
    ariaLabel: 'Choose a survey question',
    onChange: (value) => {
      currentMetric = METRICS.find((m) => m.id === value) || METRICS[0];
      syncSegmentAvailability(segmentGroup);
      render({ crossfade: true });
      onFilterChange?.();
    },
  });

  syncSegmentAvailability(segmentGroup);
};

export default function init(rootEl, data) {
  const { survey, segments, journey } = data || {};
  if (!survey || !segments) return; // fail soft — the dial needs both.
  observeReveals(rootEl);

  // The lockup arrives (the read-out figure counts, the eyebrow + line cascade)
  // on every step show. Fire once now in case arrive passed during mount.
  arrival(rootEl);
  rootEl.addEventListener('chapter:arrive', () => arrival(rootEl));

  // Soft gate: Next frees after dwell regardless; the first filter change just
  // clears the gentle hint.
  journey?.gate?.();
  let hasInteracted = false;
  const onFilterChange = () => {
    if (hasInteracted) return;
    hasInteracted = true;
    journey?.ready?.();
  };

  initDial(rootEl, survey, segments, onFilterChange);
}
