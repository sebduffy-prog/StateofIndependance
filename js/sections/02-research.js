/**
 * Chapter 02 — research. Warm State-of-Independence ground (navy ink), built
 * deck-faithful (FEEDBACK-V4): bigger/bolder Poppins, backgroundless, a longer
 * richer scroll, and a REAL recognisable Great Britain silhouette (replacing
 * the old blob) carrying eight qualitative-research cities.
 *
 * Left column: the method, told as a flowing rhythm with a big hero number and
 * three supporting counters (animated by observeCounters).
 * Right column: a navy GB silhouette with eight cream city markers (real
 * <button>s). Markers auto-pin in sequence on first reveal; selecting one
 * (click, focus, or arrow-key) opens a diary rail card. London is selected by
 * default so the rail never starts empty.
 *
 * Quotes are verbatim from docs/STORY.md. Cities without a city-attributed
 * quote in the source show an honest sample note instead of a fabricated quote.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="02-research">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* viewBox: 0..360 wide, 0..560 tall — GB is a tall island. Marker x/y live in
   the same space, placed at roughly correct relative GB positions (relative
   placements for storytelling, not survey coordinates). */
const VIEW_W = 360;
const VIEW_H = 560;

/* A recognisable, simplified Great Britain silhouette — crisp angular coastline
   (reads as a map, not a blob). Tracks the real landmarks clockwise from the
   north: tapered north Scotland, the Galloway west extreme, the narrow WAIST at
   the border, the Welsh (Pembrokeshire) and Cornish (Land's End) south-west
   juts, the Kent/Dover south-east corner, the East-Anglia bulge and the Wash
   notch on the east, then the Aberdeen/Buchan east extreme back up to Caithness.
   Stylised, not survey-grade, but unmistakably the island. */
const GB_PATH =
  'M172,12 L138,52 L110,118 L100,170 ' +          // Scotland west → Galloway
  'L150,214 ' +                                   // the WAIST (England/Scotland border)
  'L160,280 L182,318 L150,338 L132,352 ' +        // NW England + North Wales
  'L102,378 ' +                                   // Pembrokeshire (Wales SW extreme)
  'L142,398 L164,408 ' +                          // Gower / Bristol Channel north shore
  'L140,428 L116,452 ' +                          // Cornwall north coast
  'L152,474 ' +                                   // Land’s End (SW extreme)
  'L205,478 L270,474 L326,476 ' +                 // south coast (Devon → Sussex)
  'L344,486 ' +                                   // Kent / Dover (SE corner)
  'L306,456 L326,438 ' +                          // Thames estuary / Essex
  'L346,416 ' +                                   // East Anglia / Norfolk (E extreme)
  'L308,398 ' +                                   // the Wash (notch in)
  'L304,344 L290,300 ' +                          // Lincolnshire / Humber
  'L262,262 ' +                                   // Yorkshire / Flamborough (out)
  'L266,212 L238,176 L246,146 ' +                 // NE England / Northumberland / SE Scotland
  'L260,114 ' +                                   // Aberdeen / Buchan (E Scotland extreme)
  'L226,72 L200,34 L172,12 Z';                    // Moray Firth / Caithness

/* City markers — x/y in viewBox units. Approximate relative placements.
   Each carries either a verbatim diary quote (with its source-stated
   attribution) or an honest note. order = pin-in sequence. */
