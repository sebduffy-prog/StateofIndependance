/**
 * main.js — journey engine for "The State of Independence".
 *
 * The site is a GUIDED JOURNEY: exactly one chapter (step) is visible at a
 * time, full-viewport. There is no top nav and no progress rail. Movement is
 * via the bottom Next / Back controls, or the keyboard.
 *
 * Responsibilities:
 *   1. Load the three datasets once (survey, segments, tgi).
 *   2. Read sections/manifest.json. For each chapter, fetch its HTML fragment
 *      into <section class="journey-step" id="{id}"> and dynamic-import
 *      js/sections/{id}.js, calling its default export init(rootEl, data) with
 *      data = { survey, segments, tgi, journey }.
 *   3. Show only the current step; provide Back + a step indicator (with the
 *      ~15 minute label and an orbit progress arc) + Next, in the bottom bar.
 *
 * SOFT GATING (deliberate design choice):
 *   Sections still receive a per-step `data.journey` exposing gate() and
 *   ready() for backward compatibility. BUT Next ALWAYS unlocks after a short
 *   dwell (~1s) regardless of those calls — interactions are OPTIONAL rewards,
 *   never hard blocks. gate()/ready() only drive a subtle "try it" affordance:
 *   a gentle hint while a gated step's interaction is still untouched. Back is
 *   always allowed. We never trap the visitor.
 *
 * Connective tissue (Blue-Marine feel): a persistent "you" marker that eases
 * toward each step's anchor, a magnetic Next button, and an orbit progress arc
 * in the controls that fills with journey progress.
 *
 * A failed section renders a visible inline error card and never blanks the
 * rest of the page. No console.log in normal operation.
 */

import { youDot, magneticButton } from './lib/experiential.js';

// ── Configuration ──────────────────────────────────────────────────────────

const DATA_FILES = {
  survey: 'data/survey.json',
  segments: 'data/segments.json',
  tgi: 'data/tgi.json',
};

/** Every step's Next unlocks after this dwell, gated or not (soft gating). */
const DWELL_UNLOCK_MS = 1000;

/** Drives the "~N minutes" label (≈15 min across 9 steps). */
const AVG_SECONDS_PER_STEP = 100;

/** Magnetic Next tuning. */
const MAGNETIC_RADIUS = 120;
const MAGNETIC_STRENGTH = 0.3;

/** Orbit progress arc geometry (a thin completion ring in the controls). */
const ARC_SIZE = 30; // px box
const ARC_RADIUS = 12;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

// ── Small fetch helpers ──────────────────────────────────────────────────────

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const fetchText = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
};

/**
 * A visible inline error card so a failed chapter is obvious without blanking
 * the rest of the journey.
 * @param {string} id
 * @param {string} message
 * @returns {HTMLElement}
 */
const errorCard = (id, message) => {
  const div = document.createElement('div');
  div.className = 'chapter-inner';
  div.innerHTML = `
    <div class="section-error-card" role="alert">
      <h2 tabindex="-1">This chapter could not load</h2>
      <p>${id}: ${message}</p>
    </div>`;
  return div;
};

/**
 * Load all datasets in parallel. A dataset that fails resolves to null rather
 * than aborting the whole journey — chapters guard their own data access.
 * @returns {Promise<{survey:object|null, segments:object|null, tgi:object|null}>}
 */
const loadData = async () => {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      try {
        return [key, await fetchJson(url)];
      } catch (err) {
        console.warn(`Dataset "${key}" failed to load: ${err.message}`);
        return [key, null];
      }
    }),
  );
  return Object.fromEntries(entries);
};

// ── Step state (soft gating) ─────────────────────────────────────────────────

/**
 * @typedef {Object} StepState
 * @property {boolean} gated    section declared an interaction (drives the hint)
 * @property {boolean} ready    the interaction was completed (clears the hint)
 * @property {boolean} dwelled  the dwell elapsed — Next is unlocked
 */
const makeStepState = () => ({ gated: false, ready: false, dwelled: false });

/** SOFT GATING: a step is advanceable purely on dwell. gate()/ready() never block. */
const isStepUnlocked = (state) => state.dwelled;

