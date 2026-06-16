/**
 * Chapter 09 — outro. The journey's closing step.
 *
 * JOURNEY: this is the FINAL, narrative step, so it does NOT call
 * data.journey.gate(); there is nothing to complete here. The engine renders
 * it as the last step (Next reads "Finished" and is disabled), and the step
 * default-unlocks after the short dwell. No gating wiring is needed.
 *
 * A dark navy full-bleed close (paper-on-navy) that resolves into a grounded
 * mustard back-cover. EXPERIENTIAL motion:
 *   - the [data-enter] bands rest at full strength (--enter:1, CSS default) and
 *     ride the journey's own per-step entrance animation; we do NOT drive them
 *     from scroll (a journey step is shown all at once, not scrolled into view,
 *     so a scroll-progress reveal would leave above-the-fold copy permanently
 *     dimmed).
 *   - observeParallax drifts the deck bear-world motif, the orbit rings, the
 *     figure mark and the maze at different speeds for depth.
 *   - the five-move recap rows stagger in on step ENTRY (not on scroll): a
 *     journey step is shown all at once and any internal scroll lives inside
 *     the step element, not the window scrollScene listens to — so a
 *     scroll-driven reveal would risk leaving the recap rows permanently
 *     hidden. We reveal them on a short timer instead.
 * Ambient: a field of ~200 paper dots drifts and disperses upward — the
 * "nation released". Under reduced motion the dotField jump-cuts to its final
 * scatter, parallax is disabled, and nothing animates. All copy is static.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="09-outro"> element
 * @param {{survey: object, segments: object, tgi: object, journey: object}} data
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';
import { observeParallax } from '../lib/experiential.js';

const DOT_COUNT = 200;
const DOT_COLOUR = 'rgba(238,233,221,0.4)'; // warm cream dots (--soi-cream) on the navy ground
const DRIFT_AMP = 1; // gentle ambient brownian motion
const RISE_INTERVAL_MS = 2600; // cadence of the upward "release"
const RISE_BATCH = 14; // dots released upward & off each cadence
const RECAP_STAGGER_MS = 90; // delay between recap rows revealing

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

const RECAP_START_DELAY_MS = 260; // brief settle after the step entrance lands

/** Reveal the recap rows one after another on step ENTRY. A journey step is
 *  shown all at once and its scroll lives inside the step element, so a
 *  scroll-driven reveal could strand the rows hidden — stagger on a timer
 *  instead. Reduced motion jump-cuts every row to its final state. */
const wireRecapStagger = (rootEl) => {
  const list = rootEl.querySelector('[data-recap]');
  if (!list) return;
  const rows = Array.from(list.querySelectorAll('.outro-recap-item'));
  if (!rows.length) return;

  if (prefersReducedMotion()) {
    rows.forEach((row) => row.classList.add('is-in'));
    return;
  }

  rows.forEach((row, i) => {
    window.setTimeout(
      () => row.classList.add('is-in'),
      RECAP_START_DELAY_MS + i * RECAP_STAGGER_MS
    );
  });
};

export default function init(rootEl, data) {
  observeReveals(rootEl);

  const maze = rootEl.querySelector('.outro-maze-img');
  if (maze && prefersReducedMotion()) {
    maze.src = MAZE_STATIC;
  }

  // Gentle depth parallax (the [data-enter] bands rest at full strength via
  // their CSS default --enter:1 — see the header note; no scroll-driven reveal).
  observeParallax(rootEl, { maxShiftPx: 56 });
  wireRecapStagger(rootEl);

  const dotsHost = rootEl.querySelector('[data-outro-dots]');
  if (!dotsHost) return;

  // The dotField sizes its canvas from the host's box at creation and only
  // re-measures on a window resize. In the journey, every step is mounted
  // display:none (zero box) before it is shown, so building the field at
  // init() would bake a 1×1 canvas that then stretches a flat cream wash over
  // the navy ground. We therefore build the field lazily on the FIRST visible
  // frame where the host has a real size, then nudge a resize so the canvas
  // matches the now-laid-out step. buildField() runs at most once.
  let field = null;

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
          // drift this dot upward toward / past the top edge
          return { ...t, y: Math.max(-0.08, t.y - 0.4) };
        }
        if (t.y <= 0.05) {
          // re-seed a risen dot low again to keep the field populated
          return { ...t, x: Math.random(), y: 0.85 + Math.random() * 0.13 };
        }
        return t;
      });
      field.formation(targets);
    };

    window.setInterval(releaseTick, RISE_INTERVAL_MS);
  };

  // Build on first real visibility; afterward, gate the drift to spare the
  // main thread while the step is off-screen (another journey step is showing).
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
