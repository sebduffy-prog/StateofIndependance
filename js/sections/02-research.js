/**
 * Chapter 02: research — "How we listened to Britain".
 *
 * The connecting ritual (EXPERIENTIAL-IDEATION D1 → D6):
 * an ambient field of respondent dots CONVERGES out of a scatter onto the
 * shape of the country, while eight city markers light in sequence on the
 * real navy UK silhouette. The marquee interaction: open a city (click a
 * marker or arrow-key the group) and its verbatim week-long video-diary quote
 * surfaces beneath the map. Numbers for the what (1,504 / 8 / 1-week /
 * mid-May 2026), real lives for the why.
 *
 * Soft gating: the map is this step's marquee beat, so we call
 * data.journey.gate() and clear the hint with ready() the first time a city is
 * opened. Next is NEVER blocked — opening a city is an optional reward.
 *
 * Teal accent is allowed in this chapter. The "you" dot lands on the 1,504
 * hero count (data-youdot-anchor in the fragment).
 *
 * Reduced motion: the field jump-cuts to the converged formation, markers
 * arrive without staggered delay, no parallax/pointer force runs. Keyboard:
 * the marker group is one roving-focus control (Left/Right or Up/Down between
 * cities, Enter/Space to open). The dotField canvas is destroyed on step-leave.
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="02-research">
 * @param {{ survey:object|null, journey:{gate():void, ready():void} }} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { observeParallax, arrival, scrambleIn } from '../lib/experiential.js';
import { dotField } from '../lib/charts.js';
import { spring } from '../lib/tactile.js';

const MAP_SRC = 'assets/deck/uk-map.svg';
const MAP_VIEW_W = 823;
const MAP_VIEW_H = 1280;
const FIELD_DOTS = 200; // ambient respondents — lively, not a crowd-crush
const MARKER_STAGGER_MS = 130; // city pins light in sequence (the "connecting" build)

const token = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

/**
 * The eight qualitative cities (STORY.md slide 7 / 95), positioned in the
 * map's viewBox space (823 × 1280) as fractions, roughly geographic:
 * Glasgow top · Wigan/Bury NW (separated) · Cardiff/Bristol SW-Wales ·
 * Watford/London SE · Southampton south.
 *
 * `quote`/`who` are VERBATIM week-long video-diary lines from STORY.md where a
 * city is attributed. Two cities (Glasgow, Wigan) have no attributed verbatim
 * line in STORY.md, so they carry the factual method note instead of an
 * invented quote — never fabricate a quote.
 */
const CITIES = [
  {
    id: 'glasgow', name: 'Glasgow', fx: 0.40, fy: 0.285,
    quote: null,
    note: 'Week-long video diary with a local household — filmed early June.',
  },
  {
    id: 'wigan', name: 'Wigan', fx: 0.435, fy: 0.515,
    quote: null,
    note: 'Week-long video diary with a local household — filmed early June.',
  },
  {
    id: 'bury', name: 'Bury', fx: 0.485, fy: 0.505,
    quote: 'I would say that it is more of an empowering feeling being able to do things yourself, to fix things yourself, to seek out answers yourself.',
    who: 'Bury, 39, Hustler',
  },
  {
    id: 'cardiff', name: 'Cardiff', fx: 0.365, fy: 0.735,
    quote: 'I do use ChatGPT all the time and find it really quite helpful when I do have problems… I do feel more empowered now with everything at my fingertips and I feel as if I’ve got more free time because of that.',
    who: 'Wales, 68, Architects',
  },
  {
    id: 'bristol', name: 'Bristol', fx: 0.445, fy: 0.745,
    quote: 'I particularly like all the apps, the shopping apps and anything new that comes into the shops, the loyalty apps. And, if we do want to purchase anything, it’s very easy to go in and just cost the price all across everywhere.',
    who: 'Bristol, 61, Coaster',
  },
  {
    id: 'watford', name: 'Watford', fx: 0.585, fy: 0.755,
    quote: 'I don’t go out specifically to look for certain brand items. I go by, comfort and price.',
    who: 'Hertfordshire, 63, Coaster',
  },
  {
    id: 'london', name: 'London', fx: 0.625, fy: 0.770,
    quote: 'If I could get some sort of app that would kind of help me or prompt me to do certain things that I should do because even if it’s sort of like twenty minutes, fifteen minutes aside, sometimes it becomes, I know it sounds silly, but really overwhelming.',
    who: 'London, 42, Retreater',
  },
  {
    id: 'southampton', name: 'Southampton', fx: 0.525, fy: 0.805,
    quote: 'I now have a lot less trust in institutions such as the government and politicians, local councils, than I did a few years ago… there’s just scandal after scandal. You know, they’re in it for themselves.',
    who: 'Southampton, 63, Architects',
  },
];

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Build target positions (0..1) for the converging field, scattered over the map area. */
const fieldTargets = (count, colour) =>
  Array.from({ length: count }, () => ({
    x: 0.16 + Math.random() * 0.68,
    y: 0.08 + Math.random() * 0.84,
    colour,
  }));

