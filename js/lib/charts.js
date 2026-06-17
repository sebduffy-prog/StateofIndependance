/**
 * charts.js — pure-SVG + canvas chart factories for The State of Independence.
 *
 * House style: flat colour, square corners, TRANSPARENT chart background
 * (charts sit directly on the page ground — no white/paper card behind
 * them), high-contrast NAVY components + navy text by default so marks
 * read on warm amber/mustard grounds. Tracks are a faint ink tint, never
 * a white box. Bold, large value labels inline at the bar end (never a
 * boxed legend), tabular numbers. No pie/donut.
 *
 * Ground awareness: every factory accepts `onNavy: true` (or
 * `accent: 'cream'`) to flip components + text to cream/white for dark
 * navy grounds. The accent param still works ('navy'|'teal'|'mustard'|
 * 'cream') but defaults to navy. All factories respect
 * prefers-reduced-motion by jump-cutting to the final state.
 *
 * Exports:
 *   horizontalBars(container, opts)  -> { update, el }
 *   waffleGrid(container, opts)      -> { setValue, el }
 *   barGauge(container, opts)        -> { el }
 *   slopeChart(container, opts)      -> { el }
 *   lollipopChart(container, opts)   -> { el }
 *   dotPlot(container, opts)         -> { el }
 *   proportionStrip(container, opts) -> { update, el }
 *   radialGauge(container, opts)     -> { el }
 *   orbitRingChart(container, opts)  -> { el }
 *   tugOfWar(container, opts)        -> { update, el }
 *   dotField(container, opts)        -> { formation, highlight, drift,
 *                                         setPointer, destroy, el }
 *   clusterPoints(n, rect)           -> [{x,y}]
 *
 * Colour tokens are read from CSS custom properties so the brand sheet
 * stays the single source of truth.
 */

import { prefersReducedMotion } from './reveal.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const cssVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};

const palette = () => ({
  mustard: cssVar('--mustard', '#FFC931'),
  mustardDark: cssVar('--mustard-dark', '#FF8812'),
  mustardLight: cssVar('--mustard-light', '#FFEDBB'),
  mustardPale: cssVar('--mustard-pale', '#FFF9E2'),
  teal: cssVar('--teal', '#80E8E3'),
  tealDeep: cssVar('--teal-deep', '#00BCA5'),
  // Signature navy is the high-contrast default on warm grounds.
  navy: cssVar('--soi-navy', '#0A1A5C'),
  ink: cssVar('--ink', '#000000'),
  cream: cssVar('--soi-cream', '#EEE9DD'),
  paper: cssVar('--paper', '#FFFFFF'),
});

// Faint ink/navy tint used for chart tracks/baselines — NEVER a white box.
const TRACK_TINT = 'rgba(0,0,0,0.08)';
// Faint cream tint for tracks on dark navy grounds.
const TRACK_TINT_ON_NAVY = 'rgba(255,255,255,0.14)';

/**
 * Resolve an accent token name to its flat fill colour.
 * Navy is the high-contrast default so components never vanish on warm
 * amber/mustard grounds. `'cream'` switches to cream for use on dark navy.
 */
const accentColour = (c, accent) => {
  if (accent === 'teal') return c.tealDeep;
  if (accent === 'mustard') return c.mustard;
  if (accent === 'cream') return c.cream;
  return c.navy;
};

/**
 * Per-chart ground awareness. `onNavy` (or accent === 'cream') flips
 * component + text colours to cream/white for dark navy grounds; the
 * default is navy components + navy text for warm amber grounds.
 * Returns { component, text, track, baselineOpacity }.
 */
const groundScheme = (c, { accent, onNavy } = {}) => {
  const isDark = onNavy === true || accent === 'cream';
  if (isDark) {
    return {
      component: accentColour(c, accent === 'cream' ? 'cream' : (accent || 'cream')),
      text: c.cream,
      track: TRACK_TINT_ON_NAVY,
      stroke: c.cream,
    };
  }
  return {
    component: accentColour(c, accent),
    text: c.navy,
    track: TRACK_TINT,
    stroke: c.navy,
  };
};

