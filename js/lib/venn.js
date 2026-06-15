/**
 * venn.js — flat-fill SVG venn for The State of Independence.
 * Ported from AGBARR rubicon productVenn(): orbit-placed circles, hover/focus
 * isolate, leader-line labels, centre stat, square-corner legend.
 * Brand: flat colour, ink strokes, no gradients, tabular numbers.
 *
 * Factory contract (matches js/lib/* pattern):
 *   vennDiagram(container, opts) -> { el, focus(id), clear(), destroy() }
 * Reads colour tokens from CSS custom properties so css/vccp.css stays the
 * single source of truth; respects prefers-reduced-motion.
 */
import { prefersReducedMotion } from '../lib/reveal.js';

const NS = 'http://www.w3.org/2000/svg';
const VB_W = 1000;
const VB_H = 620;
const CX = 500;
const CY = 300;
const RAMP = ['--mustard', '--teal-deep', '--ink', '--mustard-dark']; // brand cycle

const cssVar = (name, fallback) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

const resolveAccent = (accent, i) => {
  if (!accent) return cssVar(RAMP[i % RAMP.length], '#FFC931');
  const token = { mustard: '--mustard', teal: '--teal-deep', ink: '--ink' }[accent];
  return token ? cssVar(token, accent) : accent; // pass raw CSS colour through
};

const svgEl = (tag, attrs = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function vennDiagram(container, opts = {}) {
  if (!container) return { el: null, focus() {}, clear() {}, destroy() {} };
  const sets = (opts.sets || []).slice(0, 4);
  if (sets.length < 2) return { el: null, focus() {}, clear() {}, destroy() {} };

  const orbit = opts.orbit ?? 120;
  const radius = opts.radius ?? 150;
  const reduced = prefersReducedMotion();

  // Spread circles evenly around the centre; start at -90deg (top) for 3-set symmetry.
  const placed = sets.map((s, i) => {
    const angle = (-90 + (360 / sets.length) * i) * (Math.PI / 180);
    return {
      ...s,
      accent: resolveAccent(s.accent, i),
      angle,
      cx: CX + Math.cos(angle) * orbit,
      cy: CY + Math.sin(angle) * orbit,
    };
  });

  const wrap = document.createElement('div');
  wrap.className = 'venn-wrap';

  const stage = document.createElement('div');
  stage.className = 'venn-stage';
  const svg = svgEl('svg', {
    class: 'venn-svg',
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': opts.ariaLabel || 'Overlap diagram',
  });

  // Circles — larger first so smaller overlaps sit on top.
  const ordered = [...placed].sort((a, b) => b.cy - a.cy);
  ordered.forEach((p) => {
    const c = svgEl('circle', {
      class: 'venn-petal', 'data-id': p.id,
      cx: p.cx, cy: p.cy, r: radius,
      fill: p.accent, stroke: cssVar('--ink', '#000'),
    });
    svg.appendChild(c);
    p.el = c;
  });

  // Leader lines + labels outside each blob.
  placed.forEach((p) => {
    const ax = p.cx + Math.cos(p.angle) * (radius * 0.92);
    const ay = p.cy + Math.sin(p.angle) * (radius * 0.92);
    const lx = CX + Math.cos(p.angle) * (orbit + radius + 120);
    const ly = CY + Math.sin(p.angle) * (orbit + radius + 70);
    const anchor = lx < CX - 20 ? 'end' : lx > CX + 20 ? 'start' : 'middle';
    const tx = anchor === 'end' ? lx - 8 : anchor === 'start' ? lx + 8 : lx;

    svg.appendChild(svgEl('line', { class: 'venn-leader', x1: ax, y1: ay, x2: lx, y2: ly }));
    const t1 = svgEl('text', { class: 'venn-ltext', x: tx, y: ly - 4, 'text-anchor': anchor });
    t1.textContent = p.label;
    svg.appendChild(t1);
    if (p.sub) {
      const t2 = svgEl('text', { class: 'venn-lmeta', x: tx, y: ly + 16, 'text-anchor': anchor });
      t2.textContent = p.sub;
      svg.appendChild(t2);
    }
  });

  stage.appendChild(svg);

  // Centre stat plate.
  if (opts.centre) {
    const ctr = document.createElement('div');
    ctr.className = 'venn-centre';
    ctr.innerHTML =
      `<span class="lbl">${esc(opts.centre.label)}</span>` +
      `<span class="val num">${esc(opts.centre.value)}</span>` +
      (opts.centre.sub ? `<span class="sub">${esc(opts.centre.sub)}</span>` : '');
    stage.appendChild(ctr);
  }
  wrap.appendChild(stage);

  // Legend — square-corner focusable cards.
  const legend = document.createElement('div');
  legend.className = 'venn-legend';
  placed.forEach((p) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'venn-leg';
    card.dataset.id = p.id;
    card.style.setProperty('--accent', p.accent);
    card.innerHTML =
      `<span class="name">${esc(p.label)}</span>` +
      (p.value != null ? `<span class="n num">${esc(p.value)}</span>` : '') +
      (p.sub ? `<span class="pct">${esc(p.sub)}</span>` : '');
    legend.appendChild(card);
    p.card = card;
  });
  wrap.appendChild(legend);
  container.appendChild(wrap);

  // ── Isolate behaviour ──────────────────────────────
  const focus = (id) => {
    svg.classList.add('is-focus');
    placed.forEach((p) => {
      p.el.classList.toggle('is-on', p.id === id);
      p.card.classList.toggle('is-on', p.id === id);
    });
  };
  const clear = () => {
    svg.classList.remove('is-focus');
    placed.forEach((p) => { p.el.classList.remove('is-on'); p.card.classList.remove('is-on'); });
  };

  placed.forEach((p) => {
    const enter = () => focus(p.id);
    p.el.addEventListener('mouseenter', enter);
    p.el.addEventListener('mouseleave', clear);
    p.el.addEventListener('click', () => opts.onSelect && opts.onSelect(p));
    p.card.addEventListener('mouseenter', enter);
    p.card.addEventListener('mouseleave', clear);
    p.card.addEventListener('focus', enter);
    p.card.addEventListener('blur', clear);
    p.card.addEventListener('click', () => opts.onSelect && opts.onSelect(p));
  });

  if (reduced) svg.classList.add('reduced');

  return {
    el: wrap,
    focus,
    clear,
    destroy() { wrap.remove(); },
  };
}

export default vennDiagram;
