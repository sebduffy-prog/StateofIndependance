/**
 * Step 16 — The data explorer. The explore-EVERYTHING moment: the FULL COCL
 * survey AND the full TGI demographic / lifestyle / media fingerprints, richly
 * browsable. Two controls drive one lollipop chart:
 *   1. THE QUESTION  — every survey block + every TGI cut, organised into GROUPS
 *      (Survey · TGI Demographics · TGI Lifestyle · TGI Media) so the long bank
 *      stays navigable across the full screen width.
 *   2. WHICH BRITAIN — All (national) / one of the four segments / All four.
 * Every cut renders the SAME way: a lollipop, so the read is consistent and the
 * controls — not a view chooser — are the spectacle.
 *
 * THE DISPLAY MOMENT — the masthead FIGURE (the leading value of the current
 * cut) counts to its new value on every change; the leading-answer line beneath
 * it is COLOURED in the brand accent so the highlighted point reads as
 * highlighted. The number is the headline; the chart is its supporting form.
 *
 * HONEST LABELS — every figure traces to data/survey.json or data/tgi.json.
 *   • Survey cuts chart % (penetration within the chosen Britain). The full
 *     survey lives in survey.surveyByAudience.sections (10 blocks, 70 answers,
 *     each carrying a national total + per-segment pct/index).
 *   • TGI cuts chart the INDEX (100 = GB average) — labelled "i236", never "%" —
 *     and the read-out note names the metric so the two never blur.
 *
 * GATING: Next stays soft-hinted until the first change; that fires
 * journey.ready() once. Never traps (Next frees after dwell).
 *
 * @param {HTMLElement} rootEl - <section class="journey-step" id="16-data-explorer">
 * @param {{survey:object, segments:object, tgi:object, journey?:object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { lollipopChart } from '../lib/charts.js';
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
const NATIONAL_NOTE = 'National figure · all 1,504 respondents · % giving each answer.';
const COMPARE_NOTE = 'All four segments compared · % giving each answer.';
const MAX_ITEMS = 9; // keep every label legible — never overcrowd the cream

/* Distinct marker colour per segment for the "All four" comparison plot. */
const SEG_COLORS = {
  architects: '#041654', // navy
  hustlers: '#FF8598',   // coral
  coasters: '#FFA764',   // orange
  retreaters: '#F0CB08', // yellow
};

/* index → "i236" so TGI cuts never read as a percentage. */
const fmtIndex = (n) => `i${Math.round(n)}`;

/* ── Metric registry — the FULL survey + the FULL TGI cuts, grouped ─────────
 * Built at init from verified data. No numbers live in the registry — only the
 * path into data/survey.json (survey block) or data/tgi.json (TGI cut).
 *   kind 'survey' : a surveyByAudience.sections block. Charts %; sliceable by
 *                   which Britain (All=national total, one segment, All four).
 *   kind 'tgi'    : a data/tgi.json full cut. Segment-only; charts the INDEX. */

const buildSurveyMetrics = (survey) => {
  const sections = survey?.surveyByAudience?.sections || [];
  return sections.map((sec) => ({
    id: `sv-${sec.id}`,
    label: sec.title,
    kind: 'survey',
    block: sec,
    decimals: 1,
    sortDesc: true,
  }));
};

const TGI_GROUP_LABELS = {
  demographics: 'Demographics',
  lifestyle: 'Lifestyle',
  media: 'Media',
};

const buildTgiMetrics = (tgi) => {
  const full = tgi?.full || {};
  const out = [];
  ['demographics', 'lifestyle', 'media'].forEach((dim) => {
    (full[dim] || []).forEach((block) => {
      out.push({
        id: `tgi-${block.id}`,
        label: block.label,
        kind: 'tgi',
        dim,
        rowsBySeg: block.rows, // { segId: [{label,pct,index}] }
        decimals: 0,
      });
    });
  });
  return out;
};

