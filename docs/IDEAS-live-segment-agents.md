# IDEAS — Live Segment Agents ("The MoltBook")

> **Status:** Ideation only. This is a concept + costed-architecture brainstorm for the client to react to. Nothing here is built. Cost figures are grounded in real Claude API economics (see assumptions) but are illustrative, not a quote.

---

## 1. The concept (in brief)

The four *State of Independence* segments — **Architects, Hustlers, Coasters, Retreaters** — become four lightweight AI personas that "live" on the site as an ongoing feed. They periodically react to the study's own stats, to a brand or news prompt, and crucially **to each other** — an Architect's confident take provoking a Hustler's sceptical reply, a Retreater's overwhelmed aside, a Coaster shrugging it off. The visitor lands on a living **MoltBook** (a logbook/timeline) that has clearly grown since their last visit, turning a static research deck into a *standing data character study* that demonstrates the segmentation is real enough to argue with itself. For a research/strategy showcase this is the money shot: it proves the segments are distinct, memorable and *briefable* — not five percentages, but four people you can put in a room.

---

## 2. Three architecture options (cost ↔ liveness spectrum)

The honest tension: a static site has no always-on backend, and "feels alive" usually means "costs money continuously." The trick is to **decouple generation from serving**. Generation can be batched, cheap and occasional; serving is always free static files. The three options below differ only in *how often new content is generated* and *who triggers it*.

> **Claude pricing context (cached 2026-04-15, verify before quoting):** Haiku 4.5 ≈ $1 / $5 per 1M input/output tokens; Sonnet 4.6 ≈ $3 / $15; Opus far higher. **Prompt caching** can cut the cost of a large, stable shared context (segment definitions + survey data) by ~90% on cache hits. The **Batch API** runs asynchronously at **50% off**. A single segment "post" is tiny — a few hundred output tokens. The expensive part is the *shared context* (segments.json + survey.json ≈ a few thousand tokens), which is why caching and batching dominate the cost story.

---

### Option A — Pre-generated bank, replayed client-side ("zero ongoing cost")

**How it works.** Generate a large bank of exchanges *once* (say 300–500 short posts/threads) as a one-off offline job, commit the resulting `data/moltbook.json` to the repo, and have the static site **replay** it on a clock — e.g. reveal N items per day based on the visitor's local date, or drip them in over a session. Nothing calls an API at runtime. Periodically (monthly, or when there's news) you re-run the generator locally and commit a fresh batch.

**How live it feels.** Pseudo-live. The feed genuinely changes day to day and looks like it's accumulating, but it's a pre-baked script on a timer. A returning visitor sees new entries; a power user who inspects the clock could spot the loop. Good enough for 90% of showcase visits.

**Cost model.** *Effectively £0 ongoing.* Cost is one batch generation run, occasionally repeated. 400 posts × ~few-hundred output tokens, on **Haiku via the Batch API with a cached shared context**, is cents-to-low-pounds per regeneration. Hosting is unchanged (static). No keys exposed, no runtime spend, no rate-limit risk.

**Pros:** cheapest possible; no secrets on the client; can't break or run up a bill; fully reviewable before it ships (every line is in the repo). **Cons:** not *truly* live; content is finite and loops eventually; "reacting to today's news" requires a human to trigger a regen.

---

### Option B — Scheduled cheap batch job appends to the feed ("genuinely live, still tiny cost")

**How it works.** A scheduled job (GitHub Action / cron, e.g. once or twice daily) calls Claude with the cached segment+survey context, generates a fresh thread (one stat or prompt, four segment reactions + a couple of cross-replies), validates it, **appends** to `data/moltbook.json`, and commits/pushes. The static site just reads the growing JSON. Optionally the daily prompt is seeded from a real headline so the feed reacts to the actual news cycle.

**How live it feels.** Genuinely live and ongoing — the feed provably grows on a real schedule, dated, and can reference current events. This is the version that survives scrutiny ("it posted about *today's* inflation print").

**Cost model.** Still very low because frequency is bounded and each run is small. ~1–2 runs/day × one thread each, on **Haiku + Batch API + prompt-cached context** ≈ pennies/day, i.e. low single-digit £/month order of magnitude. Cost is *capped by the schedule*, not by traffic — 10 visitors or 10,000 visitors cost the same, because generation is offline and serving is static. Minimise further with: cache the big context block; keep outputs short; batch the four reactions in one request; Haiku-tier (Sonnet only if voice quality demands it).

**Pros:** truly alive, news-aware, cost capped and predictable, scales to any traffic for free. Keys live in CI secrets, never the client. **Cons:** needs a scheduled runner and a commit-back mechanism; a bad generation could publish unreviewed (mitigate with a validation gate / a "staging branch + manual promote" step); slightly more moving parts.

---

### Option C — On-demand / interactive generation ("live but pay-per-interaction")

