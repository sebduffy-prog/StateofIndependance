/**
 * 14-graphrag.js — the GraphRAG segment explorer (showpiece).
 *
 * Builds the living force-graph from js/lib/segment-graph.js: four segment hubs
 * woven to their distinctive signals — interests, channels, AI stance and the
 * top over-indexing TGI statements (data/tgi-statements.json). Click a segment
 * to light up what it over-indexes on; click a signal to see who shares it.
 *
 * Navy full-bleed ground → the graph runs with onNavy:true (cream/teal marks).
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\31 4-graphrag.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="14-graphrag">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { segmentGraph } from '../lib/segment-graph.js';

// How many distinctive TGI statements to weave in per segment, per facet, and
// the index floor that counts as a genuine over-index (per tgi indexNote:
// ">=120 strongly over-indexes"). The graph has far more space than the few
// nodes it used to show, so we pull from all three facets with a higher
// per-facet cap — ~5x more real statement satellites per hub, never fabricated.
const TGI_PER_FACET = 8;
const TGI_OVERINDEX_MIN = 120;
const TGI_FACETS = ['lifestyle', 'media', 'demographics'];

// Auto-reveal: dwell on each segment long enough to read its signals, then move
// on, so every question-answer surfaces without a tap. A manual tap pauses it.
const AUTOCYCLE_DWELL_MS = 3400;
const AUTOCYCLE_START_MS = 900;

// Statement labels that are codes / housekeeping rather than real human signals
// — skipped so every satellite reads as a meaningful audience cut.
const TGI_LABEL_SKIP = /^(not applicable|don't know|don.t know|use:|non user|other set|more than|less than|\d|n\/?a)/i;

const cleanStatement = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/**
 * Pick the top over-indexing, human-readable TGI statements for one segment.
 * @returns {string[]} de-duplicated statement labels
 */
function distinctiveTgiSignals(segStatements) {
  if (!segStatements) return [];
  const out = [];
  const seen = new Set();
  TGI_FACETS.forEach((facet) => {
    const rows = Array.isArray(segStatements[facet]) ? segStatements[facet] : [];
    rows
      .filter((r) => r && typeof r.index === 'number' && r.index >= TGI_OVERINDEX_MIN)
      .filter((r) => !TGI_LABEL_SKIP.test(cleanStatement(r.statement)))
      .sort((a, b) => b.index - a.index)
      .slice(0, TGI_PER_FACET)
      .forEach((r) => {
        const label = cleanStatement(r.statement);
        const key = label.toLowerCase();
        if (label && !seen.has(key)) { seen.add(key); out.push(label); }
      });
  });
  return out;
}

/**
 * Deep-clone the segments and weave each one's distinctive TGI statements into
 * its `interests` list, so the shared graph renders them as satellites without
 * touching the lib. Channels + AI stance ride along as their own satellites.
 */
function weaveSegments(segments, tgiStatements) {
  const byId = (tgiStatements && tgiStatements.segments) || {};
  return segments.map((s) => {
    const tgi = distinctiveTgiSignals(byId[s.id]);
    const interests = [...(s.interests || []), ...tgi];
    return { ...s, interests };
  });
}

export default function init(rootEl, data) {
  const { segments, journey } = data || {};

  // Re-play the arrival each time this step reaches focus (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const mount = rootEl.querySelector('[data-graphrag-mount]');
  const msg = rootEl.querySelector('[data-graphrag-msg]');
  const panelMount = rootEl.querySelector('[data-graphrag-panel]');
  if (!mount) return;

  // Fail soft: no segment data → leave the "loading" message visible, no throw.
  const segList = segments && Array.isArray(segments.segments) ? segments.segments : null;
  if (!segList || !segList.length) return;

  let graph = null;
  let built = false;

  // ── Auto-reveal controller ──────────────────────────────────────────────
  // On arrival the graph automatically cycles through every segment so all the
  // question-answers surface on their own. The moment the user taps a node we
  // hand control over and stop cycling (tap/hover stays fully manual).
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
  };

  const startCycle = () => {
    if (userTookOver || cycleTimer || startTimer) return;
    startTimer = setTimeout(() => {
      startTimer = null;
      showNext();
      cycleTimer = setInterval(showNext, AUTOCYCLE_DWELL_MS);
    }, AUTOCYCLE_START_MS);
  };

  const onManualSelect = () => {
    journey && journey.ready && journey.ready();
    if (isProgrammatic) return;   // our own auto-cycle selection, ignore
    userTookOver = true;          // a real tap: hand over, stop cycling
    stopCycle();
  };

  const build = (tgiStatements) => {
    if (built) return;
    built = true;
    if (msg) msg.hidden = true;

    const woven = weaveSegments(segList, tgiStatements);

    graph = segmentGraph(mount, {
      segments: woven,
      facets: ['interests', 'channels', 'aiAttitude'],
      width: 1080,
      height: 720,
      onNavy: true,
      ariaLabel: 'Explore the four segments and the signals they over-index on',
      panelMount: panelMount || undefined,
      onSelectSegment: onManualSelect,
      onSelectAttribute: onManualSelect,
    });

    // Advisory hint on the marquee interaction (never blocks Next).
    journey && journey.gate && journey.gate();

    startCycle();

    // Re-arm the auto-reveal whenever the step regains focus (the shell only
    // fires chapter:arrive, never a leave event), unless the user has taken over.
    rootEl.addEventListener('chapter:arrive', () => {
      graph && graph.setActive && graph.setActive(true);
      if (!userTookOver) { cycleIdx = 0; startCycle(); }
    });

    // A backgrounded tab should not keep the gentle drift running.
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden';
      graph && graph.setActive && graph.setActive(!hidden);
      if (hidden) stopCycle();
      else if (!userTookOver) startCycle();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Clean up hard on page unload so we never leak a rAF/listener/timer.
    window.addEventListener('pagehide', () => {
      stopCycle();
      document.removeEventListener('visibilitychange', onVisibility);
      graph && graph.destroy && graph.destroy();
    }, { once: true });
  };

  // Weave in the distinctive TGI statements (data/tgi-statements.json is not in
  // the shell's data bundle, so fetch it here). Build regardless of the result.
  fetch('data/tgi-statements.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((tgiStatements) => build(tgiStatements))
    .catch(() => build(null));
}