const el = (tag, attrs = {}) => {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const fmtPct = (value, decimals = 0) =>
  `${value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/* ─────────────────── end-anchored label fitting ────────────────────
 * Right-aligned category labels (text-anchor:end at x = availWidth) crop
 * their LEADING characters when the text is wider than availWidth, because
 * the overflow runs off to x < 0. This helper guarantees the full label is
 * always visible: it first shrinks the font-size toward a floor, and if the
 * label still doesn't fit it wraps onto two lines (each line independently
 * fitted). Leading characters can therefore never be clipped.
 *
 * Works at the library level so every caller (segments, 04 baselines,
 * data-explorer) is fixed without touching their option APIs.
 *
 * `label` is an SVG <text> node already appended to the DOM with its final
 * text content, x, text-anchor:end and baseline set. `baseFontSize` is the
 * design size; `minFontSize` is the smallest we will shrink to before
 * wrapping. We measure with getComputedTextLength(), guarding the case where
 * the node isn't laid out yet (e.g. display:none) — in which case we leave
 * the label untouched and re-fit on first view.
 */
const LABEL_MIN_FONT = 11;

const measureText = (node) => {
  try {
    return node.getComputedTextLength();
  } catch {
    return 0;
  }
};

/** Greedy word-wrap of `text` into up to `maxLines` lines that each fit
 *  `availWidth` at the node's current font-size. Returns array of strings;
 *  the final line may still overflow if a single word is too long. */
const wrapToLines = (probe, text, availWidth, maxLines) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    probe.textContent = candidate;
    if (measureText(probe) <= availWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  // Push remaining words (joined) onto the last allowed line.
  const used = lines.join(' ');
  const remaining = text.slice(used.length).trim();
  if (remaining) lines.push(remaining);
  return lines.slice(0, maxLines);
};

/**
 * Fit an end-anchored label into `availWidth`. Mutates only presentational
 * attributes of the given node (font-size) and, when wrapping is needed,
 * replaces its text with <tspan> lines. Never changes the label's value.
 *
 * @param {SVGTextElement} label  text node, anchored end, x already set
 * @param {number} availWidth     px of room to the left of the anchor
 * @param {number} baseFontSize   design font size
 * @param {object} [opts]
 * @param {number} [opts.minFont] floor before wrapping (default LABEL_MIN_FONT)
 * @param {number} [opts.cy]      vertical centre (for two-line balancing)
 */
const fitEndLabel = (label, availWidth, baseFontSize, opts = {}) => {
  const minFont = opts.minFont != null ? opts.minFont : LABEL_MIN_FONT;
  // Cache the original text on first fit: once wrapped into tspans, reading
  // textContent would lose the inter-line whitespace, so we re-read the cache
  // on every subsequent re-fit (e.g. after an update()).
  if (label.dataset.fullLabel == null) {
    label.dataset.fullLabel = label.textContent || '';
  }
  const fullText = label.dataset.fullLabel;
  if (!fullText || availWidth <= 0) return;

  // Reset to the design size, single line, before measuring. Restore the
  // central baseline in case a previous fit wrapped this node into tspans.
  label.setAttribute('font-size', baseFontSize);
  label.setAttribute('dominant-baseline', 'central');
  label.textContent = fullText;
  const fullWidth = measureText(label);
  if (fullWidth === 0) return; // not laid out yet; caller re-fits on view
  if (fullWidth <= availWidth) return; // already fits at full size

  // 1) Try shrinking the font so the whole label fits on one line, but not
  //    below the readable floor.
  const shrunk = Math.max(minFont, baseFontSize * (availWidth / fullWidth));
  label.setAttribute('font-size', shrunk);
  if (measureText(label) <= availWidth) return; // fits on one line, shrunk

  // 2) Still too wide at the floor → wrap onto two lines at the floor size.
  label.setAttribute('font-size', minFont);
  const lines = wrapToLines(label, fullText, availWidth, 2);
  if (lines.length <= 1) {
    // Single unsplittable word: leave it at the floor size (best effort) —
    // it stays right-anchored so its leading chars remain visible.
    label.textContent = lines[0] || fullText;
    return;
  }

  // Render the wrapped lines as tspans, vertically centred on the row.
  const x = label.getAttribute('x');
  const cy = opts.cy != null ? opts.cy : Number(label.getAttribute('y')) || 0;
  const lineH = minFont * 1.05;
  // First line baseline so the multi-line block is vertically centred on cy.
  const firstY = cy - ((lines.length - 1) * lineH) / 2;
  label.textContent = '';
  label.setAttribute('dominant-baseline', 'central');
  lines.forEach((line, i) => {
    const tspan = el('tspan', {
      x,
      y: firstY + i * lineH,
      'dominant-baseline': 'central',
    });
    tspan.textContent = line;
    label.append(tspan);
  });
};

/** Fit every end-anchored label in `labelMeta` once the SVG is laid out.
 *  Re-runs on first intersection so labels measured while hidden still fit. */
const fitLabelsWhenReady = (svg, labelMeta) => {
  const run = () => labelMeta.forEach((m) =>
    fitEndLabel(m.node, m.availWidth, m.baseFont, { cy: m.cy }));
  // Try immediately (covers already-visible charts).
  run();
  // Re-fit on first view in case it was hidden/zero-width at build time.
  if (typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        run();
        obs.disconnect();
      });
    }, { threshold: 0 });
    io.observe(svg);
  }
};

/**
 * Tween a numeric value with rAF, calling onStep(value) each frame.
 * Jump-cuts under reduced motion. Returns a cancel function.
 */
const tween = (from, to, durationMs, onStep, onDone) => {
  if (prefersReducedMotion() || durationMs <= 0) {
    onStep(to);
    onDone && onDone();
    return () => {};
  }
  let raf = 0;
  const start = performance.now();
  const frame = (now) => {
    const p = Math.min((now - start) / durationMs, 1);
    onStep(from + (to - from) * easeOutCubic(p));
    if (p < 1) raf = requestAnimationFrame(frame);
    else onDone && onDone();
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
};

/* ───────────────────────── horizontal bars ─────────────────────────
 * opts: {
 *   items: [{ id?, label, pct }],
 *   max?:  number (default 100),
 *   accent?: 'mustard' | 'teal',     // bar fill
 *   decimals?: number,
 *   highlightId?: string,            // one bar drawn ink-filled
 *   animate?: boolean (default true),
 *   barHeight?: number, gap?: number, labelWidth?: number (px)
 * }
 * Returns { update(newItems, {resort}), el }.
 */
export const horizontalBars = (container, opts) => {
  const c = palette();
  const {
    accent = 'navy',
    onNavy = false,
    decimals = 0,
    highlightId = null,
    animate = true,
    barHeight = 30,
    gap = 12,
    labelWidth = 200,
    showValues = true,   // when false, the numeric value label is omitted
  } = opts;

  // Chart max can be updated per-redraw (tightens to the data so bars fill
  // the track instead of stranding right-side dead space). Defaults to 100.
  let max = opts.max != null ? opts.max : 100;

  const scheme = groundScheme(c, { accent, onNavy });
  const valueX = labelWidth + 12;
  const rightPad = 56;
  const width = 720;
  const trackWidth = width - valueX - rightPad;
  const fillColour = scheme.component;
  const textColour = scheme.text;
  // Highlight must be distinct from the default bar: pure ink on warm
  // grounds (darker than navy), bright teal on dark navy grounds.
  const isDark = onNavy === true || accent === 'cream';
  const highlightColour = isDark ? c.tealDeep : c.ink;

  const LABEL_FONT = 15;
  let items = opts.items.slice();
  const rowFor = new Map();
  // Collected so every end-anchored label can be fitted (shrink → wrap)
  // after layout, so long categories never crop their leading characters.
  const labelMeta = [];

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${items.length * (barHeight + gap)}`,
    width: '100%',
    role: 'img',
    'aria-label': opts.ariaLabel || 'Bar chart',
    preserveAspectRatio: 'xMinYMin meet',
  });
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';
  // Allow a label that runs slightly longer than labelWidth to spill into the
  // left margin rather than being hard-clipped at the viewBox edge.
  svg.style.overflow = 'visible';

  const buildRow = (item, index) => {
    const y = index * (barHeight + gap);
    const g = el('g', { transform: `translate(0 ${y})` });

    const label = el('text', {
      x: labelWidth,
      y: barHeight / 2,
      'text-anchor': 'end',
      'dominant-baseline': 'central',
      fill: textColour,
      'font-size': LABEL_FONT,
      'font-weight': 600,
      'font-family': cssVar('--font-sans', 'Inter Tight, sans-serif'),
    });
    label.textContent = item.label;
    // Leave a small gutter so the longest label keeps clear of the track.
    labelMeta.push({ node: label, availWidth: labelWidth - 4, baseFont: LABEL_FONT, cy: barHeight / 2 });

    // Track is a faint ink/cream tint, never a white box, no border.
    const track = el('rect', {
      x: valueX, y: 0, width: trackWidth, height: barHeight,
      fill: scheme.track,
    });

    const isHi = highlightId && item.id === highlightId;
    const bar = el('rect', {
      x: valueX, y: 0, width: 0, height: barHeight,
      fill: isHi ? highlightColour : fillColour,
    });

    const value = showValues ? el('text', {
      x: valueX, y: barHeight / 2,
      'dominant-baseline': 'central',
      fill: textColour, 'font-size': 16, 'font-weight': 700,
      'font-family': cssVar('--font-sans', 'Inter Tight, sans-serif'),
      style: 'font-variant-numeric: tabular-nums;',
    }) : null;
    if (value) value.textContent = fmtPct(0, decimals);

    g.append(label, track, bar);
    if (value) g.append(value);
    svg.append(g);

    const render = (pct) => {
      const w = Math.max(0, (pct / max) * trackWidth);
      bar.setAttribute('width', w);
      if (value) {
        value.setAttribute('x', valueX + w + 8);
        value.textContent = fmtPct(pct, decimals);
      }
    };
    return { g, render, current: 0, y };
  };

  const draw = (animateThis) => {
    svg.setAttribute('viewBox', `0 0 ${width} ${items.length * (barHeight + gap)}`);
    items.forEach((item, index) => {
      let row = rowFor.get(item.id ?? item.label);
      if (!row) {
        row = buildRow(item, index);
        rowFor.set(item.id ?? item.label, row);
      } else {
        row.g.setAttribute('transform', `translate(0 ${index * (barHeight + gap)})`);
      }
      const target = item.pct;
      if (animateThis && animate) {
        tween(row.current, target, 900, (v) => row.render(v));
      } else {
        row.render(target);
      }
      row.current = target;
    });
    // remove rows no longer present
    const liveKeys = new Set(items.map((i) => i.id ?? i.label));
    for (const [key, row] of rowFor) {
      if (!liveKeys.has(key)) { row.g.remove(); rowFor.delete(key); }
    }
    // Fit all end-anchored labels (shrink, then wrap) so long categories
    // such as "separated/divorced/widowed" never crop on the left.
    fitLabelsWhenReady(svg, labelMeta);
  };

  container.append(svg);

  // Draw when first scrolled into view (so the animation is seen).
  if (animate && !prefersReducedMotion()) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        draw(true);
        obs.disconnect();
      });
    }, { threshold: 0.25 });
    io.observe(svg);
  } else {
    draw(false);
  }

  return {
    el: svg,
    update(newItems, { resort = false, max: nextMax } = {}) {
      if (nextMax != null) max = nextMax;
      items = resort
        ? newItems.slice().sort((a, b) => b.pct - a.pct)
        : newItems.slice();
      draw(true);
    },
  };
};

