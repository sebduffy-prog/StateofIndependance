# STORY.md — editorial spine for The State of Independence

This is the canonical copy + data spec for the site. Section builders copy from this file
verbatim. Every stat traces to `docs/deck-narrative.md` (slide refs) or `data-src/`
(question codes, recomputed from `cocl_segmented.csv` / `cocl_crosstab.json`).
**Deck wins on conflict.** Display values = deck-rounded; "exact" = recomputed from data.

Headline convention: sentence case, the ONE highlighter-parallelogram word is marked
with *asterisks*. Max two highlighter motifs per surface.

Standard source line (footnote on every data surface):
`Source: VCCP x Watermelon Research COCL survey · 1,504 UK adults 18+, nat. rep. · May 2026.`

---

## Data notes for all builders (read first)

- **Crosstab label bug:** in `cocl_crosstab.json` section "Mindset Q2 (net agree)", the
  row labelled "Optimistic about next decade" (77.3) is actually Q2r3 "I am more careful
  with money than I was five years ago" (see Datamap in `COCL Final data.xlsx`). Do not
  render that label.
- **Segment naming:** the deck uses Architects / Hustlers / Coasters / Retreaters at
  17% / 28% / 27% / 28%. `cocl_crosstab.json` uses older labels Adapters / Strivers /
  Coasters / Retreaters with survey n = 357 / 345 / 215 / 587. Quadrant mapping:
  Adapters→Architects (optimistic x proactive), Strivers→Hustlers (pessimistic x
  proactive), Coasters→Coasters, Retreaters→Retreaters. **Always display the deck
  sizes (17/28/27/28)**; per the deck footnote, "Segment-level figures are not in the
  COCL survey file." When showing crosstab per-segment data (chapter 08), relabel to
  deck names.
- No pie/donut charts. Tabular numbers. Up-shift = teal-deep #00BCA5, down-shift =
  mustard-dark #FF8812. Quotes are verbatim — do not tidy grammar.

---

## Chapter 01 — cover

**Headline:** The state of *independence*
**Kicker (above headline):** The Challenger Series · VCCP
**Standfirst (157 chars):** Britain has stopped waiting to be rescued. A nationwide study of how people are taking back control — and what it demands of every brand that serves them.

Supporting copy (from slide 2, may be trimmed for the cover):
> The State of Independence is part of VCCP's Challenger Series. VCCP's logo is a young
> girl standing up to a bear. It encapsulates our commitment to face up to life's biggest
> challenges. Challenger doesn't mean underdog. It means taking on the challenges in the
> category, and winning. The Challenger Series is therefore about embracing the
> industry's big questions, and answering them.

Brand assets: `assets/brand/Girl_and_Bear.png` (black silhouette, never on mustard,
never animated/distorted). Stats: none on the cover.

---

## Chapter 02 — research

**Headline:** How we *listened* to Britain
**Standfirst (165 chars):** A nationally representative survey of 1,504 UK adults, paired with week-long video diaries in eight cities. Numbers for the what, real lives for the why.

Stats (slides 6, 7, 94, 95):

| Value | Label | Source | Code |
|---|---|---|---|
| 1,504 | human respondents (nat rep) | Slide 6 / 94 | — |
| 18+ | British adults aged 18+ | Slide 6 / 94 | — |
| mid-May 2026 | quantitative fieldwork | Slide 6 / 94 | — |
| 8 | cities for qualitative research | Slide 7 / 95 | — |
| 1 week | video diaries per family/individual, conducted early June | Slide 7 / 95 | — |

Qual cities (slide 7): Cardiff, Bury, Watford, Southampton, Glasgow, Bristol, Wigan, London.
Qual sample: families & individuals, week-long video diaries, conducted in early June.

Research partner credit: VCCP x Watermelon Research.

Team (slides 5, 92 — for credits, here or chapter 09): Michael Lee, Chief Strategy
Officer · Stefan Siedentopf, Deputy CSO · Jenny Nichols, Deputy CSO · Will Parrish,
Chief Strategy Officer, VCCP Media · Ellie Gauci, Head of Strategy, CRM, Loyalty & Data.

---

## Chapter 03 — baselines

**Section kicker:** The numbers you already know
**Headline:** Carefulness is the new *baseline*
**Standfirst (160 chars):** Yes, the country is cost-conscious. Yes, budgets are constricted. These hallmarks of the squeeze are the operational floor — table stakes, not the strategy.

