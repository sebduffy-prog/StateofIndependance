/**
 * Chapter 08 — playground. Teal research surface, the interactive explorer.
 *
 * Panel A: a metric explorer. A pillGroup of survey questions drives a
 * horizontalBars chart that MORPHS (re-sorts + regrows) on change. Where a
 * metric has per-segment splits in segments.json (segments[].metrics, keyed by
 * row label), a second pillGroup filters by segment and the chart re-renders
 * from that segment's figures. Metrics with no segment split render the
 * national figure and are labelled honestly as national-only.
 *
 * Panel B: TGI media index. A pillGroup picks a segment; that segment's
 * tgi.media[] renders as INDEX bars (not %) with a reference marker at 100.
 *
 * Every number traces to data/survey.json, data/segments.json or data/tgi.json.
 * Nothing is typed by hand. Deck segment sizes (17/28/27/28) appear on chips;
 * no per-segment number is invented.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="08-playground">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { horizontalBars } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

/* Deck-canonical segment sizes — always displayed, never derived. */
const SEGMENT_ORDER = [
  { id: 'architects', label: 'Architects', sharePct: 17 },
  { id: 'hustlers', label: 'Hustlers', sharePct: 28 },
  { id: 'coasters', label: 'Coasters', sharePct: 27 },
  { id: 'retreaters', label: 'Retreaters', sharePct: 28 },
];

const TGI_INDEX_MAX = 250; // TGI bars scale to a sensible ceiling, not 100.
const ALL_SEGMENTS = 'all';

const NATIONAL_NOTE = 'National — segment split not available';

/* Metric registry. Each entry is either:
 *  - kind 'segment': backed by segments.json metrics[<metricKey>], keyed by
 *    row label; national total read from segments.meta.metricsTotals.
 *  - kind 'survey': a national-only block in survey.json (no segment split).
 * No numbers live here — only the path into the verified data. */
const METRICS = [
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', decimals: 1, max: 100 },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', decimals: 1, max: 100 },
  { id: 'aiTasks', label: 'AI tasks', kind: 'segment', metricKey: 'aiUseByTask', decimals: 1, max: 100 },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', decimals: 1, max: 100 },
  { id: 'moneyMoves', label: 'Money-saving moves', kind: 'survey', surveyKey: 'moneySavingMoves', decimals: 1, max: 100 },
  { id: 'protected', label: 'Protected spend', kind: 'survey', surveyKey: 'protectedSpend', decimals: 1, max: 100 },
  { id: 'confidence', label: 'Institutional confidence', kind: 'survey', surveyKey: 'institutionTrust', decimals: 1, max: 100 },
];

const NO_DATA = [{ id: 'none', label: 'No data', pct: 0 }];

/* ── helpers: turn verified data into [{id,label,pct}] for the bar lib ── */

const toItems = (pairs) => pairs.map(([label, pct], i) => ({ id: `r${i}`, label, pct }));

/** National totals for a segment-backed metric, from meta.metricsTotals. */
const nationalSegmentItems = (segments, metric) => {
  const totals = segments.meta?.metricsTotals?.[metric.metricKey];
  if (!totals) return [];
  return toItems(Object.entries(totals));
};

/** One segment's split for a segment-backed metric (label -> {pct,index}). */
const oneSegmentItems = (segments, metric, segmentId) => {
  const seg = segments.segments?.find((s) => s.id === segmentId);
  const block = seg?.metrics?.[metric.metricKey];
  if (!block) return [];
  return toItems(
    Object.entries(block).map(([label, v]) => [label, typeof v === 'number' ? v : v.pct])
  );
};

/** A national-only survey block -> { items, source }. */
const surveyMetricItems = (survey, metric) => {
  const block = survey[metric.surveyKey];
  if (!block) return { items: [], source: '' };
  // institutionTrust nests its rows under confidenceRanking.
  if (metric.surveyKey === 'institutionTrust') {
    const rows = block.confidenceRanking?.items || [];
    return {
      items: rows.map((r) => ({ id: r.id, label: r.label, pct: r.pctConfident })),
      source: block.source || '',
    };
  }
  const rows = block.items || [];
  return {
    items: rows.map((r) => ({ id: r.id, label: r.label, pct: r.pct })),
    source: block.source || '',
  };
};

/** Survey source line for a segment-backed metric. */
const segmentMetricSource = (segments) =>
  segments.meta?.sampleNote ||
  'VCCP x Watermelon Research COCL survey. 1,504 UK adults 18+, nat. rep. May 2026.';

/* ── footnotes (verbatim copy from STORY.md) ──────────────────────────── */

const SURVEY_CI = 'Headline survey %: ±2.5% at 95%. Segment-level: ±4–6% by segment size.';

const buildSurveySource = (baseSource) => `${baseSource} ${SURVEY_CI}`;

const buildTgiSource = (tgi) => {
  const base = tgi.source || 'TGI / Compass';
  const detail = tgi.sourceDetail ? ` ${tgi.sourceDetail}` : '';
  const note = tgi.indexNote ? ` ${tgi.indexNote}` : '';
  return `${base}.${detail}${note}`;
};

/* ── Panel A: metric explorer ─────────────────────────────────────────── */

