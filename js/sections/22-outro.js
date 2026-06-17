/**
 * Chapter 09 — outro. The journey's closing step.
 *
 * ART-DIRECTION §7: "the nation disperses; one line remains. Silence and
 * weight — the Martin Lewis quote assembles, the you-dot leaves, a grounded
 * back-cover." ONE focal point (the line), ONE hero motion (the dispersal),
 * everything else quiet.
 *
 * The orchestrated CLOSE plays on every chapter:arrive (a journey step may be
 * revisited) and is idempotent. It is also the step's marquee interaction:
 * pressing Enter/Space on the line replays it, so there is a keyboard path.
 *
 *   beat 0 — the kicker settles.
 *   beat 1 — the Martin Lewis line ASSEMBLES word-by-word (the meaning builds).
 *            As it lands, the nation (the dotField, carrying the you-dot)
 *            begins to disperse: dots rise and release off the top.
 *   beat 2 — the attribution settles last.
 *   beat 3 — the you-dot LEAVES with the nation: it fades as the field rises,
 *            so the visitor's thread merges back into the crowd it travelled.
 *
 * Under reduced motion every beat rests at its final state: the line is shown
 * whole, the attribution present, the field jump-cuts to a calm scatter (no
 * rise), the you-dot stays put.
 *
 * Contract: docs/CONTRACT.md.
 *
 * @param {HTMLElement} rootEl - the <section class="journey-step" id="22-outro"> element
 * @param {{survey: object, segments: object, tgi: object, journey: object}} data
 */
import { prefersReducedMotion } from '../lib/reveal.js';
import { dotField } from '../lib/charts.js';
import { observeParallax } from '../lib/experiential.js';

const DOT_COUNT = 220;
const DOT_COLOUR = 'rgba(238,233,221,0.42)'; // warm cream (--soi-cream) on navy
const DRIFT_AMP = 1; // gentle ambient brownian motion
const RISE_INTERVAL_MS = 2400; // cadence of the ambient upward "release"
const RISE_BATCH = 16; // dots released upward & off each cadence

/* Close-sequence beat timings — slow, embodied pacing, one idea per beat. */
const WORD_STAGGER_MS = 95; // delay between words of the line assembling
const SEQ_KICKER_MS = 140; // the kicker settles first
const SEQ_LINE_MS = 520; // then the line begins to assemble
const SEQ_DISPERSE_MS = 760; // the nation begins to rise as the line lands
const SEQ_DOT_LEAVE_MS = 2600; // the you-dot fades out with the nation

/** A calm full-field scatter of light dots, biased to the lower band so the
 *  line stays readable. Returns normalised {x,y,colour} targets. */
const buildScatter = (count) =>
  Array.from({ length: count }, () => ({
    x: Math.random(),
    y: 0.42 + Math.random() * 0.56, // lower band, below the line
    colour: DOT_COLOUR,
  }));

/** Split the line's text into per-word spans once, preserving the highlighted
 *  word and trailing punctuation, so the line can assemble word-by-word. The
 *  resolved text is read from whatever markup is present (verbatim STORY copy).
 *  Returns the array of word spans. */
const wordifyLine = (lineEl) => {
  if (lineEl.dataset.wordified === '1') {
    return Array.from(lineEl.querySelectorAll('.outro-word'));
  }
  const frag = document.createDocumentFragment();
  const wrapNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      node.textContent.split(/(\s+)/).forEach((chunk) => {
        if (chunk === '') return;
        if (/^\s+$/.test(chunk)) {
          frag.appendChild(document.createTextNode(chunk));
          return;
        }
        const span = document.createElement('span');
        span.className = 'outro-word';
        span.textContent = chunk;
        frag.appendChild(span);
      });
      return;
    }
    // Element node (e.g. the .hl tools span) — wrap it whole as one word.
    const span = document.createElement('span');
    span.className = 'outro-word';
    span.appendChild(node.cloneNode(true));
    frag.appendChild(span);
  };
  Array.from(lineEl.childNodes).forEach(wrapNode);
  lineEl.textContent = '';
  lineEl.appendChild(frag);
  lineEl.dataset.wordified = '1';
  return Array.from(lineEl.querySelectorAll('.outro-word'));
};

/** Fade out the persistent you-dot so the visitor's marker leaves with the
 *  nation. The dot is a single fixed element owned by main.js; we only style
 *  this one transition — never remove or re-create it. main.js re-shows it on
 *  the next step it anchors to. */
const disperseYouDot = () => {
  const dot = document.querySelector('.you-dot');
  if (!dot) return;
  dot.style.transition = 'opacity 1.6s ease, transform 1.6s ease';
  dot.style.opacity = '0';
  dot.style.transform = (dot.style.transform || '') + ' translateY(-40px)';
};

const restoreYouDot = () => {
  const dot = document.querySelector('.you-dot');
  if (!dot) return;
  dot.style.transition = '';
  dot.style.opacity = '';
  dot.style.transform = '';
};