/**
 * Fetch the real UK silhouette and inject it inline so markers can be overlaid
 * in its viewBox coordinate space. Fails soft: returns null on any error.
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
  } catch (err) {
    return null;
  }
};

/** Create the focusable-group marker layer over the map viewBox. */
const buildMarkers = (svg, onOpen, reduced) => {
  const layer = document.createElementNS(SVG_NS, 'g');
  layer.setAttribute('class', 'research-markers');

  const markers = CITIES.map((city, i) => {
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('class', 'research-marker');
    g.dataset.city = city.id;
    const cx = city.fx * MAP_VIEW_W;
    const cy = city.fy * MAP_VIEW_H;

    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('class', 'research-marker-halo');
    halo.setAttribute('cx', cx);
    halo.setAttribute('cy', cy);
    halo.setAttribute('r', 26);

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('class', 'research-marker-dot');
    dot.setAttribute('cx', cx);
    dot.setAttribute('cy', cy);
    dot.setAttribute('r', 13);

    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('class', 'research-marker-label');
    // SE cluster (right of centre) labels to the right; everything else to the
    // left of its dot → zero overlap with the silhouette edge or each other.
    const right = city.fx > 0.5;
    label.setAttribute('x', cx + (right ? 34 : -34));
    label.setAttribute('y', cy + 9);
    label.setAttribute('text-anchor', right ? 'start' : 'end');
    label.textContent = city.name;

    g.append(halo, dot, label);
    if (!reduced) g.style.setProperty('--marker-delay', `${i * MARKER_STAGGER_MS}ms`);
    g.addEventListener('click', () => onOpen(i));
    layer.append(g);
    return g;
  });

  svg.append(layer);
  return markers;
};

/**
 * The "we listened everywhere" trail: a faint polyline threaded between the
 * cities that have been visited, in the array's geographic order (Glasgow in
 * the north down to Southampton in the south). It is inserted BEFORE the
 * markers so it sits behind the dots, and it draws on via stroke-dashoffset.
 * @param {SVGSVGElement} svg
 * @param {SVGGElement} markerLayer  the markers group (trail is inserted before it)
 * @returns {(visited:Set<string>, reduced:boolean) => void} redraw(visited)
 */
const buildTrail = (svg, markerLayer) => {
  const line = document.createElementNS(SVG_NS, 'polyline');
  line.setAttribute('class', 'research-trail');
  svg.insertBefore(line, markerLayer);

  return (visited, reduced) => {
    // Thread through visited cities in geographic order so the path stays tidy.
    const pts = CITIES.filter((c) => visited.has(c.id)).map(
      (c) => `${(c.fx * MAP_VIEW_W).toFixed(1)},${(c.fy * MAP_VIEW_H).toFixed(1)}`,
    );
    if (pts.length < 2) {
      line.setAttribute('points', pts.join(' '));
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
      return;
    }
    line.setAttribute('points', pts.join(' '));
    const len = line.getTotalLength ? line.getTotalLength() : 0;
    if (reduced || !len) {
      line.style.strokeDasharray = '';
      line.style.strokeDashoffset = '';
      return;
    }
    // Draw the newly extended segment on.
    line.style.transition = 'none';
    line.style.strokeDasharray = String(len);
    line.style.strokeDashoffset = String(len);
    // Next frame: animate to fully drawn.
    requestAnimationFrame(() => {
      line.style.transition = 'stroke-dashoffset 0.55s cubic-bezier(0.22,1,0.36,1)';
      line.style.strokeDashoffset = '0';
    });
  };
};