Framing copy (slide 79 notes, verbatim option):
> These five classic hallmarks of a cost-of-living squeeze form the undeniable
> operational floor for modern British commerce — but they are table stakes, not the
> strategy.

### 3.1 The mood of the nation (slides 10, 98)

Hero stat: **77%** — are more careful with money than they were five years ago —
carefulness is now the default lens on every spend decision. (Q2r3; exact 77.3)

How the country feels right now (% agree, Q2 net agree):

| Value | Label | Source | Code | Exact |
|---|---|---|---|---|
| 77% | More careful with money than 5 yrs ago | Slide 10 | Q2r3 | 77.3 |
| 60% | Feel anxious about coming months | Slide 10 | Q2r2 | 60.2 |
| 55% | More emotionally exhausted than pre-pandemic | Slide 10 | Q2r5 | 54.8 |
| 54% | More self-reliant than 5 yrs ago | Slide 10 | Q2r6 | 54.3 |
| 51% | Prioritise enjoying life now | Slide 10 | Q2r4 | 51.2 |
| 47% | In control of my financial future | Slide 10 | Q2r1 | 46.7 |

### 3.2 Everyday behaviour (slides 11, 81)

Hero stat: **55%** — actively hunt out deals and shop around — deal-seeking is a habit
now, not a chore. (Q6Ar4; exact 54.5)

Slide 81 alt copy: "More than half the country treats deal-seeking as a habit, not a
chore." Visual idea from deck: waffle grid, "each square = 1 in 100 UK adults".

Money-saving moves in the last 3 months (%, Q6A, exact values from `cocl_segmented.csv`):

| Value | Label | Source | Code |
|---|---|---|---|
| 54.5% | Shopped around / researched deals | Slide 11 + data-src | Q6Ar4 |
| 42.6% | Switched to supermarket own-label | Slide 11 + data-src | Q6Ar1 |
| 29.6% | Downgraded / stopped a subscription | Slide 11 + data-src | Q6Ar2 |
| 24.7% | Protected a treat for wellbeing | Slide 11 + data-src | Q6Ar3 |

### 3.3 The near-term mood (slides 12, 82)

Hero stat: **60%** — feel anxious about what the next few months bring — even where
finances are stable. The mood is forward-looking and unsettled. (Q2r2; exact 60.2)

Very/extremely concerned about availability (%, Q8A, exact values from `cocl_segmented.csv`):

| Value | Label | Source | Code |
|---|---|---|---|
| 44.8% | Fuel (petrol / diesel) | Slide 12 + data-src | Q8Ar1 |
| 36.8% | Fresh food staples | Slide 12 + data-src | Q8Ar2 |
| 33.4% | Essential medicines | Slide 12 + data-src | Q8Ar4 |
| 13.9% | Tech / electronics | Slide 12 + data-src | Q8Ar3 |

### 3.4 Where intent becomes action (slides 13, 83)

Hero stat: **54%** — are trading down to cheaper grocery alternatives — the single
clearest behavioural signal in the data. (Q6Br1; exact 53.6)

Slide 83 split visual: TRADING DOWN 54% / HOLDING THEIR BASKET 46%. Alt copy: "Over
half are actively swapping to own-label, value ranges and smaller baskets."

Where Britain has traded down (%, Q6B, exact values from `cocl_crosstab.json`):

| Value | Label | Source | Code |
|---|---|---|---|
| 53.6% | Groceries | Slide 13 + data-src | Q6Br1 |
| 30.2% | Fashion | Slide 13 + data-src | Q6Br5 |
| 29.3% | Entertainment | Slide 13 + data-src | Q6Br7 |
| 22.3% | Mobile / phone | Slide 13 + data-src | Q6Br3 |
| 21.9% | Beauty | Slide 13 + data-src | Q6Br6 |
| 19.8% | Broadband | Slide 13 + data-src | Q6Br4 |
| 17.3% | Energy | Slide 13 + data-src | Q6Br8 |
| 16.8% | Insurance | Slide 13 + data-src | Q6Br2 |

---

## Chapter 04 — twists

**Section kicker:** The twists in the story
**Headline:** There are *twists* in the story
**Standfirst (179 chars):** Beneath the expected cutbacks, three anomalies emerge. This is not a population retreating into a bunker — it is rewriting the rules of survival, institutional trust and technology.