const CITIES = [
  {
    id: 'glasgow',
    name: 'Glasgow',
    region: 'Scotland',
    x: 142,
    y: 188,
    note: 'Scotland · families and individuals · week-long video diary, filmed early June.',
  },
  {
    id: 'wigan',
    name: 'Wigan',
    region: 'North-west England',
    x: 168,
    y: 322,
    note: 'North-west England · families and individuals · week-long video diary, filmed early June.',
  },
  {
    id: 'bury',
    name: 'Bury',
    region: 'Greater Manchester',
    x: 184,
    y: 314,
    quote:
      'I would say that it is more of an empowering feeling being able to ' +
      'do things yourself, to fix things yourself, to seek out answers ' +
      'yourself.',
    attribution: 'Bury, 39, Hustler',
  },
  {
    id: 'cardiff',
    name: 'Cardiff',
    region: 'Wales',
    x: 150,
    y: 404,
    quote:
      'I do use ChatGPT all the time and find it really quite helpful when ' +
      'I do have problems… I do feel more empowered now with everything at ' +
      'my fingertips and I feel as if I’ve got more free time because of that.',
    attribution: 'Wales, 68, Architects',
  },
  {
    id: 'bristol',
    name: 'Bristol',
    region: 'South-west England',
    x: 180,
    y: 412,
    quote:
      'I particularly like all the apps, the shopping apps and anything new ' +
      'that comes into the shops, the loyalty apps. And, if we do want to ' +
      'purchase anything, it’s very easy to go in and just cost the price ' +
      'all across everywhere.',
    attribution: 'Bristol, 61, Coaster',
  },
  {
    id: 'watford',
    name: 'Watford',
    region: 'Hertfordshire',
    x: 264,
    y: 448,
    quote:
      'I don’t go out specifically to look for certain brand items. I go by, ' +
      'comfort and price.',
    attribution: 'Hertfordshire, 63, Coaster',
  },
  {
    id: 'london',
    name: 'London',
    region: 'Greater London',
    x: 280,
    y: 458,
    quote:
      'I do know that calling the police would probably be a complete waste ' +
      'of time. However I do have faith in the sense that maybe if I did my ' +
      'own investigations, I would have to knock on my neighbours’ doors and ' +
      'ask if they’ve got Ring camera footage. So I’d probably do half their ' +
      'job for them before actually calling them.',
    attribution: 'London, 42, Retreater',
  },
  {
    id: 'southampton',
    name: 'Southampton',
    region: 'South coast',
    x: 234,
    y: 470,
    quote:
      'I now have a lot less trust in institutions such as the government ' +
      'and politicians, local councils, than I did a few years ago… there’s ' +
      'just scandal after scandal. You know, they’re in it for themselves… ' +
      'Big brands are the same - I don’t want to give too much money to one ' +
      'brand.',
    attribution: 'Southampton, 63, Architects',
  },
];

