/**
 * Chapter 04 — twists.
 *
 * Three exhibits, all commit-then-reveal where it counts:
 *   (a) The trust paradox — an EARNED DARK (navy) moment. dragRank the
 *       seven institutions, reveal the true confidence on an orbitRingChart
 *       (the deck's signature orbit motif) + the 53% to 24% / 29-point
 *       spread, a flip card pairing NHS 6.42/10 ("most trusted") with
 *       "53% say it has declined", then the wider decline picture as bars.
 *   (b) Protected joy — 40% holiday hero + the marquee tactile beat: a
 *       ring-fence board (tactile.draggable) where flexible treats can be cut
 *       but the HOLIDAY chip resists and springs back; protected-spend shown
 *       as a lollipopChart beneath.
 *   (c) AI on tap — 58% (any task) vs a separate 37% (high-stakes),
 *       an adoption tugOfWar, per-task bars (high-stakes framed), and the
 *       verbatim AI quote.
 *
 * All components are backgroundless and use NAVY on the warm page / cream
 * + teal on the navy trust ground (onNavy). No mustard accent anywhere.
 *
 * Contract: docs/CONTRACT.md. Every number traces to data/survey.json.
 *
 * @param {HTMLElement} rootEl  the <section class="chapter" id="04-twists">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { horizontalBars, lollipopChart, orbitRingChart, tugOfWar } from '../lib/charts.js';
import { dragRank } from '../lib/interactions.js';
import { observeParallax, chapterTransition } from '../lib/experiential.js';
import { draggable } from '../lib/tactile.js';

// Deck (2) brand-world assets lifted per DECK2-ASSETS.md.
const HEAD_MOTIF = 'assets/deck/bear-world-doors.png';   // doors = choices / opting out
const JOY_MOTIF = 'assets/deck/bear-world-coil.png';     // coil = momentum toward joy
const EVIDENCE_NATIONWIDE = 'assets/deck/evidence-nationwide.png';
const VELVET_GROUND = 'assets/deck/ground-navy-velvet.png';

/** Deterministic shuffle so tiles never start in rank order. */
const shuffleStable = (items) => {
  const order = [3, 0, 6, 2, 5, 1, 4]; // fixed scramble of 7 indices
  return order.filter((i) => i < items.length).map((i) => items[i]);
};

/** Set a background-image on a [data-host] decorative layer (no-op if absent). */
const paintHost = (rootEl, host, url) => {
  const el = rootEl.querySelector(`[data-host="${host}"]`);
  if (el) el.style.backgroundImage = `url("${url}")`;
};

/** Place all deck imagery: the bear-world chapter motif, the joy motif, the
 *  Nationwide evidence photo, and the velvet ground for the dark exhibit. All
 *  decorative — CSS keeps them behind/beside content, never occluding UI. */
const placeDeckArt = (rootEl) => {
  paintHost(rootEl, 'head-art', HEAD_MOTIF);
  paintHost(rootEl, 'joy-motif', JOY_MOTIF);
  paintHost(rootEl, 'evidence', EVIDENCE_NATIONWIDE);
  const dark = rootEl.querySelector('.tw-exhibit--dark');
  if (dark) dark.style.backgroundImage = `url("${VELVET_GROUND}")`;
};