/* ── label tidy ────────────────────────────────────────────────────────────
 * Strip curly-quote wrapping; clamp to a legible length (the chart lib also
 * shrinks/wraps, but a sane cap keeps the bank readable). No mid-word cut. */
const tidyLabel = (label) => {
  const s = String(label).replace(/^[“"]|[”"]$/g, '').trim();
  return s.length > 46 ? `${s.slice(0, 45).trimEnd()}…` : s;
};

/* ── survey → items ─────────────────────────────────────────────────────────
 * One survey block resolved for the chosen Britain. National uses the block's
 * `total`; a segment uses byAudience[seg].pct. */
const surveyItems = (metric, segment) => {
  const items = (metric.block.items || []).map((it) => {
    const pct = segment === ALL_SEGMENTS
      ? it.total
      : it.byAudience?.[segment]?.pct;
    return { id: it.id, label: tidyLabel(it.label), pct: typeof pct === 'number' ? pct : null };
  });
  return items.filter((it) => it.pct !== null);
};

/* "All four" — one row per answer, the four segments' pct aligned on a shared,
 * nationally-ordered track. */
const surveyCompareGroups = (metric) => {
  const order = surveyItems(metric, ALL_SEGMENTS)
    .slice()
    .sort((a, b) => b.pct - a.pct);
  const byId = Object.fromEntries((metric.block.items || []).map((it) => [it.id, it]));
  return order.map((row) => ({
    id: row.id,
    label: row.label,
    values: SEGMENT_ORDER.map((s) => ({
      seg: s.id,
      segLabel: s.label,
      pct: byId[row.id]?.byAudience?.[s.id]?.pct ?? 0,
      color: SEG_COLORS[s.id],
    })),
  }));
};

/* ── TGI cut → items (one segment) ───────────────────────────────────────────
 * pct = % of segment; index = vs GB adults (100 = avg). Sorted most-distinctive
 * (highest |index-100|) first so the chart leads with the sharpest skew. */
const tgiItems = (metric, segment) => {
  const rows = metric.rowsBySeg?.[segment] || [];
  return rows
    .filter((r) => typeof r.index === 'number')
    .map((r, i) => ({ id: `t${i}`, label: tidyLabel(r.label), pct: r.index, pen: r.pct, index: r.index }))
    .sort((a, b) => Math.abs(b.index - 100) - Math.abs(a.index - 100));
};

/* ── view resolution — items + read-out figure + honest note ─────────────── */

const sortItems = (items, metric) => {
  if (metric.kind === 'tgi') return items; // already skew-sorted
  return metric.sortDesc ? items.slice().sort((a, b) => b.pct - a.pct) : items;
};

const resolveView = (state) => {
  const { metric, segment } = state;
  if (metric.kind === 'tgi') {
    const seg = segment === ALL_SEGMENTS || segment === COMPARE ? 'architects' : segment;
    const s = SEGMENT_BY_ID[seg];
    return {
      items: tgiItems(metric, seg),
      isIndex: true,
      note: `${s.label} · ${metric.dim.charAt(0).toUpperCase() + metric.dim.slice(1)} · index vs UK average (100 = average).`,
    };
  }
  // survey
  if (segment === COMPARE) {
    return {
      groups: surveyCompareGroups(metric),
      items: sortItems(surveyItems(metric, ALL_SEGMENTS), metric), // drives the masthead readout
      isIndex: false,
      note: COMPARE_NOTE,
    };
  }
  if (segment === ALL_SEGMENTS) {
    return { items: sortItems(surveyItems(metric, ALL_SEGMENTS), metric), isIndex: false, note: NATIONAL_NOTE };
  }
  const s = SEGMENT_BY_ID[segment];
  return {
    items: sortItems(surveyItems(metric, segment), metric),
    isIndex: false,
    note: `${s.label} only · ${s.sharePct}% of the nation · % giving each answer.`,
  };
};