/* ───────────────────────── waffle grid ─────────────────────────────
 * 10x10 grid where each square = 1 in 100. Fills `value` squares.
 * opts: { value, total?=100, accent?='mustard', square?=26, gap?=6,
 *         ariaLabel? }
 * Returns { setValue(v, {animate}), el }.
 */
export const waffleGrid = (container, opts) => {
  const c = palette();
  const { total = 100, accent = 'navy', onNavy = false, square = 26, gap = 6 } = opts;
  const cols = 10;
  const rows = Math.ceil(total / cols);
  const scheme = groundScheme(c, { accent, onNavy });
  const fillColour = scheme.component;
  const emptyFill = scheme.track; // faint tint, never a white box
  const size = cols * square + (cols - 1) * gap;

  const svg = el('svg', {
    viewBox: `0 0 ${size} ${rows * square + (rows - 1) * gap}`,
    width: '100%',
    role: 'img',
    'aria-label': opts.ariaLabel || `${opts.value} in ${total}`,
    preserveAspectRatio: 'xMidYMid meet',
  });
  svg.style.maxWidth = `${size}px`;
  svg.style.height = 'auto';

  const cells = [];
  for (let i = 0; i < total; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const rect = el('rect', {
      x: col * (square + gap),
      y: row * (square + gap),
      width: square, height: square,
      fill: emptyFill,
    });
    svg.append(rect);
    cells.push(rect);
  }
  container.append(svg);

  let currentFilled = 0;
  const paint = (filled) => {
    const n = Math.round(filled);
    cells.forEach((rect, i) => {
      rect.setAttribute('fill', i < n ? fillColour : emptyFill);
    });
  };

  const setValue = (value, { animate = true } = {}) => {
    const targetFilled = Math.round((value / total) * total);
    svg.setAttribute('aria-label', `${Math.round(value)} in ${total}`);
    if (!animate || prefersReducedMotion()) {
      paint(targetFilled);
      currentFilled = targetFilled;
      return;
    }
    // staggered fill/drain
    const step = targetFilled >= currentFilled ? 1 : -1;
    let n = currentFilled;
    const total2 = Math.abs(targetFilled - currentFilled) || 1;
    const perStep = Math.max(8, Math.floor(420 / total2));
    const tick = () => {
      if (n === targetFilled) { currentFilled = targetFilled; return; }
      n += step;
      paint(n);
      setTimeout(tick, perStep);
    };
    tick();
  };

  if (opts.value != null) {
    // fill on first view
    if (prefersReducedMotion()) {
      setValue(opts.value, { animate: false });
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          setValue(opts.value, { animate: true });
          obs.disconnect();
        });
      }, { threshold: 0.3 });
      io.observe(svg);
    }
  }

  return { el: svg, setValue };
};

/* ───────────────────────── bar gauge ───────────────────────────────
 * A flat horizontal gauge for a single score out of `max` (e.g. NHS
 * 6.42 / 10). Square corners, ink scale, mustard fill.
 * opts: { value, max?=10, accent?='mustard', ariaLabel? }
 */
export const barGauge = (container, opts) => {
  const c = palette();
  const { value, max = 10, accent = 'navy', onNavy = false } = opts;
  const width = 420;
  const height = 44;
  const scheme = groundScheme(c, { accent, onNavy });
  const fillColour = scheme.component;
  const textColour = scheme.text;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height + 24}`,
    width: '100%',
    role: 'img',
    'aria-label': opts.ariaLabel || `${value} out of ${max}`,
    preserveAspectRatio: 'xMinYMin meet',
  });
  svg.style.maxWidth = `${width}px`;
  svg.style.height = 'auto';

  // Track: faint tint, never a white box, no border.
  svg.append(el('rect', { x: 0, y: 0, width, height, fill: scheme.track }));
  const fill = el('rect', { x: 0, y: 0, width: 0, height, fill: fillColour });
  svg.append(fill);

  // tick marks per unit (faint component-coloured ticks)
  for (let i = 1; i < max; i += 1) {
    const x = (i / max) * width;
    svg.append(el('line', {
      x1: x, y1: height - 10, x2: x, y2: height,
      stroke: scheme.stroke, 'stroke-width': 1, opacity: 0.35,
    }));
  }
  const label = el('text', {
    x: 0, y: height + 18, fill: textColour,
    'font-size': 16, 'font-weight': 700,
    'font-family': cssVar('--font-sans', 'Inter Tight, sans-serif'),
    style: 'font-variant-numeric: tabular-nums;',
  });
  svg.append(label);
  container.append(svg);

  const render = (v) => {
    fill.setAttribute('width', (v / max) * width);
    label.textContent = `${v.toFixed(2)} / ${max}`;
  };

  if (prefersReducedMotion()) {
    render(value);
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        tween(0, value, 1100, render);
        obs.disconnect();
      });
    }, { threshold: 0.4 });
    io.observe(svg);
  }
  return { el: svg };
};

/* ───────────────── shared helpers for new factories ──────────────── */

const SANS = () => cssVar('--font-sans', 'Inter Tight, sans-serif');
const TAB_NUMS = 'font-variant-numeric: tabular-nums;';

/** Build an SVG <text> node with house defaults; `text` sets content. */
const textNode = (attrs, text) => {
  const node = el('text', { 'font-family': SANS(), fill: attrs.fill || '#000', ...attrs });
  if (text != null) node.textContent = text;
  return node;
};

/** Run a draw fn on first view (or immediately under reduced motion). */
const onFirstView = (node, drawAnimated, drawStatic, threshold = 0.3) => {
  if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
    drawStatic();
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      drawAnimated();
      obs.disconnect();
    });
  }, { threshold });
  io.observe(node);
};

const svgRoot = (width, height, ariaLabel, maxWidthPx) => {
  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height}`,
    width: '100%',
    role: 'img',
    'aria-label': ariaLabel || 'Chart',
    preserveAspectRatio: 'xMinYMin meet',
  });
  svg.style.maxWidth = maxWidthPx ? `${maxWidthPx}px` : '100%';
  svg.style.height = 'auto';
  return svg;
};

/* ───────────────────────── slope chart ─────────────────────────────
 * Two-column slope / parallel-coordinates lines: each item draws a line
 * from its `from` value (left axis) to its `to` value (right axis).
 * Good for "less to more" or before/after movement.
 * opts: { items:[{label, from, to}], max?, accent?, ariaLabel? }
 * Returns { el }.
 */
