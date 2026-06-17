/**
 * Chapter 07 — moves. The FIVE-MOVE FILMSTRIP plus the TOOLKIT close.
 *
 * Filmstrip: five full-bleed frames (warm/navy alternating) each carrying a
 * deck bear-world motif, the lesson/beats/quotes/ad-mockup evidence, and a
 * Less→More flip table (shared flipReveal helper) — the strategy CONSTRUCTS
 * itself frame by frame. A per-frame "Frame 0n of 05" sprocket lockup and a
 * staged row reveal give the reel its cadence.
 *
 * Toolkit (the marquee interaction, "hand them the tools"): the five moves
 * become physical tool-objects on a pegboard. The visitor picks each one up
 * (tactile.js draggable — real weight, lift shadow, spring) and passes it
 * across to the open hand/tray; it settles as "handed over" and the count-up
 * ticks. Handing over ALL FIVE completes the step and unlocks Next. Fully
 * keyboard-operable: focus a tool, Enter/Space to grab, arrows to carry, then
 * Enter/Space again — or simply Enter on a tool hands it straight over.
 *
 * Experiential motion (experiential.js): chapterTransition eases each frame up
 * + in; observeParallax drifts the bear-world panels + evidence; scrollScene
 * stages each shift card's rows in sequence; arrival() assembles the hero and
 * toolkit copy and counts the handover up. All reduced-motion safe — drags
 * still work but snap to final state.
 *
 * No fabricated numbers — every stat/quote/shift/title is verbatim from STORY.md.
 *
 * Contract: docs/CONTRACT.md.
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { flipReveal } from '../lib/interactions.js';
import {
  chapterTransition,
  observeParallax,
  scrollScene,
  arrival,
  prefersReducedMotion,
} from '../lib/experiential.js';
import { draggable } from '../lib/tactile.js';

const FROM_TO_LABELS = ['Dependence', 'Agency'];
const TOTAL_TOOLS = 5;
// How close (px) a dropped tool must land to the tray to count as handed over.
const HANDOVER_RADIUS = 150;
// A short pop on the running count each time a tool lands (class toggled off
// next frame so the CSS keyframe can re-trigger). Pure transform/opacity.
const COUNT_POP_MS = 420;

/** The five moves' less -> more rows, verbatim from STORY.md ch.07. */
const FLIP_ROWS_BY_MOVE = {
  1: [
    { less: 'Escalating charges', more: 'Hacking the system' },
    { less: 'Prison', more: 'Hotel' },
    { less: 'Reinforcing unfair', more: 'Fighting for change' },
  ],
  2: [
    { less: 'Treating pain', more: 'Diagnosing the problem' },
    { less: 'Lipstick on a pig', more: 'Backing it up' },
    { less: 'Opaque', more: 'Transparent' },
  ],
  3: [
    { less: 'Dependency', more: 'Independency' },
    { less: 'Dictation from the brand', more: 'Walk throughs on YT & TikTok' },
    { less: 'Broadcast to audiences', more: 'Self-help contexts' },
  ],
  4: [
    { less: 'Status as currency', more: 'Time as currency' },
    { less: 'Fragmentation', more: 'Ecosystems' },
    { less: 'Customer support', more: 'Life advisory' },
  ],
  5: [
    { less: 'Setting tasks', more: 'Gamifying goals' },
    { less: 'CRM modules', more: 'Habit forming' },
    { less: 'Random rewards', more: 'Meaningful rewards' },
  ],
};

/**
 * Mount one flip table into its frame's placeholder.
 * @param {HTMLElement} rootEl
 * @param {number} moveNumber
 * @returns {HTMLButtonElement[]} the flip-row buttons (for staged reveal)
 */
const mountFlipTable = (rootEl, moveNumber) => {
  const container = rootEl.querySelector(`[data-flip-${moveNumber}]`);
  if (!container) return [];
  const rows = FLIP_ROWS_BY_MOVE[moveNumber];
  if (!rows) return [];
  flipReveal(container, { rows, fromToLabels: FROM_TO_LABELS });
  return Array.from(container.querySelectorAll('.flip-row'));
};

/**
 * Stagger the flip-card rows into view as the frame scrolls through, so the
 * shift reads as a build rather than a static list. Pure class toggle; CSS
 * owns the at-rest + revealed visuals, so this never clips or reflows text.
 * @param {HTMLElement} bandEl
 * @param {HTMLButtonElement[]} rows
 * @returns {() => void} cleanup
 */
const stageShiftRows = (bandEl, rows) => {
  if (!rows.length) return () => {};
  const steps = rows.map((row, i) => ({
    at: 0.22 + i * 0.1,
    onEnter: () => row.classList.add('is-shown'),
    onLeave: () => row.classList.remove('is-shown'),
  }));
  return scrollScene(bandEl, steps);
};