/** The single defining figure for the chart on screen — the leading item.
 * TGI cuts lead with the most-distinctive (highest |index-100|, already first);
 * survey cuts lead with the largest share. */
const readoutFor = (items) => {
  if (!items.length) return { value: 0, label: '', index: null };
  const lead = items[0];
  return { value: lead.pct, label: lead.label, index: lead.index ?? null };
};

/* ── view — every cut rendered as ONE lollipop chart ─────────────────────── */

const NO_DATA = [{ id: 'none', label: 'No data', pct: 0 }];

/* Survey: round UP to a clean 10 above the largest value, clamped [40,100]. */
const axisMaxPct = (items) => {
  const top = items.reduce((m, i) => Math.max(m, i.pct || 0), 0);
  if (top >= 90) return 100;
  return Math.min(100, Math.max(40, Math.ceil((top + 6) / 10) * 10));
};
/* Index axis: round UP to a clean 20 above the largest index, min 120. */
const axisMaxIndex = (items) => {
  const top = items.reduce((m, i) => Math.max(m, i.pct || 0), 0);
  return Math.max(120, Math.ceil((top + 10) / 20) * 20);
};

const drawView = (host, view) => {
  const rows = (view.items.length ? view.items : NO_DATA).slice(0, MAX_ITEMS);
  lollipopChart(host, {
    items: rows,
    max: view.isIndex ? axisMaxIndex(rows) : axisMaxPct(rows),
    accent: 'navy',
    decimals: view.isIndex ? 0 : 1,
    valueFormat: view.isIndex ? fmtIndex : null,
    ariaLabel: view.note,
  });
};

const SVG_NS = 'http://www.w3.org/2000/svg';

/* "All four" — a connected dot plot: one row per answer, the four segments as
 * colour-coded markers on a shared track with a thin line linking lowest to
 * highest. A legend maps colour to segment. Survey-only (it charts %). */
const drawCompareView = (host, metric, groups) => {
  const rows = (groups.length ? groups : []).slice(0, MAX_ITEMS);
  const allVals = rows.flatMap((r) => r.values);
  const max = axisMaxPct(allVals);

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

  const rowH = 52;
  const padL = 250;
  const padR = 64;
  const padT = 10;
  const w = 980;
  const fmtVal = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));
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
    const sideAbove = {};
    row.values
      .map((v, k) => ({ k, dx: x(v.pct) }))
      .sort((a, b) => a.dx - b.dx)
      .forEach((o, rank) => { sideAbove[o.k] = rank % 2 === 0; });
    row.values.forEach((v, k) => {
      const dx = x(v.pct);
      const dot = mk('circle', { cx: dx, cy, r: 7, fill: v.color, class: 'pg-compare__dot' });
      const t = document.createElementNS(SVG_NS, 'title');
      t.textContent = `${v.segLabel}: ${v.pct}%`;
      dot.appendChild(t);
      svg.appendChild(dot);
      const val = mk('text', {
        x: dx,
        y: sideAbove[k] ? cy - 13 : cy + 18,
        class: 'pg-compare__val',
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      });
      val.textContent = `${fmtVal(v.pct)}%`;
      svg.appendChild(val);
    });
  });
  host.appendChild(svg);
};

/* ── grouped metric picker — real <button> radios under group headers ───────
 * Builds the FULL bank across the screen width: one labelled column per group,
 * each a wrapping bank of square chips. One shared logical selection across all
 * groups. Keyboard-accessible (each chip is a real button; arrow keys move
 * within and across the whole bank). */
