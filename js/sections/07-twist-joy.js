/**
 * Chapter 07 — Twist two: PROTECTED JOY (the lipstick effect).
 *
 * THE ONE MEMORABLE THING: a single lever, "Tighten the budget". As the
 * visitor drags it from Comfortable to Tight, every flexible spend line is
 * cut in turn, in order of vulnerability (least-protected goes first). They
 * shrink, grey, and get a CUT stamp. The HOLIDAY line refuses: it never cuts,
 * it locks, it glows ring-fenced, and a shield holds. By the time the lever
 * is fully tight, everything else is gone and the holiday alone stands.
 * The mechanic IS the message: everything else goes, the holiday holds.
 * 40% (Q5 holidays 39.6%) ring-fence it at all costs.
 *
 * The lever is a real <input type="range">: drag, click, or arrow-key it, so
 * it is keyboard operable and screen-reader labelled out of the box. A live
 * readout reports how much has been cut versus held. Moving the lever at all,
 * or seeing the holiday hold, clears the advisory gate hint.
 * Reduced-motion safe: line state changes snap (CSS transitions are removed),
 * the lever still drives the same cut/hold logic.
 *
 * @param {HTMLElement} rootEl  <section class="journey-step" id="07-twist-joy">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { observeReveals } from '../lib/reveal.js';
import { arrival } from '../lib/experiential.js';

/** The protected line — the one that never cuts. */
const PROTECTED_ID = 'holidays';

/** Flexible spends shown alongside the holiday (a subset of Q5, chosen for
 *  spread and recognisability). The holiday is added automatically. */
const FLEXIBLE_IDS = ['streaming', 'hobbies', 'beauty', 'gym', 'pub', 'fashion'];

/** Lever value (0..100) at which the FIRST flexible line cuts. Below this,
 *  nothing is cut yet, so an early nudge still reads as "comfortable". */
const FIRST_CUT_AT = 12;
/** Lever value by which ALL flexible lines are cut. The last stretch (above
 *  this) is the payoff: only the holiday remains. */
const LAST_CUT_AT = 88;

/** Build a quick id->item map from verified survey data. */
const indexItems = (items) =>
  items.reduce((acc, it) => ({ ...acc, [it.id]: it }), {});

/**
 * Order the flexible lines by vulnerability: least-protected cut first.
 * Returns the ordered item list (does not include the holiday).
 * @param {Record<string, {id:string,label:string,pct:number}>} byId
 * @returns {Array<{id:string,label:string,pct:number}>}
 */
const orderByVulnerability = (byId) =>
  FLEXIBLE_IDS
    .filter((id) => byId[id])
    .map((id) => byId[id])
    .sort((a, b) => a.pct - b.pct); // lowest protection first => cut first

/**
 * Assign each flexible line a lever threshold, spread evenly between the
 * first- and last-cut marks. The lever crossing a line's threshold cuts it.
 * @param {Array<{id:string}>} ordered  vulnerability-ordered flexible lines
 * @returns {Map<string, number>}  id -> threshold (0..100)
 */
const cutThresholds = (ordered) => {
  const map = new Map();
  const span = LAST_CUT_AT - FIRST_CUT_AT;
  const step = ordered.length > 1 ? span / (ordered.length - 1) : 0;
  ordered.forEach((item, i) => {
    map.set(item.id, Math.round(FIRST_CUT_AT + step * i));
  });
  return map;
};

/** Render the holiday row markup (the protected line). */
const protectedRowHtml = (item) => `
  <li class="twist-joy-row is-protected" data-row="${item.id}" data-protected="true">
    <span class="twist-joy-row-shield" aria-hidden="true">
      <svg viewBox="0 0 24 28" width="16" height="18" focusable="false">
        <path d="M12 1 22 5v9c0 7-5 11-10 13C7 25 2 21 2 14V5z"
              fill="none" stroke="currentColor" stroke-width="2"
              stroke-linejoin="round"/>
        <path d="M8 14l3 3 5-6" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </span>
    <span class="twist-joy-row-label">${item.label}</span>
    <span class="twist-joy-row-pct num">${item.pct.toFixed(0)}%</span>
    <span class="twist-joy-row-tag">ring-fenced</span>
  </li>`;

