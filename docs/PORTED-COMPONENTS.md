# PORTED-COMPONENTS.md — two reusable data-viz components

Two dependency-free, vanilla-JS + SVG components ported from the AGBARR Rubicon
dashboard, re-styled to **The State of Independence** brand: mustard `#FFC931`,
teal `#80E8E3`, ink `#000`, paper `#FFF`, Inter Tight, **square corners**, flat
colour, no gradients, tabular numbers.

Both follow the site's lib contract:

- One ES module per component in `js/lib/`, **named + default export**.
- Imported from a section builder as `import vennDiagram from '../lib/venn.js'`.
- One CSS file per component in `css/sections/` (or fold into the chapter's own
  `#\30 6-empowerment.css` / `#\30 5-segments.css`). **Every selector is scoped
  to the chapter id** using the escaped digit form `#\30 6-empowerment` — a bare
  `#06-empowerment` is invalid CSS and silently dropped (see CONTRACT.md).
- Factories return `{ el, ...controls }`, build their own DOM, and read colour
  tokens from CSS custom properties so `css/vccp.css` stays the single source of
  truth. They respect `prefers-reduced-motion`.

> Source lineage: the venn is adapted from `rubicon/index.html`'s `productVenn()`
> (the `.aud-pvenn-*` block, orbit-placed petals, `.is-focus`/`.is-on` isolate,
> centre stat, legend, leader-line labels). The segment graph fuses the
> click-to-reveal idea from `assets/js/cep-explorer.js` and the
> theme→isolate→detail pattern from `MUSE RECORDING STUDIO/components/GraphRAG.jsx`
> into a dependency-free SVG node graph (no d3).

---

## A) `vennDiagram(container, opts)`

A flat-fill SVG venn: 2–4 overlapping circles placed on an orbit around a shared
centre, ink strokes, a square-corner legend, hover/focus **isolate** (dim the
others), leader-line labels, and a centre stat in the shared overlap. Generic
enough to render the **money / time / stress** triad for `06-empowerment` *or* a
segment-overlap venn.

### API

```
vennDiagram(container, {
  sets: [                         // 2–4 sets (3 = the money/time/stress case)
    { id, label, value?, sub?,    // value renders big in the legend; sub = caption
      accent? }                   // 'mustard' | 'teal' | 'ink' | any CSS colour; cycles a brand ramp if omitted
  ],
  centre?: { label, value, sub }, // the shared-overlap stat (optional)
  orbit?: 120,                    // px from centre to each circle centre (viewBox units)
  radius?: 150,                   // circle radius (viewBox units)
  ariaLabel?: 'string',
  onSelect?: (set) => void        // fired on click/Enter of a circle or legend card
}) -> {
  el,                             // the wrapper element (already appended to container)
  focus(id),                      // isolate one set programmatically
  clear(),                        // remove isolation
  destroy()
}
```

Behaviour (ported 1:1 from the AGBARR venn, brand-restyled):

- Circles are area-flat (no `mix-blend-mode` screen glow — brand bans gradients;
  fills are flat at low alpha so overlaps still read, with ink strokes).
- Hover/focus a circle **or** its legend card → `is-focus` on the svg + `is-on`
  on the matching circle and card; non-active circles drop to low opacity.
- Each circle has a leader line + label placed *outside* the blob along its angle.
- Legend cards are focusable `<button>`s (keyboard path); the whole thing is an
  accessible region. Reduced motion disables the scale transition.

### JS — `js/lib/venn.js`

```js
/**
 * venn.js — flat-fill SVG venn for The State of Independence.
 * Ported from AGBARR rubicon productVenn(): orbit-placed circles, hover/focus
 * isolate, leader-line labels, centre stat, square-corner legend.
 * Brand: flat colour, ink strokes, no gradients, tabular numbers.
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
```

### CSS — add to `css/sections/06-empowerment.css` (scoped, escaped id)

