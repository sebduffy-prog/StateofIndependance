/**
 * mobile.js — the BESPOKE MOBILE shell for The State of Independence.
 *
 * WHY A SEPARATE SHELL
 *   The desktop experience (js/main.js) is a Z-axis depth fly-through built for
 *   a mouse/trackpad and a wide canvas. On a phone that mechanic is hostile:
 *   tiny targets, swipe-vs-scroll conflicts, GPU-heavy depth blur. So mobile
 *   gets its OWN native mechanic — a vertical, full-height SCROLL-SNAP scene
 *   deck — WITHOUT touching the desktop engine or any section in any way.
 *
 * WHAT IT REUSES (verbatim, read-only — guarantees identical content + story)
 *   • sections/{id}.html  — the exact same fragment the desktop mounts
 *   • js/sections/{id}.js  — the exact same module: default init(rootEl, data)
 *   • js/lib/*             — the same charts/interactions (already width-responsive)
 *   • data/*.json          — the same survey/segments/tgi datasets
 *   • js/site-gate.js      — the same soft access gate (loaded by mobile.html)
 *
 * THE CONTRACT IT HONOURS (matches js/main.js so sections behave identically)
 *   • data = { survey, segments, tgi, journey }, journey = { gate(), ready() }
 *     (advisory only — they toggle the "try it" hint; they never trap scroll).
 *   • On focus it dispatches `chapter:arrive` (CustomEvent {detail:{ritual}})
 *     on the scene; sections self-run their arrival()/reveals/count-ups.
 *   • Grounds are applied with the manifest's `si-ground-{warm|cream|navy}` class.
 *
 * PERFORMANCE
 *   Fragments mount immediately (cheap HTML) but each section MODULE is inited
 *   lazily, ~one screen before it scrolls into view, so the heavy canvases
 *   (force-graph, compass, venn) never all fire at once on a mid-range phone.
 */

const DATA_FILES = {
  survey: 'data/survey.json',
  segments: 'data/segments.json',
  tgi: 'data/tgi.json',
};

const VIEW_KEY = 'soi_view_pref_v1';     // 'desktop' | 'mobile' escape preference
const HINT_DWELL_MS = 1400;              // dwell before an advisory hint may show
const INIT_MARGIN = '300px 0px 300px 0px'; // init a section ~one screen early
const REVEAL_FALLBACK_MS = 1600;         // force-reveal still-hidden content after focus
const THEME_COLORS = { warm: '#FBC100', cream: '#F0EDE7', navy: '#041654' };
const FADE_PX = 280;   // distance over which one ground colour cross-fades to the next

const clampN = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const hexToRgb = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** Linear blend between two hex colours → "rgb(...)". t in 0..1. */
const lerpHex = (a, b, t) => {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const m = (i) => Math.round(ca[i] + (cb[i] - ca[i]) * clampN(t, 0, 1));
  return `rgb(${m(0)}, ${m(1)}, ${m(2)})`;
};

// ── Routing / escape hatch ───────────────────────────────────────────────────
// Vercel serves this file at "/" for mobile user-agents (see vercel.json). We
// add a CLIENT guard so an explicit "view desktop" choice — or a clearly
// desktop device that slipped through — lands on the desktop site instead.

const params = new URLSearchParams(window.location.search);

const readViewPref = () => {
  try { return localStorage.getItem(VIEW_KEY); } catch { return null; }
};
const writeViewPref = (value) => {
  try { localStorage.setItem(VIEW_KEY, value); } catch { /* private mode */ }
};

/** Preserve ?pass= (and any other params) when bouncing between views. */
const withView = (view) => {
  const next = new URLSearchParams(window.location.search);
  next.set('view', view);
  return `/?${next.toString()}${window.location.hash}`;
};

const wantsDesktop = () => {
  if (params.get('view') === 'desktop') return true;
  if (params.get('view') === 'mobile') return false;
  if (readViewPref() === 'desktop') return true;
  // A large, fine-pointer device that reached the mobile bundle by mistake.
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const wide = window.matchMedia('(min-width: 900px)').matches;
  return wide && !coarse;
};

// Persist an explicit choice so it survives a bare "/" revisit.
if (params.get('view') === 'desktop') writeViewPref('desktop');
if (params.get('view') === 'mobile') writeViewPref('mobile');

if (wantsDesktop()) {
  window.location.replace(withView('desktop'));
}

// ── Small DOM/fetch helpers ──────────────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);

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

const pad2 = (n) => String(n).padStart(2, '0');

