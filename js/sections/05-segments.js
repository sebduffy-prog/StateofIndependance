/**
 * Chapter 05 — segments. THE SHOWPIECE.
 *
 * THE ONE MEMORABLE THING: the nation resolves into four, and you find
 * yourself among them. The cinematic resolve is the hero; everything else
 * supports it. Composed entirely from js/lib primitives (never reinvented).
 *
 *   1. THE RESOLVE (the hero / marquee). A near-full-bleed dotField of 100
 *      dots — one per percentage point of Britain — scatters, holds a beat,
 *      then resolves into four jittered clusters sized to the canonical deck
 *      shares (17/28/27/28), each in its segment accent. Four quiet camp
 *      labels hang over their quadrant; choosing one lands a backgroundless
 *      profile beneath (heroQuote + a lollipop of stand-out behaviours + a
 *      dotPlot of brand asks) and brightens its cluster. This is the gated
 *      beat: gate() shows the soft hint, ready() clears it on first pick.
 *
 *   2. FIND YOURSELF (act two, quieter). interactions.quiz over
 *      segments.quiz.questions; the accumulated x/y maps to a quadrant via
 *      quadrantToSegment, naming your camp, lighting it on the compass,
 *      selecting its hub in the network, and easing the persistent you-dot
 *      onto your camp.
 *
 *   3. WHAT LINKS THEM (supporting layer). segmentGraph(segments) — the
 *      circular force-physics network of segment hubs + shared attributes.
 *
 * Design world (BRAND-WORLD-FINAL §7): CREAM editorial ground — the
 * data-reading register. The four segments resolve into book-cover CARDS
 * (cream, square, bold-black Poppins title low-left, a flat navy+yellow icon
 * in the upper field, the tiny Challenger-Series lockup mark top-right). The
 * dot crowd is one NAVY nation (#041654) on cream; the chosen camp lights in
 * navy while the rest fade to a faint navy tint. Navy+yellow accent system;
 * yellow is the single highlight. Backgroundless data inside the cards,
 * square corners, no underline/skew, tabular nums. One easing system; the
 * resolve is the single hero motion. Reduced-motion safe, keyboard
 * throughout. The dotField canvas + graph rAF are destroy()-ed on step-leave.
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

/** Soft-scatter beat (ms) before the resolve settles, so it is seen. */
const SCATTER_HOLD_MS = 560;

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * The four quadrants as 0..1 rects on the field (top-left origin), and the
 * label's anchor inside that rect. Proactive (high agency) is the TOP row;
 * optimistic is the RIGHT column — matching PESSIMISTIC↔OPTIMISTIC ×
 * PASSIVE↔PROACTIVE. Clusters sit inset from the cross; labels hug the
 * outer corner so they never sit over the dots.
 */
const QUADRANTS = [
  { id: 'architects', rect: { x: 0.55, y: 0.07, w: 0.38, h: 0.36 }, corner: 'tr' },
  { id: 'hustlers',   rect: { x: 0.07, y: 0.07, w: 0.38, h: 0.36 }, corner: 'tl' },
  { id: 'coasters',   rect: { x: 0.55, y: 0.57, w: 0.38, h: 0.36 }, corner: 'br' },
  { id: 'retreaters', rect: { x: 0.07, y: 0.57, w: 0.38, h: 0.36 }, corner: 'bl' },
];

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * The tiny Challenger-Series lockup stamp for a card's top-right (BWF §3).
 * Tight inline SVG of the bear+girl+VCCP mark; black silhouette, square
 * construction, never recoloured. Sits in `.soi-card__mark`.
 */