Framing copy (slide 84 notes, verbatim option):
> Look beneath the surface of expected financial cutbacks, and three fascinating
> behavioral anomalies emerge. These numbers don't show a population that is passively
> retreating into a bunker; they reveal a population rewriting the rules of survival,
> institutional trust, and technology.

### 4.1 Twist one — the institutional trust paradox (slides 15, 84, 91)

Sub-headline: Banks are no longer the enemy. / Even though it's slipping. (slide 91)

| Value | Label | Source | Code |
|---|---|---|---|
| 6.42 / 10 | NHS trust score — the single most trusted institution in the UK | Slide 84 / 91 | Q7r1 (mean) |
| 53% | say NHS performance has declined over the past decade | Slide 84 / 91 | Q8Cr1 (exact 52.6) |
| 53% → 24% | NHS at the top to government at the bottom — a 29-point spread in who Britain trusts to be there | Slide 15 | Q7 (% rating 7–10) |

Lead copy (slide 15): "Share who are confident (7–10 out of 10) that each institution
will reliably support them over the next 12 months. Just one of seven clears 50% — and
government trails every other institution."
Slide 84 line: "high regard and falling confidence, side by side."

Confidence each institution will reliably support them, next 12 months (% rating 7–10,
Q7, exact values from `cocl_segmented.csv`, deck order slide 15):

| Value | Label | Code |
|---|---|---|
| 52.8% | NHS | Q7r1 |
| 49.1% | Banks / financial | Q7r6 |
| 45.9% | Public transport | Q7r3 |
| 40.4% | Employers | Q7r7 |
| 38.9% | Energy providers | Q7r2 |
| 37.0% | Education system | Q7r4 |
| 23.9% | Government | Q7r5 |

% who say it has declined over the past 10 years (Q8C, slide 91 chart, exact values
from `cocl_segmented.csv`):

| Value | Label | Code |
|---|---|---|
| 64.0% | Government | Q8Cr3 |
| 52.6% | NHS | Q8Cr1 |
| 51.9% | Local council | Q8Cr7 |
| 48.3% | Police | Q8Cr5 |
| 37.0% | Schools | Q8Cr2 |
| 33.6% | Armed forces | Q8Cr6 |
| 28.7% | Banks | Q8Cr4 |

### 4.2 Twist two — protected joy (slides 16, 85)

Sub-headline: Hospitality and fashion are vulnerable. Holidays remain sacrosanct.
Slide 85 framing: "The lipstick effect is real." Split visual: FLEXIBLE SPEND /
RING-FENCED HOLIDAY.

Hero stat: **40%** — are protecting their holiday budget at all costs — the holiday is
reclassified as a wellbeing line item to defend, not a luxury to trim. (Q5r3; exact 39.6)

Non-essentials Britain is protecting (%, Q5, exact values from `cocl_segmented.csv`,
deck order slide 16):

| Value | Label | Code |
|---|---|---|
| 39.6% | Holidays | Q5r3 |
| 39.2% | Family experiences | Q5r7 |
| 33.0% | Streaming / entertainment | Q5r4 |
| 31.8% | Hobbies | Q5r6 |
| 26.7% | Beauty / self-care | Q5r5 |
| 24.2% | Gym / fitness | Q5r1 |
| 21.0% | Pub / socialising | Q5r2 |
| 16.7% | Fashion / clothes | Q5r9 |

### 4.3 Twist three — AI on tap (slides 17, 86)

Sub-headline: Expertise is now a prompt away.
Slide 86 framing: "Expertise once gatekept by professionals is now a prompt away."
Split visual: HUMAN PROFESSIONAL / AI. Substituted across: finance, health, legal advice.

| Value | Label | Source | Code |
|---|---|---|---|
| 58% | have used AI instead of a human professional for at least one task | Slide 17 | Q11 any of r1–r7 (exact 58.4) |
| 37% | used AI for high-stakes calls (finance, health, legal) | Slide 17 | Q11r1+r2+r3 any (exact 37.4) |

Tasks done with AI instead of a professional (%, Q11, exact values from
`cocl_crosstab.json` + `cocl_segmented.csv`, deck order slide 17):

| Value | Label | Code |
|---|---|---|
| 24.7% | Health information | Q11r2 |
| 21.2% | Education / learning | Q11r5 |
| 20.8% | Creative work | Q11r6 |
| 19.7% | Financial advice | Q11r1 |
| 18.8% | Technical troubleshooting | Q11r4 |
| 15.2% | Career support | Q11r7 |
| 9.4% | Legal / admin | Q11r3 |

