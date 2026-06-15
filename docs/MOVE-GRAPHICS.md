# Chapter 07 — Five Signature Moves: Icon Graphics

Source of truth for the five signature-move lockups from the new deck
(`STATE OF INDEPENDENCE.pptx`, the "five moves" slide). Reference image:
`~/Downloads/Screenshot 2026-06-15 at 11.27.35.png`.

## Approach: AUTHORED (inline SVG)

The deck's five move icons are baked into the rendered moves slide as thin-line
white icons on the orange gradient ground — they are NOT isolable as clean
transparent assets in `assets/deck-src/` (that folder holds photographic ad
mockups, brand/social logos, portrait headshots, chart slides, and decorative
scribble strokes — not the move icons). So the icons were **hand-authored** as
crisp single-colour inline SVGs matching the deck's flat thin-line style.

- Each icon is a 64×64 viewBox, `stroke="currentColor"`, 3px stroke, round
  caps/joins — a flat line-art look matching the deck.
- `currentColor` means the ch07 agent tints them per the V2 contrast rules:
  **navy (`--soi-navy` #0A1A5C) or ink on warm amber/mustard grounds; cream
  (`--soi-cream`) on dark navy/blue grounds.** Never mustard-on-mustard.
- No baked fill colour, no white box, no background — they sit transparent on
  whatever ground the chapter places them on.

## Mapping: move number → file → exact deck TITLE

| # | File | Exact deck title | Icon |
|---|------|------------------|------|
| 01 | `assets/deck/icons/move-01.svg` | **UNPLUG THEM FROM THE GRID** | plug + trailing cable + lightning bolt |
| 02 | `assets/deck/icons/move-02.svg` | **BE THE TRUSTED ANTIDOTE** | microscope + chemistry flask |
| 03 | `assets/deck/icons/move-03.svg` | **RIDE THE SOCIAL SELF-HELP WAVE** | surfer riding a curling wave |
| 04 | `assets/deck/icons/move-04.svg` | **KILL THE MENTAL LOAD** | brain + heartbeat pulse line |
| 05 | `assets/deck/icons/move-05.svg` | **BOOST GOOD BEHAVIOURS** | star medal on a ribbon |

## Title casing note

The deck sets these titles in heavy, tight UPPERCASE Inter Tight (e.g. the
emphasis word — TRUSTED, SELF-HELP, MENTAL, GOOD — dropping to its own heavier
line). Use the exact wording above; apply the deck's uppercase display
treatment in ch07's own type styles.
