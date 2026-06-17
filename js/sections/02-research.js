/**
 * Chapter 02 — research · "How we listened to Britain".
 *
 * The connecting ritual: eight city markers light in sequence on the real navy
 * UK silhouette. The marquee beat: open a city (tap a marker or arrow-key the
 * group) and its verbatim week-long video-diary line surfaces in the rail.
 *
 * NO ambient/scatter dot field — the navy map and its 8 city markers are the
 * only elements (per STRUCTURE-V2.md content note). The you-dot anchor is on
 * the map stage so the shell dot lands there on arrival.
 *
 * Soft gating: the map is this step's marquee interaction, so init() calls
 * journey.gate() and journey.ready() the first time a city is opened. Next is
 * NEVER blocked — opening a city is an optional reward.
 *
 * Reduced motion: markers arrive with no stagger, one diary opens immediately.
 * Keyboard: the map is a single roving-focus group (arrows move between cities,
 * Enter/Space opens). The city dots never grow on active — only fill/stroke
 * change — so no marker ever blobs over an adjacent dot.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="02-research">
 * @param {{ survey:object|null, journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival } from '../lib/experiential.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAP_SRC = 'assets/deck/uk-map.svg';
const MAP_W = 823;    // uk-map.svg viewBox width
const MAP_H = 1280;   // uk-map.svg viewBox height

const MARKER_STAGGER_MS = 140; // cities light in sequence (the "connecting" build)
const IDLE_FIRST_MS = 2400;    // map breathes alone before the first auto-open
const IDLE_CYCLE_MS = 3200;    // gap between idle auto-opened cities

// DOT_R kept small so adjacent cities (Wigan/Bury are 15px apart in viewBox)
// never overlap even when active. Active state = colour change only, no radius growth.
const DOT_R = 5;

/**
 * The eight qualitative cities (STORY.md slide 7 / 95).
 *
 * fx/fy are FRACTIONS of the uk-map.svg viewBox (823×1280): cx = fx·823,
 * cy = fy·1280. They were calibrated directly against the real silhouette
 * geometry — each city's dot was verified to sit on the correct landmass
 * (Glasgow on Scotland's central belt, Wigan/Bury in NW England near
 * Manchester, Cardiff in south Wales, Bristol east across the Severn,
 * Watford just NW of London, London in the south-east, Southampton on the
 * south coast). The earlier values placed several dots out in the sea
 * because the assumed lat/lon→viewBox projection did not match this map.
 *
 * `side` controls label anchor (left = label to the west, right = to the east).
 *
 * `quote` is a VERBATIM week-long video-diary line from STORY.md. Glasgow and
 * Wigan have no attributed verbatim line, so they carry the factual method note.
 */
const CITIES = [
  {
    id: 'glasgow', name: 'Glasgow',
    // Scotland's central belt, on the west of the mainland body by the Clyde.
    fx: 0.4300, fy: 0.3600, side: 'right',
    note: "A week-long video diary with a local household, filmed in early June.",
  },
  {
    id: 'wigan', name: 'Wigan',
    // NW England, west of Manchester; just west of Bury.
    fx: 0.5250, fy: 0.6220, side: 'left',
    note: "A week-long video diary with a local household, filmed in early June.",
  },
  {
    id: 'bury', name: 'Bury',
    // NW England, just NE of Wigan (north of Manchester).
    fx: 0.5600, fy: 0.6160, side: 'right',
    quote: "I would say that it is more of an empowering feeling being able to do things yourself, to fix things yourself, to seek out answers yourself.",
    who: 'Bury, 39, Hustler',
  },
  {
    id: 'cardiff', name: 'Cardiff',
    // South Wales, west side of the Bristol Channel.
    fx: 0.3600, fy: 0.8120, side: 'left',
    quote: "I do use ChatGPT all the time and find it really quite helpful when I do have problems… I do feel more empowered now with everything at my fingertips and I feel as if I’ve got more free time because of that.",
    who: 'Wales, 68, Architects',
  },
  {
    id: 'bristol', name: 'Bristol',
    // SW England, east across the Severn from Cardiff.
    fx: 0.4300, fy: 0.8120, side: 'right',
    quote: "I particularly like all the apps, the shopping apps and anything new that comes into the shops, the loyalty apps. And, if we do want to purchase anything, it’s very easy to go in and just cost the price all across everywhere.",
    who: 'Bristol, 61, Coaster',
  },
  {
    id: 'watford', name: 'Watford',
    // Hertfordshire, just NW of London.
    fx: 0.6000, fy: 0.8020, side: 'left',
    quote: "I don’t go out specifically to look for certain brand items. I go by, comfort and price.",
    who: 'Hertfordshire, 63, Coaster',
  },
  {
    id: 'london', name: 'London',
    // The south-east.
    fx: 0.6280, fy: 0.8180, side: 'right',
    quote: "If I could get some sort of app that would kind of help me or prompt me to do certain things that I should do because even if it’s sort of like twenty minutes, fifteen minutes aside, sometimes it becomes, I know it sounds silly, but really overwhelming.",
    who: 'London, 42, Retreater',
  },
  {
    id: 'southampton', name: 'Southampton',
    // South coast, central.
    fx: 0.5200, fy: 0.8720, side: 'left',
    quote: "I now have a lot less trust in institutions such as the government and politicians, local councils, than I did a few years ago… there’s just scandal after scandal. You know, they’re in it for themselves.",
    who: 'Southampton, 63, Architects',
  },
];

