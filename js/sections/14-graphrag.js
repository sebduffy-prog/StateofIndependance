/**
 * 14-graphrag.js — the GraphRAG segment explorer (showpiece).
 *
 * Three things share one navy full-bleed stage:
 *   1. THE NETWORK (centre, given most of the viewport) — the living force-graph
 *      from js/lib/segment-graph.js: four segment hubs woven to the signals they
 *      over-index on (interests, channels, AI stance + distinctive TGI cuts from
 *      data/tgi.json). Click a segment to light up what it over-indexes on; click
 *      a signal to see who shares it. Auto-cycles until the user takes over.
 *   2. THE FOUR AUDIENCE PROFILES (bottom) — a short, wide strip of four cards
 *      (Architects / Hustlers / Coasters / Retreaters) built from data/segments.json.
 *      The active segment highlights as the graph cycles or on tap.
 *   3. EVERY SURVEY QUESTION (top) — a labelled selector over ALL survey questions
 *      reformatted by audience (data/survey.json → surveyByAudience), rendering a
 *      per-audience % + index comparison. Nothing inferred; values straight from
 *      State_of_Independence_Survey_by_Audience.xlsx.
 *
 * Navy full-bleed ground → the graph runs with onNavy:true (cream/teal marks).
 * Every CSS selector scoped to #\31 4-graphrag. Contract: export default init().
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="14-graphrag">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { segmentGraph } from '../lib/segment-graph.js';

// How many distinctive TGI statements to weave in per segment, per facet, and
// the index floor that counts as a genuine over-index (100 = UK adult average).
const TGI_PER_FACET = 12;
const TGI_OVERINDEX_MIN = 101;
const TGI_FACETS = ['lifestyle', 'media', 'demographics'];

// Auto-reveal: dwell on each segment long enough to read its signals, then move
// on, so every question-answer surfaces without a tap. A manual tap pauses it.
const AUTOCYCLE_DWELL_MS = 3400;
const AUTOCYCLE_START_MS = 900;

// An index this far from 100 reads as a meaningful over/under for the audience.
const INDEX_MEANINGFUL = 120;
const INDEX_LOW = 80;

// Statement labels that are codes / housekeeping rather than real human signals.
const TGI_LABEL_SKIP =
  /^(not applicable|don.?t know|use:|use no|use yes|non user|other set|more than|less than|n\/?a|\d)/i;

// Audience identity for the four profile cards / survey columns. Order + accent
// match the legend and the graph hubs.
const AUDIENCES = [
  { id: 'architects', label: 'Architects', accent: '#F0CB08' },
  { id: 'hustlers', label: 'Hustlers', accent: '#2BB7E8' },
  { id: 'coasters', label: 'Coasters', accent: '#FF8F79' },
  { id: 'retreaters', label: 'Retreaters', accent: '#B9C0DE' },
];

// data/tgi.json wraps verbatim statements in smart/straight quotes; strip them.
const cleanStatement = (s) =>
  String(s || '').replace(/\s+/g, ' ').replace(/^["“”']+|["“”']+$/g, '').trim();

const escHtml = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmtPct = (n) => (typeof n === 'number' ? `${n.toFixed(1)}%` : '—');

/**
 * Pull every above-average TGI signal for one segment from data/tgi.json.
 * @param {object|undefined} segRows  one segment node from tgi.json
 * @returns {string[]} de-duplicated statement labels
 */
function distinctiveTgiSignals(segRows) {
  if (!segRows) return [];
  const out = [];
  const seen = new Set();
  TGI_FACETS.forEach((facet) => {
    const raw = segRows[facet];
    const rows = Array.isArray(raw)
      ? raw
      : (raw && Array.isArray(raw.skews) ? raw.skews : []);
    rows
      .filter((r) => r && typeof r.index === 'number' && r.index >= TGI_OVERINDEX_MIN)
      .filter((r) => !TGI_LABEL_SKIP.test(cleanStatement(r.label)))
      .sort((a, b) => b.index - a.index)
      .slice(0, TGI_PER_FACET)
      .forEach((r) => {
        const label = cleanStatement(r.label);
        const key = label.toLowerCase();
        if (label && !seen.has(key)) { seen.add(key); out.push(label); }
      });
  });
  return out;
}

