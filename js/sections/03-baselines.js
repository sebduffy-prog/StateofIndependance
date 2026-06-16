/**
 * Chapter 03 - baselines. "The numbers you already know."
 *
 * The four baseline stats FLOW on a warm yellow->orange brand ground (the
 * "operational floor"), not a grid of bordered boxes. Each stat pairs a huge
 * Poppins-Black .si-bignum + label + sentence (navy on warm, via .on-warm)
 * with one supporting chart that sits DIRECTLY on the warm ground
 * (backgroundless, via .chart-holder — no white/paper card, no track box).
 * Components are NAVY (the charts.js default on warm grounds) so nothing is
 * mustard-on-mustard; faint ink-tint tracks, never a white box.
 *
 * EXPERIENTIAL (top-tier pass): the chapter opens with a deck image-title
 * lockup (Poppins-Black title beside the maze/orbit brand-world motif), the
 * decorative orbit/seed/bear layers drift on PARALLAX as the chapter scrolls,
 * and each stat row reveals on a scroll-progress mask (`--enter` custom prop,
 * styled in CSS). Stat 03 gains a live DOT-PLOT ⇄ ORBIT-RING toggle so the
 * reader can re-read the same verified data as the deck's orbit motif. All
 * motion is reduced-motion safe (experiential.js jumps to rest; the toggle
 * is a click, never autoplay).
 *
 * Chart variety (no accent mustard anywhere):
 *   - mood of the nation     -> lollipopChart (navy, careful highlighted ink)
 *   - money-saving moves      -> lollipopChart (navy)
 *   - availability concerns   -> dotPlot OR orbitRingChart (navy; user toggles)
 *   - 54 / 46 trading split   -> tugOfWar (navy vs mustard fill — the binary
 *                                split where the two-colour read is meaningful)
 *   - traded-down categories  -> horizontalBars (navy) with a pillGroup toggle
 *                                that re-sorts/filters the ranking live.
 *
 * Stat 1 is the MARQUEE, gated behind clickToGuess (the loved interaction):
 * the visitor guesses the 77% first, and only after they commit does the
 * number count up and assemble as a 100-in-100 crowd — a hundred people you
 * pass today, with the visitor's OWN square highlighted as one of them.
 *
 * Source captions are CUT site-wide (FEEDBACK-V4 §6); the strings remain in
 * data/survey.json, they are simply not rendered here.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="03-baselines">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import {
  horizontalBars,
  lollipopChart,
  dotPlot,
  tugOfWar,
  orbitRingChart,
} from '../lib/charts.js';
import { clickToGuess, pillGroup } from '../lib/interactions.js';
import { observeParallax, scrollScene, prefersReducedMotion, arrival } from '../lib/experiential.js';

const CAREFUL_TRUE_VALUE = 77.3;
const CAREFUL_WAFFLE_FILL = 77;
const TRADING_DOWN_PCT = 54;
const HOLDING_PCT = 46;
const PANEL_LABEL_WIDTH = 210;
const TOP_N = 4;

// 100-in-100 marquee tuning.
const CROWD_TOTAL = 100;
const CROWD_FILL_STAGGER_MS = 16; // per-square cascade
const CROWD_COUNT_MS = 1100; // caption count-up duration

/**
 * Build the 100-in-100 crowd: a 10×10 grid of squares that fills to `fill`
 * and singles out ONE filled square as the visitor's own ("you"). The fill
 * cascades on reveal; reduced motion paints the final state instantly.
 * Backgroundless — the squares carry the contrast, no card.
 * @param {HTMLElement} gridEl
 * @param {{ fill: number, youIndex: number }} opts
 */
const buildCrowd = (gridEl, { fill, youIndex }) => {
  const reduced = prefersReducedMotion();
  const cells = [];
  for (let i = 0; i < CROWD_TOTAL; i += 1) {
    const cell = document.createElement('span');
    cell.className = 'bl-crowd-cell';
    if (i === youIndex) cell.classList.add('is-you');
    gridEl.append(cell);
    cells.push(cell);
  }

  const paintCell = (i) => {
    if (i < fill) cells[i].classList.add('is-filled');
  };

  if (reduced) {
    cells.forEach((_, i) => paintCell(i));
    return;
  }

  // Cascade the fill in reading order; the you-square lands with the rest.
  let i = 0;
  const tick = () => {
    if (i >= CROWD_TOTAL) return;
    paintCell(i);
    i += 1;
    window.setTimeout(tick, CROWD_FILL_STAGGER_MS);
  };
  tick();
};

/** Count a caption number up to `to` (eased, tabular). Reduced motion = set. */
const countCaption = (el, to) => {
  if (!el) return;
  if (prefersReducedMotion()) {
    el.textContent = String(to);
    return;
  }
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / CROWD_COUNT_MS, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(to * eased));
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = String(to);
  };
  requestAnimationFrame(tick);
};

