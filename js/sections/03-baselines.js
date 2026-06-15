/**
 * Chapter 03 - baselines. "The numbers you already know."
 *
 * Design World V2: the four baseline stats FLOW on a warm mustard->orange
 * gradient ground (the "operational floor"), not a grid of bordered boxes.
 * Each stat pairs a huge .si-bignum + label + sentence (navy on warm, via
 * .on-warm) with one supporting chart sitting on a clean square paper mat
 * so the chart's ink marks never sit colour-on-colour against the gradient.
 * Alternating left/right rhythm; generous negative space; orbit + cream bear
 * silhouette + seed dots are decoration only (behind, pointer-events:none).
 * Chart variety keeps bar reliance to a single horizontalBars (stat 4):
 *   - mood of the nation     -> lollipopChart (careful highlighted ink)
 *   - money-saving moves      -> lollipopChart
 *   - availability concerns   -> dotPlot (mustard-dark, a down/anxious read)
 *   - 54 / 46 trading split   -> proportionStrip
 *   - traded-down categories  -> horizontalBars (the one bar chart)
 * Stat 1 stays gated behind clickToGuess (the loved interaction): the
 * 77% number and its waffle only reveal after the reader commits a guess.
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
  proportionStrip,
} from '../lib/charts.js';
import { clickToGuess } from '../lib/interactions.js';

const CAREFUL_TRUE_VALUE = 77.3;
const CAREFUL_WAFFLE_FILL = 77;
const TRADING_DOWN_PCT = 54;
const HOLDING_PCT = 46;
const PANEL_LABEL_WIDTH = 210;

const setSource = (rootEl, selector, text) => {
  const node = rootEl.querySelector(selector);
  if (node && text) node.textContent = `Source: ${text}`;
};

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
        accent: 'mustard',
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
      items: mapItems(moodOfNation.items),
      highlightId: 'careful',
      accent: 'mustard',
      ariaLabel: 'Mood of the nation, percentage who agree with each statement',
    });
    setSource(rootEl, '[data-source-mood]', moodOfNation.source);
  }

  // Panel 2 chart - money-saving moves as a lollipop.
  const moneyHost = rootEl.querySelector('[data-lollipop-money]');
  if (moneyHost && moneySavingMoves) {
    lollipopChart(moneyHost, {
      items: mapItems(moneySavingMoves.items),
      accent: 'mustard',
      ariaLabel: 'Money-saving moves taken in the last three months',
    });
    setSource(rootEl, '[data-source-money]', moneySavingMoves.source);
  }

  // Panel 3 chart - availability concerns as a dot plot (down / anxious read).
  const availabilityHost = rootEl.querySelector('[data-dotplot-availability]');
  if (availabilityHost && availabilityConcerns) {
    dotPlot(availabilityHost, {
      items: mapItems(availabilityConcerns.items),
      accent: 'mustard',
      ariaLabel: 'What Britain is anxious about in the coming months',
    });
    setSource(rootEl, '[data-source-availability]', availabilityConcerns.source);
  }

  // Panel 4 - the 54 / 46 split as a proportion strip.
  const stripHost = rootEl.querySelector('[data-strip-trading]');
  if (stripHost) {
    proportionStrip(stripHost, {
      segments: [
        { label: 'Trading down', pct: TRADING_DOWN_PCT, accent: 'mustard' },
        { label: 'Holding their basket', pct: HOLDING_PCT, accent: 'teal' },
      ],
      ariaLabel: '54% trading down on groceries, 46% holding their basket',
    });
  }

  // Panel 4 chart - the one bar chart: traded-down categories ranked.
  const tradingHost = rootEl.querySelector('[data-bars-trading]');
  if (tradingHost && tradingDownByCategory) {
    horizontalBars(tradingHost, {
      items: mapItems(tradingDownByCategory.items),
      decimals: 0,
      labelWidth: PANEL_LABEL_WIDTH,
      ariaLabel: 'Categories where Britain has traded down in the last 12 months',
    });
    setSource(rootEl, '[data-source-trading]', tradingDownByCategory.source);
  }
}