/**
 * Deep-clone the segments and weave each one's distinctive TGI statements into
 * its `interests` list so the shared graph renders them as satellites.
 */
function weaveSegments(segments, tgi) {
  const byId = (tgi && tgi.segments) || {};
  return segments.map((s) => {
    const signals = distinctiveTgiSignals(byId[s.id]);
    const interests = [...(s.interests || []), ...signals];
    return { ...s, interests };
  });
}

/* ── The four audience profile cards — short and wide ─────────────────────── */

/**
 * Build the bottom strip of four audience profile cards from segments data.
 * Each card is deliberately SHORT and WIDE: a horizontal row of name, descriptor
 * and two compact facts. Returns a map id → card element for highlight syncing.
 */
function renderProfiles(panelMount, segList) {
  panelMount.innerHTML = '';
  panelMount.classList.add('graphrag-profiles--ready');
  const cards = new Map();
  AUDIENCES.forEach((aud) => {
    const seg = segList.find((s) => s.id === aud.id);
    if (!seg) return;
    const card = document.createElement('article');
    card.className = 'gp-card';
    card.dataset.id = aud.id;
    card.style.setProperty('--gp-accent', aud.accent);
    card.innerHTML =
      `<div class="gp-head">` +
        `<span class="gp-swatch" aria-hidden="true"></span>` +
        `<h3 class="gp-name">${escHtml(seg.name || aud.label)}</h3>` +
        `<span class="gp-share">${escHtml(seg.sharePct)}%</span>` +
      `</div>` +
      `<p class="gp-desc">${escHtml(seg.threeWordDescriptor || '')}</p>` +
      `<dl class="gp-facts">` +
        `<div><dt>Who</dt><dd>${escHtml(seg.who || '')}</dd></div>` +
        `<div><dt>Money</dt><dd>${escHtml(seg.money || '')}</dd></div>` +
      `</dl>`;
    panelMount.appendChild(card);
    cards.set(aud.id, card);
  });
  return cards;
}

function highlightProfile(cards, id) {
  cards.forEach((card, cid) => card.classList.toggle('is-active', cid === id));
}

/* ── The survey-question explorer — EVERY question, by audience ───────────── */

/**
 * Wire the survey selector + per-audience table from survey.surveyByAudience.
 * Renders nothing (fails soft) when the block is missing.
 */
function setupSurveyExplorer(rootEl, survey) {
  const root = rootEl.querySelector('[data-graphrag-survey]');
  const select = rootEl.querySelector('[data-gs-select]');
  const table = rootEl.querySelector('[data-gs-table]');
  const measure = rootEl.querySelector('[data-gs-measure]');
  if (!root || !select || !table) return;

  const block = survey && survey.surveyByAudience;
  const sections = block && Array.isArray(block.sections) ? block.sections : null;
  if (!sections || !sections.length) {
    root.hidden = true;
    return;
  }

  // Populate the selector with every survey question.
  select.innerHTML = sections
    .map((sec, i) => `<option value="${i}">${escHtml(sec.title)}</option>`)
    .join('');

  const renderQuestion = (idx) => {
    const sec = sections[idx];
    if (!sec) return;
    if (measure) {
      measure.textContent = sec.questionCode
        ? `${sec.questionCode} · ${sec.items.length} answers · % within each audience`
        : `${sec.items.length} answers · % within each audience`;
    }
    const head =
      `<div class="gs-row gs-row--head" role="row">` +
        `<span class="gs-cell gs-cell--label" role="columnheader">Answer</span>` +
        AUDIENCES.map((a) =>
          `<span class="gs-cell gs-cell--val" role="columnheader">${escHtml(a.label)}</span>`).join('') +
      `</div>`;
    const rows = sec.items.map((item) => {
      const cells = AUDIENCES.map((a) => {
        const v = item.byAudience && item.byAudience[a.id];
        const pct = v ? v.pct : null;
        const index = v ? v.index : null;
        const tone =
          index == null ? '' :
          index >= INDEX_MEANINGFUL ? ' is-over' :
          index <= INDEX_LOW ? ' is-under' : '';
        const title = index == null ? '' : ` title="Index ${index} vs UK average (100)"`;
        return `<span class="gs-cell gs-cell--val${tone}" role="cell"${title}>` +
          `<span class="gs-pct">${fmtPct(pct)}</span>` +
          (index == null ? '' : `<span class="gs-idx">${index}</span>`) +
        `</span>`;
      }).join('');
      return `<div class="gs-row" role="row">` +
        `<span class="gs-cell gs-cell--label" role="cell">${escHtml(item.label)}</span>` +
        cells +
      `</div>`;
    }).join('');
    table.innerHTML = head + rows;
  };

  select.addEventListener('change', () => renderQuestion(Number(select.value)));
  renderQuestion(0);
}

