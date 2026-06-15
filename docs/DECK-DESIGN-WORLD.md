# The State of Independence — Deck Design World

A visual brief extracted from the source deck (`STATE OF INDEPENDENCE.pptx`, 112 slides) so the
website can adopt its look. This is about the **visuals**, not the words (narrative lives in
`deck-narrative.md`). Reference images are saved in `docs/qa/deck-ref/`.

## How this was captured

Full slide-to-PDF render was not possible on this machine (no LibreOffice / `pdftoppm`; the
PowerPoint AppleScript export silently failed under sandboxing). So the design world was
reconstructed from: (1) a QuickLook render of the cover slide, (2) the first frame of the
animated cover GIF, and (3) the 185 embedded media images mapped back to their slides via the
slide `.rels` files. Many "design" slides (segmentation 2×2, empowerment architecture, the
five-moves dividers, the less→more tables) are built from **native PowerPoint shapes + text**,
not images — so their look is typographic/vector and is described from the slide XML + narrative
rather than a pixel render.

---

## 1. Colour usage (what's actually in the deck)

The deck is **not** a flat two-colour mustard/teal system. It runs a warmer, richer palette than
the core VCCP brand, plus genuine dark slides and full-colour photography.

| Role | Colour | Where it appears |
|---|---|---|
| Hero / brand primary | **Mustard→orange** (≈ `#FFC107` warming to `#FF9E1B`) | The maze, the bear-vs-figure "world" fields, divider grounds. Note this is a **gradient**, not flat. |
| Deep accent / "the bear" | **Navy** (≈ `#0A1A5C` / `#101F5B`) | The bear silhouette, the figure, the "Brand asks" bars, dark section grounds. |
| Ring / orbit / cool accent | **Teal-blue / cyan** (≈ `#2BB7E8`→`#80E8E3`) | The elliptical orbit line around the cover maze; appendix-coded charts. |
| Chart "AI use" series | **Bright azure blue** (≈ `#1E90FF`) | Segment data-card top bar group. |
| Chart "AI attitude" series | **Orange** (≈ `#F7941E`) | Middle bar group on every segment card. |
| Chart "brand asks" series | **Navy / black** (≈ `#0A1A5C`) | Bottom bar group on every segment card. |
| Bar track (empty) | **Pale peach / cream** (≈ `#FBEEE2`) | The unfilled portion of every bar. |
| Page ground | **Warm off-white / cream** (≈ `#F4F1EA`) | Cover and most light slides — warmer than pure white. |
| Spot pop | **Magenta / hot pink** (≈ `#F22DCB`) | A single circle top-right of the cover. Used very sparingly as a "spark". |
| Dark slides | **Deep navy / near-black, textured** | Velvet-textured navy grounds (image22) and blue gradient grounds (image27) sit behind quote / twist moments. |

**Takeaways for the web:**
- The deck's mustard is **warmer and more orange** than the brand `#FFC931`, and it is frequently
  used as a **gradient** (mustard→orange). The website's brand rule is flat mustard, no gradients
  — see the "Reconciliation" section.
- Teal is used as a thin **line/orbit accent**, not a fill — closer to the brand's "teal = appendix"
  idea but used decoratively on the hero.
- Navy is a genuine third brand colour in the deck, doing the heavy lifting for "the bear" and for
  serious data. The website should treat navy as the deck's signature dark.
- There ARE dark slides and full-colour photography. The site is otherwise a light, square-cornered
  mustard system, so dark moments should be deliberate punctuation, not the default.

---

## 2. Imagery / illustration style

Three distinct image registers run through the deck:

**(a) The "girl vs bear" hero illustration — the signature motif.**
The VCCP logo (small child squaring up to a bear) is rendered literally as the cover scene:
- A **3D isometric maze** in mustard/orange, drawn with clean flat-shaded faces (lighter top, darker
  sides) — no texture, no outline.
- A **navy bear** sitting *inside* the maze (the challenge/threat at the centre).
- A tiny **navy female figure holding a map/phone**, walking in at the maze entrance (active agency).
- A **teal/cyan elliptical orbit ring** sweeping around the whole composition (the "system" / the
  dimension of agency). On the cover it is an animated GIF — the ring orbits.
- Set on warm off-white, with a single **magenta dot** top-right.
This is the strongest, most ownable image in the deck. See `01-cover-maze.png` / `02-cover-maze-iso.png`.

**(b) The "survival mode vs active agency" world fields.**
Full-bleed mustard→orange gradient panels with a large **cream/white bear silhouette** (head only,
facing right) on the left and a small **cream standing figure** facing it on the right. Thin white
**looping orbit lines** and small seed/dot motifs connect them; one version (image23) tightens the
loops into a globe-like sphere of lines. This is the calm, illustrative metaphor for
"battening down / head in sand" → "looking into the storm / walking purposefully".
See `03-bear-vs-figure-world.png`.

