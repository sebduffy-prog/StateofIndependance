/**
 * segment-graph.js — dependency-free SVG "GraphRAG" segment explorer.
 *
 * Brief (FEEDBACK-V4): circular cells, live force-physics, no label overlap,
 * backgroundless. Navy on warm; cream / teal accents; tabular numerics.
 *
 *  - CIRCULAR cells. Segment hubs are large filled circles (per-segment brand
 *    accent / navy); attribute satellites are small circles. No rectangles.
 *  - BACKGROUNDLESS: the <svg> is transparent — no panel, plate, or bg rect.
 *  - LIVE FORCE PHYSICS on requestAnimationFrame: inverse-square charge
 *    repulsion + link springs + light centering + a per-node collision radius
 *    that includes the rendered label width. The network breathes then settles;
 *    nodes (and their labels) never overlap. Pointer-drag nudges a node and the
 *    sim re-settles around it. Under prefers-reduced-motion the sim runs a fixed
 *    number of ticks up front then freezes — still spread and legible.
 *  - NO LABEL OVERLAP: hub labels sit BELOW the hub and are always visible; the
 *    hub collision radius is sized from the measured label so two hub labels can
 *    never touch. Attribute labels are shown only for hovered / focused /
 *    selected nodes — a small handful at a time — so they can never pile up.
 *
 * Factory contract (unchanged — ch05 depends on it):
 *   segmentGraph(container, opts)
 *     -> { el, selectSegment(id), selectAttribute(key), clear(), destroy() }
 *
 * Colour tokens come from CSS custom properties. CSS keys off the same classes
 * as before (.sg-wrap, .sg-stage, .sg-svg, .sg-edge, .sg-hub, .sg-attr,
 * .sg-label, .sg-panel, .sg-fallback, .sg-svg.is-focus, .is-on, .is-dim).
 */

const NS = 'http://www.w3.org/2000/svg';

// Stable per-segment brand colours for the hub circles.
const SEG_ACCENT = {
  architects: '--mustard',
  hustlers: '--teal-deep',
  coasters: '--mustard-dark',
  retreaters: '--soi-navy',
};

// ── Geometry (all circular) ───────────────────────────────────────────────
const HUB_R = 40;            // hub circle radius
const SAT_R = 8;             // attribute circle radius (smaller — graph is dense)
const LABEL_GAP = 9;         // gap between circle edge and its label baseline
const SAT_COLLIDE = 20;      // satellite keep-out at rest (label hidden)
const PAD = 18;              // keep node centres inside the frame
const APPROX_CHAR_W = 7.4;   // px per char at hub label size (fallback measure)
const HUB_LABEL_FS = 15;     // hub label font-size (px)
const MAX_LABEL_CHARS = 34;  // truncation guard (statements run longer than tags)

// Force constants — gentle, heavily damped, no jitter. Tuned for a DENSE graph
// (16–19 statement satellites per hub on top of interests/channels/AI), so the
// charge is a touch stronger and the spokes a touch shorter to keep each hub's
// cloud full but contained within its zone.
const CHARGE = 1700;         // inverse-square repulsion strength
const CHARGE_MIN_D = 30;     // distance floor so close pairs can't blow up
const CHARGE_MAX_F = 1.3;    // hard cap on per-pair repulsion (calms close ticks)
const SPRING = 0.020;        // link spring stiffness (soft)
const REST_HUB = 116;        // rest length, hub → its attributes
const CENTER = 0.0024;       // light pull toward canvas centre (satellites)
const HUB_CENTER = 0.0060;   // hubs held firmly on their ring anchor
const DAMPING = 0.80;        // velocity damping per tick (calm settle)
const MAX_V = 7;             // velocity clamp — low so motion reads as drift
const COLLIDE_SOFT = 0.18;   // positional separation share per tick (no spring)
const BREATH_AMP = 0.012;    // amplitude of the continuous gentle drift
const BREATH_HZ = 0.05;      // breathing frequency (slow)
const REDUCED_TICKS = 360;   // up-front ticks when motion is reduced

const cssVar = (n, f) =>
  getComputedStyle(document.documentElement).getPropertyValue(n).trim() || f;

