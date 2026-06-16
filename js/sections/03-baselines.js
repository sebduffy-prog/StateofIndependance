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
 * Stat 1 stays gated behind clickToGuess (the loved interaction): the 77%
 * number and its waffle only reveal after the reader commits a guess.
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
  waffleGrid,
  lollipopChart,
  dotPlot,
  tugOfWar,
  orbitRingChart,
} from '../lib/charts.js';
import { clickToGuess, pillGroup } from '../lib/interactions.js';
import { observeParallax, scrollScene, prefersReducedMotion } from '../lib/experiential.js';

const CAREFUL_TRUE_VALUE = 77.3;
const CAREFUL_WAFFLE_FILL = 77;
const TRADING_DOWN_PCT = 54;
const HOLDING_PCT = 46;
const PANEL_LABEL_WIDTH = 210;
const TOP_N = 4;

const mapItems = (items) =>
  items.map((i) => ({ id: i.id, label: i.label, pct: i.pct }));

export default function init(rootEl, data) {
  const { survey } = data || {};
  if (!survey) return;

  const {
    moodOfNation,
    moneySavingMoves,
    availabilityConcerns,
    tradingDownByCategory,
  } = survey;

  observeReveals(rootEl);

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
  // Detach scroll work if the chapter is ever torn down (defensive; the
  // static site keeps sections mounted, so this is a no-op in practice).
  rootEl.addEventListener('chapter:teardown', () => {
    cleanupParallax();
    cleanupScene();
  });

  // Panel 1 - the guess gates both the hero count-up and the 77/100 waffle.
  const heroOne = rootEl.querySelector('[data-bl-num1]');
  const guessHost = rootEl.querySelector('[data-guess-1]');
  const waffleHost = rootEl.querySelector('[data-waffle-1]');
  let carefulRevealed = false;

  // Placeholder before the guess gates the reveal — a neutral dash, never a
  // literal "00%" that reads as a real zero in a static / pre-scroll capture.
  if (heroOne) heroOne.textContent = '–';

  const revealCareful = () => {
    if (carefulRevealed) return;
    carefulRevealed = true;
    if (heroOne) countUp(heroOne, { to: CAREFUL_WAFFLE_FILL, suffix: '%' });
    if (waffleHost) {
      waffleHost.hidden = false;
      waffleGrid(waffleHost, {
        value: CAREFUL_WAFFLE_FILL,
        // Navy filled squares read high-contrast on the warm amber ground;
        // mustard squares would vanish colour-on-colour.
        accent: 'navy',
        square: 18,
        gap: 4,
        ariaLabel: `${CAREFUL_WAFFLE_FILL} in 100 UK adults are more careful with money`,
      });
    }
  };

  if (guessHost) {
    clickToGuess(guessHost, {
      trueValue: CAREFUL_TRUE_VALUE,
      label: 'More careful with money than five years ago',
      prompt: 'Before we show you, what share do you think?',
      onReveal: revealCareful,
    });
  } else {
    revealCareful();
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
