/**
 * Chapter 09 — outro. The journey's closing step.
 *
 * JOURNEY: this is the FINAL, narrative step. It does NOT call
 * data.journey.gate(): it is the last step, so the engine renders Next as
 * "Finished" (disabled) and there is nothing to unlock to — gating would have
 * no destination. Instead the step earns its calibre with a single orchestrated
 * CLOSE SEQUENCE that ARRIVES on chapter entry (Blue Marine / Moooi DNA), not a
 * page that appears pre-built:
 *
 *   beat 0 — the headline lines assemble (arrival(), [data-arrival]).
 *   beat 1 — INSTITUTIONS ▸▸▸ INDIVIDUALS resolves: "Institutions" lands,
 *            the arrows sweep rightward in cascade (power flowing), then
 *            "Individuals" settles. As it lands we surge the dotField — a
 *            release of cream dots crosses up into the nation field.
 *   beat 2 — the Martin Lewis quote DECRYPTS into place (scrambleIn /
 *            text-scramble); the attribution fades in after it resolves.
 *   beat 3 — the persistent you-dot DISPERSES with the nation: it fades as
 *            the field rises, so the visitor's marker merges back into the
 *            crowd it travelled through.
 *
 * Re-entering the step replays the sequence (a journey step may be revisited).
 * Under reduced motion every beat rests at its final, fully-assembled state:
 * the resolve line is shown whole, the quote is its plain text, the dotField
 * jump-cuts to its scatter with no drift / rise, the you-dot stays put.
 *
 * Ambient: a field of ~200 paper dots drifts and rises upward — the "nation
 * released". observeParallax drifts the bear-world motif, orbit rings, figure
 * mark and maze at different speeds for depth.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="09-outro"> element
 * @param {{survey: object, segments: object, tgi: object, journey: object}} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';
import { observeParallax, scrambleIn } from '../lib/experiential.js';

const DOT_COUNT = 200;
const DOT_COLOUR = 'rgba(238,233,221,0.4)'; // warm cream dots (--soi-cream) on the navy ground
const DRIFT_AMP = 1; // gentle ambient brownian motion
const RISE_INTERVAL_MS = 2600; // cadence of the ambient upward "release"
const RISE_BATCH = 14; // dots released upward & off each cadence
const RECAP_STAGGER_MS = 90; // delay between recap rows revealing
const RECAP_START_DELAY_MS = 260; // brief settle after the step entrance lands

/* Close-sequence beat timings — slow, embodied pacing (one idea per beat). */
const SEQ_HEAD_MS = 120; // headline lines assemble first
const SEQ_RESOLVE_MS = 620; // then institutions ▸▸▸ individuals lands
const SEQ_QUOTE_MS = 1850; // then the quote decrypts in
const SEQ_CITE_MS = 3050; // attribution follows the resolved quote
const SEQ_DISPERSE_MS = 3400; // the you-dot disperses with the nation
const SEQ_FINISH_MS = 3900; // the journey-complete commit pulse lands last

/** A calm full-field scatter of light dots, biased to the lower band so the
 *  quote and recap stay readable. Returns normalised {x,y,colour} targets. */
const buildScatter = (count) =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: 0.34 + Math.random() * 0.62, // sit in the lower two-thirds, below the quote
    colour: DOT_COLOUR,
  }));

/** Swap the animated maze GIF for its static first-frame PNG when the user
 *  prefers reduced motion, so the closing brand motif never animates. */
const MAZE_GIF = 'assets/deck/maze-hero.gif';
const MAZE_STATIC = 'assets/deck/maze-hero.png';

/** Reveal the recap rows one after another on step ENTRY. A journey step is
 *  shown all at once and its scroll lives inside the step element, so a
 *  scroll-driven reveal could strand the rows hidden — stagger on a timer
 *  instead. Reduced motion jump-cuts every row to its final state. */