**(c) The bear as a graphic stamp.**
A rough, hand-drawn-edged **black bear silhouette** (image190) is used full-bleed as a recurring
device on the "twists" slides — bold, editorial, almost a watermark. See `05-bear-silhouette-fullbleed.png`.

**(d) Photography & real-world mockups (the supporting evidence layer).**
Lots of genuine photography: British Gas "Fairness matters" billboard mockups with blue fuzzy
mascots, energy/solar fields, petrol-station news clips, Guardian/Grocer news screenshots, Prime
Video / Deliveroo / Vinted UI screenshots, a Cadbury chocolate cutout. These illustrate the
"unplug from the grid / lipstick on a pig / prison-hotel" arguments and brand exemplars. They are
photographic and varied — used as **proof and example**, framed inside square cards/billboards.
See `06-photographic-ad-mockup.png`.

**Icon style:** simple, single-weight line/solid icons (segment markers, "save me time/money/stress").
Several were still placeholders in the deck ("CAN YOU MAKE THESE INTO ICONS").

---

## 3. Typographic treatment

- **Huge percentage numbers as the hero element.** `77%`, `60%`, `54%`, `58%`, `6.42/10`,
  `53% → 24%` — the stat is the headline. Heavy weight, large, paired with a short bold label and a
  supporting sentence beneath.
- **Bold uppercase section labels** with a kicker line above (e.g. `THE NUMBERS YOU ALREADY KNOW ·
  THE MOOD OF THE NATION`). Strong eyebrow/kicker convention on every content slide.
- **Headlines set in two weights / a hanging second line** — e.g. "Anxiety runs ahead of
  *circumstance.*" where the emphasis word drops to its own line. Sentence-case headlines, bold.
- **Quote styling:** large hanging quotation marks, the quote in regular weight, attribution in a
  small caps/grey line beneath (e.g. "Southampton, 63, Architects"). Quotes are given full-slide or
  half-slide real estate — they're treated as evidence, not decoration.
- **Type-as-image:** on photographic ad mockups, big white headline overlays the photo (British Gas
  "Energy prices that can only go down" with "down" curving down the slide).
- **Page furniture:** running slide counter `01 / 12` and `© VCCP MEDIA 2026` bottom-corner; source
  line in small grey type at the foot of every data slide.

---

## 4. Layout motifs

- **Full-bleed dividers** for the five moves: a giant stage number (`01`–`05`) then a full-bleed
  title slide ("UNPLUG THEM FROM THE GRID", etc.). Big number → big statement.
- **Stage-number treatment:** large `01`/`02`… set on its own, then repeated small alongside the
  move title on the recap slide.
- **The less → more table.** Recurring three-row comparison: a `Less` column vs a `More` column with
  ~3 paired rows (e.g. "Prison Hotel" → "Hacking the System"; "Lipstick on a Pig" → "Backing it up";
  "Opaque" → "Transparent"). This is a signature device — the *evolution* from old behaviour to new.
- **2×2 segmentation map.** Axes PESSIMISTIC↔OPTIMISTIC (x) and PASSIVE↔PROACTIVE (y), four named
  quadrants (Architects 17 / Hustlers 28 / Coasters 27 / Retreaters 28), each with a % and an icon.
- **Segment profile cards.** Consistent layout: segment name + %, a one-line descriptor
  ("Organised. Positive. In control."), a hero quote, WHO / MONEY / ESSENTIALS data blocks, and the
  standardised **"AI & BRAND" data card** (see below). A persistent four-segment legend strip runs
  down the side so you always know where you are.
- **The "AI & BRAND" data card** (the most reusable component): cream card, **square corners**, thin
  black border, bold black uppercase title with a full-width horizontal rule under it, then three
  labelled bar groups (blue / orange / navy) on pale-peach tracks with bold right-aligned % labels.
  See `04-segment-data-card.png`.
- **Empowerment architecture:** three stacked/grouped "SAVE ME MONEY / TIME / STRESS" blocks —
  a simple three-pillar layout.
- **Split-screen comparisons:** "Flexible spend | Ring-fenced holiday", "Human professional | AI",
  "Survival mode | Active agency" — two halves, a divider, often with a `>` between them.

---

## 5. Standout compositions worth recreating on the web

1. **The animated isometric maze hero** (cover) — mustard maze, navy bear, navy figure with map,
   orbiting teal ring. The single most ownable asset. A scroll-/load-triggered orbit animation would
   translate beautifully.
2. **The bear-vs-figure gradient world panel** — full-bleed mustard→orange, cream bear silhouette
   left, small figure right, looping orbit lines between. Ideal as a chapter-transition or the
   "survival mode → active agency" pivot.
3. **The less → more comparison table** — a clean, repeatable two-column "evolution" component for
   each of the five moves.
4. **The big-number stat slide** — huge %, bold label, one supporting sentence, source footnote.
   The backbone of the "numbers you already know" and "twists" chapters.
5. **The segment "AI & BRAND" bar card** — the colour-coded, square-cornered, bordered chart card.

---

## 6. Per-chapter recommendations (01-cover … 09-outro)