**How it works.** A thin serverless endpoint (e.g. Vercel function) lets the *visitor* poke the segments — "ask the four of them about X" or "what would a Hustler say about this stat?" — generating a reaction in real time. Could be layered on top of A or B as an optional "provoke the panel" button.

**How live it feels.** Maximally live and personal — the visitor co-creates. But it's also the only option whose cost scales with traffic, and the only one that needs runtime key management, rate limiting and abuse guardrails.

**Cost model.** Pay-per-interaction. Each generation is cheap on Haiku, but cost is now *unbounded by traffic* and exposed to abuse (a scraper could rack up calls). Needs rate limiting, a hard daily spend cap, caching of identical prompts, and prompt-injection guardrails. Realistically a *nice-to-have add-on behind a button*, not the default feed.

**Pros:** highest wow in a live demo / pitch; personal and memorable. **Cons:** only traffic-scaled cost; needs backend, rate limiting, abuse + injection defences; can be gamed into off-brand or off-stat output. Highest risk for an unattended public showcase.

---

## 3. Recommendation

**Ship Option A now; design the data format so Option B is a drop-in upgrade; hold Option C as a guarded "provoke the panel" demo button for pitches.**

Reasoning:
- The cheapest *credible* path to something that feels alive is **A**: a committed, replayed interaction bank, regenerated occasionally (monthly + on big news). It is genuinely zero ongoing cost, fully reviewable, can't run up a bill or leak a key, and a returning visitor still sees a feed that has grown. For a showcase this clears the bar.
- The single most important design decision is that **A and B share the exact same `moltbook.json` schema and the same generation prompt.** That means "make it actually live" is later a question of *adding a cron job that appends*, not a rebuild. Start static, earn the cron.
- **B is the recommended target state** once the client has seen A and wants the news-reactive, provably-growing version — its cost is still trivial and capped by schedule, not traffic.
- **C** is genuinely impressive in a room but is the only option that turns traffic into spend and opens injection/abuse surface; keep it as an optional, rate-limited, spend-capped flourish — never the always-on default.

**Cost story in one line:** generation is occasional, batched, Haiku-tier and prompt-cached (cents per refresh); serving is static and free; so the feed can feel alive indefinitely for essentially nothing, and only Option C's optional button ever scales cost with traffic.

---

## 4. Persona-design notes (believable, on-brand, defensible)

The segments must sound like *themselves* and *disagree in character*, while staying safe for a client showcase. The voices are already implied by the data — encode them as a system prompt the generator reuses (and prompt-cache it).

**Voice per segment (grounded in the data):**

| Segment | Voice | Argues from | Tic / tell |
|---|---|---|---|
| **Architects** (17%, optimistic+proactive) | Calm, confident, slightly smug. "In control" indexes 214. | Self-reliance, good judgement, trusting their own sources (Martin Lewis over authority). | Quietly assumes everyone *could* be this organised if they tried. |
| **Hustlers** (28%, pessimistic+proactive) | Sharp, sceptical, energised. AI vanguard; distrusts institutions. | "I'll sort it myself" — empowerment via tools, not trust. | Snipes at anyone waiting for an institution to help. |
| **Coasters** (27%, optimistic+passive) | Easygoing, open, a bit out of the loop. "Old school", asks the kids for help. | Tech where it's easy; wants brands to *do it for them*; doesn't trust/understand AI. | Cheerful deflection; "it'll probably be fine." |
| **Retreaters** (28%, pessimistic+passive) | Stretched, candid, support-seeking. Exhausted indexes 159, lost faith in institutions. | Necessity, not choice; relies on tech to reduce life-admin burden. | Names the cost; wants someone to make it simpler. |

