/**
 * Chapter 02 — research · "How we listened to Britain".
 *
 * The connecting ritual (EXPERIENTIAL-IDEATION D1 -> D6): an ambient field of
 * respondent dots converges out of a scatter onto the shape of the country
 * while eight city markers light in sequence on the real navy UK silhouette.
 * The marquee beat: open a city (tap a marker or arrow-key the group) and its
 * verbatim week-long video-diary line surfaces beneath the map. Numbers carry
 * the what (1,504 / 8 cities / 1 week / mid-May 2026), real lives the why.
 *
 * Soft gating: the map is this step's marquee interaction, so init() calls
 * journey.gate() and journey.ready() the first time a city is opened. Next is
 * NEVER blocked — opening a city is an optional reward.
 *
 * Reduced motion: the field jump-cuts to its converged formation, markers
 * arrive with no stagger, one diary opens immediately. Keyboard: the map is a
 * single roving-focus group (arrows move between cities, Enter/Space opens).
 * The dotField canvas is destroyed on step-leave.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="02-research">
 * @param {{ survey:object|null, journey:{ gate():void, ready():void } }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival, scrambleIn } from '../lib/experiential.js';
import { dotField } from '../lib/charts.js';
import { spring } from '../lib/tactile.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const MAP_SRC = 'assets/deck/uk-map.svg';
const MAP_W = 823;   // uk-map.svg viewBox width
const MAP_H = 1280;  // uk-map.svg viewBox height

const FIELD_DOTS = 200;        // ambient respondents — the nation, behind the country
const MARKER_STAGGER_MS = 120; // cities light in sequence (the "connecting" build)
const CONVERGE_DELAY_MS = 420; // scatter holds, then springs onto the country
const IDLE_FIRST_MS = 2600;    // map breathes alone before the first auto-open
const IDLE_CYCLE_MS = 3400;    // gap between idle auto-opened cities

const readToken = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * The eight qualitative cities (STORY.md slide 7 / 95), placed in the map's
 * viewBox as fractions, roughly geographic: Glasgow north · Wigan/Bury NW
 * (separated) · Cardiff/Bristol SW-Wales · Watford/London SE · Southampton south.
 *
 * `quote` is a VERBATIM week-long video-diary line, used only where STORY.md
 * attributes one to that city. Glasgow and Wigan have no attributed verbatim
 * line in STORY.md, so they carry the factual method note instead — a quote is
 * never fabricated.
 */
const CITIES = [
  { id: 'glasgow', name: 'Glasgow', fx: 0.40, fy: 0.285, side: 'left',
    note: 'A week-long video diary with a local household, filmed in early June.' },
  { id: 'wigan', name: 'Wigan', fx: 0.435, fy: 0.515, side: 'left',
    note: 'A week-long video diary with a local household, filmed in early June.' },
  { id: 'bury', name: 'Bury', fx: 0.50, fy: 0.500, side: 'right',
    quote: 'I would say that it is more of an empowering feeling being able to do things yourself, to fix things yourself, to seek out answers yourself.',
    who: 'Bury, 39, Hustler' },
  { id: 'cardiff', name: 'Cardiff', fx: 0.355, fy: 0.735, side: 'left',
    quote: 'I do use ChatGPT all the time and find it really quite helpful when I do have problems… I do feel more empowered now with everything at my fingertips and I feel as if I’ve got more free time because of that.',
    who: 'Wales, 68, Architects' },
  { id: 'bristol', name: 'Bristol', fx: 0.45, fy: 0.745, side: 'left',
    quote: 'I particularly like all the apps, the shopping apps and anything new that comes into the shops, the loyalty apps. And, if we do want to purchase anything, it’s very easy to go in and just cost the price all across everywhere.',
    who: 'Bristol, 61, Coaster' },
  { id: 'watford', name: 'Watford', fx: 0.595, fy: 0.755, side: 'right',
    quote: 'I don’t go out specifically to look for certain brand items. I go by, comfort and price.',
    who: 'Hertfordshire, 63, Coaster' },
  { id: 'london', name: 'London', fx: 0.635, fy: 0.775, side: 'right',
    quote: 'If I could get some sort of app that would kind of help me or prompt me to do certain things that I should do because even if it’s sort of like twenty minutes, fifteen minutes aside, sometimes it becomes, I know it sounds silly, but really overwhelming.',
    who: 'London, 42, Retreater' },
  { id: 'southampton', name: 'Southampton', fx: 0.525, fy: 0.815, side: 'left',
    quote: 'I now have a lot less trust in institutions such as the government and politicians, local councils, than I did a few years ago… there’s just scandal after scandal. You know, they’re in it for themselves.',
    who: 'Southampton, 63, Architects' },
];

/** Random scatter positions (0..1) over the map area for the start state. */
const scatterTargets = (count, colour) =>
  Array.from({ length: count }, () => ({ x: Math.random(), y: Math.random(), colour }));

/** Converged positions (0..1): a loose country-shaped cloud over the silhouette. */
const convergedTargets = (count, colour) =>
  Array.from({ length: count }, () => ({
    x: 0.18 + Math.random() * 0.64,
    y: 0.08 + Math.random() * 0.84,
    colour,
  }));

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

/** Build the focusable marker layer over the map viewBox; returns the <g> nodes. */
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

    const pulse = document.createElementNS(SVG_NS, 'circle');
    pulse.setAttribute('class', 'research-marker-pulse');
    pulse.setAttribute('cx', cx);
    pulse.setAttribute('cy', cy);
    pulse.setAttribute('r', 30);

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'research-marker-dot');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', cy);
    dot.setAttribute('r', 14);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'research-marker-label');
    label.setAttribute('x', cx + (toRight ? 40 : -40));
    label.setAttribute('y', cy + 10);
    label.setAttribute('text-anchor', toRight ? 'start' : 'end');
    label.textContent = city.name;

    g.append(pulse, dot, label);
    g.addEventListener('click', () => onOpen(i));
    layer.append(g);
    return g;
  });

  svg.append(layer);
  return markers;
};

