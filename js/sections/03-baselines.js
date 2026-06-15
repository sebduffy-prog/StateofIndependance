/**
 * Chapter 03 — baselines. "The numbers you already know."
 * Four baseline moments, each a hero number + supporting chart. The first
 * moment is gated behind a guess (the house commit-then-reveal grammar):
 * the reader guesses "more careful with money" before 77 fills the waffle.
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="03-baselines"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters, countUp } from '../lib/counter.js';
import { horizontalBars, waffleGrid } from '../lib/charts.js';
import { clickToGuess } from '../lib/interactions.js';

const CAREFUL_TRUE_VALUE = 77.3;
const CAREFUL_WAFFLE_FILL = 77;
const TRADING_DOWN_PCT = 54;

const setSource = (rootEl, selector, text) => {
  const node = rootEl.querySelector(selector);
  if (node && text) node.textContent = `Source: ${text}`;
};

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

  // Moment 1 — guess gates both the hero count-up and the 77/100 waffle.
  const heroOne = rootEl.querySelector('#bl-1-title .bl-stat-value');
  const guessHost = rootEl.querySelector('[data-guess-1]');
  const waffleHost = rootEl.querySelector('[data-waffle-1]');
  let carefulRevealed = false;

  if (heroOne) heroOne.textContent = '—';

  const revealCareful = () => {
    if (carefulRevealed) return;
    carefulRevealed = true;
    if (heroOne) {
      heroOne.removeAttribute('data-count-to');
      countUp(heroOne, { to: CAREFUL_WAFFLE_FILL, suffix: '%' });
    }
    if (waffleHost) {
      waffleHost.hidden = false;
      waffleGrid(waffleHost, {
        value: CAREFUL_WAFFLE_FILL,
        accent: 'mustard',
        ariaLabel: `${CAREFUL_WAFFLE_FILL} in 100 UK adults are more careful with money`,
      });
    }
  };

  if (guessHost) {
    clickToGuess(guessHost, {
      trueValue: CAREFUL_TRUE_VALUE,
      label: 'More careful with money than 5 years ago',
      prompt: 'Before we show you — what share do you think?',
      onReveal: revealCareful,
    });
  } else {
    revealCareful();
  }

  // The other three hero numbers count up declaratively on scroll-in.
  observeCounters(rootEl);

  // Moment 1 chart — mood of the nation (% agree, 6 items, careful highlighted).
  const moodHost = rootEl.querySelector('[data-bars-mood]');
  if (moodHost && moodOfNation) {
    horizontalBars(moodHost, {
      items: moodOfNation.items.map((i) => ({ id: i.id, label: i.label, pct: i.pct })),
      decimals: 1,
      highlightId: 'careful',
      labelWidth: 280,
      ariaLabel: 'Mood of the nation, percentage who agree with each statement',
    });
    setSource(rootEl, '[data-source-mood]', moodOfNation.source);
  }

  // Moment 2 chart — money-saving moves (4 items).
  const moneyHost = rootEl.querySelector('[data-bars-money]');
  if (moneyHost && moneySavingMoves) {
    horizontalBars(moneyHost, {
      items: moneySavingMoves.items.map((i) => ({ id: i.id, label: i.label, pct: i.pct })),
      decimals: 1,
      labelWidth: 280,
      ariaLabel: 'Money-saving moves taken in the last three months',
    });
    setSource(rootEl, '[data-source-money]', moneySavingMoves.source);
  }

  // Moment 3 chart — availability concerns (4 items).
  const availabilityHost = rootEl.querySelector('[data-bars-availability]');
  if (availabilityHost && availabilityConcerns) {
    horizontalBars(availabilityHost, {
      items: availabilityConcerns.items.map((i) => ({ id: i.id, label: i.label, pct: i.pct })),
      decimals: 1,
      labelWidth: 240,
      ariaLabel: 'What Britain is anxious about in the coming months',
    });
    setSource(rootEl, '[data-source-availability]', availabilityConcerns.source);
  }

  // Moment 4 chart — trading down by category (8 items) + 54/46 split bar.
  const tradingHost = rootEl.querySelector('[data-bars-trading]');
  if (tradingHost && tradingDownByCategory) {
    horizontalBars(tradingHost, {
      items: tradingDownByCategory.items.map((i) => ({ id: i.id, label: i.label, pct: i.pct })),
      decimals: 1,
      labelWidth: 200,
      ariaLabel: 'Categories where Britain has traded down in the last 12 months',
    });
    setSource(rootEl, '[data-source-trading]', tradingDownByCategory.source);
  }

  const splitFill = rootEl.querySelector('[data-split-fill]');
  if (splitFill) splitFill.style.width = `${TRADING_DOWN_PCT}%`;
}