export default function init(rootEl, data) {
  observeParallax(rootEl, { maxShiftPx: 44 });

  const closeEl = rootEl.querySelector('[data-outro-close]');
  const kickerEl = rootEl.querySelector('[data-outro-kicker]');
  const lineEl = rootEl.querySelector('[data-outro-line]');
  const citeEl = rootEl.querySelector('[data-outro-cite]');
  const dotsHost = rootEl.querySelector('[data-outro-dots]');

  const words = lineEl ? wordifyLine(lineEl) : [];
  let field = null;

  /* ── The dotField (the nation) ──────────────────────────────────────── */
  let targets = buildScatter(DOT_COUNT);
  let riseTimer = null;

  const buildField = () => {
    if (field || !dotsHost) return;
    field = dotField(dotsHost, {
      count: DOT_COUNT,
      dotRadius: 2.2,
      ariaLabel:
        'A field of cream dots — the nation — drifting upward and dispersing off the top.',
    });
    // dotField sizes its canvas from the host box at creation; the journey
    // mounts every step display:none (zero box) before showing it, so we build
    // lazily on the first visible frame and nudge a resize to re-measure.
    window.dispatchEvent(new Event('resize'));

    targets = buildScatter(DOT_COUNT);
    field.formation(targets);

    if (prefersReducedMotion()) return; // jump-cut scatter, no drift / rise
    field.drift(DRIFT_AMP);
  };

  /** Begin the upward release: every cadence lift a batch off the top and
   *  re-seed them low, so the field keeps rising without emptying. Immutable —
   *  each tick produces a fresh targets array. */
  const startRise = () => {
    if (riseTimer || prefersReducedMotion() || !field) return;
    // One immediate surge so the dispersal reads instantly as the line lands.
    targets = targets.map((t) => ({ ...t, y: Math.max(-0.12, t.y - 0.26) }));
    field.formation(targets, { spring: 0.05 });

    riseTimer = window.setInterval(() => {
      if (!field) return;
      const startIndex = Math.floor(Math.random() * DOT_COUNT);
      targets = targets.map((t, i) => {
        const inBatch = (i - startIndex + DOT_COUNT) % DOT_COUNT < RISE_BATCH;
        if (inBatch && t.y > 0.04) {
          return { ...t, y: Math.max(-0.1, t.y - 0.42) };
        }
        if (t.y <= 0.04) {
          // re-seed low so the rise is continuous
          return { ...t, x: Math.random(), y: 0.78 + Math.random() * 0.2 };
        }
        return t;
      });
      field.formation(targets);
    }, RISE_INTERVAL_MS);
  };

  const stopRise = () => {
    if (riseTimer) {
      window.clearInterval(riseTimer);
      riseTimer = null;
    }
  };

  /* ── The orchestrated close ─────────────────────────────────────────── */
  let seqTimers = [];
  const clearSeq = () => {
    seqTimers.forEach((t) => window.clearTimeout(t));
    seqTimers = [];
  };
  const later = (fn, ms) => seqTimers.push(window.setTimeout(fn, ms));

  const restToFinal = () => {
    if (kickerEl) kickerEl.classList.add('is-in');
    words.forEach((w) => w.classList.add('is-in'));
    if (lineEl) lineEl.classList.add('is-resolved');
    if (citeEl) citeEl.classList.add('is-in');
    if (closeEl) closeEl.classList.add('is-finished');
  };

  const playSequence = () => {
    clearSeq();
    stopRise();
    restoreYouDot();

    if (prefersReducedMotion()) {
      restToFinal();
      return;
    }

    // Reset to pre-roll so the close re-runs cleanly on re-entry.
    if (kickerEl) kickerEl.classList.remove('is-in');
    words.forEach((w) => w.classList.remove('is-in'));
    if (lineEl) lineEl.classList.remove('is-resolved');
    if (citeEl) citeEl.classList.remove('is-in');
    if (closeEl) closeEl.classList.remove('is-finished');

    // beat 0 — the kicker settles.
    later(() => kickerEl && kickerEl.classList.add('is-in'), SEQ_KICKER_MS);

    // beat 1 — the line assembles word-by-word (the meaning builds).
    later(() => {
      if (lineEl) lineEl.classList.add('is-resolved');
      words.forEach((w, i) => {
        window.setTimeout(() => w.classList.add('is-in'), i * WORD_STAGGER_MS);
      });
    }, SEQ_LINE_MS);

    // the nation begins to disperse as the line lands.
    later(startRise, SEQ_DISPERSE_MS);

    // beat 2 — the attribution settles last, after the line has assembled.
    const citeDelay =
      SEQ_LINE_MS + words.length * WORD_STAGGER_MS + 320;
    later(() => {
      if (citeEl) citeEl.classList.add('is-in');
      if (closeEl) closeEl.classList.add('is-finished');
    }, citeDelay);

    // beat 3 — the you-dot leaves with the nation.
    later(disperseYouDot, SEQ_DOT_LEAVE_MS);
  };

  /* The line is the marquee interaction: replay it from the keyboard. */
  if (lineEl) {
    lineEl.setAttribute('tabindex', '0');
    lineEl.setAttribute('role', 'button');
    lineEl.setAttribute('aria-label', 'Replay the closing line');
    lineEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        playSequence();
      }
    });
    lineEl.addEventListener('click', () => playSequence());
  }

  /* Build the field on first real visibility; gate drift + rise off-screen. */
  if (dotsHost) {
    const visibility = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && dotsHost.getBoundingClientRect().height > 0) {
            buildField();
          }
          if (field) field.drift(entry.isIntersecting ? DRIFT_AMP : 0);
          if (!entry.isIntersecting) stopRise();
        });
      },
      { threshold: 0 }
    );
    visibility.observe(dotsHost);
  }

  // main.js dispatches chapter:arrive whenever this step becomes current.
  rootEl.addEventListener('chapter:arrive', () => playSequence());
}