/** Load all datasets in parallel; a failed dataset resolves to null (fail soft). */
const loadData = async () => {
  const entries = await Promise.all(
    Object.entries(DATA_FILES).map(async ([key, url]) => {
      try { return [key, await fetchJson(url)]; }
      catch { return [key, null]; }
    }),
  );
  return Object.fromEntries(entries);
};

/** A visible inline error card so a failed scene is obvious, never blank. */
const errorCard = (id, message) => {
  const div = document.createElement('div');
  div.className = 'chapter-inner m-error';
  div.innerHTML = `
    <div class="section-error-card" role="alert">
      <h2 tabindex="-1">This step could not load</h2>
      <p>${id}: ${message}</p>
    </div>`;
  return div;
};

// ── The mobile journey engine ────────────────────────────────────────────────

const run = async () => {
  const deck = $('#m-deck');
  const topbar = $('#mTopbar');
  const progressFill = $('#mProgressFill');
  const progressBar = $('#mProgress');
  const ticker = $('#mTicker');
  const cue = $('#mCue');
  const hint = $('#mHint');

  let manifest;
  try {
    manifest = await fetchJson('sections/manifest.json');
  } catch (err) {
    deck.append(errorCard('manifest', err.message));
    return;
  }

  const data = await loadData();
  const total = manifest.length;

  // Per-scene state. `inited` guards lazy module init; `gated/ready` drive the
  // advisory hint exactly like the desktop engine's per-step states.
  const scenes = [];
  const states = manifest.map(() => ({ inited: false, gated: false, ready: false }));
  let focused = -1;
  let firstArrivalDone = false;
  let hintTimer = null;

  /** Per-scene journey API (frozen, immutable). Advisory only — never traps. */
  const makeJourneyApi = (index) => Object.freeze({
    gate() {
      states[index] = { ...states[index], gated: true };
      if (index === focused) scheduleHint();
    },
    ready() {
      states[index] = { ...states[index], ready: true };
      if (index === focused) hideHint();
    },
  });

  const hideHint = () => {
    if (hintTimer) { clearTimeout(hintTimer); hintTimer = null; }
    if (hint) hint.hidden = true;
  };

  const scheduleHint = () => {
    hideHint();
    const s = states[focused];
    if (!s || !s.gated || s.ready) return;
    hintTimer = window.setTimeout(() => {
      const cur = states[focused];
      if (cur && cur.gated && !cur.ready && hint) hint.hidden = false;
    }, HINT_DWELL_MS);
  };

  // Build (mount the fragment for) every scene up front — cheap HTML only.
  manifest.forEach((entry, index) => {
    const scene = document.createElement('section');
    scene.className = 'm-scene';
    if (entry.ground) scene.classList.add(`si-ground-${entry.ground}`);
    scene.id = entry.id;
    scene.dataset.index = String(index);
    scene.dataset.ground = entry.ground || 'warm';
    scene.setAttribute('role', 'group');
    scene.setAttribute('aria-label', `${pad2(index + 1)} of ${pad2(total)} — ${entry.title}`);
    deck.append(scene);
    scenes.push(scene);
  });

  // Mount the fragments (parallel fetch). Module init is deferred to ensureInit.
  await Promise.all(manifest.map(async (entry, index) => {
    try {
      scenes[index].innerHTML = await fetchText(`sections/${entry.id}.html`);
    } catch (err) {
      scenes[index].innerHTML = '';
      scenes[index].append(errorCard(entry.id, `fragment ${err.message}`));
      states[index] = { ...states[index], inited: true }; // nothing more to init
    }
  }));

  /** Lazily import + run a section module the first time its scene approaches. */
  const ensureInit = async (index) => {
    if (states[index].inited) return;
    states[index] = { ...states[index], inited: true };
    const entry = manifest[index];
    try {
      const module = await import(`./sections/${entry.id}.js`);
      if (typeof module.default === 'function') {
        module.default(scenes[index], { ...data, journey: makeJourneyApi(index) });
      }
    } catch (err) {
      scenes[index].append(errorCard(entry.id, `module ${err.message}`));
    }
  };

  // The arrival: dispatch chapter:arrive once per focus change (idempotent for
  // sections; the "ritual" character-reveal fires only the first time on cover).
  const focusScene = (index) => {
    if (index === focused) return;
    focused = index;
    const scene = scenes[index];
    if (!scene) return;

    const ritual = index === 0 && !firstArrivalDone;
    if (ritual) firstArrivalDone = true;
    scene.dispatchEvent(new CustomEvent('chapter:arrive', { detail: { ritual } }));

    // Chrome: progress meridian + chapter ticker + the OS chrome theme colour.
    const pct = total > 1 ? (index / (total - 1)) * 100 : 100;
    if (progressFill) progressFill.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
    if (progressBar) progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    if (ticker) ticker.textContent = pad2(index + 1);
    const ground = scene.dataset.ground || 'warm';
    document.body.dataset.ground = ground;       // drives ground-aware chrome in css
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', THEME_COLORS[ground] || THEME_COLORS.warm);

    scheduleHint();

    // Belt-and-braces: a section's entrance reveal (arrival() on [data-arrival],
    // observeReveals() on .reveal) normally fires on chapter:arrive. If a module
    // doesn't wire it, content could sit at opacity:0 forever. After a short
    // dwell, force-reveal anything in THIS scene still hidden — preserving the
    // animation when it does fire, guaranteeing nothing renders blank when it
    // doesn't.
    window.setTimeout(() => {
      if (focused !== index) return;
      scene.querySelectorAll('[data-arrival]:not(.is-arrived)')
        .forEach((el) => el.classList.add('is-arrived'));
      scene.querySelectorAll('.reveal:not(.is-visible)')
        .forEach((el) => el.classList.add('is-visible'));
    }, REVEAL_FALLBACK_MS);
  };

  // ── Observers ──────────────────────────────────────────────────────────────
  // 1) INIT observer: a wide margin so a section's module boots ~one screen
  //    before it's reached (keeps heavy canvases from all firing at once).
  const initObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) ensureInit(Number(entry.target.dataset.index));
    });
  }, { root: deck, rootMargin: INIT_MARGIN, threshold: 0 });

  // 2) FOCUS observer: whichever scene owns the most of the viewport is focused.
  const ratios = new Array(total).fill(0);
  const focusObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      ratios[Number(entry.target.dataset.index)] = entry.isIntersecting ? entry.intersectionRatio : 0;
    });
    let best = focused < 0 ? 0 : focused;
    let bestRatio = -1;
    for (let i = 0; i < total; i += 1) {
      if (ratios[i] > bestRatio) { bestRatio = ratios[i]; best = i; }
    }
    if (bestRatio > 0) focusScene(best);
  }, { root: deck, threshold: [0.15, 0.35, 0.55, 0.75, 0.95] });

  scenes.forEach((scene) => { initObserver.observe(scene); focusObserver.observe(scene); });

  // ── Cross-fading colour backdrop ────────────────────────────────────────────
  // One fixed layer behind the (transparent) scenes. As the deck scrolls, its
  // colour HOLDS on each scene's ground, then cross-fades to the next over the
  // last FADE_PX before the boundary — the "fade between colours" on one natural
  // vertical scroll, with NO z-axis and no snap.
  const backdrop = document.createElement('div');
  backdrop.className = 'm-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  document.body.insertBefore(backdrop, deck);
  const groundColors = scenes.map((s) => THEME_COLORS[s.dataset.ground] || THEME_COLORS.warm);

  const paintBackdrop = () => {
    const center = deck.scrollTop + deck.clientHeight * 0.5;
    let i = 0;
    for (let k = 0; k < total; k += 1) {
      if (scenes[k].offsetTop <= center) i = k; else break;
    }
    let color = groundColors[i];
    const next = scenes[i + 1];
    if (next) {
      const span = next.offsetTop - scenes[i].offsetTop;
      const fade = Math.min(FADE_PX, span * 0.5);
      const distToNext = next.offsetTop - center;       // px until the next scene's top
      if (distToNext < fade) {
        color = lerpHex(groundColors[i], groundColors[i + 1], 1 - distToNext / fade);
      }
    }
    backdrop.style.backgroundColor = color;
  };

  // Reveal the fixed chrome and kick off the first scene.
  if (topbar) topbar.hidden = false;
  if (cue) cue.hidden = false;
  await ensureInit(0);
  if (total > 1) ensureInit(1);
  focusScene(0);
  paintBackdrop();

  // rAF-throttled scroll handler: repaint the colour field + dismiss the cue.
  let ticking = false;
  let cueDismissed = false;
  deck.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { paintBackdrop(); ticking = false; });
    }
    if (!cueDismissed && deck.scrollTop > window.innerHeight * 0.35) {
      cueDismissed = true;
      if (cue) cue.classList.add('is-gone');
    }
  }, { passive: true });
  window.addEventListener('resize', paintBackdrop, { passive: true });
};

run();
