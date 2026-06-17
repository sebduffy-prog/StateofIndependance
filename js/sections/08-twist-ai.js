/**
 * Chapter 08 — Twist three: AI ON TAP.
 *
 * THE ONE MEMORABLE THING: a human-vs-AI substitution strip across the three
 * HIGH-STAKES professions. The visitor picks a profession (finance / health /
 * legal) from a square pill control; a tug-of-war divider SPRINGS to the true
 * Q11 split — the share of Britain who now reach for AI instead of a human
 * professional for that very task. Expertise that once sat behind a desk and a
 * fee now sits in a pocket. Data as a felt tension, not a chart.
 *
 * The two headline numbers are held RIGOROUSLY DISTINCT (per CONTRACT §5 + the
 * STORY note): 58.4% used AI instead of a human for ANY task; 37.4% for the
 * high-stakes calls. They live in the headline cluster (counted up on arrival);
 * the tug-of-war drills only into the three high-stakes tasks themselves.
 *
 * The one marquee beat is advisory-gated (journey.gate()/ready()): switching the
 * profession once clears the hint. Fully keyboard operable (pillGroup is
 * arrow-key navigable) and reduced-motion safe (the tug-of-war jump-cuts; the
 * counters jump-cut). The "you" dot anchors on the live strip.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 8-twist-ai.
 * Verified values: data/survey.json aiTasks (Q11). High-stakes items only here
 * (isHighStakes === true): health 24.7, financial 19.7, legal 9.4.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="08-twist-ai">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { arrival } from '../lib/experiential.js';
import { tugOfWar } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

/**
 * Map a high-stakes Q11 task id to the human professional you'd otherwise have
 * paid for it — so each tug-of-war reads as a real substitution, not a label.
 */
const HUMAN_FOR = {
  financial: 'A financial adviser',
  health: 'A doctor or nurse',
  legal: 'A solicitor',
};

/** Short pill labels for the picker (sentence case, the verified domains). */
const PILL_LABEL = {
  financial: 'Finance',
  health: 'Health',
  legal: 'Legal',
};

/**
 * Build the substitution strip: a square pill picker over the high-stakes
 * tasks + a tug-of-war that springs to each one's AI-vs-human split. Calls
 * onActivity() the first time the visitor switches profession (gate clear).
 * Returns { destroy }.
 */
const buildStrip = (els, tasks, onActivity) => {
  const { picker, strip, readout } = els;

  // High-stakes Q11 tasks only, in the deck's descending order. Fail soft if
  // the verified data is missing — never trap anyone.
  const stakes = tasks
    .filter((t) => t.isHighStakes && HUMAN_FOR[t.id])
    .sort((a, b) => b.pct - a.pct);

  if (stakes.length === 0) {
    strip.innerHTML =
      '<p class="twist-ai-empty">High-stakes AI-use data is not available.</p>';
    return { destroy() {} };
  }

  let activity = false;
  const fireActivity = () => {
    if (activity) return;
    activity = true;
    onActivity();
  };

  // The tug-of-war: AI (left, navy) vs the human professional (right, amber).
  const splitFor = (task) => ({
    left: { label: 'Asked AI instead', pct: task.pct },
    right: { label: HUMAN_FOR[task.id], pct: 100 - task.pct },
  });

  const first = stakes[0];
  const tug = tugOfWar(strip, {
    ...splitFor(first),
    accent: 'navy',
    ariaLabel: 'Share who used AI instead of a human professional',
  });

  const describe = (task) =>
    `${task.pct.toFixed(0)}% turned to AI for ${task.label.toLowerCase()} ` +
    `instead of ${HUMAN_FOR[task.id].toLowerCase()}.`;

  readout.textContent = describe(first);

  // Square pill picker — single-select, arrow-key navigable (keyboard path).
  const control = pillGroup(picker, {
    options: stakes.map((t) => ({ value: t.id, label: PILL_LABEL[t.id] || t.label })),
    value: first.id,
    ariaLabel: 'Choose a high-stakes profession',
    onChange: (value) => {
      const task = stakes.find((t) => t.id === value);
      if (!task) return;
      tug.update(splitFor(task));
      readout.textContent = describe(task);
      fireActivity();
    },
  });

  return {
    destroy() {
      control.el?.remove();
      tug.el?.remove();
    },
  };
};

/* ─────────────────────────────── init ──────────────────────────────────── */

export default function init(rootEl, data) {
  const picker = rootEl.querySelector('[data-twist-ai-picker]');
  const strip = rootEl.querySelector('[data-twist-ai-strip]');
  const readout = rootEl.querySelector('[data-twist-ai-readout]');
  const tasks = data?.survey?.aiTasks?.items ?? null;
  const journey = data?.journey ?? null;

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  let stripCtrl = null;
  if (picker && strip && readout && tasks) {
    stripCtrl = buildStrip({ picker, strip, readout }, tasks, unlock);
    if (journey) journey.gate();
  } else if (strip) {
    // Fail soft: no verified data — render the empty state, never trap anyone.
    stripCtrl = buildStrip({ picker, strip, readout }, [], () => {});
  }

  observeReveals(rootEl);

  // Re-assemble headlines (and re-count the numbers) on every arrival.
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  // Teardown handle (steps stay mounted; expose for safety).
  rootEl._twistAiCleanup = () => {
    if (stripCtrl) stripCtrl.destroy();
  };
}
