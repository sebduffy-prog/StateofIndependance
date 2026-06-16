/**
 * main.js — journey engine for The State of Independence.
 *
 * The site is a GUIDED JOURNEY: exactly one chapter (step) is visible at a
 * time, full-viewport. There is no top nav and no progress rail. Movement is
 * via the bottom Next/Back controls (or the keyboard).
 *
 * Responsibilities:
 *   1. Load the three datasets once (survey, segments, tgi).
 *   2. Read sections/manifest.json; for each chapter fetch its HTML fragment
 *      into <section class="chapter journey-step" id="{id}"> and dynamic-import
 *      js/sections/{id}.js, calling its default export init(rootEl, data) with
 *      data = { survey, segments, tgi, journey }.
 *   3. Show only the current step; provide Next + Back + a step indicator and
 *      an average-time label (bottom controls, not a top bar).
 *   4. GATING: each step receives a per-step `data.journey` with gate()/ready().
 *      A step that calls gate() locks Next until it calls ready(). A step that
 *      does NOT call gate() default-unlocks after a short dwell (~1200ms).
 *
 * A failed section renders a visible inline error card and never blanks the
 * rest of the page.
 */

const DATA_FILES = {
  survey: 'data/survey.json',
  segments: 'data/segments.json',
  tgi: 'data/tgi.json',
};

// Tuning constants — no magic numbers inline.
const DEFAULT_UNLOCK_MS = 1200; // ungated/narrative steps unlock after this dwell
const AVG_SECONDS_PER_STEP = 100; // drives the average-time label (~15 min over 9 steps)

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

const errorCard = (id, message) => {
  const div = document.createElement('div');
  div.className = 'chapter-inner';
  div.innerHTML = `
    <div class="section-error-card" role="alert">
      <h2>This chapter could not load</h2>
      <p>${id}: ${message}</p>
    </div>`;
  return div;
};

const loadData = async () => {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      try {
        return [key, await fetchJson(url)];
      } catch (err) {
        console.warn(`Dataset ${key} failed to load: ${err.message}`);
        return [key, null];
      }
    })
  );
  return Object.fromEntries(entries);
};

/**
 * Per-step gating state.
 * @typedef {Object} StepState
 * @property {boolean} gated   step called gate() — Next starts locked
 * @property {boolean} ready   gating interaction completed (ready() fired)
 * @property {boolean} dwelled default-unlock dwell elapsed (ungated steps)
 */
const makeStepState = () => ({ gated: false, ready: false, dwelled: false });

// Advanceable when: gated and ready, OR never gated and the dwell has elapsed.
const isStepUnlocked = (state) => (state.gated ? state.ready : state.dwelled);

const computeAverageLabel = (stepCount) => {
  const totalSeconds = stepCount * AVG_SECONDS_PER_STEP;
  const minutes = Math.max(1, Math.round(totalSeconds / 60));
  return `about ${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const focusHeading = (section) => {
  const heading = section.querySelector('h1, h2, [role="heading"]') || section;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  try {
    heading.focus({ preventScroll: true });
  } catch {
    heading.focus();
  }
};

const mountSection = async (entry, data, app) => {
  const section = document.createElement('section');
  section.className = 'chapter journey-step';
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
    if (typeof module.default === 'function') {
      module.default(section, data);
    }
  } catch (err) {
    console.error(`Section ${entry.id} init failed:`, err);
    section.append(errorCard(entry.id, `module ${err.message}`));
  }
  return section;
};

/**
 * The journey controller. Owns the per-step gating state, the current index,
 * the dwell timer, and the bottom controls. Exposes makeJourneyApi(index) so a
 * section's init() can gate()/ready() its own step, and showStep(index) to
 * drive navigation.
 */
const createJourney = (stepCount) => {
  const controls = document.getElementById('journeyControls');
  const backBtn = document.getElementById('journeyBack');
  const nextBtn = document.getElementById('journeyNext');
  const indicator = document.getElementById('journeyIndicator');
  const hint = document.getElementById('journeyHint');

  const averageLabel = computeAverageLabel(stepCount);
  const states = Array.from({ length: stepCount }, makeStepState);
  let sections = [];
  let current = 0;
  let dwellTimer = null;

  const isLast = () => current === stepCount - 1;

  const refreshControls = () => {
    const state = states[current];
    const unlocked = isStepUnlocked(state);
    backBtn.disabled = current === 0;
    nextBtn.disabled = isLast() || !unlocked;
    nextBtn.textContent = isLast() ? 'Finished' : 'Next';
    // "Interact to continue" hint shows only on a gated, still-locked,
    // non-final step.
    hint.hidden = !(state.gated && !state.ready && !isLast());
    indicator.textContent = `Step ${current + 1} of ${stepCount} · ${averageLabel}`;
  };

  const clearDwell = () => {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
  };

  const makeJourneyApi = (index) => ({
    // Declare this step REQUIRES an interaction — Next starts LOCKED.
    gate() {
      states[index].gated = true;
      if (index === current) {
        clearDwell();
        refreshControls();
      }
    },
    // The gating interaction is complete — UNLOCK Next.
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

    // Ungated steps default-unlock after the dwell; gated steps wait for
    // ready(). A step that already gated gets no dwell timer.
    const state = states[index];
    if (!state.gated && !state.dwelled) {
      dwellTimer = window.setTimeout(() => {
        states[index].dwelled = true;
        if (current === index) refreshControls();
      }, DEFAULT_UNLOCK_MS);
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

  // Mount each section in manifest order, swapping data.journey to that step's
  // own API immediately before its init() runs.
  const sections = [];
  for (let i = 0; i < manifest.length; i += 1) {
    data.journey = journey.makeJourneyApi(i);
    // eslint-disable-next-line no-await-in-loop
    const section = await mountSection(manifest[i], data, app);
    sections.push(section);
  }

  journey.setSections(sections);
  journey.start();
};

init();