/**
 * Build one draggable tool-object from a template <li>.
 * @param {HTMLElement} sourceLi  - template entry (data-tool, data-label, svg)
 * @returns {HTMLLIElement}
 */
const buildToolEl = (sourceLi) => {
  const num = sourceLi.dataset.tool;
  const label = sourceLi.dataset.label;
  const svg = sourceLi.querySelector('svg');
  const li = document.createElement('li');
  li.className = 'mv-tool';
  li.dataset.tool = num;
  li.setAttribute('role', 'button');
  li.setAttribute(
    'aria-label',
    `${label}. Tool ${num} of ${TOTAL_TOOLS}. Press Enter to hand it over.`,
  );
  // .mv-tool-grip is the physical handle the contact shadow + drag act on.
  li.innerHTML =
    '<span class="mv-tool-grip">' +
    `<span class="mv-tool-no" aria-hidden="true">0${num}</span>` +
    `<span class="mv-tool-icon">${svg ? svg.outerHTML : ''}</span>` +
    '</span>' +
    `<span class="mv-tool-label">${label}</span>`;
  return li;
};

/**
 * Mount the toolkit: five draggable tools that hand over to the tray.
 * Handing over all five fires onComplete() (the gate's ready()).
 * @param {HTMLElement} rootEl
 * @param {() => void} onComplete
 * @returns {() => void} cleanup
 */
const mountToolkit = (rootEl, onComplete) => {
  const stage = rootEl.querySelector('.mv-toolkit-stage');
  const pegboard = rootEl.querySelector('.mv-pegboard');
  const tray = rootEl.querySelector('.mv-tray');
  const tally = rootEl.querySelector('.mv-tray-tally');
  const template = rootEl.querySelector('.mv-tool-source');
  const countEl = rootEl.querySelector('.mv-toolkit-count');
  if (!stage || !pegboard || !tray || !template) return () => {};

  const reduced = prefersReducedMotion();
  const sources = Array.from(template.content.querySelectorAll('li'));
  const tools = []; // { el, handle }
  let handed = 0;
  let popTimer = 0;

  // The running count gets a brief pop each time a tool lands, so the number
  // is felt rather than silently swapped. CSS owns the keyframe.
  const popCount = () => {
    if (!countEl || reduced) return;
    countEl.classList.remove('is-pop');
    // restart the animation on the next frame
    requestAnimationFrame(() => {
      countEl.classList.add('is-pop');
      clearTimeout(popTimer);
      popTimer = window.setTimeout(
        () => countEl.classList.remove('is-pop'),
        COUNT_POP_MS,
      );
    });
  };

  const updateCount = () => {
    if (countEl) countEl.textContent = String(handed);
    if (tally) {
      // light a tally pip for each tool delivered (built once, lit on landing)
      const pips = tally.querySelectorAll('.mv-tray-pip');
      pips.forEach((pip, i) => pip.classList.toggle('is-lit', i < handed));
    }
    const complete = handed >= TOTAL_TOOLS;
    rootEl.classList.toggle('is-toolkit-complete', complete);
  };

  const handOver = (toolEl) => {
    if (toolEl.classList.contains('is-handed')) return;
    toolEl.classList.add('is-handed');
    toolEl.setAttribute('aria-disabled', 'true');
    const label = toolEl.querySelector('.mv-tool-label');
    if (label) {
      const base = label.textContent;
      label.dataset.base = base;
      toolEl.setAttribute('aria-label', `${base}. Handed over.`);
    }
    handed += 1;
    updateCount();
    popCount();
    if (handed >= TOTAL_TOOLS) onComplete();
  };

  // Hand a tool over with a brief physical "delivery" arc to the tray, then
  // settle it back into its pegboard slot as a ghosted/ticked tool. The flight
  // gives the hand-over weight (contact shadow + amber glow), while returning
  // it to its own slot keeps the pegboard a clean grid — five tools never stack
  // and overlap in the tray. The tray tells the running tally via its pips.
  // Under reduced motion this is an instant commit (no travel).
  const deliver = (tool) => {
    if (tool.el.classList.contains('is-handed')) return;
    if (reduced) {
      handOver(tool.el);
      return;
    }
    tool.el.classList.add('is-delivering');
    const t = tool.el.getBoundingClientRect();
    const r = tray.getBoundingClientRect();
    // vector from the tool's current centre to the tray's centre
    const dx = r.left + r.width / 2 - (t.left + t.width / 2);
    const dy = r.top + r.height / 2 - (t.top + t.height / 2);
    tool.handle.setPosition(dx, dy, { animate: true });
    // at the tray (spring ≈ 320ms) commit it, then settle it home into its
    // own slot so the pegboard stays an orderly, non-overlapping grid.
    window.setTimeout(() => {
      tool.el.classList.remove('is-delivering');
      handOver(tool.el);
      tool.handle.setPosition(0, 0, { animate: true });
    }, 320);
  };

  // Is the tool's centre near the tray? (drop hit-test, in viewport coords)
  const isOverTray = (toolEl) => {
    const t = toolEl.getBoundingClientRect();
    const r = tray.getBoundingClientRect();
    const cx = t.left + t.width / 2;
    const cy = t.top + t.height / 2;
    const nx = Math.max(r.left, Math.min(cx, r.right));
    const ny = Math.max(r.top, Math.min(cy, r.bottom));
    return Math.hypot(cx - nx, cy - ny) < HANDOVER_RADIUS;
  };

  // Build the tray tally pips (one per tool) once.
  if (tally) {
    for (let i = 0; i < TOTAL_TOOLS; i += 1) {
      const pip = document.createElement('span');
      pip.className = 'mv-tray-pip';
      tally.append(pip);
    }
  }

  sources.forEach((sourceLi) => {
    const toolEl = buildToolEl(sourceLi);
    pegboard.append(toolEl);

    // Track whether the most recent release came from a real pointer drag, so
    // arrow-key nudges (which also fire onRelease) never yank the tool home
    // mid-carry. A short pointer drop returns home; a keyboard carry just rests
    // where the arrows left it (and delivers if it reaches the tray).
    let wasPointerDrag = false;
    toolEl.addEventListener('pointerdown', () => { wasPointerDrag = true; });

    const tool = { el: toolEl, handle: null };
    // spring:false => the lib never moves the tool on release; WE decide where
    // it goes (fly into the tray, or spring back to the pegboard) so the
    // delivery flight is never interrupted by the library's own return spring.
    tool.handle = draggable(toolEl, {
      spring: false,
      momentum: 0,
      keyboardStep: 36,
      springOpts: { stiffness: 200 },
      onRelease: () => {
        if (toolEl.classList.contains('is-handed')) return;
        if (isOverTray(toolEl)) {
          deliver(tool); // reached the tray (drag or keyboard): fly it in
        } else if (wasPointerDrag) {
          tool.handle.setPosition(0, 0, { animate: true }); // short drop: home
        }
        wasPointerDrag = false;
      },
    });
    tools.push(tool);

    // Discovery-friendly keyboard shortcut: Enter on the tool hands it over
    // straight away — it flies into the tray (the simple path for keyboard
    // users who don't want to carry it across with the arrow keys).
    toolEl.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || toolEl.classList.contains('is-handed')) return;
      e.preventDefault();
      e.stopPropagation(); // don't let the journey engine treat Enter as Next
      deliver(tool);
    });
  });

  updateCount();
  return () => {
    clearTimeout(popTimer);
    tools.forEach((t) => t.handle.destroy());
  };
};

