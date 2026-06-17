/**
 * Chapter 07 — Twist two: PROTECTED JOY.
 *
 * THE ONE MEMORABLE THING: a household budget under the knife. The visitor
 * drags each spend line LEFT, toward the bin gutter, to cut it. The flexible
 * "nice-to-haves" slide and STAY cut (tactile spring:'settle'). The holiday
 * RESISTS — it springs back to its place every time it is released
 * (spring:'return' with a weighty bounce), because 40% of Britain actively
 * ring-fence it (Q5 holidays 39.6%). Data as a felt reality, not a chart.
 *
 * Every spend's verified Q5 protection % reads inline at its row. The one
 * marquee beat is advisory-gated (journey.gate()/ready()): cutting any line, or
 * feeling the holiday spring back, clears the hint. Fully keyboard operable
 * (each handle is focusable; arrows drag, Enter/Space grab) and reduced-motion
 * safe (cuts snap; the holiday still refuses to move). The "you" dot anchors on
 * the holiday — the thing that won't be cut.
 *
 * Contract: docs/CONTRACT.md. Every CSS selector scoped to #\30 7-twist-joy.
 * Verified values: data/survey.json protectedSpend (Q5).
 *
 * @param {HTMLElement} rootEl  the <section class="journey-stage" id="07-twist-joy">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { draggable } from '../lib/tactile.js';
import { arrival, prefersReducedMotion } from '../lib/experiential.js';

/** Distance (px) a flexible line must be dragged left to count as "cut". */
const CUT_THRESHOLD = 96;
/** The handle reaches this far left when fully cut. */
const CUT_TRAVEL = 150;

/**
 * The four lines on the chopping block, in protection order (most-defended
 * last so the eye lands on the holiday). The holiday is the protected one.
 * Each id maps to a protectedSpend item; pct reads inline and is verified.
 */
const BUDGET_LINES = [
  { id: 'streaming', protected: false },
  { id: 'hobbies', protected: false },
  { id: 'beauty', protected: false },
  { id: 'holidays', protected: true },
];

/** Build a quick id -> protectedSpend item map from verified survey data. */
const indexSpend = (items) =>
  items.reduce((acc, it) => {
    acc[it.id] = it;
    return acc;
  }, {});

/**
 * Build the tactile budget. Calls onActivity() the first time the visitor cuts
 * a line or feels the holiday spring back (advisory gate clear). Returns
 * { destroy }.
 */
const buildBudget = (mount, spendItems, onActivity) => {
  const byId = indexSpend(spendItems);
  // Fail soft: if the verified data is missing, say so and don't trap anyone.
  const lines = BUDGET_LINES.filter((l) => byId[l.id]);
  if (lines.length === 0) {
    mount.innerHTML = '<p class="twist-joy-empty">Protected-spend data is not available.</p>';
    return { destroy() {} };
  }

  const reduced = prefersReducedMotion();
  const drags = [];
  let activity = false;

  const fireActivity = () => {
    if (activity) return;
    activity = true;
    onActivity();
  };

  mount.innerHTML = `
    <ul class="twist-joy-rows" role="list">
      ${lines
        .map((l) => {
          const item = byId[l.id];
          const role = l.protected ? 'protected' : 'flexible';
          return `
        <li class="twist-joy-row" data-row="${l.id}" data-role="${role}">
          <span class="twist-joy-bin" aria-hidden="true">
            <span class="twist-joy-bin-mark">cut</span>
          </span>
          <span class="twist-joy-handle" data-handle="${l.id}"
                role="button"
                aria-label="${item.label}: drag left to cut">
            <span class="twist-joy-grip" aria-hidden="true"></span>
            <span class="twist-joy-row-label">${item.label}</span>
            <span class="twist-joy-row-meta">
              <span class="twist-joy-row-pct num">${item.pct.toFixed(0)}%</span>
              <span class="twist-joy-row-sub">${l.protected ? 'ring-fence it' : 'protect it'}</span>
            </span>
          </span>
        </li>`;
        })
        .join('')}
    </ul>
    <p class="twist-joy-hint" data-twist-joy-hint aria-live="polite">
      Drag a line left to cut it
    </p>`;

  const hint = mount.querySelector('[data-twist-joy-hint]');

  lines.forEach((l) => {
    const row = mount.querySelector(`.twist-joy-row[data-row="${l.id}"]`);
    const handle = row.querySelector(`[data-handle="${l.id}"]`);
    if (l.id === 'holidays') row.setAttribute('data-youdot-anchor', '');

    // Visual progress 0..1 of how far this line has been pulled toward the bin.
    const apply = (x) => {
      const t = Math.min(1, Math.max(0, -x / CUT_TRAVEL));
      row.style.setProperty('--cut', t.toFixed(3));
    };

    const ctrl = draggable(handle, {
      axis: 'x',
      // Only ever travels LEFT toward the bin; never past the right edge.
      bounds: { minX: -CUT_TRAVEL, maxX: 0 },
      // The holiday SPRINGS BACK (return) with a weighty bounce — it refuses to
      // stay cut. The flexible spends SETTLE where released — they stay cut.
      spring: l.protected ? 'return' : 'settle',
      springOpts: l.protected
        ? { stiffness: 220, bounce: 0.34 }
        : { stiffness: 200 },
      keyboardStep: 30,
      onMove: ({ x }) => apply(x),
      onRelease: ({ x }) => {
        if (l.protected) {
          // It snaps back: the resistance is the message.
          row.classList.add('is-resisting');
          if (hint) hint.textContent = 'The holiday won’t budge — two in five defend it.';
          fireActivity();
        } else if (-x >= CUT_THRESHOLD) {
          row.classList.add('is-cut');
          if (hint) hint.textContent = 'Gone — the flexible spends fold first.';
          fireActivity();
        } else {
          row.classList.remove('is-cut');
        }
      },
      onSettle: () => {
        if (l.protected) {
          row.classList.remove('is-resisting');
          apply(0);
        }
      },
    });
    drags.push(ctrl);
  });

  // Reduced motion: the holiday still refuses to move (bounds + return spring
  // already enforce this with no overshoot); flexible cuts snap instantly. The
  // draggable lib jump-cuts springs under reduced motion, so behaviour holds.
  if (reduced && hint) {
    hint.textContent = 'Try cutting a line — the holiday holds firm.';
  }

  return {
    destroy() {
      drags.forEach((d) => d.destroy());
    },
  };
};

/* ─────────────────────────────── init ──────────────────────────────────── */

export default function init(rootEl, data) {
  const mount = rootEl.querySelector('[data-twist-joy-budget]');
  const spendItems = data?.survey?.protectedSpend?.items ?? null;
  const journey = data?.journey ?? null;

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  let budget = null;
  if (mount && spendItems) {
    budget = buildBudget(mount, spendItems, unlock);
    if (journey) journey.gate();
  } else if (mount) {
    // Fail soft: no verified data — render the empty state, never trap anyone.
    budget = buildBudget(mount, [], () => {});
  }

  observeReveals(rootEl);

  // Re-assemble headlines on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  // Teardown handle (steps stay mounted; expose for safety).
  rootEl._twistJoyCleanup = () => {
    if (budget) budget.destroy();
  };
}