const LOCKUP_MARK = `
  <svg class="sg5-mark" viewBox="0 0 96 40" role="img" aria-label="VCCP Challenger Series" focusable="false">
    <g fill="currentColor">
      <path d="M4 18c1-5 5-9 11-9 4 0 6 2 9 2 2 0 3-1 4-1 1 0 2 1 2 2 0 1-1 2-2 2-1 0-2 0-3 1 2 2 3 5 3 8H30c0-2-1-4-3-5-1 2-3 3-5 3-1 3-3 5-6 5-1 0-2-1-2-2l1-3c-4-1-7-4-8-8-1 0-2-1-2-3 0 0 1 0 2 1Z"/>
      <rect x="3" y="29" width="32" height="2"/>
      <rect x="40.5" y="9" width="2" height="22"/>
      <path d="M22 12c1 0 2 1 2 3v9h-2v-9c0-1 0-2 0-3Z"/>
    </g>
    <g fill="currentColor" font-family="Poppins, sans-serif" font-weight="800">
      <text x="48" y="20" font-size="10">VCCP</text>
      <text x="48" y="33" font-size="9" font-weight="600" font-style="italic">Series</text>
    </g>
  </svg>`;

/**
 * Flat navy+yellow segment icons (BWF §6): a solid navy body with ONE bright
 * yellow wedge/cut — the "open" gesture, echoing the book-cover icons. No
 * gradients, outlines or shadow; square clean construction. Colour comes from
 * the `.soi-icon` token system (currentColor = navy, [data-accent] = yellow).
 * Geometry per segment carries its character (compass / arrows / leaf / shelter).
 */
const SEGMENT_ICONS = {
  architects: `
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="4"/>
      <path data-accent d="M32 14 38 32 32 32Z"/>
      <path data-body d="M32 50 26 32 32 32Z"/>
      <circle cx="32" cy="32" r="4" data-body/>
    </svg>`,
  hustlers: `
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <path data-body d="M10 40 28 22 38 32 54 16 54 30 50 26 38 38 28 28 14 42Z"/>
      <path data-accent d="M44 16 54 16 54 26 50 22 46 26 42 22 48 20Z"/>
    </svg>`,
  coasters: `
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <path data-body d="M32 54C20 44 14 34 14 24 22 24 28 28 32 36 36 28 42 24 50 24 50 34 44 44 32 54Z"/>
      <path data-accent d="M32 36C36 28 42 24 50 24 50 30 47 36 42 42 38 38 35 37 32 36Z"/>
      <rect x="30" y="36" width="4" height="18" data-body/>
    </svg>`,
  retreaters: `
    <svg viewBox="0 0 64 64" role="img" aria-hidden="true" focusable="false">
      <path data-body d="M12 30 32 12 52 30 52 34 32 18 12 34Z"/>
      <rect x="18" y="32" width="28" height="20" data-body/>
      <path data-accent d="M27 52 27 40 37 40 37 52Z"/>
    </svg>`,
};

/** A flat navy+yellow segment icon wrapped in the `.soi-icon` token system. */
const segmentIcon = (id) =>
  `<span class="soi-icon sg5-icon">${SEGMENT_ICONS[id] || ''}</span>`;

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

/**
 * Build the dot targets: each segment owns a cluster sized by its deck share.
 * All dots are navy — one nation, one high-contrast crowd on the warm ground
 * (per-segment accent dots would be mustard-on-mustard / low-contrast). The
 * four camps are read by their SPATIAL position in the quadrants; identity is
 * carried by the corner labels and the chosen-camp brightening.
 */