const buildMapSvg = () => {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VIEW_W} ${VIEW_H}`);
  svg.setAttribute('class', 'research-map-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Silhouette of Great Britain');
  svg.setAttribute('focusable', 'false');

  // Soft halo behind the landmass so it floats (backgroundless — no box/track).
  const halo = document.createElementNS(SVG_NS, 'path');
  halo.setAttribute('d', GB_PATH);
  halo.setAttribute('class', 'research-map-halo');
  halo.setAttribute('aria-hidden', 'true');

  const land = document.createElementNS(SVG_NS, 'path');
  land.setAttribute('d', GB_PATH);
  land.setAttribute('class', 'research-map-land');

  // Hairline connective lines from each city to its neighbour (a faint
  // "we listened across the island" graticule). Drawn cream-on-navy, behind
  // markers. Decorative only.
  const thread = document.createElementNS(SVG_NS, 'polyline');
  thread.setAttribute(
    'points',
    CITIES.map((c) => `${c.x},${c.y}`).join(' ')
  );
  thread.setAttribute('class', 'research-map-thread');
  thread.setAttribute('aria-hidden', 'true');

  svg.append(halo, land, thread);
  return svg;
};

const buildRailCard = (city) => {
  // De-blocked: a flowing diary block, not a bordered card. Separation comes
  // from a single accent rule + space, not a hard box (backgroundless).
  const card = document.createElement('article');
  card.className = 'research-card';

  const head = document.createElement('header');
  head.className = 'research-card-head';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'vccp-eyebrow research-card-eyebrow';
  eyebrow.textContent = 'Video diary';

  const title = document.createElement('h3');
  title.className = 'research-card-title';
  title.textContent = city.name;

  const region = document.createElement('p');
  region.className = 'research-card-region';
  region.textContent = city.region;

  head.append(eyebrow, title, region);
  card.append(head);

  if (city.quote) {
    const quote = document.createElement('blockquote');
    quote.className = 'research-card-quote';
    quote.textContent = `“${city.quote}”`;

    const cite = document.createElement('p');
    cite.className = 'research-card-cite';
    cite.textContent = city.attribution;

    card.append(quote, cite);
  } else {
    const noteP = document.createElement('p');
    noteP.className = 'research-card-note';
    noteP.textContent = city.note;
    card.append(noteP);
  }
  return card;
};

const prefersReducedMotion = () =>
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function init(rootEl, data) {
  observeReveals(rootEl);
  observeCounters(rootEl);

  const mapHost = rootEl.querySelector('[data-research-map]');
  const railHost = rootEl.querySelector('[data-research-rail]');
  const hint = rootEl.querySelector('[data-research-hint]');
  const counter = rootEl.querySelector('[data-research-counter]');
  if (!mapHost || !railHost) return; // fail soft if markup missing

  const svg = buildMapSvg();
  mapHost.append(svg);

  const buttons = new Map();
  const order = CITIES.map((c) => c.id);
  let currentIndex = -1;

  const updateCounter = (city) => {
    if (!counter) return;
    const i = order.indexOf(city.id) + 1;
    counter.textContent = `${String(i).padStart(2, '0')} / ${String(
      CITIES.length
    ).padStart(2, '0')} — ${city.name}`;
  };

  const select = (city) => {
    currentIndex = order.indexOf(city.id);
    buttons.forEach((btn, id) => {
      const isActive = id === city.id;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    if (hint) hint.hidden = true;
    railHost.replaceChildren(buildRailCard(city));
    updateCounter(city);
  };

  // Arrow-key navigation between adjacent cities (the markers form a roving
  // group; selection follows focus).
  const focusByIndex = (index) => {
    const wrapped = (index + CITIES.length) % CITIES.length;
    const id = order[wrapped];
    const btn = buttons.get(id);
    if (btn) btn.focus();
  };

  CITIES.forEach((city, index) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'research-marker';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `${city.name}, ${city.region}, open video diary`);
    btn.style.left = `${(city.x / VIEW_W) * 100}%`;
    btn.style.top = `${(city.y / VIEW_H) * 100}%`;
    btn.style.setProperty('--pin-delay', `${index * 110}ms`);

    const label = document.createElement('span');
    label.className = 'research-marker-label';
    label.textContent = city.name;
    btn.append(label);

    btn.addEventListener('click', () => select(city));
    btn.addEventListener('focus', () => select(city));
    btn.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        focusByIndex(index + 1);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        focusByIndex(index - 1);
      }
    });

    mapHost.append(btn);
    buttons.set(city.id, btn);
  });

  // Pin-in reveal: only animate the markers once the map scrolls into view.
  const pinIn = () => {
    if (prefersReducedMotion()) {
      mapHost.classList.add('is-pinned');
      return;
    }
    mapHost.classList.add('is-pinning');
    requestAnimationFrame(() => mapHost.classList.add('is-pinned'));
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            pinIn();
            obs.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );
    observer.observe(mapHost);
  } else {
    pinIn();
  }

  // London selected by default so the rail never starts empty (but the hint
  // stays until the user interacts — show the card, keep the hint visible).
  const londonCity = CITIES.find((c) => c.id === 'london');
  if (londonCity) {
    railHost.replaceChildren(buildRailCard(londonCity));
    updateCounter(londonCity);
    const londonBtn = buttons.get('london');
    if (londonBtn) {
      londonBtn.classList.add('is-active');
      londonBtn.setAttribute('aria-pressed', 'true');
    }
    currentIndex = order.indexOf('london');
  }
}