export const slopeChart = (container, opts) => {
  const c = palette();
  const { items, max = 100, accent = 'navy', onNavy = false } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const stroke = scheme.component;
  const textColour = scheme.text;
  const width = 520;
  const padTop = 28;
  const padBottom = 12;
  const plotH = 220;
  const leftX = 150;
  const rightX = width - 150;
  const height = padTop + plotH + padBottom;

  const svg = svgRoot(width, height, opts.ariaLabel || 'Slope chart', width);
  const yFor = (v) => padTop + plotH - (Math.min(v, max) / max) * plotH;

  // axes (faint component-coloured tint)
  [leftX, rightX].forEach((x) => {
    svg.append(el('line', {
      x1: x, y1: padTop, x2: x, y2: padTop + plotH,
      stroke: scheme.stroke, 'stroke-width': 1, opacity: 0.3,
    }));
  });

  const lines = [];
  items.forEach((item) => {
    const y1 = yFor(item.from);
    const y2 = yFor(item.to);
    const line = el('line', {
      x1: leftX, y1, x2: leftX, y2: y1, // start flat, animate to y2/rightX
      stroke, 'stroke-width': 2.5,
    });
    svg.append(line);
    [{ x: leftX, y: y1, dx: -10, v: item.from },
     { x: rightX, y: y2, dx: 10, v: item.to }].forEach((p, idx) => {
      svg.append(el('circle', { cx: p.x, cy: p.y, r: 4.5, fill: stroke }));
      if (idx === 0) {
        svg.append(textNode({
          x: p.x + p.dx - 14, y: p.y, 'text-anchor': 'end',
          'dominant-baseline': 'central', fill: textColour, 'font-size': 14,
          'font-weight': 600,
        }, item.label));
      }
      svg.append(textNode({
        x: p.x + p.dx, y: p.y, 'text-anchor': idx === 0 ? 'end' : 'start',
        'dominant-baseline': 'central', fill: textColour, 'font-size': 15,
        'font-weight': 700, style: TAB_NUMS,
      }, fmtPct(p.v, 0)));
    });
    lines.push({ line, y1, y2 });
  });

  container.append(svg);
  const drawStatic = () => lines.forEach((l) => {
    l.line.setAttribute('x2', rightX);
    l.line.setAttribute('y2', l.y2);
  });
  const drawAnimated = () => lines.forEach((l) => {
    tween(0, 1, 900, (p) => {
      l.line.setAttribute('x2', leftX + (rightX - leftX) * p);
      l.line.setAttribute('y2', l.y1 + (l.y2 - l.y1) * p);
    });
  });
  onFirstView(svg, drawAnimated, drawStatic, 0.25);

  return { el: svg };
};

/* ───────────────────────── lollipop chart ──────────────────────────
 * Stem + dot per item (lighter than a full bar).
 * opts: { items:[{id?, label, pct}], max?, accent?, highlightId?, ariaLabel? }
 * Returns { el }.
 */
export const lollipopChart = (container, opts) => {
  const c = palette();
  const { items, max = 100, accent = 'navy', onNavy = false, highlightId = null } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const dotColour = scheme.component;
  const textColour = scheme.text;
  const isDark = onNavy === true || accent === 'cream';
  const highlightColour = isDark ? c.tealDeep : c.ink;
  const width = 720;
  const rowH = 38;
  const labelWidth = 200;
  const valueX = labelWidth + 12;
  const rightPad = 56;
  const trackW = width - valueX - rightPad;
  const height = items.length * rowH;

  const svg = svgRoot(width, height, opts.ariaLabel || 'Lollipop chart');
  svg.style.overflow = 'visible';
  const xFor = (pct) => valueX + (Math.min(pct, max) / max) * trackW;
  const rows = [];
  const labelMeta = [];
  const LABEL_FONT = 15;

  items.forEach((item, index) => {
    const cy = index * rowH + rowH / 2;
    const isHi = highlightId && item.id === highlightId;
    const label = textNode({
      x: labelWidth, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'central',
      fill: textColour, 'font-size': LABEL_FONT, 'font-weight': 600,
    }, item.label);
    labelMeta.push({ node: label, availWidth: labelWidth - 4, baseFont: LABEL_FONT, cy });
    const baseline = el('line', {
      x1: valueX, y1: cy, x2: valueX + trackW, y2: cy,
      stroke: scheme.stroke, 'stroke-width': 1, opacity: 0.18,
    });
    const stem = el('line', {
      x1: valueX, y1: cy, x2: valueX, y2: cy,
      stroke: isHi ? highlightColour : dotColour, 'stroke-width': 2.5,
    });
    const dot = el('circle', {
      cx: valueX, cy, r: 7, fill: isHi ? highlightColour : dotColour,
    });
    const value = textNode({
      x: valueX, y: cy, 'dominant-baseline': 'central', fill: textColour,
      'font-size': 16, 'font-weight': 700, style: TAB_NUMS,
    }, fmtPct(0, 0));
    svg.append(label, baseline, stem, dot, value);
    rows.push({ stem, dot, value, cy, target: item.pct });
  });

  container.append(svg);
  fitLabelsWhenReady(svg, labelMeta);
  const render = (row, pct) => {
    const x = xFor(pct);
    row.stem.setAttribute('x2', x);
    row.dot.setAttribute('cx', x);
    row.value.setAttribute('x', x + 12);
    row.value.textContent = fmtPct(pct, 0);
  };
  const drawStatic = () => rows.forEach((r) => render(r, r.target));
  const drawAnimated = () => rows.forEach((r) => tween(0, r.target, 900, (v) => render(r, v)));
  onFirstView(svg, drawAnimated, drawStatic, 0.25);

  return { el: svg };
};

/* ───────────────────────── dot plot ────────────────────────────────
 * Cleveland-style: a single shared horizontal axis with one labelled dot
 * per item. Good for compact rankings.
 * opts: { items:[{label, pct}], max?, accent?, ariaLabel? }
 * Returns { el }.
 */
export const dotPlot = (container, opts) => {
  const c = palette();
  const { items, max = 100, accent = 'navy', onNavy = false } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const dotColour = scheme.component;
  const textColour = scheme.text;
  const width = 720;
  const rowH = 30;
  const labelWidth = 200;
  const axisX = labelWidth + 12;
  const rightPad = 56;
  const trackW = width - axisX - rightPad;
  const topPad = 8;
  const height = topPad + items.length * rowH + 20;
  const axisY = topPad + items.length * rowH;

  const svg = svgRoot(width, height, opts.ariaLabel || 'Dot plot');
  svg.style.overflow = 'visible';
  const xFor = (pct) => axisX + (Math.min(pct, max) / max) * trackW;
  const labelMeta = [];
  const LABEL_FONT = 15;

  // shared axis + gridline ticks (faint component-coloured tint)
  svg.append(el('line', {
    x1: axisX, y1: axisY, x2: axisX + trackW, y2: axisY,
    stroke: scheme.stroke, 'stroke-width': 1, opacity: 0.35,
  }));
  for (let t = 0; t <= max; t += max / 4) {
    const x = xFor(t);
    svg.append(el('line', {
      x1: x, y1: topPad, x2: x, y2: axisY, stroke: scheme.stroke, 'stroke-width': 1, opacity: 0.1,
    }));
    svg.append(textNode({
      x, y: axisY + 16, 'text-anchor': 'middle', fill: textColour, 'font-size': 13,
      'font-weight': 600, opacity: 0.7, style: TAB_NUMS,
    }, fmtPct(t, 0)));
  }

  const rows = [];
  items.forEach((item, index) => {
    const cy = topPad + index * rowH + rowH / 2;
    const label = textNode({
      x: labelWidth, y: cy, 'text-anchor': 'end', 'dominant-baseline': 'central',
      fill: textColour, 'font-size': LABEL_FONT, 'font-weight': 600,
    }, item.label);
    labelMeta.push({ node: label, availWidth: labelWidth - 4, baseFont: LABEL_FONT, cy });
    const dot = el('circle', {
      cx: axisX, cy, r: 7, fill: dotColour,
    });
    const value = textNode({
      x: axisX, y: cy, 'dominant-baseline': 'central', fill: textColour,
      'font-size': 15, 'font-weight': 700, style: TAB_NUMS,
    }, fmtPct(0, 0));
    svg.append(label, dot, value);
    rows.push({ dot, value, cy, target: item.pct });
  });

  container.append(svg);
  fitLabelsWhenReady(svg, labelMeta);
  const render = (row, pct) => {
    const x = xFor(pct);
    row.dot.setAttribute('cx', x);
    row.value.setAttribute('x', x + 12);
    row.value.textContent = fmtPct(pct, 0);
  };
  const drawStatic = () => rows.forEach((r) => render(r, r.target));
  const drawAnimated = () => rows.forEach((r) => tween(0, r.target, 900, (v) => render(r, v)));
  onFirstView(svg, drawAnimated, drawStatic, 0.25);

  return { el: svg };
};

