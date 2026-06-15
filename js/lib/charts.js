/**
 * charts.js — pure-SVG + canvas chart factories for The State of Independence.
 *
 * House style: flat colour, square corners, ink stroke, mustard fill,
 * value labels inline at the bar end (never a boxed legend), tabular
 * numbers. No pie/donut. All factories respect prefers-reduced-motion
 * by jump-cutting to the final state.
 *
 * Exports:
 *   horizontalBars(container, opts) -> { update, el }
 *   waffleGrid(container, opts)     -> { setValue, el }
 *   barGauge(container, opts)       -> { el }
 *   dotField(container, opts)       -> { formation, highlight, destroy, el }
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
  ink: cssVar('--ink', '#000000'),
  paper: cssVar('--paper', '#FFFFFF'),
});

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
    max = 100,
    accent = 'mustard',
    decimals = 0,
    highlightId = null,
    animate = true,
    barHeight = 30,
    gap = 12,
    labelWidth = 200,
  } = opts;

  const valueX = labelWidth + 12;
  const rightPad = 56;
  const width = 720;
  const trackWidth = width - valueX - rightPad;
  const fillColour = accent === 'teal' ? c.tealDeep : c.mustard;

  let items = opts.items.slice();
  const rowFor = new Map();

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${items.length * (barHeight + gap)}`,
    width: '100%',
    role: 'img',
    'aria-label': opts.ariaLabel || 'Bar chart',
    preserveAspectRatio: 'xMinYMin meet',
  });
  svg.style.maxWidth = '100%';
  svg.style.height = 'auto';

  const buildRow = (item, index) => {
    const y = index * (barHeight + gap);
    const g = el('g', { transform: `translate(0 ${y})` });

    const label = el('text', {
      x: labelWidth,
      y: barHeight / 2,
      'text-anchor': 'end',
      'dominant-baseline': 'central',
      fill: c.ink,
      'font-size': 13,
      'font-family': cssVar('--font-sans', 'Inter Tight, sans-serif'),
    });
    label.textContent = item.label;

    const track = el('rect', {
      x: valueX, y: 0, width: trackWidth, height: barHeight,
      fill: c.paper, stroke: 'rgba(0,0,0,0.12)', 'stroke-width': 1,
    });

    const isHi = highlightId && item.id === highlightId;
    const bar = el('rect', {
      x: valueX, y: 0, width: 0, height: barHeight,
      fill: isHi ? c.ink : fillColour,
      stroke: c.ink, 'stroke-width': 1,
    });

    const value = el('text', {
      x: valueX, y: barHeight / 2,
      'dominant-baseline': 'central',
      fill: c.ink, 'font-size': 13, 'font-weight': 500,
      'font-family': cssVar('--font-sans', 'Inter Tight, sans-serif'),
      style: 'font-variant-numeric: tabular-nums;',
    });
    value.textContent = fmtPct(0, decimals);

    g.append(label, track, bar, value);
    svg.append(g);

    const render = (pct) => {
      const w = Math.max(0, (pct / max) * trackWidth);
      bar.setAttribute('width', w);
      value.setAttribute('x', valueX + w + 8);
      value.textContent = fmtPct(pct, decimals);
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
    update(newItems, { resort = false } = {}) {
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
  const { total = 100, accent = 'mustard', square = 26, gap = 6 } = opts;
  const cols = 10;
  const rows = Math.ceil(total / cols);
  const fillColour = accent === 'teal' ? c.tealDeep : c.mustard;
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
      fill: c.paper, stroke: c.ink, 'stroke-width': 1,
    });
    svg.append(rect);
    cells.push(rect);
  }
  container.append(svg);

  let currentFilled = 0;
  const paint = (filled) => {
    const n = Math.round(filled);
    cells.forEach((rect, i) => {
      rect.setAttribute('fill', i < n ? fillColour : c.paper);
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
  const { value, max = 10, accent = 'mustard' } = opts;
  const width = 420;
  const height = 44;
  const fillColour = accent === 'teal' ? c.tealDeep : c.mustard;

  const svg = el('svg', {
    viewBox: `0 0 ${width} ${height + 22}`,
    width: '100%',
    role: 'img',
    'aria-label': opts.ariaLabel || `${value} out of ${max}`,
    preserveAspectRatio: 'xMinYMin meet',
  });
  svg.style.maxWidth = `${width}px`;
  svg.style.height = 'auto';

  svg.append(el('rect', {
    x: 0, y: 0, width, height, fill: c.paper,
    stroke: c.ink, 'stroke-width': 1.5,
  }));
  const fill = el('rect', { x: 0, y: 0, width: 0, height, fill: fillColour });
  svg.append(fill);
  svg.append(el('rect', {
    x: 0, y: 0, width, height, fill: 'none',
    stroke: c.ink, 'stroke-width': 1.5,
  }));

  // tick marks per unit
  for (let i = 1; i < max; i += 1) {
    const x = (i / max) * width;
    svg.append(el('line', {
      x1: x, y1: height - 10, x2: x, y2: height,
      stroke: c.ink, 'stroke-width': 1, opacity: 0.4,
    }));
  }
  const label = el('text', {
    x: 0, y: height + 16, fill: c.ink,
    'font-size': 13, 'font-weight': 500,
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

/* ───────────────────────── dot field ───────────────────────────────
 * Canvas-2D particle field. One dot per data point. Re-choreographs
 * between named formations by tweening each dot to a target position.
 *
 * opts: { count, width?, height?, dotRadius?=2.2, colour?=ink,
 *         ariaLabel? }
 * Returns:
 *   formation(targets)  targets: [{x,y}] in 0..1 normalised space, length<=count
 *   highlight(index, colour)  paint one dot a different colour (e.g. mustard "you")
 *   drift({ amplitude })      ambient brownian motion
 *   destroy()
 *   el (the <canvas>)
 *
 * Reduced motion: jump-cuts to targets, no drift.
 */
