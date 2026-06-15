/**
 * segment-graph.js — dependency-free SVG "GraphRAG" segment explorer.
 *
 * Client spec (FEEDBACK-V3 §3, verbatim): "graphrag circular cells and
 * backgroundless with UI physics no text overlap".
 *
 *  - CIRCULAR cells: segment hubs are large filled circles (navy / per-segment
 *    accent), attribute satellites are small circles. No rectangular label
 *    boxes anywhere.
 *  - BACKGROUNDLESS: the <svg> is transparent — no panel, plate, or bg rect.
 *    The network floats on the section ground.
 *  - LIVE FORCE PHYSICS: a continuous, gently-damped force-directed simulation
 *    runs on requestAnimationFrame (charge repulsion + link springs + light
 *    centering + a collision radius that accounts for label width). The network
 *    breathes and settles; nodes never overlap. Dragging a node nudges it.
 *    Under prefers-reduced-motion the sim runs a fixed number of ticks up front
 *    then freezes — still spread and legible, no animation.
 *  - NO TEXT OVERLAP: hub labels are always shown and the collision radius keeps
 *    the four hubs far apart. Attribute labels are shown only for the hovered /
 *    focused / selected node(s) — at most a small handful at a time — so labels
 *    can never pile onto one another.
 *
 * Factory contract (unchanged — ch05 depends on it):
 *   segmentGraph(container, opts)
 *     -> { el, selectSegment(id), selectAttribute(key), clear(), destroy() }
 *
 * Colour tokens are read from CSS custom properties. CSS keys off the same
 * classes as before (.sg-hub, .sg-attr, .sg-edge, .sg-label, .sg-panel,
 * .sg-fallback, .sg-svg.is-focus, .is-on, .is-dim).
 */

const NS = 'http://www.w3.org/2000/svg';

// Stable per-segment brand colours for the hub circles.
const SEG_ACCENT = {
  architects: '--mustard',
  hustlers: '--teal-deep',
  coasters: '--mustard-dark',
  retreaters: '--soi-navy',
};

const cssVar = (n, f) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;

// ── Contrast-safe label colour (pick ink/cream for higher WCAG ratio on the
//    node's own fill) so a hub label never sits same-on-same. ──
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
const labelOn = (fill) => {
  const lf = luminance(fill);
  const ink = cssVar('--ink', '#000');
  const cream = cssVar('--soi-cream', '#EEE9DD');
  return contrast(lf, luminance(cream)) > contrast(lf, luminance(ink)) ? cream : ink;
};

