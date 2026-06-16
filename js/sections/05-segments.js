/**
 * Chapter 05 — segments. THE SHOWPIECE.
 *
 * Three ways into the four Britains, all composed from js/lib primitives:
 *
 *   1. THE AGENCY COMPASS (the marquee). A backgroundless canvas dotField
 *      scatters, then clusterPoints resolves the dots into four jittered
 *      clusters whose sizes track the canonical deck shares (17/28/27/28).
 *      The four quadrants are real buttons over the field; choosing one
 *      lands a profile card beneath — a heroQuote plus a lollipop of the
 *      segment's stand-out behaviours and a dotPlot of its brand asks
 *      (backgroundless, navy on warm). This is the gated beat: gate() shows
 *      the "try it" hint, ready() clears it on first quadrant pick. Next is
 *      never blocked.
 *
 *   2. THE LIVING NETWORK. segmentGraph(segments) — the circular
 *      force-physics network of segment hubs + shared attributes.
 *
 *   3. WHICH BRITAIN ARE YOU? interactions.quiz over segments.quiz.questions;
 *      the accumulated x/y maps to a quadrant via quadrantToSegment, the
 *      persistent you-dot anchor is moved onto the winning quadrant, and the
 *      result card names the segment.
 *
 * Design world: warm gradient ground, navy marks/text, thin orbit motif,
 * per-segment brand accents shared with segment-graph. Backgroundless, square
 * corners, no underline/skew, tabular nums, reduced-motion safe, keyboard
 * paths throughout. The dotField canvas is destroy()-ed on step leave.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="05-segments">
 * @param {{segments: object|null, journey: {gate():void, ready():void}}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival, prefersReducedMotion, observeParallax } from '../lib/experiential.js';
import { dotField, clusterPoints, lollipopChart, dotPlot } from '../lib/charts.js';
import { quiz } from '../lib/interactions.js';
import { segmentGraph } from '../lib/segment-graph.js';

/** Canonical deck shares — always 17/28/27/28, never the crosstab sizes. */
const DECK_SHARES = { architects: 17, hustlers: 28, coasters: 27, retreaters: 28 };

/** One dot per percentage point of Britain, ~100 across the four camps. */
const DOT_COUNT = 100;

/** Per-segment brand accent CSS vars (shared with segment-graph hubs). */
const SEG_ACCENT_VAR = {
  architects: '--mustard',
  hustlers: '--teal-deep',
  coasters: '--mustard-dark',
  retreaters: '--soi-navy',
};

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * The four quadrants of the agency compass, in screen position. x/y are the
 * 0..1 rect origins of each quadrant on the field (top-left origin), so
 * proactive (high agency) sits in the TOP row and optimistic sits on the
 * RIGHT, matching the deck's PESSIMISTIC↔OPTIMISTIC × PASSIVE↔PROACTIVE axes.
 */
const QUADRANTS = [
  { id: 'architects', rect: { x: 0.52, y: 0.04, w: 0.44, h: 0.44 } }, // optimistic + proactive
  { id: 'hustlers',   rect: { x: 0.04, y: 0.04, w: 0.44, h: 0.44 } }, // pessimistic + proactive
  { id: 'coasters',   rect: { x: 0.52, y: 0.52, w: 0.44, h: 0.44 } }, // optimistic + passive
  { id: 'retreaters', rect: { x: 0.04, y: 0.52, w: 0.44, h: 0.44 } }, // pessimistic + passive
];

/**
 * Map a quiz x/y score to a segment id via the data's quadrantToSegment.
 * @param {number} x  optimism axis total (>0 optimistic)
 * @param {number} y  agency axis total (>0 proactive)
 * @param {object} scoring  segments.quiz.scoring
 */
const scoreToSegment = (x, y, scoring) => {
  const outlook = x > 0 ? 'optimistic' : 'pessimistic'; // ties -> pessimistic (national majority)
  const agency = y > 0 ? 'proactive' : 'passive';
  const key = `${outlook}+${agency}`;
  return scoring.quadrantToSegment[key];
};

/** Build the dot targets: each segment owns a cluster sized by its deck share. */
const buildFormation = (segMap, accents) => {
  const targets = [];
  QUADRANTS.forEach((q) => {
    const share = DECK_SHARES[q.id];
    const pts = clusterPoints(share, q.rect);
    const colour = accents[q.id];
    pts.forEach((p) => targets.push({ x: p.x, y: p.y, colour }));
  });
  return targets;
};

