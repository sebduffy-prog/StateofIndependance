/**
 * segment-graph.js — dependency-free SVG "GraphRAG" segment explorer.
 * 4 segment hub nodes + attribute satellites; shared attributes bridge segments.
 * Wide radial seed + a small spring relaxation (no d3) that solves a spread,
 * non-overlapping layout. Click/keyboard to isolate a sub-graph and open a
 * detail panel. Brand: flat, ink strokes, square nodes.
 *
 * Factory contract (matches js/lib/* pattern):
 *   segmentGraph(container, opts)
 *     -> { el, selectSegment(id), selectAttribute(key), clear(), destroy() }
 * Reads colour tokens from CSS custom properties. The layout solve is a one-off
 * static computation (positions set directly, never tweened), so it is legible
 * under prefers-reduced-motion without any animation.
 */

const NS = 'http://www.w3.org/2000/svg';
const SEG_ACCENT = {                 // stable per-segment brand colours
  architects: '--mustard',
  hustlers: '--teal-deep',
  coasters: '--mustard-dark',
  retreaters: '--ink',
};

const cssVar = (n, f) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;

// Relative luminance of a hex/rgb colour, so a node label is always set to a
// deliberate, legible foreground against its OWN fill (contrast-safety §6) —
// dark fills (retreaters ink, hustlers teal-deep) get a light label, light
// fills get an ink label. Fixes the "Retreaters ink-on-dark" offender at the
// source without changing the API.
const toRgb = (c) => {
  const s = String(c).trim();
  if (s.startsWith('#')) {
    const h = s.length === 4
      ? s.slice(1).split('').map((x) => x + x).join('')
      : s.slice(1, 7);
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map((v) => parseFloat(v)); return [p[0], p[1], p[2]]; }
  return [255, 255, 255];
};
const luminance = (c) => {
  const [r, g, b] = toRgb(c).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const hi = Math.max(a, b), lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
};
// Legible label colour for a given node fill: pick whichever of ink/cream
// yields the HIGHER WCAG contrast ratio. A flat luminance threshold fails on
// mid-tone fills (teal-deep, mustard-dark) where cream and ink both sit near
// the middle — comparing the two ratios always lands on the readable choice.
const labelOn = (fill) => {
  const lf = luminance(fill);
  const ink = cssVar('--ink', '#000');
  const cream = cssVar('--soi-cream', '#EEE9DD');
  return contrast(lf, luminance(cream)) > contrast(lf, luminance(ink)) ? cream : ink;
};
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
  if (facets.includes('interests')) (seg.interests || []).forEach((v) => attrs.push({ facet: 'interest', label: v }));
  if (facets.includes('channels')) (seg.channels || []).forEach((v) => attrs.push({ facet: 'channel', label: v }));
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

  // Layout tuning. Label boxes are wide (≈116px), so the sim has to keep node
  // centres far enough apart that the boxes (and their text) never overlap.
  const SAT_W = 116, SAT_H = 26;          // attribute (satellite) box size
  const HUB_W = 150, HUB_H = 40;          // segment (hub) box size
  const MIN_GAP_X = SAT_W + 30;           // min centre-to-centre x to avoid box overlap
  const MIN_GAP_Y = SAT_H + 26;           // min centre-to-centre y
  // Keep-out around hub boxes too, so satellites never crowd the hubs.
  const HUB_GAP_X = (SAT_W + HUB_W) / 2 + 18;
  const HUB_GAP_Y = (SAT_H + HUB_H) / 2 + 14;
  const PAD_X = 74, PAD_Y = 46;           // keep node centres (and their boxes) inside the frame
  const ITERATIONS = 420;
  const REPULSION = 8600;                 // inverse-square spread (kept strong)
  const SPRING = 0.012;                   // gentle pull toward owning hubs
  const IDEAL_EDGE = 152;                 // rest length of a hub→attr edge
  const SEPARATE = 0.55;                  // share of box overlap resolved per pair per pass
  const SETTLE_PASSES = 60;               // final box-only separation passes (full resolve)

  // ── Build the node + edge model ────────────────────
  // Hub nodes on a generous ring around centre, so the four camps stay anchored
  // in the corners and the satellites have the full canvas to spread into.
  const hubR = Math.min(W, H) * 0.30;
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
  attrs.forEach((a) => { a.shared = a.segs.length > 1; });

  const hubById = new Map(hubs.map((h) => [h.id, h]));

  // ── Seed positions WIDE so the relaxation starts un-piled and converges fast.
  //    Unique attrs fan out in an arc on the OUTWARD side of their hub; shared
  //    attrs start at the centroid of the hubs they bridge. ──
  const SEED_ARC = (150 * Math.PI) / 180;
  const SEED_RINGS = [128, 196, 264];
  const perHub = new Map(hubs.map((h) => [h.id, []]));
  attrs.forEach((a) => { if (!a.shared) perHub.get(a.segs[0]).push(a); });
  perHub.forEach((list, hid) => {
    const h = hubById.get(hid);
    const n = list.length;
    const perRing = Math.max(1, Math.ceil(n / SEED_RINGS.length));
    list.forEach((a, k) => {
      const ring = Math.min(Math.floor(k / perRing), SEED_RINGS.length - 1);
      const slot = k - ring * perRing;
      const count = Math.min(perRing, n - ring * perRing);
      const t = count > 1 ? slot / (count - 1) - 0.5 : 0;  // -0.5..0.5 across the arc
      const ang = h.ang + t * SEED_ARC;                     // arc centred on hub's outward bearing
      const r = SEED_RINGS[ring];
      a.x = h.x + Math.cos(ang) * r;
      a.y = h.y + Math.sin(ang) * r;
    });
  });
  attrs.forEach((a) => {
    if (!a.shared) return;
    const owners = a.segs.map((sid) => hubById.get(sid));
    const mx = owners.reduce((s, h) => s + h.x, 0) / owners.length;
    const my = owners.reduce((s, h) => s + h.y, 0) / owners.length;
    a.x = mx; a.y = my;
  });

  // Edges: every attr connects to each owning hub.
  const edges = [];
  attrs.forEach((a) => a.segs.forEach((sid) => edges.push({ a: a.id, h: sid })));

  // ── Spring relaxation (no d3): inverse-square repulsion + an axis-aligned box
  //    collision separation (the part that actually stops labels overlapping),
  //    a gentle spring toward owning hubs, then clamp inside padded bounds.
  //    This is a one-off static solve (positions are set directly, never tweened),
  //    so it runs even under prefers-reduced-motion — reduced motion suppresses
  //    ANIMATION, not the legible spread. The wide seed just gives it a head start. ──
  const byId = new Map([...hubs, ...attrs].map((n) => [n.id, n]));
  const clampNode = (a) => {
    a.x = Math.max(PAD_X, Math.min(W - PAD_X, a.x));
    a.y = Math.max(PAD_Y, Math.min(H - PAD_Y, a.y));
  };
  const iterations = ITERATIONS;
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < attrs.length; i++) for (let j = i + 1; j < attrs.length; j++) {
      const p = attrs[i], q = attrs[j];
      let dx = p.x - q.x, dy = p.y - q.y;

      // 1) hard box separation: if the label boxes overlap, push apart along the
      //    shallower axis just enough to clear them (split between the two nodes).
      const overlapX = MIN_GAP_X - Math.abs(dx);
      const overlapY = MIN_GAP_Y - Math.abs(dy);
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          const push = (dx >= 0 ? 1 : -1) * overlapX * SEPARATE;
          p.x += push; q.x -= push;
        } else {
          const push = (dy >= 0 ? 1 : -1) * overlapY * SEPARATE;
          p.y += push; q.y -= push;
        }
      }

      // 2) soft inverse-square repulsion keeps the field evenly spread.
      const d2 = dx * dx + dy * dy || 0.01;
      const d = Math.sqrt(d2);
      const f = REPULSION / d2;
      dx /= d; dy /= d;
      p.x += dx * f; p.y += dy * f; q.x -= dx * f; q.y -= dy * f;
    }
    // hub keep-out: push any satellite out of a hub's box footprint (hubs are
    // pinned, so the whole correction lands on the satellite).
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      for (let k = 0; k < hubs.length; k++) {
        const h = hubs[k];
        const dx = a.x - h.x, dy = a.y - h.y;
        const ox = HUB_GAP_X - Math.abs(dx);
        const oy = HUB_GAP_Y - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          if (ox < oy) a.x += (dx >= 0 ? 1 : -1) * ox;
          else a.y += (dy >= 0 ? 1 : -1) * oy;
        }
      }
    }
    // spring attrs toward owning hubs (toward rest length, not collapsed onto hub)
    edges.forEach((e) => {
      const a = byId.get(e.a), h = byId.get(e.h);
      let dx = h.x - a.x, dy = h.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - IDEAL_EDGE) * SPRING;
      a.x += (dx / d) * f; a.y += (dy / d) * f;
    });
    attrs.forEach(clampNode);
  }

  // ── Final settling: box-only separation with NO repulsion or springs, so the
  //    last word on layout is "boxes do not overlap". Each pass fully resolves
  //    every overlapping pair (split 50/50) and re-applies hub keep-out, then
  //    clamps. Converges to a guaranteed non-overlapping arrangement. ──
  for (let pass = 0; pass < SETTLE_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < attrs.length; i++) for (let j = i + 1; j < attrs.length; j++) {
      const p = attrs[i], q = attrs[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const overlapX = MIN_GAP_X - Math.abs(dx);
      const overlapY = MIN_GAP_Y - Math.abs(dy);
      if (overlapX > 0 && overlapY > 0) {
        moved = true;
        if (overlapX < overlapY) {
          const push = (dx >= 0 ? 1 : -1) * overlapX * 0.5;
          p.x += push; q.x -= push;
        } else {
          const push = (dy >= 0 ? 1 : -1) * overlapY * 0.5;
          p.y += push; q.y -= push;
        }
      }
    }
    for (let i = 0; i < attrs.length; i++) {
      const a = attrs[i];
      for (let k = 0; k < hubs.length; k++) {
        const h = hubs[k];
        const dx = a.x - h.x, dy = a.y - h.y;
        const ox = HUB_GAP_X - Math.abs(dx);
        const oy = HUB_GAP_Y - Math.abs(dy);
        if (ox > 0 && oy > 0) {
          moved = true;
          if (ox < oy) a.x += (dx >= 0 ? 1 : -1) * ox;
          else a.y += (dy >= 0 ? 1 : -1) * oy;
        }
      }
    }
    attrs.forEach(clampNode);
    if (!moved) break;
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
    const fill = accent || cssVar('--paper', '#fff');
    const g = el('g', { class: cls, tabindex: '0', role: 'button',
      'data-id': n.id, 'aria-label': n.label, transform: `translate(${n.x},${n.y})` });
    g.appendChild(el('rect', { x: -w / 2, y: -h / 2, width: w, height: h,
      fill, stroke: cssVar('--ink', '#000'), 'stroke-width': 1.5 }));
    // Explicit, luminance-derived label colour so no label sits same-on-same.
    const text = el('text', { class: 'sg-label', x: 0, y: 4, 'text-anchor': 'middle',
      fill: labelOn(fill) });
    text.textContent = n.label.length > 22 ? n.label.slice(0, 21) + '…' : n.label;
    g.appendChild(text);
    return g;
  };

  attrs.forEach((a) => {
    const node = mkNode(a, 'sg-attr' + (a.shared ? ' is-shared' : ''), SAT_W, SAT_H,
      a.shared ? cssVar('--mustard-pale', '#FFF9E2') : cssVar('--paper', '#fff'));
    a.el = node; svg.appendChild(node);
  });
  hubs.forEach((hb) => {
    const node = mkNode(hb, 'sg-hub', HUB_W, HUB_H, hb.accent);
    node.setAttribute('data-id', hb.id);
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

  const selectSegment = (id) => {
    const hub = hubs.find((h) => h.id === id);
    if (!hub) return;
    svg.classList.add('is-focus');
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

  // wire interaction (click + Enter/Space, Escape clears) on every node
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