const buildTrustParadox = (rootEl, institutionTrust, onRevealed) => {
  const ranking = institutionTrust?.confidenceRanking?.items;
  if (!Array.isArray(ranking) || ranking.length === 0) return;

  // True order: ids sorted by pctConfident descending (NHS -> Government).
  const byConfidence = ranking.slice().sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = byConfidence.map((it) => it.id);
  const top = byConfidence[0];
  const bottom = byConfidence[byConfidence.length - 1];

  const rankHost = rootEl.querySelector('[data-host="rank"]');
  const truthFig = rootEl.querySelector('[data-host="trust-truth"]');
  const orbitHost = rootEl.querySelector('[data-host="trust-orbit"]');
  const spreadEl = rootEl.querySelector('[data-host="spread"]');
  if (!rankHost || !truthFig || !orbitHost || !spreadEl) return;

  const tiles = shuffleStable(ranking).map((it) => ({ id: it.id, label: it.label }));

  const revealTruth = () => {
    if (!truthFig.hidden) return;
    truthFig.hidden = false;
    // Drag-rank reveal completed — this is the gating interaction; unlock Next.
    if (typeof onRevealed === 'function') onRevealed();
    // EARNED-DARK navy ground: the orbit motif renders cream + teal on the
    // velvet (onNavy path) — never mustard (vanishes), never a white box.
    orbitRingChart(orbitHost, {
      items: byConfidence.map((it) => ({ label: it.label, pct: it.pctConfident })),
      max: 100,
      onNavy: true,
      decimals: 0,
      centreLabel: 'TRUST',
      ariaLabel:
        'Confidence each institution will reliably support them, by share rating 7 to 10 out of 10, on concentric orbits',
    });
    const spread = Math.round(top.pctConfident - bottom.pctConfident);
    spreadEl.innerHTML =
      `From ${Math.round(top.pctConfident)}% to ${Math.round(bottom.pctConfident)}%: ` +
      `${top.label} on the outer orbit, ${bottom.label} on the inner. A ` +
      `<strong>${spread}-point spread</strong> in who Britain trusts to be there.`;
  };

  dragRank(rankHost, {
    items: tiles,
    trueOrder,
    instructions:
      'Drag to reorder, or focus a row and use the up and down arrow keys. Most trusted at the top.',
    onReveal: revealTruth,
  });

  // The paradox flip card: 6.42/10 "most trusted" <-> "53% say it declined".
  const flip = rootEl.querySelector('[data-host="paradox"]');
  if (flip) {
    flip.addEventListener('click', () => {
      const flipped = flip.getAttribute('aria-pressed') !== 'true';
      flip.setAttribute('aria-pressed', String(flipped));
      flip.classList.toggle('is-flipped', flipped);
    });
  }

  // The wider decline picture — bars on the navy ground (cream/teal onNavy).
  const declineHost = rootEl.querySelector('[data-host="decline-bars"]');
  const declineItems = institutionTrust?.performanceChange?.items;
  if (declineHost && Array.isArray(declineItems)) {
    horizontalBars(declineHost, {
      items: declineItems.map((it) => ({ id: it.id, label: it.label, pct: it.pctDeclined })),
      max: 100,
      onNavy: true,
      decimals: 0,
      highlightId: 'government',
      labelWidth: 150,
      ariaLabel: 'Share saying each institution has declined over the past decade',
    });
  }
};

const buildProtectedJoy = (rootEl, protectedSpend) => {
  const lolliHost = rootEl.querySelector('[data-host="joy-lolli"]');
  const items = protectedSpend?.items;
  if (!Array.isArray(items)) return;

  // The eight named non-essentials, in deck order (drop "none"/"brands").
  const named = items.filter((it) => it.id !== 'noneOfThese' && it.id !== 'specificBrands');

  if (lolliHost) {
    // Warm off-white page ground: navy components (charts default) read
    // high-contrast. Holiday highlighted in ink.
    lollipopChart(lolliHost, {
      items: named.map((it) => ({ id: it.id, label: it.label, pct: it.pct })),
      max: 100,
      highlightId: 'holidays',
      ariaLabel: 'Non-essentials Britain is actively protecting, by share protecting each',
    });
  }

  buildRingFence(rootEl, named);
};

// Ring-fence board geometry / thresholds (named, no magic numbers inline).
const CUT_THRESHOLD_PX = 132;     // drag distance right that "cuts" a flexible chip
const RESIST_DAMP = 0.34;         // how much the holiday chip yields before it fights back
const RESIST_CAP_PX = 56;         // max the holiday chip can be pulled before hard resist
const FLEX_TO_CUT = 3;            // flexible chips cut before the beat reads "complete"

/**
 * THE MARQUEE TACTILE BEAT — ring-fence the holiday.
 *
 * A small board of draggable spend chips. Flexible treats can be dragged right
 * past CUT_THRESHOLD_PX to be cut (they spring into the bin margin and lock,
 * struck through). The HOLIDAY chip is RING-FENCED: it yields only a little
 * (RESIST_DAMP, capped at RESIST_CAP_PX), shows a fence outline that flexes,
 * then springs back every time — "protected at all costs", felt by hand.
 *
 * Built on tactile.draggable(): pointer + keyboard, contact shadow, spring
 * return, reduced-motion safe (drags still work, snap to final state).
 */