const mapItems = (items) =>
  items.map((i) => ({ id: i.id, label: i.label, pct: i.pct }));

export default function init(rootEl, data) {
  const { survey, journey } = data || {};
  if (!survey) return;

  // Journey gating: this step REQUIRES the visitor to lock in their guess (the
  // clickToGuess reveal) before Next unlocks. ready() fires from onReveal below.
  if (journey) journey.gate();

  const {
    moodOfNation,
    moneySavingMoves,
    availabilityConcerns,
    tradingDownByCategory,
  } = survey;

  observeReveals(rootEl);

  // Chapter arrival: assemble the heading (kicker/headline/standfirst lift in,
  // the emphasis word decrypts) each time this step becomes current. Not the
  // first step, so no ritual. Hero count-ups stay owned by observeCounters.
  rootEl.addEventListener('chapter:arrive', () => arrival(rootEl));

  // ── Experiential motion ──────────────────────────────────────────────
  // Subtle parallax on the decorative world layers (orbit, seeds, bear,
  // maze, report-cover mark). Clamped + reduced-motion safe by the helper.
  const cleanupParallax = observeParallax(rootEl, { maxShiftPx: 48 });

  // Scroll-progress reveal: as the chapter travels through the viewport,
  // expose `--enter` (0->1) on the root so CSS can mask/lift each row in.
  let cleanupScene = () => {};
  if (!prefersReducedMotion()) {
    cleanupScene = scrollScene(rootEl, [], {
      onProgress: (p) => rootEl.style.setProperty('--enter', p.toFixed(4)),
    });
  } else {
    rootEl.style.setProperty('--enter', '1');
  }
  // Signature brand-world motion: the maze opener holds its light static
  // frame until it scrolls into view, then swaps to the animated motion-logo
  // GIF (the State of Independence brand-world animation). The 11MB GIF is
  // never fetched on load, and reduced-motion readers keep the static frame.
  let mazeObserver;
  const maze = rootEl.querySelector('[data-motion-src]');
  if (maze && !prefersReducedMotion()) {
    mazeObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const motionSrc = maze.dataset.motionSrc;
          if (motionSrc && maze.getAttribute('src') !== motionSrc) {
            maze.setAttribute('src', motionSrc);
          }
          obs.disconnect();
        });
      },
      { rootMargin: '0px 0px -15% 0px' },
    );
    mazeObserver.observe(maze);
  }

  // Detach scroll work if the chapter is ever torn down (defensive; the
  // static site keeps sections mounted, so this is a no-op in practice).
  rootEl.addEventListener('chapter:teardown', () => {
    cleanupParallax();
    cleanupScene();
    if (mazeObserver) mazeObserver.disconnect();
  });

  // Panel 1 — the MARQUEE: the guess gates the hero count-up AND the 100-in-100
  // crowd reveal (your own square among the hundred). On reveal the mood chart
  // steps aside and the crowd assembles full-bleed.
  const heroOne = rootEl.querySelector('[data-bl-num1]');
  const guessHost = rootEl.querySelector('[data-guess-1]');
  const crowdFig = rootEl.querySelector('[data-crowd-1]');
  const crowdGrid = rootEl.querySelector('[data-crowd-grid]');
  const crowdCount = rootEl.querySelector('[data-crowd-count]');
  const moodFig = rootEl.querySelector('[data-mood-fig]');
  let carefulRevealed = false;

  // The visitor's own square: fixed once so it is stable across re-renders,
  // and always inside the filled set so "you" are genuinely one of the 77.
  const youIndex = Math.floor(Math.random() * CAREFUL_WAFFLE_FILL);

  // Placeholder before the guess gates the reveal — a neutral dash, never a
  // literal "00%" that reads as a real zero in a static / pre-scroll capture.
  if (heroOne) heroOne.textContent = '–';

  const revealCareful = () => {
    if (carefulRevealed) return;
    carefulRevealed = true;
    if (heroOne) countUp(heroOne, { to: CAREFUL_WAFFLE_FILL, suffix: '%' });
    // The mood lollipop recedes; the crowd takes the marquee slot.
    if (moodFig) moodFig.hidden = true;
    if (crowdFig && crowdGrid) {
      crowdFig.hidden = false;
      crowdFig.classList.add('is-live');
      buildCrowd(crowdGrid, { fill: CAREFUL_WAFFLE_FILL, youIndex });
      countCaption(crowdCount, CAREFUL_WAFFLE_FILL);
    }
  };

  if (guessHost) {
    clickToGuess(guessHost, {
      trueValue: CAREFUL_TRUE_VALUE,
      label: 'More careful with money than five years ago',
      prompt: 'Before we show you, what share do you think?',
      onReveal: () => {
        revealCareful();
        // The visitor has locked in their guess — unlock the journey's Next.
        if (journey) journey.ready();
      },
    });
  } else {
    // No interaction host (defensive) — reveal immediately and unlock so the
    // visitor is never trapped on a gated step that cannot complete.
    revealCareful();
    if (journey) journey.ready();
  }

  // Panels 2 to 4 - hero numbers count up declaratively on scroll-in.
  observeCounters(rootEl);

  // Panel 1 chart - mood of the nation as a lollipop, careful highlighted.
  const moodHost = rootEl.querySelector('[data-bars-mood]');
  if (moodHost && moodOfNation) {
    lollipopChart(moodHost, {
      // Navy dots/stems on the warm ground; the "careful" item draws in ink
      // as the highlight (charts.js uses ink for the highlight on warm).
      items: mapItems(moodOfNation.items),
      highlightId: 'careful',
      accent: 'navy',
      ariaLabel: 'Mood of the nation, percentage who agree with each statement',
    });
  }

  // Panel 2 chart - money-saving moves as a lollipop.
  const moneyHost = rootEl.querySelector('[data-lollipop-money]');
  if (moneyHost && moneySavingMoves) {
    lollipopChart(moneyHost, {
      items: mapItems(moneySavingMoves.items),
      accent: 'navy',
      ariaLabel: 'Money-saving moves taken in the last three months',
    });
  }

  // Panel 3 chart - availability concerns. The reader toggles between a dot
  // plot (a flat "down / anxious" read) and the deck's ORBIT-RING motif as a
  // live data view — same verified numbers, two readings.
  const availabilityHost = rootEl.querySelector('[data-dotplot-availability]');
  const orbitHost = rootEl.querySelector('[data-orbit-availability]');
  const availabilityControls = rootEl.querySelector('[data-availability-controls]');
  if (availabilityHost && availabilityConcerns) {
    const availItems = mapItems(availabilityConcerns.items);

    dotPlot(availabilityHost, {
      items: availItems,
      accent: 'navy',
      ariaLabel: 'What Britain is anxious about in the coming months',
    });

    let orbitDrawn = false;
    const drawOrbit = () => {
      if (orbitDrawn || !orbitHost) return;
      orbitDrawn = true;
      orbitRingChart(orbitHost, {
        items: availItems,
        accent: 'navy',
        centreLabel: 'WORRY',
        ariaLabel: 'Availability concerns plotted as orbit rings, largest worry on the outer ring',
      });
    };

    if (availabilityControls && orbitHost) {
      pillGroup(availabilityControls, {
        ariaLabel: 'Read the availability concerns as a list or as orbit rings',
        value: 'list',
        options: [
          { value: 'list', label: 'List' },
          { value: 'orbit', label: 'Orbit' },
        ],
        onChange: (value) => {
          const showOrbit = value === 'orbit';
          if (showOrbit) drawOrbit();
          orbitHost.hidden = !showOrbit;
          availabilityHost.hidden = showOrbit;
        },
      });
    }
  }

  // Panel 4 - the 54 / 46 split as a tugOfWar (navy ↔ mustard binary tension
  // bar; labels sit on their own side so they can never overlap).
  const tugHost = rootEl.querySelector('[data-tug-trading]');
  if (tugHost) {
    tugOfWar(tugHost, {
      left: { label: 'Trading down', pct: TRADING_DOWN_PCT },
      right: { label: 'Holding their basket', pct: HOLDING_PCT },
      accent: 'navy',
      ariaLabel: '54% trading down on groceries, 46% holding their basket',
    });
  }

  // Panel 4 chart - traded-down categories ranked, with a live pillGroup
  // toggle: see every category, or just the top four where the squeeze bites.
  const tradingHost = rootEl.querySelector('[data-bars-trading]');
  const tradingControls = rootEl.querySelector('[data-trading-controls]');
  if (tradingHost && tradingDownByCategory) {
    const allItems = mapItems(tradingDownByCategory.items)
      .slice()
      .sort((a, b) => b.pct - a.pct);
    const topItems = allItems.slice(0, TOP_N);

    const chart = horizontalBars(tradingHost, {
      items: allItems,
      decimals: 0,
      labelWidth: PANEL_LABEL_WIDTH,
      ariaLabel: 'Categories where Britain has traded down in the last 12 months',
    });

    if (tradingControls) {
      pillGroup(tradingControls, {
        ariaLabel: 'Show all categories or just the top four',
        value: 'all',
        options: [
          { value: 'all', label: 'All categories' },
          { value: 'top', label: 'Top 4' },
        ],
        onChange: (value) => {
          chart.update(value === 'top' ? topItems : allItems, { resort: true });
        },
      });
    }
  }
}