const buildMetricBank = (host, groups, currentId, onSelect) => {
  host.replaceChildren();
  const bank = document.createElement('div');
  bank.className = 'pg-qbank';
  bank.setAttribute('role', 'radiogroup');
  bank.setAttribute('aria-label', 'Choose a question or cut');

  /** @type {HTMLButtonElement[]} */
  const allChips = [];
  let activeId = currentId;

  const setActive = (id) => {
    activeId = id;
    allChips.forEach((c) => {
      const on = c.dataset.value === id;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
  };

  groups.forEach((group) => {
    const col = document.createElement('div');
    col.className = 'pg-qgroup';
    const head = document.createElement('span');
    head.className = 'pg-qgroup__head';
    head.textContent = group.label;
    col.appendChild(head);
    const chips = document.createElement('div');
    chips.className = 'pg-qgroup__chips';
    group.metrics.forEach((m) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pillgroup-chip';
      btn.setAttribute('role', 'radio');
      btn.dataset.value = m.id;
      btn.textContent = m.label;
      const on = m.id === activeId;
      btn.setAttribute('aria-checked', String(on));
      btn.classList.toggle('is-active', on);
      btn.tabIndex = on ? 0 : -1;
      btn.addEventListener('click', () => {
        if (activeId === m.id) return;
        setActive(m.id);
        onSelect(m.id);
      });
      chips.appendChild(btn);
      allChips.push(btn);
    });
    col.appendChild(chips);
    bank.appendChild(col);
  });

  // Arrow-key navigation across the whole bank (roving tabindex).
  bank.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    const i = allChips.findIndex((c) => c.dataset.value === activeId);
    if (i < 0) return;
    const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown';
    const next = allChips[(i + (fwd ? 1 : -1) + allChips.length) % allChips.length];
    next.click();
    next.focus();
  });

  host.appendChild(bank);
  return { setActive };
};

/* ── segment pills — a small self-contained radio group ─────────────────── */
const buildSegmentPills = (host, onSelect) => {
  host.replaceChildren();
  const group = document.createElement('div');
  group.className = 'pillgroup';
  group.setAttribute('role', 'radiogroup');
  group.setAttribute('aria-label', 'Filter by which Britain');
  const options = [
    { value: ALL_SEGMENTS, label: 'All' },
    ...SEGMENT_ORDER.map((s) => ({ value: s.id, label: `${s.label} ${s.sharePct}%` })),
    { value: COMPARE, label: 'All four' },
  ];
  let value = ALL_SEGMENTS;
  const chips = options.map((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pillgroup-chip';
    btn.setAttribute('role', 'radio');
    btn.dataset.value = opt.value;
    btn.textContent = opt.label;
    const on = opt.value === value;
    btn.setAttribute('aria-checked', String(on));
    btn.classList.toggle('is-active', on);
    btn.tabIndex = on ? 0 : -1;
    btn.addEventListener('click', () => {
      if (btn.disabled || value === opt.value) return;
      value = opt.value;
      chips.forEach((b) => {
        const isOn = b.dataset.value === value;
        b.classList.toggle('is-active', isOn);
        b.setAttribute('aria-checked', String(isOn));
        b.tabIndex = isOn ? 0 : -1;
      });
      onSelect(value);
    });
    group.appendChild(btn);
    return btn;
  });
  group.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const enabled = chips.filter((c) => !c.disabled);
    const i = enabled.findIndex((c) => c.dataset.value === value);
    const next = e.key === 'ArrowRight'
      ? enabled[(i + 1) % enabled.length]
      : enabled[(i - 1 + enabled.length) % enabled.length];
    next.click();
    next.focus();
  });
  host.appendChild(group);
  return {
    getValue: () => value,
    setValue: (v) => {
      const btn = chips.find((b) => b.dataset.value === v);
      if (btn) btn.click();
    },
    chips,
  };
};

/* ── The explorer (the whole step) ───────────────────────────────────────── */

const FADE_MS = 220;

