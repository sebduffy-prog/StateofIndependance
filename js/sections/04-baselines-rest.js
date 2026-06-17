/**
 * Step 04 — Baselines: the rest.
 * Three remaining national-mood / behaviour baselines on one composed cream screen.
 *
 * Layout: two-column (left: WLV title + standfirst + pill filter; right: three stacked
 * data panels — each a stat number + a distinct viz).
 *
 * Viz choices — varied per panel to avoid repetition:
 *   1 · Deal-seeking 55%  (Q6Ar4 shoppedAround 54.5%) — LOLLIPOP: the four
 *       money-saving moves (highlighted: shoppedAround). Navy marks on cream.
 *   2 · Anxiety 60%       (Q2r2 anxious 60.2%)        — DOT PLOT: the four
 *       leading national-mood readings. Shows 60% in context (not alone).
 *   3 · Trading down 54%  (Q6Br1 groceries 53.6%)     — TUG-OF-WAR: binary
 *       traded-down vs held-the-basket split. Labels never collide.
 *
 * MARQUEE — pill filter (square chips, keyboard-driven, arrow keys).
 *   Focuses one panel, dims the other two. Never traps navigation.
 *   gate() / ready() advisory only.
 *
 * All figures traced to data/survey.json. Tabular navy numbers on cream.
 * character→title reveal fires on every chapter:arrive (idempotent).
 * Reduced-motion, keyboard, no console.log.
 *
 * Contract: docs/CONTRACT.md.
 * CSS selectors scoped to #\30 4-baselines-rest (escaped leading digit).
 *
 * @param {HTMLElement} rootEl  <section class="journey-stage" id="04-baselines-rest">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */

import { observeReveals }  from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival }         from '../lib/experiential.js';
import { lollipopChart, dotPlot, tugOfWar } from '../lib/charts.js';
import { pillGroup }       from '../lib/interactions.js';

const PANELS = ['deal', 'anxiety', 'grocery'];

/** Safely extract pct from a survey block by item id. */
const pctOf = (block, id) => {
  if (!block || !block.items) return null;
  const item = block.items.find((i) => i.id === id);
  return item ? item.pct : null;
};

export default function init(rootEl, data) {
  const { survey, journey } = data;
  if (!survey) return; // any dataset may be null — fail soft

  // Entrance: re-assemble headline + count up numbers on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  observeReveals(rootEl);
  observeCounters(rootEl);

  // ── 1 · Deal-seeking — lollipop of the money-saving moves ─────────────────

  const moves = survey.moneySavingMoves;
  const dealHost = rootEl.querySelector('[data-viz-deal]');
  if (dealHost && moves && moves.items) {
    const SHORT_LABELS = {
      shoppedAround:          'Shopped around / deals',
      ownLabelSwitch:         'Switched own-label',
      downgradedSubscription: 'Cut a subscription',
      protectedTreat:         'Protected a treat',
    };
    const dealItems = moves.items.map((i) => ({
      id:    i.id,
      label: SHORT_LABELS[i.id] || i.label,
      pct:   i.pct,
    }));
    lollipopChart(dealHost, {
      items:       dealItems,
      // Tightened scale: values top out at 55, so a 62 ceiling lets the bars
      // run most of the width instead of stranding the right half empty.
      max:         62,
      accent:      'navy',
      highlightId: 'shoppedAround',
      ariaLabel:   'Money-saving moves taken in the last three months',
    });
  }

  // ── 2 · Anxiety — dot plot placing dread among four mood readings ──────────

  const mood = survey.moodOfNation;
  const anxietyHost = rootEl.querySelector('[data-viz-anxiety]');
  if (anxietyHost && mood && mood.items) {
    const SHORT_LABELS = {
      careful:     'Careful with money',
      anxious:     'Anxious about next months',
      exhausted:   'Emotionally exhausted',
      selfReliant: 'More self-reliant',
    };
    // Top four mood readings — 60% sits in visible context, not alone.
    const moodItems = mood.items.slice(0, 4).map((i) => ({
      label: SHORT_LABELS[i.id] || i.label,
      pct:   i.pct,
    }));
    dotPlot(anxietyHost, {
      items:    moodItems,
      // Max 100 gives clean round axis ticks (0/25/50/75/100); 88 produced the
      // odd 22/44/66/88 markers the client flagged.
      max:      100,
      accent:   'navy',
      ariaLabel: 'National mood scores: top four readings',
    });
  }

  // ── 3 · Trading down groceries — tug-of-war binary split ──────────────────

  const groceries = pctOf(survey.tradingDownByCategory, 'groceries');
  const groceryHost = rootEl.querySelector('[data-viz-grocery]');
  if (groceryHost && groceries != null) {
    const tradedDown = Math.round(groceries);
    const heldBasket = 100 - tradedDown;
    tugOfWar(groceryHost, {
      left:     { label: 'Traded down', pct: tradedDown },
      right:    { label: 'Held the basket', pct: heldBasket },
      accent:   'navy',
      ariaLabel: 'Split: traded down to cheaper groceries vs held the basket',
    });
  }

  // ── MARQUEE — pill filter: focus one baseline at a time ───────────────────

  const grid       = rootEl.querySelector('.br-grid');
  const left       = rootEl.querySelector('.br-left');
  const filterHost = rootEl.querySelector('[data-filter]');

  if (grid && filterHost) {
    // Mirror the focus onto BOTH columns: the grid dims the non-focused
    // charts, the left column dims the two non-focused stats in sync.
    const applyFocus = (value) => {
      grid.dataset.focus = value;
      if (left) left.dataset.focus = value;
    };

    pillGroup(filterHost, {
      ariaLabel: 'Read one baseline at a time',
      value:     'all',
      options: [
        { value: 'all',     label: 'All three'   },
        { value: 'deal',    label: 'Deal-seeking' },
        { value: 'anxiety', label: 'Anxiety'      },
        { value: 'grocery', label: 'Trading down' },
      ],
      onChange: (value) => {
        applyFocus(value);
        if (value !== 'all') journey.ready();
      },
    });

    applyFocus('all');

    // Advisory only — Next unlocks after dwell regardless.
    journey.gate();
  }
}