Quote (slide 17, verbatim):
> "I've used ChatGPT to look at pensions and tax rules and tax savings and tax codes and
> self-assessment tax regulations and investment opportunities and some things for my son
> when he was buying a house and by and large, it was pretty good"
> — qualitative video diaries (AI Video 01.26–01.46)

---

## Chapter 05 — segments

**Headline:** Britain in four *segments*
**Standfirst (170 chars):** This time we dug deeper — beyond how people feel, into what they are doing about it. A new dimension of agency to act splits the nation into four very different camps.

Set-up copy (slides 19, 100): "This time, we wanted to dig deeper. Beyond how they're
feeling, into what they're doing about it."
Axis insight (slides 20, 101): "A new dimension of 'agency to act' correlated most
strongly with people's outlook."

The 2x2 (slides 20, 101): x-axis pessimistic ↔ optimistic, y-axis passive ↔ proactive.

| Segment | Size | Quadrant | Trio |
|---|---|---|---|
| The Architects | 17% | Optimistic x proactive | Organised. Positive. In control. |
| The Hustlers | 28% | Pessimistic x proactive | Self-sufficient. Savvy. Sceptical. |
| The Coasters | 27% | Optimistic x passive | Easygoing. Careful. Open-minded. |
| The Retreaters | 28% | Pessimistic x passive | Overwhelmed. Stretched. Support-seeking. |

Mandatory footnote (slides 21–24): `Segments: VCCP COCL segmentation. Quotes:
qualitative 'Taking control' research. (Segment-level figures are not in the COCL
survey file.)`

Hinge copy (slide 25 notes, verbatim option — the survival mode → active agency pivot):
> The old model viewed the consumer as a passive, bruised victim — retracting, freezing,
> and waiting to be saved. The true data forces a far more optimistic and inspiring
> perspective: the British consumer has pivoted to an Active Agency Model. They are
> highly resourceful, fiercely independent, and stepping up to fix systems themselves.
Contrast pair (slide 25): Survival mode vs Active agency.

### The Architects — 17% (slides 21, 87, 102)

- Trio: Organised. Positive. In control.
- Quote: "I've always been super organised. I like being in control. I hate having my time wasted." — 'Taking control' qualitative research
- Extended quote (slide 87): "I've always been super organised. I like being in control. I'm very time conscious. I hate having my time wasted."
- Video snippet (slide 87, Taking control video 0.26–0.53): "I probably do feel that I'm more self-reliant now than I have been in the past on experts and other people. I do use ChatGPT all the time and find it really quite helpful when I do have problems."
- Who: 55+ skew, male — 42% are 55+
- Money: Comfortable — 46% earn £60k+ HH
- Essentials: Holidays & eating out
- Interests (slide 87): Property, foreign affairs, finance, gaming and business, sports, education & careers, music
- Channels (slide 87): Podcasts, streaming, magazines, broadsheets, social media

### The Hustlers — 28% (slides 22, 88)

- Trio: Self-sufficient. Savvy. Sceptical.
- Quote: "My trust has worsened over time — but with AI I feel empowered to take control and help myself." — 'Taking control' qualitative research
- Extended quote (slide 88): "My trust has changed. It's worsened over time, but with AI I feel empowered to take control and help myself."
- Video snippet (slide 88, Taking control video 1.24–1.49): "I would say that it is more of an empowering feeling being able to do things yourself, to fix things yourself, to seek out answers yourself. It's more interesting as well... Everything's just your phone, in your hand, ask Alexa... so it's definitely more instant."
- Who: 25–54 core — 62% are 25–54
- Money: Middle-income families
- Essentials: Holidays & eating out
- Interests (slide 88): Nature, environment, business, video games, politics
- Channels (slide 88): Podcasts, streaming, social media, creator partnerships, ChatGPT

### The Coasters — 27% (slides 23, 89)