const initExplorer = (rootEl, data, onChange) => {
  const { survey, tgi } = data;
  const chartHost = rootEl.querySelector('[data-pg-metric-chart]');
  const metricHost = rootEl.querySelector('[data-pg-metric-pills]');
  const segmentHost = rootEl.querySelector('[data-pg-segment-pills]');
  const noteEl = rootEl.querySelector('[data-pg-note]');
  const numEl = rootEl.querySelector('[data-pg-readout-num]');
  const unitEl = rootEl.querySelector('[data-pg-readout-unit]');
  const lineEl = rootEl.querySelector('[data-pg-readout-line]');
  const kickerEl = rootEl.querySelector('[data-pg-readout-kicker]');
  if (!chartHost || !metricHost || !segmentHost) return;

  // Build the registry from verified data, grouped.
  const surveyMetrics = buildSurveyMetrics(survey);
  const tgiMetrics = buildTgiMetrics(tgi);
  const allMetrics = [...surveyMetrics, ...tgiMetrics];
  if (!allMetrics.length) return; // fail soft

  const tgiByDim = (dim) => tgiMetrics.filter((m) => m.dim === dim);
  const GROUPS = [
    { label: 'Survey', metrics: surveyMetrics },
    { label: TGI_GROUP_LABELS.demographics, metrics: tgiByDim('demographics') },
    { label: TGI_GROUP_LABELS.lifestyle, metrics: tgiByDim('lifestyle') },
    { label: TGI_GROUP_LABELS.media, metrics: tgiByDim('media') },
  ].filter((g) => g.metrics.length);

  const metricById = Object.fromEntries(allMetrics.map((m) => [m.id, m]));

  const reduced = prefersReducedMotion();
  const state = { metric: allMetrics[0], segment: ALL_SEGMENTS };
  let lastFigure = 0;
  let started = false; // first paint = jump-cut; later = count

  const paintReadout = (view) => {
    if (noteEl) noteEl.textContent = view.note;
    const { value, label } = readoutFor(view.items);
    if (kickerEl) {
      kickerEl.textContent = view.isIndex ? 'Most distinctive' : 'The leading answer';
    }
    if (numEl) {
      const decimals = view.isIndex ? 0 : 1;
      if (started && !reduced) {
        countUp(numEl, { from: lastFigure, to: value, decimals, durationMs: 700 });
      } else {
        numEl.textContent = value.toLocaleString('en-GB', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      }
      lastFigure = value;
    }
    if (unitEl) unitEl.textContent = view.isIndex ? 'idx' : '%';
    // Colour the leading-answer line in the brand accent so the highlighted
    // point reads as highlighted. TGI cuts → teal; survey cuts → coral.
    if (lineEl) {
      lineEl.textContent = label;
      lineEl.classList.toggle('is-index', view.isIndex);
    }
  };

  const paint = ({ crossfade = false } = {}) => {
    const view = resolveView(state);
    const build = () => {
      chartHost.replaceChildren();
      if (view.groups) drawCompareView(chartHost, state.metric, view.groups);
      else drawView(chartHost, view);
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
    paintReadout(view);
  };

  // TGI cuts are segment-only: "All" and "All four" are invalid for them.
  const syncSegmentAvailability = (segApi) => {
    const isTgi = state.metric.kind === 'tgi';
    segApi.chips.forEach((chip) => {
      const v = chip.dataset.value;
      const disabled = isTgi && (v === ALL_SEGMENTS || v === COMPARE);
      chip.disabled = disabled;
      chip.setAttribute('aria-disabled', String(disabled));
    });
    if (isTgi && (state.segment === ALL_SEGMENTS || state.segment === COMPARE)) {
      state.segment = 'architects';
      segApi.setValue('architects');
    }
  };

  const segApi = buildSegmentPills(segmentHost, (value) => {
    state.segment = value;
    paint({ crossfade: true });
    onChange?.();
  });

  buildMetricBank(metricHost, GROUPS, state.metric.id, (id) => {
    state.metric = metricById[id] || allMetrics[0];
    syncSegmentAvailability(segApi);
    paint({ crossfade: true });
    onChange?.();
  });

  syncSegmentAvailability(segApi);

  // First paint (jump-cut), then enable counting.
  paint();
  started = true;
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
