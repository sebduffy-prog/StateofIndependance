/**
 * Chapter 08 — Twist three: AI ON TAP.
 *
 * Left: eyebrow → scramble-reveal title → WLV standfirst → two DISTINCT
 * headline stats (58% any task / 37% high-stakes — never conflated).
 * Right: the full Q11 AI tasks ranked dot-list + a human-vs-AI tug-of-war
 * across the three high-stakes professions (finance / health / legal).
 *
 * THE MARQUEE: pick a high-stakes profession (pillGroup, arrow-key nav);
 * the tug-of-war divider springs to the true Q11 split. Gate clears on
 * first profession switch.
 *
 * Data: data/survey.json aiTasks. Verified Q11 values.
 *   any task: 58.4%  high-stakes: 37.4%
 *   health 24.7  financial 19.7  legal 9.4
 *   education 21.2  creative 20.8  technical 18.8  career 15.2
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="08-twist-ai">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';
import { tugOfWar } from '../lib/charts.js';
import { pillGroup } from '../lib/interactions.js';

/** Human professional label for each high-stakes task id. */
const HUMAN_FOR = {
  financial: 'A financial adviser',
  health:    'A doctor or nurse',
  legal:     'A solicitor',
};

/** Short pill labels for the high-stakes picker. */
const PILL_LABEL = {
  financial: 'Finance',
  health:    'Health',
  legal:     'Legal',
};

/**
 * Render the full Q11 tasks as a compact ranked list: task label + navy bar
 * + pct value. High-stakes items marked with a yellow accent. Backgroundless.
 */
const buildTaskList = (container, tasks) => {
  if (!container || !tasks?.length) return;
  const max = Math.max(...tasks.map((t) => t.pct));
  const ol = document.createElement('ol');
  ol.className = 'twist-ai-task-list';
  ol.setAttribute('aria-label', 'AI task usage rates');

  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'twist-ai-task-item' + (task.isHighStakes ? ' is-high-stakes' : '');

    const labelEl = document.createElement('span');
    labelEl.className = 'twist-ai-task-label';
    labelEl.textContent = task.label;

    const trackEl = document.createElement('span');
    trackEl.className = 'twist-ai-task-track';
    const fillEl = document.createElement('span');
    fillEl.className = 'twist-ai-task-fill';
    const widthPct = Math.round((task.pct / max) * 100);
    // Set inline; will animate via CSS transition on first paint
    fillEl.style.setProperty('--task-w', `${widthPct}%`);
    trackEl.append(fillEl);

    const valEl = document.createElement('span');
    valEl.className = 'twist-ai-task-val num';
    valEl.textContent = `${Math.round(task.pct)}%`;

    li.append(labelEl, trackEl, valEl);
    ol.append(li);
  });
  container.append(ol);
};

/**
 * Build the tug-of-war substitution strip across the three high-stakes
 * professions. Calls onActivity() on first profession switch.
 */
const buildStrip = (els, tasks, onActivity) => {
  const { picker, strip, readout } = els;

  const stakes = tasks
    .filter((t) => t.isHighStakes && HUMAN_FOR[t.id])
    .sort((a, b) => b.pct - a.pct);

  if (!stakes.length) {
    if (strip) {
      const p = document.createElement('p');
      p.className = 'twist-ai-empty';
      p.textContent = 'High-stakes data unavailable.';
      strip.append(p);
    }
    return { destroy() {} };
  }

  let fired = false;
  const fireOnce = () => { if (!fired) { fired = true; onActivity(); } };

  const splitFor = (task) => ({
    left:  { label: 'Asked AI instead', pct: task.pct },
    right: { label: HUMAN_FOR[task.id],  pct: 100 - task.pct },
  });

  const first = stakes[0];
  const tug = tugOfWar(strip, {
    ...splitFor(first),
    accent: 'navy',
    ariaLabel: 'Share using AI vs human professional',
  });

  const describe = (task) =>
    `${Math.round(task.pct)}% used AI for ${task.label.toLowerCase()} ` +
    `instead of ${HUMAN_FOR[task.id].toLowerCase()}.`;

  if (readout) readout.textContent = describe(first);

  const control = pillGroup(picker, {
    options: stakes.map((t) => ({ value: t.id, label: PILL_LABEL[t.id] || t.label })),
    value: first.id,
    ariaLabel: 'Choose a high-stakes profession',
    onChange: (value) => {
      const task = stakes.find((t) => t.id === value);
      if (!task) return;
      tug.update(splitFor(task));
      if (readout) readout.textContent = describe(task);
      fireOnce();
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
  const tasks   = data?.survey?.aiTasks?.items ?? null;
  const journey = data?.journey ?? null;

  // Build the full tasks list (all seven Q11 items).
  const tasksContainer = rootEl.querySelector('[data-twist-ai-tasks]');
  if (tasksContainer && tasks) {
    buildTaskList(tasksContainer, tasks);
  }

  // Build the high-stakes tug-of-war.
  const picker  = rootEl.querySelector('[data-twist-ai-picker]');
  const strip   = rootEl.querySelector('[data-twist-ai-strip]');
  const readout = rootEl.querySelector('[data-twist-ai-readout]');

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
    stripCtrl = buildStrip({ picker, strip, readout }, [], () => {});
  }

  // Re-assemble on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  // Teardown.
  rootEl._twistAiCleanup = () => {
    if (stripCtrl) stripCtrl.destroy();
  };
}
