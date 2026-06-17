/**
 * Chapter 05 — segments. THE SHOWPIECE.
 *
 * Three ways into the four Britains, every one composed from js/lib
 * primitives (never reinvented):
 *
 *   1. THE AGENCY COMPASS (the marquee). A backgroundless canvas dotField
 *      scatters, then clusterPoints resolves the dots into four jittered
 *      clusters whose sizes track the canonical deck shares (17/28/27/28).
 *      Four real quadrant buttons sit over the field; choosing one lands a
 *      backgroundless profile beneath — heroQuote + a lollipop of the
 *      segment's stand-out behaviours + a dotPlot of its brand asks. This is
 *      the gated beat: gate() shows the soft "try it" hint, ready() clears it
 *      on the first pick. Next is never blocked.
 *
 *   2. THE LIVING NETWORK. segmentGraph(segments) — the circular
 *      force-physics network of segment hubs + shared attribute satellites.
 *
 *   3. WHICH BRITAIN ARE YOU? interactions.quiz over segments.quiz.questions;
 *      the accumulated x/y maps to a quadrant via quadrantToSegment, the
 *      result names the segment, lights its quadrant, selects its graph hub,
 *      and moves the persistent you-dot anchor onto "your" Britain.
 *
 * Design world: warm gradient ground, navy marks/text, thin orbit motif,
 * per-segment brand accents shared with segment-graph. Backgroundless, square
 * corners, no underline/skew, tabular nums, reduced-motion safe, keyboard
 * paths throughout. The dotField canvas and the graph rAF are destroy()-ed
 * when the step leaves (the section is hidden).
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

/** One dot per percentage point of Britain (17+28+27+28 = 100). */
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
 * The four quadrants of the agency compass, as 0..1 rects on the field
 * (top-left origin). Proactive (high agency) is the TOP row; optimistic is the
 * RIGHT column — matching the deck's PESSIMISTIC↔OPTIMISTIC × PASSIVE↔PROACTIVE.
 */
const QUADRANTS = [
  { id: 'architects', rect: { x: 0.53, y: 0.05, w: 0.42, h: 0.42 } }, // optimistic + proactive
  { id: 'hustlers',   rect: { x: 0.05, y: 0.05, w: 0.42, h: 0.42 } }, // pessimistic + proactive
  { id: 'coasters',   rect: { x: 0.53, y: 0.53, w: 0.42, h: 0.42 } }, // optimistic + passive
  { id: 'retreaters', rect: { x: 0.05, y: 0.53, w: 0.42, h: 0.42 } }, // pessimistic + passive
];

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Map a quiz x/y score to a segment id via the data's quadrantToSegment.
 * x > 0 optimistic else pessimistic (ties → pessimistic, the national half);
 * y > 0 proactive else passive (five y questions → no ties).
 */
const scoreToSegment = (x, y, scoring) => {
  const outlook = x > 0 ? 'optimistic' : 'pessimistic';
  const agency = y > 0 ? 'proactive' : 'passive';
  return scoring.quadrantToSegment[`${outlook}+${agency}`];
};

/** Build the dot targets: each segment owns a cluster sized by its deck share. */
const buildFormation = (accents) => {
  const targets = [];
  QUADRANTS.forEach((q) => {
    const pts = clusterPoints(DECK_SHARES[q.id], q.rect);
    pts.forEach((p) => targets.push({ x: p.x, y: p.y, colour: accents[q.id] }));
  });
  return targets;
};