const buildRingFence = (rootEl, named) => {
  const board = rootEl.querySelector('[data-host="cut-board"]');
  const list = rootEl.querySelector('[data-host="cut-list"]');
  const readout = rootEl.querySelector('[data-host="cut-readout"]');
  if (!board || !list || !named.length) return;

  // Five chips: the ring-fenced holiday + four highest flexible treats, so the
  // board stays a single readable beat (one idea), not a wall of items.
  const holiday = named.find((it) => it.id === 'holidays');
  const flexible = named.filter((it) => it.id !== 'holidays').slice(0, 4);
  const chips = holiday ? [holiday, ...flexible] : flexible;

  const handles = [];          // tracked draggable controllers for cleanup parity
  let cutCount = 0;
  let resistedHoliday = false;

  const announce = () => {
    if (!readout) return;
    const cutLine = cutCount === 0
      ? 'Drag a treat right to cut it.'
      : `${cutCount} treat${cutCount === 1 ? '' : 's'} cut.`;
    const fenceLine = resistedHoliday
      ? ' The holiday will not budge — ring-fenced.'
      : '';
    readout.textContent = cutLine + fenceLine;
  };
  announce();

  chips.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'tw-chip';
    const ringFenced = item.id === 'holidays';
    if (ringFenced) li.classList.add('is-fenced');
    li.innerHTML =
      `<span class="tw-chip-fence" aria-hidden="true"></span>` +
      `<span class="tw-chip-grip" aria-hidden="true"></span>` +
      `<span class="tw-chip-name">${item.label}</span>` +
      `<span class="tw-chip-pct">${Math.round(item.pct)}%</span>`;
    li.setAttribute(
      'aria-label',
      ringFenced
        ? `${item.label}, ring-fenced. ${Math.round(item.pct)} percent protect it at all costs. Cannot be cut.`
        : `${item.label}, ${Math.round(item.pct)} percent protect it. Drag right or press the right arrow to cut.`,
    );
    list.append(li);

    if (ringFenced) {
      handles.push(makeFencedChip(li, () => {
        if (!resistedHoliday) {
          resistedHoliday = true;
          announce();
        }
      }));
    } else {
      handles.push(makeFlexibleChip(li, () => {
        cutCount += 1;
        announce();
      }));
    }
  });

  return () => handles.forEach((h) => h && h.destroy && h.destroy());
};

/** A flexible treat: drag right past the threshold to cut it; otherwise it
 *  springs back. Once cut it locks struck-through in the bin margin. */
const makeFlexibleChip = (li, onCut) => {
  let cut = false;
  const drag = draggable(li, {
    axis: 'x',
    spring: 'return',
    bounds: { minX: 0 },                 // only pulls toward the cut (right)
    springOpts: { stiffness: 220 },
    onMove: ({ x }) => {
      // Light up the chip as it nears the cut line (transform/opacity only).
      const near = Math.min(x / CUT_THRESHOLD_PX, 1);
      li.style.setProperty('--cut-near', near.toFixed(3));
      li.classList.toggle('is-arming', near >= 1 && !cut);
    },
    onRelease: ({ x }) => {
      if (cut || x < CUT_THRESHOLD_PX) return;
      cut = true;
      li.classList.remove('is-arming');
      li.classList.add('is-cut');
      drag.destroy();                    // freeze it where it landed (struck through)
      onCut();
    },
  });
  return drag;
};

/** The ring-fenced holiday: yields only RESIST_DAMP of the drag, capped at
 *  RESIST_CAP_PX, flexes its fence, and springs back every release. */
const makeFencedChip = (li, onResist) => {
  const fence = li.querySelector('.tw-chip-fence');
  const drag = draggable(li, {
    axis: 'x',
    spring: 'return',
    springOpts: { stiffness: 320, bounce: 0.12 },  // a firm, slightly elastic snap-back
    momentum: 0,
    // The fence fights back: damp the pull and clamp how far it can travel.
    bounds: ({ x }) => ({
      x: Math.max(0, Math.min(x * RESIST_DAMP, RESIST_CAP_PX)),
      y: 0,
    }),
    onMove: ({ x }) => {
      const strain = Math.min(x / RESIST_CAP_PX, 1);
      li.style.setProperty('--fence-strain', strain.toFixed(3));
      li.classList.add('is-straining');
      if (strain > 0.5 && typeof onResist === 'function') onResist();
    },
    onRelease: () => {
      li.classList.remove('is-straining');
      li.style.setProperty('--fence-strain', '0');
    },
  });
  // A faint, continuous "held" pulse on the fence so it reads as alive/guarded
  // even at rest — purely cosmetic, reduced-motion safe (CSS owns the pulse).
  if (fence) fence.dataset.ready = '1';
  return drag;
};

