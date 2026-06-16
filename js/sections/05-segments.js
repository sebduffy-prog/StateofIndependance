/**
 * Chapter 05 — segments. THE SHOWPIECE.
 *
 * Three ways into the four Britains:
 *   1. A 2x2 "agency to act" compass. ~200 ink dots drift, then resolve into
 *      four proportional clusters (Architects 17 / Hustlers 28 / Coasters 27 /
 *      Retreaters 28). Quadrant buttons open full profile data-cards.
 *   2. A GraphRAG segment explorer (segments as hubs, their attributes as
 *      satellites; shared attributes bridge the camps).
 *   3. An eight-question quiz that drops the reader's own mustard dot into
 *      their segment, live, as they answer.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="05-segments">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { countUp } from '../lib/counter.js';
import { dotField, clusterPoints, lollipopChart, dotPlot } from '../lib/charts.js';
import { quiz } from '../lib/interactions.js';
import segmentGraph from '../lib/segment-graph.js';
import { observeParallax } from '../lib/experiential.js';

const DOT_COUNT = 200;
const FORMATION_DELAY_MS = 480; // drift, then resolve into clusters
const COUNT_DURATION_MS = 1100;

/**
 * Metric charts default to high-contrast NAVY components (client feedback):
 * the old per-segment mustard/teal accents vanished against the warm card.
 * Navy reads on every ground, and the value labels carry the segment story.
 */
const METRIC_ACCENT = 'navy';

/**
 * Quadrant rects in dotField's 0..1 normalised space.
 *  - x: optimistic = right (high x), pessimistic = left (low x).
 *  - y: proactive = top (LOW y, canvas y grows downward), passive = bottom (high y).
 * A small inset keeps clusters clear of the hairline axes and the map edges.
 */
const INSET = 0.06;
const HALF = 0.5;
const QUAD_RECTS = {
  hustlers:   { x: INSET,              y: INSET,              w: HALF - INSET * 1.5, h: HALF - INSET * 1.5 }, // pessimistic + proactive -> top-left
  architects: { x: HALF + INSET * 0.5, y: INSET,              w: HALF - INSET * 1.5, h: HALF - INSET * 1.5 }, // optimistic + proactive -> top-right
  retreaters: { x: INSET,              y: HALF + INSET * 0.5, w: HALF - INSET * 1.5, h: HALF - INSET * 1.5 }, // pessimistic + passive -> bottom-left
  coasters:   { x: HALF + INSET * 0.5, y: HALF + INSET * 0.5, w: HALF - INSET * 1.5, h: HALF - INSET * 1.5 }, // optimistic + passive -> bottom-right
};

/** Centre of a quadrant rect (0..1) — where the "you" dot lands. */
const quadCentre = (id) => {
  const r = QUAD_RECTS[id];
  return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
};