/**
 * Fetch the real UK silhouette and return its inline <svg> so markers can be
 * overlaid in its viewBox space. Fails soft (returns null) on any error.
 * @returns {Promise<SVGSVGElement|null>}
 */
const loadMapSvg = async () => {
  try {
    const res = await fetch(MAP_SRC);
    if (!res.ok) return null;
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    if (doc.querySelector('parsererror')) return null;
    return doc.querySelector('svg');
  } catch {
    return null;
  }
};

/**
 * Build the focusable city marker layer over the map viewBox.
 * Dots are small and do NOT grow when active — colour change only.
 * This ensures adjacent cities (Wigan/Bury 15px apart) never blob together.
 */
const buildMarkers = (svg, onOpen, reduced) => {
  const layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('class', 'research-markers');

  const markers = CITIES.map((city, i) => {
    const cx = city.fx * MAP_W;
    const cy = city.fy * MAP_H;
    const toRight = city.side === 'right';

    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'research-marker');
    g.dataset.city = city.id;
    if (!reduced) g.style.setProperty('--marker-delay', `${i * MARKER_STAGGER_MS}ms`);

    // Active ring: an SVG circle at resting size that lights up when active.
    // It never changes radius so can't overlap adjacent dots.
    const ring = document.createElementNS(SVG_NS, 'circle');
    ring.setAttribute('class', 'research-marker-ring');
    ring.setAttribute('cx', cx);
    ring.setAttribute('cy', cy);
    ring.setAttribute('r', DOT_R + 4);

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'research-marker-dot');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', cy);
    dot.setAttribute('r', DOT_R);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'research-marker-label');
    label.setAttribute('x', cx + (toRight ? DOT_R + 8 : -(DOT_R + 8)));
    label.setAttribute('y', cy + 4);
    label.setAttribute('text-anchor', toRight ? 'start' : 'end');
    label.textContent = city.name;

    g.append(ring, dot, label);
    g.addEventListener('click', () => onOpen(i));
    layer.append(g);
    return g;
  });

  svg.append(layer);
  return markers;
};

/**
 * The "we listened everywhere" trail: a faint polyline threaded between the
 * cities opened so far, in geographic (array) order so it stays tidy.
 * @returns {(visited:Set<string>, reduced:boolean) => void}
 */
const buildTrail = (svg, markerLayer) => {
  const line = document.createElementNS(SVG_NS, 'polyline');
  line.setAttribute('class', 'research-trail');
  svg.insertBefore(line, markerLayer);

  return (visited, reduced) => {
    const pts = CITIES
      .filter((c) => visited.has(c.id))
      .map((c) => `${(c.fx * MAP_W).toFixed(1)},${(c.fy * MAP_H).toFixed(1)}`);
    line.setAttribute('points', pts.join(' '));
    if (pts.length < 2) {
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
      return;
    }
    const len = line.getTotalLength ? line.getTotalLength() : 0;
    if (reduced || !len) {
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
      return;
    }
    line.style.transition = 'none';
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      line.style.transition = 'stroke-dashoffset 0.55s cubic-bezier(0.22,1,0.36,1)';
      line.style.strokeDashoffset = '0';
    });
  };
};