```css
/* venn — scope to the chapter that mounts it */
#\30 6-empowerment .venn-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  max-height: 680px; min-height: 420px;
  border: 1.5px solid var(--ink);
  background: var(--mustard-pale);     /* flat — no gradient */
  overflow: hidden;
}
#\30 6-empowerment .venn-svg { display: block; width: 100%; height: 100%; }

#\30 6-empowerment .venn-petal {
  fill-opacity: 0.32;                  /* flat alpha so overlaps read; no screen blend */
  stroke-width: 1.5;
  cursor: pointer;
  transform-box: fill-box;
  transform-origin: center;
  transition: fill-opacity .2s ease, transform .2s cubic-bezier(.2,.7,.2,1);
}
#\30 6-empowerment .venn-svg.reduced .venn-petal { transition: none; }
#\30 6-empowerment .venn-petal:hover,
#\30 6-empowerment .venn-petal.is-on { fill-opacity: 0.55; transform: scale(1.02); }
#\30 6-empowerment .venn-svg.is-focus .venn-petal:not(.is-on) { fill-opacity: 0.10; }

#\30 6-empowerment .venn-leader { stroke: var(--ink); stroke-width: 1.2; }
#\30 6-empowerment .venn-ltext {
  font: 500 18px var(--font-sans); fill: var(--ink);
}
#\30 6-empowerment .venn-lmeta {
  font: 600 11px var(--font-sans); letter-spacing: .06em;
  fill: var(--ink-soft); font-variant-numeric: tabular-nums;
}

#\30 6-empowerment .venn-centre {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 16px; min-width: 180px; text-align: center;
  background: var(--paper); border: 1.5px solid var(--ink);
  pointer-events: none; z-index: 3;
}
#\30 6-empowerment .venn-centre .lbl {
  display: block; font: 600 .68rem var(--font-sans);
  letter-spacing: .16em; text-transform: uppercase; color: var(--ink-soft);
}
#\30 6-empowerment .venn-centre .val {
  display: block; font: 500 1.8rem/1 var(--font-sans); color: var(--ink);
}
#\30 6-empowerment .venn-centre .sub {
  display: block; font: 400 .9rem var(--font-sans); color: var(--ink-soft); margin-top: 2px;
}

#\30 6-empowerment .venn-legend {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 8px; margin-top: 16px;
}
@media (max-width: 720px) { #\30 6-empowerment .venn-legend { grid-template-columns: 1fr; } }
#\30 6-empowerment .venn-leg {
  text-align: left; padding: 12px 14px;
  border: 1.5px solid var(--ink); background: var(--paper);
  display: flex; flex-direction: column; gap: 4px; cursor: pointer;
  transition: background .15s ease;
}
#\30 6-empowerment .venn-leg:hover,
#\30 6-empowerment .venn-leg.is-on { background: var(--mustard-pale); }
#\30 6-empowerment .venn-leg.is-on { box-shadow: inset 4px 0 0 var(--accent); }
#\30 6-empowerment .venn-leg .name {
  display: flex; align-items: center; gap: 8px;
  font: 500 1rem var(--font-sans); color: var(--ink);
}
#\30 6-empowerment .venn-leg .name::before {
  content: ''; width: 12px; height: 12px; background: var(--accent); /* square swatch */
}
#\30 6-empowerment .venn-leg .n { font: 500 1.6rem/1 var(--font-sans); color: var(--ink); }
#\30 6-empowerment .venn-leg .pct {
  font: 600 .68rem var(--font-sans); letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-soft);
}
```

### Usage — money / time / stress (chapter 06)

Values are real, from `data/segments.json` → `meta.metricsTotals.brandAsks`
(national net): *Stretch my money further* 38.8, *Save me time* 24.0,
*Reduce stress* 27.7. The shared-overlap centre carries the chapter's word.