/** Render a flexible row's markup (a cuttable line). */
const flexibleRowHtml = (item) => `
  <li class="twist-joy-row is-flexible" data-row="${item.id}" data-protected="false">
    <span class="twist-joy-row-label">${item.label}</span>
    <span class="twist-joy-row-pct num">${item.pct.toFixed(0)}%</span>
    <span class="twist-joy-row-tag twist-joy-row-tag--cut" aria-hidden="true">cut</span>
  </li>`;

/**
 * Build the budget lines and wire the single lever.
 * @param {HTMLElement} mount        container for the rows
 * @param {HTMLInputElement} lever   the range input
 * @param {HTMLElement} readoutEl    live readout element
 * @param {Array} spendItems         verified Q5 items
 * @param {() => void} onActivity    fires once when the visitor engages
 * @returns {{ destroy: () => void }}
 */
const buildBudget = (mount, lever, readoutEl, spendItems, onActivity) => {
  const byId = indexItems(spendItems);
  const holiday = byId[PROTECTED_ID];
  const flexible = orderByVulnerability(byId);

  if (!holiday || flexible.length === 0) {
    mount.innerHTML =
      '<p class="twist-joy-empty">Protected-spend data unavailable.</p>';
    if (lever) lever.disabled = true;
    return { destroy() {} };
  }

  const thresholds = cutThresholds(flexible);
  const totalFlexible = flexible.length;

  // Holiday sits at the TOP so the eye lands on the line that holds.
  mount.innerHTML = `<ul class="twist-joy-rows" role="list">
    ${protectedRowHtml(holiday)}
    ${flexible.map(flexibleRowHtml).join('')}
  </ul>`;

  const rowEls = new Map();
  flexible.forEach((item) => {
    rowEls.set(item.id, mount.querySelector(`[data-row="${item.id}"]`));
  });
  const holidayRow = mount.querySelector(`[data-row="${PROTECTED_ID}"]`);

  let activityFired = false;
  const fireActivity = () => {
    if (activityFired) return;
    activityFired = true;
    onActivity();
  };

  /** Apply the current lever value to every line + the readout. */
  const apply = (value) => {
    let cutCount = 0;
    flexible.forEach((item) => {
      const isCut = value >= thresholds.get(item.id);
      if (isCut) cutCount += 1;
      const row = rowEls.get(item.id);
      if (row) row.classList.toggle('is-cut', isCut);
    });

    // The holiday locks the moment any tightening begins, and stays locked.
    const anyTightening = value > 0;
    holidayRow.classList.toggle('is-locked', anyTightening);

    setReadout(cutCount, totalFlexible, value);
  };

  /** Update the live readout copy from the cut count. */
  const setReadout = (cutCount, total, value) => {
    if (!readoutEl) return;
    let text;
    if (value === 0) {
      text = 'Nothing cut yet. Tighten the budget and watch what survives.';
    } else if (cutCount === 0) {
      text = 'Belt tightening starts. The holiday is already locked.';
    } else if (cutCount < total) {
      text = `${cutCount} of ${total} flexible spends cut. The holiday holds.`;
    } else {
      text = 'Everything else is gone. The holiday is the one thing protected.';
    }
    readoutEl.textContent = text;
  };

  const onInput = () => {
    fireActivity();
    apply(Number(lever.value));
  };

  lever.addEventListener('input', onInput);

  // Initial paint at the lever's current value (handles non-zero restores).
  apply(Number(lever.value));

  return {
    destroy() {
      lever.removeEventListener('input', onInput);
    },
  };
};

/* ────────────────────────────────────────────────────────────────────── */

export default function init(rootEl, data) {
  const mount = rootEl.querySelector('[data-twist-joy-budget]');
  const lever = rootEl.querySelector('[data-twist-joy-lever]');
  const readoutEl = rootEl.querySelector('[data-twist-joy-readout]');
  const spendItems = data?.survey?.protectedSpend?.items ?? null;
  const journey = data?.journey ?? null;

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  if (mount && lever && spendItems) {
    buildBudget(mount, lever, readoutEl, spendItems, unlock);
    if (journey) journey.gate();
  } else if (mount) {
    buildBudget(mount, lever, readoutEl, [], () => {});
  }

  observeReveals(rootEl);

  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));
}