/** Stand-out behaviours for a segment's profile lollipop (the over-indexers). */
const standoutBehaviours = (seg) => {
  const fams = ['personalControlBehaviours', 'selfManagement', 'aiUseByTask'];
  const rows = [];
  fams.forEach((fam) => {
    const family = seg.metrics?.[fam];
    if (!family) return;
    Object.entries(family).forEach(([label, { pct, index }]) => {
      rows.push({ label, pct, index });
    });
  });
  // Most distinctive first (largest index), then keep the top six by pct.
  return rows
    .sort((a, b) => b.index - a.index)
    .slice(0, 6)
    .map(({ label, pct }) => ({ label, pct }));
};

/** Top brand asks for a segment's profile dotPlot. */
const topBrandAsks = (seg) => {
  const family = seg.metrics?.brandAsks;
  if (!family) return [];
  return Object.entries(family)
    .map(([label, { pct }]) => ({ label, pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
};

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Render a chosen segment's profile into the host — backgroundless, navy on
 * warm. heroQuote + a lollipop of stand-out behaviours + a dotPlot of brand
 * asks. Square corners, no boxes, no underline.
 */
const renderProfile = (host, seg) => {
  const accent = seg.id;
  host.innerHTML = `
    <article class="sg-profile-card sg-accent-${esc(accent)}">
      <header class="sg-profile-head">
        <span class="sg-profile-share num">${esc(seg.sharePct)}%</span>
        <div class="sg-profile-id">
          <h3 class="sg-profile-name">${esc(seg.name)}</h3>
          <p class="sg-profile-trio">${esc(seg.threeWordDescriptor)}</p>
        </div>
      </header>
      <blockquote class="sg-profile-quote">${esc(seg.heroQuote)}</blockquote>
      <dl class="sg-profile-facts">
        <div><dt>Who</dt><dd>${esc(seg.who)}</dd></div>
        <div><dt>Money</dt><dd>${esc(seg.money)}</dd></div>
        <div><dt>AI</dt><dd>${esc(seg.aiAttitude)}</dd></div>
      </dl>
      <div class="sg-profile-charts">
        <figure class="chart-holder sg-profile-chart">
          <figcaption class="sg-profile-cap">Where they stand out, % within the segment</figcaption>
          <div data-profile-behaviours></div>
        </figure>
        <figure class="chart-holder sg-profile-chart">
          <figcaption class="sg-profile-cap">What they ask brands for, % within the segment</figcaption>
          <div data-profile-asks></div>
        </figure>
      </div>
    </article>`;

  const behavioursHost = host.querySelector('[data-profile-behaviours]');
  if (behavioursHost) {
    lollipopChart(behavioursHost, {
      items: standoutBehaviours(seg),
      accent: 'navy',
      ariaLabel: `${seg.name}: behaviours where this segment stands out`,
    });
  }
  const asksHost = host.querySelector('[data-profile-asks]');
  if (asksHost) {
    dotPlot(asksHost, {
      items: topBrandAsks(seg),
      accent: 'navy',
      ariaLabel: `${seg.name}: what this segment asks brands for`,
    });
  }
};

export default function init(rootEl, data) {
  const { segments: segData, journey } = data || {};
  if (!segData || !Array.isArray(segData.segments) || !segData.segments.length) return;

  const segments = segData.segments;
  const segMap = new Map(segments.map((s) => [s.id, s]));
  const accents = {};
  Object.entries(SEG_ACCENT_VAR).forEach(([id, v]) => { accents[id] = cssVar(v, '#FFC931'); });

  // Re-assemble the entrance on every arrival (idempotent). Not the first step.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail || {}));

  observeReveals(rootEl);
  observeCounters(rootEl);
  const cleanupParallax = observeParallax(rootEl, { maxShiftPx: 40 });

  // Marquee gating: the compass is the one gated beat. gate() shows the hint;
  // ready() clears it once a quadrant is chosen. Next never blocks either way.
  if (journey) journey.gate();

  // ── 1. THE AGENCY COMPASS ────────────────────────────────────────────
  const fieldHost = rootEl.querySelector('[data-compass-field]');
  const quadHost = rootEl.querySelector('[data-compass-quadrants]');
  const profileHost = rootEl.querySelector('[data-compass-profile]');
  const compassCue = rootEl.querySelector('[data-compass-cue]');
  let field = null;
  let compassReady = false;

  const selectQuadrant = (id, fromQuiz = false) => {
    const seg = segMap.get(id);
    if (!seg || !profileHost) return;
    // Highlight the active quadrant button.
    if (quadHost) {
      quadHost.querySelectorAll('.sg-quad').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.id === id);
        b.setAttribute('aria-pressed', String(b.dataset.id === id));
      });
    }
    renderProfile(profileHost, seg);
    if (!compassReady) {
      compassReady = true;
      if (compassCue) compassCue.textContent = 'Pick another quadrant to compare, or scroll on.';
      if (journey && !fromQuiz) journey.ready();
    }
  };

  // Four quadrant buttons over the field.
  if (quadHost) {
    QUADRANTS.forEach((q) => {
      const seg = segMap.get(q.id);
      if (!seg) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sg-quad sg-quad--${q.id} sg-accent-${q.id}`;
      btn.dataset.id = q.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = `
        <span class="sg-quad-share num">${seg.sharePct}%</span>
        <span class="sg-quad-name">${esc(seg.name)}</span>
        <span class="sg-quad-trio">${esc(seg.threeWordDescriptor)}</span>`;
      btn.addEventListener('click', () => selectQuadrant(q.id));
      quadHost.append(btn);
    });
  }

  // The dot-field: scatter, then resolve into the four clusters. Pause until
  // the compass scrolls into view so the resolve is seen, not missed.
  if (fieldHost) {
    field = dotField(fieldHost, {
      count: DOT_COUNT,
      dotRadius: 3,
      ariaLabel: 'One hundred dots resolving into four segments of Britain.',
    });
    const targets = buildFormation(segMap, accents);
    const resolve = () => {
      field.formation(targets, { spring: 0.02, jostle: 0.00006 });
      field.drift(prefersReducedMotion() ? 0 : 0.6);
    };
    if (prefersReducedMotion()) {
      resolve();
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          // brief scatter beat, then settle into the camps
          window.setTimeout(resolve, 420);
          obs.disconnect();
        });
      }, { threshold: 0.4 });
      io.observe(fieldHost);
    }
  }

  // ── 2. THE LIVING NETWORK ────────────────────────────────────────────
  const graphHost = rootEl.querySelector('[data-segment-graph]');
  let graph = null;
  if (graphHost) {
    graph = segmentGraph(graphHost, {
      segments,
      ariaLabel: 'The four segments and the interests, channels and attitudes that link them.',
    });
  }

  // ── 3. WHICH BRITAIN ARE YOU? ────────────────────────────────────────
  const quizHost = rootEl.querySelector('[data-quiz-host]');
  const quizResult = rootEl.querySelector('[data-quiz-result]');
  const quizCopy = segData.quiz;
  let quizInstance = null;

  // Move the persistent you-dot anchor onto the winning quadrant button so the
  // shell's global dot eases over to "your" Britain.
  const anchorYouDot = (id) => {
    if (!quadHost) return;
    const winning = quadHost.querySelector(`.sg-quad[data-id="${id}"]`);
    const headAnchor = rootEl.querySelector('[data-youdot-anchor]');
    if (headAnchor) headAnchor.removeAttribute('data-youdot-anchor');
    if (winning) winning.setAttribute('data-youdot-anchor', '');
  };

  const showQuizResult = (x, y) => {
    if (!quizResult || !quizCopy) return;
    const id = scoreToSegment(x, y, quizCopy.scoring);
    const seg = segMap.get(id);
    if (!seg) return;
    quizResult.hidden = false;
    quizResult.innerHTML = `
      <div class="sg-result-card sg-accent-${esc(id)}">
        <p class="sg-result-eyebrow">You are</p>
        <h3 class="sg-result-name">${esc(seg.name)}</h3>
        <p class="sg-result-trio">${esc(seg.threeWordDescriptor)}</p>
        <p class="sg-result-share num">${esc(seg.sharePct)}% of Britain share your camp</p>
        <blockquote class="sg-result-quote">${esc(seg.heroQuote)}</blockquote>
        <button type="button" class="vccp-btn vccp-btn-quiet sg-result-again">Take it again</button>
      </div>`;
    // Light up the matching quadrant + land its profile + move the you-dot.
    selectQuadrant(id, true);
    anchorYouDot(id);
    if (graph) graph.selectSegment(id);
    const again = quizResult.querySelector('.sg-result-again');
    if (again) {
      again.addEventListener('click', () => {
        quizResult.hidden = true;
        quizResult.innerHTML = '';
        if (quizHost) quizHost.hidden = false;
        if (quizInstance) quizInstance.reset();
      });
    }
    if (quizHost) quizHost.hidden = true;
  };

  if (quizHost && quizCopy && Array.isArray(quizCopy.questions)) {
    quizInstance = quiz(quizHost, {
      questions: quizCopy.questions,
      onComplete: (x, y) => showQuizResult(x, y),
    });
  }

  // ── Teardown: kill the canvas sim + graph rAF + scroll work on leave. ──
  rootEl.addEventListener('chapter:teardown', () => {
    if (field) field.destroy();
    if (graph) graph.destroy();
    cleanupParallax();
  });
}