```js
// js/sections/06-empowerment.js
import vennDiagram from '../lib/venn.js';

export default function init(rootEl, data) {
  const asks = data?.segments?.meta?.metricsTotals?.brandAsks;
  if (!asks) return; // fail soft
  const mount = rootEl.querySelector('[data-venn]');
  if (!mount) return;

  vennDiagram(mount, {
    ariaLabel: 'Save me money, time and stress — overlap',
    centre: { label: 'They want', value: 'empowerment', sub: 'tools, not hand-holding' },
    sets: [
      { id: 'money',  label: 'Save me money',  value: asks['Stretch my money further'].toFixed(1) + '%',
        sub: 'the obvious ask', accent: 'mustard' },
      { id: 'time',   label: 'Save me time',   value: asks['Save me time'].toFixed(1) + '%',
        sub: 'the premium ask', accent: 'teal' },
      { id: 'stress', label: 'Save me stress', value: asks['Reduce stress'].toFixed(1) + '%',
        sub: 'the premium ask', accent: 'ink' },
    ],
    onSelect: (set) => { /* expand the matching sheared panel, etc. */ },
  });
}
```

Markup in `sections/06-empowerment.html`:

```html
<div class="chapter-inner">
  <!-- … headline, sheared panels … -->
  <div data-venn aria-live="polite"></div>
</div>
```

For a **segment-overlap** venn, pass up to 4 sets (e.g. shared interests count)
with `value` = overlap size and `centre` = the all-share core.

---

## B) `segmentGraph(container, opts)` — GraphRAG segment explorer

A dependency-free **SVG node graph**: the 4 segments are hub nodes; their
attributes (interests, channels, AI behaviours, demographics) are satellite
nodes. A shared attribute (an attribute that appears for ≥2 segments) links those
segments through that node — so the graph literally shows what the segments have
in common. Layout is a **precomputed radial placement** softened by a tiny
hand-rolled spring relaxation (no d3). Clicking a segment isolates its sub-graph
and opens a detail panel; clicking an attribute highlights which segments share
it. Fully keyboard-accessible (every node is a `<button>` in an SVG
`foreignObject`-free way — we use focusable `<g tabindex>` plus a flat keyboard
fallback list).

### API

```
segmentGraph(container, {
  segments: [ /* data/segments.json segments[] */ ],
  facets?: ['interests','channels','aiAttitude','demographics'], // which to graph
  width?: 920, height?: 640,                                     // viewBox units
  ariaLabel?: 'string',
  onSelectSegment?: (segment) => void,
  onSelectAttribute?: (attr) => void
}) -> {
  el,
  selectSegment(id),
  selectAttribute(key),
  clear(),
  destroy()
}
```

How attributes are derived from a segment record:

- `interests[]` and `channels[]` → one attribute node each (split on shared text).
- `aiAttitude` (a sentence) → a single short AI-behaviour node per segment, keyed
  by a coarse stance tag (`embrace` / `vanguard` / `delegate` / `necessity`) so
  stances that recur link segments.
- `demographics` → derived from `who` + `money` (e.g. `55+ skew`, `comfortable`).

Shared attributes (same normalised key from ≥2 segments) become **bridge nodes**
drawn between their segments; unique attributes orbit their single segment.

### JS — `js/lib/segment-graph.js`