/** Render a city's verbatim diary line (or its factual method note) into the diary slot. */
const renderDiary = (diaryEl, city) => {
  if (city.quote) {
    diaryEl.innerHTML =
      '<blockquote class="research-quote">' +
      '<p class="research-quote-text">' + city.quote + '</p>' +
      '<footer class="research-quote-cite">' +
      '<span class="research-quote-who">' + city.who + '</span>' +
      ' · week-long video diary</footer></blockquote>';
  } else {
    diaryEl.innerHTML =
      '<p class="research-quote-note">' +
      '<span class="research-quote-city">' + city.name + '</span>' +
      city.note + '</p>';
  }
  diaryEl.classList.remove('is-live');
  void diaryEl.offsetWidth;
  diaryEl.classList.add('is-live');
};

export default function init(rootEl, data) {
  const { journey } = data;

  const reduced = prefersReducedMotion();
  const statusEl = rootEl.querySelector('[data-research-status]');
  const hintEl = rootEl.querySelector('[data-research-hint]');
  const diaryEl = rootEl.querySelector('[data-research-diary]');
  const mapEl = rootEl.querySelector('[data-research-map]');

  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail || {});
  });

  observeReveals(rootEl);
  observeCounters(rootEl);

  // ── The map + eight city markers ──────────────────────────────────
  let markers = [];
  let activeIndex = -1;
  let opened = false;
  let redrawTrail = null;
  let idleTimer = 0;
  const visited = new Set();

  const stopIdle = () => {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; }
  };

  /** Surface a city's diary; light its marker; extend the trail. */
  const openCity = (index, { user = true } = {}) => {
    if (index < 0 || index >= CITIES.length) return;
    if (user) stopIdle();
    const city = CITIES[index];
    activeIndex = index;
    markers.forEach((m, i) => m.classList.toggle('is-active', i === index));

    visited.add(city.id);
    if (redrawTrail) redrawTrail(visited, reduced);

    if (diaryEl) renderDiary(diaryEl, city);
    if (statusEl) statusEl.textContent = `${city.name} · ${index + 1} of 8`;

    if (user && !opened) {
      opened = true;
      if (hintEl) hintEl.classList.add('is-done');
      journey.ready();
    }
  };

  /**
   * Ambient self-tour until the visitor opens a city; builds the trail.
   * Off under reduced motion.
   */
  const startIdle = () => {
    if (reduced) return;
    let next = 0;
    const step = () => {
      if (opened) return;
      openCity(next, { user: false });
      next = (next + 1) % CITIES.length;
      idleTimer = window.setTimeout(step, IDLE_CYCLE_MS);
    };
    idleTimer = window.setTimeout(step, IDLE_FIRST_MS);
  };

  loadMapSvg().then((svg) => {
    if (!svg || !mapEl) return;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', 'research-map-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    markers = buildMarkers(svg, openCity, reduced);
    const markerLayer = svg.querySelector('.research-markers');
    if (markerLayer) redrawTrail = buildTrail(svg, markerLayer);
    mapEl.append(svg);

    mapEl.setAttribute('tabindex', '0');
    mapEl.setAttribute('role', 'application');
    mapEl.setAttribute('aria-label',
      'Eight research cities. Arrow keys move between them, Enter opens a diary.');
    mapEl.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') {
        ev.preventDefault();
        openCity((activeIndex + 1) % CITIES.length);
      } else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        openCity((activeIndex - 1 + CITIES.length) % CITIES.length);
      } else if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        openCity(activeIndex < 0 ? 0 : activeIndex);
      }
    });

    if (statusEl) statusEl.textContent = '8 cities listening';
    if (reduced) {
      openCity(0);
    } else {
      startIdle();
    }
  });

  journey.gate();

  const visObserver = new MutationObserver(() => {
    if (rootEl.hidden) {
      stopIdle();
      visObserver.disconnect();
    }
  });
  visObserver.observe(rootEl, { attributes: true, attributeFilter: ['hidden'] });
}