Bring deck elements in **while staying inside the VCCP brand system** (mustard `#FFC931` primary,
teal `#80E8E3` appendix accent, Inter Tight, square corners, no gradients, highlighter parallelogram).
Where the deck diverges, reconcile per section 7.

- **01 — Cover / hero.** Recreate the isometric maze + navy bear + figure + orbiting teal ring as the
  hero. Build it as flat-shaded SVG (mustard faces, navy bear/figure, teal stroke ring) animated with
  a CSS/JS orbit — no raster gradient. Off-white ground, optional single magenta accent dot. This is
  the money shot; lead with it.
- **02 — The numbers you already know.** Use the **big-number stat** layout: oversized `77%` / `55%`
  / `60%` / `54%` in mustard or navy, bold kicker label, one supporting sentence, grey source line.
  Bars use the deck's colour-coding convention. Keep tracks pale (use a tint of mustard rather than
  the deck's peach to stay on-brand).
- **03 — The twists in the story.** Lean into the **bear-as-graphic-stamp** (black bear silhouette
  watermark) and the `53% → 24%` spread / `6.42/10` gauge. This is where a **dark slide** is earned —
  a navy section ground behind the trust paradox would echo the deck. Split-screen
  "Human professional | AI" and "Flexible spend | Ring-fenced holiday".
- **04 — Dig deeper / the 2×2.** Recreate the **agency 2×2 map** with the four labelled quadrants,
  PESSIMISTIC↔OPTIMISTIC × PASSIVE↔PROACTIVE axes, % per quadrant. Square cells, mustard/teal/navy
  coding, simple line icons.
- **05 — Four segments.** Recreate the **segment profile card + "AI & BRAND" bar card**: square
  corners, thin border, bold underlined section title, three colour-coded bar groups. Keep the
  persistent four-segment legend so the reader always knows the quadrant. Map the deck's blue/orange/
  navy bar series onto the brand palette (mustard / teal / navy) for consistency, or keep blue/orange
  as a deliberate data-coding exception.
- **06 — Survival mode → active agency / empowerment architecture.** Use the **bear-vs-figure world
  panel** as the pivot visual, and the **SAVE ME MONEY / TIME / STRESS** three-pillar block. This is
  the emotional turn — give it a full-bleed moment.
- **07 — Five signature moves.** Use the **stage-number divider** treatment (`01`–`05` huge) and the
  **less → more comparison table** for each move ("Prison Hotel → Hacking the System", "Lipstick on a
  Pig → Backing it up", etc.). Pull in the photographic ad-mockup register as evidence cards
  (British Gas, Vinted, Money Saving Expert) framed in square cards.
- **08 — Recap / "hand them the tools".** Five-move recap list (the deck stacks all five titles), the
  Martin Lewis "hand them the tools" pull-quote in the large hanging-quote style.
- **09 — Outro / appendix.** Team credits grid; "making the most of the data" CTA. This is where the
  **teal appendix accent** is correct per brand. Keep `© VCCP MEDIA 2026` page furniture.

---

## 7. Where the deck diverges from the website brand system — and how to reconcile

| Deck does this | Brand rule | Reconciliation |
|---|---|---|
| Mustard→orange **gradients** on hero/world panels | Flat mustard, **no gradients** | Recreate the maze/world as **flat-shaded SVG** — use two flat mustard tints for the iso-faces (light top / darker side) to read as 3D without an actual gradient. Keeps the iso look, obeys the rule. |
| Genuine **dark navy slides** + velvet textures | Light, off-white default | Allow **one or two deliberate dark sections** (the trust paradox in ch.03; maybe the hero). Treat navy as the deck's signature dark; use flat navy, drop the texture. |
| **Photography** (ad mockups, news clips, UI) | Brand is flat-colour/illustration | Keep photography **inside square-cornered cards/billboards** as an "evidence" layer, clearly distinct from the illustrated brand world. Don't let it bleed into the brand surfaces. |
| Bright **azure blue + orange** chart series | Mustard primary, teal appendix | Either remap to mustard/teal/navy, or keep blue/orange as a **consistent, intentional data-coding system** (AI-use / AI-attitude / brand-asks) — but apply it the same way everywhere. |
| **Magenta** spark dot | Not in brand palette | Use extremely sparingly (one accent on the hero) or drop it. |
| Rounded-ish billboard frames in mockups | **Square corners** | Re-frame all mockups with square corners on the site. |
| Warmer **cream** ground (`#F4F1EA`) + **peach** bar tracks | Off-white | Nudge to the brand off-white; use a pale mustard tint for tracks instead of peach. |

**Net:** the deck's *world* (isometric maze, girl-vs-bear, bear silhouette stamp, big numbers,
less→more tables, agency 2×2, segment data cards) ports cleanly into the brand system if you (a)
render gradients as flat-tint SVG, (b) ration dark slides and photography as deliberate punctuation,
and (c) standardise the chart colour-coding. The mustard maze + orbiting teal ring is the hero idea
to build the whole site's visual identity around.
