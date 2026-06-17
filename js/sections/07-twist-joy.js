/**
 * Chapter 07 — Twist two: PROTECTED JOY (the lipstick effect).
 *
 * THE ONE MEMORABLE THING: a field of discretionary-spend tiles the visitor
 * CUTS, one tap at a time. Every cut is unmissable and tactile — the tile slams
 * down, desaturates, takes a CUT stamp, its label strikes through, and the live
 * tally climbs. The big HOLIDAY tile sits apart, ring-fenced: it cannot be cut.
 * Try to cut it and it refuses (it pulses, its yellow seal tightens). As the
 * flexible spends fall away, the holiday brightens and locks. By the time every
 * other line is gone, the holiday alone stands, glowing.
 * The mechanic IS the message: everything else goes, the holiday holds.
 * 40% (Q5 holidays 39.6%) ring-fence it at all costs.
 *
 * Each cuttable tile is a real <button>: click, tap, Enter or Space cut it, so
 * the interaction is keyboard operable and screen-reader labelled out of the
 * box. The holiday tile is also a button that announces it is protected and
 * never cuts. A live readout + tally report progress.
 * Reduced-motion safe: the cut/lock state changes still apply (CSS removes the
 * motion, keeps the legible end state). No console.log.
 *
 * @param {HTMLElement} rootEl  <section class="journey-stage" id="07-twist-joy">
 * @param {{ survey, segments, tgi, journey }} data
 */
import { arrival } from '../lib/experiential.js';

/** The protected line — the one that never cuts. */
const PROTECTED_ID = 'holidays';

/** Cuttable discretionary spends shown alongside the holiday (a subset of Q5,
 *  chosen for spread and recognisability). The holiday is the hero, separate. */
const FLEXIBLE_IDS = ['streaming', 'hobbies', 'beauty', 'gym', 'pub', 'fashion'];

