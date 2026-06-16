/**
 * Chapter 02 — research. Warm State-of-Independence ground (navy ink), built
 * deck-faithful (FEEDBACK-V4): bigger/bolder Poppins, backgroundless, a longer
 * richer scroll, and the REAL client-supplied UK map (assets/deck/uk-map.svg)
 * carrying eight qualitative-research cities.
 *
 * Left column: the method, told as a flowing rhythm with a big hero number and
 * three supporting counters (animated by observeCounters).
 * Right column: the navy UK map (backgroundless <img>) with eight cream city
 * markers (real <button>s) absolutely positioned over it by left%/top%.
 * Markers auto-pin in sequence on first reveal; selecting one
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
import {
  observeParallax,
  chapterTransition,
  scrollScene,
  prefersReducedMotion as reducedMotion,
} from '../lib/experiential.js';

/* Real UK map: client-supplied silhouette staged (navy, recoloured) at
   assets/deck/uk-map.svg — a tall portrait GB outline (viewBox 0 0 823 1280,
   aspect ≈ 0.643). Rendered backgroundless via <img>. Markers are placed by
   left%/top% over the map container (NOT SVG coords): the map is GB portrait —
   Scotland at the top, the south coast at the bottom, London bottom-right. */
const MAP_SRC = 'assets/deck/uk-map.svg';

/* City markers — left%/top% over the map container. Approximate placements,
   nudged so each sits on its real landmass. Each carries either a verbatim
   diary quote (with its source-stated attribution) or an honest note.
   order = pin-in sequence. */
const CITIES = [
  {
    id: 'glasgow',
    name: 'Glasgow',
    region: 'Scotland',
    left: 40,
    top: 30,
    note: 'Scotland · families and individuals · week-long video diary, filmed early June.',
  },
  {
    id: 'wigan',
    name: 'Wigan',
    region: 'North-west England',
    left: 44,
    top: 51,
    note: 'North-west England · families and individuals · week-long video diary, filmed early June.',
  },
  {
    id: 'bury',
    name: 'Bury',
    region: 'Greater Manchester',
    left: 48,
    top: 50,
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
    left: 36,
    top: 69,
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
    left: 44,
    top: 68,
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
    left: 57,
    top: 74,
    quote:
      'I don’t go out specifically to look for certain brand items. I go by, ' +
      'comfort and price.',
    attribution: 'Hertfordshire, 63, Coaster',
  },
  {
    id: 'london',
    name: 'London',
    region: 'Greater London',
    left: 61,
    top: 75,
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
    left: 52,
    top: 80,
    quote:
      'I now have a lot less trust in institutions such as the government ' +
      'and politicians, local councils, than I did a few years ago… there’s ' +
      'just scandal after scandal. You know, they’re in it for themselves… ' +
      'Big brands are the same - I don’t want to give too much money to one ' +
      'brand.',
    attribution: 'Southampton, 63, Architects',
  },
];

/* Real UK map as a backgroundless <img> — navy silhouette on the research
   ground (no white/box behind it). The container preserves the map's portrait
   aspect ratio so marker left%/top% land consistently. */
const buildMapImage = () => {
  const img = document.createElement('img');
  img.className = 'research-map-img';
  img.src = MAP_SRC;
  img.alt = 'Map of the United Kingdom';
  img.setAttribute('draggable', 'false');
  return img;
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

  mapHost.append(buildMapImage());

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
    btn.style.left = `${city.left}%`;
    btn.style.top = `${city.top}%`;
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

  // ── Experiential motion (premium, restrained, reduced-motion safe) ──
  // 1. Scroll-progress entrance: exposes --enter on the section so CSS can
  //    fade/rise the two columns and ease the world-motif in as you arrive.
  // 2. Parallax: the orbit ring, seed dots and brand-world marks drift at
  //    different depths (clamped, transform-only — never covers copy).
  // 3. Scroll scene: on first deep-scroll the diary auto-advances once through
  //    the cities so the rail feels alive — pointer/keyboard interaction always
  //    wins (autoplay stops the moment the user acts).
  chapterTransition(rootEl);
  observeParallax(rootEl, { maxShiftPx: 46 });

  if (!reducedMotion()) {
    let userEngaged = false;
    let autoStep = 0;
    const stopAutoplay = () => {
      userEngaged = true;
    };
    // Any genuine interaction cancels the gentle autoplay.
    buttons.forEach((btn) => {
      btn.addEventListener('pointerdown', stopAutoplay, { once: true });
      btn.addEventListener('keydown', stopAutoplay, { once: true });
    });

    scrollScene(
      rootEl,
      order.map((id, i) => ({
        // Spread the auto-advance across the chapter's scroll travel so it
        // reads as a slow reveal, not a flicker. Skip if the user engaged.
        at: 0.34 + (i / order.length) * 0.5,
        onEnter: () => {
          if (userEngaged) return;
          if (i <= autoStep) return;
          autoStep = i;
          const city = CITIES.find((c) => c.id === id);
          if (city) select(city);
        },
      }))
    );
  }
}
