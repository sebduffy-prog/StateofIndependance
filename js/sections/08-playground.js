/**
 * Chapter 08 — playground. Teal research surface, the interactive explorer.
 *
 * Panel A: a metric explorer. A pillGroup of survey questions drives a chart
 * whose TYPE varies by metric (the question shapes the picture):
 *   - composition splits  -> horizontalBars     (financial position, trading
 *     down — clean per-row labels, no collision; replaces the old colliding strip)
 *   - rankings / scores    -> dotPlot           (mood, protected spend, trust)
 *   - magnitude rankings   -> lollipopChart      (AI tasks, brand asks, money moves)
 * A second pillGroup filters by segment where segments.json carries a per-segment
 * split (segments[].metrics, keyed by row label); national totals come from
 * segments.meta.metricsTotals. Survey-only blocks render the national figure and
 * are labelled honestly. The chart re-renders on every change: horizontalBars
 * morphs via its update() handle; lollipop/dotPlot have no update, so the
 * container is cleared and the factory re-runs.
 *
 * Panel C: a live segment portrait — a shared selector swaps the brand-world
 * motif image and the verbatim deck/qualitative descriptor copy.
 *
 * Panel B: TGI media index. A pillGroup picks a segment; that segment's
 * tgi.media[] renders as INDEX bars (not %) with a reference line at 100.
 *
 * Every number traces to data/survey.json, data/segments.json or data/tgi.json.
 * Nothing is typed by hand. Deck segment sizes (17/28/27/28) appear on chips;
 * no per-segment number is invented.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="08-playground">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { horizontalBars, lollipopChart, dotPlot } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

/* Deck-canonical segment sizes — always displayed, never derived. Each carries
 * the verbatim deck/qualitative portrait (trio + who/money/channels + the
 * 'Taking control' qual quote) and a brand-world motif. These are descriptors,
 * not survey figures — no per-segment number beyond the deck share is invented. */
const SEGMENT_ORDER = [
  {
    id: 'architects', label: 'Architects', sharePct: 17,
    motif: 'assets/deck/bear-world-circles.png',
    trio: 'Organised. Positive. In control.',
    who: '55+ skew, male', money: 'Comfortable', channels: 'Podcasts, streaming, broadsheets',
    quote: '“I’ve always been super organised. I like being in control. I hate having my time wasted.”',
  },
  {
    id: 'hustlers', label: 'Hustlers', sharePct: 28,
    motif: 'assets/deck/bear-world-coil.png',
    trio: 'Self-sufficient. Savvy. Sceptical.',
    who: '25–54 core', money: 'Middle-income families', channels: 'Podcasts, social, creators, ChatGPT',
    quote: '“My trust has worsened over time — but with AI I feel empowered to take control and help myself.”',
  },
  {
    id: 'coasters', label: 'Coasters', sharePct: 27,
    motif: 'assets/deck/bear-world-sphere.png',
    trio: 'Easygoing. Careful. Open-minded.',
    who: '55+ skew', money: 'Mid-to-low income', channels: 'Linear TV, mail, in-store',
    quote: '“Life has improved with technology. It saves time — but it really can be overwhelming sometimes.”',
  },
  {
    id: 'retreaters', label: 'Retreaters', sharePct: 28,
    motif: 'assets/deck/bear-world-doors.png',
    trio: 'Overwhelmed. Stretched. Support-seeking.',
    who: '45+ skew, female', money: 'Stretched finances', channels: 'Daytime TV, value circulars, Facebook',
    quote: '“I’ve lost faith in the council and institutions. People are left to do more for themselves.”',
  },
];

const TGI_INDEX_MAX = 250; // TGI bars scale to a sensible ceiling, not 100.
const ALL_SEGMENTS = 'all';

const NATIONAL_NOTE = 'National figure. Segment split not available for this question.';

/* Metric registry. Each entry declares WHERE the data lives and WHICH chart
 * draws it. No numbers live here — only the path into the verified data.
 *  - kind 'segment': backed by segments.json metrics[<metricKey>], keyed by
 *    row label; national total read from segments.meta.metricsTotals.
 *  - kind 'survey': a national-only block in survey.json (no segment split).
 *  - viz: 'bars' | 'lollipop' | 'dotplot'. */
