/**
 * Step 04 — baselines: the rest. Deal-seeking / anxiety / trading-down on one
 * composed cream screen; a DIFFERENT viz each so the row never reads as three
 * identical charts:
 *
 *   1 · Deal-seeking 55%  (Q6Ar4 shoppedAround 54.5) — LOLLIPOP of the
 *       money-saving moves it tops.
 *   2 · Anxiety 60%       (Q2r2 anxious 60.2)        — DOT PLOT placing dread
 *       among the four leading national-mood readings.
 *   3 · Trading down 54%  (Q6Br1 groceries 53.6)     — TUG-OF-WAR: traded
 *       down vs held the basket (binary split; labels can never overlap).
 *
 * MARQUEE — quiet pill filter: focuses one baseline, dims the other two.
 * Keyboard-driven (arrow keys between chips). Never traps navigation.
 *
 * All figures trace to data/survey.json. Backgroundless navy marks on cream,
 * tabular navy numbers, character→title reveal on chapter:arrive.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 4-baselines-rest.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="04-baselines-rest">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival } from '../lib/experiential.js';
import { lollipopChart, dotPlot, tugOfWar } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

const PANELS = ['deal', 'anxiety', 'grocery'];

/** Pick an item's pct from a survey block by id, or null if absent. */
const pctOf = (block, id) => {
  const item = block && block.items && block.items.find((i) => i.id === id);
  return item ? item.pct : null;
};

export default function init(rootEl, data) {
  const { survey, journey } = data;
  if (!survey) return; // fail soft — any dataset may be null

  // Entrance: re-assemble headline + count numbers on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);
  observeCounters(rootEl);

  /* ── 1 · Deal-seeking — lollipop of the money-saving moves ──────── */
  const moves = survey.moneySavingMoves;
  const dealHost = rootEl.querySelector('[data-viz-deal]');
  if (dealHost && moves && moves.items) {
    const SHORT = {
      shoppedAround:          'Shopped around',
      ownLabelSwitch:         'Own-label',
      downgradedSubscription: 'Cut a sub',
      protectedTreat:         'Kept a treat',
    };
    lollipopChart(dealHost, {
      items: moves.items.map((i) => ({ id: i.id, label: SHORT[i.id] || i.label, pct: i.pct })),
      max: 100,
      accent: 'navy',
      highlightId: 'shoppedAround',
      ariaLabel: 'Money-saving moves taken in the last three months',
    });
  }

  /* ── 2 · Anxiety — dot plot among the national-mood readings ────── */
  const mood = survey.moodOfNation;
  const anxietyHost = rootEl.querySelector('[data-viz-anxiety]');
  if (anxietyHost && mood && mood.items) {
    const SHORT = {
      careful:    'Careful',
      anxious:    'Anxious',
      exhausted:  'Exhausted',
      selfReliant:'Self-reliant',
    };
    // Top four mood readings — anxiety sits among them, not alone.
    const top = mood.items.slice(0, 4).map((i) => ({
      label: SHORT[i.id] || i.label,
      pct: i.pct,
    }));
    dotPlot(anxietyHost, {
      items: top,
      max: 100,
      accent: 'navy',
      ariaLabel: 'The national mood ranked: careful 77%, anxious 60%, exhausted 55%, self-reliant 54%',
    });
  }

  /* ── 3 · Trading down groceries — tug-of-war (binary split) ────── */
  const groceries = pctOf(survey.tradingDownByCategory, 'groceries');
  const groceryHost = rootEl.querySelector('[data-viz-grocery]');
  if (groceryHost && groceries != null) {
    const held = Math.round((100 - groceries) * 10) / 10;
    tugOfWar(groceryHost, {
      left:  { label: 'Traded down', pct: Math.round(groceries) },
      right: { label: 'Held the basket', pct: Math.round(held) },
      accent: 'navy',
      ariaLabel: 'Groceries: traded down versus held the basket',
    });
  }

  /* ── MARQUEE — focus one baseline at a time ─────────────────────── */
  const grid = rootEl.querySelector('.br-grid');
  const filterHost = rootEl.querySelector('[data-filter]');
  if (grid && filterHost) {
    const apply = (value) => {
      grid.dataset.focus = value;
      PANELS.forEach((p) => {
        const panel = grid.querySelector(`[data-panel="${p}"]`);
        if (panel) panel.classList.toggle('is-focus', value === p);
      });
    };

    pillGroup(filterHost, {
      ariaLabel: 'Read one baseline at a time',
      value: 'all',
      options: [
        { value: 'all',     label: 'All three' },
        { value: 'deal',    label: 'Deal-seeking' },
        { value: 'anxiety', label: 'Anxiety' },
        { value: 'grocery', label: 'Trading down' },
      ],
      onChange: (value) => {
        apply(value);
        if (value !== 'all') journey.ready();
      },
    });
    apply('all');

    // Advisory hint only — Next still unlocks after the dwell.
    journey.gate();
  }
}