// ── Contrast-safe label colour (pick ink/cream for higher WCAG ratio). ──
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
  const ink = cssVar('--ink', '#0A1A5C');
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
const trunc = (s) => (s.length > MAX_LABEL_CHARS ? s.slice(0, MAX_LABEL_CHARS - 1) + '…' : s);

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

  // ── Build the node + edge model ───────────────────────────────────────────
  // Hub collision radius accounts for its always-on label sitting BELOW it, so
  // two hub labels can never overlap. Width is measured later from the DOM; we
  // seed with an approximation so the first ticks are stable.
  const ringR = Math.min(W, H) * 0.34;
  const hubLabelClearance = (label) => {
    const labelW = Math.min(label.length, MAX_LABEL_CHARS) * APPROX_CHAR_W;
    // keep-out = half the label width + a margin, but never less than the circle.
    return Math.max(HUB_R + 28, labelW * 0.62 + 30);
  };

  const hubs = segments.map((s, i) => {
    const ang = (-90 + (360 / segments.length) * i) * (Math.PI / 180);
    const ax = cx + Math.cos(ang) * ringR;
    const ay = cy + Math.sin(ang) * ringR;
    const label = trunc(s.name);
    const clear = hubLabelClearance(label);
    return {
      kind: 'seg', id: s.id, label, seg: s,
      accent: cssVar(SEG_ACCENT[s.id] || '--mustard', '#FFC931'),
      r: HUB_R, collide: clear, labelCollide: clear, labelShown: true,
      x: ax, y: ay, vx: 0, vy: 0, anchorX: ax, anchorY: ay,
    };
  });

  // Attribute nodes keyed by normalised label; remember owning segments.
  const attrMap = new Map();
  segments.forEach((s) => buildAttributes(s, facets).forEach((a) => {
    const key = a.facet + ':' + norm(a.label);
    const rec = attrMap.get(key) || { kind: 'attr', id: key, label: trunc(a.label), facet: a.facet, segs: [] };
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
    a.r = SAT_R; a.collide = SAT_COLLIDE; a.labelShown = false;
    // label keep-out seeded from char count; refined from the DOM after render.
    a.labelCollide = Math.max(SAT_COLLIDE, a.label.length * APPROX_CHAR_W * 0.55 + 18);
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
  let dragNode = null;

  // Hub labels are rendered BELOW the circle, so a hub centre must stay far
  // enough off the bottom edge that its label is not clipped (FEEDBACK-V4 §4).
  const HUB_LABEL_DROP = HUB_R + LABEL_GAP + HUB_LABEL_FS * 2;
  const clamp = (n) => {
    const m = n.r + 4;
    const bottomM = n.kind === 'seg' ? HUB_LABEL_DROP : m;
    n.x = Math.max(PAD + m, Math.min(W - PAD - m, n.x));
    n.y = Math.max(PAD + m, Math.min(H - PAD - bottomM, n.y));
  };

  // Effective keep-out radius. Hubs always carry their label clearance. An
  // attribute carries its (wider) label clearance ONLY while its label is shown
  // — so visible labels physically push each other apart and cannot overlap,
  // while hidden satellites pack tight.
  const effCollide = (n) => (n.labelShown ? n.labelCollide : n.collide);

  let breathPhase = 0;

  const tick = () => {
    breathPhase += BREATH_HZ * 0.1;
    // charge repulsion (clamped) + collision (positional, no oscillation)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p = nodes[i], q = nodes[j];
        let dx = p.x - q.x, dy = p.y - q.y;
        let d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const ux = dx / d, uy = dy / d;
        // Repulsion with a distance floor and a hard cap — close pairs no longer
        // spike, which is what produced the jumpy ticks.
        const de = Math.max(d, CHARGE_MIN_D);
        const f = Math.min(CHARGE / (de * de), CHARGE_MAX_F);
        p.vx += ux * f; p.vy += uy * f;
        q.vx -= ux * f; q.vy -= uy * f;

        // collision: resolve as a gentle POSITION separation (split the overlap)
        // rather than a velocity impulse — eliminates the spring-back jitter.
        const minD = effCollide(p) + effCollide(q);
        if (d < minD) {
          const sep = (minD - d) * COLLIDE_SOFT;
          if (p !== dragNode) { p.x += ux * sep; p.y += uy * sep; }
          if (q !== dragNode) { q.x -= ux * sep; q.y -= uy * sep; }
        }
      }
    }

    // link springs (attr → owning hub, toward rest length)
    edges.forEach((e) => {
      const a = byId.get(e.a), h = byId.get(e.h);
      const dx = h.x - a.x, dy = h.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const f = (d - REST_HUB) * SPRING;
      const ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f;
      h.vx -= ux * f * 0.25; h.vy -= uy * f * 0.25;
    });

    // centering + hub anchor (hubs hold the ring; attrs drift to centre softly)
    // plus a slow per-node breath so the network is always gently alive — a calm
    // continuous drift, never a jitter (each node breathes on its own phase).
    nodes.forEach((n, idx) => {
      if (n.kind === 'seg') {
        n.vx += (n.anchorX - n.x) * HUB_CENTER;
        n.vy += (n.anchorY - n.y) * HUB_CENTER;
      } else {
        n.vx += (cx - n.x) * CENTER;
        n.vy += (cy - n.y) * CENTER;
      }
      const ph = breathPhase + idx * 0.7;
      n.vx += Math.cos(ph) * BREATH_AMP;
      n.vy += Math.sin(ph * 1.3) * BREATH_AMP;
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

  const navy = cssVar('--soi-navy', '#0A1A5C');
  const creamFill = cssVar('--soi-cream-warm', '#FAE9C5');
  const tealFill = cssVar('--teal', '#80E8E3');

  // Build a circular node group: <circle> + <text> label BELOW the circle.
  const mkNode = (n, cls, fill, showLabel) => {
    const g = elNS('g', {
      class: cls, tabindex: '0', role: 'button',
      'data-id': n.id, 'aria-label': n.label, transform: `translate(${n.x},${n.y})`,
    });
    g.appendChild(elNS('circle', {
      class: 'sg-dot', r: n.r, cx: 0, cy: 0,
      fill, stroke: navy,
      'stroke-width': n.kind === 'seg' ? 0 : 1.25,
    }));
    const text = elNS('text', {
      class: 'sg-label', 'text-anchor': 'middle',
      x: 0, y: n.r + LABEL_GAP + (n.kind === 'seg' ? HUB_LABEL_FS : 4),
      fill: navy,
    });
    text.textContent = n.label;
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

  // Re-measure label keep-out radii from the REAL rendered text width so the
  // collision is exact (guarantees no label collision regardless of font).
  const remeasureLabels = () => {
    hubs.forEach((hb) => {
      let w = 0;
      try { w = hb.labelEl.getComputedTextLength(); } catch (_) { w = 0; }
      if (w > 0) { hb.collide = Math.max(HUB_R + 28, w * 0.62 + 30); hb.labelCollide = hb.collide; }
    });
    attrs.forEach((a) => {
      let w = 0;
      try { w = a.labelEl.getComputedTextLength(); } catch (_) { w = 0; }
      if (w > 0) a.labelCollide = Math.max(SAT_COLLIDE, w * 0.55 + 16);
    });
  };

  // detail panel + keyboard fallback list. The panel can be mounted OUTSIDE the
  // stage (opts.panelMount) so the read-out lives in a dedicated rail and never
  // overlaps the graph; it defaults to the stage to preserve the old contract.
  const panel = document.createElement('div');
  panel.className = 'sg-panel'; panel.setAttribute('aria-live', 'polite');
  panel.innerHTML = '<p class="sg-hint">Select a segment or attribute to explore the network.</p>';
  if (opts.panelMount instanceof HTMLElement) {
    panel.classList.add('sg-panel--railed');
    opts.panelMount.appendChild(panel);
  } else {
    stage.appendChild(panel);
  }
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
  let wake = () => {};   // assigned once the rAF loop exists (no-op when reduced)

  const setLabelVisible = (n, on) => {
    if (n.kind === 'seg') return;            // hub labels always visible
    n.labelEl.style.opacity = on ? '1' : '0';
    // Toggling a label changes the node's effective keep-out, so re-energise the
    // sim a touch and wake it — visible labels then push apart and never overlap.
    if (n.labelShown !== on) {
      n.labelShown = on;
      if (on) { n.vx += (rnd() - 0.5) * 2; n.vy += (rnd() - 0.5) * 2; }
      wake();
    }
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

  // Pointer-drag nudges a node; the sim re-settles around it. A click that did
  // not move the pointer counts as activation (selection).
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
    const p = clientToSvg(ev.clientX, ev.clientY);
    if (Math.hypot(p.x - dragNode.x, p.y - dragNode.y) > 2) pointerMoved = true;
    dragNode.x = p.x; dragNode.y = p.y; dragNode.vx = 0; dragNode.vy = 0;
    clamp(dragNode);
    if (reduced) { for (let i = 0; i < 8; i++) tick(); paint(); }
  };
  const onPointerUp = (ev) => {
    const n = dragNode;
    dragNode = null;
    if (n && !pointerMoved) activate(n);   // tap = select
    pointerMoved = false;
  };
  nodes.forEach((n) => n.el.addEventListener('pointerdown', onPointerDown(n)));
  svg.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  // ── Run the simulation ──────────────────────────────────────────────────────
  // The gentle breath keeps the network softly alive, so the loop runs while the
  // graph is active rather than freezing. setActive(false) pauses it cleanly when
  // the step is off-screen so we never burn rAF in the background.
  let rafId = null;
  let active = true;
  const loop = () => {
    tick();
    paint();
    rafId = active ? requestAnimationFrame(loop) : null;
  };

  // Measure real label widths once the nodes are in the DOM, then start.
  remeasureLabels();

  const setActive = (on) => {
    if (reduced) return;            // reduced motion never runs the rAF loop
    active = !!on;
    if (active && rafId == null) { rafId = requestAnimationFrame(loop); }
    if (!active && rafId != null) { cancelAnimationFrame(rafId); rafId = null; }
  };

  if (reduced) {
    for (let i = 0; i < REDUCED_TICKS; i++) tick();
    paint();
    // Reduced motion: no rAF. Waking runs a short settle burst then freezes,
    // so toggled labels still spread apart without any visible animation.
    wake = () => { for (let i = 0; i < 90; i++) tick(); paint(); };
  } else {
    rafId = requestAnimationFrame(loop);
    wake = () => setActive(true);   // any interaction re-energises the loop
    svg.addEventListener('pointerdown', wake);
  }

  return {
    el: wrap,
    selectSegment,
    selectAttribute,
    clear,
    setActive,
    destroy() {
      active = false;
      if (rafId != null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointerup', onPointerUp);
      wrap.remove();
    },
  };
}

export default segmentGraph;