const wireRecapStagger = (rootEl) => {
  const list = rootEl.querySelector('[data-recap]');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.outro-recap-item'));
  if (!rows.length) return;

  // The "N / 5 equipped" tally ticks up one per row as the toolkit assembles,
  // and the line lights (is-complete) on the fifth — the finish flourish.
  const progress = rootEl.querySelector('[data-recap-progress]');
  const countEl = rootEl.querySelector('[data-recap-count]');
  const land = (i) => {
    rows[i].classList.add('is-in');
    if (countEl) countEl.textContent = String(i + 1);
    if (progress && i === rows.length - 1) progress.classList.add('is-complete');
  };

  if (prefersReducedMotion()) {
    rows.forEach((_, i) => land(i));
    return;
  }

  if (countEl) countEl.textContent = '0';
  if (progress) progress.classList.remove('is-complete');
  rows.forEach((row, i) => {
    row.classList.remove('is-in');
    window.setTimeout(
      () => land(i),
      RECAP_START_DELAY_MS + i * RECAP_STAGGER_MS
    );
  });
};

/** Fade out the persistent you-dot so the visitor's marker disperses with the
 *  nation. The dot is a single fixed element owned by main.js (.you-dot.is-live
 *  -> opacity .92); dropping its opacity to 0 reads as it merging back into the
 *  crowd. We never remove or re-create it — we only style this one transition,
 *  and main.js re-shows it on the next step it anchors to. */
const disperseYouDot = () => {
  const dot = document.querySelector('.you-dot');
  if (!dot) return;
  dot.style.transition = 'opacity 1.4s ease, transform 1.4s ease';
  dot.style.opacity = '0';
};

