/**
 * Chapter 04 — baselines: the rest. The other table-stakes baselines on one
 * composed cream screen, each given a DIFFERENT viz so the row never reads as
 * three of the same chart:
 *
 *   1 · Deal-seeking 55%  (Q6A shoppedAround 54.5) — LOLLIPOP of the money-
 *       saving moves it tops.
 *   2 · Anxiety 60%       (Q2r2 anxious 60.2)      — DOT PLOT placing dread
 *       among the national-mood readings.
 *   3 · Trading down 54%  (Q6B groceries 53.6)     — PROPORTION strip: traded
 *       down vs held the basket.
 *
 * THE MARQUEE — a quiet pill filter ("read one at a time"): focusing a baseline
 * enlarges its panel and dims the other two so the eye lands on one number at a
 * time. Keyboard-driven (arrow keys), never traps; "All three" returns the row.
 *
 * All figures trace to data/survey.json. Backgroundless navy marks on cream,
 * tabular navy numbers, the character->title reveal on arrival.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 4-baselines-rest.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="04-baselines-rest">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival } from '../lib/experiential.js';
import { lollipopChart, dotPlot, proportionStrip } from '../lib/charts.js';
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
    // Compact display labels (same verified items) so the lollipop reads in a
    // narrow third-column without the labels clipping.
    const SHORT = {
      shoppedAround: 'Shopped around',
      ownLabelSwitch: 'Own-label',
      downgradedSubscription: 'Cut a sub',
      protectedTreat: 'Kept a treat',
    };
    lollipopChart(dealHost, {
      items: moves.items.map((i) => ({ id: i.id, label: SHORT[i.id] || i.label, pct: i.pct })),
      max: 100,
      accent: 'navy',
      highlightId: 'shoppedAround',
      ariaLabel: 'Money-saving moves taken in the last three months: shopped around 55%, own-label 43%, cut a subscription 30%, kept a treat 25%',
    });
  }

  /* ── 2 · Anxiety — dot plot among the national mood readings ────── */
  const mood = survey.moodOfNation;
  const anxietyHost = rootEl.querySelector('[data-viz-anxiety]');
  if (anxietyHost && mood && mood.items) {
    // The four highest mood readings — anxiety sits among them, not alone.
    // Compact display labels (same verified items) so the dot plot reads in a
    // narrow third-column without the labels clipping.
    const SHORT = {
      careful: 'Careful',
      anxious: 'Anxious',
      exhausted: 'Exhausted',
      selfReliant: 'Self-reliant',
    };
    const top = mood.items.slice(0, 4).map((i) => ({
      label: SHORT[i.id] || i.label,
      pct: i.pct,
    }));
    dotPlot(anxietyHost, {
      items: top,
      max: 100,
      accent: 'navy',
      ariaLabel: 'The national mood, ranked: careful 77%, anxious 60%, exhausted 55%, self-reliant 54%',
    });
  }

  /* ── 3 · Trading down groceries — proportion split ─────────────── */
  const groceries = pctOf(survey.tradingDownByCategory, 'groceries');
  const groceryHost = rootEl.querySelector('[data-viz-grocery]');
  if (groceryHost && groceries != null) {
    const held = Math.round((100 - groceries) * 10) / 10;
    proportionStrip(groceryHost, {
      segments: [
        { label: 'Traded down', pct: groceries, accent: 'navy' },
        { label: 'Held the basket', pct: held, accent: 'teal' },
      ],
      ariaLabel: 'Groceries: traded down versus held the basket',
    });
  }

  /* ── THE MARQUEE — focus one baseline at a time ─────────────────── */
  const grid = rootEl.querySelector('.br-grid');
  const filterHost = rootEl.querySelector('[data-filter]');
  if (grid && filterHost) {
    const apply = (value) => {
      grid.dataset.focus = value; // CSS dims the non-focused panels
      PANELS.forEach((p) => {
        const panel = grid.querySelector(`[data-panel="${p}"]`);
        if (panel) panel.classList.toggle('is-focus', value === p);
      });
    };

    pillGroup(filterHost, {
      ariaLabel: 'Read one baseline at a time',
      value: 'all',
      options: [
        { value: 'all', label: 'All three' },
        { value: 'deal', label: 'Deal-seeking' },
        { value: 'anxiety', label: 'Anxiety' },
        { value: 'grocery', label: 'Trading down' },
      ],
      onChange: (value) => {
        apply(value);
        if (value !== 'all') journey.ready(); // they engaged with the focus
      },
    });
    apply('all');

    // Advisory "try it" hint only (Next still unlocks after the dwell).
    journey.gate();
  }
}
