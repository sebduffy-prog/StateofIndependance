/**
 * Chapter 08 — playground. Teal research surface, the interactive explorer.
 *
 * MARQUEE INTERACTION — "the divergence dial" (Panel A). A pillGroup of survey
 * questions drives a chart whose TYPE varies by metric (the question shapes the
 * picture); a second pillGroup filters by segment so the four Britains visibly
 * diverge. The viz dispatch:
 *   - binary splits        -> tugOfWar          (groceries: traded vs held — no
 *     white track, no proportion-strip label overlap; the divider SPRINGS)
 *   - composition splits   -> horizontalBars    (financial position, trading down)
 *   - rankings / scores    -> dotPlot           (mood, protected spend, trust)
 *   - magnitude rankings   -> lollipopChart      (AI tasks, money moves)
 *   - signature ranking    -> orbitRingChart     (what people want from brands —
 *     the deck's "independence" orbit motif, used as a chart)
 * The chart host CROSSFADES between viz types (buttery, backgroundless) instead
 * of a hard swap. horizontalBars/tugOfWar morph in place via update(); lollipop/
 * dotPlot/orbit re-render into a fresh host.
 *
 * ASSEMBLING ENTRY: the lockup arrives via the journey's `chapter:arrive` beat
 * (experiential arrival()) — lines cascade, the emphasis word decrypts, the
 * three read-outs count up. No bespoke counter; arrival owns the count-ups.
 *
 * Panel B: TGI media index. A pillGroup picks a segment; that segment's
 * tgi.media[] renders as INDEX bars (not %) with a reference line at 100.
 * Panel C: a live segment portrait — verbatim deck/qualitative descriptor copy
 * + a brand-world motif that crossfades on step.
 *
 * GATING: this is the explorer step — Next stays locked until the visitor
 * changes a filter in Panel A (a metric or segment pill). The first such change
 * fires journey.ready() exactly once.
 *
 * Every number traces to data/survey.json, data/segments.json or data/tgi.json.
 * Nothing is typed by hand. Deck segment sizes (17/28/27/28) appear on chips.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="08-playground">
 * @param {{survey: object, segments: object, tgi: object, journey?: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import {
  horizontalBars, lollipopChart, dotPlot, tugOfWar, orbitRingChart,
} from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';
import {
  observeParallax, arrival, prefersReducedMotion,
} from '../lib/experiential.js';

/* Deck-canonical segment sizes — always displayed, never derived. Each carries
 * the verbatim deck/qualitative portrait + a brand-world motif. These are
 * descriptors, not survey figures — no per-segment number is invented. */
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
 *  - kind 'binary': one row of a segment metric, shown as a two-way split
 *    (held = 100 - traded) on a tugOfWar — an honest complement, no invention.
 *  - kind 'survey': a national-only block in survey.json (no segment split).
 *  - viz: 'bars' | 'lollipop' | 'dotplot' | 'tug' | 'orbit'. */