**What they'd argue about (built-in tension from the 2×2):**
- **Agency:** Architects/Hustlers ("just do it yourself") vs Coasters/Retreaters ("not everyone can — do it *for* me").
- **Outlook:** Architects/Coasters (optimistic) vs Hustlers/Retreaters (pessimistic) on whether the next decade is upside or threat.
- **AI:** Hustlers evangelise, Architects use pragmatically, Coasters distrust/don't get it, Retreaters lean on it out of necessity — a four-way row that mirrors the real `aiUseByTask` and `aiAttitude` data.
- **Institutions:** the Q7/Q8C trust collapse (Gov 24% confident, 64% say it's declined) lands very differently across the four.

**Guardrails (so it stays defensible):**
1. **No fabricated stats — ever.** Personas may *react to* numbers but may only cite figures present in `segments.json` / `survey.json`. Generation tool/schema should pass stats in as allowed facts and forbid inventing any; a validator strips or rejects any number not in an allow-list.
2. **Stay in character, stay civil.** Sceptical/stretched, never abusive, political-party-neutral, no naming real living individuals beyond the already-cited "Martin Lewis"-type reference framing. No medical/financial *advice*, only attitude.
3. **Source-anchored.** Each thread is seeded by a real data point (with its survey provenance) so every exchange traces back to the study.
4. **Reviewable before public.** Option A is fully reviewed in-repo; Option B publishes via a validation gate (and ideally a staging branch a human promotes) so nothing off-brand goes live unattended.
5. **Clearly labelled as AI personas** representing segments — not real respondents — to keep it ethically clean for a research client.

---

## 5. "MoltBook" UX sketch (in words)

**Where it sits.** A new living section between **05 — Segments** (where the four are introduced) and **06 — Empowerment** — call it **"The MoltBook: the segments, still talking."** It pays off the personas the visitor just met by showing them alive and in conflict. A small "latest from the MoltBook" ticker could also live on the cover (01) and outro (09) to signal the site is *current*.

**What it looks like.** A reverse-chronological logbook/timeline. Each entry = a **stat card** (the seed, with its survey citation) followed by a short threaded exchange, each post badged with the segment's name, colour and three-word descriptor. A dateline ("14 Jun") and a quiet "X new since your last visit" make the growth legible. Calm, on-brand, readable — not a chaotic social feed.

**Example exchanges (reacting to real data points from the study):**

> **SEED — Trust:** *Only 24% are confident the Government will reliably support them; 64% say its performance has declined over the past decade.* (COCL Q7/Q8C, n=1,504)
>
> **🟧 Hustler:** Twenty-four percent. And we're surprised? Stopped waiting for them years ago — phone in my hand does more than any department ever has.
> **🟦 Architect:** Agreed it's low, but I'd not throw the whole thing out. Know which bits work, use those, route around the rest. It's manageable if you stay on top of it.
> **🟪 Retreater:** "Manageable." Must be nice. I lost faith in the council too — difference is I haven't got the energy to route around anything. I just need it to *work*.
> **🟩 Coaster:** Bit gloomy, all this? It mostly sorts itself out in the end. I leave that stuff to people who understand it.

> **SEED — AI:** *58% have used AI instead of a human professional for at least one task; 37% for something high-stakes (money, health, legal).* (COCL Q11)
>
> **🟧 Hustler:** This is the empowering bit. Fixing things myself, finding answers myself — instant, in my hand. Vanguard, and proud of it.
> **🟪 Retreater:** Same number, different reason. I use it for *literally every aspect of my life* — not because I'm a pioneer, because otherwise it's all too much.
> **🟦 Architect:** I use it daily and find it genuinely helpful — but I check it. Trust your own judgement, treat it as a tool, not an oracle.
> **🟩 Coaster:** I don't really trust it, if I'm honest. I'll ask the kids. They get it more than I do.

> **SEED — Money:** *54% traded down on groceries in the last year; holidays and eating out are the first things to go.* (COCL Q6A/B)
>
> **🟪 Retreater:** Groceries, broadband, the phone — all of it down. There's nothing left to trim that doesn't hurt.
> **🟩 Coaster:** Own-label's honestly fine though, isn't it? Clothes and the odd subscription first for me — you adapt.
> **🟦 Architect:** I protect the holidays and the meals out — those are the point. Cut the noise, keep what you actually enjoy.
> **🟧 Hustler:** Shopped around, switched, sorted. If you're paying full price for anything in 2026 that's a choice, not bad luck.

**Optional (Option C):** a "Provoke the panel" button — type a topic, watch the four react live. Rate-limited, spend-capped, behind the same guardrails. Demo flourish, not the default.

---

## 6. Risks & open questions for the client

**Risks**
- **"Feels fake" if discovered to be looping** (Option A). Mitigate with a big enough bank, news-seeded entries, and an easy upgrade to B.
- **Off-brand or fabricated output** if guardrails slip — most acute in B (unattended) and C (visitor-driven, injection-prone). Mitigate with the stat allow-list, validation gate, staging-branch promote, and never auto-publishing unreviewed for a named-client showcase.
- **Cost creep only really exists in C** (traffic-scaled). A and B are capped by schedule. Hard daily spend cap on any endpoint regardless.
- **Reputational/ethical:** AI "people" speaking for real audience segments must be unmistakably labelled as such.
- **Maintenance:** B needs a CI runner and a key in secrets; someone owns it. A needs someone to remember to regenerate.

**Open questions**
1. How live does it *need* to feel for this showcase — pseudo-live (A) enough, or is news-reactive (B) the headline?
2. Who reviews/approves before public? (Decides A-vs-B and whether a staging gate is required.)
3. Should the feed react to **real-world news**, or stay strictly inside the study's own data? (News = more alive, more guardrail work.)
4. Is the interactive "provoke the panel" (C) wanted for pitches, and are we comfortable with rate-limited public API spend?
5. Model tier: is **Haiku** voice quality good enough for the four personas, or do we spend up to Sonnet for sharper characterisation?
6. Cadence and lifespan: how often does it post, and how long does the MoltBook need to keep running?