const buildAiOnTap = (rootEl, aiTasks) => {
  const host = rootEl.querySelector('[data-host="ai-bars"]');
  const items = aiTasks?.items;
  if (!host || !Array.isArray(items)) return;

  // Warm off-white page ground: navy bars (charts default) read high-contrast.
  const chart = horizontalBars(host, {
    items: items.map((it) => ({ id: it.id, label: it.label, pct: it.pct })),
    max: 100,
    decimals: 1,
    labelWidth: 190,
    ariaLabel: 'Tasks done with AI instead of a professional, by share for each task',
  });
  const highStakesIds = items.filter((it) => it.isHighStakes).map((it) => it.id);
  frameRows(chart.el, items, highStakesIds, 190);

  // Adoption split: have used AI vs have not (tugOfWar — own-side labels).
  const tugHost = rootEl.querySelector('[data-host="ai-tug"]');
  if (tugHost && aiTasks.anyTaskPct != null && aiTasks.notUsedPct != null) {
    tugOfWar(tugHost, {
      left: { label: 'Have used AI', pct: aiTasks.anyTaskPct },
      right: { label: 'Have not', pct: aiTasks.notUsedPct },
      accent: 'navy',
      ariaLabel: 'Share who have used AI instead of a professional versus those who have not',
    });
  }
};

// Geometry mirrored from charts.js horizontalBars (the only knobs that move).
const BAR_HEIGHT = 30;
const BAR_GAP = 12;
const CHART_WIDTH = 720;
const CHART_RIGHT_PAD = 56;
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Draw a 1.5px ink frame around the full track of named rows so a subset
 * reads as ring-fenced against flexible neighbours. Pure SVG, square corners,
 * positioned from the lib's known row geometry (no mutation of lib rows).
 *
 * @param {SVGElement} svg     the chart's <svg> (chart.el)
 * @param {Array<{id:string}>} rowItems  items in render order
 * @param {string[]} ids       ids of rows to frame
 * @param {number} labelWidth  must match the labelWidth passed to the chart
 */
const frameRows = (svg, rowItems, ids, labelWidth) => {
  if (!svg || !Array.isArray(rowItems) || !Array.isArray(ids) || ids.length === 0) return;
  const valueX = labelWidth + 12;
  const trackWidth = CHART_WIDTH - valueX - CHART_RIGHT_PAD;
  const wanted = new Set(ids);
  rowItems.forEach((item, index) => {
    if (!wanted.has(item.id)) return;
    const y = index * (BAR_HEIGHT + BAR_GAP);
    const frame = document.createElementNS(SVG_NS, 'rect');
    const inset = 2;
    frame.setAttribute('x', String(valueX - inset));
    frame.setAttribute('y', String(y - inset));
    frame.setAttribute('width', String(trackWidth + inset * 2));
    frame.setAttribute('height', String(BAR_HEIGHT + inset * 2));
    frame.setAttribute('fill', 'none');
    frame.setAttribute('stroke', '#0A1A5C');
    frame.setAttribute('stroke-width', '1.5');
    frame.setAttribute('class', 'tw-ringfence');
    svg.append(frame);
  });
};

export default function init(rootEl, data) {
  const { survey, journey } = data || {};
  if (!survey) return;

  // Journey gating: this step REQUIRES the trust drag-rank reveal. Next starts
  // locked and unlocks when revealTruth fires (the "reveal the real ranking"
  // action). gate() is a no-op when running outside the journey engine.
  journey?.gate?.();

  observeReveals(rootEl);
  observeCounters(rootEl);

  placeDeckArt(rootEl);
  buildTrustParadox(rootEl, survey.institutionTrust, () => journey?.ready?.());
  buildProtectedJoy(rootEl, survey.protectedSpend);
  buildAiOnTap(rootEl, survey.aiTasks);

  // Experiential motion: subtle parallax on the decorative deck art and a
  // scroll-progress entrance on each exhibit (CSS owns the visual treatment
  // via --enter). Both are reduced-motion safe inside the lib.
  observeParallax(rootEl, { maxShiftPx: 48 });
  rootEl.querySelectorAll('[data-exhibit]').forEach((ex) => chapterTransition(ex));
}