const METRICS = [
  { id: 'groceries', label: 'Trading down: groceries', kind: 'binary', metricKey: 'tradedDown12Months', row: 'Groceries', leftLabel: 'Traded down', rightLabel: 'Held basket', viz: 'tug', decimals: 0, max: 100 },
  { id: 'finance', label: 'Financial position', kind: 'segment', metricKey: 'financialPosition', viz: 'bars', decimals: 1, max: 100 },
  { id: 'mindset', label: 'Mood of the nation', kind: 'segment', metricKey: 'mindsetNetAgree', viz: 'dotplot', decimals: 1, max: 100 },
  { id: 'tradedDown', label: 'Trading down', kind: 'segment', metricKey: 'tradedDown12Months', viz: 'bars', decimals: 1, max: 100 },
  { id: 'aiTasks', label: 'AI tasks', kind: 'segment', metricKey: 'aiUseByTask', viz: 'lollipop', decimals: 1, max: 100 },
  { id: 'brandAsks', label: 'What people want from brands', kind: 'segment', metricKey: 'brandAsks', viz: 'orbit', decimals: 1, max: 100 },
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

/** Read a single row's pct from national totals or one segment (binary metric). */
const binaryTradedPct = (segments, metric, segmentId) => {
  if (segmentId === ALL_SEGMENTS) {
    const totals = segments.meta?.metricsTotals?.[metric.metricKey];
    return Number(totals?.[metric.row]) || 0;
  }
  const seg = segments.segments?.find((s) => s.id === segmentId);
  const v = seg?.metrics?.[metric.metricKey]?.[metric.row];
  return Number(typeof v === 'number' ? v : v?.pct) || 0;
};

/** A national-only survey block -> items. */
const surveyMetricItems = (survey, metric) => {
  const block = survey[metric.surveyKey];
  if (!block) return [];
  // institutionTrust nests its rows under confidenceRanking.
  if (metric.surveyKey === 'institutionTrust') {
    const rows = block.confidenceRanking?.items || [];
    return rows.map((r) => ({ id: r.id, label: r.label, pct: r.pctConfident }));
  }
  const rows = block.items || [];
  return rows.map((r) => ({ id: r.id, label: r.label, pct: r.pct }));
};

/* ── chart dispatch ───────────────────────────────────────────────────
 * Returns a uniform handle { redraw(view) } so the explorer never cares which
 * factory it drives. horizontalBars + tugOfWar morph in place via update();
 * lollipop / dotPlot / orbit have no update(), so we clear the host and re-run
 * the factory (a fresh first-view animation). */
const makeChart = (host, metric, view) => {
  // Data marks stay FLAT and box-less: navy components on the pale-teal research
  // ground give a strong AA contrast (mustard/teal would vanish), so navy.
  const common = { accent: 'navy', decimals: metric.decimals, ariaLabel: metric.label };

  if (metric.viz === 'tug') {
    const sides = view.binary;
    const chart = tugOfWar(host, {
      left: { label: metric.leftLabel, pct: sides.traded },
      right: { label: metric.rightLabel, pct: sides.held },
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
    const chart = horizontalBars(host, { items: safe, max: metric.max, labelWidth: 200, ...common });
    return { redraw: (next) => chart.update(next.items.length ? next.items : NO_DATA, { resort: true }) };
  }

  // lollipop + dotplot + orbit: no update() handle, so re-render into the host.
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

/* ── Panel A: the divergence dial (marquee interaction) ───────────────── */

// Buttery, backgroundless crossfade between viz types: lower the host's opacity,
// rebuild on the next frame, then ease it back. Reduced motion swaps instantly.
const FADE_MS = 220;

const initPanelA = (rootEl, survey, segments, onFilterChange) => {
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const noteEl = rootEl.querySelector('[data-pg-view-note]');
  if (!chartHost || !metricHost || !segmentHost) return;

  const reduced = prefersReducedMotion();
  let currentMetric = METRICS[0];
  let currentSegment = ALL_SEGMENTS;
  let chart = null;
  let chartViz = null; // the viz the live chart was built for

  // Resolve the data + an honest view-note for the current selection. Source
  // strings stay in the data but are not painted — captions cut.
  const resolveView = () => {
    if (currentMetric.kind === 'binary') {
      const traded = binaryTradedPct(segments, currentMetric, currentSegment);
      const held = Math.max(0, 100 - traded);
      const note = currentSegment === ALL_SEGMENTS
        ? 'National figure across all 1,504 respondents.'
        : `${SEGMENT_ORDER.find((s) => s.id === currentSegment).label} only.`;
      return { items: [], binary: { traded, held }, note };
    }
    if (currentMetric.kind === 'survey') {
      return { items: surveyMetricItems(survey, currentMetric), note: NATIONAL_NOTE };
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
    chart = makeChart(chartHost, currentMetric, view);
    chartViz = currentMetric.viz;
  };

  const first = resolveView();
  buildChart(first);
  paintMeta(first);

  // Same viz across the change -> morph/redraw in place. Different viz (a new
  // metric of a different chart type) -> crossfade to a fresh chart.
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

  // Segment filter: disabled (greyed) and reset to All when the metric has no
  // split. Reset the selection BEFORE disabling, since disabled chips can't be
  // clicked. Binary + segment metrics both support the segment cut.
  const syncSegmentAvailability = (group) => {
    const hasSplit = currentMetric.kind === 'segment' || currentMetric.kind === 'binary';
    if (!hasSplit && currentSegment !== ALL_SEGMENTS) {
      currentSegment = ALL_SEGMENTS;
      group.setValue(ALL_SEGMENTS); // fires onChange -> render() with All
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
      render(); // same viz -> the divergence springs in place
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
  // value labels. A MutationObserver keeps it stripped across animation frames.
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
    ariaLabel: 'Choose a Britain for its media footprint',
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

  const card = rootEl.querySelector('[data-pg-portrait-card]');

  // Swap the motif with a brief crossfade so stepping segments feels premium,
  // not a hard cut. Reduced-motion skips the fade and swaps instantly.
  const swapMotif = (src, label) => {
    if (!img) return;
    if (prefersReducedMotion()) {
      img.src = src;
      img.alt = `${label} — brand-world motif`;
      return;
    }
    img.classList.add('is-swapping');
    const next = new Image();
    next.onload = () => {
      img.src = src;
      img.alt = `${label} — brand-world motif`;
      requestAnimationFrame(() => img.classList.remove('is-swapping'));
    };
    next.src = src;
  };

  const paint = (seg) => {
    swapMotif(seg.motif, seg.label);
    if (card) {
      card.classList.remove('is-stepped');
      // force reflow so the re-add restarts the subtle step animation
      void card.offsetWidth;
      card.classList.add('is-stepped');
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
    ariaLabel: 'Choose a Britain to meet it',
    onChange: (value) => {
      const seg = SEGMENT_ORDER.find((s) => s.id === value);
      if (seg) paint(seg);
    },
  });
};

export default function init(rootEl, data) {
  const { survey, segments, tgi, journey } = data || {};
  if (!survey || !segments) return; // fail soft — Panel A needs both.
  observeReveals(rootEl);

  // ASSEMBLING ENTRY: the lockup arrives (lines cascade, the emphasis word
  // decrypts, the read-outs count up) each time this step becomes current.
  // Not the first step, so no ritual. Fire once now in case the arrive event
  // already passed during mount.
  arrival(rootEl);
  rootEl.addEventListener('chapter:arrive', () => arrival(rootEl));

  // GATING: this is the explorer step — Next stays locked until the visitor
  // changes a filter in Panel A. The first such change fires ready() once.
  journey?.gate?.();
  let hasInteracted = false;
  const onFilterChange = () => {
    if (hasInteracted) return;
    hasInteracted = true;
    journey?.ready?.();
  };

  initPanelA(rootEl, survey, segments, onFilterChange);
  if (tgi) initPanelB(rootEl, tgi);
  initPanelC(rootEl);

  // Experiential motion (opt-in, reduced-motion safe): subtle parallax on the
  // deck motifs as they travel through the viewport.
  observeParallax(rootEl, { maxShiftPx: 48 });
}