export default function init(rootEl, data) {
  observeReveals(rootEl);

  const maze = rootEl.querySelector('.outro-maze-img');
  if (maze && prefersReducedMotion()) {
    maze.src = MAZE_STATIC;
  }

  observeParallax(rootEl, { maxShiftPx: 56 });

  /* ── The close-sequence elements ───────────────────────────────────── */
  const headLines = Array.from(rootEl.querySelectorAll('[data-arrival]'));
  const closeEl = rootEl.querySelector('[data-outro-close]');
  const resolve = rootEl.querySelector('[data-outro-resolve]');
  const quoteEl = rootEl.querySelector('[data-resolve-quote]');
  const citeEl = rootEl.querySelector('[data-resolve-cite]');

  // The quote's resolved string is preserved so re-runs always decrypt to the
  // same text (scrambleIn stores it too; we keep our own copy for resets).
  const quoteText = quoteEl ? quoteEl.textContent : '';

  const dotsHost = rootEl.querySelector('[data-outro-dots]');
  let field = null;

  /* Build the dotField lazily on first real visibility — see note below. */
  const buildField = () => {
    if (field) return;
    field = dotField(dotsHost, {
      count: DOT_COUNT,
      dotRadius: 2.2,
      ariaLabel: 'A field of paper-coloured dots drifting upward and off, a nation released.',
    });
    // The field measured itself during creation; ensure it matches the host's
    // freshly laid-out box (dotField recomputes on a window resize event).
    window.dispatchEvent(new Event('resize'));

    let targets = buildScatter(DOT_COUNT);
    field.formation(targets);

    if (prefersReducedMotion()) return; // jump-cut scatter, no drift / rise

    field.drift(DRIFT_AMP); // the must-have ambient drift

    // Subtle "release": periodically lift a batch of dots up and off the top,
    // then re-seed them low so the field keeps drifting upward without
    // emptying. Immutable — each tick produces a fresh targets array.
    const releaseTick = () => {
      const startIndex = Math.floor(Math.random() * DOT_COUNT);
      targets = targets.map((t, i) => {
        const inBatch = (i - startIndex + DOT_COUNT) % DOT_COUNT < RISE_BATCH;
        if (inBatch && t.y > 0.05) {
          return { ...t, y: Math.max(-0.08, t.y - 0.4) };
        }
        if (t.y <= 0.05) {
          return { ...t, x: Math.random(), y: 0.85 + Math.random() * 0.13 };
        }
        return t;
      });
      field.formation(targets);
    };

    window.setInterval(releaseTick, RISE_INTERVAL_MS);

    // A one-shot upward SURGE the close sequence triggers when the resolve
    // beat lands: lift the lower band en masse so the field visibly rises as
    // the power "flows" to the individuals. Immutable; re-seeds afterward.
    field.surge = () => {
      targets = targets.map((t) => ({ ...t, y: Math.max(-0.1, t.y - 0.32) }));
      field.formation(targets, { spring: 0.05 });
      window.setTimeout(() => {
        targets = targets.map((t) =>
          t.y < 0.1
            ? { ...t, x: Math.random(), y: 0.7 + Math.random() * 0.28 }
            : t
        );
        field.formation(targets);
      }, 1400);
    };
  };

  /* ── The orchestrated CLOSE SEQUENCE ───────────────────────────────────
     Plays on each chapter:arrive. Tracks its own timers so a fast re-entry
     cancels the previous run before starting fresh. */
  let seqTimers = [];
  const clearSeq = () => {
    seqTimers.forEach((t) => window.clearTimeout(t));
    seqTimers = [];
  };
  const later = (fn, ms) => seqTimers.push(window.setTimeout(fn, ms));

  const restToFinal = () => {
    headLines.forEach((el) => el.classList.add('is-arrived'));
    if (resolve) resolve.classList.add('is-resolved');
    if (quoteEl) {
      quoteEl.textContent = quoteText;
      quoteEl.classList.add('is-resolved');
    }
    if (citeEl) citeEl.classList.add('is-in');
    if (closeEl) closeEl.classList.add('is-finished');
  };

  const playSequence = () => {
    clearSeq();

    if (prefersReducedMotion()) {
      restToFinal();
      return;
    }

    // Reset to pre-roll so the sequence re-runs cleanly on re-entry.
    headLines.forEach((el) => el.classList.remove('is-arrived'));
    if (resolve) resolve.classList.remove('is-resolved');
    if (quoteEl) {
      quoteEl.classList.remove('is-resolved');
      quoteEl.textContent = ''; // hold blank until the decrypt beat
    }
    if (citeEl) citeEl.classList.remove('is-in');
    if (closeEl) closeEl.classList.remove('is-finished');

    // beat 0 — headline lines assemble in cascade.
    later(() => {
      headLines.forEach((el, i) => {
        window.setTimeout(() => el.classList.add('is-arrived'), i * 90);
      });
    }, SEQ_HEAD_MS);

    // beat 1 — institutions ▸▸▸ individuals resolves; surge the field as it lands.
    later(() => {
      if (resolve) resolve.classList.add('is-resolved');
      if (field && typeof field.surge === 'function') field.surge();
    }, SEQ_RESOLVE_MS);

    // beat 2 — the quote decrypts into place.
    later(() => {
      if (quoteEl) {
        quoteEl.textContent = quoteText;
        quoteEl.classList.add('is-resolved');
        scrambleIn(quoteEl);
      }
    }, SEQ_QUOTE_MS);

    // attribution follows the resolved quote.
    later(() => {
      if (citeEl) citeEl.classList.add('is-in');
    }, SEQ_CITE_MS);

    // beat 3 — the you-dot disperses with the nation.
    later(disperseYouDot, SEQ_DISPERSE_MS);

    // beat 4 — the journey-complete commit pulse: the close lights its centre
    // once as the toolkit lands, a single tactile "finished" flourish.
    later(() => {
      if (closeEl) closeEl.classList.add('is-finished');
    }, SEQ_FINISH_MS);
  };

  // Build on first real visibility; afterward, gate the drift to spare the
  // main thread while the step is off-screen (another journey step is showing).
  // The dotField sizes its canvas from the host box at creation and only
  // re-measures on a window resize; in the journey every step mounts
  // display:none (zero box) before being shown, so we must build lazily on the
  // first visible frame with a real size, then nudge a resize.
  if (dotsHost) {
    const visibility = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && dotsHost.getBoundingClientRect().height > 0) {
          buildField();
        }
        if (field) field.drift(entry.isIntersecting ? DRIFT_AMP : 0);
      });
    }, { threshold: 0 });
    visibility.observe(dotsHost);
  }

  // The recap rows stagger in on entry; the close sequence assembles the rest.
  // main.js dispatches chapter:arrive whenever this step becomes current.
  const onArrive = () => {
    wireRecapStagger(rootEl);
    playSequence();
  };
  rootEl.addEventListener('chapter:arrive', onArrive);
}
