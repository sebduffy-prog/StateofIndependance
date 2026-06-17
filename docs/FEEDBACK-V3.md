# FEEDBACK-V3 — "make it perfect" punch-list (2026-06-15)

Consolidated client feedback from the live site review (stateof-independance-three.vercel.app).
The design direction is right ("we're close on design, layout perfect" in places). This pass is
about PRECISION. Every item below is a hard requirement. Companion: DESIGN-WORLD-V2.md.

## 1. Backgroundless components (core ask: "no plain white background")
- NO component sits in a white/cream box. Charts, the venn, the segment graph, evidence panels:
  transparent backgrounds, sitting directly on the section ground.
- NO white chart tracks. A bar's empty track is a faint INK/navy tint (e.g. rgba(0,0,0,0.06)),
  never a white/paper rectangle with a black border (kill the "boxed bar" look entirely).
- Venn (ch06): remove the cream panel behind it; circles float on the gradient ground.
- Segment graph (ch05): remove the beige panel behind it; the network floats on the ground.

## 2. Overlap errors (several confirmed — zero tolerance)
- proportionStrip labels collide: e.g. ch05/ch08 "Cannot afford basics / spending / 6% / 60%"
  print on top of each other. Fix: labels must never overlap — stack vertically with room, or
  place above/below alternating, or only label segments wide enough; tiny segments get a leader.
- ch06 reframe wipe renders the "old model" AND "true data" copy ON TOP of each other (both
  layers visible at once). Fix: the clip must fully hide the inactive side; only one set of copy
  is ever legible at a given slider position.
- Segment-graph labels overlap each other and the hub, and get clipped at edges. Fix via §4.
- General: audit every chapter for text-on-text, element-on-element, and nav-over-content.

## 3. The GraphRAG segment explorer, redesigned (ch05) — client spec verbatim:
"graphrag circular cells and backgroundless with UI physics no text overlap"
- CIRCULAR cells/nodes, not rectangular label boxes. Segments = larger circles; attributes =
  smaller circles. Labels sit inside or beside their circle without overlapping neighbours.
- BACKGROUNDLESS: no panel behind the graph; it lives on the section ground.
- UI PHYSICS: a live force-directed simulation (gentle continuous motion / settling), nodes
  repel so labels never collide; dragging a node is a plus. Respect reduced-motion (settle then
  stop).
- NO TEXT OVERLAP, ever — collision/repulsion must guarantee legibility.

## 4. The Britain map (ch02) — "map of britain isnt britain"
- The current SVG path is an unrecognisable blob. Replace with an ACCURATE Great Britain
  silhouette (recognisable Scotland/England/Wales outline; a real simplified GB path). The 8
  qual-city markers sit at roughly correct geographic positions on it.

## 5. Faint bear-figure world (ch06 reframe + anywhere) — contrast
- The cream bear-figure world panel is cream-on-cream and nearly invisible. Give it real
  contrast (navy/ink silhouettes on the warm ground, or sufficient tonal separation). It must
  read clearly.

## 6. Fill the screen + DEAD SPACE (general, client: "fills laptop screen well", "watch for deadspace")
- Each chapter should fill a laptop/monitor viewport well — no half-empty screens.
- Hunt DEAD SPACE everywhere: sections shorter than the viewport with big empty bands, large
  empty regions beside content (e.g. a chart hugging the left with a vast empty right), oversized
  containers around small charts, gaps at the bottom of sections. Rebalance so content uses the
  space or the space is deliberately compositional (orbit motifs, silhouettes) — never accidental
  emptiness.

## 7. Cut the sources (client: "we dont need sources cut them for now but remember them")
- HIDE all source captions site-wide (the ".vccp-source" / "Source: VCCP x Watermelon…" lines,
  the CI footnotes, the TGI source line). Simplest: a global rule hiding them, or remove the
  nodes. The source STRINGS stay in data/*.json and STORY.md (remembered, re-addable later).

## 8. Type feels "plain and generic" — make Inter Tight sing
- Inter Tight stays the brand font. Display titles move 700 -> 900 (Black; woff2 already in
  assets/fonts/ as inter-tight-900.woff2 + 800). Add @font-face for 800/900 (+italics) in
  vccp.css; .si-display uses 900 with tighter negative tracking (~-0.025em), line-height ~0.88,
  bigger scale. Stronger weight/scale contrast vs body. Make the hero + section titles punchy
  like the deck, not default-grotesque.

## Keep
All interactions + verified data intact. Square corners (charts now box-less). No fabricated
numbers. No console.log. Reduced-motion safe. Mustard/warm dominant, navy for dark moments,
contrast-safety (no same-colour-on-colour). Deck move titles (Unplug them from the grid / Be the
trusted antidote / Ride the social self-help wave / Kill the mental load / Boost good behaviours).