export default function init(rootEl, data) {
  const { journey } = data;

  // Re-assemble the entrance on every arrival (idempotent).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail || {}));

  observeReveals(rootEl);
  observeCounters(rootEl);
  observeParallax(rootEl);

  const reduced = prefersReducedMotion();
  const counterEl = rootEl.querySelector('[data-research-counter]');
  const hintEl = rootEl.querySelector('[data-research-hint]');
  const diaryEl = rootEl.querySelector('[data-research-diary]');
  const mapEl = rootEl.querySelector('[data-research-map]');
  const fieldEl = rootEl.querySelector('[data-research-field]');

  // ── Converging respondent field (D1) ──────────────────────────────
  // Navy dots on the warm ground for contrast; they spring from scatter into
  // a country-shaped cloud — the nation "connecting".
  let field = null;
  if (fieldEl) {
    const navy = token('--soi-navy', '#0A1A5C');
    field = dotField(fieldEl, {
      count: FIELD_DOTS,
      dotRadius: 2.4,
      ariaLabel: '1,504 survey respondents converging onto the map of Britain',
    });
    field.drift(0.5);
    if (reduced) {
      field.formation(fieldTargets(FIELD_DOTS, navy));
    } else {
      field.formation(
        Array.from({ length: FIELD_DOTS }, () => ({ x: Math.random(), y: Math.random(), colour: navy })),
        { spring: 0.012 },
      );
      window.setTimeout(
        () => field && field.formation(fieldTargets(FIELD_DOTS, navy), { spring: 0.03 }),
        420,
      );
    }
  }

  // ── The map + eight city markers (D6) ─────────────────────────────
  let markers = [];
  let activeIndex = -1;
  let opened = false;
  let redrawTrail = null;            // set once the SVG loads
  const visited = new Set();         // cities opened so far → the listening trail

  /** Surface a city's verbatim diary line (or its factual method note).
      The diary RISES like a surfacing memory; the city name decrypts into
      place (text-scramble), and the listening trail extends to this city. */
  const openCity = (index) => {
    if (index < 0 || index >= CITIES.length) return;
    const city = CITIES[index];
    activeIndex = index;
    markers.forEach((m, i) => m.classList.toggle('is-active', i === index));

    // Extend the "we listened everywhere" trail to the newly visited city.
    visited.add(city.id);
    if (redrawTrail) redrawTrail(visited, reduced);

    if (diaryEl) {
      if (city.quote) {
        diaryEl.innerHTML =
          '<blockquote class="research-quote"><p>' + city.quote + '</p>' +
          '<footer class="research-quote-cite">' +
          '<span class="research-quote-who">' + city.who + '</span>' +
          ' &middot; week-long video diary</footer></blockquote>';
      } else {
        diaryEl.innerHTML =
          '<p class="research-quote-note"><span class="research-quote-city">' +
          city.name + '</span>' + city.note + '</p>';
      }
      diaryEl.classList.remove('is-live');
      void diaryEl.offsetWidth; // restart the surface animation
      diaryEl.classList.add('is-live');
      // Decrypt the attribution / city name into place — a surfacing memory.
      const decrypt = diaryEl.querySelector('.research-quote-who, .research-quote-city');
      if (decrypt) scrambleIn(decrypt);
    }
    if (counterEl) counterEl.textContent = city.name + ' · ' + (index + 1) + ' of 8';

    if (!opened) {
      opened = true;
      if (hintEl) hintEl.classList.add('is-done');
      journey.ready(); // clear the gentle "try it" hint (Next was never blocked)
    }
  };

  loadMapSvg().then((svg) => {
    if (!svg || !mapEl) return;
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('class', 'research-map-svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');

    markers = buildMarkers(svg, openCity, reduced);
    // The listening trail draws behind the markers (inserted before the layer).
    const markerLayer = svg.querySelector('.research-markers');
    if (markerLayer) redrawTrail = buildTrail(svg, markerLayer);
    mapEl.append(svg);

    // The map is one roving-focus keyboard group.
    mapEl.setAttribute('tabindex', '0');
    mapEl.setAttribute('role', 'application');
    mapEl.setAttribute('aria-label', 'Eight research cities. Arrow keys to move between them, Enter to open a diary.');
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

    if (counterEl) counterEl.textContent = '8 cities listening';
    if (reduced) openCity(0); // show one diary immediately under reduced motion
  });

  // Marquee beat → gentle "try it" hint (Next is never blocked).
  journey.gate();

  // Destroy the canvas sim when this step leaves view (shell toggles `hidden`).
  const visObserver = new MutationObserver(() => {
    if (rootEl.hidden && field) {
      field.destroy();
      field = null;
      visObserver.disconnect();
    }
  });
  visObserver.observe(rootEl, { attributes: true, attributeFilter: ['hidden'] });
}
