/**
 * Chapter 09 — outro.
 *
 * Dark navy full-bleed closing surface (paper-on-navy) that resolves into a
 * grounded mustard back-cover. A field of ~200 paper-coloured dots drifts and
 * slowly disperses upward and off — the "nation released" motif. Motion is the
 * must-have ambient drift; under reduced motion the dotField jump-cuts to its
 * final scatter and nothing else animates. All copy is static in the HTML.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="chapter" id="09-outro"> element
 * @param {{survey: object, segments: object, tgi: object}} data - shared datasets
 */
import { observeReveals, prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';

const DOT_COUNT = 200;
const DOT_COLOUR = 'rgba(238,233,221,0.4)'; // warm cream dots (--soi-cream) on the navy ground
const DRIFT_AMP = 1; // gentle ambient brownian motion
const RISE_INTERVAL_MS = 2600; // cadence of the upward "release"
const RISE_BATCH = 14; // dots released upward & off each cadence

/** A calm full-field scatter of light dots, biased to the lower band so the
 *  quote and recap stay readable. Returns normalised {x,y,colour} targets. */
const buildScatter = (count) =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: 0.34 + Math.random() * 0.62, // sit in the lower two-thirds, below the quote
    colour: DOT_COLOUR,
  }));

export default function init(rootEl, data) {
  observeReveals(rootEl);

  const dotsHost = rootEl.querySelector('[data-outro-dots]');
  if (!dotsHost) return;

  const field = dotField(dotsHost, {
    count: DOT_COUNT,
    dotRadius: 2.2,
    ariaLabel: 'A field of paper-coloured dots drifting upward and off, a nation released.',
  });

  let targets = buildScatter(DOT_COUNT);
  field.formation(targets);

  if (prefersReducedMotion()) return; // jump-cut scatter, no drift / rise

  field.drift(DRIFT_AMP); // the must-have ambient drift

  // Subtle "release": periodically lift a batch of dots up and off the top,
  // then re-seed them low so the field keeps drifting upward without emptying.
  // Immutable — each tick produces a fresh targets array.
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

  // Stop work when the chapter scrolls out of view to spare the main thread.
  const visibility = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      field.drift(entry.isIntersecting ? DRIFT_AMP : 0);
    });
  }, { threshold: 0 });
  visibility.observe(dotsHost);
}