const elNS = (tag, a = {}) => {
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
  const noop = { el: null, selectSegment() {}, selectAttribute() {}, clear() {}, destroy() {} };
  if (!container) return noop;
  const segments = opts.segments || [];
  if (!segments.length) return noop;

  const facets = opts.facets || ['interests', 'channels', 'aiAttitude', 'demographics'];
  const W = opts.width ?? 920;
  const H = opts.height ?? 600;
  const cx = W / 2, cy = H / 2;
  const reduced = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Geometry (all circular) ──────────────────────────────────────────────
  const HUB_R = 40;            // hub circle radius
  const SAT_R = 11;            // attribute circle radius
  const HUB_COLLIDE = 132;     // hub keep-out (its always-on label is wide)
  const SAT_COLLIDE = 26;      // satellite keep-out (label is hidden at rest)
  const HUB_SAT_COLLIDE = HUB_R + SAT_R + 22;
  const PAD = 56;              // keep node centres inside the frame

  // Force constants — gentle, damped.
  const CHARGE = 2600;         // inverse-square repulsion strength
  const SPRING = 0.018;        // link spring stiffness
  const REST_HUB = 150;        // rest length, hub → its attributes
  const CENTER = 0.0016;       // light pull toward canvas centre
  const HUB_CENTER = 0.004;    // hubs sit on a ring, pulled to their anchor
  const DAMPING = 0.86;        // velocity damping per tick
  const MAX_V = 14;            // velocity clamp for stability
  const REDUCED_TICKS = 320;   // up-front ticks when motion is reduced

  // ── Build the node + edge model ───────────────────────────────────────────
  const hubR = Math.min(W, H) * 0.30;
  const hubs = segments.map((s, i) => {
    const ang = (-90 + (360 / segments.length) * i) * (Math.PI / 180);
    const ax = cx + Math.cos(ang) * hubR;
    const ay = cy + Math.sin(ang) * hubR;
    return {
      kind: 'seg', id: s.id, label: s.name, seg: s,
      accent: cssVar(SEG_ACCENT[s.id] || '--mustard', '#FFC931'),
      r: HUB_R, collide: HUB_COLLIDE,
      x: ax, y: ay, vx: 0, vy: 0, anchorX: ax, anchorY: ay,
    };
  });

  // Attribute nodes keyed by normalised label; remember owning segments.
  const attrMap = new Map();
  segments.forEach((s) => buildAttributes(s, facets).forEach((a) => {
    const key = a.facet + ':' + norm(a.label);
    const rec = attrMap.get(key) || { kind: 'attr', id: key, label: a.label, facet: a.facet, segs: [] };
    if (!rec.segs.includes(s.id)) rec.segs.push(s.id);
    attrMap.set(key, rec);
  }));
  const attrs = [...attrMap.values()];
  const hubById = new Map(hubs.map((h) => [h.id, h]));

  // Seed attribute positions near their owning hub (shared attrs at centroid),
  // with a small deterministic jitter so the sim has a non-degenerate start.
  let seed = 1;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  attrs.forEach((a) => {
    a.shared = a.segs.length > 1;
    a.r = SAT_R; a.collide = SAT_COLLIDE;
    const owners = a.segs.map((sid) => hubById.get(sid));
    const mx = owners.reduce((s, h) => s + h.x, 0) / owners.length;
    const my = owners.reduce((s, h) => s + h.y, 0) / owners.length;
    const jx = (rnd() - 0.5) * 120, jy = (rnd() - 0.5) * 120;
    a.x = mx + jx; a.y = my + jy; a.vx = 0; a.vy = 0;
  });

  // Edges: every attr connects to each owning hub.
  const edges = [];
  attrs.forEach((a) => a.segs.forEach((sid) => edges.push({ a: a.id, h: sid })));

  const nodes = [...hubs, ...attrs];
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // ── Force simulation tick (damped) ─────────────────────────────────────────
  const clamp = (n) => {
    const m = n.r + 6;
    n.x = Math.max(PAD + m, Math.min(W - PAD - m, n.x));
    n.y = Math.max(PAD + m, Math.min(H - PAD - m, n.y));
  };

  const tick = () => {
    // charge repulsion (all pairs)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j];
        let dx = p.x - q.x, dy = p.y - q.y;
        let d2 = dx * dx + dy * dy || 0.01;
        let d = Math.sqrt(d2);
        const f = CHARGE / d2;
        const ux = dx / d, uy = dy / d;
        p.vx += ux * f; p.vy += uy * f;
        q.vx -= ux * f; q.vy -= uy * f;

        // collision: never let two circles' keep-out radii overlap
        const minD = p.collide + q.collide;
        if (d < minD) {
          const push = (minD - d) * 0.5;
          p.vx += ux * push; p.vy += uy * push;
          q.vx -= ux * push; q.vy -= uy * push;
        }
        // hub ↔ satellite hard separation (keep satellites off the hub disc)
        if ((p.kind === 'seg') !== (q.kind === 'seg')) {
          if (d < HUB_SAT_COLLIDE) {
            const push = (HUB_SAT_COLLIDE - d) * 0.5;
            p.vx += ux * push; p.vy += uy * push;
            q.vx -= ux * push; q.vy -= uy * push;
          }
        }
      }
    }

    // link springs (attr → owning hub, toward rest length)
    edges.forEach((e) => {
      const a = byId.get(e.a), h = byId.get(e.h);
      let dx = h.x - a.x, dy = h.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - REST_HUB) * SPRING;
      const ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f;
      h.vx -= ux * f * 0.25; h.vy -= uy * f * 0.25;
    });

    // centering + hub anchor (hubs hold the ring; attrs drift to centre softly)
    nodes.forEach((n) => {
      if (n.kind === 'seg') {
        n.vx += (n.anchorX - n.x) * HUB_CENTER;
        n.vy += (n.anchorY - n.y) * HUB_CENTER;
      } else {
        n.vx += (cx - n.x) * CENTER;
        n.vy += (cy - n.y) * CENTER;
      }
    });

    // integrate with damping + velocity clamp; skip the actively dragged node
    nodes.forEach((n) => {
      if (n === dragNode) { n.vx = 0; n.vy = 0; return; }
      n.vx *= DAMPING; n.vy *= DAMPING;
      const v = Math.hypot(n.vx, n.vy);
      if (v > MAX_V) { n.vx = n.vx / v * MAX_V; n.vy = n.vy / v * MAX_V; }
      n.x += n.vx; n.y += n.vy;
      clamp(n);
    });
  };

  let dragNode = null;

  // ── Render ─────────────────────────────────────────────────────────────────
  const wrap = document.createElement('div');
  wrap.className = 'sg-wrap';

  const stage = document.createElement('div');
  stage.className = 'sg-stage';
  const svg = elNS('svg', {
    class: 'sg-svg', viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'group', 'aria-label': opts.ariaLabel || 'Segment attribute graph',
  });

  // edges first (under nodes)
  const edgeLayer = elNS('g', { class: 'sg-edges' });
  const edgeEls = edges.map((e) => {
    const a = byId.get(e.a), h = byId.get(e.h);
    const line = elNS('line', { class: 'sg-edge', x1: h.x, y1: h.y, x2: a.x, y2: a.y, 'data-h': e.h, 'data-a': e.a });
    edgeLayer.appendChild(line);
    return { e, line };
  });
  svg.appendChild(edgeLayer);

  const ink = cssVar('--ink', '#000');
  const creamFill = cssVar('--soi-cream-warm', '#FAE9C5');
  const tealFill = cssVar('--teal', '#80E8E3');

  // Build a circular node group: <circle> + (optional) <text> label.
  const mkNode = (n, cls, fill, showLabel) => {
    const g = elNS('g', {
      class: cls, tabindex: '0', role: 'button',
      'data-id': n.id, 'aria-label': n.label, transform: `translate(${n.x},${n.y})`,
    });
    g.appendChild(elNS('circle', {
      class: 'sg-dot', r: n.r, cx: 0, cy: 0,
      fill, stroke: cssVar('--soi-navy', '#0A1A5C'),
      'stroke-width': n.kind === 'seg' ? 0 : 1.25,
    }));
    const text = elNS('text', {
      class: 'sg-label', 'text-anchor': 'middle',
      x: 0, y: n.kind === 'seg' ? 4 : n.r + 14,
      fill: n.kind === 'seg' ? labelOn(fill) : cssVar('--soi-navy', '#0A1A5C'),
    });
    const raw = n.label;
    text.textContent = raw.length > 26 ? raw.slice(0, 25) + '…' : raw;
    if (!showLabel) text.style.opacity = '0';
    g.appendChild(text);
    n.el = g; n.labelEl = text;
    return g;
  };

  // satellites under hubs in z-order
  attrs.forEach((a) => {
    const fill = a.shared ? tealFill : creamFill;
    svg.appendChild(mkNode(a, 'sg-attr' + (a.shared ? ' is-shared' : ''), fill, false));
  });
  hubs.forEach((hb) => {
    svg.appendChild(mkNode(hb, 'sg-hub', hb.accent, true)); // hub labels always on
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

  // ── Paint positions from the model to the DOM each frame ───────────────────
  const paint = () => {
    nodes.forEach((n) => n.el.setAttribute('transform', `translate(${n.x.toFixed(2)},${n.y.toFixed(2)})`));
    edgeEls.forEach(({ e, line }) => {
      const a = byId.get(e.a), h = byId.get(e.h);
      line.setAttribute('x1', h.x.toFixed(2)); line.setAttribute('y1', h.y.toFixed(2));
      line.setAttribute('x2', a.x.toFixed(2)); line.setAttribute('y2', a.y.toFixed(2));
    });
  };

  // ── Selection logic ────────────────────────────────────────────────────────
  let selectedId = null;

  const setLabelVisible = (n, on) => {
    if (n.kind === 'seg') return;            // hub labels always visible
    n.labelEl.style.opacity = on ? '1' : '0';
  };

  const clear = () => {
    selectedId = null;
    svg.classList.remove('is-focus');
    nodes.forEach((n) => {
      n.el.classList.remove('is-on', 'is-dim');
      setLabelVisible(n, false);
    });
    edgeEls.forEach(({ line }) => line.classList.remove('is-on', 'is-dim'));
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
    selectedId = id;
    svg.classList.add('is-focus');
    nodes.forEach((n) => {
      const on = n.id === id || (n.kind === 'attr' && n.segs.includes(id));
      n.el.classList.toggle('is-on', on);
      n.el.classList.toggle('is-dim', !on);
      // show labels only for this hub's attributes (its own sub-graph)
      setLabelVisible(n, on && n.kind === 'attr');
    });
    edgeEls.forEach(({ e, line }) => {
      const on = e.h === id;
      line.classList.toggle('is-on', on); line.classList.toggle('is-dim', !on);
    });
    renderSegmentDetail(hub.seg);
    opts.onSelectSegment && opts.onSelectSegment(hub.seg);
  };

  const selectAttribute = (key) => {
    const a = attrs.find((x) => x.id === key);
    if (!a) return;
    selectedId = key;
    svg.classList.add('is-focus');
    nodes.forEach((n) => {
      const on = n.id === key || (n.kind === 'seg' && a.segs.includes(n.id));
      n.el.classList.toggle('is-on', on);
      n.el.classList.toggle('is-dim', !on);
      // only the selected attribute keeps its label up
      setLabelVisible(n, n.id === key);
    });
    edgeEls.forEach(({ e, line }) => {
      const on = e.a === key;
      line.classList.toggle('is-on', on); line.classList.toggle('is-dim', !on);
    });
    const owners = a.segs.map((sid) => segments.find((s) => s.id === sid)?.name).filter(Boolean);
    panel.innerHTML =
      `<span class="sg-tag">${esc(a.facet)}</span>` +
      `<h4>${esc(a.label)}</h4>` +
      `<p class="sg-shared">${a.shared ? 'Shared by ' + owners.length + ' segments' : 'Unique to one segment'}</p>` +
      `<ul class="sg-owners">${owners.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>`;
    opts.onSelectAttribute && opts.onSelectAttribute(a);
  };

  // ── Interaction: click / keyboard / hover-label / drag ─────────────────────
  const activate = (n) => (n.kind === 'seg' ? selectSegment(n.id) : selectAttribute(n.id));

  nodes.forEach((n) => {
    n.el.addEventListener('click', () => activate(n));
    n.el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(n); }
      if (e.key === 'Escape') clear();
    });
    // transient label on hover / focus (only when not in a selection)
    const showTransient = () => { if (!selectedId) setLabelVisible(n, true); };
    const hideTransient = () => { if (!selectedId) setLabelVisible(n, false); };
    n.el.addEventListener('mouseenter', showTransient);
    n.el.addEventListener('mouseleave', hideTransient);
    n.el.addEventListener('focus', showTransient);
    n.el.addEventListener('blur', hideTransient);
  });

  // Pointer-drag nudges a node; the sim re-settles around it.
  const clientToSvg = (clientX, clientY) => {
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    };
  };
  let pointerMoved = false;
  const onPointerDown = (n) => (ev) => {
    dragNode = n; pointerMoved = false;
    n.el.setPointerCapture && n.el.setPointerCapture(ev.pointerId);
  };
  const onPointerMove = (ev) => {
    if (!dragNode) return;
    pointerMoved = true;
    const p = clientToSvg(ev.clientX, ev.clientY);
    dragNode.x = p.x; dragNode.y = p.y; dragNode.vx = 0; dragNode.vy = 0;
    clamp(dragNode);
    if (reduced) { for (let i = 0; i < 8; i++) tick(); paint(); }
  };
  const onPointerUp = () => { dragNode = null; };
  nodes.forEach((n) => n.el.addEventListener('pointerdown', onPointerDown(n)));
  svg.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  // suppress the click that follows a real drag
  nodes.forEach((n) => n.el.addEventListener('click', (ev) => {
    if (pointerMoved) { ev.stopImmediatePropagation(); pointerMoved = false; }
  }, true));

  // ── Run the simulation ──────────────────────────────────────────────────────
  let rafId = null;
  if (reduced) {
    for (let i = 0; i < REDUCED_TICKS; i++) tick();
    paint();
  } else {
    let frames = 0;
    const loop = () => {
      tick();
      paint();
      frames++;
      // keep a continuous gentle breathe, but if it has clearly settled and
      // nothing is being dragged for a long while, idle out to save cycles.
      const energy = nodes.reduce((s, n) => s + Math.hypot(n.vx, n.vy), 0);
      if (frames > 600 && energy < 0.4 && !dragNode) { rafId = null; return; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    // wake the sim back up on interaction so dragging always animates
    const wake = () => { if (rafId == null) { rafId = requestAnimationFrame(loop); } };
    svg.addEventListener('pointerdown', wake);
    svg.addEventListener('pointermove', () => { if (dragNode) wake(); });
  }

  return {
    el: wrap,
    selectSegment,
    selectAttribute,
    clear,
    destroy() {
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointerup', onPointerUp);
      wrap.remove();
    },
  };
}

export default segmentGraph;