/* ──────────────────────── proportion strip ─────────────────────────
 * One horizontal 100% strip split into proportional ink-separated cells
 * with inline labels. Good for "54% trading down / 46% holding".
 * opts: { segments:[{label, pct, accent?}], ariaLabel? }
 * Returns { el, update(newSegments) }.
 */
export const proportionStrip = (container, opts) => {
  const c = palette();
  const { onNavy = false } = opts;
  const scheme = groundScheme(c, { onNavy });
  const textColour = scheme.text;
  // Default alternation avoids mustard-on-mustard: navy ↔ teal (or
  // cream ↔ teal on dark navy). Per-segment `accent` still overrides.
  const altAccents = onNavy ? ['cream', 'teal'] : ['navy', 'teal'];
  const width = 720;
  const height = 92;
  const stripY = 0;
  const stripH = 48;
  const svg = svgRoot(width, height, opts.ariaLabel || 'Proportion strip');

  let segments = opts.segments.slice();
  const cellsLayer = el('g', {});
  svg.append(cellsLayer);
  container.append(svg);

  const draw = (animate) => {
    while (cellsLayer.firstChild) cellsLayer.removeChild(cellsLayer.firstChild);
    const totalPct = segments.reduce((sum, s) => sum + s.pct, 0) || 100;
    let cursor = 0;
    segments.forEach((seg, idx) => {
      const segW = (seg.pct / totalPct) * width;
      const x = cursor;
      const fill = accentColour(c, seg.accent || altAccents[idx % 2]);
      // Thin separator between cells, not a heavy box outline.
      const rect = el('rect', {
        x, y: stripY, width: animate ? 0 : segW, height: stripH,
        fill, stroke: scheme.track, 'stroke-width': 1,
      });
      cellsLayer.append(rect);
      if (animate) tween(0, segW, 800, (w) => rect.setAttribute('width', w));

      const labelText = textNode({
        x: x + 6, y: stripY + stripH + 20, fill: textColour, 'font-size': 15,
        'font-weight': 600,
      }, seg.label);
      const pctText = textNode({
        x: x + 6, y: stripY + stripH + 38, fill: textColour, 'font-size': 15,
        'font-weight': 700, opacity: 0.85, style: TAB_NUMS,
      }, fmtPct(seg.pct, 0));
      cellsLayer.append(labelText, pctText);
      cursor += segW;
    });
  };

  onFirstView(svg, () => draw(true), () => draw(false), 0.3);

  return {
    el: svg,
    update(newSegments) {
      segments = newSegments.slice();
      draw(!prefersReducedMotion());
    },
  };
};

/* ───────────────────────── radial gauge ────────────────────────────
 * Flat semicircle arc gauge (square-capped strokes) for a single score —
 * an alternative to barGauge.
 * opts: { value, max?=10, label?, accent?='mustard', ariaLabel? }
 * Returns { el }.
 */