```js
/**
 * segment-graph.js — dependency-free SVG "GraphRAG" segment explorer.
 * 4 segment hub nodes + attribute satellites; shared attributes bridge segments.
 * Radial placement + tiny spring relaxation (no d3). Click/keyboard to isolate a
 * sub-graph and open a detail panel. Brand: flat, ink strokes, square nodes.
 */
import { prefersReducedMotion } from '../lib/reveal.js';

const NS = 'http://www.w3.org/2000/svg';
const SEG_ACCENT = {                 // stable per-segment brand colours
  architects: '--mustard',
  hustlers: '--teal-deep',
  coasters: '--mustard-dark',
  retreaters: '--ink',
};

const cssVar = (n, f) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;
const el = (tag, a = {}) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(a)) node.setAttribute(k, String(v));
  return node;
};
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s).toLowerCase().trim();

// Coarse AI-stance tag so recurring stances link segments.
const aiStance = (seg) => {
  const t = norm(seg.aiAttitude);
  if (t.includes('vanguard')) return 'AI vanguard';
  if (t.includes('necessity')) return 'AI out of necessity';
  if (t.includes("don't trust") || t.includes('do it for them')) return 'wants it done for them';
  if (t.includes('embrace')) return 'embraces AI';
  return 'uses AI';
};

const demoTags = (seg) => {
  const out = [];
  const who = norm(seg.who);
  if (who.includes('55+')) out.push('55+ skew');
  if (who.includes('25')) out.push('25-54 core');
  if (who.includes('45+')) out.push('45+ skew');
  const money = norm(seg.money);
  if (money.includes('comfortable')) out.push('comfortable');
  if (money.includes('middle')) out.push('middle income');
  if (money.includes('mid-to-low') || money.includes('stretched')) out.push('stretched');
  return out;
};

const buildAttributes = (seg, facets) => {
  const attrs = [];
  if (facets.includes('interests')) seg.interests.forEach((v) => attrs.push({ facet: 'interest', label: v }));
  if (facets.includes('channels')) seg.channels.forEach((v) => attrs.push({ facet: 'channel', label: v }));
  if (facets.includes('aiAttitude')) attrs.push({ facet: 'ai', label: aiStance(seg) });
  if (facets.includes('demographics')) demoTags(seg).forEach((v) => attrs.push({ facet: 'demo', label: v }));
  return attrs;
};

export function segmentGraph(container, opts = {}) {
  if (!container) return { el: null, selectSegment() {}, selectAttribute() {}, clear() {}, destroy() {} };
  const segments = opts.segments || [];
  if (!segments.length) return { el: null, selectSegment() {}, selectAttribute() {}, clear() {}, destroy() {} };

  const facets = opts.facets || ['interests', 'channels', 'aiAttitude', 'demographics'];
  const W = opts.width ?? 920;
  const H = opts.height ?? 640;
  const cx = W / 2, cy = H / 2;
  const reduced = prefersReducedMotion();

  // ── Build the node + edge model ────────────────────
  // Hub nodes on a ring around centre.
  const hubR = Math.min(W, H) * 0.28;
  const hubs = segments.map((s, i) => {
    const ang = (-90 + (360 / segments.length) * i) * (Math.PI / 180);
    return {
      kind: 'seg', id: s.id, label: s.name, seg: s,
      accent: cssVar(SEG_ACCENT[s.id] || '--mustard', '#FFC931'),
      x: cx + Math.cos(ang) * hubR, y: cy + Math.sin(ang) * hubR, ang, pinned: true,
    };
  });

  // Attribute nodes keyed by normalised label; remember which segments hold them.
  const attrMap = new Map();
  segments.forEach((s) => buildAttributes(s, facets).forEach((a) => {
    const key = a.facet + ':' + norm(a.label);
    const rec = attrMap.get(key) || { kind: 'attr', id: key, label: a.label, facet: a.facet, segs: [] };
    if (!rec.segs.includes(s.id)) rec.segs.push(s.id);
    attrMap.set(key, rec);
  }));
  const attrs = [...attrMap.values()];

  // Initial placement: shared attrs near the centroid of their hubs; unique attrs orbit their hub.
  attrs.forEach((a, i) => {
    const owners = hubs.filter((h) => a.segs.includes(h.id));
    const mx = owners.reduce((s, h) => s + h.x, 0) / owners.length;
    const my = owners.reduce((s, h) => s + h.y, 0) / owners.length;
    const jitter = (n) => (Math.sin(i * 12.9898 + n) * 43758.5453 % 1) * 60 - 30;
    a.x = mx + jitter(1);
    a.y = my + jitter(2);
    a.shared = a.segs.length > 1;
  });

  // Edges: every attr connects to each owning hub.
  const edges = [];
  attrs.forEach((a) => a.segs.forEach((sid) => edges.push({ a: a.id, h: sid })));

  // ── Tiny spring relaxation (no d3): pull attrs toward connected hubs,
  //    push attrs apart, keep hubs pinned. A few dozen iterations is plenty. ──
  const byId = new Map([...hubs, ...attrs].map((n) => [n.id, n]));
  const iterations = reduced ? 0 : 70;
  for (let it = 0; it < iterations; it++) {
    // repulsion between attrs
    for (let i = 0; i < attrs.length; i++) for (let j = i + 1; j < attrs.length; j++) {
      const p = attrs[i], q = attrs[j];
      let dx = p.x - q.x, dy = p.y - q.y;
      let d2 = dx * dx + dy * dy || 0.01;
      const f = 900 / d2;
      const d = Math.sqrt(d2);
      dx /= d; dy /= d;
      p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
    }
    // spring attrs toward owning hubs
    edges.forEach((e) => {
      const a = byId.get(e.a), h = byId.get(e.h);
      a.x += (h.x - a.x) * 0.02; a.y += (h.y - a.y) * 0.02;
    });
    // keep inside the frame
    attrs.forEach((a) => { a.x = Math.max(60, Math.min(W - 60, a.x)); a.y = Math.max(40, Math.min(H - 40, a.y)); });
  }

  // ── Render ─────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'sg-wrap';

  const stage = document.createElement('div');
  stage.className = 'sg-stage';
  const svg = el('svg', {
    class: 'sg-svg', viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'group', 'aria-label': opts.ariaLabel || 'Segment attribute graph',
  });

  // edges first (under nodes)
  const edgeLayer = el('g', { class: 'sg-edges' });
  edges.forEach((e) => {
    const a = byId.get(e.a), h = byId.get(e.h);
    const line = el('line', { class: 'sg-edge', x1: h.x, y1: h.y, x2: a.x, y2: a.y, 'data-h': e.h, 'data-a': e.a });
    edgeLayer.appendChild(line);
  });
  svg.appendChild(edgeLayer);

  // attribute nodes (square — brand) as focusable groups
  const mkNode = (n, cls, w, h, accent) => {
    const g = el('g', { class: cls, tabindex: '0', role: 'button',
      'data-id': n.id, 'aria-label': n.label, transform: `translate(${n.x},${n.y})` });
    g.appendChild(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h,
      fill: accent || cssVar('--paper', '#fff'), stroke: cssVar('--ink', '#000'), 'stroke-width': 1.5 }));
    const text = el('text', { class: 'sg-label', x: 0, y: 4, 'text-anchor': 'middle' });
    text.textContent = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
    g.appendChild(text);
    return g;
  };

  attrs.forEach((a) => {
    const node = mkNode(a, 'sg-attr' + (a.shared ? ' is-shared' : ''), 116, 26,
      a.shared ? cssVar('--mustard-pale', '#FFF9E2') : cssVar('--paper', '#fff'));
    a.el = node; svg.appendChild(node);
  });
  hubs.forEach((hb) => {
    const node = mkNode(hb, 'sg-hub', 150, 40, hb.accent);
    hb.el = node; svg.appendChild(node);
  });
  stage.appendChild(svg);

  // detail panel + keyboard fallback list
  const panel = document.createElement('div');
  panel.className = 'sg-panel'; panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '<p class="sg-hint">Select a segment or attribute to explore the network.</p>';
  stage.appendChild(panel);
  wrap.appendChild(stage);

  const fallback = document.createElement('ul');
  fallback.className = 'sg-fallback';
  hubs.forEach((hb) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = hb.label; b.dataset.id = hb.id;
    b.addEventListener('click', () => selectSegment(hb.id));
    li.appendChild(b); fallback.appendChild(li);
  });
  wrap.appendChild(fallback);
  container.appendChild(wrap);

  // ── Selection logic ────────────────────────────────
  const clear = () => {
    svg.classList.remove('is-focus');
    [...hubs, ...attrs].forEach((n) => n.el.classList.remove('is-on', 'is-dim'));
    edgeLayer.querySelectorAll('.sg-edge').forEach((l) => l.classList.remove('is-on', 'is-dim'));
    panel.innerHTML = '<p class="sg-hint">Select a segment or attribute to explore the network.</p>';
  };

  const selectSegment = (id) => {
    const hub = hubs.find((h) => h.id === id);
    if (!hub) return;
    svg.classList.add('is-focus');
    const live = new Set([id]);
    attrs.forEach((a) => { if (a.segs.includes(id)) live.add(a.id); });
    [...hubs, ...attrs].forEach((n) => {
      const on = n.id === id || (n.kind === 'attr' && n.segs.includes(id));
      n.el.classList.toggle('is-on', on);
      n.el.classList.toggle('is-dim', !on);
    });
    edgeLayer.querySelectorAll('.sg-edge').forEach((l) => {
      const on = l.dataset.h === id;
      l.classList.toggle('is-on', on); l.classList.toggle('is-dim', !on);
    });
    renderSegmentDetail(hub.seg);
    opts.onSelectSegment && opts.onSelectSegment(hub.seg);
  };

  const selectAttribute = (key) => {
    const a = attrs.find((x) => x.id === key);
    if (!a) return;
    svg.classList.add('is-focus');
    [...hubs, ...attrs].forEach((n) => {
      const on = n.id === key || (n.kind === 'seg' && a.segs.includes(n.id));
      n.el.classList.toggle('is-on', on);
      n.el.classList.toggle('is-dim', !on);
    });
    edgeLayer.querySelectorAll('.sg-edge').forEach((l) => {
      const on = l.dataset.a === key;
      l.classList.toggle('is-on', on); l.classList.toggle('is-dim', !on);
    });
    const owners = a.segs.map((sid) => segments.find((s) => s.id === sid)?.name).filter(Boolean);
    panel.innerHTML =
      `<span class="sg-tag">${esc(a.facet)}</span>` +
      `<h4>${esc(a.label)}</h4>` +
      `<p class="sg-shared">${a.shared ? 'Shared by ' + owners.length + ' segments' : 'Unique to one segment'}</p>` +
      `<ul class="sg-owners">${owners.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`;
    opts.onSelectAttribute && opts.onSelectAttribute(a);
  };

  const renderSegmentDetail = (s) => {
    panel.innerHTML =
      `<span class="sg-tag">${esc(s.sharePct)}% of Britain</span>` +
      `<h4>${esc(s.name)}</h4>` +
      `<p class="sg-desc">${esc(s.threeWordDescriptor)}</p>` +
      `<blockquote>“${esc(s.heroQuote)}”</blockquote>` +
      `<dl class="sg-facts">` +
      `<dt>Who</dt><dd>${esc(s.who)}</dd>` +
      `<dt>Money</dt><dd>${esc(s.money)}</dd>` +
      `<dt>AI</dt><dd>${esc(s.aiAttitude)}</dd>` +
      `</dl>`;
  };

  // wire interaction (click + Enter/Space) on every node
  const activate = (n) => (n.kind === 'seg' ? selectSegment(n.id) : selectAttribute(n.id));
  [...hubs, ...attrs].forEach((n) => {
    n.el.addEventListener('click', () => activate(n));
    n.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(n); }
      if (e.key === 'Escape') clear();
    });
  });

  return {
    el: wrap,
    selectSegment,
    selectAttribute,
    clear,
    destroy() { wrap.remove(); },
  };
}

export default segmentGraph;
```

### CSS — add to `css/sections/05-segments.css` (scoped, escaped id)

```css
#\30 5-segments .sg-stage {
  display: grid; grid-template-columns: 1fr 300px; gap: 16px;
  align-items: start;
}
@media (max-width: 880px) { #\30 5-segments .sg-stage { grid-template-columns: 1fr; } }

#\30 5-segments .sg-svg {
  display: block; width: 100%; height: auto;
  border: 1.5px solid var(--ink); background: var(--paper);
}
#\30 5-segments .sg-edge { stroke: var(--ink); stroke-opacity: .25; stroke-width: 1.2; }
#\30 5-segments .sg-svg.is-focus .sg-edge.is-dim { stroke-opacity: .06; }
#\30 5-segments .sg-edge.is-on { stroke-opacity: .9; stroke-width: 2; }

#\30 5-segments .sg-hub,
#\30 5-segments .sg-attr { cursor: pointer; }
#\30 5-segments .sg-hub:focus-visible rect,
#\30 5-segments .sg-attr:focus-visible rect { stroke-width: 3; outline: none; }
#\30 5-segments .sg-svg.is-focus .is-dim { opacity: .18; }
#\30 5-segments .sg-svg.is-focus .is-on { opacity: 1; }

#\30 5-segments .sg-label {
  font: 500 13px var(--font-sans); fill: var(--ink);
  pointer-events: none; font-variant-numeric: tabular-nums;
}
#\30 5-segments .sg-hub .sg-label { font-weight: 500; font-size: 15px; }
/* keep ink-hub labels readable on the dark fill */
#\30 5-segments .sg-hub[data-id="retreaters"] .sg-label { fill: var(--paper); }

#\30 5-segments .sg-panel {
  border: 1.5px solid var(--ink); background: var(--mustard-pale);
  padding: 16px; min-height: 200px;
}
#\30 5-segments .sg-panel .sg-hint { color: var(--ink-soft); font-size: var(--t-sm); }
#\30 5-segments .sg-tag {
  display: inline-block; font: 600 .66rem var(--font-sans);
  letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
#\30 5-segments .sg-panel h4 { font: 500 var(--t-md) var(--font-sans); margin: 4px 0; }
#\30 5-segments .sg-panel blockquote {
  border-left: 3px solid var(--mustard); margin: 8px 0; padding-left: 10px;
  font-style: italic; color: var(--ink-soft);
}
#\30 5-segments .sg-facts dt {
  font: 600 .66rem var(--font-sans); letter-spacing: .1em;
  text-transform: uppercase; color: var(--ink-soft); margin-top: 6px;
}
#\30 5-segments .sg-facts dd { margin: 0; font-size: var(--t-sm); }
#\30 5-segments .sg-owners { margin: 6px 0 0; padding-left: 18px; }

/* keyboard fallback: visible only when the SVG can't be reached by AT */
#\30 5-segments .sg-fallback {
  display: flex; gap: 8px; flex-wrap: wrap; list-style: none;
  margin: 12px 0 0; padding: 0;
}
#\30 5-segments .sg-fallback button {
  border: 1.5px solid var(--ink); background: var(--paper);
  padding: 6px 12px; font: 500 var(--t-xs) var(--font-sans); cursor: pointer;
}
#\30 5-segments .sg-fallback button:hover { background: var(--mustard-pale); }
```

### Usage — reading `data/segments.json` (chapter 05)

```js
// js/sections/05-segments.js
import segmentGraph from '../lib/segment-graph.js';

export default function init(rootEl, data) {
  const segments = data?.segments?.segments;
  if (!segments) return;                                  // fail soft
  const mount = rootEl.querySelector('[data-segment-graph]');
  if (!mount) return;

  const graph = segmentGraph(mount, {
    segments,
    facets: ['interests', 'channels', 'aiAttitude', 'demographics'],
    ariaLabel: 'The four segments and what they share',
    onSelectSegment: (s) => { /* optionally dim the dot-field clusters to match */ },
  });

  // optionally open Architects by default
  graph.selectSegment('architects');
}
```

Markup in `sections/05-segments.html`:

```html
<div class="chapter-inner">
  <!-- … axes, dot-field clusters, quiz … -->
  <div data-segment-graph></div>
</div>
```

---

## Notes for the integrator

- Both libs import only `prefersReducedMotion` from the existing `./reveal.js`
  — no new dependencies.
- Colours come from `css/vccp.css` tokens; nothing is hardcoded except brand-safe
  fallbacks inside `cssVar(...)`.
- The venn's circle order, isolate behaviour, leader-line labels and centre stat
  trace directly to AGBARR `productVenn()`; the only deliberate brand departures
  are: flat `fill-opacity` instead of `mix-blend-mode: screen`, **square** legend
  swatches/cards, ink strokes, and removal of the radial-gradient stage glow.
- The graph's "click a node → isolate its sub-graph + detail panel" loop mirrors
  the cep-explorer (value tile → reveal occasions) and the GraphRAG.jsx
  (theme → isolate → filtered detail) patterns, generalised to a true node graph.
- Both files are well under ~300 lines and are drop-in for the `js/lib/` pattern.
```