const initPanelA = (rootEl, survey, segments) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const sourceEl = rootEl.querySelector('[data-pg-metric-source]');
  const noteEl = rootEl.querySelector('[data-pg-view-note]');
  if (!chartHost || !metricHost || !segmentHost) return;

  let currentMetric = METRICS[0];
  let currentSegment = ALL_SEGMENTS;

  // Resolve items + source + an honest view-note for the current selection.
  const resolveView = () => {
    if (currentMetric.kind === 'survey') {
      const { items, source } = surveyMetricItems(survey, currentMetric);
      return { items, source: buildSurveySource(source), note: NATIONAL_NOTE };
    }
    if (currentSegment === ALL_SEGMENTS) {
      return {
        items: nationalSegmentItems(segments, currentMetric),
        source: buildSurveySource(segmentMetricSource(segments)),
        note: 'National figure across all 1,504 respondents.',
      };
    }
    const seg = SEGMENT_ORDER.find((s) => s.id === currentSegment);
    return {
      items: oneSegmentItems(segments, currentMetric, currentSegment),
      source: buildSurveySource(segmentMetricSource(segments)),
      note: `${seg.label} only — ${seg.sharePct}% of the nation.`,
    };
  };

  const paintMeta = (view) => {
    if (sourceEl) sourceEl.textContent = view.source;
    if (noteEl) noteEl.textContent = view.note;
  };

  const first = resolveView();
  const chart = horizontalBars(chartHost, {
    items: first.items.length ? first.items : NO_DATA,
    max: currentMetric.max,
    accent: 'teal',
    decimals: currentMetric.decimals,
    labelWidth: 220,
    ariaLabel: 'Survey responses by question and segment',
  });
  paintMeta(first);

  const render = () => {
    const view = resolveView();
    chart.update(view.items.length ? view.items : NO_DATA, { resort: true });
    paintMeta(view);
  };

  // Segment filter: disabled (greyed) and reset to All when metric has no split.
  // Reset the selection BEFORE disabling, since disabled chips can't be clicked.
  const syncSegmentAvailability = (group) => {
    const isSurvey = currentMetric.kind === 'survey';
    if (isSurvey && currentSegment !== ALL_SEGMENTS) {
      currentSegment = ALL_SEGMENTS;
      group.setValue(ALL_SEGMENTS); // fires onChange -> render() with All
    }
    group.el.classList.toggle('is-disabled', isSurvey);
    group.el.querySelectorAll('.pillgroup-chip').forEach((chip) => {
      chip.disabled = isSurvey;
      chip.setAttribute('aria-disabled', String(isSurvey));
    });
  };

  const segmentGroup = pillGroup(segmentHost, {
    options: [
      { value: ALL_SEGMENTS, label: 'All' },
      ...SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
    ],
    value: ALL_SEGMENTS,
    ariaLabel: 'Filter the question by segment',
    onChange: (value) => {
      currentSegment = value;
      render();
    },
  });

  pillGroup(metricHost, {
    options: METRICS.map((m) => ({ value: m.id, label: m.label })),
    value: currentMetric.id,
    ariaLabel: 'Choose a survey question',
    onChange: (value) => {
      currentMetric = METRICS.find((m) => m.id === value) || METRICS[0];
      syncSegmentAvailability(segmentGroup);
      render();
    },
  });

  syncSegmentAvailability(segmentGroup);
};

/* ── Panel B: TGI media index ─────────────────────────────────────────── */

const tgiItems = (tgi, segmentId) => {
  const rows = tgi.segments?.[segmentId]?.media || [];
  return rows
    .slice()
    .sort((a, b) => b.index - a.index)
    .map((r, i) => ({ id: `m${i}`, label: r.label, pct: r.index }));
};

const initPanelB = (rootEl, tgi) => {
  const chartHost = rootEl.querySelector('[data-pg-tgi-chart]');
  const pillHost = rootEl.querySelector('[data-pg-tgi-pills]');
  const sourceEl = rootEl.querySelector('[data-pg-tgi-source]');
  if (!chartHost || !pillHost) return;

  let currentSegment = SEGMENT_ORDER[0].id;

  const firstItems = tgiItems(tgi, currentSegment);
  const chart = horizontalBars(chartHost, {
    items: firstItems.length ? firstItems : NO_DATA,
    max: TGI_INDEX_MAX,
    accent: 'teal',
    decimals: 0,
    labelWidth: 230,
    ariaLabel: 'TGI media index by segment, where 100 is the UK-adult average',
  });

  if (sourceEl) sourceEl.textContent = buildTgiSource(tgi);

  // The shared bar lib labels every value with a trailing '%'. These are TGI
  // index numbers, not percentages, so we strip the '%' from this chart's
  // value labels. A MutationObserver keeps it stripped across animation frames
  // and re-sorts. (We must not edit the shared lib, so we correct the unit here.)
  const stripPercent = () => {
    chart.el.querySelectorAll('text').forEach((t) => {
      const txt = t.textContent;
      if (txt && txt.endsWith('%')) t.textContent = txt.slice(0, -1);
    });
  };
  stripPercent();
  const unitObserver = new MutationObserver(stripPercent);
  unitObserver.observe(chart.el, {
    subtree: true,
    characterData: true,
    childList: true,
  });

  pillGroup(pillHost, {
    options: SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
    value: currentSegment,
    ariaLabel: 'Choose a segment for its media footprint',
    onChange: (value) => {
      currentSegment = value;
      const items = tgiItems(tgi, currentSegment);
      chart.update(items.length ? items : NO_DATA, { resort: true });
    },
  });
};

export default function init(rootEl, data) {
  const { survey, segments, tgi } = data || {};
  if (!survey || !segments) return; // fail soft — Panel A needs both.
  observeReveals(rootEl);

  initPanelA(rootEl, survey, segments);
  if (tgi) initPanelB(rootEl, tgi);
}
