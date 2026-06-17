/**
 * Chapter 07 — moves. THE PAYOFF — a cinematic filmstrip in the authoritative
 * brand world (warm-gradient stage, book-cover editorial frames).
 *
 * One stage on the warm-gradient ground: the five signature moves as a film
 * reel. Exactly ONE frame is in focus at a time, composed as a book-cover
 * editorial moment — a big ALL-CAPS bold-black stage number 01-05, the
 * bold-black Poppins title with one italic accent word (the key), the lesson,
 * the single carried form (one stat OR one quote, never both), and the
 * less->more shift ledger. Verified-brand moves carry a photographic ad-mockup
 * as a book-cover evidence card. The other four sit small in the strip below.
 *
 * THE MARQUEE INTERACTION: the tools you pick up. The active frame carries a
 * draggable tool (tactile.js — real weight, lift shadow, spring). Drag it down
 * into the toolbelt, or click / press Enter, and it is handed over: the belt
 * slot lights navy, the count ticks, and the reel travels to the next move (the
 * ONE hero motion). Picking up all five reveals the payoff. Fully keyboard
 * operable: Tab to the active tool, Enter to pick it up.
 *
 * No fabricated numbers — every title, lesson, stat, quote, shift and brand
 * example is verbatim from the verified <template> source (traced to STORY.md
 * ch.07). Contract: docs/CONTRACT.md.
 */
import { observeReveals } from '../lib/reveal.js';
import { observeCounters } from '../lib/counter.js';
import { arrival, prefersReducedMotion } from '../lib/experiential.js';
import { draggable } from '../lib/tactile.js';

const TOTAL_MOVES = 5;
// Drag distance (px, downward) past which a release counts as "handed over".
const HANDOVER_THRESHOLD = 90;

// The Challenger-Series lockup — the tiny book-cover stamp, top-right of a card.
const LOCKUP_SRC = '../assets/brand-final/challenger-series-lockup.png';

/**
 * Read the verified moves from the hidden <template> into plain objects.
 * @param {HTMLElement} rootEl
 * @returns {Array<object>}
 */
const readMoves = (rootEl) => {
  const tpl = rootEl.querySelector('.mv-source');
  if (!tpl) return [];
  return Array.from(tpl.content.querySelectorAll('li[data-move]')).map((li) => {
    const svg = li.querySelector('svg');
    const shift = Array.from(li.querySelectorAll('.mv-shift-data li')).map((row) => ({
      less: row.dataset.less,
      more: row.dataset.more,
    }));
    return {
      num: li.dataset.move,
      title: li.dataset.title,
      key: li.dataset.key,
      lesson: li.dataset.lesson,
      stat: li.dataset.stat || null,
      statSuffix: li.dataset.statSuffix || '',
      statLine: li.dataset.statLine || '',
      quote: li.dataset.quote || null,
      cite: li.dataset.cite || '',
      evidence: li.dataset.evidence || null,
      evidenceCap: li.dataset.evidenceCap || '',
      iconHTML: svg ? svg.outerHTML : '',
      shift,
    };
  });
};

/**
 * Build one reel frame element for a move (a book-cover editorial composition).
 * @param {object} move
 * @returns {HTMLElement}
 */