/**
 * The "we listened everywhere" trail: a faint polyline threaded between the
 * cities opened so far, in geographic (array) order so it stays tidy. Inserted
 * before the markers so it sits behind them; draws on via stroke-dashoffset.
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
  void diaryEl.offsetWidth; // restart the surface transition
  diaryEl.classList.add('is-live');
  const decrypt = diaryEl.querySelector('.research-quote-who, .research-quote-city');
  if (decrypt) scrambleIn(decrypt);
};

/**
 * Tactile pin-drop: the opened marker's dot springs in with a little weight —
 * a memory surfacing to the top. Pure transform (translateY + scale), so it
 * never reflows. No-op under reduced motion. One spring per open.
 */
const dropPin = (markerEl, reduced) => {
  const dot = markerEl.querySelector('.research-marker-dot');
  if (!dot || reduced) return;
  spring(0, 1, {
    stiffness: 220,
    bounce: 0.45, // a soft overshoot so the landing has weight
    onUpdate: (v) => {
      const lift = (1 - v) * -10;          // drops from 10px above
      const scale = 0.7 + v * 0.3;          // settles up to full size
      dot.style.transform = `translateY(${lift.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    },
    onRest: () => { dot.style.transform = ''; },
  });
};

export default function init(rootEl, data) {
  const { journey } = data;

  const reduced = prefersReducedMotion();
  const statusEl = rootEl.querySelector('[data-research-status]');
  const hintEl = rootEl.querySelector('[data-research-hint]');
  const diaryEl = rootEl.querySelector('[data-research-diary]');
  const mapEl = rootEl.querySelector('[data-research-map]');
  const fieldEl = rootEl.querySelector('[data-research-field]');

  // Re-assemble the entrance on every arrival (idempotent); the inline 1,504
  // counts up via its data-arrival-count attribute inside arrival().
  rootEl.addEventListener('chapter:arrive', (e) => {
    arrival(rootEl, e.detail || {});
  });

  observeReveals(rootEl);
  observeCounters(rootEl);

  // ── Converging respondent field (D1) ──────────────────────────────
  // Navy dots on the cream editorial ground for contrast: they spring from a
  // scatter into a country-shaped cloud — the nation "connecting".
  let field = null;
  if (fieldEl) {
    const navy = readToken('--soi-navy', '#0A1A5C');
    field = dotField(fieldEl, {
      count: FIELD_DOTS,
      dotRadius: 2.4,
      ariaLabel: '1,504 survey respondents converging onto the map of Britain',
    });
    field.drift(0.5);
    if (reduced) {
      field.formation(convergedTargets(FIELD_DOTS, navy));
    } else {
      field.formation(scatterTargets(FIELD_DOTS, navy), { spring: 0.012 });
      window.setTimeout(() => {
        if (field) field.formation(convergedTargets(FIELD_DOTS, navy), { spring: 0.03 });
      }, CONVERGE_DELAY_MS);
    }
  }

  // ── The map + eight city markers (D6) ─────────────────────────────
  let markers = [];
  let activeIndex = -1;
  let opened = false;        // a USER has opened a city (stops idle autoplay)
  let redrawTrail = null;
  let idleTimer = 0;         // ambient self-tour until the visitor takes over
  const visited = new Set();

  const stopIdle = () => {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = 0; }
  };

  /** Surface a city's diary; light its marker; drop the pin; extend the trail. */
  const openCity = (index, { user = true } = {}) => {
    if (index < 0 || index >= CITIES.length) return;
    if (user) stopIdle(); // the visitor has taken the wheel
    const city = CITIES[index];
    activeIndex = index;
    markers.forEach((m, i) => m.classList.toggle('is-active', i === index));
    if (markers[index]) dropPin(markers[index], reduced);

    visited.add(city.id);
    if (redrawTrail) redrawTrail(visited, reduced);

    if (diaryEl) renderDiary(diaryEl, city);
    if (statusEl) statusEl.textContent = `${city.name} · ${index + 1} of 8`;

    if (user && !opened) {
      opened = true;
      if (hintEl) hintEl.classList.add('is-done');
      journey.ready(); // clear the gentle "try it" hint (Next was never blocked)
    }
  };

  /**
   * Ambient self-tour: until the visitor opens a city, the map breathes by
   * gently auto-opening cities in turn, building the "we listened everywhere"
   * trail. Stops the instant the visitor interacts. Off under reduced motion.
   */
  const startIdle = () => {
    if (reduced) return;
    let next = 0;
    const step = () => {
      if (opened) return;            // visitor took over
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

    // The map is one roving-focus keyboard group.
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
      openCity(0); // show one diary immediately under reduced motion
    } else {
      startIdle(); // the map breathes on its own until the visitor takes over
    }
  });

  // Marquee beat → gentle "try it" hint (Next is never blocked).
  journey.gate();

  // Destroy the canvas sim and stop the idle tour when this step leaves view
  // (the shell toggles `hidden`).
  const visObserver = new MutationObserver(() => {
    if (rootEl.hidden) {
      stopIdle();
      if (field) { field.destroy(); field = null; }
      visObserver.disconnect();
    }
  });
  visObserver.observe(rootEl, { attributes: true, attributeFilter: ['hidden'] });
}