export default function init(rootEl, data) {
  const { segments, survey, journey } = data || {};

  // Re-play the arrival each time this step reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const mount = rootEl.querySelector('[data-graphrag-mount]');
  const msg = rootEl.querySelector('[data-graphrag-msg]');
  const panelMount = rootEl.querySelector('[data-graphrag-panel]');
  if (!mount) return;

  // The survey explorer is independent of the graph — wire it up regardless.
  setupSurveyExplorer(rootEl, survey);

  // Fail soft: no segment data → leave the "loading" message visible, no throw.
  const segList = segments && Array.isArray(segments.segments) ? segments.segments : null;
  if (!segList || !segList.length) return;

  // The four audience profile cards (short, wide strip beneath the graph).
  const profileCards = panelMount ? renderProfiles(panelMount, segList) : new Map();

  let graph = null;
  let built = false;

  // ── Auto-reveal controller ──────────────────────────────────────────────
  const segIds = segList.map((s) => s.id);
  let cycleIdx = 0;
  let cycleTimer = null;
  let startTimer = null;
  let userTookOver = false;
  let isProgrammatic = false;     // true while WE drive a selection

  const stopCycle = () => {
    if (cycleTimer) { clearInterval(cycleTimer); cycleTimer = null; }
    if (startTimer) { clearTimeout(startTimer); startTimer = null; }
  };

  const showNext = () => {
    if (!graph || userTookOver) return;
    const id = segIds[cycleIdx % segIds.length];
    cycleIdx += 1;
    isProgrammatic = true;
    graph.selectSegment(id);
    isProgrammatic = false;
    highlightProfile(profileCards, id);
  };

  const startCycle = () => {
    if (userTookOver || cycleTimer || startTimer) return;
    startTimer = setTimeout(() => {
      startTimer = null;
      showNext();
      cycleTimer = setInterval(showNext, AUTOCYCLE_DWELL_MS);
    }, AUTOCYCLE_START_MS);
  };

  const onManualSelectSegment = (seg) => {
    journey && journey.ready && journey.ready();
    if (seg && seg.id) highlightProfile(profileCards, seg.id);
    if (isProgrammatic) return;   // our own auto-cycle selection, ignore
    userTookOver = true;          // a real tap: hand over, stop cycling
    stopCycle();
  };

  const onManualSelectAttr = () => {
    journey && journey.ready && journey.ready();
    if (isProgrammatic) return;
    userTookOver = true;
    stopCycle();
  };

  const build = (tgi) => {
    if (built) return;
    built = true;
    if (msg) msg.hidden = true;

    const woven = weaveSegments(segList, tgi);

    graph = segmentGraph(mount, {
      segments: woven,
      facets: ['interests', 'channels', 'aiAttitude'],
      width: 1280,
      height: 820,
      onNavy: true,
      ariaLabel: 'Explore the four segments and the signals they over-index on',
      onSelectSegment: onManualSelectSegment,
      onSelectAttribute: onManualSelectAttr,
    });

    journey && journey.gate && journey.gate();

    startCycle();

    rootEl.addEventListener('chapter:arrive', () => {
      graph && graph.setActive && graph.setActive(true);
      if (!userTookOver) { cycleIdx = 0; startCycle(); }
    });

    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      graph && graph.setActive && graph.setActive(!hidden);
      if (hidden) stopCycle();
      else if (!userTookOver) startCycle();
    };
    document.addEventListener('visibilitychange', onVisibility);

    window.addEventListener('pagehide', () => {
      stopCycle();
      document.removeEventListener('visibilitychange', onVisibility);
      graph && graph.destroy && graph.destroy();
    }, { once: true });
  };

  // data/tgi.json is not in the shell's data bundle → fetch it. Build regardless.
  fetch('data/tgi.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((tgi) => build(tgi))
    .catch(() => build(null));
}