export const radialGauge = (container, opts) => {
  const c = palette();
  const { value, max = 10, accent = 'navy', onNavy = false, label = '' } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const arcColour = scheme.component;
  const textColour = scheme.text;
  const width = 280;
  const height = 170;
  const cx = width / 2;
  const cy = 140;
  const r = 110;
  const strokeW = 22;

  const svg = svgRoot(width, height, opts.ariaLabel || `${value} out of ${max}`, width);

  // semicircle goes from 180deg (left) to 0deg (right)
  const pointOnArc = (frac) => {
    const ang = Math.PI - frac * Math.PI; // 1..0 of the half-circle
    return { x: cx + r * Math.cos(ang), y: cy - r * Math.sin(ang) };
  };
  const arcPath = (frac) => {
    const start = pointOnArc(0);
    const end = pointOnArc(Math.max(0.0001, frac));
    const large = 0;
    const sweep = 1;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} ${sweep} ${end.x} ${end.y}`;
  };

  // track (full semicircle) — faint component tint, never white
  svg.append(el('path', {
    d: arcPath(1), fill: 'none', stroke: scheme.stroke, 'stroke-width': strokeW,
    'stroke-linecap': 'butt', opacity: 0.15,
  }));
  const fillArc = el('path', {
    d: arcPath(0.0001), fill: 'none', stroke: arcColour,
    'stroke-width': strokeW, 'stroke-linecap': 'butt',
  });
  svg.append(fillArc);

  const valueText = textNode({
    x: cx, y: cy - 6, 'text-anchor': 'middle', fill: textColour,
    'font-size': 38, 'font-weight': 800, style: TAB_NUMS,
  });
  svg.append(valueText);
  if (label) {
    svg.append(textNode({
      x: cx, y: cy + 18, 'text-anchor': 'middle', fill: textColour,
      'font-size': 14, 'font-weight': 600, opacity: 0.8,
    }, label));
  }

  container.append(svg);
  const render = (v) => {
    fillArc.setAttribute('d', arcPath(Math.min(v, max) / max));
    valueText.textContent = `${v.toFixed(1)}`;
  };
  onFirstView(
    svg,
    () => tween(0, value, 1100, render),
    () => render(value),
    0.4,
  );

  return { el: svg };
};

/* ───────────────────────── dot field ───────────────────────────────
 * Canvas-2D particle field with a lightweight physics simulation. One
 * dot per data point. Dots spring toward soft attractor targets while
 * mutual repulsion + velocity damping keep them well-spaced, so a
 * formation settles into a calm, faintly-jostling cluster rather than a
 * rigid grid.
 *
 * PHYSICS MODEL (per frame, normalised 0..1 space):
 *   - Spring:    a += (target - pos) * SPRING        (soft attractor)
 *   - Drift:     a += brownian wander * driftAmp      (ambient life)
 *   - Cursor:    a += radial push away from pointer within CURSOR_RADIUS,
 *                with smooth falloff (auto-tracked + setPointer())
 *   - Repulsion: a += sum of soft push from neighbours closer than
 *                MIN_SPACING, found via a uniform spatial grid (O(n)),
 *                so ~300 dots stay near-overlap-free without n^2 cost.
 *   - Integrate: vel = (vel + a) * DAMPING; pos += vel   (momentum/inertia)
 * Velocities are clamped so the field never explodes.
 *
 * opts: { count, dotRadius?=2.2, ariaLabel? }
 * Returns:
 *   formation(targets, behaviour?)  targets: [{x,y,colour?}] in 0..1,
 *       length<=count. Dots without a target diffuse in a faint cloud.
 *       Optional behaviour: { spring?, jostle? } tunes this formation's
 *       attractor stiffness and ambient liveliness (backward compatible —
 *       existing callers pass only the targets array).
 *   highlight(index, colour)  paint one dot a different colour ("you")
 *   drift(amplitude)          ambient brownian motion strength
 *   setPointer(xNorm, yNorm | null)  push dots from this point; null clears
 *   destroy()
 *   el (the <canvas>)
 *
 * Reduced motion: jump-cuts to targets, no sim, no pointer force, no drift.
 * Performance: dpr capped at 2; rAF pauses when the canvas is off-screen
 * (IntersectionObserver) and resumes when visible.
 */
const DF_SPRING = 0.012;        // attractor stiffness (soft)
const DF_DAMPING = 0.86;        // velocity retention (inertia)
const DF_MAX_VEL = 0.018;       // per-frame speed clamp (normalised)
const DF_MIN_SPACING = 0.045;   // desired neighbour gap (normalised)
const DF_REPEL = 0.0009;        // repulsion strength
const DF_CURSOR_RADIUS = 0.16;  // pointer influence radius (normalised)
const DF_CURSOR_FORCE = 0.012;  // pointer push strength
const DF_JOSTLE = 0.00006;      // ambient brownian magnitude per drift unit

export const dotField = (container, opts) => {
  const c = palette();
  const { count, dotRadius = 2.6, onNavy = false } = opts;
  // Default dot is high-contrast navy on warm grounds, cream on dark navy.
  const baseDotColour = onNavy ? c.cream : c.navy;
  const diffuseColour = onNavy ? 'rgba(238,233,221,0.30)' : 'rgba(10,26,92,0.30)';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', opts.ariaLabel || 'Population of survey respondents');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.append(canvas);
  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let aspect = 1; // W/H, used so spacing reads evenly in screen space

  const dots = Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(),
    tx: Math.random(), ty: Math.random(),
    vx: 0, vy: 0,
    hasTarget: false,
    colour: baseDotColour,
    phase: Math.random() * Math.PI * 2,
  }));

  let driftAmp = 0;
  let highlightIndex = -1;
  let highlightColour = c.tealDeep;
  let springK = DF_SPRING;
  let jostleK = DF_JOSTLE;
  let pointer = null; // { x, y } normalised, or null
  let raf = 0;
  let running = true;   // master switch (destroy)
  let visible = true;   // IntersectionObserver gate

  const reduced = prefersReducedMotion();

  // Size the canvas backing store to the SETTLED on-screen box.
  //
  // The container can be transiently scaled by an ancestor transform (e.g. a
  // depth/zoom transition on the journey stage) or measured at zero size while
  // off-screen. getBoundingClientRect() reports the *transformed* rect, so
  // sizing the backing store at that moment bakes in the wrong dimensions; the
  // canvas is then CSS-stretched (width/height:100%) back to the settled box,
  // upscaling the bitmap into a blurry, over-large blob. We prefer
  // offsetWidth/offsetHeight, which report the untransformed CSS box and so are
  // immune to the in-flight zoom transform, falling back to the rect only if
  // layout reports zero.
  const measureSettled = () => {
    let w = container.offsetWidth;
    let h = container.offsetHeight;
    if (w <= 0 || h <= 0) {
      const rect = container.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
    }
    return { w, h };
  };

  const resize = () => {
    const { w, h } = measureSettled();
    // Guard: never size against a collapsed box — keep the last good size so a
    // resize fired while off-screen / mid-transition can't blow up the canvas.
    if (w <= 0 || h <= 0) return;
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    // Skip redundant work when the settled box and dpr are unchanged (avoids
    // churn from the ResizeObserver + chapter:arrive double-fire).
    if (w === W && h === H && nextDpr === dpr && canvas.width > 0) return;
    W = w;
    H = h;
    aspect = W / H;
    dpr = nextDpr;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  // Uniform spatial grid: bucket dots into cells of ~MIN_SPACING so each
  // dot only tests its 3x3 neighbourhood — keeps repulsion near O(n).
  const cellSize = DF_MIN_SPACING;
  const grid = new Map();
  const cellKey = (cx, cy) => `${cx},${cy}`;

  const applyRepulsion = () => {
    grid.clear();
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      const cx = Math.floor(d.x / cellSize);
      const cy = Math.floor(d.y / cellSize);
      const key = cellKey(cx, cy);
      let bucket = grid.get(key);
      if (!bucket) { bucket = []; grid.set(key, bucket); }
      bucket.push(i);
      d._cx = cx; d._cy = cy;
    }
    const minSq = DF_MIN_SPACING * DF_MIN_SPACING;
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      for (let gx = d._cx - 1; gx <= d._cx + 1; gx += 1) {
        for (let gy = d._cy - 1; gy <= d._cy + 1; gy += 1) {
          const bucket = grid.get(cellKey(gx, gy));
          if (!bucket) continue;
          for (let b = 0; b < bucket.length; b += 1) {
            const j = bucket[b];
            if (j <= i) continue; // each pair once
            const o = dots[j];
            let dx = d.x - o.x;
            let dy = (d.y - o.y) * aspect; // even spacing in screen space
            const distSq = dx * dx + dy * dy;
            if (distSq >= minSq || distSq === 0) continue;
            const dist = Math.sqrt(distSq) || 0.0001;
            const push = (DF_REPEL * (1 - dist / DF_MIN_SPACING)) / dist;
            const fx = dx * push;
            const fy = (dy / aspect) * push;
            d.vx += fx; d.vy += fy;
            o.vx -= fx; o.vy -= fy;
          }
        }
      }
    }
  };

  const clampVel = (d) => {
    const sp = Math.hypot(d.vx, d.vy);
    if (sp > DF_MAX_VEL) {
      const s = DF_MAX_VEL / sp;
      d.vx *= s; d.vy *= s;
    }
  };

  const drawDot = (d, i) => {
    const px = d.x * W;
    const py = d.y * H;
    const isHi = i === highlightIndex;
    ctx.beginPath();
    ctx.arc(px, py, isHi ? dotRadius * 2.2 : dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = isHi ? highlightColour : d.colour;
    ctx.fill();
    if (isHi) {
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = c.ink;
      ctx.stroke();
    }
  };

  const frame = () => {
    if (!running) return;
    if (!visible) { raf = requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, W, H);

    if (reduced) {
      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i];
        d.x = d.tx; d.y = d.ty;
        drawDot(d, i);
      }
      raf = requestAnimationFrame(frame);
      return;
    }

    // 1. spring toward target + ambient jostle (acceleration into velocity)
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      d.vx += (d.tx - d.x) * springK;
      d.vy += (d.ty - d.y) * springK;
      if (driftAmp > 0) {
        d.phase += 0.013;
        d.vx += Math.sin(d.phase) * jostleK * driftAmp;
        d.vy += Math.cos(d.phase * 1.3) * jostleK * driftAmp;
      }
    }

    // 2. cursor push (radial, smooth falloff)
    if (pointer) {
      const r2 = DF_CURSOR_RADIUS * DF_CURSOR_RADIUS;
      for (let i = 0; i < dots.length; i += 1) {
        const d = dots[i];
        const dx = d.x - pointer.x;
        const dy = (d.y - pointer.y) * aspect;
        const distSq = dx * dx + dy * dy;
        if (distSq >= r2 || distSq === 0) continue;
        const dist = Math.sqrt(distSq);
        const falloff = 1 - dist / DF_CURSOR_RADIUS;
        const push = (DF_CURSOR_FORCE * falloff * falloff) / dist;
        d.vx += dx * push;
        d.vy += (dy / aspect) * push;
      }
    }

    // 3. mutual repulsion (spatial grid)
    applyRepulsion();

    // 4. integrate with damping/inertia, clamp, draw
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      d.vx *= DF_DAMPING;
      d.vy *= DF_DAMPING;
      clampVel(d);
      d.x += d.vx;
      d.y += d.vy;
      // soft walls so dots never leave the canvas
      if (d.x < 0) { d.x = 0; d.vx *= -0.4; }
      else if (d.x > 1) { d.x = 1; d.vx *= -0.4; }
      if (d.y < 0) { d.y = 0; d.vy *= -0.4; }
      else if (d.y > 1) { d.y = 1; d.vy *= -0.4; }
      drawDot(d, i);
    }
    raf = requestAnimationFrame(frame);
  };

  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);

  // Pointer tracking on the container (auto cursor force).
  const setPointer = (xNorm, yNorm) => {
    if (xNorm == null || yNorm == null) { pointer = null; return; }
    pointer = {
      x: Math.min(1, Math.max(0, xNorm)),
      y: Math.min(1, Math.max(0, yNorm)),
    };
  };
  const onPointerMove = (e) => {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    setPointer((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };
  const onPointerLeave = () => { pointer = null; };
  if (!reduced) {
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
  }

  // Pause rAF when off-screen to save battery.
  let io = null;
  if (typeof IntersectionObserver !== 'undefined') {
    io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { visible = e.isIntersecting; });
    }, { threshold: 0 });
    io.observe(canvas);
  }

  // Re-size the backing store whenever the REAL container box changes — the
  // settled compass size differs from the size captured at construction time
  // (built off-screen / mid zoom-transition), so this is what makes the dots
  // crisp once the stage arrives at rest.
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') {
    ro = new ResizeObserver(() => resize());
    ro.observe(container);
  }

  raf = requestAnimationFrame(frame);

  return {
    el: canvas,
    /**
     * Assign normalised targets [{x,y,colour?}] (0..1). Dots beyond the
     * targets list diffuse in a faint cloud. Optional second arg tunes
     * this formation's feel: { spring?, jostle? }.
     */
    formation(targets, behaviour = {}) {
      springK = behaviour.spring != null ? behaviour.spring : DF_SPRING;
      jostleK = behaviour.jostle != null ? behaviour.jostle : DF_JOSTLE;
      for (let i = 0; i < dots.length; i += 1) {
        const t = targets[i];
        if (t) {
          dots[i].tx = t.x;
          dots[i].ty = t.y;
          dots[i].hasTarget = true;
          dots[i].colour = t.colour || baseDotColour;
        } else {
          dots[i].tx = Math.random();
          dots[i].ty = Math.random();
          dots[i].hasTarget = false;
          dots[i].colour = diffuseColour;
        }
      }
    },
    highlight(index, colour = c.tealDeep) {
      highlightIndex = index;
      highlightColour = colour;
    },
    drift(amplitude = 1) { driftAmp = amplitude; },
    setPointer,
    /** Force a re-measure of the settled container box (call on arrive). */
    resize,
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerleave', onPointerLeave);
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      canvas.remove();
    },
  };
};

/** Helper: lay out N points as a jittered cluster inside a rect (0..1). */
export const clusterPoints = (n, rect) => {
  const pts = [];
  const cols = Math.ceil(Math.sqrt(n * (rect.w / rect.h)));
  const rowsN = Math.ceil(n / cols);
  for (let i = 0; i < n; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const jx = (Math.random() - 0.5) * (rect.w / cols) * 0.6;
    const jy = (Math.random() - 0.5) * (rect.h / rowsN) * 0.6;
    pts.push({
      x: rect.x + (col + 0.5) * (rect.w / cols) + jx,
      y: rect.y + (row + 0.5) * (rect.h / rowsN) + jy,
    });
  }
  return pts;
};

/* ─────────────────────── orbit ring chart ──────────────────────────
 * The deck's signature motif as a chart: items become points sitting on
 * thin CONCENTRIC ORBIT RINGS around a shared centre. Magnitude is
 * encoded by ring index (largest value → outermost ring) AND by the
 * angular sweep of a faint arc drawn from 12-o'clock, so a glance reads
 * the ranking and each value's share of `max`. One thin orbit circle per
 * item in the faint track scheme; one solid point (navy on warm grounds,
 * cream on dark navy) with a bold inline value label — never a boxed
 * legend. Backgroundless (transparent svg). Points animate outward from
 * the centre on first view; hover/focus enlarges a point and brightens
 * its ring. Keyboard-focusable. Meant to replace a bar chart with
 * something ownable.
 *
 * opts: {
 *   items: [{ label, pct? | value? }],   // pct preferred; value scaled by max
 *   max?: number (default 100),
 *   accent?: 'navy'|'teal'|'mustard'|'cream',
 *   onNavy?: boolean,
 *   centreLabel?: string,                 // optional text in the hub
 *   ariaLabel?: string,
 *   decimals?: number,
 * }
 * Returns { el }.
 */
export const orbitRingChart = (container, opts) => {
  const c = palette();
  const {
    items,
    max = 100,
    accent = 'navy',
    onNavy = false,
    centreLabel = '',
    decimals = 0,
  } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const pointColour = scheme.component;
  const textColour = scheme.text;

  const size = 460;
  const cx = size / 2;
  const cy = size / 2;
  const hubR = 34;
  // Largest ring sits inside the box leaving room for outer labels.
  const maxR = size / 2 - 70;
  const n = Math.max(1, items.length);
  const ringStep = n > 1 ? (maxR - hubR - 12) / (n - 1) : 0;

  const svg = svgRoot(size, size, opts.ariaLabel || 'Orbit ring chart', size);

  // Read magnitude for an item (pct preferred, else value/max scaled).
  const magOf = (item) => {
    const v = item.pct != null ? item.pct : (item.value != null ? item.value : 0);
    return Math.max(0, Math.min(v, max));
  };
  // Sort a copy descending so the biggest value gets the outermost ring,
  // but keep original objects (no mutation of caller's array).
  const ranked = items
    .map((item, i) => ({ item, mag: magOf(item), srcIndex: i }))
    .sort((a, b) => b.mag - a.mag);

  // Stagger points around the dial so labels never stack: golden-angle
  // spread keeps adjacent rings angularly far apart.
  const GOLDEN = 137.508 * (Math.PI / 180);
  const startAng = -Math.PI / 2; // 12 o'clock

  // Faint hub ring + optional centre label (backgroundless — stroke only).
  svg.append(el('circle', {
    cx, cy, r: hubR, fill: 'none', stroke: scheme.track, 'stroke-width': 1.5,
  }));
  if (centreLabel) {
    svg.append(textNode({
      x: cx, y: cy, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      fill: textColour, 'font-size': 14, 'font-weight': 800,
    }, centreLabel));
  }

  const rows = [];
  ranked.forEach((entry, rankIndex) => {
    // Outermost ring = rank 0 (largest). Inner rings step inward.
    const r = maxR - rankIndex * ringStep;
    const ang = startAng + rankIndex * GOLDEN;
    const frac = entry.mag / max;

    const g = el('g', {});
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'listitem');
    g.setAttribute('aria-label', `${entry.item.label}: ${fmtPct(entry.mag, decimals)}`);
    g.style.cursor = 'default';
    g.style.outline = 'none';

    // Thin orbit circle (faint track scheme) — never a filled disc.
    const ring = el('circle', {
      cx, cy, r, fill: 'none', stroke: scheme.track, 'stroke-width': 1.5,
    });

    // Faint magnitude arc from 12 o'clock sweeping clockwise by `frac`,
    // a second read on each item's share of max.
    const arc = el('path', {
      fill: 'none', stroke: pointColour, 'stroke-width': 2.5,
      'stroke-linecap': 'butt', opacity: 0.28,
      d: '',
    });
    const arcPathFor = (f) => {
      const a0 = startAng;
      const a1 = startAng + Math.max(0.0001, f) * Math.PI * 2;
      const x0 = cx + r * Math.cos(a0);
      const y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const large = f > 0.5 ? 1 : 0;
      return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
    };

    // The point sits where the magnitude arc ends.
    const ptAng = startAng + frac * Math.PI * 2;
    const targetX = cx + r * Math.cos(ptAng);
    const targetY = cy + r * Math.sin(ptAng);

    const dot = el('circle', {
      cx, cy, r: 7, fill: pointColour, // start at hub, animate outward
    });

    // Label + inline value placed radially outward from the point so it
    // sits clear of the rings; anchored by which half it falls in.
    const onRight = Math.cos(ptAng) >= 0;
    const labelOut = 16;
    const lx = targetX + Math.cos(ptAng) * labelOut;
    const ly = targetY + Math.sin(ptAng) * labelOut;
    const label = textNode({
      x: lx, y: ly - 8, 'text-anchor': onRight ? 'start' : 'end',
      'dominant-baseline': 'central', fill: textColour, 'font-size': 13,
      'font-weight': 600,
    }, entry.item.label);
    const value = textNode({
      x: lx, y: ly + 9, 'text-anchor': onRight ? 'start' : 'end',
      'dominant-baseline': 'central', fill: textColour, 'font-size': 18,
      'font-weight': 800, style: TAB_NUMS,
    }, fmtPct(0, decimals));

    g.append(ring, arc, dot, label, value);
    svg.append(g);

    const render = (f) => {
      arc.setAttribute('d', arcPathFor(f));
      const a = startAng + f * Math.PI * 2;
      dot.setAttribute('cx', cx + r * Math.cos(a));
      dot.setAttribute('cy', cy + r * Math.sin(a));
      value.textContent = fmtPct(f * max, decimals);
    };

    // Hover / focus highlight: enlarge point, strengthen arc + ring.
    const setActive = (active) => {
      dot.setAttribute('r', active ? 11 : 7);
      arc.setAttribute('opacity', active ? 0.9 : 0.28);
      ring.setAttribute('stroke', active ? pointColour : scheme.track);
      ring.setAttribute('opacity', active ? 0.5 : 1);
    };
    g.addEventListener('pointerenter', () => setActive(true));
    g.addEventListener('pointerleave', () => setActive(false));
    g.addEventListener('focus', () => setActive(true));
    g.addEventListener('blur', () => setActive(false));

    rows.push({ render, frac, label, value });
  });

  // Mark the svg as a list of points for assistive tech.
  svg.setAttribute('role', 'list');
  svg.setAttribute('aria-label', opts.ariaLabel || 'Orbit ring chart');

  container.append(svg);

  const drawStatic = () => rows.forEach((r) => r.render(r.frac));
  const drawAnimated = () =>
    rows.forEach((r, i) =>
      tween(0, r.frac, 1000 + i * 60, (f) => r.render(f)));
  onFirstView(svg, drawAnimated, drawStatic, 0.25);

  return { el: svg };
};

/* ───────────────────────────  tug of war  ──────────────────────────
 * A single horizontal tension bar for a binary split (e.g. 54 vs 46).
 * The two sides are distinct flat colours meeting at a central divider
 * that SPRINGS to the true position on reveal. Labels + percent sit on
 * their OWN side, stacked above (left) / below (right) so they can never
 * overlap — the fix for proportionStrip's colliding labels. Backgroundless
 * (transparent svg), faint outline track only, square ends, bold tabular
 * value labels. Reduced motion jump-cuts to the resting position.
 *
 * opts: {
 *   left:  { label, pct },
 *   right: { label, pct },
 *   accent?: 'navy'|'teal'|'mustard'|'cream',  // left side fill
 *   onNavy?: boolean,
 *   ariaLabel?: string,
 * }
 * Returns { el, update({left, right}) }.
 */
export const tugOfWar = (container, opts) => {
  const c = palette();
  const { accent = 'navy', onNavy = false } = opts;
  const scheme = groundScheme(c, { accent, onNavy });
  const textColour = scheme.text;

  // Two distinct sides. On warm grounds: navy vs mustard. On dark navy:
  // cream vs teal. `accent` overrides the left fill if given.
  const isDark = onNavy === true || accent === 'cream';
  const leftColour = isDark
    ? accentColour(c, accent === 'cream' ? 'cream' : (accent || 'cream'))
    : accentColour(c, accent);
  const rightColour = isDark ? c.tealDeep : c.mustard;

  const width = 720;
  const barY = 40;
  const barH = 56;
  const height = barY + barH + 44; // room for labels above + below
  const svg = svgRoot(width, height, opts.ariaLabel || 'Tug of war split');

  // Faint outline track (no fill) — backgroundless, square corners.
  svg.append(el('rect', {
    x: 0, y: barY, width, height: barH,
    fill: 'none', stroke: scheme.track, 'stroke-width': 1.5,
  }));

  const leftRect = el('rect', { x: 0, y: barY, width: 0, height: barH, fill: leftColour });
  const rightRect = el('rect', { x: width, y: barY, width: 0, height: barH, fill: rightColour });
  // Central divider line that springs to the split point.
  const divider = el('line', {
    x1: width / 2, y1: barY - 6, x2: width / 2, y2: barY + barH + 6,
    stroke: scheme.stroke, 'stroke-width': 2,
  });
  svg.append(leftRect, rightRect, divider);

  // Left labels ABOVE its side; right labels BELOW its side. Each anchored
  // to its own edge so the two sets never share horizontal space.
  const leftName = textNode({
    x: 8, y: barY - 22, 'text-anchor': 'start', fill: textColour,
    'font-size': 15, 'font-weight': 600,
  }, opts.left.label);
  const leftPct = textNode({
    x: 8, y: barY - 4, 'text-anchor': 'start', fill: textColour,
    'font-size': 20, 'font-weight': 800, style: TAB_NUMS,
  }, fmtPct(0, 0));
  const rightName = textNode({
    x: width - 8, y: barY + barH + 20, 'text-anchor': 'end', fill: textColour,
    'font-size': 15, 'font-weight': 600,
  }, opts.right.label);
  const rightPct = textNode({
    x: width - 8, y: barY + barH + 40, 'text-anchor': 'end', fill: textColour,
    'font-size': 20, 'font-weight': 800, style: TAB_NUMS,
  }, fmtPct(0, 0));
  svg.append(leftName, leftPct, rightName, rightPct);

  let state = { left: opts.left, right: opts.right };

  // Critically-damped spring solve for a satisfying settle on the divider.
  const splitFor = (s) => {
    const total = (s.left.pct + s.right.pct) || 100;
    return s.left.pct / total; // 0..1 fraction held by the left side
  };

  const render = (frac, s) => {
    const x = frac * width;
    leftRect.setAttribute('width', Math.max(0, x));
    rightRect.setAttribute('x', x);
    rightRect.setAttribute('width', Math.max(0, width - x));
    divider.setAttribute('x1', x);
    divider.setAttribute('x2', x);
    leftPct.textContent = fmtPct(frac * (s.left.pct + s.right.pct), 0);
    rightPct.textContent = fmtPct((1 - frac) * (s.left.pct + s.right.pct), 0);
  };

  // Spring animation: divider overshoots slightly then settles.
  const SPRING_STIFF = 0.18;
  const SPRING_DAMP = 0.72;
  let springRaf = 0;
  const animateTo = (targetFrac, s) => {
    cancelAnimationFrame(springRaf);
    if (prefersReducedMotion()) { render(targetFrac, s); return; }
    let pos = 0.5;       // start from centre (even tension)
    let vel = 0;
    const step = () => {
      const a = (targetFrac - pos) * SPRING_STIFF;
      vel = (vel + a) * SPRING_DAMP;
      pos += vel;
      render(pos, s);
      if (Math.abs(targetFrac - pos) > 0.0008 || Math.abs(vel) > 0.0008) {
        springRaf = requestAnimationFrame(step);
      } else {
        render(targetFrac, s);
      }
    };
    springRaf = requestAnimationFrame(step);
  };

  // Seed at centre so the spring has somewhere to spring from.
  render(0.5, state);
  container.append(svg);

  onFirstView(
    svg,
    () => animateTo(splitFor(state), state),
    () => render(splitFor(state), state),
    0.35,
  );

  return {
    el: svg,
    update(next) {
      state = { left: next.left, right: next.right };
      leftName.textContent = state.left.label;
      rightName.textContent = state.right.label;
      animateTo(splitFor(state), state);
    },
  };
};
