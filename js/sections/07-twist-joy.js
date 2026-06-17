/**
 * Chapter 07 — Twist two: PROTECTED JOY.
 *
 * THE ONE MEMORABLE THING: a household budget under the knife. The visitor
 * taps the scissors button on each spend line to "cut" it. Flexible
 * nice-to-haves stay cut (they crumple away). The holiday REFUSES — it
 * springs back to its place every time, because 40% of Britain ring-fences
 * it (Q5 holidays 39.6%). The resistance is the message.
 *
 * Each spend row shows its verified Q5 protection %. Cutting any line, or
 * feeling the holiday spring back, clears the advisory gate hint.
 * Keyboard operable: Enter/Space on the scissors button cuts (or tries to).
 * Reduced-motion safe: cuts snap; the holiday still refuses to move.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="07-twist-joy">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { arrival, prefersReducedMotion } from '../lib/experiential.js';

/** Items to display (a subset of Q5 — chosen for variety and story arc).
 *  Order: flexible spends first, holiday last so the eye lands on the protected one. */
const DISPLAY_IDS = ['streaming', 'hobbies', 'beauty', 'holidays'];

/** Map id → protected (true = springs back) */
const PROTECTED = { holidays: true };

/** Duration of the spring-back "refuse" animation (ms) — for CSS class timing */
const RESIST_DURATION_MS = 750;

/** Build a quick id→item map from verified survey data. */
const indexItems = (items) =>
  items.reduce((acc, it) => ({ ...acc, [it.id]: it }), {});

/**
 * Build the tactile budget rows.
 * Returns { destroy }.
 */
const buildBudget = (mount, spendItems, hintEl, onActivity) => {
  const byId = indexItems(spendItems);
  const lines = DISPLAY_IDS.filter((id) => byId[id]);

  if (lines.length === 0) {
    mount.innerHTML =
      '<p class="twist-joy-empty">Protected-spend data unavailable.</p>';
    return { destroy() {} };
  }

  const reduced = prefersReducedMotion();
  let activityFired = false;
  const fireActivity = () => {
    if (activityFired) return;
    activityFired = true;
    onActivity();
  };

  // Build the row list
  mount.innerHTML = `<ul class="twist-joy-rows" role="list">
    ${lines.map((id) => {
      const item = byId[id];
      const isProtected = !!PROTECTED[id];
      const btnLabel = isProtected
        ? `Try to cut ${item.label}: it won't stay cut`
        : `Cut ${item.label}`;
      return `
      <li class="twist-joy-row${isProtected ? ' is-protected' : ''}"
          data-row="${id}" data-protected="${isProtected}">
        <div class="twist-joy-row-inner">
          <span class="twist-joy-row-label">${item.label}</span>
          <span class="twist-joy-row-pct num">${item.pct.toFixed(0)}%</span>
          <span class="twist-joy-row-meta">${isProtected ? 'ring-fenced' : 'protect it'}</span>
          <button class="twist-joy-cut-btn"
                  aria-label="${btnLabel}"
                  aria-pressed="false">
            <span class="twist-joy-scissors" aria-hidden="true">✂</span>
          </button>
        </div>
        <span class="twist-joy-cut-banner" aria-hidden="true">CUT</span>
        ${isProtected ? '<span class="twist-joy-shield" aria-hidden="true"></span>' : ''}
      </li>`;
    }).join('')}
  </ul>`;

  // Wire each cut button
  lines.forEach((id) => {
    const row = mount.querySelector(`[data-row="${id}"]`);
    const btn = row.querySelector('.twist-joy-cut-btn');
    const isProtected = !!PROTECTED[id];

    // You-dot: not anchored to any row on this step; the interactive
    // stage is too busy. The dot hides when no anchor is present.

    btn.addEventListener('click', () => {
      if (isProtected) {
        // Refuse: spring-back animation
        if (row.classList.contains('is-refusing')) return; // debounce
        row.classList.add('is-refusing');
        if (hintEl) hintEl.textContent = "The holiday won't budge. 2 in 5 defend it.";
        fireActivity();
        if (!reduced) {
          setTimeout(() => row.classList.remove('is-refusing'), RESIST_DURATION_MS);
        } else {
          row.classList.remove('is-refusing');
        }
      } else {
        // Toggle cut state
        const wasCut = row.classList.contains('is-cut');
        if (wasCut) {
          row.classList.remove('is-cut');
          btn.setAttribute('aria-pressed', 'false');
          btn.setAttribute('aria-label', `Cut ${byId[id].label}`);
        } else {
          row.classList.add('is-cut');
          btn.setAttribute('aria-pressed', 'true');
          btn.setAttribute('aria-label', `Restore ${byId[id].label}`);
          if (hintEl) hintEl.textContent = 'Gone. The flexible spends fold first.';
          fireActivity();
        }
      }
    });
  });

  return { destroy() {} };
};

/* ────────────────────────────────────────────────────────────────────── */

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

  const hintEl = rootEl.querySelector('[data-twist-joy-hint]');

  if (mount && spendItems) {
    buildBudget(mount, spendItems, hintEl, unlock);
    if (journey) journey.gate();
  } else if (mount) {
    buildBudget(mount, [], hintEl, () => {});
  }

  observeReveals(rootEl);

  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));
}