/** Show the "try it" hint only while a gated step's interaction is untouched. */
const shouldShowHint = (state, isLast) =>
  state.gated && !state.ready && !isLast;

// ── Misc helpers ─────────────────────────────────────────────────────────────

const computeAverageLabel = (stepCount) => {
  const totalSeconds = stepCount * AVG_SECONDS_PER_STEP;
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

/** Move focus to a step's heading for keyboard/screen-reader orientation. */
const focusHeading = (section) => {
  const heading =
    section.querySelector('h1, h2, [role="heading"]') || section;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  try {
    heading.focus({ preventScroll: true });
  } catch {
    heading.focus();
  }
};

/**
 * Fetch a chapter's fragment into a full-viewport <section> and run its module.
 * Both the fragment and the module fail gracefully into an inline error card.
 * @param {{id:string, title:string}} entry
 * @param {object} data  { survey, segments, tgi, journey }
 * @param {HTMLElement} app
 * @returns {Promise<HTMLElement>}
 */
const mountSection = async (entry, data, app) => {
  const section = document.createElement('section');
  section.className = 'journey-step';
  section.id = entry.id;
  section.setAttribute('aria-label', entry.title);
  section.setAttribute('role', 'group');
  section.hidden = true;
  app.append(section);

  try {
    section.innerHTML = await fetchText(`sections/${entry.id}.html`);
  } catch (err) {
    section.innerHTML = '';
    section.append(errorCard(entry.id, `fragment ${err.message}`));
    return section;
  }

  try {
    const module = await import(`./sections/${entry.id}.js`);
    if (typeof module.default === 'function') module.default(section, data);
  } catch (err) {
    console.error(`Section "${entry.id}" init failed:`, err);
    section.append(errorCard(entry.id, `module ${err.message}`));
  }
  return section;
};

/**
 * Build the orbit progress arc into the controls' meta block: a thin SVG ring
 * whose stroke fills with journey progress. Returns a setter taking 0..1.
 * @param {HTMLElement} metaEl
 * @returns {(progress:number)=>void}
 */
const createProgressArc = (metaEl) => {
  const ns = 'http://www.w3.org/2000/svg';
  const c = ARC_SIZE / 2;

  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'journey-meridian');
  svg.setAttribute('viewBox', `0 0 ${ARC_SIZE} ${ARC_SIZE}`);
  svg.setAttribute('width', String(ARC_SIZE));
  svg.setAttribute('height', String(ARC_SIZE));
  svg.setAttribute('aria-hidden', 'true');

  const track = document.createElementNS(ns, 'circle');
  const fill = document.createElementNS(ns, 'circle');
  [track, fill].forEach((el) => {
    el.setAttribute('cx', String(c));
    el.setAttribute('cy', String(c));
    el.setAttribute('r', String(ARC_RADIUS));
    el.setAttribute('fill', 'none');
  });
  track.setAttribute('class', 'journey-meridian__track');
  fill.setAttribute('class', 'journey-meridian__fill');
  // Begin the arc at 12 o'clock, running clockwise.
  fill.setAttribute('transform', `rotate(-90 ${c} ${c})`);
  fill.style.strokeDasharray = String(ARC_CIRCUMFERENCE);
  fill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE);

  svg.append(track, fill);
  metaEl.prepend(svg);

  return (progress) => {
    const clamped = Math.min(1, Math.max(0, progress));
    fill.style.strokeDashoffset = String(ARC_CIRCUMFERENCE * (1 - clamped));
  };
};

/**
 * The journey controller. Owns per-step state, the current index, the dwell
 * timer, and the bottom controls. makeJourneyApi(index) returns the gate()/
 * ready() pair a section's init() can call (compat only — these drive the hint,
 * not Next). showStep(index) drives navigation.
 * @param {number} stepCount
 */