const METRICS = [
  { id: 'finance', label: 'Financial position', kind: 'segment', metricKey: 'financialPosition', viz: 'bars', decimals: 1, max: 100 },
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', viz: 'dotplot', decimals: 1, max: 100 },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', viz: 'bars', decimals: 1, max: 100 },
  { id: 'aiTasks', label: 'AI tasks', kind: 'segment', metricKey: 'aiUseByTask', viz: 'lollipop', decimals: 1, max: 100 },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', viz: 'lollipop', decimals: 1, max: 100 },
  { id: 'moneyMoves', label: 'Money-saving moves', kind: 'survey', surveyKey: 'moneySavingMoves', viz: 'lollipop', decimals: 1, max: 100 },
  { id: 'protected', label: 'Protected spend', kind: 'survey', surveyKey: 'protectedSpend', viz: 'dotplot', decimals: 1, max: 100 },
  { id: 'confidence', label: 'Institutional confidence', kind: 'survey', surveyKey: 'institutionTrust', viz: 'dotplot', decimals: 1, max: 100 },
];

const NO_DATA = [{ id: 'none', label: 'No data', pct: 0 }];

/* ── helpers: turn verified data into [{id,label,pct}] for the chart libs ── */

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

/* ── chart dispatch ───────────────────────────────────────────────────
 * Returns a uniform handle { redraw(items) } so the explorer never cares
 * which factory it is driving. horizontalBars morphs in place via its own
 * update(); lollipop / dotPlot have no update(), so we clear
 * the host and re-run the factory (a fresh first-view animation). */
const makeChart = (host, metric, items) => {
  const safe = items.length ? items : NO_DATA;
  // Data marks stay FLAT and box-less: navy components on the pale-teal research
  // ground give a strong AA contrast (mustard/teal would vanish), so navy is the
  // default. Charts sit transparently on the ground via .chart-holder.
  const common = { accent: 'navy', decimals: metric.decimals, ariaLabel: metric.label };

  if (metric.viz === 'bars') {
    const chart = horizontalBars(host, { items: safe, max: metric.max, labelWidth: 200, ...common });
    return { redraw: (next) => chart.update(next.length ? next : NO_DATA, { resort: true }) };
  }

  // lollipop + dotplot: no update() handle, so re-render into the host.
  const factory = metric.viz === 'lollipop' ? lollipopChart : dotPlot;
  const draw = (rows) => factory(host, { items: rows.length ? rows : NO_DATA, max: metric.max, ...common });
  draw(safe);
  return {
    redraw: (next) => {
      host.replaceChildren();
      draw(next);
    },
  };
};

/* ── Panel A: metric explorer ─────────────────────────────────────────── */

const initPanelA = (rootEl, survey, segments) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const noteEl = rootEl.querySelector('[data-pg-view-note]');
  if (!chartHost || !metricHost || !segmentHost) return;

  let currentMetric = METRICS[0];
  let currentSegment = ALL_SEGMENTS;
  let chart = null;
  let chartViz = null; // the viz the live chart was built for

  // Resolve items + an honest view-note for the current selection. Source
  // strings stay in the data (brief §6) but are not painted — captions cut.
  const resolveView = () => {
    if (currentMetric.kind === 'survey') {
      const { items } = surveyMetricItems(survey, currentMetric);
      return { items, note: NATIONAL_NOTE };
    }
    if (currentSegment === ALL_SEGMENTS) {
      return {
        items: nationalSegmentItems(segments, currentMetric),
        note: 'National figure across all 1,504 respondents.',
      };
    }
    const seg = SEGMENT_ORDER.find((s) => s.id === currentSegment);
    return {
      items: oneSegmentItems(segments, currentMetric, currentSegment),
      note: `${seg.label} only. ${seg.sharePct}% of the nation.`,
    };
  };

  const paintMeta = (view) => {
    if (noteEl) noteEl.textContent = view.note;
  };

  // Build (or rebuild) the chart for the current metric's viz type.
  const buildChart = (view) => {
    chartHost.replaceChildren();
    chart = makeChart(chartHost, currentMetric, view.items);
    chartViz = currentMetric.viz;
  };

  const first = resolveView();
  buildChart(first);
  paintMeta(first);

  // Same viz across the change -> morph/redraw. Different viz (new metric of a
  // different chart type) -> build a fresh chart of the right kind.
  const render = () => {
    const view = resolveView();
    if (chartViz === currentMetric.viz && chart) chart.redraw(view.items);
    else buildChart(view);
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
  // id is the label (stable + unique per title). horizontalBars keys its row
  // cache by id, so distinct ids across segments rebuild the rows with the
  // correct label text instead of leaving a stale label in a reused slot.
  return rows
    .slice()
    .sort((a, b) => b.index - a.index)
    .map((r) => ({ id: r.label, label: r.label, pct: r.index }));
};