const escapeHtml = (s) =>
  String(s).replace(/[&<>"]/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

/**
 * Build the cluster formation: a flat list of 0..1 targets, one block per
 * segment sized by sharePct of DOT_COUNT (rounded, remainder reconciled).
 */
const buildClusterTargets = (segments) => {
  const counts = segments.map((s) => Math.round((s.sharePct / 100) * DOT_COUNT));
  let used = counts.reduce((a, b) => a + b, 0);
  let i = 0;
  while (used < DOT_COUNT) { counts[i % counts.length] += 1; used += 1; i += 1; }
  while (used > DOT_COUNT) { counts[i % counts.length] -= 1; used -= 1; i += 1; }

  const targets = [];
  segments.forEach((seg, idx) => {
    const pts = clusterPoints(counts[idx], QUAD_RECTS[seg.id]);
    pts.forEach((p) => targets.push({ x: p.x, y: p.y }));
  });
  return targets;
};

/**
 * Display-only short labels for the metric charts. The full survey wording is
 * kept in the data; these trimmed forms fit the lollipop/dot-plot label slot
 * (200 user-units) so no label is clipped at the chart's left edge. Same fact,
 * no rephrasing of meaning.
 */
const SHORT_LABEL = {
  'Optimistic about next decade': 'Optimistic on the decade',
  'Self-reliant, look after myself': 'Self-reliant',
  'Anxious about the future': 'Anxious about the future',
  'In control of my life': 'In control of my life',
  'Exhausted / stretched': 'Exhausted / stretched',
};
const shortLabel = (label) => SHORT_LABEL[label] || label;

/** Top-N entries of a {label:{pct,index}} metric, sorted by pct, as chart items. */
const metricItems = (metric, n) =>
  Object.entries(metric || {})
    .map(([label, v]) => ({ label: shortLabel(label), pct: v.pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, n);

/** Render a segment's full profile as a .si-datacard with metric charts. */
const renderProfile = (host, seg) => {
  host.innerHTML = `
    <article class="si-datacard seg-card" data-seg="${escapeHtml(seg.id)}" tabindex="-1">
      <div class="seg-card-top">
        <span class="seg-card-share num">${seg.sharePct}%</span>
        <div class="seg-card-id">
          <h3 class="si-datacard-title seg-prof-name">${escapeHtml(seg.name)}</h3>
          <p class="seg-prof-trio">${escapeHtml(seg.threeWordDescriptor)}</p>
        </div>
      </div>
      <blockquote class="seg-prof-quote">${escapeHtml(seg.heroQuote)}</blockquote>
      <div class="seg-prof-facts">
        <div class="seg-prof-row"><span class="seg-prof-key">Who</span><span class="seg-prof-val">${escapeHtml(seg.who)}</span></div>
        <div class="seg-prof-row"><span class="seg-prof-key">Money</span><span class="seg-prof-val">${escapeHtml(seg.money)}</span></div>
        <div class="seg-prof-row"><span class="seg-prof-key">Spending</span><span class="seg-prof-val">${escapeHtml(seg.spendPriorities)}</span></div>
      </div>

      <div class="seg-metric">
        <h4 class="seg-metric-title">Mindset, net agree</h4>
        <div class="chart-holder seg-metric-chart" data-chart="mindset"></div>
      </div>
      <div class="seg-metric">
        <h4 class="seg-metric-title">AI use by task</h4>
        <div class="chart-holder seg-metric-chart" data-chart="ai"></div>
      </div>

      <p class="seg-prof-ai"><span class="seg-prof-key">On AI</span><span>${escapeHtml(seg.aiAttitude)}</span></p>
    </article>`;

  // Lollipop for mindset net-agree (magnitude across the five mindset items),
  // dot plot for AI-use-by-task (compact six-item ranking). Richer than bars.
  const mindsetHost = host.querySelector('[data-chart="mindset"]');
  const aiHost = host.querySelector('[data-chart="ai"]');
  if (mindsetHost) {
    lollipopChart(mindsetHost, {
      items: metricItems(seg.metrics.mindsetNetAgree, 5),
      accent: METRIC_ACCENT,
      ariaLabel: `${seg.name} mindset, net agree by statement`,
    });
  }
  if (aiHost) {
    dotPlot(aiHost, {
      items: metricItems(seg.metrics.aiUseByTask, 6),
      max: 30,
      accent: METRIC_ACCENT,
      ariaLabel: `${seg.name} AI use by task`,
    });
  }
  return host.querySelector('.seg-card');
};

export default function init(rootEl, data) {
  const segments = data && data.segments && data.segments.segments;
  const quizSpec = data && data.segments && data.segments.quiz;
  if (!segments || !quizSpec) return; // fail soft

  /* Journey gating: this step REQUIRES an interaction. Next starts LOCKED and
     unlocks the first time the visitor either opens a segment profile or
     completes the quiz — whichever comes first. Guarded so it only fires once. */
  const journey = data && data.journey;
  let readyFired = false;
  const declareReady = () => {
    if (readyFired) return;
    readyFired = true;
    if (journey && typeof journey.ready === 'function') journey.ready();
  };
  if (journey && typeof journey.gate === 'function') journey.gate();

  observeReveals(rootEl);

  /* Experiential motion: subtle parallax on the hero/maze decorative layers
     (orbit rings + deck renders drift as they pass through the viewport). Pure
     transform/opacity, reduced-motion safe, clamped so nothing covers copy. */
  observeParallax(rootEl, { maxShiftPx: 48 });

  /* Staggered entrance for the stacked image-title lines (deck lockup feel):
     each line reveals in sequence the first time the hero scrolls in. */
  const titleLines = Array.from(rootEl.querySelectorAll('[data-seg-stagger] .seg-title-line'));
  if (titleLines.length && !prefersReducedMotion()) {
    const tio = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        titleLines.forEach((line, i) => {
          line.style.transitionDelay = `${i * 90}ms`;
          line.classList.add('is-in');
        });
        obs.disconnect();
      });
    }, { threshold: 0.4 });
    tio.observe(titleLines[0]);
  } else {
    titleLines.forEach((line) => line.classList.add('is-in'));
  }

  const byId = new Map(segments.map((s) => [s.id, s]));
  const mapEl = rootEl.querySelector('[data-map]');
  const fieldHost = rootEl.querySelector('[data-dotfield]');
  const profileHost = rootEl.querySelector('[data-profile]');
  const profileRest = rootEl.querySelector('[data-profile-rest]');
  const hintEl = rootEl.querySelector('[data-maphint]');
  const youTag = rootEl.querySelector('[data-youtag]');
  const quads = Array.from(rootEl.querySelectorAll('.seg-quad'));
  if (!mapEl || !fieldHost) return;

  const reduced = prefersReducedMotion();

  /* ── dot field: drift, then resolve into clusters ─────────────────── */
  const field = dotField(fieldHost, {
    count: DOT_COUNT,
    dotRadius: 2.6,
    ariaLabel: 'A field of survey respondents resolving into four segment clusters.',
  });
  const clusterTargets = buildClusterTargets(segments);

  const resolve = () => {
    if (!reduced) field.drift(0); // settle drift before forming
    field.formation(clusterTargets);
  };

  const runCounters = () => {
    rootEl.querySelectorAll('[data-share]').forEach((el) => {
      const seg = byId.get(el.dataset.share);
      if (!seg) return;
      countUp(el, { to: seg.sharePct, durationMs: COUNT_DURATION_MS, suffix: '%' });
    });
  };

  /* roster tiles count their share independently the moment they scroll in,
     so the band reads as live data even before the compass forms below it. */
  const rosterTiles = Array.from(rootEl.querySelectorAll('.seg-tile'));
  let rosterCounted = false;
  const runRosterCounters = () => {
    if (rosterCounted) return;
    rosterCounted = true;
    rosterTiles.forEach((tile) => {
      const el = tile.querySelector('[data-share]');
      const seg = el && byId.get(el.dataset.share);
      if (!el || !seg) return;
      countUp(el, { to: seg.sharePct, durationMs: COUNT_DURATION_MS, suffix: '%' });
    });
  };
  // Defined here so selectQuad / clearQuad (declared below) can mirror the
  // roster's active state without a temporal-dead-zone hazard at call time.
  const syncRoster = () => {
    rosterTiles.forEach((tile) => {
      const on = tile.dataset.tile === activeId;
      tile.classList.toggle('is-active', on);
      tile.setAttribute('aria-pressed', String(on));
    });
  };

  let formed = false;
  const startFormation = () => {
    if (formed) return;
    formed = true;
    if (reduced) {
      resolve();
      runCounters();
      return;
    }
    field.drift(1);
    window.setTimeout(() => { resolve(); runCounters(); }, FORMATION_DELAY_MS);
  };

  const rosterBand = rootEl.querySelector('.seg-roster');
  if (reduced) {
    startFormation();
    runRosterCounters();
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        startFormation();
        obs.disconnect();
      });
    }, { threshold: 0.3 });
    io.observe(mapEl);

    if (rosterBand) {
      const rio = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          runRosterCounters();
          obs.disconnect();
        });
      }, { threshold: 0.4 });
      rio.observe(rosterBand);
    } else {
      runRosterCounters();
    }
  }

  /* ── quadrant selection: dim the rest, open the profile ───────────── */
  let activeId = null;
  let graph = null; // forward ref so quadrant selection can mirror the graph
  const selectQuad = (id, { syncGraph = true } = {}) => {
    const seg = byId.get(id);
    if (!seg) return;
    activeId = id;
    mapEl.classList.add('is-focused');
    quads.forEach((q) => {
      const on = q.dataset.quad === id;
      q.classList.toggle('is-active', on);
      q.classList.toggle('is-dimmed', !on);
      q.setAttribute('aria-pressed', String(on));
    });
    if (hintEl) hintEl.hidden = true;
    if (profileRest) profileRest.hidden = true;
    const card = renderProfile(profileHost, seg);
    profileHost.classList.add('is-open');
    if (card && !reduced) card.focus({ preventScroll: true });
    if (syncGraph && graph) graph.selectSegment(id);
    syncRoster();
    // First profile opened (via quad, roster, graph, or quiz landing) unlocks Next.
    declareReady();
  };

  const clearQuad = ({ syncGraph = true } = {}) => {
    activeId = null;
    mapEl.classList.remove('is-focused');
    quads.forEach((q) => {
      q.classList.remove('is-active', 'is-dimmed');
      q.setAttribute('aria-pressed', 'false');
    });
    profileHost.classList.remove('is-open');
    profileHost.innerHTML = '';
    if (profileRest) profileRest.hidden = false;
    if (hintEl) hintEl.hidden = false;
    if (syncGraph && graph) graph.clear();
    syncRoster();
  };

  quads.forEach((q) => {
    q.setAttribute('aria-pressed', 'false');
    q.addEventListener('click', () => {
      if (activeId === q.dataset.quad) clearQuad();
      else selectQuad(q.dataset.quad);
    });
  });
  mapEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeId) { clearQuad(); }
  });

  /* ── roster tiles: a fast way in. A tile mirrors the compass selection and
     scrolls the stage into view so the profile is never opened off-screen. ── */
  rosterTiles.forEach((tile) => {
    tile.setAttribute('aria-pressed', 'false');
    tile.addEventListener('click', () => {
      const id = tile.dataset.tile;
      if (activeId === id) { clearQuad(); return; }
      selectQuad(id);
      if (mapEl && typeof mapEl.scrollIntoView === 'function') {
        mapEl.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  });

  /* ── GraphRAG explorer: a second way in, wired to the map ─────────── */
  const graphHost = rootEl.querySelector('[data-segment-graph]');
  if (graphHost) {
    graph = segmentGraph(graphHost, {
      segments,
      facets: ['interests', 'channels', 'aiAttitude', 'demographics'],
      width: 920,
      height: 600,
      ariaLabel: 'The four segments and the interests, channels, AI stances and demographics they share.',
      // Selecting a segment in the graph opens its profile on the map (no loop back).
      onSelectSegment: (seg) => { if (seg && activeId !== seg.id) selectQuad(seg.id, { syncGraph: false }); },
    });
  }

  /* ── the "you" dot marker over the map ────────────────────────────── */
  let youShown = false;
  const placeYou = (nx, ny, { instant = false } = {}) => {
    if (!youTag) return;
    youTag.hidden = false;
    youShown = true;
    if (instant || reduced) youTag.classList.add('is-instant');
    else youTag.classList.remove('is-instant');
    youTag.style.left = `${(nx * 100).toFixed(2)}%`;
    youTag.style.top = `${(ny * 100).toFixed(2)}%`;
  };

  /* ── the quiz: nudge the "you" dot live, then land it ─────────────── */
  const introEl = rootEl.querySelector('[data-quiz-intro]');
  if (introEl) introEl.textContent = quizSpec.intro;
  const quizHost = rootEl.querySelector('[data-quiz]');
  const resultHost = rootEl.querySelector('[data-result]');

  // Normalise running x/y totals to a live 0..1 map position. Derive the axis
  // maxima from the quiz spec so the dot always sweeps the full width/height,
  // however many questions score each axis.
  const X_MAX = Math.max(1, quizSpec.questions.reduce(
    (n, q) => n + Math.max(Math.abs(q.agree.x), Math.abs(q.disagree.x)), 0));
  const Y_MAX = Math.max(1, quizSpec.questions.reduce(
    (n, q) => n + Math.max(Math.abs(q.agree.y), Math.abs(q.disagree.y)), 0));
  const liveToNorm = (x, y) => ({
    x: 0.5 + (Math.max(-X_MAX, Math.min(X_MAX, x)) / X_MAX) * 0.42,
    y: 0.5 - (Math.max(-Y_MAX, Math.min(Y_MAX, y)) / Y_MAX) * 0.42,
  });

  const resolveSegmentId = (x, y) => {
    const outlook = x > 0 ? 'optimistic' : 'pessimistic'; // tie -> pessimistic (national majority)
    const agency = y > 0 ? 'proactive' : 'passive';        // odd y-question count -> no ties
    return quizSpec.scoring.quadrantToSegment[`${outlook}+${agency}`];
  };

  const renderResult = (segId) => {
    const seg = byId.get(segId);
    if (!seg || !resultHost) return;
    const nation = segments
      .map((s) => `${s.name.replace('The ', '')} ${s.sharePct}%`)
      .join(' · ');
    resultHost.hidden = false;
    resultHost.innerHTML = `
      <article class="si-datacard seg-result-card" tabindex="-1">
        <span class="vccp-eyebrow">Your result</span>
        <h4 class="seg-result-name">You're one of <strong>${escapeHtml(seg.name.replace('The ', ''))}</strong>.</h4>
        <p class="seg-result-trio">${escapeHtml(seg.threeWordDescriptor)}</p>
        <blockquote class="seg-prof-quote">${escapeHtml(seg.heroQuote)}</blockquote>
        <p class="seg-result-vs">You sit with the <strong class="num">${seg.sharePct}%</strong> of Britain in this camp.
          Across the nation: <span class="num">${escapeHtml(nation)}</span>.</p>
        <button type="button" class="vccp-btn vccp-btn-quiet seg-retake" data-retake>Take it again</button>
      </article>`;
    const card = resultHost.querySelector('.seg-result-card');
    if (card && !reduced) card.focus({ preventScroll: true });
    const retake = resultHost.querySelector('[data-retake]');
    if (retake) retake.addEventListener('click', () => buildQuiz());
  };

  const buildQuiz = () => {
    if (quizHost) quizHost.innerHTML = '';
    if (resultHost) { resultHost.hidden = true; resultHost.innerHTML = ''; }
    field.highlight(-1);
    if (youTag) { youTag.hidden = true; youShown = false; youTag.classList.remove('is-landed'); }
    placeYou(0.5, 0.5, { instant: true });
    if (youTag) youTag.hidden = true;

    quiz(quizHost, {
      questions: quizSpec.questions,
      onAnswer: (x, y) => {
        const p = liveToNorm(x, y);
        placeYou(p.x, p.y);
      },
      onComplete: (x, y) => {
        const segId = resolveSegmentId(x, y);
        const centre = quadCentre(segId);
        placeYou(centre.x, centre.y);
        // mark one real dot mustard near the landing point too
        field.highlight(DOT_COUNT - 1, '#FFC931');
        clusterTargets[DOT_COUNT - 1] = { x: centre.x, y: centre.y };
        field.formation(clusterTargets);
        if (youShown && youTag) youTag.classList.add('is-landed');
        selectQuad(segId);
        renderResult(segId);
        declareReady(); // completing the quiz also unlocks Next

      },
    });
  };
  buildQuiz();
}