- Trio: Easygoing. Careful. Open-minded.
- Quote: "Life has improved with technology. It saves time — but it really can be overwhelming sometimes." — 'Taking control' qualitative research
- Extended quote (slide 89): "Life has improved with technology. It streamlines and saves time, but it really can be overwhelming sometimes."
- Video snippet (slide 89, Taking control video 3.59–4.17): "I'm still kind of old school. But hopefully, um, somehow maybe someone can show me. You know, I ask the kids sometimes to help me, but they're not always here. So, that's kind of a bit difficult to keep up with everything being digital."
- Who: 55+ skew — 50% are 55+
- Money: Mid-to-low income
- Cutting back: Clothing, subscriptions, groceries
- Interests (slide 89): Food & drink, home & garden, health & wellbeing
- Channels (slide 89): Linear TV, mail, in-store, supermarket magazines. Lower digital comfort and digital trust.

### The Retreaters — 28% (slides 24, 90)

- Trio: Overwhelmed. Stretched. Support-seeking.
- Quote: "I've lost faith in the council and institutions. People are left to do more for themselves." — 'Taking control' qualitative research
- Extended quote (slide 90): "I have lost faith in the council and institutions. People are left to do more for themselves rather than relying on official support"
- Video snippet (slide 90): "If I could get some sort of app that would kind of help me or prompt me to do certain things that I should do because even if it's sort of like twenty minutes, fifteen minutes aside, sometimes it becomes, I know it sounds silly, but really overwhelming. So, oh my God, I've got to sit down, I've got to do this, I've got to read through something and respond to it... [AI/Google] I use it for literally every aspect of my life... it's just something that I can't really see myself without."
- Who: 45+ skew, female — 59% are 45+
- Money: Stretched finances
- Trading down: Groceries, broadband, mobile
- Interests (slide 90): Local news, sport, cinema & film, books, nature
- Channels (slide 90): Daytime TV, supermarket value circulars, savings and budgeting content, Facebook and WhatsApp groups

---

## Chapter 06 — empowerment

**Headline:** The empowerment *architecture*
**Standfirst (180 chars):** One need unifies all four segments: personal empowerment and control. Money is the obvious ask — but saving people time and stress holds far more premium value than brands realise.

The three pillars (slides 26, 103): **Save me MONEY · Save me TIME · Save me STRESS**

Framing copy (slide 26 notes, verbatim option):
> To win across the entire nation, brands must build an overarching strategy on what
> universally unifies all four segments: the absolute need for personal empowerment and
> control. While saving consumers money is an obvious priority, saving them time and
> reducing their stress holds far more premium value than you realise.

Supporting quant — what people want brands to help with (Q14 brand asks, top picks,
exact values from `cocl_crosstab.json`; deck does not chart these, optional support):

| Value | Label | Code |
|---|---|---|
| 38.8% | Stretch my money further | Q14 |
| 28.3% | Reward my loyalty | Q14 |
| 27.7% | Reduce stress | Q14 |
| 26.1% | Be transparent and honest | Q14 |
| 24.0% | Save me time | Q14 |

---

## Chapter 07 — moves

**Headline:** Five signature *moves*
**Standfirst (152 chars):** The playbook for the age of independence: five shifts in how brands behave, each moving from the old model of dependence to the new model of agency.

Move titles (slides 74, 105): 01 Unplug them from the grid · 02 Be a trusted alternative
· 03 Help people help themselves · 04 Kill the mental load · 05 Boost good behaviours.

### Move 01 — unplug them from the grid (slides 29–38)

Lesson (slide 34): "Find practical, everyday ways to help your customers lower their
living costs and rely less on broken systems."

Stat (slide 31): **34%** of people are actively using tools to fix their practical home
and financial problems themselves. (Data anchor: Q9 "Budgeting/comparison tools" 34.0%
in `cocl_crosstab.json`.)

Build-up beats (slides 35–37): At the mercy of inflation… / At the mercy of the energy
crisis… / At the mercy of government policy…

Quote (slide 33, verbatim):
> "I now have a lot less trust in institutions such as the government and politicians,
> local councils, than I did a few years ago... there's just scandal after scandal. You
> know, they're in it for themselves. They do things and make deals to keep themselves
> and their mates in jobs, rather than what, you know, is good for the country or, you
> know, for their electorate… Big brands are the same - I don't want to give too much
> money to one brand"
> — Southampton, 63, Architects

Less → more shifts (slide 38):

| Less | More |
|---|---|
| Escalating charges | Hacking the system |
| Prison | Hotel |
| Reinforcing unfair | Fighting for change |

### Move 02 — be a trusted alternative (slides 39–49)

Lesson (slide 44): "Earn people's trust by being the honest, transparent alternative
when they feel let down by everyone else."