const buildFrame = (move) => {
  const frame = document.createElement('article');
  frame.className = 'mv-frame';
  frame.dataset.move = move.num;
  frame.setAttribute('aria-roledescription', 'slide');
  frame.setAttribute('aria-label', `Move ${move.num} of ${TOTAL_MOVES}`);

  // The single carried supporting form: one stat OR one quote — never both.
  let carried = '';
  if (move.stat) {
    carried =
      '<div class="mv-carried mv-carried--stat">' +
      `<span class="mv-stat-value num" data-count-to="${move.stat}" data-count-suffix="${move.statSuffix}">${move.stat}${move.statSuffix}</span>` +
      `<span class="mv-stat-line">${move.statLine}</span>` +
      '</div>';
  } else if (move.quote) {
    carried =
      '<blockquote class="mv-carried mv-carried--quote">' +
      `<p class="mv-quote-body">${move.quote}</p>` +
      `<cite class="mv-quote-cite">${move.cite}</cite>` +
      '</blockquote>';
  }

  // The less->more shift, rendered as a quiet dependence->agency ledger on the
  // cream card — less de-emphasised, more in navy. Data as a reality, not a
  // second competing widget (the one interaction is picking up the tool).
  const shiftRows = move.shift
    .map(
      (row) =>
        '<li>' +
        `<span class="mv-shift-less">${row.less}</span>` +
        '<span class="mv-shift-arrow" aria-hidden="true">&rarr;</span>' +
        `<span class="mv-shift-more">${row.more}</span>` +
        '</li>',
    )
    .join('');

  // Verified-brand moves carry a photographic ad-mockup as a book-cover
  // evidence card (half-bleed photo, caption beneath). Visual asset only.
  const evidence = move.evidence
    ? '<figure class="mv-evidence">' +
      `<img class="mv-evidence-photo" src="${move.evidence}" alt="" loading="lazy" decoding="async" />` +
      `<figcaption class="mv-evidence-cap">${move.evidenceCap}</figcaption>` +
      '</figure>'
    : '';

  frame.innerHTML =
    // The cream book-cover card: stage number + title + lesson + carried form
    // + shift, with the tiny lockup stamp top-right and a flat navy+yellow icon.
    '<div class="mv-card soi-card">' +
    `<img class="mv-card-mark soi-card__mark" src="${LOCKUP_SRC}" alt="" aria-hidden="true" />` +
    '<header class="mv-card-head">' +
    '<p class="mv-stage" aria-hidden="true">' +
    `<span class="mv-stage-num num">0${move.num}</span><span class="mv-stage-of">/ 05</span></p>` +
    `<span class="mv-icon soi-icon" aria-hidden="true">${move.iconHTML}</span>` +
    `<h3 class="mv-title si-display si-display--sm si-display--upper">${move.title} <span class="mv-title-key si-accent">${move.key}</span></h3>` +
    '</header>' +
    '<div class="mv-card-body">' +
    `<p class="mv-lesson">${move.lesson}</p>` +
    carried +
    '<div class="mv-shift">' +
    '<p class="mv-shift-head"><span>Dependence</span><span>Agency</span></p>' +
    `<ul class="mv-shift-list">${shiftRows}</ul>` +
    '</div>' +
    '</div>' +
    '</div>' +
    // The evidence column (photo card) OR — when absent — the pickup lives here.
    '<div class="mv-aside">' +
    evidence +
    // The tool: the draggable object the visitor picks up to hand the move over.
    '<div class="mv-pickup">' +
    `<button type="button" class="mv-tool" data-tool aria-label="${move.title} ${move.key}. Pick up this tool to hand it over. Move ${move.num} of ${TOTAL_MOVES}.">` +
    `<span class="mv-tool-icon" aria-hidden="true">${move.iconHTML}</span>` +
    '</button>' +
    '<span class="mv-pickup-hint" aria-hidden="true">Pick it up</span>' +
    '</div>' +
    '</div>';
  return frame;
};

/**
 * Build one toolbelt slot.
 * @param {object} move
 * @returns {HTMLLIElement}
 */
const buildSlot = (move) => {
  const li = document.createElement('li');
  li.className = 'mv-belt-slot';
  li.dataset.move = move.num;
  li.innerHTML = `<span class="mv-belt-icon">${move.iconHTML}</span>`;
  return li;
};

/**
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="07-moves">
 * @param {{survey:object, segments:object, tgi:object, journey:object}} data
 */