/** Stand-out behaviours for a segment's profile lollipop (its over-indexers). */
const standoutBehaviours = (seg) => {
  const families = ['personalControlBehaviours', 'selfManagement', 'aiUseByTask'];
  const rows = [];
  families.forEach((fam) => {
    const family = seg.metrics?.[fam];
    if (!family) return;
    Object.entries(family).forEach(([label, m]) => rows.push({ label, pct: m.pct, index: m.index }));
  });
  // Most distinctive first (largest index vs national average), then top six.
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
    .map(([label, m]) => ({ label, pct: m.pct }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5);
};

/**
 * Render a chosen segment's profile into the host — backgroundless, navy on
 * warm. heroQuote + a lollipop of stand-out behaviours + a dotPlot of brand
 * asks. Square corners, no boxes, no underline.
 */
const renderProfile = (host, seg) => {
  host.innerHTML = `
    <article class="sg5-profile-card sg5-accent-${esc(seg.id)}">
      <header class="sg5-profile-head">
        <span class="sg5-profile-share num">${esc(seg.sharePct)}%</span>
        <div class="sg5-profile-id">
          <h3 class="sg5-profile-name">${esc(seg.name)}</h3>
          <p class="sg5-profile-trio">${esc(seg.threeWordDescriptor)}</p>
        </div>
      </header>
      <blockquote class="sg5-profile-quote">${esc(seg.heroQuote)}</blockquote>
      <dl class="sg5-profile-facts">
        <div><dt>Who</dt><dd>${esc(seg.who)}</dd></div>
        <div><dt>Money</dt><dd>${esc(seg.money)}</dd></div>
        <div><dt>AI</dt><dd>${esc(seg.aiAttitude)}</dd></div>
      </dl>
      <div class="sg5-profile-charts">
        <figure class="chart-holder sg5-profile-chart">
          <figcaption class="sg5-profile-cap">Where they stand out, % within the segment</figcaption>
          <div data-profile-behaviours></div>
        </figure>
        <figure class="chart-holder sg5-profile-chart">
          <figcaption class="sg5-profile-cap">What they ask brands for, % within the segment</figcaption>
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

  // Re-assemble the entrance on every arrival (idempotent). `hasArrived`
  // gates teardown so the initial mount (section starts hidden) and the
  // shell re-asserting hidden=true on every navigation never wrongly tear
  // the canvas/graph down before the step has ever been shown.
  let hasArrived = false;
  rootEl.addEventListener('chapter:arrive', (e) => {
    hasArrived = true;
    arrival(rootEl, e.detail || {});
  });

  observeReveals(rootEl);
  observeCounters(rootEl);
  const cleanupParallax = observeParallax(rootEl, { maxShiftPx: 40 });

  // Soft gating: the compass is the one gated beat. gate() shows the hint;
  // ready() clears it once a quadrant is chosen. Next never blocks either way.
  if (journey) journey.gate();

  // ── 1. THE AGENCY COMPASS ────────────────────────────────────────────
  const fieldHost = rootEl.querySelector('[data-compass-field]');
  const quadHost = rootEl.querySelector('[data-compass-quadrants]');
  const profileHost = rootEl.querySelector('[data-compass-profile]');
  const compassCue = rootEl.querySelector('[data-compass-cue]');
  let field = null;
  let readyFired = false;

  const selectQuadrant = (id, fromQuiz = false) => {
    const seg = segMap.get(id);
    if (!seg || !profileHost) return;
    if (quadHost) {
      quadHost.querySelectorAll('.sg5-quad').forEach((b) => {
        const on = b.dataset.id === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    renderProfile(profileHost, seg);
    if (!readyFired) {
      readyFired = true;
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
      btn.className = `sg5-quad sg5-quad--${q.id} sg5-accent-${q.id}`;
      btn.dataset.id = q.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = `
        <span class="sg5-quad-share num">${seg.sharePct}%</span>
        <span class="sg5-quad-name">${esc(seg.name)}</span>
        <span class="sg5-quad-trio">${esc(seg.threeWordDescriptor)}</span>`;
      btn.addEventListener('click', () => selectQuadrant(q.id));
      quadHost.append(btn);
    });
  }

  // The dot-field: scatter, then resolve into the four clusters once the
  // compass scrolls into view (so the resolve is seen, not missed).
  if (fieldHost) {
    field = dotField(fieldHost, {
      count: DOT_COUNT,
      dotRadius: 3,
      ariaLabel: 'One hundred dots resolving into four segments of Britain.',
    });
    const targets = buildFormation(accents);
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
          window.setTimeout(resolve, 420); // brief scatter beat, then settle
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
    const winning = quadHost.querySelector(`.sg5-quad[data-id="${id}"]`);
    const prevAnchor = rootEl.querySelector('[data-youdot-anchor]');
    if (prevAnchor) prevAnchor.removeAttribute('data-youdot-anchor');
    if (winning) winning.setAttribute('data-youdot-anchor', '');
  };

  const showQuizResult = (x, y) => {
    if (!quizResult || !quizCopy) return;
    const id = scoreToSegment(x, y, quizCopy.scoring);
    const seg = segMap.get(id);
    if (!seg) return;
    quizResult.hidden = false;
    quizResult.innerHTML = `
      <div class="sg5-result-card sg5-accent-${esc(id)}">
        <p class="sg5-result-eyebrow">You are</p>
        <h3 class="sg5-result-name">${esc(seg.name)}</h3>
        <p class="sg5-result-trio">${esc(seg.threeWordDescriptor)}</p>
        <p class="sg5-result-share num">${esc(seg.sharePct)}% of Britain share your camp</p>
        <blockquote class="sg5-result-quote">${esc(seg.heroQuote)}</blockquote>
        <button type="button" class="vccp-btn vccp-btn-quiet sg5-result-again">Take it again</button>
      </div>`;
    selectQuadrant(id, true);
    anchorYouDot(id);
    if (graph) graph.selectSegment(id);
    const again = quizResult.querySelector('.sg5-result-again');
    if (again) {
      again.addEventListener('click', () => {
        quizResult.hidden = true;
        quizResult.innerHTML = '';
        if (quizHost) quizHost.hidden = false;
        if (quizInstance) quizInstance.reset();
        const again2 = quizHost && quizHost.querySelector('button');
        if (again2) again2.focus({ preventScroll: true });
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

  // ── Teardown: kill the canvas sim + graph rAF + scroll work on step-leave.
  // main.js toggles `hidden` on the section to navigate; watch for it so the
  // single visible-step canvas/sim budget is respected.
  let torndown = false;
  const teardown = () => {
    if (torndown) return;
    torndown = true;
    if (field) field.destroy();
    if (graph) graph.destroy();
    cleanupParallax();
    mo.disconnect();
  };
  const mo = new MutationObserver(() => {
    if (hasArrived && rootEl.hidden) teardown();
  });
  mo.observe(rootEl, { attributes: true, attributeFilter: ['hidden'] });
}