/** A shield-seal SVG (navy body, the holiday's ring-fence mark). */
const SHIELD_SVG = `
  <svg class="twist-joy-seal" viewBox="0 0 48 56" width="48" height="56"
       aria-hidden="true" focusable="false">
    <path class="twist-joy-seal-body"
          d="M24 2 44 10v18c0 14-10 22-20 26C14 50 4 42 4 28V10z"
          fill="none" stroke="currentColor" stroke-width="3"
          stroke-linejoin="round"/>
    <path class="twist-joy-seal-tick" d="M15 28l6 6 12-13"
          fill="none" stroke="currentColor" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

/** A scissors SVG cue, shown on each cuttable tile (the affordance). */
const SCISSORS_SVG = `
  <svg class="twist-joy-scissors" viewBox="0 0 24 24" width="20" height="20"
       aria-hidden="true" focusable="false">
    <circle cx="6" cy="6" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <circle cx="6" cy="18" r="3" fill="none" stroke="currentColor" stroke-width="2"/>
    <path d="M9 8l11 9M9 16l11-9" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round"/>
  </svg>`;

/** Build a quick id->item map from verified survey data. */
const indexItems = (items) =>
  items.reduce((acc, it) => ({ ...acc, [it.id]: it }), {});

/**
 * Order the flexible lines by vulnerability: least-protected first (the most
 * likely to be cut leads the field). Returns the ordered item list.
 * @param {Record<string, {id:string,label:string,pct:number}>} byId
 * @returns {Array<{id:string,label:string,pct:number}>}
 */
const orderByVulnerability = (byId) =>
  FLEXIBLE_IDS
    .filter((id) => byId[id])
    .map((id) => byId[id])
    .sort((a, b) => a.pct - b.pct); // lowest protection first

/** Render the big ring-fenced HOLIDAY hero tile (a button that never cuts). */
const protectedTileHtml = (item) => `
  <button type="button" class="twist-joy-holiday" data-row="${item.id}"
          aria-pressed="false"
          aria-label="${item.label}. Protected. This one is ring-fenced and cannot be cut.">
    <span class="twist-joy-holiday-seal" aria-hidden="true">${SHIELD_SVG}</span>
    <span class="twist-joy-holiday-body">
      <span class="twist-joy-holiday-tag">Ring-fenced</span>
      <span class="twist-joy-holiday-label">${item.label}</span>
      <span class="twist-joy-holiday-pct num">${item.pct.toFixed(0)}%</span>
      <span class="twist-joy-holiday-hold" data-twist-joy-hold aria-hidden="true">Protected</span>
    </span>
  </button>`;

/** Render one cuttable discretionary tile (a button). */
const flexibleTileHtml = (item) => `
  <button type="button" class="twist-joy-tile" data-row="${item.id}"
          aria-pressed="false"
          aria-label="${item.label}. Activate to cut this spending.">
    <span class="twist-joy-tile-cue" aria-hidden="true">${SCISSORS_SVG}</span>
    <span class="twist-joy-tile-label">${item.label}</span>
    <span class="twist-joy-tile-pct num">${item.pct.toFixed(0)}%</span>
    <span class="twist-joy-tile-stamp" aria-hidden="true">Cut</span>
  </button>`;

/**
 * Build the interaction and wire every tile.
 * @param {HTMLElement} fieldEl      container for the cuttable tiles
 * @param {HTMLElement} protectedEl  container for the holiday hero
 * @param {HTMLElement} readoutEl    live readout element
 * @param {HTMLElement} countEl      big tally number on the left
 * @param {HTMLElement} tallyLabelEl tally caption on the left
 * @param {Array} spendItems         verified Q5 items
 * @param {() => void} onActivity    fires once when the visitor cuts the first tile
 * @returns {{ destroy: () => void }}
 */
const buildInteraction = (
  fieldEl, protectedEl, readoutEl, countEl, tallyLabelEl, spendItems, onActivity,
) => {
  const byId = indexItems(spendItems);
  const holiday = byId[PROTECTED_ID];
  const flexible = orderByVulnerability(byId);

  if (!holiday || flexible.length === 0) {
    fieldEl.innerHTML =
      '<p class="twist-joy-empty">Protected-spend data unavailable.</p>';
    return { destroy() {} };
  }

  protectedEl.innerHTML = protectedTileHtml(holiday);
  fieldEl.innerHTML = flexible.map(flexibleTileHtml).join('');

  const holidayBtn = protectedEl.querySelector('[data-row]');
  const tileBtns = Array.from(fieldEl.querySelectorAll('.twist-joy-tile'));
  const total = tileBtns.length;
  const cut = new Set();
  let activityFired = false;

  /** Fire the once-only activity signal (clears the advisory hint). */
  const fireActivity = () => {
    if (activityFired) return;
    activityFired = true;
    onActivity();
  };

  /** Update the tally number, readout copy, and the holiday glow strength. */
  const refresh = () => {
    const n = cut.size;
    if (countEl) countEl.textContent = String(n);

    // The holiday locks the moment the first cut lands, and brightens as more go.
    const locked = n > 0;
    holidayBtn.classList.toggle('is-locked', locked);
    // Glow intensity 0..1 — CSS reads it to brighten the seal as cuts mount.
    protectedEl.style.setProperty(
      '--hold-strength', total ? (n / total).toFixed(3) : '0',
    );

    if (tallyLabelEl) {
      tallyLabelEl.textContent = locked
        ? 'Cut what you like. The holiday is ring-fenced.'
        : 'Cut the spending. See what Britain refuses to give up.';
    }

    if (!readoutEl) return;
    if (n === 0) {
      readoutEl.textContent = 'Tap a tile to cut it. The holiday will not budge.';
    } else if (n < total) {
      readoutEl.textContent =
        `${n} of ${total} flexible spends cut. The holiday holds.`;
    } else {
      readoutEl.textContent =
        'Everything else is gone. The holiday is the one thing protected.';
      fieldEl.classList.add('is-cleared');
      protectedEl.classList.add('is-soleto');
    }
  };

  /** Cut one tile. Idempotent — cutting an already-cut tile does nothing. */
  const cutTile = (btn) => {
    const id = btn.dataset.row;
    if (cut.has(id)) return;
    cut.add(id);
    btn.classList.add('is-cut');
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', `${byId[id].label}. Cut.`);
    fireActivity();
    refresh();
  };

  /** The holiday refuses to be cut — flash the protected pulse and announce it. */
  const refuseHoliday = () => {
    holidayBtn.classList.remove('twist-joy-refuse');
    // Force reflow so the animation restarts on every attempt.
    void holidayBtn.offsetWidth;
    holidayBtn.classList.add('twist-joy-refuse');
    fireActivity();
    if (readoutEl) {
      readoutEl.textContent = 'The holiday is ring-fenced. It will not be cut.';
    }
  };

  const onTileClick = (e) => cutTile(e.currentTarget);
  tileBtns.forEach((btn) => btn.addEventListener('click', onTileClick));
  holidayBtn.addEventListener('click', refuseHoliday);

  // Initial paint (handles a zero state cleanly).
  refresh();

  return {
    destroy() {
      tileBtns.forEach((btn) => btn.removeEventListener('click', onTileClick));
      holidayBtn.removeEventListener('click', refuseHoliday);
    },
  };
};

/* ────────────────────────────────────────────────────────────────────── */

export default function init(rootEl, data) {
  const fieldEl = rootEl.querySelector('[data-twist-joy-field]');
  const protectedEl = rootEl.querySelector('[data-twist-joy-protected]');
  const readoutEl = rootEl.querySelector('[data-twist-joy-readout]');
  const countEl = rootEl.querySelector('[data-twist-joy-count]');
  const tallyLabelEl = rootEl.querySelector('[data-twist-joy-tally-label]');
  const spendItems = data?.survey?.protectedSpend?.items ?? null;
  const journey = data?.journey ?? null;

  let unlocked = false;
  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    if (journey) journey.ready();
  };

  if (fieldEl && protectedEl && spendItems) {
    buildInteraction(
      fieldEl, protectedEl, readoutEl, countEl, tallyLabelEl, spendItems, unlock,
    );
    if (journey) journey.gate();
  } else if (fieldEl) {
    fieldEl.innerHTML =
      '<p class="twist-joy-empty">Protected-spend data unavailable.</p>';
  }

  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));
}