const initPanelB = (rootEl, tgi) => {
  const chartHost = rootEl.querySelector('[data-pg-tgi-chart]');
  const pillHost = rootEl.querySelector('[data-pg-tgi-pills]');
  if (!chartHost || !pillHost) return;

  let currentSegment = SEGMENT_ORDER[0].id;

  const firstItems = tgiItems(tgi, currentSegment);
  const chart = horizontalBars(chartHost, {
    items: firstItems.length ? firstItems : NO_DATA,
    max: TGI_INDEX_MAX,
    accent: 'navy',
    decimals: 0,
    labelWidth: 230,
    ariaLabel: 'TGI media index by segment, where 100 is the UK-adult average',
  });

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

/* ── Panel C: live segment portrait (deck-faithful, fills the lower screen) ──
 * A shared segment selector swaps the brand-world motif image and the verbatim
 * deck/qualitative portrait. All copy is descriptor text; the only number is the
 * deck-canonical share (never derived). */
const initPanelC = (rootEl) => {
  const pillHost = rootEl.querySelector('[data-pg-portrait-pills]');
  const img = rootEl.querySelector('[data-pg-portrait-img]');
  const shareEl = rootEl.querySelector('[data-pg-portrait-share]');
  const nameEl = rootEl.querySelector('[data-pg-portrait-name]');
  const trioEl = rootEl.querySelector('[data-pg-portrait-trio]');
  const factsEl = rootEl.querySelector('[data-pg-portrait-facts]');
  const quoteEl = rootEl.querySelector('[data-pg-portrait-quote]');
  if (!pillHost || !nameEl) return;

  const paint = (seg) => {
    if (img) {
      img.src = seg.motif;
      img.alt = `${seg.label} — brand-world motif`;
    }
    if (shareEl) shareEl.textContent = `${seg.sharePct}% of the nation`;
    nameEl.textContent = `The ${seg.label}`;
    if (trioEl) trioEl.textContent = seg.trio;
    if (factsEl) {
      factsEl.replaceChildren();
      [['Who', seg.who], ['Money', seg.money], ['Channels', seg.channels]]
        .forEach(([term, def]) => {
          const dt = document.createElement('dt');
          dt.textContent = term;
          const dd = document.createElement('dd');
          dd.textContent = def;
          factsEl.append(dt, dd);
        });
    }
    if (quoteEl) quoteEl.textContent = seg.quote;
  };

  paint(SEGMENT_ORDER[0]);

  pillGroup(pillHost, {
    options: SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
    value: SEGMENT_ORDER[0].id,
    ariaLabel: 'Choose a segment to meet it',
    onChange: (value) => {
      const seg = SEGMENT_ORDER.find((s) => s.id === value);
      if (seg) paint(seg);
    },
  });
};

export default function init(rootEl, data) {
  const { survey, segments, tgi } = data || {};
  if (!survey || !segments) return; // fail soft — Panel A needs both.
  observeReveals(rootEl);

  initPanelA(rootEl, survey, segments);
  if (tgi) initPanelB(rootEl, tgi);
  initPanelC(rootEl);
}
