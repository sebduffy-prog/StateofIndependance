/**
 * Chapter 02 — research. Teal research surface.
 *
 * Left column: declarative method counters (animated by observeCounters)
 * plus the research-partner credit and source caption.
 * Right column: a hand-authored flat ink SVG silhouette of Great Britain
 * with eight square mustard markers (real <button>s) for the qualitative
 * cities. Selecting a marker (click or keyboard) opens a rail card with the
 * city name and a verbatim diary quote where one exists, or an honest
 * sample note where it does not.
 *
 * Quotes are verbatim from docs/STORY.md. Cities without a city-attributed
 * quote in the source show a sample note instead of a fabricated quote.
 *
 * @param {HTMLElement} rootEl - <section class="chapter" id="02-research">
 * @param {{survey: object, segments: object, tgi: object}} data
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/* viewBox is 0..100 wide, 0..120 tall — a tall island. Marker x/y are in
   the same space, placed at roughly correct relative GB positions. */
const VIEW_W = 100;
const VIEW_H = 120;

/* A simplified-but-recognisable Great Britain outline. Hand-authored and
   eyeballed against a rendered preview: tapered Scotland at the north, a
   narrowing toward the border, a wider England below with a small East
   Anglia nub on the east and a Wales/Bristol-Channel bulge on the west,
   tapering toward the south coast. Stylised, not survey-accurate, but reads
   as a tall narrow GB island. */
const GB_PATH =
  'M 60,7 C 56,6 53,8 50,11 C 47,14 46,18 45,22 C 44,26 42,29 40,32 ' +
  'C 38,35 36,38 35,42 C 34,46 35,49 34,52 C 33,55 31,57 30,60 ' +
  'C 29,63 29,66 28,69 C 27,72 24,73 23,76 C 22,79 25,80 27,80 ' +
  'C 29,80 30,83 30,86 C 30,89 29,92 30,95 C 31,98 33,100 35,102 ' +
  'C 37,104 39,105 41,106 C 43,107 45,107 47,108 C 49,109 51,110 53,109 ' +
  'C 55,108 57,106 59,104 C 61,102 63,100 64,97 C 65,94 68,93 70,91 ' +
  'C 72,89 70,87 68,86 C 66,85 67,82 67,79 C 66,76 64,75 63,72 ' +
  'C 62,69 62,66 61,63 C 60,60 59,57 59,54 C 59,51 59,48 58,45 ' +
  'C 57,42 56,39 56,36 C 56,33 57,30 58,27 C 59,24 60,21 60,18 ' +
  'C 60,15 60,12 60,10 C 60,8 60,7 60,7 Z';

/* City markers — x/y in viewBox units (0..100 x, 0..120 y). Positions are
   approximate relative placements, not survey coordinates.
   Each entry carries either a verbatim diary quote (with its source-stated
   attribution) or an honest note. order = pin-in sequence. */
const CITIES = [
  {
    id: 'glasgow',
    name: 'Glasgow',
    x: 47,
    y: 30,
    note: 'Scotland · families and individuals · week-long video diary.',
  },
  {
    id: 'wigan',
    name: 'Wigan',
    x: 42,
    y: 68,
    note: 'North-west England · families and individuals · week-long video diary.',
  },
  {
    id: 'bury',
    name: 'Bury',
    x: 46,
    y: 65,
    quote:
      'I would say that it is more of an empowering feeling being able to ' +
      'do things yourself, to fix things yourself, to seek out answers ' +
      'yourself.',
    attribution: 'Bury, 39, Hustler',
  },
  {
    id: 'cardiff',
    name: 'Cardiff',
    x: 33,
    y: 82,
    quote:
      'I do use ChatGPT all the time and find it really quite helpful when ' +
      'I do have problems… I do feel more empowered now with everything at ' +
      'my fingertips and I feel as if I’ve got more free time because of that.',
    attribution: 'Wales, 68, Architects',
  },
  {
    id: 'bristol',
    name: 'Bristol',
    x: 43,
    y: 90,
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
    x: 55,
    y: 96,
    quote:
      'I don’t go out specifically to look for certain brand items. I go by, ' +
      'comfort and price.',
    attribution: 'Hertfordshire, 63, Coaster',
  },
  {
    id: 'london',
    name: 'London',
    x: 60,
    y: 101,
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
    x: 50,
    y: 105,
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
  svg.setAttribute('aria-label', 'Stylised silhouette of Great Britain');
  svg.setAttribute('focusable', 'false');

  const land = document.createElementNS(SVG_NS, 'path');
  land.setAttribute('d', GB_PATH);
  land.setAttribute('class', 'research-map-land');
  svg.append(land);
  return svg;
};

const buildRailCard = (city) => {
  const card = document.createElement('article');
  card.className = 'vccp-card vccp-rail research-card';

  const head = document.createElement('header');
  head.className = 'research-card-head';

  const eyebrow = document.createElement('p');
  eyebrow.className = 'vccp-eyebrow research-card-eyebrow';
  eyebrow.textContent = 'Video diary';

  const title = document.createElement('h3');
  title.className = 'research-card-title';
  title.textContent = city.name;

  head.append(eyebrow, title);
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

export default function init(rootEl, data) {
  observeReveals(rootEl);
  observeCounters(rootEl);

  const mapHost = rootEl.querySelector('[data-research-map]');
  const railHost = rootEl.querySelector('[data-research-rail]');
  const hint = rootEl.querySelector('[data-research-hint]');
  if (!mapHost || !railHost) return; // fail soft if markup missing

  const svg = buildMapSvg();
  mapHost.append(svg);

  const buttons = new Map();

  const select = (city) => {
    buttons.forEach((btn, id) => {
      const isActive = id === city.id;
      btn.classList.toggle('is-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
    if (hint) hint.hidden = true;
    railHost.replaceChildren(buildRailCard(city));
  };

  CITIES.forEach((city) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'research-marker';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', `${city.name}, open video diary`);
    btn.style.left = `${(city.x / VIEW_W) * 100}%`;
    btn.style.top = `${(city.y / VIEW_H) * 100}%`;

    const label = document.createElement('span');
    label.className = 'research-marker-label';
    label.textContent = city.name;
    btn.append(label);

    // Keyboard focus opens the card too (focus is a selection path).
    btn.addEventListener('click', () => select(city));
    btn.addEventListener('focus', () => select(city));

    mapHost.append(btn);
    buttons.set(city.id, btn);
  });
}