export default function init(rootEl, data) {
  if (!rootEl) return;

  const moves = readMoves(rootEl);
  if (!moves.length) return; // fail soft — no source, no build

  const track = rootEl.querySelector('.mv-reel-track');
  const beltSlots = rootEl.querySelector('.mv-belt-slots');
  const beltCount = rootEl.querySelector('.mv-belt-count');
  const reel = rootEl.querySelector('.mv-reel');
  if (!track || !beltSlots || !reel) return;

  const reduced = prefersReducedMotion();
  const cleanups = [];

  // GATING: the marquee interaction is picking up all five tools. ready() fires
  // once the fifth is handed over; gate() turns on the gentle hint meanwhile.
  const journey = data && data.journey;
  if (journey && typeof journey.gate === 'function') journey.gate();
  let unlocked = false;
  const onComplete = () => {
    if (unlocked) return;
    unlocked = true;
    rootEl.classList.add('is-complete');
    if (journey && typeof journey.ready === 'function') journey.ready();
  };

  // Build the reel frames + belt slots.
  const frames = moves.map((move) => {
    const frame = buildFrame(move);
    track.append(frame);
    beltSlots.append(buildSlot(move));
    return frame;
  });

  let activeIndex = 0;
  let handed = 0;
  const isHanded = new Array(TOTAL_MOVES).fill(false);

  // Move the reel so the active frame is centred. Pure transform (the hero
  // motion). CSS owns the easing; under reduced motion the jump is instant.
  const layoutReel = () => {
    track.style.transform = `translate3d(${-activeIndex * 100}%, 0, 0)`;
    frames.forEach((frame, i) => {
      const active = i === activeIndex;
      frame.classList.toggle('is-active', active);
      frame.setAttribute('aria-hidden', active ? 'false' : 'true');
      const tool = frame.querySelector('[data-tool]');
      if (tool) {
        // Only the active, un-picked tool is reachable / pickable.
        tool.disabled = isHanded[i] || !active;
        tool.tabIndex = active && !isHanded[i] ? 0 : -1;
      }
    });
  };

  // Advance to the next move that hasn't been picked up yet (wraps).
  const advanceToNextUnpicked = () => {
    for (let step = 1; step <= TOTAL_MOVES; step += 1) {
      const i = (activeIndex + step) % TOTAL_MOVES;
      if (!isHanded[i]) {
        activeIndex = i;
        layoutReel();
        const tool = frames[i].querySelector('[data-tool]');
        if (tool && !reduced) tool.focus({ preventScroll: true });
        return;
      }
    }
  };

  const updateBelt = () => {
    if (beltCount) beltCount.textContent = String(handed);
    Array.from(beltSlots.children).forEach((slot, i) => {
      slot.classList.toggle('is-filled', isHanded[i]);
    });
  };

  // Hand a move over: light its belt slot, tick the count, advance the reel.
  const handOver = (index) => {
    if (isHanded[index]) return;
    isHanded[index] = true;
    handed += 1;
    const frame = frames[index];
    frame.classList.add('is-handed');
    const tool = frame.querySelector('[data-tool]');
    if (tool) {
      tool.disabled = true;
      tool.setAttribute('aria-label', `${moves[index].title} ${moves[index].key}. Picked up.`);
    }
    updateBelt();
    if (handed >= TOTAL_MOVES) {
      layoutReel();
      onComplete();
    } else {
      advanceToNextUnpicked();
    }
  };

  // Wire each frame's tool: tactile drag (down into the belt) + click/Enter.
  frames.forEach((frame, index) => {
    const tool = frame.querySelector('[data-tool]');
    if (!tool) return;

    // A short downward drag past the threshold = picked up; otherwise spring
    // back. Click / Enter is the simple keyboard path (handled by the button).
    let pickedByDrag = false;
    const handle = draggable(tool, {
      axis: 'y',
      bounds: { minY: -40, maxY: 220 },
      spring: 'return',
      momentum: 0,
      keyboardStep: 40,
      springOpts: { stiffness: 220 },
      onMove: (state) => {
        // light the belt-bound affordance as the tool nears the threshold
        const near = state.y > HANDOVER_THRESHOLD * 0.55;
        frame.classList.toggle('is-reaching', near && !isHanded[index]);
      },
      onRelease: (state) => {
        frame.classList.remove('is-reaching');
        if (isHanded[index]) return;
        if (state.y > HANDOVER_THRESHOLD) {
          pickedByDrag = true;
          // commit on the next frame so the drag's own release spring (return)
          // doesn't fight the hand-over; we hand over then reset the transform.
          handle.setPosition(0, 0, { animate: false });
          handOver(index);
        }
      },
    });
    cleanups.push(() => handle.destroy());

    // Click / Enter / Space = pick it up straight away (the simple path). The
    // draggable's keydown also toggles a grab on Enter/Space, so we only act on
    // a real click here to avoid double-firing; keyboard users get a dedicated
    // Enter handler that picks up directly and stops the journey-engine Enter.
    tool.addEventListener('click', (e) => {
      if (pickedByDrag) { pickedByDrag = false; return; }
      if (isHanded[index] || activeIndex !== index) return;
      e.preventDefault();
      handOver(index);
    });
    tool.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
      if (isHanded[index] || activeIndex !== index) return;
      e.preventDefault();
      e.stopPropagation(); // don't let the journey engine treat Enter as Next
      handle.setPosition(0, 0, { animate: false });
      handOver(index);
    });
  });

  // Quiet reveal of the active frame's shift rows when the reel scrolls in.
  observeReveals(rootEl);
  observeCounters(rootEl);
  updateBelt();
  layoutReel();

  // Chapter ARRIVAL — assemble the head copy when this step becomes current.
  const runArrival = () => arrival(rootEl);
  rootEl.addEventListener('chapter:arrive', runArrival);
  cleanups.push(() => rootEl.removeEventListener('chapter:arrive', runArrival));
  if (reduced) runArrival();

  return () => cleanups.forEach((fn) => fn && fn());
}