Context (slide 40): customer confidence in government / transport / politics — a
general distrust culture in institutions (links back to chapter 04 trust data, Q7/Q8C).

Quote (slide 41, verbatim):
> "I do know that calling the police would probably be a complete waste of time. However
> I do have faith in the sense that maybe if I did my own investigations, I would have to
> knock on my neighbours' doors and ask if they've got Ring camera footage. So I'd
> probably do half their job for them before actually calling them"
> — London, 42, Retreater

Brand examples (slide 45): **Nationwide, M&S, Boots.**

Less → more shifts (slide 49):

| Less | More |
|---|---|
| Treating pain | Diagnosing the problem |
| Lipstick on a pig | Backing it up |
| Opaque | Transparent |

### Move 03 — help people help themselves (slides 50–59)

Lesson (slide 53): "Ride the social self-help wave."
Key copy (slide 54): "In our excitement about LLMs, too many brands have under-leveraged
social search as a self-help environment."
Key copy (slide 55): "The nation's self-help manuals live on platforms where context is
king."
Key copy (slide 58): "A brand confidently existing in the self-help heartlands. Not
targeting people, targeting the 'self help' behaviour through contexts and content."

Quotes (slide 52, verbatim):
> "I do use ChatGPT all the time and find it really quite helpful when I do have
> problems... I do feel more empowered now with everything at my fingertips and I feel as
> if I've got more free time because of that."
> — Wales, 68, Architects

> "I would say that it is more of an empowering feeling being able to do things yourself,
> to fix things yourself, to seek out answers yourself."
> — Bury, 39, Hustler

> "Whether it's like, like I say, fixing things with YouTube videos or going on sort of
> Money Saving Expert looking for the best deals, um, shopping around, going on Instagram
> for like hacks."
> — Bury, 39, Hustler

Media from → to (slide 56, "The technology and smarts to move from audiences to contexts"):

| From | To |
|---|---|
| Demographics & locations | Context long lists |
| Look-a-likes | Creative as targeting |
| Off-the-shelf audiences | Mimicking content behaviours |
| Chasing segments | Man marking behaviours |

Less → more shifts (slide 59, "Making the right media moves in the self-help space"):

| Less | More |
|---|---|
| Dependency | Independency |
| Dictation from the brand | Walk throughs on YT & TikTok |
| Broadcast to audiences | Self-help contexts |

### Move 04 — kill the mental load (slides 60–67)

Theme (slide 61): the modern challenge of cognitive overload.
Beats (slides 64–66): Death to 'I'm too busy' · Death to 'It's confusing' · Death to
'I'm stressed'.

Stats:

| Value | Label | Source | Code |
|---|---|---|---|
| 71 yrs / 62 yrs vs 2 months | It took 71 years for the telephone and 62 years for electricity to reach 50 million users. ChatGPT reached 100 million users in just two months. | Slide 61 | external (deck) |
| 90% | of the world's total data was generated in the last two years alone (est., as of 2026) | Slide 61 | external (deck) |
| 87% / 58% / 31% / 12% | sandwich generation: 87% have children they support financially, 58% support their partners, 31% support their parents financially, 12% support younger extended family members | Slide 62 | Source: Wealth manager Killik & Co poll, 2025 |

Quotes (slides 61, 63, verbatim):
> "If I could get some sort of app that would kind of help me or prompt me to do certain
> things that I should do because even if it's sort of like twenty minutes, fifteen
> minutes aside, sometimes it becomes, I know it sounds silly, but really overwhelming."
> — London, 42, Retreater

> "The brand I find most aspirational isn't a fashion house, it's Cook or Mindful Chef.
> Time is the rarest thing I have. Paying someone to solve dinner is the ultimate luxury"
> — qualitative research ("The new premium", slide 63)

Brand names mentioned: Cook, Mindful Chef (in the quote above).

Less → more shifts (slide 67):

| Less | More |
|---|---|
| Status as currency | Time as currency |
| Fragmentation | Ecosystems |
| Customer support | Life advisory |

### Move 05 — boost good behaviours (slides 68–73)

Lesson (slide 71): "Encourage behaviors and habits that will lead to a better state of
living for your customers through set challenges, earned rewards and positive
reinforcement."

Quotes (slide 70, verbatim):
> "I particularly like all the apps, the shopping apps and anything new that comes into
> the shops, the loyalty apps. And, if we do want to purchase anything, it's very easy to
> go in and just cost the price all across everywhere."
> — Bristol, 61, Coaster