const createJourney = (stepCount) => {
  const controls = document.getElementById('journeyControls');
  const backBtn = document.getElementById('journeyBack');
  const nextBtn = document.getElementById('journeyNext');
  const indicator = document.getElementById('journeyIndicator');
  const hint = document.getElementById('journeyHint');
  const meta = document.querySelector('.journey-meta');

  const averageLabel = computeAverageLabel(stepCount);
  const states = Array.from({ length: stepCount }, makeStepState);

  /** @type {HTMLElement[]} */
  let sections = [];
  let current = 0;
  let dwellTimer = null;

  // ── Connective tissue ──────────────────────────────────────────────────
  const setArc = meta ? createProgressArc(meta) : () => {};
  const marker = youDot(); // persistent "you" dot, eased toward each step's anchor
  magneticButton(nextBtn, { radius: MAGNETIC_RADIUS, strength: MAGNETIC_STRENGTH });

  // The first step plays the brief connecting ritual once; revisiting a step
  // still re-assembles its content but never re-runs the opening ritual.
  let firstArrivalDone = false;

  const isLast = () => current === stepCount - 1;

  const clearDwell = () => {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
  };

  const refreshControls = () => {
    const state = states[current];
    backBtn.disabled = current === 0;
    nextBtn.disabled = isLast() || !isStepUnlocked(state);
    nextBtn.textContent = isLast() ? 'Finished' : 'Next';
    hint.hidden = !shouldShowHint(state, isLast());
    indicator.textContent =
      `Step ${current + 1} of ${stepCount} · ${averageLabel}`;
    setArc((current + 1) / stepCount);
  };

  /**
   * Per-step API handed to sections. SOFT GATING: gate()/ready() are advisory —
   * they toggle the optional "try it" hint, they do NOT lock or unlock Next.
   * @param {number} index
   */
  const makeJourneyApi = (index) => ({
    gate() {
      states[index].gated = true;
      if (index === current) refreshControls();
    },
    ready() {
      states[index].ready = true;
      if (index === current) refreshControls();
    },
  });

  const showStep = (index) => {
    if (index < 0 || index >= stepCount) return;
    clearDwell();

    sections.forEach((section, i) => {
      section.hidden = i !== index;
    });
    current = index;

    const section = sections[index];
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    section.scrollTop = 0;
    focusHeading(section);

    // Persistent marker eases toward this step's anchor (if it declares one).
    marker.anchorTo(section);

    // Fire chapter arrival. The very first step also gets the opening ritual.
    const withRitual = index === 0 && !firstArrivalDone;
    if (withRitual) firstArrivalDone = true;
    section.dispatchEvent(
      new CustomEvent('chapter:arrive', { detail: { ritual: withRitual } }),
    );

    // SOFT GATING: every step unlocks Next after the dwell, once. Already-
    // dwelled steps stay unlocked on revisit (no second wait).
    if (!states[index].dwelled) {
      dwellTimer = window.setTimeout(() => {
        states[index].dwelled = true;
        if (current === index) refreshControls();
      }, DWELL_UNLOCK_MS);
    }

    refreshControls();
  };

  const goNext = () => {
    if (isLast() || !isStepUnlocked(states[current])) return;
    showStep(current + 1);
  };
  const goBack = () => {
    if (current === 0) return;
    showStep(current - 1);
  };

  backBtn.addEventListener('click', goBack);
  nextBtn.addEventListener('click', goNext);

  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) return;
    const tag = (event.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (event.key === 'ArrowLeft') {
      goBack();
    } else if (event.key === 'ArrowRight' || event.key === 'Enter') {
      goNext();
    }
  });

  return {
    makeJourneyApi,
    setSections: (list) => {
      sections = list;
    },
    start: () => {
      controls.hidden = false;
      showStep(0);
    },
  };
};

// ── Bootstrap ────────────────────────────────────────────────────────────────

const init = async () => {
  const app = document.getElementById('app');

  let manifest;
  try {
    manifest = await fetchJson('sections/manifest.json');
  } catch (err) {
    app.append(errorCard('manifest', err.message));
    return;
  }

  const data = await loadData();
  const journey = createJourney(manifest.length);

  // Mount sections in manifest order, swapping data.journey to that step's own
  // API immediately before its init() runs.
  const sections = [];
  for (let i = 0; i < manifest.length; i += 1) {
    data.journey = journey.makeJourneyApi(i);
    // eslint-disable-next-line no-await-in-loop -- ordered mount is intentional
    const section = await mountSection(manifest[i], data, app);
    sections.push(section);
  }

  journey.setSections(sections);
  journey.start();
};

init();