const buildFormation = (navy) => {
  const targets = [];
  const owners = []; // each dot's owning segment, so we can brighten a camp
  QUADRANTS.forEach((q) => {
    const pts = clusterPoints(DECK_SHARES[q.id], q.rect);
    pts.forEach((p) => {
      targets.push({ x: p.x, y: p.y, colour: navy });
      owners.push(q.id);
    });
  });
  return { targets, owners };
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
  // Most distinctive first (largest index vs national average), then top five.
  return rows
    .sort((a, b) => b.index - a.index)
    .slice(0, 5)
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
 * Render a chosen segment's profile as a BOOK-COVER card (BWF §3): cream
 * ground, square corners, the tiny lockup stamp top-right, a flat navy+yellow
 * segment icon beside the big share number, the bold-black name, then the
 * human heroQuote, who/money/AI, and the two backgroundless navy-on-cream
 * charts. ONE lift device (the soft self-shadow on `.soi-card`).
 */
const renderProfile = (host, seg) => {
  host.innerHTML = `
    <article class="soi-card sg5-profile-card sg5-accent-${esc(seg.id)}">
      <span class="soi-card__mark sg5-card-mark" aria-hidden="true">${LOCKUP_MARK}</span>
      <header class="sg5-profile-head">
        ${segmentIcon(seg.id)}
        <span class="sg5-profile-share num">${esc(seg.sharePct)}<span class="sg5-profile-pct">%</span></span>
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

  // Re-assemble the entrance on every arrival (idempotent). `hasArrived`
  // gates teardown so the initial mount (section starts hidden) and the
  // shell re-asserting hidden=true never tear the canvas/graph down before
  // the step has ever been shown.
  let hasArrived = false;
  rootEl.addEventListener('chapter:arrive', (e) => {
    hasArrived = true;
    arrival(rootEl, e.detail || {});
    // The canvas + force-graph are built while the section is hidden
    // (display:none → 0×0), so their backing stores measure 1×1. When the
    // step is first shown, nudge a re-measure so the dot-field fills its
    // stage. rAF lets layout settle before the lib re-reads getBoundingRect.
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
  });

  observeReveals(rootEl);
  observeCounters(rootEl);
  const cleanupParallax = observeParallax(rootEl, { maxShiftPx: 36 });

  // The shell advances the journey on a global Enter keydown (js/main.js)
  // unless defaultPrevented. So Enter/Space on any button INSIDE this step
  // must activate that button and NOT leak up to navigate. Capture-phase
  // handler: if a button is focused, stop the global nav and click it.
  rootEl.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar') return;
    const btn = event.target instanceof Element ? event.target.closest('button') : null;
    if (!btn || !rootEl.contains(btn)) return;
    event.preventDefault();
    event.stopPropagation();
    btn.click();
  }, true);

  // Soft gating: the resolve is the one gated beat. gate() shows the hint;
  // ready() clears it once a camp is chosen. Next never blocks either way.
  if (journey) journey.gate();

  // ── 1. THE RESOLVE (hero) ────────────────────────────────────────────
  const fieldHost = rootEl.querySelector('[data-compass-field]');
  const campHost = rootEl.querySelector('[data-compass-camps]');
  const profileHost = rootEl.querySelector('[data-compass-profile]');
  const compassCue = rootEl.querySelector('[data-compass-cue]');
  const stageEl = rootEl.querySelector('[data-compass]');
  let field = null;
  let owners = [];
  let readyFired = false;

  const selectCamp = (id, fromQuiz = false) => {
    const seg = segMap.get(id);
    if (!seg || !profileHost) return;
    if (campHost) {
      campHost.querySelectorAll('.sg5-camp').forEach((b) => {
        const on = b.dataset.id === id;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
    }
    if (stageEl) stageEl.classList.add('is-chosen');
    // Light the chosen camp's cluster; fade the rest of the nation.
    if (field && field.lightCamp) field.lightCamp(id);
    renderProfile(profileHost, seg);
    if (!readyFired) {
      readyFired = true;
      if (compassCue) compassCue.textContent = 'Pick another camp to compare, or scroll on.';
      if (journey && !fromQuiz) journey.ready();
    }
  };

  // Four quiet camp labels over the field — editorial, not chunky tiles.
  if (campHost) {
    QUADRANTS.forEach((q) => {
      const seg = segMap.get(q.id);
      if (!seg) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `sg5-camp sg5-camp--${q.id} sg5-camp--${q.corner} sg5-accent-${q.id}`;
      btn.dataset.id = q.id;
      btn.setAttribute('aria-pressed', 'false');
      btn.innerHTML = `
        <span class="sg5-camp-share num">${seg.sharePct}<span class="sg5-camp-pct">%</span></span>
        <span class="sg5-camp-name">${esc(seg.name)}</span>
        <span class="sg5-camp-trio">${esc(seg.threeWordDescriptor)}</span>`;
      btn.addEventListener('click', () => selectCamp(q.id));
      campHost.append(btn);
    });
  }

  // The dot-field: scatter, hold a beat, then resolve into the four clusters
  // when the stage scrolls into view (so the resolve is seen, not missed).
  if (fieldHost) {
    field = dotField(fieldHost, {
      count: DOT_COUNT,
      dotRadius: 3.4,
      ariaLabel: 'One hundred dots resolving into four segments of Britain.',
    });
    const navy = cssVar('--navy', '#041654');
    const built = buildFormation(navy);
    owners = built.owners;
    const baseTargets = built.targets;
    // Light a camp: keep its cluster solid navy, fade the rest to a faint
    // navy tint. Re-issues the whole formation (cheap at n=100, no lib edit).
    field.lightCamp = (id) => {
      const repaint = baseTargets.map((t, idx) => ({
        x: t.x, y: t.y,
        colour: owners[idx] === id ? navy : 'rgba(4,22,84,0.18)',
      }));
      field.formation(repaint, { spring: 0.05, jostle: 0.00006 });
      field.drift(prefersReducedMotion() ? 0 : 0.6);
    };

    const resolve = () => {
      field.formation(baseTargets, { spring: 0.045, jostle: 0.00006 });
      field.drift(prefersReducedMotion() ? 0 : 0.6);
      if (stageEl) stageEl.classList.add('is-resolved');
    };
    if (prefersReducedMotion()) {
      resolve();
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          window.setTimeout(resolve, SCATTER_HOLD_MS); // scatter beat, then settle
          obs.disconnect();
        });
      }, { threshold: 0.35 });
      io.observe(fieldHost);
    }
  }

  // ── 2. FIND YOURSELF (act two) ───────────────────────────────────────
  const quizHost = rootEl.querySelector('[data-quiz-host]');
  const quizResult = rootEl.querySelector('[data-quiz-result]');
  const quizCopy = segData.quiz;
  let quizInstance = null;

  // Ease the persistent you-dot onto the winning camp label so the shell's
  // global dot travels to "your" Britain.
  const anchorYouDot = (id) => {
    if (!campHost) return;
    const winning = campHost.querySelector(`.sg5-camp[data-id="${id}"]`);
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
      <div class="soi-card sg5-result-card sg5-accent-${esc(id)}">
        <span class="soi-card__mark sg5-card-mark" aria-hidden="true">${LOCKUP_MARK}</span>
        ${segmentIcon(id)}
        <p class="sg5-result-eyebrow">You are among the</p>
        <h3 class="sg5-result-name">${esc(seg.name)}</h3>
        <p class="sg5-result-trio">${esc(seg.threeWordDescriptor)}</p>
        <p class="sg5-result-share num">${esc(seg.sharePct)}% of Britain share your camp</p>
        <blockquote class="sg5-result-quote">${esc(seg.heroQuote)}</blockquote>
        <button type="button" class="vccp-btn vccp-btn-quiet sg5-result-again">Take it again</button>
      </div>`;
    selectCamp(id, true);
    anchorYouDot(id);
    if (graph) graph.selectSegment(id);
    const again = quizResult.querySelector('.sg5-result-again');
    if (again) {
      again.addEventListener('click', () => {
        quizResult.hidden = true;
        quizResult.innerHTML = '';
        if (quizHost) quizHost.hidden = false;
        if (quizInstance) quizInstance.reset();
        const firstBtn = quizHost && quizHost.querySelector('button');
        if (firstBtn) firstBtn.focus({ preventScroll: true });
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

  // ── 3. WHAT LINKS THEM (supporting layer) ────────────────────────────
  const graphHost = rootEl.querySelector('[data-segment-graph]');
  let graph = null;
  if (graphHost) {
    graph = segmentGraph(graphHost, {
      segments,
      ariaLabel: 'The four segments and the interests, channels and attitudes that link them.',
    });
  }

  // ── Teardown: kill the canvas sim + graph rAF + scroll work on step-leave.
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