/**
 * @param {HTMLElement} rootEl - the <section class="chapter" id="07-moves"> element
 * @param {{survey: object, segments: object, tgi: object, journey: object}} data
 */
export default function init(rootEl, data) {
  if (!rootEl) return;

  const cleanups = [];

  // GATING: this step's marquee interaction is the TOOLKIT — the visitor must
  // hand over all five tools. ready() fires once the fifth is handed over.
  const journey = data && data.journey;
  if (journey && typeof journey.gate === 'function') journey.gate();
  let unlocked = false;
  const onToolkitComplete = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey && typeof journey.ready === 'function') journey.ready();
  };

  // Filmstrip: mount each frame's flip table and stage its rows on scroll.
  Object.keys(FLIP_ROWS_BY_MOVE).forEach((key) => {
    const moveNumber = Number(key);
    const rows = mountFlipTable(rootEl, moveNumber);
    const band = rootEl.querySelector(`[aria-labelledby="mv-${moveNumber}-title"]`);
    if (band) cleanups.push(stageShiftRows(band, rows));
  });

  // Toolkit close — the gating marquee interaction.
  cleanups.push(mountToolkit(rootEl, onToolkitComplete));

  // Experiential: ease each frame in on scroll, drift the deck world panels.
  const shell = rootEl.querySelector('.mv-shell');
  if (shell) {
    rootEl.querySelectorAll('.mv-move, .mv-hero, .mv-toolkit').forEach((band) => {
      cleanups.push(chapterTransition(band));
    });
    cleanups.push(observeParallax(shell, { maxShiftPx: 56 }));
  }

  observeReveals(rootEl);
  observeCounters(rootEl);

  // Chapter ARRIVAL — assemble the hero + toolkit copy when this step becomes
  // current (main.js fires `chapter:arrive`). Also run once on mount so a
  // direct mount (e.g. tests) still assembles.
  const runArrival = () => arrival(rootEl);
  rootEl.addEventListener('chapter:arrive', runArrival);
  cleanups.push(() => rootEl.removeEventListener('chapter:arrive', runArrival));
  if (prefersReducedMotion()) runArrival();

  return () => cleanups.forEach((fn) => fn && fn());
}
