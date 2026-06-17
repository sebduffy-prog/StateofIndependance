/**
 * 06-twist-trust.js — Twist one: the institutional trust paradox.
 *
 * THE STAGE: navy ground, cream-on-navy. Two-column layout:
 *   LEFT  — drag-rank 7 institutions (most-trusted to least)
 *   RIGHT — pre-reveal teaser → post-reveal truth (53%→24% spread + NHS 6.42/10 gauge)
 *
 * On "Reveal the real ranking" the right column transitions from the teaser
 * to the real stats, the spread numbers count up, and the radialGauge animates.
 *
 * Contract: docs/CONTRACT.md.  All CSS is scoped to #\30 6-twist-trust.
 *
 * @param {HTMLElement} rootEl  the <section class="journey-step" id="06-twist-trust">
 * @param {{ survey:object|null, segments:object|null, tgi:object|null,
 *           journey:{ gate():void, ready():void } }} data
 */
import { arrival } from '../lib/experiential.js';
import { dragRank } from '../lib/interactions.js';
import { radialGauge } from '../lib/charts.js';
import { countUp } from '../lib/counter.js';

const NHS_MEAN_SCORE = 6.42; // data/survey.json institutionTrust.headline.nhsMeanScore

/** Deterministic shuffle so the drag-rank never opens already solved. */
const seededShuffle = (arr) => {
  const out = arr.slice();
  let seed = 7;
  for (let i = out.length - 1; i > 0; i -= 1) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export default function init(rootEl, data) {
  // Re-play the arrival beat on every visit (idempotent via arrival()).
  rootEl.addEventListener('chapter:arrive', (e) => arrival(rootEl, e.detail));

  const survey = data && data.survey;
  const ranking = survey
    && survey.institutionTrust
    && survey.institutionTrust.confidenceRanking
    && survey.institutionTrust.confidenceRanking.items;

  // Fail soft — if data is missing we still show the arrival but skip interactions.
  if (!Array.isArray(ranking) || ranking.length === 0) return;

  const rankHost = rootEl.querySelector('[data-rank]');
  const prePanel = rootEl.querySelector('[data-pre-reveal]');
  const truthPanel = rootEl.querySelector('[data-truth]');
  const gaugeHost = rootEl.querySelector('[data-gauge]');
  if (!rankHost || !prePanel || !truthPanel || !gaugeHost) return;

  // True order = descending % confident (NHS 52.8 → Government 23.9).
  const trueItems = ranking.slice().sort((a, b) => b.pctConfident - a.pctConfident);
  const trueOrder = trueItems.map((i) => i.id);
  const items = seededShuffle(trueItems.map((i) => ({ id: i.id, label: i.label })));

  let revealed = false;
  const showReveal = () => {
    if (revealed) return;
    revealed = true;

    // Swap pre-reveal teaser for the truth panel.
    prePanel.hidden = true;
    truthPanel.hidden = false;

    // Next frame so the unhide can pick up the transition.
    requestAnimationFrame(() => {
      truthPanel.classList.add('is-shown');

      // Count up the 53% and 24% spread numbers.
      truthPanel.querySelectorAll('[data-count-to]').forEach((node) => {
        countUp(node, {
          to: Number(node.dataset.to) || 0,
          decimals: 0,
          suffix: node.dataset.countSuffix || '%',
        });
      });

      // Flat semicircle gauge — NHS 6.42/10, cream-on-navy.
      radialGauge(gaugeHost, {
        value: NHS_MEAN_SCORE,
        max: 10,
        onNavy: true,
        label: 'NHS trust · out of 10',
        ariaLabel: 'NHS trust score 6.42 out of 10',
      });

      data.journey.ready();
    });
  };

  // Mount the drag-rank interaction — the marquee beat.
  dragRank(rankHost, {
    items,
    trueOrder,
    instructions:
      'Drag to reorder — or focus a row and use ↑ ↓ arrow keys. Most trusted at the top.',
    onReveal: showReveal,
  });

  // Advisory hint: this stage has one interaction to try.
  data.journey.gate();
}
