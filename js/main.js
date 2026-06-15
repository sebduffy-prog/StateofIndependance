/**
 * main.js — site loader for The State of Independence.
 *
 * Responsibilities:
 *   1. Load the three datasets once (survey, segments, tgi).
 *   2. Read sections/manifest.json and, for each chapter, fetch its HTML
 *      fragment into <section class="chapter" id="{id}"> and dynamic-import
 *      js/sections/{id}.js, calling its default export init(rootEl, data).
 *   3. Build the chapter pill nav and the left progress rail.
 *   4. Highlight the active chapter on scroll (IntersectionObserver).
 *
 * A failed section renders a visible inline error card and never blanks
 * the rest of the page.
 */

const DATA_FILES = {
  survey: 'data/survey.json',
  segments: 'data/segments.json',
  tgi: 'data/tgi.json',
};

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

const mountSection = async (entry, data, app) => {
  const section = document.createElement('section');
  section.className = 'chapter';
  section.id = entry.id;
  section.setAttribute('aria-label', entry.title);
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

const buildNav = (manifest) => {
  const nav = document.getElementById('chapterNav');
  const rail = document.getElementById('progressRail');
  if (nav) {
    manifest.forEach((entry) => {
      const a = document.createElement('a');
      a.className = 'chapter-pill';
      a.href = `#${entry.id}`;
      a.dataset.target = entry.id;
      a.textContent = entry.title;
      nav.append(a);
    });
  }
  if (rail) {
    manifest.forEach((entry, i) => {
      const a = document.createElement('a');
      a.className = 'rail-chip';
      a.href = `#${entry.id}`;
      a.dataset.target = entry.id;
      a.setAttribute('aria-label', `Chapter ${i + 1}: ${entry.title}`);
      a.textContent = String(i + 1).padStart(2, '0');
      rail.append(a);
    });
  }
};

const wireScrollSpy = (manifest) => {
  const setActive = (id) => {
    document.querySelectorAll('[data-target]').forEach((node) => {
      node.classList.toggle('is-active', node.dataset.target === id);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    },
    { threshold: [0.25, 0.5, 0.75], rootMargin: '-20% 0px -20% 0px' }
  );

  manifest.forEach((entry) => {
    const section = document.getElementById(entry.id);
    if (section) observer.observe(section);
  });
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

  buildNav(manifest);
  const data = await loadData();

  // Mount sections in order so the DOM reads top-to-bottom correctly.
  for (const entry of manifest) {
    // eslint-disable-next-line no-await-in-loop
    await mountSection(entry, data, app);
  }

  wireScrollSpy(manifest);
};

init();