export const dotField = (container, opts) => {
  const c = palette();
  const { count, dotRadius = 2.2 } = opts;
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

  const dots = Array.from({ length: count }, () => ({
    x: Math.random(), y: Math.random(),
    tx: Math.random(), ty: Math.random(),
    vx: 0, vy: 0,
    colour: c.ink,
    phase: Math.random() * Math.PI * 2,
  }));

  let driftAmp = 0;
  let highlightIndex = -1;
  let highlightColour = c.mustard;
  let raf = 0;
  let running = true;

  const resize = () => {
    const rect = container.getBoundingClientRect();
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const reduced = prefersReducedMotion();

  const frame = () => {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < dots.length; i += 1) {
      const d = dots[i];
      if (reduced) {
        d.x = d.tx; d.y = d.ty;
      } else {
        // critically-damped-ish ease toward target
        d.vx = (d.vx + (d.tx - d.x) * 0.08) * 0.82;
        d.vy = (d.vy + (d.ty - d.y) * 0.08) * 0.82;
        d.x += d.vx;
        d.y += d.vy;
        if (driftAmp > 0) {
          d.phase += 0.01;
          d.x += Math.sin(d.phase) * driftAmp * 0.0006;
          d.y += Math.cos(d.phase * 1.3) * driftAmp * 0.0006;
        }
      }
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
    }
    raf = requestAnimationFrame(frame);
  };

  resize();
  const onResize = () => resize();
  window.addEventListener('resize', onResize);
  raf = requestAnimationFrame(frame);

  return {
    el: canvas,
    /**
     * Assign normalised targets [{x,y,colour?}] (0..1). Dots beyond the
     * targets list are scattered off to a faint diffuse cloud.
     */
    formation(targets) {
      for (let i = 0; i < dots.length; i += 1) {
        const t = targets[i];
        if (t) {
          dots[i].tx = t.x;
          dots[i].ty = t.y;
          dots[i].colour = t.colour || c.ink;
        } else {
          dots[i].tx = Math.random();
          dots[i].ty = Math.random();
          dots[i].colour = 'rgba(0,0,0,0.12)';
        }
      }
    },
    highlight(index, colour = c.mustard) {
      highlightIndex = index;
      highlightColour = colour;
    },
    drift(amplitude = 1) { driftAmp = amplitude; },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
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