> "I don't go out specifically to look for certain brand items. I go by, comfort and
> price."
> — Hertfordshire, 63, Coaster

> "I like to think that I trust a brand when they've shown me good service... If a brand
> is looking after its customer, I feel that they're giving you what you want, you can
> communicate with them easily and they can resolve problems."
> — qualitative research (unattributed in deck)

Brand example (slide 72): **Vinted.**

Less → more shifts (slide 73):

| Less | More |
|---|---|
| Setting tasks | Gamifying goals |
| CRM modules | Habit forming |
| Random rewards | Meaningful rewards |

---

## Chapter 08 — playground

**Headline:** Explore the *data* yourself
**Standfirst (168 chars):** Every chart on this site renders from the verified survey file. Pick a segment, pick a question, and see how the four Britains diverge — no number typed in by hand.

This is the interactive data explorer (deck anchors: slide 76 "possible demo of
interface", slide 77 "Making the most of the data" — dashboard access + custom reports).
Teal #80E8E3 surface (research/appendix), per brand system.

Spec:
- Render exclusively from `data-src/cocl_crosstab.json` (pre-computed verified
  aggregates — "No number is typed into the HTML by hand", per DATA_DICTIONARY.md).
- Sections available (10): Financial position (Q1) · Mindset Q2 (net agree) · Essentials
  (Q4 % essential) · Expendable (Q4 % first to cut) · Traded down 12mo (Q6B) ·
  Personal-control behaviours (Q9) · Self-management (Q8B) · AI use by task (Q11) ·
  Brand asks (Q14) · Forward mindset (Q18).
- Each row exposes `total_pct` plus per-segment `pct`, `index`, `base`. Index reading:
  ≥120 over-indexes, ≤80 under-indexes (DATA_DICTIONARY.md).
- Relabel crosstab segments to deck names: Adapters→Architects, Strivers→Hustlers,
  Coasters→Coasters, Retreaters→Retreaters. Display deck sizes 17/28/27/28 in any
  segment chips; survey bases (357/345/215/587) only as small-print n=.
- Apply the Q2 label fix (see data notes at top).
- Bar charts only, tabular numbers, no pie/donut.
- Footnote: standard source line + "Headline survey %: ±2.5% at 95%. Segment-level:
  ±4–6% by segment size." (DATA_DICTIONARY.md)
- Slide 77 CTA copy: "Making the most of the data — 24 hours access to dashboard ·
  custom report benefits · contact" (final benefits copy TBC in deck; do not invent).

---

## Chapter 09 — outro

**Headline:** Hand them the *tools*
**Standfirst (143 chars):** Stop trying to lead the consumer. Your job is to equip them to lead themselves. Five moves, one architecture, a nation ready to act.

Hero quote (slide 75, verbatim):
> "They do not want brands to hold their hands. They want brands to hand them the tools."
> — Martin Lewis, BBC Sounds, February 2026

Supporting motif (slide 75): `Institutions >>>> Individuals`

Closing copy (slide 75 notes, verbatim option):
> To win across the entire nation, brands must build an overarching strategy on what
> universally unifies all four segments: the absolute need for personal empowerment and
> control. While saving consumers money is an obvious priority, the hidden truth of this
> data is that saving them time and reducing their stress holds far more premium value
> than you realize. Stop trying to lead the consumer. Your job is to equip them to lead
> themselves.

Five-move recap list (slides 74, 105): 01 Unplug them from the grid · 02 Be the trusted
alternative · 03 Help people help themselves · 04 Kill the mental load · 05 Boost good
behaviours. (Note: slide 44/106 use "Be a trusted alternative"; recap slides 74/105 use
"Be the trusted alternative" — use "Be a trusted alternative" for the move chapter, the
recap may use either, stay consistent within a surface.)

Credits (slide 92): Michael Lee, Chief Strategy Officer · Stefan Siedentopf, Deputy CSO
· Jenny Nichols, Deputy CSO · Will Parrish, Chief Strategy Officer, VCCP Media.
Plus (slide 5): Ellie Gauci, Head of Strategy, CRM, Loyalty & Data.

Sign-off: The Challenger Series · VCCP · © VCCP Media 2026.
Brand asset: `assets/brand/Girl_and_Bear.png` or `assets/brand/Logo.png` (black, never
on mustard).
